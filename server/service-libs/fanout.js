// TODO: make it safe to call methods during callbacks

// don't break if there's no console
if(typeof(console) === "undefined")
{
  console = { log: function() {} };
}

var FO = FO || {};
var Fpp = Fpp || {};

var fo_jsonp_callback_id = 0;
var fo_jsonp_callbacks = {};

function fo_jsonp_get_callback(cb_id)
{
  if(fo_jsonp_callbacks[cb_id])
  {
    return fo_jsonp_callbacks[cb_id];
  }
  else
  {
    console.log("no callback with id " + cb_id);
    return function(result) {};
  }
}

// FO.Request has onFinished(int code, object result) and onError(int reason) callback members
// error reasons: 0=http, 1=timeout
// note: failed json parse on http body results in empty object {}, not error

FO.Request = function()
{
  if(!(this instanceof FO.Request))
    throw new Error("Constructor called as a function");
}

FO.Request.prototype.start = function(method, url, headers, body)
{
  this._cors = false;
  if("withCredentials" in new XMLHttpRequest())
    this._cors = true;

  var self = this;
  this._timer = setTimeout(function() { self._timeout(); }, 60000);

  if(this._cors)
  {
    this._xhr = new XMLHttpRequest();

    this._xhr.onreadystatechange = function() { self._xhr_readystatechange(); };
    this._xhr.open(method, url, true);

    for(var key in headers)
    {
      if(!headers.hasOwnProperty(key))
        continue;

      this._xhr.setRequestHeader(key, headers[key]);
    }

    this._xhr.send(body);
  }
  else
  {
    var head = document.getElementsByTagName("head")[0];
    var script = document.createElement("script");

    script.type = "text/javascript";

    this._cb_id = fo_jsonp_callback_id.toString();
    ++fo_jsonp_callback_id;

    this._script_id = "fo-jsonp-script-" + this._cb_id;
    script.id = this._script_id;

    fo_jsonp_callbacks[this._cb_id] = function(result) { self._jsonp_callback(result); };

    var param_list = new Array();

    param_list.push("callback=" + encodeURIComponent("fo_jsonp_get_callback(\"" + this._cb_id + "\")"));
    if(method != "GET")
      param_list.push("_method=" + encodeURIComponent(method));
    if(headers)
      param_list.push("_headers=" + encodeURIComponent(JSON.stringify(headers)));
    if(body)
      param_list.push("_body=" + encodeURIComponent(body));

    var params = param_list.join("&");

    var src;
    if(url.indexOf("?") != -1)
      src = url + "&" + params;
    else
      src = url + "?" + params;

    script.src = src;
    console.log("FO.Request json-p " + this._cb_id + " " + src);
    head.appendChild(script);
  }
}

FO.Request.prototype.abort = function()
{
  clearTimeout(this._timer);
  this._timer = null;

  this._cancelreq();
}

FO.Request.prototype._cancelreq = function()
{
  if(this._cors)
  {
    this._xhr.onreadystatechange = function() {}
    this._xhr.abort();
    this._xhr = null;
  }
  else
  {
    console.log("FO.Request json-p " + this._cb_id + " timeout");

    delete fo_jsonp_callbacks[this._cb_id];
    var script = document.getElementById(this._script_id);
    script.parentNode.removeChild(script);
    this._cb_id = null;
    this._script_id = null;
  }
}

FO.Request.prototype._xhr_readystatechange = function()
{
  if(this._xhr.readyState === 4)
  {
    clearTimeout(this._timer);
    this._timer = null;

    var status = this._xhr.status;
    var responseText = this._xhr.responseText;
    this._xhr = null;

    if(status)
    {
      var result;

      try
      {
        result = JSON.parse(responseText);
      }
      catch(e)
      {
        result = {}
      }

      this._finished(status, result);
    }
    else
      this._error(0);
  }
}

FO.Request.prototype._jsonp_callback = function(result)
{
  console.log("FO.Request json-p " + this._cb_id + " finished");

  clearTimeout(this._timer);
  this._timer = null;

  delete fo_jsonp_callbacks[this._cb_id];
  var script = document.getElementById(this._script_id);
  script.parentNode.removeChild(script);
  this._cb_id = null;
  this._script_id = null;

  var bresult;

  try
  {
    bresult = JSON.parse(result.body);
  }
  catch(e)
  {
    bresult = {}
  }

  this._finished(result.code, bresult);
}

FO.Request.prototype._timeout = function()
{
  this._timer = null;
  this._cancelreq();
  this._error(1);
}

FO.Request.prototype._finished = function(code, result)
{
  if(this.onFinished)
    this.onFinished(code, result);
}

FO.Request.prototype._error = function(reason)
{
  if(this.onError)
    this.onError(reason);
}

Fpp.Client = function(baseUrl, config)
{
  if(!(this instanceof Fpp.Client))
    throw new Error("Constructor called as a function");

  if(baseUrl != undefined) {
    if(baseUrl.indexOf("//") == -1) {
      this._baseUrl = null;
      this._domain = baseUrl; // assume it's a domain
    } else {
      this._baseUrl = baseUrl;
      this._domain = null;
    }
  } else {
    this._baseUrl = null;
    this._domain = document.domain;
  }

  if(config != undefined)
  {
    this._use_ssl = config["use_ssl"];
    this._fo_domain = config["domain"];
  }

  this._auth_token = null;
  this._sid = null;
  this._subs = new Object();
  this._req = null;
  this._timer = null;
  this._retries = 0;
  this._retry_time = 0;
  this._need_resub = false;
  this._cb_new_session = null;
}

Fpp.Client.prototype.setAuthToken = function(token)
{
  this._auth_token = token;
}

Fpp.Client.prototype.Channel = function(channel)
{
  if(!this._subs[channel])
  {
    this._subs[channel] = { subscribed: false, last_cursor: null };
    this._resub_queued();
  }

  var connection = this;

  var c = {};
  c.on = function(event, callback)
  {
    connection._channel_on(channel, event, callback);
  }
  c.cancel = function()
  {
    connection._channel_cancel(channel);
  }

  return c;
}

Fpp.Client.prototype._channel_on = function(channel, event, callback)
{
  var sub = this._subs[channel];
  if(!sub)
    return;

  if(event == "state-changed")
    sub.cb_state = callback
  else if(event == "data")
    sub.cb_data = callback
}

Fpp.Client.prototype._channel_cancel = function(channel)
{
  delete this._subs[channel];
  this._resub_queued();
}

Fpp.Client.prototype.on = function(event, callback)
{
  if(event == "new-session")
    this._cb_new_session = callback;
}

Fpp.Client.prototype.reconnect = function()
{
  this._resub();
}

// gets state and leaves the connection active
Fpp.Client.prototype.getState = function()
{
  var state = { sid: this._sid };

  if(this._auth_token)
    state["auth_token"] = this._auth_token;

  var channels = {};
  for(var key in this._subs)
  {
    if(!this._subs.hasOwnProperty(key))
      continue;

    var s = this._subs[key];

    channels[key] = { subscribed: s.subscribed, last_cursor: s.last_cursor };
  }
  state["channels"] = channels;

  return state;
}

// gets state and ends the connection
Fpp.Client.prototype.takeState = function()
{
  this._cancel();

  return this.getState();
}

Fpp.Client.prototype.setState = function(state)
{
  this._cancel();

  // completely reset state
  this._auth_token = null;
  this._sid = null;
  this._subs = new Object();
  this._req = null;
  this._timer = null;
  this._retries = 0;
  this._retry_time = 0;
  this._need_resub = false;

  if(state["sid"])
    this._sid = state["sid"];

  if(state["auth_token"])
    this._auth_token = state["auth_token"];

  if(state["channels"])
  {
    channels = state["channels"];
    for(var key in channels)
    {
      if(!channels.hasOwnProperty(key))
        continue;

      channel = channels[key];

      var s = new Object();
      this._subs[key] = s;

      if(channel["subscribed"])
        s.subscribed = channel["subscribed"];
      else
        s.subscribed = false;

      if(channel["last_cursor"])
        s.last_cursor = channel["last_cursor"];
      else
        s.last_cursor = null;
    }
  }

  if(this._sid)
    this._get_updates();
  else
    this._resub();
}

Fpp.Client.prototype.setSessionId = function(sid)
{
  this._sid = sid;
}

Fpp.Client.prototype._subsCount = function()
{
  var count = 0;
  for(var key in this._subs)
  {
    if(this._subs.hasOwnProperty(key))
      ++count;
  }
  return count;
}

// cancel any active requests/timers
Fpp.Client.prototype._cancel = function()
{
  // cancel pending request
  if(this._req)
  {
    this._req.abort();
    this._req = null;
  }

  // cancel pending timer
  if(this._timer)
  {
    clearTimeout(this._timer);
    this._timer = null;
  }

  this._need_resub = false;
}

Fpp.Client.prototype._resub_queued = function()
{
  if(!this._need_resub)
  {
    var self = this;
    this._cancel();
    this._timer = setTimeout(function() { self._resub() }, 0);
    this._need_resub = true;
  }
}

Fpp.Client.prototype._resub = function()
{
  this._cancel();

  // if there are no subscriptions, then simply do nothing
  if(this._subsCount() === 0)
    return;

  var param_list = new Array();

  if(this._auth_token)
    param_list.push("auth_token=" + encodeURIComponent(this._auth_token));

  if(this._sid)
    param_list.push("sid=" + encodeURIComponent(this._sid));

  for(var key in this._subs)
  {
    if(!this._subs.hasOwnProperty(key))
      continue;

    var ci = "name=" + encodeURIComponent(key);
    param_list.push("ci=" + encodeURIComponent(ci));
  }

  var params = param_list.join("&");

  var self = this;

  var req = new FO.Request();
  this._req = req;
  this._req.onFinished = function(code, result)
  {
    if(self._req != req)
      return;

    self._req = null;

    var status = code;

    if(status != 200)
    {
      self._sid = null;

      if(status >= 500 && status <= 599)
      {
        if(self.onwarning)
          self.onwarning("Subscription request failed.  Retrying...");
        console.log("Subscription request failed.  Retrying...");
        self._retry();
      }
      else
      {
        if(self.onerror)
          self.onerror("Subscription request failed.  Stopping activity.");
        console.log("Subscription request failed.  Stopping activity.");
      }

      return;
    }

    var resp = result;

    if(!resp.sid || !resp.channels)
    {
      self._sid = null;

      if(self.onwarning)
        self.onwarning("Subscription request received unexpected response.  Retrying...");
      console.log("Subscription request received unexpected response.  Retrying...");
      self._retry();
      return;
    }

    self._retries = 0;

    var oldsid = self._sid;
    self._sid = resp.sid;
    if(self._sid != oldsid)
    {
      console.log("new session id: " + self._sid);

      if(self._cb_new_session)
        self._cb_new_session(self._sid);
    }

    for(var key in resp.channels)
    {
      if(!resp.channels.hasOwnProperty(key))
        continue;

      var c = resp.channels[key];

      var s = self._subs[key];
      if(!s)
      {
        // response contains channel we don't care about, skip
        continue;
      }

      if(c.error_code)
      {
        console.log("error subscribing to " + key);

        if(s.cb_state)
        {
          if(c.error_code === 403)
            s.cb_state({ type: "error", condition: "unauthorized" });
          else
            s.cb_state({ type: "error", condition: "unknown" });
        }

        delete self._subs[key];
        continue;
      }

      if(typeof c.last_cursor !== "string")
      {
        console.log("error subscribing to " + key);

        if(s.cb_state)
          s.cb_state({ type: "error", condition: "bad-protocol" });

        delete self._subs[key];
        continue;
      }

      // only take the server-side cursor if we don't have one locally
      if(typeof s.last_cursor !== "string")
        s.last_cursor = c.last_cursor;

      if(!s.subscribed)
      {
        s.subscribed = true;
        console.log("subscribed to " + key);
        if(s.cb_state)
          s.cb_state({ type: "subscribed" });
      }
    }

    for(var key in self._subs)
    {
      if(!self._subs.hasOwnProperty(key))
        continue;

      var s = self._subs[key];

      if(!resp.channels.hasOwnProperty(key))
      {
        console.log("error subscribing to " + key);

        if(s.cb_state)
          s.cb_state({ type: "error", condition: "bad-protocol" });
        delete self._subs[key];
      }
    }

    self._get_updates();
  };
  this._req.onError = function(reason)
  {
    if(self._req != req)
      return;

    self._req = null;
    self._sid = null;

    if(reason == 1)
    {
      if(self.onwarning)
        self.onwarning("Subscription request timeout.  Retrying...");
      console.log("Subscription request timeout.  Retrying...");
      self._retry();
    }
    else
    {
      if(self.onwarning)
        self.onwarning("Subscription request failed.  Retrying...");
      console.log("Subscription request failed.  Retrying...");
      self._retry();
    }
  };

  var uri;
  if (this._baseUrl) {
    uri = this._baseUrl;
  } else {
    var scheme = this._use_ssl ? "https://" : "http://";
    uri = scheme + this._domain + "/pubsub";
  }

  uri = uri + "/subscribe/";

  if(this._fo_domain)
    uri = uri + "?fo_domain=" + encodeURIComponent(this._fo_domain)

  var headers = {};
  headers["Content-Type"] = "application/x-www-form-urlencoded";

  this._req.start("POST", uri, headers, params);
}

Fpp.Client.prototype._get_updates = function()
{
  var param_list = new Array();

  param_list.push("sid=" + encodeURIComponent(this._sid));

  if(this._fo_domain)
    param_list.push("fo_domain=" + encodeURIComponent(this._fo_domain));

  for(var key in this._subs)
  {
    if(!this._subs.hasOwnProperty(key))
      continue;

    var s = this._subs[key];
    var ci = "name=" + encodeURIComponent(key) + "&since=" + encodeURIComponent("cursor:" + s.last_cursor);
    param_list.push("ci=" + encodeURIComponent(ci));
  }

  var params = param_list.join("&");

  var self = this;

  var req = new FO.Request();
  this._req = req;
  this._req.onFinished = function(code, result)
  {
    if(self._req != req)
      return;

    self._req = null;

    var status = code;

    if(status != 200)
    {
      if(status === 401)
      {
        // unauthorized.  start session over
        self._sid = null;
        if(self.onwarning)
          self.onwarning("Session lost, resubscribing.");
        self._resub();
      }
      else if(status === 404)
      {
        // bad cursor.  start session over
        self._sid = null;

        // invalidate all cursors
        for(var key in self._subs)
        {
          if(!self._subs.hasOwnProperty(key))
            continue;

          var s = self._subs[key];
          s.last_cursor = null;
        }

        if(self.onwarning)
          self.onwarning("Invalid cursor, resubscribing.");
        self._resub();
      }
      else if(status >= 500 && status <= 599)
      {
        if(self.onwarning)
          self.onwarning("Update request failed.  Retrying...");
        console.log("Update request failed.  Retrying...");
        self._retry();
      }
      else
      {
        if(self.onerror)
          self.onerror("Update request failed.  Stopping activity.");
        console.log("Update request failed.  Stopping activity.");
      }

      return;
    }

    var resp = result;

    if(!resp.channels)
    {
      if(self.onwarning)
        self.onwarning("Update request received unexpected response.  Retrying...");
      console.log("Update request received unexpected response.  Retrying...");
      self._retry();
      return;
    }

    self._retries = 0;

    for(var key in resp.channels)
    {
      if(!resp.channels.hasOwnProperty(key))
        continue;

      var c = resp.channels[key];

      var s = self._subs[key];
      if(!s)
      {
        // response contains channel we don't care about, skip
        continue;
      }

      if(c.error_code)
      {
        console.log("error getting updates from " + key);

        if(s.cb_state)
        {
          if(c.error_code === 403)
            s.cb_state({ type: "error", condition: "unauthorized" });
          else
            s.cb_state({ type: "error", condition: "unknown" });
        }

        delete self._subs[key];
        continue;
      }

      if(typeof c.last_cursor !== "string")
      {
        console.log("error getting updates from " + key);

        if(s.cb_state)
          s.cb_state({ type: "error", condition: "bad-protocol" });

        delete self._subs[key];
        continue;
      }

      s.last_cursor = c.last_cursor;
      items = c.items;
      for(var n = 0; n < items.length; ++n)
      {
        if(s.cb_data)
          s.cb_data(items[n]);
      }
    }

    // var sleeptime = Math.floor(Math.random() * 900) + 100;
    var sleeptime = 0;
    console.log("polling again in " + sleeptime + "ms");
    self._timer = setTimeout(function() { self._get_updates() }, sleeptime);
  };
  this._req.onError = function(reason)
  {
    if(self._req != req)
      return;

    self._req = null;

    if(reason == 1)
    {
      if(self.onwarning)
        self.onwarning("Update request timeout.  Retrying...");
      console.log("Update request timeout.  Retrying...");
      self._retry();
    }
    else
    {
      if(self.onwarning)
        self.onwarning("Update request failed.  Retrying...");
      console.log("Update request failed.  Retrying...");
      self._retry();
    }
  };

  var uri;
  if (this._baseUrl) {
    uri = this._baseUrl;
  } else {
    var scheme = this._use_ssl ? "https://" : "http://";
    uri = scheme + this._domain + "/pubsub";
  }

  uri = uri + "/feed/?" + params;

  this._req.start("GET", uri, null, null);
}

Fpp.Client.prototype._retry = function()
{
  if(this._retries === 0)
    this._retry_time = 1;
  else if(this._retries < 7)
    this._retry_time = this._retry_time * 2;
  ++(this._retries);

  var sleeptime = this._retry_time * 1000;
  console.log("trying again in " + sleeptime + "ms");
  var self = this;
  if(this._sid)
    this._timer = setTimeout(function() { self._get_updates(); }, sleeptime);
  else
    this._timer = setTimeout(function() { self._resub(); }, sleeptime);
}

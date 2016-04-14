/**
 *
 */
function FanoutService( channelName, listener ) {
  channelName = '!' + channelName;
  BenchmarkService.call( this, channelName, listener );

  this.name = 'Fanout';
  this.realmId = 'd7d63e3a';

  this.client = new Faye.Client('http://' + this.realmId + '.fanoutcdn.com/bayeux');

  var self = this;

  this.subscription = this.client.subscribe('/' + this._channelName, function (data) {
    self._onMessage( data );
  });
  this.subscription.then(function () {
    self._onReady();
  });
}
FanoutService.prototype = new BenchmarkService;

FanoutService.prototype.send = function( data ) {
  var body = {
    items: [
      {
        channel: this._channelName,
        formats: {
          'json-object': data
        }
      }
    ]
  };
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if(xhr.status == 200) {
        // success
      }
    }
  };
  xhr.open('POST', 'http://api.fanout.io/realm/' +
                    this.realmId +
                    '/publish/', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify(body));
};

FanoutService.prototype.disconnect = function( data ) {
  this.subscription.cancel();
};

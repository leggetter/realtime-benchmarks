/**
 *
 */
function FanoutService( channelName, listener ) {
  channelName = '+' + channelName;
  BenchmarkService.call( this, channelName, listener );

  this.name = 'Fanout';
  this.realmId = 'd7d63e3a';

  this.client = new Fpp.Client('http://pubsub.fanout.io/r/' + this.realmId);

  var self = this;

  this.channel = this.client.Channel(this._channelName);
  this.channel.on('state-changed', function (state) {
    if (state.type == 'subscribed') {
      self._onReady();
    }
  });
  this.channel.on('data', function (data) {
    self._onMessage( data );
  });
}
FanoutService.prototype = new BenchmarkService;

FanoutService.prototype.send = function( data ) {
  var body = { items: [ { fpp: data } ] };
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
                    '/publish/' +
                    this._channelName + '/', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify(body));
};

FanoutService.prototype.disconnect = function( data ) {
  this.channel.cancel();
};

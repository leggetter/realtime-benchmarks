/**
 * 
 */
function PubNubService() {
  BenchmarkService.apply( this, arguments );
  
  this.name = 'PubNub';

  this.pubnub = PUBNUB.init( {
    publish_key: 'pub-a1c89fc1-c4a0-4ac9-a784-d42824e1c0eb',
    subscribe_key: 'sub-be77f868-1ee3-11e2-b53c-85075d7b5343'
  } );
  
  var self = this;
  
  self.pubnub.subscribe({
    channel    : self._channelName,

    restore    : false,              // STAY CONNECTED, EVEN WHEN BROWSER IS CLOSED
                                     // OR WHEN PAGE CHANGES.

    callback   : function(message) {
      self._onMessage( message );
    },

    disconnect : function() {        // LOST CONNECTION.
      self._log(
        "Connection Lost." +
        "Will auto-reconnect when Online."
      );
    },

    reconnect  : function() {        // CONNECTION RESTORED.
      self._log("And we're Back!")
    },

    connect    : function() {
    	self._onReady();
    }
  });
}
PubNubService.prototype = new BenchmarkService;

PubNubService.prototype.send = function( data ) {
	this.pubnub.publish({
	  channel : this._channelName,
	  message : data
	});
};

PubNubService.prototype.disconnect = function( data ) {
  this.pubnub.unsubscribe({
		channel : this._channelName
  });
};
/**
 * 
 */
function PusherService() {
    BenchmarkService.apply( this, arguments );
    
    // TODO: comment out before running tests
    // var self = this;
    // Pusher.log = function( msg ) {
    //     self._log( msg );
    // };
    
    this.name = 'Pusher';
    
    this._subscriptionCount = 0;
    
    var self = this;
    
    // The sender of a client event does not receive it.
    // So we need two Pusher instances
    this._pusherSubscriber = new Pusher( 'c9b72d1013a84c2cec48' );
    this._subscribeChannel = this._pusherSubscriber.subscribe( this._channelName );
    this._subscribeChannel.bind( 'pusher:subscription_succeeded', function() {
        self._subscriptionSucceeded();
    });
    this._subscribeChannel.bind( 'client-event', function( message ) {
        self._onMessage( message );
    });
    
    this._pusherPublisher = new Pusher( 'c9b72d1013a84c2cec48' );
    this._publisherChannel = this._pusherPublisher.subscribe( this._channelName );
    this._publisherChannel.bind( 'pusher:subscription_succeeded', function() {
        self._subscriptionSucceeded();
    });
}
PusherService.prototype = new BenchmarkService;

PusherService.prototype._subscriptionSucceeded = function() {
  ++this._subscriptionCount;
  if( this._subscriptionCount === 2) {
      this._onReady();
  }
};

PusherService.prototype.send = function( data ) {
    this._publisherChannel.trigger( 'client-event', data );
};

PusherService.prototype.disconnect = function() {
   this._pusherSubscriber.disconnect();
   this._pusherPublisher.disconnect();
};
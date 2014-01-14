/**
 * 
 */
function FirebaseService() {
    BenchmarkService.apply( this, arguments );
    
    this.name = 'Firebase';
    
    this.fb = new Firebase( 'https://benchmarks.firebaseio.com/' );
    this.connState = this.fb.child( '.info/connected' );
    this.connState.on( 'value' , this._connectionStateChanged, this );

    this.benchmark = this.fb.child( this._channelName );

    // Remove benchmark data when client disconnects
    this.benchmark.onDisconnect().remove();

    this.benchmark.on( 'child_added', this._childAdded, this );
}
FirebaseService.prototype = new BenchmarkService;

FirebaseService.prototype._connectionStateChanged = function( snap ) {
  if ( snap.val() === true ) {
    this._onReady();
  }
};

FirebaseService.prototype._childAdded = function( data ) {
  var message = data.val();

  this._log( 'FB: childAdded: ' + JSON.stringify( message ) );

  // Convert millis since epoch back to data object
  message.time = new Date( message.time );

  this._onMessage( message );
};

FirebaseService.prototype.send = function( data ) {
  this._log( 'FB: sending: ' + JSON.stringify( data ) );

  // Firebase doesn't appear to serialise dates very well. If you leave as a Date object
  // it will be lost (removed from the message object).
  // Work around is to send milliseconds since epoch
  data.time = data.time.getTime();

  this.benchmark.push( data, function onComplete() {
    // TODO: is testing this good enough for latency?
    // Or do we need another Firebase instance for full round-trip latency?
  } );
};

FirebaseService.prototype.disconnect = function() {
  Firebase.goOffline();
};
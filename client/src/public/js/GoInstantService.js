/**
 * 
 */
function GoInstantService() {
  var self = this;
  BenchmarkService.apply( self, arguments );

  self.name = 'GoInstant';

  self.connectUrl = 'https://goinstant.net/ccf8fe39696c/benchmarks';

  self.publishConnection = null;
  self.publishBenchmark = null;

  self.subscribeConnection = null;
  self.subscribeBenchmark = null;
    
  goinstant.connect( self.connectUrl, { user: { id: 'pub', displayName: 'Publisher' } }, function (err, connection, lobby ) {
    if (err) {
      throw err;
    }

    self.publishConnection = connection;
    self.publishBenchmark = lobby.channel( 'benchmark' );

    self._createSubscribeConnection();
  } );
}
GoInstantService.prototype = new BenchmarkService;

GoInstantService.prototype._createSubscribeConnection = function() {
  var self = this;

  goinstant.connect( self.connectUrl, { user: { id: 'sub', displayName: 'Subscriber' } }, function (err, connection, lobby ) {
    if (err) {
      throw err;
    }

    self.subscribeConnection = connection;
    self.subscribeBenchmark = lobby.channel( 'benchmark' );

    self.subscribeBenchmark.on( 'message', function( data, context ) {
      self._onMessage( data );
    } );

    self._onReady();
  } );
};

GoInstantService.prototype._handleResponse = function( err, msg, context ) {
  if( err ) {
    throw err;
  }
};

GoInstantService.prototype.send = function( message ) {
  var self = this;

  self._log( "sending: " + JSON.stringify( message ) );

  this.publishBenchmark.message( message, function() {
    self._handleResponse.apply( self, arguments );
  } );
};

GoInstantService.prototype.disconnect = function() {
  this.publishConnection.disconnect();
  this.subscribeConnection.disconnect();
};
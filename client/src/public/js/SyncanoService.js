/**
 *
 */
function SyncanoService() {
    BenchmarkService.apply( this, arguments );

    var self = this;

    self.name = 'Syncano';

    self.BENCH_INSTANCE = 'winter-resonance-305929';
    self.BENCH_API_KEY = 'd03c22fec8a15e0d41895f8c4d4dd0e003ef8401';
    self.BENCH_PROJECT_ID = 4464;

    self._syncano = SyncanoConnector.getInstance();
    self._syncano.connect( {
      instance: self.BENCH_INSTANCE,
      api_key: self.BENCH_API_KEY
    } );

    self._syncano.once('syncano:error', function(result){
        self._log( result );
    });

    self._syncano.on( 'syncano:data:new', function( data ) {
      // see comment in send function
      var messageData = JSON.parse( data[ 0 ].data.additional.encoded );
      self._onMessage( messageData );
    } );

    self._createBenchMarkCollection();
}
SyncanoService.prototype = new BenchmarkService;

/**
 * Create collection for this benchmark run.
 */
SyncanoService.prototype._createBenchMarkCollection = function() {
  var self = this;

  self._syncano.Collection.new(
    self.BENCH_PROJECT_ID,
    (new Date().getTime()) + '',
    'benchmarks collection', function( data ){
      self._log('Created collection, received: ', data);
      self._collectionId = Number( data.id );

      self._activateCollection();
  } );
};

SyncanoService.prototype._activateCollection = function() {
  var self = this;

  self._syncano.Collection.activate( self.BENCH_PROJECT_ID, self._collectionId, null, function(){
    self._log( 'Activated collection' );
      self._onReady();
  } );
};

SyncanoService.prototype.send = function( messageData ) {
  var self = this;

  // Since "text" is a Syncano supported and named param at the top-level of the data object
  // you can't use this same property on the additional object.
  // Since this feels restrictive and a bit quirky I've decided to just encode/decode
  // message data.
  var storeData = {
    additional: {
      encoded: JSON.stringify( messageData )
    }
  };

  self._syncano.Data.new( self.BENCH_PROJECT_ID, self._collectionId, storeData, function( data ){
    self._log('Created new data object with ID = ', data.id);
  });
};

SyncanoService.prototype.disconnect = function() {
  var self = this;

  self._log( 'deleting benchmark collection' );
  self._syncano.Collection.delete( self.BENCH_PROJECT_ID, self._collectionId, function( data ) {
    self._log( 'deleted... disconnecting' );
    // A bit naughty. But the public API doesn't expose a disconnect.
    self._syncano.socket.close();
  } );
};

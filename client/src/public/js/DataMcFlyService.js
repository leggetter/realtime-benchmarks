/**
 * 
 */
function DataMcFlyService() {
    BenchmarkService.apply( this, arguments );
    
    this.name = 'DataMcFly';
    
    this.benchmark = new DataMcFly("d45797ef-7392-442f-8de8-5303d306576c", "benchmarks", this._channelName);
    
    this.benchmark.on('online', this._onOnline.bind(this) );

    // TODO: Remove benchmark data when client disconnects

    this.benchmark.on( 'added', this._childAdded.bind(this) );
}
DataMcFlyService.prototype = new BenchmarkService;

DataMcFlyService.prototype._onOnline = function() {
  this._onReady();
};

DataMcFlyService.prototype._childAdded = function( data ) {
  var message = data.value();

  this._log( 'DMF: childAdded: ' + JSON.stringify( message ) );

  this._onMessage( message );
};

DataMcFlyService.prototype.send = function( data ) {
  this._log( 'DMF: sending: ' + JSON.stringify( data ) );

  this.benchmark.push( data, function onComplete() {
    // TODO: is testing this good enough for latency?
    // Or do we need another DataMcFly instance for full round-trip latency?
  } );
};

DataMcFlyService.prototype.disconnect = function() {
  this.benchmark.socket.close();
};

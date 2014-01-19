/**
 *
 */
function BenchmarkService( testChannelName, serviceListener ) {
    this.name = 'NOT SET';
    
    this._channelName = testChannelName;
    this._serviceListener = serviceListener;
}

BenchmarkService.prototype._onMessage = function( message ) {
    this._serviceListener.onMessage( message );
};

BenchmarkService.prototype._onReady = function() {
    this._serviceListener.onReady();
};

BenchmarkService.prototype._log = function( message ) {
    this._serviceListener.onLog( this.name + ': ' + message );
};

BenchmarkService.prototype.send = function( data ) {
    throw "not implemented";
};

BenchmarkService.prototype.disconnect = function() {
	throw "not implemented";
};
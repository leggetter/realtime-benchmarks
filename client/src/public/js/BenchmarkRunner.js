function BenchmarkRunner( services, options ) {
	this._services = services;
	this._options = options || {};

	this._serviceIndex = 0;
	this._messageCountTo = 20;
  this._sendNextUponReceipt = true;

  this._testChannelName = 'private-' + ('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	    return v.toString(16);
		}));
                
  this._serviceLatencyResults = {};
  this._logMessages = [];
                
  this._service;
  this._localMsg;
  this._messageCount;
  this._testLatencyResults;
}

BenchmarkRunner.prototype._testInit = function() {
  this._tester = null;
	this._localMsg = {
        text: 'TODO: send larger, potentially configurable text',
        time: null,
        timeout: null
    };
  this._messageCount = 0;
  this._testLatencyResults = [];
};

// Services listeners
BenchmarkRunner.prototype.onMessage = function( message ) {
    this.onLog( '>>> ' + JSON.stringify( message ) );
    
    if( message.timeout != this._localMsg.timeout ) {
        this.onLog( '>>> received message, but not withing 2 seconds' );
    }
    else {
        var now = new Date();
        var sent = Date.parse( message.time );
        var latency = ( now - sent );
        this._testLatencyResults.push( latency );
        this.onLog( '>>> latency: ' + latency + 'ms' );
        
        if( this._sendNextUponReceipt ) {
        
            clearTimeout( this._localMsg.timeout );
            this._sendNextMessage();
        }
    }
};               

BenchmarkRunner.prototype.onReady = function() {
	this._sendNextMessage();
};

BenchmarkRunner.prototype.onLog = function( message ) {
	this._logMessages.push( message );
	if( this._options.logToConsole ) {
		console.log( message );
	}
};
///
             
BenchmarkRunner.prototype._sendNextMessage = function() {
	var self = this;

  this._messageCount++;
  
  if( this._messageCount < this._messageCountTo ) {
    this._localMsg.time = new Date();
    this._localMsg.timeout = setTimeout( function() {
         setTimeout( function() {
         		self._sendNextMessage();
         	}, 0 );
        }, 1000);
    
    this._service.send( this._localMsg );
  }
  else {
  	this._service.disconnect();

    this.onLog( 'TEST COMPLETE' );
    this.onLog( 'RESULTS: ' + this._testLatencyResults.join( ', ' ) +
                 ' (Average: ' + BenchmarkRunner.getAverage( this._testLatencyResults ) + 'ms)' );
                 
    this._serviceLatencyResults[ this._service.name ] = this._testLatencyResults;
    
    this._nextTest();
  }
}
                
BenchmarkRunner.prototype._nextTest = function() {
	this._service = this._getNextService();
  if( this._service === null ) {
    this.onLog( 'ALL SERVICES TESTED' );
    for( var service in this._serviceLatencyResults ) {
        var result = this._serviceLatencyResults[ service ];
        this.onLog( 'RESULT for ' + service + ': ' + result.join( '\t' ) +
                 '\t(Average: ' + BenchmarkRunner.getAverage( result ) + 'ms)' );
    }

    if( this._options.completed ) {
    	this._options.completed( this._serviceLatencyResults );
    }
  }
};

BenchmarkRunner.prototype._getNextService = function() {
	var service = null;
	if( this._services[ this._serviceIndex ] ) {
    this._testInit();
    service = new this._services[ this._serviceIndex ]( this._testChannelName, this );
    ++this._serviceIndex;
  }
  return service;
}

BenchmarkRunner.prototype.start = function() {
	this._nextTest();
};
                
BenchmarkRunner.getAverage = function( values ) {
	var total = 0;
  var valueCount = values.length;
  for( var i = 0; i < valueCount; ++i ) {
      total += values[ i ];
  }
  return ( total / valueCount );
};
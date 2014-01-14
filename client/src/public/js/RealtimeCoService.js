/**
 * 
 */
function RealtimeCoService() {
  BenchmarkService.apply( this, arguments );
    
  this.name = 'RealtimeCo';
    
  var self = this;

  loadOrtcFactory(IbtRealTimeSJType, function (factory, error) {
		if (error != null) {
		} else {
			self._init(factory);
		}
	});
}
RealtimeCoService.prototype = new BenchmarkService;

RealtimeCoService.prototype._init = function( ortcFactory ) {
	var self = this;

	this._client = ortcFactory.createClient();
	var url = 'http://ortc-developers.realtime.co/server/2.1/'
	var isCluster = true;

	this._client.setId('LatencyClient');
	this._client.setConnectionTimeout(15000);
	
	if (isCluster) {
		this._client.setClusterUrl(url);
	} else {
		this._client.setUrl(url);
	}
 
	this._client.onConnected = function () {
		self._client.subscribe(self._channelName, true, function( ortc, channel, message ) {
			message = JSON.parse(message);
			self._onMessage( message );
		});

		self._onReady();
	};

	this._client.onException = function (ortc, exception) {
		var msg = exception;
		if(exception == 'Invalid connection.') {
			msg += ' Please reload the page to authenticate again';
		}
		self._log('Error: ' + msg);		
	};
	
	var appKey = '2wFviN'; 
	var authenticationToken = 'NOT_USED_BECAUSE_AUTH_IS_SET_OFF_IN_THE_DASHBOARD';
	this._client.connect(appKey, authenticationToken);
};

RealtimeCoService.prototype.send = function( data ) {
   this._client.send( this._channelName, JSON.stringify( data ) );
};

RealtimeCoService.prototype.disconnect = function() {
  this._client.disconnect();
};
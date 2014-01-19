/**
 * 
 */
function HydnaService() {
  var self = this;
  BenchmarkService.apply( self, arguments );
  
  self.name = 'Hydna';

  self.channel = new HydnaChannel('leggetter.hydna.net/' + self._channelName, 'rw');

  self.channel.onopen = function(event) {
    self._log( 'onopen' );
    self._onReady();
  };

  self.channel.onclose = function(event) {
    self._log( 'onclose' );
  };

  self.channel.onmessage = function(event) {
    event.data = JSON.parse( event.data );
    self._onMessage( event.data );
  };
}
HydnaService.prototype = new BenchmarkService;

HydnaService.prototype.send = function( data ) {
  data = JSON.stringify( data );
  this.channel.send( data );
};

HydnaService.prototype.disconnect = function() {
  this.channel.close();
};
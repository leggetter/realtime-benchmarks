var program = require( 'commander' );
var fs = require( 'fs' );

program
  .version('0.0.1')
  .usage( '<file>' )
  .parse(process.argv);

console.log( program );
if( program.args.length !== 1 ) {
	console.error( 'Please provide a single argument representing the location of the result file to analyse' );
	program.help();
}

var json = fs.readFileSync( program.args[ 0 ] );
var results = JSON.parse( json );

console.log( results );

var processedData = {
	expectedRunResultCount: 19,
	services: {
		Pusher: {
			totalResultCount: 0,
			runsMissingResults: 0,
			averageLatencyExFails: 0
		},
		PubNub: {
			totalResultCount: 0,
			runsMissingResults: 0,
			averageLatencyExFails: 0
		},
		RealtimeCo: {
			totalResultCount: 0,
			runsMissingResults: 0,
			averageLatencyExFails: 0
		}
	}
};

var foundResultCount;
var serviceResults;
var serviceResult;
var processedServiceResult;
var result;
for( var i = 0, l = results.length; i < l; ++i ) {
	result = results[ i ];
	serviceResults = result.latencyResults;


	for( var service in processedData.services ) {
		serviceResult = serviceResults[ service ];
		processedServiceResult = processedData.services[ service ];

		// Result count
		foundResultCount = serviceResult.length;
		console.log( foundResultCount );

		processedServiceResult.totalResultCount += foundResultCount;
		if( foundResultCount < processedData.expectedRunResultCount ) {
			processedServiceResult.runsMissingResults += ( processedData.expectedRunResultCount - foundResultCount );
		}

		// Average latency
		var latencyTotal = 0;
		var testResult;
		for( var j = 0; j < foundResultCount; ++j ) {
			testResult = serviceResult[ j ];
			latencyTotal += testResult;
		}
		processedServiceResult.averageLatencyExFails += latencyTotal;
	}
}

console.dir( processedData );
console.log( '\n' );

console.log( 'Average latency for all tests' );
var latency;
for( var service in processedData.services ) {
	latency = ( processedData.services[ service ].averageLatencyExFails / processedData.services[ service ].totalResultCount );
	latency = Math.round( latency );
	console.log( service + ': ' + latency + 'ms' );
}

var totalExpectedTestsPerService = ( processedData.expectedRunResultCount * results.length );
console.log( 'Total expected results per service: ' + totalExpectedTestsPerService );
console.log( '% Failed to complete tests' );
var percent;
for( var service in processedData.services ) {
	percent = ( processedData.services[ service ].totalResultCount / totalExpectedTestsPerService );
	percent = Math.round( 100 - ( percent * 100 ) );
	console.log( service + ': ' + percent + '%' );
}

// console.log( '\n' );
// console.log( 'Average latency (excluding failed to complete)' );
// for( var service in processedData.services ) {
	
// }
var request = require( 'request' );
var moment = require( 'moment' );
var fs = require( 'fs' );

var config = require( __dirname + "/config.json" );

var RESULT_URL = 'http://www.leggetter.co.uk/realtime_benchmarks/results.php';
var OFFSET_PARAM = 'offset';
var MAX_PER_RESULT = 250;
var GLOBAL_MAX_RESULTS = -1;

var currentOffset = 0;
var results = [];

function saveResults( results ) {
  var filename = moment().format( 'YYYY-MM-DD_HHmmss' ) + '.json';
  console.log( 'Saving results to %s', filename );

  var jsonResults = JSON.stringify( results, null, 2 );
  fs.writeFile( filename, jsonResults, function( err ) {
    if( err ) {
      console.log(err);
    } else {
      console.log("The file was saved!");
    }
  });
}

function processResponse ( error, response, body ) {
  if (!error && response.statusCode === 200) {
    var requestResult = JSON.parse( body );
    var numberOfResults = requestResult.length;

    console.log( 'Retrieved %s results', numberOfResults );

    results = results.concat( requestResult );

    console.log( 'Now have %s results in total', results.length );

    if( GLOBAL_MAX_RESULTS !== -1 &&
        results.length >= GLOBAL_MAX_RESULTS ) {
      console.log( 'Global max results met' );
      saveResults( results );
    }
    else if( numberOfResults === MAX_PER_RESULT ) {
      currentOffset += MAX_PER_RESULT;

      console.log( 'Getting next %s results', MAX_PER_RESULT );
      setTimeout( function() {
        getResults( currentOffset );
        }, 2000 );
    }
    else {
      saveResults( results );
    }
  }
}

function getResults( offset ) {
  var url = RESULT_URL + '?' + 'auth_key=' + config.AUTH_KEY + '&' + OFFSET_PARAM + '=' + offset;
  request( url, processResponse );
}

getResults( currentOffset );
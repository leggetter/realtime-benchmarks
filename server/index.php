<?php
require( 'config.php' );

define( 'JSON_HEADER', 'Content-Type: application/json' );

function publish_result( $result ) {
	$url = PUBLISH_ENDPOINT;

	$ch = curl_init();

	curl_setopt($ch, CURLOPT_URL,            $url );
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1 );
	curl_setopt($ch, CURLOPT_POST,           1 );
	curl_setopt($ch, CURLOPT_POSTFIELDS,     $result ); 
	curl_setopt($ch, CURLOPT_HTTPHEADER,     array( JSON_HEADER ) );

	return curl_exec ($ch);
}

header( JSON_HEADER );

$result = array();
$body = null;

$con = mysql_connect("localhost", $db_username, $db_password);
if (!$con)
{
  $result['error'] = 'Could not connect: ' . mysql_error();
}
else {

	mysql_select_db($db_name, $con);

	$body = file_get_contents( 'php://input' );

	$escaped_body = mysql_real_escape_string( $body );

	$ip = $_SERVER[ 'REMOTE_ADDR' ];

	if( !$escaped_body ) {
	  $result[ 'error' ] = 'unsupported body value';
	}
	else {

		$insert_query = "INSERT INTO $db_tablename (result, ip) ";
		$insert_query .= sprintf( "VALUES( '%s', '%s' )", $escaped_body, $ip );

		$insert_result = mysql_query($insert_query);
		if( !$insert_result ) {
		  $result[ 'error' ] = 'insert query failed: ' . mysql_error();
		  //exit( $result[ 'error' ] . ' >> ' . $insert_query );
		}
		else {
			$result['id'] = mysql_insert_id( $con );
		}
	}

	mysql_close($con);
}

// TODO: consider sending result ID so that updates can also be sent
// e.g. for location updates

if( isset( $result[ 'error' ] ) === false ) {
	$http_result = publish_result( $body );
	// Two lines below are useful for debugging why calls to the REST API
	// may not be getting through to the Faye client
	// $result[ 'http_body' ] = $body;
	// $result[ 'http_result' ] = $http_result;
}

$json_result = json_encode( $result );

echo( $json_result );
?>
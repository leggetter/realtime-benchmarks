<?php
require( 'config.php' );

header('Content-Type: text/javascript');

if( $_GET[ 'auth_key' ] != AUTH_KEY ) {
  header('HTTP/1.0 401 Unauthorized');
  echo('You are not authorised to access this resource');
  exit;
}

$result = array();

$con = mysql_connect("localhost", $db_username, $db_password);
if (!$con)
{
  $result['error'] = 'Could not connect: ' . mysql_error();
}
else {

	mysql_select_db($db_name, $con);
  
  $offset = ( isset( $_GET[ 'offset' ] )? $_GET[ 'offset' ] : 0 );
  $offset = mysql_real_escape_string( $offset );

	$query = "SELECT * FROM $db_tablename limit 250 offset $offset";

	$query_result = mysql_query($query);
	if( !$query_result ) {
	  $result[ 'error' ] = 'select query failed: ' . mysql_error();
	  //exit( $result[ 'error' ] . ' >> ' . $insert_query );
	}
	else {
		while ($row = mysql_fetch_assoc($query_result)) {
    	$result[] = json_decode( $row[ 'result' ], true );
    	$result[ count( $result ) - 1 ][ 'timestamp' ] = $row[ 'timestamp' ];
		}
	}

	mysql_close($con);
}

echo( json_encode( $result ) );
?>
<?php
require( 'config.php' );

header('Content-Type: text/javascript');

// only allow last 10 to be retrived
$limit = 10;
$offset = 0;
$order_by = 'timestamp desc';

if( $_GET[ 'auth_key' ] == AUTH_KEY ) {
  $limit = 250;
  $offset = ( isset( $_GET[ 'offset' ] )? $_GET[ 'offset' ] : 0 );
  $order_by_col = ( isset( $_GET[ 'col' ] )? $_GET[ 'col' ] : 'timestamp' );
  $order_by_dir = ( isset( $_GET[ 'dir' ] )? $_GET[ 'dir' ] : 'desc' );
  $order_by = "$order_by_col $order_by_dir";
}

$result = array();

$con = mysql_connect("localhost", $db_username, $db_password);
if (!$con)
{
  $result['error'] = 'Could not connect: ' . mysql_error();
}
else {

	mysql_select_db($db_name, $con);


  $offset = mysql_real_escape_string( $offset );

	$query = "SELECT * FROM $db_tablename order by $order_by limit $limit offset $offset";

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

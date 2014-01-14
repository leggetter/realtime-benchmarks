<?php
require( 'config.php' );

header('Content-Type: text/javascript');

$result = array();

$con = mysql_connect("localhost", $db_username, $db_password);
if (!$con)
{
  $result['error'] = 'Could not connect: ' . mysql_error();
}
else {

	mysql_select_db($db_name, $con);

	$body = file_get_contents('php://input');

	$body = mysql_real_escape_string( $body );

	$ip = $_SERVER[ 'REMOTE_ADDR' ];

	if( !$body ) {
	  $result[ 'error' ] = 'unsupported body value';
	}
	else {

		$insert_query = "INSERT INTO $db_tablename (result, ip) ";
		$insert_query .= sprintf( "VALUES( '%s', '%s' )", $body, $ip );

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

echo( json_encode( $result ) );
?>
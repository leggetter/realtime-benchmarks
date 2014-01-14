<?php
require( 'config.php' );

header('Content-Type: text/javascript');

$result = array();

$con = mysql_connect("localhost", $db_username, $db_password);
if (!$con) {
  $result['error'] = 'Could not connect: ' . mysql_error();
}
else {

	mysql_select_db($db_name, $con);

	$id = $_POST[ 'id' ];
	$data = $_POST[ 'data' ];

	if( !$id && $data ) {
	  $result[ 'error' ] = 'unsupported id or data values';
	}
	else {

		$update_query = "UPDATE $db_tablename SET result=";
		$update_query .= sprintf( "'%s' WHERE id=%d", $data, $id );

		$query_result = mysql_query( $update_query );
		if( !$query_result ) {
		  $result[ 'error' ] = 'insert query failed: ' . mysql_error();
		  //exit( $result[ 'error' ] . ' >> ' . $insert_query );
		}
		else {
			$result = $data;
		}
	}

	mysql_close($con);
}

echo( $result );
?>
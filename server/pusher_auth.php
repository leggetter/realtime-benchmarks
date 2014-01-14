<?php
require( 'Pusher.php' );

define( 'PUSHER_APP_ID', '30403' );
define( 'PUSHER_APP_KEY', 'c9b72d1013a84c2cec48' );
define( 'PUSHER_APP_SECRET', '37d6e422298d34583398' );

$pusher = new Pusher( PUSHER_APP_KEY, PUSHER_APP_SECRET, PUSHER_APP_ID );

$auth = $pusher->socket_auth( $_POST[ 'channel_name' ] , $_POST[ 'socket_id' ] );
echo( $auth );
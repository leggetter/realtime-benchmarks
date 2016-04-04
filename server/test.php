<!doctype html>
<html>
    <head>
    </head>
    <body>
        Open the JavaScript console

        <script src="https://cdn.pubnub.com/pubnub.min.js"></script>
        <script src="http://js.pusher.com/2.1/pusher.min.js"></script>
        <script src="http://messaging-public.realtime.co/js/2.1.0/ortc.js"></script>
        <script src="https://cdn.firebase.com/v0/firebase.js"></script>
        <script src="http://cdn.hydna.com/1/hydna.js"></script>
        <script src="http://d7d63e3a.fanoutcdn.com/bayeux/static/faye-browser-min.js"></script>

        <script src="http://code.jquery.com/jquery-1.8.2.min.js"></script>
        <script>
        	Pusher.channel_auth_endpoint = '/realtime_benchmarks/pusher_auth.php';
        </script>
        <script src="realtime-benchmarks.min.js"></script>
        <script>
            var services = [
                // PubNubService,
                // PusherService,
                // RealtimeCoService,
                // FirebaseService,
                // HydnaService,
                FanoutService
            ];

            var runner = new BenchmarkRunner( services, {
                    logToConsole: true
                } );

            runner.start();
        </script>
    </body>
</html>

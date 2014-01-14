<!doctype html>
<html>
    <head>
    </head>
    <body>
        Open the JavaScript console

        <div pub-key="pub-a1c89fc1-c4a0-4ac9-a784-d42824e1c0eb" 
             sub-key="sub-be77f868-1ee3-11e2-b53c-85075d7b5343"
             ssl="off" 
             origin="pubsub.pubnub.com"
             id="pubnub"></div>
        <script src="http://cdn.pubnub.com/pubnub-3.1.min.js"></script>
        <script src="http://js.pusher.com/1.12/pusher.min.js"></script>
        <script src="http://dfdbz2tdq3k01.cloudfront.net/js/2.1.0/ortc.js"></script>

        <script src="http://code.jquery.com/jquery-1.8.2.min.js"></script>
        <script>
        	Pusher.channel_auth_endpoint = '/realtime_benchmarks/pusher_auth.php';
        </script>
        <script src="realtime-benchmarks.min.js"></script>
        <script>
            var services = [
                PubNubService,
                PusherService,
                RealtimeCoService
            ];

            var runner = new BenchmarkRunner( services, {
                    logToConsole: true
                } );

            runner.start();
        </script>
    </body>
</html>
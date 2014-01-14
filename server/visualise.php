<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
    <style type="text/css">
      html { height: 100% }
      body { height: 100%; margin: 0; padding: 0 }
      #map_canvas { height: 100% }
    </style>
  </head>
  <body>
    <div id="map_canvas" style="width:100%; height:100%"></div>

    <script type="text/javascript"
      src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAZygeByVvaD4_ff5j_EJBpU43_GFeY8qg&sensor=true">
    </script>
    <script src="http://code.jquery.com/jquery-1.8.2.min.js"></script>
    <script type="text/javascript">
      ( function() {
        
        var map = null;
        function initialize() {
          var mapOptions = {
            center: new google.maps.LatLng(-34.397, 150.644),
            zoom: 2,
            mapTypeId: google.maps.MapTypeId.ROADMAP
          };
          map = new google.maps.Map(document.getElementById("map_canvas"),
              mapOptions);
        }

        function addMarker( result ) {
          if( result.location && result.location.coords ) {
            console.log( 'mapping');
            console.log( result );
            var myLatlng = new google.maps.LatLng( result.location.coords.latitude, result.location.coords.longitude );

            var marker = new google.maps.Marker({
                position: myLatlng,
                map: map,
                title:"Hello World!"
            });
          }
        }

        function showResults( results ) {
          console.log( results.length + ' resulsts found' );
          for( var i = 0, l = results.length; i < l; ++i ) {
            addMarker( results[ i ] );
          }
        }

        var results = $.ajax( {
          url: 'results.php',
          success: showResults,
          dataType: 'json'
        });

        $(initialize);

      } )();
    </script>
  </body>
</html>
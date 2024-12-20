<!DOCTYPE html> 
<html> 
<head> 
<meta http-equiv="content-type" content="text/html; charset=UTF-8"/> 
<meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no" /> 
<meta name="apple-mobile-web-app-capable" content="yes" />
<link rel="apple-touch-icon" href="apple-touch-icon.png"/>
<link rel="shortcut icon" type="image/x-icon" href="favicon.ico">
<link rel="stylesheet" href="css/style.css?v=3">
<title>TOTransit - View TTC Streetcars and Buses Live on a Map</title> 
<meta name="description" content="See when the next streetcars are coming, and watch them move on a map in real-time. Desktop and mobile friendly!"/>
<meta property="og:title" content="TOTransit - View TTC Streetcars Live on a Map"/>
<meta property="og:description" content="See when the next streetcars are coming, and watch them move on a map in real-time. Desktop and mobile friendly!"/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="http://totransit.ca/"/>
<meta property="og:image" content="http://totransit.ca/fb.png"/>
<meta property="fb:admins" content="122611956"/>

<!-- Fathom -->
<script src="https://cdn.usefathom.com/script.js" data-site="KEGFOCCK" defer></script>

<script type="text/javascript"> 
  // Loads the Google Map API and runs callback function (init()) when done
  function loadScript() {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "//maps.google.com/maps/api/js?v=3.58&key=AIzaSyC-D-f8DPZoxBO2zir3xdBOtnrh-S3OEV4&callback=init&loading=async";
    document.body.appendChild(script);

    // For iphone
    window.top.scrollTo(0, 1);
  }
  
  window.onload = loadScript;

  data = <?php echo file_get_contents("./routes.json"); ?>;
</script> 
</head> 
<body> 
  <div id="map_canvas"></div> 


  <div id="controls">
    <a href="#" id="update">Manual Update</a>
    <a href="#" id="show-hide-controls">Show/Hide Route Selection</a>
    <span href="#" id="last-updated">Last Updated: 10 seconds ago</span>
    <div id="show-routes"></div>
  </div>

  <div id="about">
    <a href="#" id="about-show">About</a>
    <div id="about-content">
      <div class="desktop-only">
        Mobile friendly! Just visit totransit.ca 
        on your device.
      </div>
      Feedback? Email
      <a href="mailto:matt@ruten.ca" title="Email matt@ruten.ca">matt@ruten.ca</a>
    </div>
  </div>

  <!-- Notification Panel on the bottom: Use for downtime announcements or similar. -->
  <!-- (Also remember to temporarily remove bookmark_bubble.js if using this as they are both positioned at the bottom of the screen) -->
  <!-- <div id="notification">
    <strong>Announcement Title</strong>
    <div id="notifiction-content">
      Announcment content...
    </div>
  </div> -->

  <script src="//ajax.googleapis.com/ajax/libs/jquery/1.5.2/jquery.min.js"></script>
  <script>window.jQuery || document.write('<script src="js/libs/jquery-1.5.2.min.js">\x3C/script>')</script>
  <script type="text/javascript" src="js/libs/cookies.js"></script> 
  <script type="text/javascript" src="js/libs/underscore.js"></script> 
  
  <script type="text/javascript" src="js/libs/bookmark_bubble.js"></script> 

  <!--<script type="text/javascript" src="js/libs/underscore.string.js"></script>-->
  <script type="text/javascript" src="js/ttc.js?v=5"></script>
</body> 
</html>

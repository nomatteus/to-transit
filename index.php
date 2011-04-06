<!DOCTYPE html> 
<html> 
<head> 
<meta http-equiv="content-type" content="text/html; charset=UTF-8"/> 
<meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no" /> 
<meta name="apple-mobile-web-app-capable" content="yes" />
<link rel="apple-touch-icon" href="apple-touch-icon.png"/>
<link rel="shortcut icon" type="image/x-icon" href="favicon.ico">
<link rel="stylesheet" href="css/style.css?v=1">
<title>TOTransit&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp;&nbsp;View TTC Streetcars Live on a Map</title> 
<script type="text/javascript"> 
  // Loads the Google Map API and runs callback function (init()) when done
  function loadScript() {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "http://maps.google.com/maps/api/js?v=3&sensor=true&callback=init";
    document.body.appendChild(script);

    // For iphone
    window.top.scrollTo(0, 1);
  }
  
  window.onload = loadScript;
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
      Feedback? Email
      <a href="mailto:matt@matthewruten.com" title="Email matt@matthewruten.com">matt@matthewruten.com</a>
      or 
      <a href="http://totransit.uservoice.com/" target="_blank" title="TO Transit UserVoice (Opens New Window)">vote for ideas</a>.
    </div>
  </div>

  <script src="//ajax.googleapis.com/ajax/libs/jquery/1.5.2/jquery.min.js"></script>
  <script>window.jQuery || document.write('<script src="js/libs/jquery-1.5.2.min.js">\x3C/script>')</script>
  <script type="text/javascript" src="js/libs/cookies.js"></script> 
  <script type="text/javascript" src="js/libs/underscore.js"></script> 
  <script type="text/javascript" src="js/libs/bookmark_bubble.js"></script> 
  <!--<script type="text/javascript" src="js/libs/underscore.string.js"></script>-->
  <script type="text/javascript" src="js/ttc.js"></script> 

  <script>
    var _gaq=[['_setAccount','UA-335824-12'],['_trackPageview']];
    (function(d,t){var g=d.createElement(t),s=d.getElementsByTagName(t)[0];g.async=1;
    g.src=('https:'==location.protocol?'//ssl':'//www')+'.google-analytics.com/ga.js';
    s.parentNode.insertBefore(g,s)}(document,'script'));
  </script>
</body> 
</html> 
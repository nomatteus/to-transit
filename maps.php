<?php

//require('json.php');

?><!DOCTYPE html> 
<html> 
<head> 
<meta name="viewport" content="initial-scale=1.0, user-scalable=no" /> 
<meta http-equiv="content-type" content="text/html; charset=UTF-8"/> 
<style type="text/css"> 
  html { height: 100% }
  body { height: 100%; margin: 0px; padding: 0px }
  #map_canvas { height: 100%;width: 100%; }

  #controls {position:absolute;top:15px;left:100px;width:10px;height:10px;}
</style> 
<title>TTC</title> 
<script type="text/javascript"> 
  // TO DO Remove this to load this async (ajax)
  //var vehicles = <?php// echo $vechicles_json;?>;

  // Loads the Google Map API and runs callback function (init()) when done
  function loadScript() {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "http://maps.google.com/maps/api/js?v=3&sensor=true&callback=init";
    document.body.appendChild(script);
  }
  
  window.onload = loadScript;
</script> 
</head> 
<body> 
  <div id="map_canvas"></div> 


  <div id="controls">
    <a href="#">Update</a>
  </div>

  <script src="//ajax.googleapis.com/ajax/libs/jquery/1.5.2/jquery.min.js"></script>
  <script>window.jQuery || document.write('<script src="js/libs/jquery-1.5.2.min.js">\x3C/script>')</script>
  <script type="text/javascript" src="js/libs/underscore.js"></script> 
  <script type="text/javascript" src="js/libs/underscore.string.js"></script> 
  <script type="text/javascript" src="js/ttc.js"></script> 

  <script>
    var _gaq=[['_setAccount','UA-XXXXX-X'],['_trackPageview']];
    (function(d,t){var g=d.createElement(t),s=d.getElementsByTagName(t)[0];g.async=1;
    g.src=('https:'==location.protocol?'//ssl':'//www')+'.google-analytics.com/ga.js';
    s.parentNode.insertBefore(g,s)}(document,'script'));
  </script>
</body> 
</html> 
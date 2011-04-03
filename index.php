<!DOCTYPE html> 
<html> 
<head> 
<meta name="viewport" content="initial-scale=1.0, user-scalable=no" /> 
<meta http-equiv="content-type" content="text/html; charset=UTF-8"/> 
<style type="text/css"> 
  html { height: 100% }
  body { height: 100%; margin: 0px; padding: 0px; font:normal 11px/22px Arial, sans-serif; }
  #map_canvas { height: 100%;width: 100%; }

  #controls {position:absolute;top:15px;left:100px;border:1px solid #ccc;padding:5px 10px;
                /* rounded corners */
                   -moz-border-radius: 5px; 
                -webkit-border-radius: 5px; 
                        border-radius: 5px; 
                /* background gradient */
                background-color: #ffffff;
                background-image: -moz-linear-gradient(top, #ffffff, #eeeeee); 
                background-image: -o-linear-gradient(top, #ffffff, #eeeeee); 
                background-image: -webkit-gradient(linear,left top,left bottom,color-stop(0, #ffffff),color-stop(1, #eeeeee)); 
                background-image: -webkit-linear-gradient(#ffffff, #eeeeee); 
                background-image: linear-gradient(top, #ffffff, #eeeeee);
                          filter: progid:DXImageTransform.Microsoft.gradient(startColorStr='#ffffff', EndColorStr='#eeeeee'); 
                /* box shadow */
                   -moz-box-shadow: 2px 2px 4px #999; 
                -webkit-box-shadow: 2px 2px 4px #999; 
                        box-shadow: 2px 2px 4px #999; 
                }
      #update {}
      #show-routes {}
      #show-routes input {float:left;margin:4px 5px 0 0;clear:left;}
      #show-routes label {display:block;float:left;}
</style> 
<title>TTC</title> 
<script type="text/javascript"> 
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
    <a href="#" id="update">Update</a>
    <div id="show-routes"></div>
  </div>

  <script src="//ajax.googleapis.com/ajax/libs/jquery/1.5.2/jquery.min.js"></script>
  <script>window.jQuery || document.write('<script src="js/libs/jquery-1.5.2.min.js">\x3C/script>')</script>
  <script type="text/javascript" src="js/libs/cookies.js"></script> 
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
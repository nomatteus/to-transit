<?php
/*
 * File to convert NextBus' XML Feeds to JSON format
 * 	that our script will use.
 */

/* All route info */
$routes = json_decode(file_get_contents("./routes.json"))->routes;
// print_r($routes);

$r_get = (isset($_GET['r'])) ? strtolower($_GET['r']) : 'all';

function get_route($tag, $routes) {
  foreach ($routes as $r) {
    if ($tag == $r->tag) {
      return $r;
    }
  }
  return null;
}

$route = get_route($r_get, $routes);

$filename = "cache/vehicleLocations.".(is_null ($route) ? "all" : $route->tag).".xml";

// Cache data for X seconds
if (!file_exists($filename) || ((time() - filemtime($filename)) >= 10)) {
  $file_contents = file_get_contents("https://retro.umoiq.com/service/publicXMLFeed?command=vehicleLocations&a=ttc&r=" . (is_null ($route) == "all" ? "" : $route->tag) . "&t=0");
  file_put_contents($filename, $file_contents);
}

$vehicle_locations_xml = simplexml_load_file($filename);

//print_r($vehicle_locations_xml);

$vehicles = array();

foreach ($vehicle_locations_xml->vehicle as $vehicle) {
  //print_r($vehicle);
  /* Set a simpler direction tag with "N", "S", "E", or "W".
   * April 6, 2011 - Direction tags now look like this: 510_0_510A
   * Depending on the route (east/west or north/south route), dir tag means:
   * _1_ is Westbound OR Northbound
   * _0_ is Eastbound OR Southbound
   * 
   * 510 Spadina & 511 Bathurst are only North/South Routes
   * The rest are East/West
   */
  $dirTag = (string) $vehicle['dirTag'];
  $dirTagParts = explode("_", $dirTag);
  
  if (is_array($dirTagParts) && count($dirTagParts) > 2) {
    $vehicle_route = get_route($dirTagParts[0], $routes);
    $direction_num = (int) $dirTagParts[1]; // 1 or 0
    $routeSub = $dirTagParts[2];
    $type = $vehicle_route->type;

    // Handle special suffixes
    if (str_ends_with ($routeSub, "rush")) {
      $type = $type.", rush hour extra";
      $routeSub = substr ($routeSub, 0, strlen ($routeSub) - 4); // Strip the suffix
    } else if (str_ends_with ($routeSub, "bus")) {
      $type = "Bus"; // Used with streetcars to signify a replacement bus
      $routeSub = substr ($routeSub, 0, strlen ($routeSub) - 3); // Strip the suffix
    } else if (str_ends_with ($routeSub, "con")) {
      // Not clear what this means, but used with streetcars
      $routeSub = substr ($routeSub, 0, strlen ($routeSub) - 3); // Strip the suffix
    }
  } else if (is_null ($route)) {
    // No default route. We cannot add this vehicle, so continue to next
    continue;
  } else {
    $dirTag = null;
    $vehicle_route = $route; // Use the default route, which should be the same anyway
    $direction_num = null;
    $routeSub = null;
    $type = $route->type.", out of service";
  }

  switch($vehicle_route->direction) {
    case "NorthSouth":
      if ($direction_num === 0)
        $direction = "S";
      else if ($direction_num === 1)
        $direction = "N";
      else
        $direction = null;
      break;
    case "EastWest":
      if ($direction_num === 1)
        $direction = "W";
      else if ($direction_num === 0)
        $direction = "E";
      else
        $direction = null;
      break;
    default:
      $direction = null;
      break;
  }

  if (stripos($routeSub, $vehicle_route->tag) === 0) {
    // Route sub has vehicle route in it at beginning, so show it
    $labelText = $routeSub;
  } else {
    // Otherwise, don't use route sub (there's lots of weird letters showing up in the
    //  route sub, so I'm not going to display it, unless I can make sense of them!)
    $labelText = $vehicle_route->tag;
  }

  $vehicles[] = array(
    // Need to cast attributes to a (string), else it will be treated as an object
    'id'      			    => (string) $vehicle['id'],
    'lat'     			    => (string) $vehicle['lat'],
    'lng'     			    => (string) $vehicle['lon'],
    'dirTag'            => $dirTag,
    'routeSub' 			    => $routeSub,
    'dir'     			    => $direction,
    'labelText'         => $labelText,
    'heading' 			    => (string) $vehicle['heading'],
    'speed' 	  		    => (string) $vehicle['speedKmHr'],
    'secsSinceReport' 	=> (string) $vehicle['secsSinceReport'],
    'type'              => ucfirst ($type),
    'route'             => (string) $vehicle_route->tag
  );
}

$vehicles_json = json_encode(array("vehicles" => $vehicles));

header('Content-Type: application/json; charset=utf-8');
echo $vehicles_json;
?>

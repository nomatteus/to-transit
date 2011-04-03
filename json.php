<?php
/*
 * File to convert NextBus' XML Feeds to JSON format
 * 	that our script will use.
 */

// Get route from $_GET['r'] variable, or set to default
// TODO: Add in check for valid route
$route = (isset($_GET['r']) && (int) $_GET['r'] != 0) ? (int) $_GET['r'] : '510';

$filename = "cache/vehicleLocations.".$route.".xml";

// Cache data for X seconds
if (!file_exists($filename) || ((time() - filemtime($filename)) >= 10)) {
  $file_contents = file_get_contents("http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=ttc&r=" . $route . "&t=0");
  file_put_contents($filename, $file_contents);
}

$vehicle_locations_xml = simplexml_load_file($filename);

//print_r($vehicle_locations_xml);

$vehicles = array();

foreach ($vehicle_locations_xml->vehicle as $vehicle) {
  //print_r($vehicle);
  // Set a simpler direction tag with "N", "S", "E", or "W". 
  $dirTag = (string) $vehicle['dirTag'];
  if (stripos($dirTag, "southbound") !== false)
    $direction = "S";
  else if (stripos($dirTag, "northbound") !== false)
    $direction = "N";
  else
    $direction = "null"; //default

  $vehicles[] = array(
    // Need to cast attributes to a (string), else it will be treated as an object
    'id'      => (string) $vehicle['id'],
    'lat'     => (string) $vehicle['lat'],
    'lng'     => (string) $vehicle['lon'],
    'dirTag'  => $dirTag,
    'dir'     => $direction
    );
  /*$vechicle->id;
  $vechicle->routeTag;
  $vechicle->dirTag;
  $vechicle->lat;
  $vechicle->lon;
  $vechicle->secsSinceReport;
  $vechicle->predictable;
  $vechicle->heading;
  $vechicle->speedKmHr;*/
/*             [id] => 4040
                            [routeTag] => 510
                            [dirTag] => 510_northbound
                            [lat] => 43.657883
                            [lon] => -79.400017
                            [secsSinceReport] => 16
                            [predictable] => true
                            [heading] => 344
                            [speedKmHr] => 0.0*/
}

$vehicles_json = json_encode(array("vehicles" => $vehicles));

echo $vehicles_json;

/*[
  {"id":{"0":"4129"},"lat":{"0":"43.639465"},"lon":{"0":"-79.3829499"},"dirTag":{"0":"510_southbound"}},
  {"id":{"0":"4040"},"lat":{"0":"43.666683"},"lon":{"0":"-79.403519"},"dirTag":{"0":"510_southbound"}},
  {"id":{"0":"4118"},"lat":{"0":"43.649017"},"lon":{"0":"-79.396469"},"dirTag":{"0":"510_southbound"}},
  {"id":{"0":"4053"},"lat":{"0":"43.652332"},"lon":{"0":"-79.39782"},"dirTag":{"0":"510_southbound"}},
  {"id":{"0":"4132"},"lat":{"0":"43.666683"},"lon":{"0":"-79.403397"},"dirTag":{"0":"510_southbound"}},
  {"id":{"0":"4005"},"lat":{"0":"43.665749"},"lon":{"0":"-79.403183"},"dirTag":{"0":"510_southbound"}},
  {"id":{"0":"4074"},"lat":{"0":"43.6487849"},"lon":{"0":"-79.396416"},"dirTag":{"0":"510_northbound"}}
  ]*/

?>
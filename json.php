<?php
/*
 * File to convert GTFS-RT feeds to JSON format for our script
 */

define('TRIP_CACHE_TTL', 86400);        // 1 day (GTFS static data)
define('VEHICLE_CACHE_TTL', 10);        // 10 seconds (Vehicle live positions)
// All streetcars in Toronto are 5xx
define('STREETCAR_ROUTE_MIN', 500);
define('STREETCAR_ROUTE_MAX', 600);

/* All route info */
$routes = json_decode(file_get_contents("./routes.json"))->routes;

$r_get = (isset($_GET['r'])) ? strtolower($_GET['r']) : 'all';

function get_route($tag, $routes) {
  foreach ($routes as $r) {
    if ($tag == $r->tag) {
      return $r;
    }
  }
  return null;
}

// Strip trailing letter suffix to get base route number
// e.g. "501A" -> "501", "60" -> "60"
function get_route_base($route_id) {
  return preg_replace('/[A-Za-z]$/', '', $route_id);
}

// Download GTFS static data ZIP, returns true on success
function download_gtfs_zip($zip_file) {
  if (!is_dir('cache')) {
    mkdir('cache', 0755, true);
  }

  $gtfs_data = @file_get_contents("https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/bd4809dd-e289-4de8-bbde-c5c00dafbf4f/resource/28514055-d011-4ed7-8bb0-97961dfe2b66/download/SurfaceGTFS.zip");
  if ($gtfs_data === false) {
    error_log("Failed to download GTFS data");
    return false;
  }
  file_put_contents($zip_file, $gtfs_data);
  return true;
}

// Extract and parse trips.txt from GTFS ZIP into trip_variants array
function parse_trips_from_zip($zip_file, $route_id = null) {
  $zip = new ZipArchive;
  if ($zip->open($zip_file) !== TRUE) {
    error_log("Failed to open ZIP file");
    return null;
  }

  $trips_content = $zip->getFromName('trips.txt');
  $zip->close();

  if ($trips_content === false) {
    error_log("Failed to extract trips.txt from ZIP");
    return null;
  }

  $trip_variants = array();
  $lines = explode("\n", $trips_content);
  if (count($lines) == 0) {
    error_log("trips.txt is empty");
    return null;
  }

  $headers = str_getcsv(array_shift($lines)); // Get headers

  // Find column indices
  $trip_id_idx = array_search('trip_id', $headers);
  $route_id_idx = array_search('route_id', $headers);
  $variant_idx = array_search('trip_short_name', $headers);
  $direction_idx = array_search('direction_id', $headers);

  if ($trip_id_idx === false) {
    error_log("Could not find trip_id column in trips.txt");
    return null;
  }

  error_log("Parsing trips.txt for route '$route_id': trip_id_idx=$trip_id_idx, route_id_idx=$route_id_idx, variant_idx=$variant_idx, direction_idx=$direction_idx");

  $variant_count = 0;
  foreach ($lines as $line) {
    if (empty(trim($line))) continue;
    $fields = str_getcsv($line);
    if (count($fields) > $trip_id_idx) {
      // Filter by route_id if specified
      if ($route_id && $route_id_idx !== false && count($fields) > $route_id_idx) {
        $trip_route_id = $fields[$route_id_idx];
        if ($trip_route_id !== $route_id) {
          continue;
        }
      }

      $trip_id = $fields[$trip_id_idx];
      $variant = ($variant_idx !== false && count($fields) > $variant_idx) ? $fields[$variant_idx] : '';
      $direction_id = ($direction_idx !== false && count($fields) > $direction_idx) ? $fields[$direction_idx] : null;

      $trip_variants[$trip_id] = array(
        'variant' => $variant,
        'direction_id' => $direction_id
      );
      $variant_count++;
    }
  }

  error_log("Found $variant_count trips with variants");
  return $trip_variants;
}

// Load trip variants mapping (trip_id -> route variant like "A", "B", "C")
function load_trip_variants($route_id = null) {
  $cache_file = "cache/trip_variants." . ($route_id ? $route_id : "all") . ".json";

  // Refresh cache daily
  if (!file_exists($cache_file) || ((time() - filemtime($cache_file)) >= TRIP_CACHE_TTL)) {
    error_log("Refreshing trip variants cache...");

    $zip_file = "cache/ttc_gtfs.zip";

    if (!download_gtfs_zip($zip_file)) {
      // Fall back to existing cache if available
      if (file_exists($cache_file)) {
        $cached = file_get_contents($cache_file);
        return json_decode($cached, true);
      }
      return array();
    }

    $trip_variants = parse_trips_from_zip($zip_file, $route_id);
    if ($trip_variants === null) {
      return array();
    }

    file_put_contents($cache_file, json_encode($trip_variants));
    return $trip_variants;
  }

  // Load from cache
  $cached = @file_get_contents($cache_file);
  if ($cached === false) {
    error_log("Failed to read cache file");
    return array();
  }
  $variants = json_decode($cached, true);
  if ($variants === null) {
    error_log("Failed to decode cache JSON");
    return array();
  }
  return $variants;
}

$route = get_route($r_get, $routes);

// Load trip variants for the specific route (or all if route is 'all')
$route_id = ($r_get !== 'all' && $route) ? $route->tag : null;
$trip_variants = load_trip_variants($route_id);

$filename = "cache/vehicleLocations.".(is_null($route) ? "all" : $route->tag).".txt";

// Cache data for X seconds
if (!file_exists($filename) || ((time() - filemtime($filename)) >= VEHICLE_CACHE_TTL)) {
  $file_contents = @file_get_contents("https://bustime.ttc.ca/gtfsrt/vehicles?debug");
  if ($file_contents === false) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array("error" => "Failed to fetch GTFS-RT data", "vehicles" => array()));
    exit;
  }

  // Filter entities by route before caching
  if ($r_get !== 'all') {
    $entities = preg_split('/^entity \{$/m', $file_contents);
    $header = array_shift($entities); // Keep the header
    $filtered_entities = array();

    foreach ($entities as $entity_text) {
      // Extract route_id to filter
      preg_match('/route_id: "([^"]+)"/', $entity_text, $route_id_match);
      if ($route_id_match) {
        $entity_route_id = $route_id_match[1];
        $requested_route_base = get_route_base($r_get);
        $entity_route_base = get_route_base($entity_route_id);

        if ($entity_route_base === $requested_route_base) {
          $filtered_entities[] = $entity_text;
        }
      }
    }

    // Reconstruct the debug format with only filtered entities
    $file_contents = $header . 'entity {' . implode('entity {', $filtered_entities);
  }

  file_put_contents($filename, $file_contents);
}

$gtfsrt_data = file_get_contents($filename);

$vehicles = array();

// Parse the debug text format
$entities = preg_split('/^entity \{$/m', $gtfsrt_data);
array_shift($entities); // Remove header

foreach ($entities as $entity_text) {
  // Extract vehicle data using regex
  preg_match('/vehicle \{\s+id: "([^"]+)"/', $entity_text, $vehicle_id_match);
  preg_match('/route_id: "([^"]+)"/', $entity_text, $route_id_match);
  preg_match('/latitude: ([\d\.]+)/', $entity_text, $lat_match);
  preg_match('/longitude: (-?[\d\.]+)/', $entity_text, $lng_match);
  preg_match('/bearing: ([\d\.]+)/', $entity_text, $bearing_match);
  preg_match('/speed: ([\d\.]+)/', $entity_text, $speed_match);
  preg_match('/timestamp: (\d+)/', $entity_text, $timestamp_match);
  preg_match('/trip_id: "([^"]+)"/', $entity_text, $trip_id_match);
  preg_match('/occupancy_status: (\w+)/', $entity_text, $occupancy_match);

  if (!$vehicle_id_match || !$lat_match || !$lng_match) {
    continue; // Skip if missing essential data
  }

  $trip_id = isset($trip_id_match[1]) ? $trip_id_match[1] : null;

  // Skip vehicles with negative trip_id (out of service)
  if ($trip_id && strpos($trip_id, '-') === 0) {
    continue;
  }

  $vehicle_id = $vehicle_id_match[1];
  $route_id = isset($route_id_match[1]) ? $route_id_match[1] : null;
  $lat = $lat_match[1];
  $lng = $lng_match[1];
  $bearing = isset($bearing_match[1]) ? $bearing_match[1] : "0";
  $speed_ms = isset($speed_match[1]) ? $speed_match[1] : "0";
  $speed_kmh = round($speed_ms * 3.6, 2); // Convert m/s to km/h
  $timestamp = isset($timestamp_match[1]) ? $timestamp_match[1] : time();
  $secsSinceReport = time() - $timestamp;

  // Get route variant and direction_id from trip_id
  $route_variant = null;
  $trip_direction_id = null;
  if ($trip_id && isset($trip_variants[$trip_id])) {
    $trip_data = $trip_variants[$trip_id];
    $route_variant = !empty($trip_data['variant']) ? $trip_data['variant'] : null;
    $trip_direction_id = isset($trip_data['direction_id']) ? $trip_data['direction_id'] : null;
  }

  // Skip if no route_id and we're filtering by route
  if ($r_get !== 'all' && !$route_id) {
    continue;
  }

  // Get route info
  $vehicle_route = $route_id ? get_route($route_id, $routes) : null;

  // Filter by requested route
  $requested_route_base = get_route_base($r_get);
  $vehicle_route_base = $route_id ? get_route_base($route_id) : '';

  if ($r_get !== 'all' && $vehicle_route_base !== $requested_route_base) {
    continue;
  }

  // Determine direction based on direction_id from GTFS
  $direction = null;
  if ($vehicle_route && $trip_direction_id !== null) {
    if ($vehicle_route->direction === "NorthSouth") {
      // 1 = Northbound, 0 = Southbound
      $direction = ($trip_direction_id == 1) ? "N" : "S";
    } elseif ($vehicle_route->direction === "EastWest") {
      // 1 = Eastbound, 0 = Westbound
      $direction = ($trip_direction_id == 1) ? "E" : "W";
    }
  }

  // Determine type (streetcar for 500-series routes)
  $route_num = intval($route_id);
  $type = ($route_num >= STREETCAR_ROUTE_MIN && $route_num < STREETCAR_ROUTE_MAX) ? "Streetcar" : "Bus";

  // Use vehicle_route type if available
  if ($vehicle_route) {
    $type = ucfirst($vehicle_route->type);
  }

  // Build route label with variant
  $labelText = $route_id ? $route_id : "Unknown";
  $routeTag = $route_id ? $route_id : "0";
  $routeSub = $route_id;

  if ($route_variant) {
    $labelText = $route_id . $route_variant;
    $routeSub = $route_id . $route_variant;
  }

  // Build dirTag (simplified - we don't have the old format anymore)
  $dirTag = $trip_id;

  // Get raw occupancy_status if available
  $occupancy_status = isset($occupancy_match[1]) ? $occupancy_match[1] : null;

  $vehicles[] = array(
    'id'              => $vehicle_id,
    'lat'             => $lat,
    'lng'             => $lng,
    'dirTag'          => $dirTag,
    'routeSub'        => $routeSub,
    'routeBranch'     => $route_variant, // Now we have the route branch!
    'dir'             => $direction,
    'labelText'       => $labelText,
    'heading'         => $bearing,
    'speed'           => (string)$speed_kmh,
    'secsSinceReport' => (string)$secsSinceReport,
    'type'            => $type,
    'route'           => $routeTag,
    'occupancyStatus' => $occupancy_status
  );
}

$vehicles_json = json_encode(array("vehicles" => $vehicles));

header('Content-Type: application/json; charset=utf-8');
echo $vehicles_json;
?>

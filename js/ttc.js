/*
 * Initialize App - This function is called right
 * 	after the Google Maps API is loaded.
 */
function init() {


/*
 *	See: http://www.tdmarketing.co.nz/blog/2011/03/09/create-marker-with-custom-labels-in-google-maps-api-v3/
 *		and http://blog.mridey.com/2009/09/label-overlay-example-for-google-maps.html
*/
function Label(opt_options) {
     // Initialization
     this.setValues(opt_options);

     // Here go the label styles
     var span = this.span_ = document.createElement('span');
     span.style.cssText = 'position: absolute; left: -18px; top: -38px; ' +
                          'white-space: nowrap;color:#000000;' +
                          'padding: 0px 2px 0 3px;font-family: helvetica neue, arial; font-weight: bold;' +
                          'font-size: 8px;background-color: #FFFFFF;border: 1px solid black;' +
                          'border-radius: 5px 3px 3px 5px;text-shadow: none;line-height:10px;';


     var div = this.div_ = document.createElement('div');
     div.appendChild(span);
     div.style.cssText = 'position: absolute; display: none';
};

// Leaflet label implementation - converted from Google Maps overlay
function createLeafletLabel(options) {
  var label = L.divIcon({
    className: 'leaflet-vehicle-label',
    html: '<span style="position: absolute; left: -18px; top: -38px; white-space: nowrap; color: #000000; padding: 0px 2px 0 3px; font-family: helvetica neue, arial; font-weight: normal; font-size: 8px; background-color: #FFFFFF; border: 1px solid black; border-radius: 5px 3px 3px 5px; text-shadow: none; line-height: 10px;">' + options.text + '</span>',
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
  return label;
}

// Create a user location marker (blue dot with white border and shadow)
function createUserLocationMarker(latlng) {
  var userDot = L.circleMarker(latlng, {
    color: 'white',
    fillColor: '#4285f4',
    fillOpacity: 1,
    weight: 3,
    radius: 8,
    className: 'user-location-shadow'
  });

  return userDot;
}

var Route = {};

Route.List = _.sortBy(data.routes, function(route){
	var tagInt = parseInt(route.tag);
	if (tagInt > 500 && tagInt < 600) {
		// Make 500 routes (streetcars) jump to top
		tagInt = tagInt - 1000;
	}
	return tagInt;
});

Route.Handler = (function(){
	return {
		init: function() {
			Route.Items = {};
			this.createRoutes();
		},
		createRoutes: function() {
			_.each(Route.List, function(route, list){
				Route.Items[route.tag] = new Route.Instance({
					id: route.tag,
					name: route.name,
					type: route.type,
					direction: route.direction
				});
			});
		}
	}
})();

Route.Instance = function(o) {
	for (var prop in o) {
		this[prop] = o[prop];
	}
	this.init();
}

Route.Instance.prototype = {
	init: function() {
		this.vehicles = {};
		this.isVisible = false;
		this.updateVehicles();
		//console.log(this);
	},
	setVisible: function(isVisible) {
		// Update visibility (boolean)
		if (_.isBoolean(isVisible)){
			this.isVisible = isVisible;
			// Call update vehicles
			this.updateVehicles();
			return true;
		} else {
			// Must pass a boolean!
			return false;
		}
	},
	updateVehicles: function() {
		var that = this;
		// Only update/create if set to visible
		if (this.isVisible) {
			$.ajax({
				url: "json.php",
				dataType: 'json', // Note: could use $.getJSON() as shortcut, but won't
				data: {r: this.id},
				cache: false, // Need to set this for IE especially, to cachebust
				success: function(data, textStatus, jqXHR) {
					_.each(data.vehicles, function(element, index, list){
						// Check if vehicle exists in vehicle array already
						// 	If it exists, update its info
						// 	If doesn't exist, create it
						if (element.id in that.vehicles) {
							// Exists already, so update info
							that.vehicles[element.id].update(element);
						} else {
							that.vehicles[element.id] = new Vehicle.Instance(element);
						}
					});
				}
			});
		} else {
			// Hide all vehicles in route
			_.each(this.vehicles, function(element, index, list){
				element.hideMarker();
			});
		}
	},
	closeInfoWindows: function() {
		// Popups are now handled globally by the map
		// No need to iterate through individual vehicles
	}
};

var Vehicle = {};

Vehicle.Instance = function(o) {
	for (var prop in o) {
		this[prop] = o[prop];
	}
	this.init();
}

Vehicle.Instance.prototype = {
	marker: {},
	init: function() {
		this.createMarker();
	},
	update: function(el) {
		// Save current lat/lon
		var lat = this.lat;
		var lng = this.lng;

		// Update vehicle info
		for (var prop in el) {
			this[prop] = el[prop];
		}

		// If position has changed, update marker position
		if (lat != this.lat || lng != this.lng) {
			this.updateMarkerPosition();
		}

		this.updateMarkerIcon();
		this.updateMarkerInfoWindow();

		// Make sure marker is showing
		this.showMarker();
	},
	hideMarker: function() {
		if (this.labelMarker) {
			window.map.removeLayer(this.labelMarker);
		}
		window.map.removeLayer(this.marker);
	},
	showMarker: function() {
		// Add marker to map if not already added
		if (!window.map.hasLayer(this.marker)) {
			this.marker.addTo(window.map);
		}
		if (this.labelMarker && !window.map.hasLayer(this.labelMarker)) {
			this.labelMarker.addTo(window.map);
		}
	},
	updateMarkerPosition: function() {
		this.marker.setLatLng([this.lat, this.lng]);
		if (this.labelMarker) {
			this.labelMarker.setLatLng([this.lat, this.lng]);
		}
	},
	updateMarkerInfoWindow: function() {
		var contentString = '<div class="info-window">' + 
			'<h1 class="vehicle-id">Vehicle #' + this.id + '</h1>' +
			'<div class="type">Type: ' + this.type + '</div>' +
			(this.routeSub != null ? '<div class="route-sub">Route Sub: ' + this.routeSub + '</div>' : '') +
			(this.dir != null ? '<div class="dir-tag">Direction: ' + this.dir + '</div>' : '') +
			'<div class="headingId">Heading: ' + this.heading + '\u00B0</div>' +
			'<div class="speed">Speed: ' + this.speed + ' km/h</div>' +
			'<div class="headingId">Reported: ' + this.secsSinceReport + ' sec ago</div>' +
			//'<div class="dir-tag">Direction Tag: ' + this.dirTag + '</div>' +
			'</div>';

		// Check if popup is currently open for this marker
		var isPopupOpen = this.marker.isPopupOpen();

		// Bind popup to marker with offset to align with top of icon
		this.marker.bindPopup(contentString, {
			offset: [0, -43] // Negative Y offset to position popup at top of icon
		});

		// If popup was open, update its content immediately
		if (isPopupOpen) {
			this.marker.openPopup();
		}
	},
	updateMarkerIcon: function() {
		// Use "new" marker image for all streetcars. Use grey versions for vehicles that are likely out of service.
		var markerImage = (this.type.toLowerCase ().startsWith ("streetcar")) ?
			(this.dirTag == null ? window.markerImageStreetcarGrey : window.markerImageStreetcar) :
			(this.dirTag == null ? window.markerImageBusGrey : window.markerImageBusDefault);

		// Update marker icon - use streetcar-new for all streetcars
		var iconUrl = (this.type == "streetcar") ?
			window.markerImageStreetcar : markerImage;

		this.marker.setIcon(L.icon({
			iconUrl: iconUrl,
			iconSize: [42, 43],
			iconAnchor: [21, 43]  // Bottom center anchor
		}));

		// Set consistent z-index for vehicle icon
		this.marker.setZIndexOffset(100);

		// Create/update label marker with CSS classes
		var labelText = '<span class="route-number">' + this.route + '</span>';
		if (this.routeBranch != null) {
			labelText += '<span class="route-branch">' + this.routeBranch + '</span>';
		}
		if (this.dir != null) {
			labelText += ' <span class="route-direction">' + this.dir + '</span>';
		}

		if (this.labelMarker) {
			window.map.removeLayer(this.labelMarker);
		}

		this.labelMarker = L.marker([this.lat, this.lng], {
			icon: createLeafletLabel({text: labelText}),
			zIndexOffset: 200  // Always above vehicle icons (which are at 100)
		});
	},
	createMarker: function() {
		//console.log(this.dir);
		// Create marker object
		this.marker = L.marker([this.lat, this.lng], {
			icon: L.icon({
				iconUrl: window.markerImageStreetcarDefault,
				iconSize: [42, 43],
				iconAnchor: [21, 43]  // Bottom center anchor
			}),
			zIndexOffset: 100  // Consistent z-index for all vehicle icons
		});
		this.labelMarker = null; // Will hold the label marker
		// set the marker icon
		this.updateMarkerIcon();
		this.updateMarkerPosition();
		this.updateMarkerInfoWindow();
		this.showMarker();
		this.addEventListeners();
	},
	addEventListeners: function() {
		/* Move event listeners from updateMarker method, so we don't add a new listener each time marker is updated. */
		var that = this;
		this.marker.on('click', function() {
			// Close any existing info windows first
			Controls.closeInfoWindows();
			// Then display the current one!
  			that.marker.openPopup();
		});
	},
	getId: function() {return this.id;},
	getLat: function() {return this.lat;},
	getLng: function() {return this.lng;},
	getRoute: function() {return this.route;},
	getDirTag: function() {return this.dirTag;},
	getDir: function() {return this.dir;}
}


var Controls = (function() {
	return {
		init: function() {
			this.addListeners();
			this.startAutoUpdate();
			this.createShowRoutes();
			this.readPrefsFromCookie();
		},
		createShowRoutes: function() {
			var that = this;
			// Populate "Show routes:" box to allow toggling display of routes on/off
			$showRoutes = $("#show-routes");
			$showRoutes.append('Show:<br>');
			_.each(Route.List, function(route, list){
				$showRoutes.append('<div class="check"><input type="checkbox" name="route[]" id="'+route.tag+'"><label for="'+route.tag+'">'+route.tag + " - " + route.name+'</label></div>');
			});
			$showRoutes.find("input").bind($.browser.msie? "propertychange": "change", function(){
				var isChecked = $(this).attr("checked");
				var routeId = this.id; // don't need jquery to get id, right?
				if (isChecked) {
					// Set visible => true
					Route.Items[routeId].setVisible(true);
				} else {
					// Set visible => false
					Route.Items[routeId].setVisible(false);
				}
				that.updateVehicles();
				that.writePrefsToCookie();
				//console.log(that);
			});
		},
		writePrefsToCookie: function() {
			// Remember checked boxes in a string of route #'s separated by commas
			var checkedBoxes = [];
			$("#show-routes input").each(function(){
				if ($(this).attr("checked") == true) {
					//console.log(this.id);
					checkedBoxes[checkedBoxes.length] = this.id;
				}
				//console.log(checkedBoxes);
			});
			// Save for 30 days
			//console.log(checkedBoxes.join(","));
			createCookie("checkedBoxes", checkedBoxes.join(","), 30);
		},
		readPrefsFromCookie: function() {
			// "Check" boxes that were checked and saved in cookie
			var checkedBoxes = readCookie("checkedBoxes");
			if (checkedBoxes) {
				var routeArray = checkedBoxes.split(",");
				//console.log(routeArray);
			} else {
				// Set default routes!
				var routeArray = ["510", "504"];
			}

			_.each(routeArray, function(routeId){
				//console.log(routeId);
				var $checkbox = $("#"+routeId);
				if (!$checkbox.is(":checked")) {
					// Trigger click, but only if it's not checked already
					$checkbox.click();
				}
			});

		},
		addListeners: function() {
			var that = this;
			$("#update").live("click", function(e) {
				//e.preventDefault();
				that.updateVehicles();
			});
			$("#show-hide-controls").live("click", function(e) {
				$("#show-routes").toggle();
				$("#update").toggle();
				$(this).toggleClass("open");
			});
			$("#about-show").live("click", function(e){
				//e.preventDefault();
				$("#about-content").toggle();
			});
		},
		updateVehicles: function() {
			_.each(Route.Items, function(element, index, list){
				// Call the Route.Instance updateVehicles method -- this will update all vehicles for route
				element.updateVehicles();
			});
		},
		closeInfoWindows: function() {
			// Close all open popups on the map
			window.map.closePopup();
		},
		startAutoUpdate: function() {
			var that = this;
			// Set interval to auto-update every 8 seconds
			window.interval = window.setInterval(function(){that.updateVehicles();}, 1000*8);
			// Clear interval after 15 minutes to avoid people leaving window open and refreshing from server for hours
			/*window.setTimeout(function(){
				clearInterval(window.interval);
				alert("This page has been open for 15 minutes, auto-update is now turned off.\nPlease reload to activate auto-update, or hit the update button to manually update.");
			}, 1000*60*15);*/
		}
	}
})();


	//Route.Handler.init();

	// init map w/ default location/zoom level/etc. (or with geolocation or with prev. saved default)

	// init routes and display on map


	// Initialize Leaflet map with Stadia Maps
    window.map = L.map('map_canvas', {
      center: [43.656967, -79.399651],
      zoom: 14,
      zoomControl: false,  // Disable default zoom control
      attributionControl: false,
	  minZoom: 10,
	  maxZoom: 20
    });
    
    // Add custom zoom control to bottom left
    L.control.zoom({
      position: 'bottomleft'
    }).addTo(window.map);

	// Add Stadia.OSMBright tile layer (no API key needed)
	// Also consider adding as an option: Stadia.StamenTonerLite
	L.tileLayer.provider('Stadia.OSMBright').addTo(window.map);
	
	// Add compact attribution control
	L.control.attribution({
	  prefix: false,  // Remove "Leaflet" prefix
	  position: 'bottomright'
	}).addTo(window.map);
	
    var currentLocation,
    // Bounds rect defined by SW and NE points
    torontoBounds = L.latLngBounds(
      L.latLng(43.564, -79.561), // SW
      L.latLng(43.930, -79.095)  // NE
    );

	 // Initialize user location marker as null (will be created when location is found)
	 window.userloc = null;

    // W3 Geolocation (HTML5) - Use watchPosition for continuous tracking
	 if (navigator.geolocation) {
      console.log('Starting geolocation watch...');
      
      // Store watch ID so we can clear it later if needed
      window.geolocationWatchId = navigator.geolocation.watchPosition(
        function(position) {
        //   console.log('Geolocation update:', position.coords.latitude, position.coords.longitude);
          currentLocation = L.latLng(position.coords.latitude, position.coords.longitude);

          // Create user location marker if it doesn't exist
          if (!window.userloc) {
            // console.log('Creating initial user location marker');
            window.userloc = createUserLocationMarker(currentLocation);
            window.userloc.addTo(window.map);
            
            // Only auto-center map on first location, not updates
            if (torontoBounds.contains(currentLocation)) {
              window.map.setView(currentLocation, 14);
            }
          } else {
            // Update existing marker position
            // console.log('Updating user location marker position');
            window.userloc.setLatLng(currentLocation);
          }
        },
        function(error) {
          console.error('Geolocation error:', error);
          switch(error.code) {
            case error.PERMISSION_DENIED:
              console.warn("User denied geolocation request");
              break;
            case error.POSITION_UNAVAILABLE:
              console.warn("Location information unavailable");
              break;
            case error.TIMEOUT:
              console.warn("Geolocation request timeout");
              break;
            default:
              console.warn("Unknown geolocation error");
              break;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000  // Allow 30 seconds cached position
        }
      );
    } else {
      console.warn('Geolocation not supported by browser');
    }
    // Buses
    window.markerImageBusDefault = 'marker-images/bus-default.png';

    // Buses Grey - For possibly out of service/unknown status
    window.markerImageBusGrey = 'marker-images/bus-grey.png';

    // Streetcar Grey - For possibly out of service/unknown status
    window.markerImageStreetcarGrey = 'marker-images/streetcar-grey.png';

    // Streetcar marker image
    window.markerImageStreetcar = 'marker-images/streetcar-default.png';
    window.markerImageStreetcarDefault = markerImageStreetcar;

	// Init
	Route.Handler.init();
	//Vehicle.Handler.init();
	Controls.init();

}


/* BOOKMARK BUBBLE!
  Copyright 2010 Google Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

/** @fileoverview Example of how to use the bookmark bubble. */

if (window.addEventListener) {
	window.addEventListener('load', function() {
	  window.setTimeout(function() {
	    var bubble = new google.bookmarkbubble.Bubble();

	    var parameter = 'bmb=1';

	    bubble.hasHashParameter = function() {
	      return window.location.hash.indexOf(parameter) != -1;
	    };

	    bubble.setHashParameter = function() {
	      if (!this.hasHashParameter()) {
	        window.location.hash += parameter;
	      }
	    };

	    bubble.getViewportHeight = function() {
	      window.console.log('Example of how to override getViewportHeight.');
	      return window.innerHeight;
	    };

	    bubble.getViewportScrollY = function() {
	      window.console.log('Example of how to override getViewportScrollY.');
	      return window.pageYOffset;
	    };

	    bubble.registerScrollHandler = function(handler) {
	      window.console.log('Example of how to override registerScrollHandler.');
	      window.addEventListener('scroll', handler, false);
	    };

	    bubble.deregisterScrollHandler = function(handler) {
	      window.console.log('Example of how to override deregisterScrollHandler.');
	      window.removeEventListener('scroll', handler, false);
	    };

	    bubble.showIfAllowed();
	  }, 1000);
	}, false);
}

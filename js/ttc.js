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

// MapLibre GL label implementation
function createMapLibreLabel(options) {
  var labelElement = document.createElement('div');
  labelElement.className = 'maplibre-vehicle-label';
  labelElement.style.cssText = 'white-space: nowrap; color: #000000; padding: 0px 2px 0 3px; font-family: helvetica neue, arial; font-weight: normal; font-size: 8px; background-color: #FFFFFF; border: 1px solid black; border-radius: 5px 3px 3px 5px; text-shadow: none; line-height: 10px; pointer-events: none;';
  labelElement.innerHTML = options.text;
  return labelElement;
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

// Animate user location marker to new position
function animateUserLocationTo(marker, targetLatLng, duration) {
  var startLatLng = marker.getLatLng();
  var startTime = Date.now();
  
  var animate = function() {
    var elapsed = Date.now() - startTime;
    var progress = Math.min(elapsed / duration, 1);
    
    // Easing function for smooth animation (ease-out)
    progress = 1 - Math.pow(1 - progress, 3);
    
    // Interpolate between start and target positions
    var lat = startLatLng.lat + (targetLatLng.lat - startLatLng.lat) * progress;
    var lng = startLatLng.lng + (targetLatLng.lng - startLatLng.lng) * progress;
    
    marker.setLatLng([lat, lng]);
    
    // Continue animation if not finished
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
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
			this.labelMarker.remove();
		}
		if (this.marker) {
			this.marker.remove();
		}
	},
	showMarker: function() {
		// Add marker to map if not already added
		if (this.marker) {
			this.marker.addTo(window.map);
		}
		if (this.labelMarker) {
			this.labelMarker.addTo(window.map);
		}
	},
	updateMarkerPosition: function() {
		if (this.marker) {
			this.marker.setLngLat([this.lng, this.lat]); // Note: MapLibre uses [lng, lat]
		}
		if (this.labelMarker) {
			this.labelMarker.setLngLat([this.lng, this.lat]);
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
			'</div>';

		// Store popup content for MapLibre GL
		this.popupContent = contentString;
		
		// If popup exists and is open, update its content
		if (this.popup && this.popup.isOpen()) {
			this.popup.setHTML(contentString);
		}
	},
	updateMarkerIcon: function() {
		// Use "new" marker image for all streetcars. Use grey versions for vehicles that are likely out of service.
		var markerImage = (this.type.toLowerCase().startsWith("streetcar")) ?
			(this.dirTag == null ? window.markerImageStreetcarGrey : window.markerImageStreetcar) :
			(this.dirTag == null ? window.markerImageBusGrey : window.markerImageBusDefault);

		// Update marker icon - use streetcar-new for all streetcars
		var iconUrl = (this.type == "streetcar") ?
			window.markerImageStreetcar : markerImage;

		// Create vehicle icon element
		if (this.marker && this.marker.getElement()) {
			var iconElement = this.marker.getElement();
			iconElement.style.backgroundImage = 'url(' + iconUrl + ')';
			iconElement.style.width = '30px';
			iconElement.style.height = '36px';
			iconElement.style.backgroundSize = 'contain';
			iconElement.style.backgroundRepeat = 'no-repeat';
		}

		// Create/update label marker
		var labelText = '<span class="route-number">' + this.route + '</span>';
		if (this.routeBranch != null) {
			labelText += '<span class="route-branch">' + this.routeBranch + '</span>';
		}
		if (this.dir != null) {
			labelText += ' <span class="route-direction">' + this.dir + '</span>';
		}

		if (this.labelMarker) {
			this.labelMarker.remove();
		}

		var labelElement = createMapLibreLabel({text: labelText});
		this.labelMarker = new maplibregl.Marker({
			element: labelElement,
			anchor: 'bottom-left',
			offset: [-20, -30], // Move left 5px and up 35px to position at top-left of vehicle
			subpixelPositioning: true
		}).setLngLat([this.lng, this.lat]);
	},
	createMarker: function() {
		// Create vehicle icon element
		var iconElement = document.createElement('div');
		iconElement.className = 'maplibre-vehicle-marker';
		iconElement.style.cssText = 'width: 30px; height: 36px; background-size: contain; background-repeat: no-repeat; cursor: pointer;';
		iconElement.style.backgroundImage = 'url(' + window.markerImageStreetcarDefault + ')';

		// Create MapLibre GL marker with custom element (this removes the default marker)
		this.marker = new maplibregl.Marker({
			element: iconElement,
			anchor: 'bottom'  // Anchor at bottom like the original Leaflet markers
		}).setLngLat([this.lng, this.lat]);

		this.labelMarker = null; // Will hold the label marker
		this.popup = null; // Will hold the popup

		// Set the marker icon and create popup
		this.updateMarkerIcon();
		this.updateMarkerPosition();
		this.updateMarkerInfoWindow();
		this.showMarker();
		this.addEventListeners();
	},
	addEventListeners: function() {
		var that = this;
		
		// Wait for marker to be added to map, then add click listener
		var addClickListener = function() {
			var element = that.marker.getElement();
			if (element) {
				element.addEventListener('click', function(e) {
					e.stopPropagation(); // Prevent map click
					
					// Close any existing popups first
					Controls.closeInfoWindows();
					
					// Create and show popup
					if (!that.popup) {
						that.popup = new maplibregl.Popup({
							anchor: 'bottom',
							offset: [0, -42], // Offset to position above marker
							closeButton: true,
							closeOnClick: true,
							focusAfterOpen: false,
							subpixelPositioning: true,
							className: "streetcar-details-popup"
						});
					}
					
					that.popup
						.setLngLat([that.lng, that.lat])
						.setHTML(that.popupContent)
						.addTo(window.map);
				});
			}
		};
		
		// Add listener immediately if element exists, otherwise wait
		if (this.marker.getElement()) {
			addClickListener();
		} else {
			// Wait for next tick
			setTimeout(addClickListener, 0);
		}
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
			var popups = document.getElementsByClassName('maplibregl-popup');
			for (var i = 0; i < popups.length; i++) {
				popups[i].remove();
			}
		},
		startAutoUpdate: function() {
			var that = this;
			// Set interval to auto-update every 8 seconds
			window.interval = window.setInterval(function(){that.updateVehicles();}, 1000*8);
		}
	}
})();


	//Route.Handler.init();

	// init map w/ default location/zoom level/etc. (or with geolocation or with prev. saved default)

	// init routes and display on map

	// Add PMTiles protocol
    let protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);

    // Initialize MapLibre GL map with basic style first to debug
    window.map = new maplibregl.Map({
      container: 'map_canvas',
      style: 'map-styles/osm-bright.json',
      center: [-79.399651, 43.656967], // Note: MapLibre uses [lng, lat] format
	  // Restrict map area to Toronto area (we only have tiles for this area, so avoids showing grey unrendered areas of the map)
	  maxBounds: [
		[-80.155188,43.190949],
		[-78.667731,44.115390]
	  ],
      zoom: 14,
      minZoom: 10,
      maxZoom: 20
    });

    
    // Add navigation controls (zoom buttons)
    window.map.addControl(new maplibregl.NavigationControl(), 'bottom-left');
    
    // Add geolocation control (current location button)
    var geolocate = new maplibregl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 30000
        },
		fitBoundsOptions: {
			// Limit zoom to this maxZoom when moving to user's current location
			maxZoom: 14,
		},
        trackUserLocation: true,
		showUserLocation: true,
        showUserHeading: false,
        showAccuracyCircle: false
    });
    
    window.map.addControl(geolocate, 'bottom-left');
    
    // Automatically trigger geolocation on map load
    window.map.on('load', function() {
        geolocate.trigger();
    });
    
    // Add locate me button (commented out for now)
    /*
    var LocateControl = L.Control.extend({
      options: {
        position: 'bottomleft'
      },
      onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        var button = L.DomUtil.create('a', 'leaflet-control-locate', container);
        button.innerHTML = '⌖';
        button.href = '#';
        button.title = 'Show my location';
        
        L.DomEvent.on(button, 'click', function(e) {
          e.preventDefault();
          if (window.userloc && currentLocation) {
            window.map.setView(currentLocation, 16);
          } else {
            // No location available, request it
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(function(position) {
                var newLocation = L.latLng(position.coords.latitude, position.coords.longitude);
                window.map.setView(newLocation, 16);
              });
            }
          }
        });
        
        return container;
      }
    });
    
    new LocateControl().addTo(window.map);
    */
	
    // High-res marker images with shadow (@2x)
    window.markerShadow = 'marker-images/shadow@2x.png';
    
    // Buses
    window.markerImageBusDefault = 'marker-images/bus-default@2x.png';

    // Buses Grey - For possibly out of service/unknown status
    window.markerImageBusGrey = 'marker-images/bus-grey@2x.png';

    // Streetcar Grey - For possibly out of service/unknown status
    window.markerImageStreetcarGrey = 'marker-images/streetcar-grey@2x.png';

    // Streetcar marker image
    window.markerImageStreetcar = 'marker-images/streetcar-default@2x.png';
    window.markerImageStreetcarDefault = window.markerImageStreetcar;

	// Init routes and controls
	Route.Handler.init();
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

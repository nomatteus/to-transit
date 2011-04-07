//var markers = {};




var Route = {};

Route.List = {
	'501': '501 - Queen',
	'502': '502 - Downtowner',
	'503': '503 - Kingston Rd',
	'504': '504 - King',
	'505': '505 - Dundas',
	'506': '506 - Carlton',
	'508': '508 - Lake Shore',
	'509': '509 - Harbourfront',
	'510': '510 - Spadina',
	'511': '511 - Bathurst',
	'512': '512 - St Clair'
}
Route.Handler = (function(){
	return {
		init: function() {
			Route.Items = {};
			this.createRoutes();
		},
		createRoutes: function() {
			_.each(Route.List, function(value, key, list){
				Route.Items[key] = new Route.Instance({id: key, name: value});
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
		// Close all info windows of vehicles
		_.each(this.vehicles, function(element, index, list){
			if (element.infoWindow) {
				element.infoWindow.close();
			}
		});
	}
};

var Vehicle = {};

/*Vehicle.Group = function(o) {
	for (var prop in o) {
		this[prop] = o[prop];
	}
	this.init();
}

Vehicle.Group.prototype = {
	init: function() {
		this.vehicles = {};
		this.updateVehicles();
	},
		updateVehicles: function() {
			that = this;
			// Get vehicle info for this route (json)
			$.ajax({
				url: "json.php",
				dataType: 'json', // Note: could use $.getJSON() as shortcut, but won't
				data: {r: this.id},
				cache: false, // Need to set this for IE especially, to cachebust
				success: function(data, textStatus, jqXHR) {
					//console.log(data.vehicles);
					_.each(data.vehicles, function(element, index, list){
						// Check if vehicle exists in vehicle array already
						// 	If it exists, update its info
						// 	If doesn't exist
						if (element.id in that.vehicles) {
							// Exists already, so update info
							that.vehicles[element.id].update(element);
						} else {
							that.vehicles[element.id] = new Vehicle.Instance(element);
						}
					});
				}
			});
		}
};*/

/*Vehicle.Handler = (function(){
	return {
		init: function() {
			Vehicle.Items = {};
			this.updateVehicles();
		},
		updateVehicles: function() {
			// Get vehicle info for this route (json)
			$.ajax({
				url: "json.php",
				dataType: 'json', // Note: could use $.getJSON() as shortcut, but won't
				data: {r: 510},
				cache: false, // Need to set this for IE especially, to cachebust
				success: function(data, textStatus, jqXHR) {
					//console.log(data.vehicles);
					_.each(data.vehicles, function(element, index, list){
						// Check if vehicle exists in vehicle array already
						// 	If it exists, update its info
						// 	If doesn't exist
						if (element.id in Vehicle.Items) {
							// Exists already, so update info
							Vehicle.Items[element.id].update(element);
						} else {
							Vehicle.Items[element.id] = new Vehicle.Instance(element);
						}
					});
				}
			});
		}
	}
})();*/

Vehicle.Instance = function(o) {
	for (var prop in o) {
		this[prop] = o[prop];
	}
	this.init();
}

Vehicle.Instance.prototype = {
	marker: {},
	init: function() {
		//console.log(this.getDir());
		this.createMarker();
		//console.log(this.marker);
	},
	update: function(el) {
		/* Update vehicle info */

		// If position has changed, remove current marker from map
		if (el.lat != this.lat || el.lng != this.lng) {
			// Update latlng
			this.lat = el.lat;
			this.lng = el.lng;
			// Position has changed -- Hide marker
			//this.hideMarker();
			// And then update position
			this.updateMarkerPosition();
			this.updateMarkerIcon();
			//this.showMarker();
		}

		this.dir = el.dir;
		this.dirTag = el.dirTag;

		this.updateMarkerInfoWindow();
		// Show Marker Again
		
	},
	hideMarker: function() {
		this.marker.setMap(null);
	},
	showMarker: function() {
		this.marker.setMap(window.map);
	},
	updateMarkerPosition: function() {
		//this.marker.position = new google.maps.LatLng(this.lat, this.lng);
		this.marker.setPosition(new google.maps.LatLng(this.lat, this.lng));
	},
	updateMarkerInfoWindow: function() {
		var that = this;
		this.marker.title = 'Vechicle #:' + this.id;
		var contentString = '<div class="info-window">' + 
			'<h1 class="vehicle-id">Vechicle #: ' + this.id + '</h1>' +
			'<div class="dir-tag">Direction Tag: ' + this.dirTag + '</div>' +
			'<div class="headingId">Seconds Since Last Report: ' + this.secsSinceReport + '</div>' +
			'<div class="headingId">Heading: ' + this.heading + '</div>' +
			'<a href="#" class="what-does-this-mean">What does this mean?</a>' +
			'<div class="reveal">Um, more info coming soon?</div>'
			'<br></div>';
		if (!this.infoWindow) {
			// If it doesn't exist yet create it
			this.infoWindow = new google.maps.InfoWindow({
				content: contentString
			});
		} else {
			// Otherwise, just update content
			this.infoWindow.content = contentString;
		}
		//console.log(this.infoWindow);
	},
	updateMarkerIcon: function() {
		// Marker icon is based on direction only, for now
		switch (this.dir) {
			case "N":
				var markerImage 	= window.markerImageStreetcarNorth;
				var markerShadow 	= window.markerImageStreetcarShadow;
				var markerShape 	= window.markerImageStreetcarShape;
				break;
			case "S":
				var markerImage 	= window.markerImageStreetcarSouth;
				var markerShadow 	= window.markerImageStreetcarShadow;
				var markerShape 	= window.markerImageStreetcarShape;
				break;
			case "E":
				var markerImage 	= window.markerImageStreetcarEast;
				var markerShadow 	= window.markerImageStreetcarShadow;
				var markerShape 	= window.markerImageStreetcarShape;
				break;
			case "W":
				var markerImage 	= window.markerImageStreetcarWest;
				var markerShadow 	= window.markerImageStreetcarShadow;
				var markerShape 	= window.markerImageStreetcarShape;
				break;
			default:
				// Perhaps we might not want to show these on the map?
				// 	Or, denote with a greyed out icon?
				// 	These are usually cars that are in the stockyard/out of service, I think.
				var markerImage 	= window.markerImageStreetcarDefault;
				var markerShadow 	= window.markerImageStreetcarShadowDefault;
				var markerShape 	= window.markerImageStreetcarShapeDefault;
				break;
		}
		this.marker.icon = markerImage;
		this.marker.shadow = markerShadow;
		this.marker.shape = markerShape;
	},
	createMarker: function() {
		//console.log(this.dir);
		// Create marker object
		this.marker = new google.maps.Marker({
			map: null
		});
		// set the marker icon
		this.updateMarkerIcon();
		this.updateMarkerPosition();
		this.showMarker();
		this.addEventListeners();
	},
	addEventListeners: function() {
		/* Move event listeners from updateMarker method, so we don't add a new listener each time marker is updated. */
		var that = this;
		google.maps.event.addListener(this.marker, 'click', function() {
			_gaq.push(['_trackEvent', 'Marker', 'Click', 'Marker - '+that.marker.title]);
			// Close any existing info windows first
			Controls.closeInfoWindows();
			// Then display the current one!
  			that.infoWindow.open(window.map, that.marker);
		});
	},
	getId: function() {return this.id;},
	getLat: function() {return this.lat;},
	getLng: function() {return this.lng;},
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
			_.each(Route.List, function(value, key, list){
				$showRoutes.append('<div class="check"><input type="checkbox" name="route[]" id="'+key+'" onclick="_gaq.push([\'_trackEvent\', \'Controls\', \'Click\', \'Show/hide Route - ' + value + '\']);"><label for="'+key+'">'+value+'</label></div>');
			});
			$showRoutes.find("input").live("change", function(){
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
				var routeArray = ["504", "510"]; // how about king & spadina
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
				_gaq.push(['_trackEvent', 'Controls', 'Click', 'Manual Update']);
				//e.preventDefault();
				that.updateVehicles();
			});
			$("#show-hide-controls").live("click", function(e) {
				$("#show-routes").toggle();
				$("#update").toggle();
				$(this).toggleClass("open");
			});
			$(".what-does-this-mean").live("click", function(){
				_gaq.push(['_trackEvent', 'InfoWindow', 'Click', 'What Does This Mean?']);
				$(this).hide();
				$(this).siblings(".reveal").show();
			});
			$("#about-show").live("click", function(e){
				//e.preventDefault();
				$("#about-content").toggle();
			});
		},
		updateVehicles: function() {
			//console.log(Route.Items);
			_.each(Route.Items, function(element, index, list){
				//console.log(element);
				// Call the Route.Instance updateVehicles method -- this will update all vehicles for route
				// console.log(element);
				element.updateVehicles();
			});
		},
		closeInfoWindows: function() {
			// Used to clean up info windows, probably only allow one at a time for now
			_.each(Route.Items, function(element, index, list){
				//console.log(element);
				element.closeInfoWindows();
			});
		},
		startAutoUpdate: function() {
			var that = this;
			// Set interval to auto-update every 8 seconds
			window.interval = window.setInterval(function(){that.updateVehicles();}, 1000*8);
			// Clear interval after 15 minutes to avoid people leaving window open and refreshing from server for hours
			window.setTimeout(function(){
				clearInterval(window.interval);
				alert("This page has been open for 15 minutes, auto-update is now turned off.\nPlease reload to activate auto-update, or hit the update button to manually update.");
			}, 1000*60*15);
		}
	}
})();

/*
 * Initialize App - This function is called right
 * 	after the Google Maps API is loaded.
 */
function init() {
	//Route.Handler.init();

	// init map w/ default location/zoom level/etc. (or with geolocation or with prev. saved default)

	// init routes and display on map


	var myLatlng = new google.maps.LatLng(43.656967, -79.399651);
    var myOptions = {
      zoom: 14,
      center: myLatlng,
      panControl: false,
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    window.map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
    var initialLocation;
    var browserSupportFlag = new Boolean();

    // W3 Geolocation (HTML5)
    /*if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position){
        browserSupportFlag = true;
        initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        map.setCenter(initialLocation);
      }, function(){
        handleNoGeolocation(browserSupportFlag);
      });
    } else {
      browserSupportFlag = false;
      handleNoGeolocation(browserSupportFlag);
    }

    function handleNoGeolocation(errorFlag) {
      if (errorFlag == true) {
        alert("Geolocation service failed.");
        initialLocation = myLatlng;
      } else {
        alert("Your browser doesn't support geolocation.")
        initialLocation = myLatlng
      }
      map.setCenter(initialLocation);
    }*/

    // Define marker images for each direction as global vars (i.e. attach to window) -- is this the best way?
    window.markerImageStreetcarEast = new google.maps.MarkerImage(
      'marker-images/streetcar-east.png',
      new google.maps.Size(42,43),
      new google.maps.Point(0,0),
      new google.maps.Point(21,43)
    );

    window.markerImageStreetcarNorth = new google.maps.MarkerImage(
      'marker-images/streetcar-north.png',
      new google.maps.Size(42,43),
      new google.maps.Point(0,0),
      new google.maps.Point(21,43)
    );

    window.markerImageStreetcarSouth = new google.maps.MarkerImage(
      'marker-images/streetcar-south.png',
      new google.maps.Size(42,43),
      new google.maps.Point(0,0),
      new google.maps.Point(21,43)
    );

    window.markerImageStreetcarWest = new google.maps.MarkerImage(
      'marker-images/streetcar-west.png',
      new google.maps.Size(42,43),
      new google.maps.Point(0,0),
      new google.maps.Point(21,43)
    );

    // Default for when direction is unknown/null
    window.markerImageStreetcarDefault = new google.maps.MarkerImage(
      'marker-images/streetcar-default.png',
      new google.maps.Size(42,43),
      new google.maps.Point(0,0),
      new google.maps.Point(21,43)
    );

    // Marker shadow is same for all 4 streetcar images/directions
    window.markerImageStreetcarShadow = new google.maps.MarkerImage(
      'marker-images/streetcar-shadow.png',
      new google.maps.Size(68,43),
      new google.maps.Point(0,0),
      new google.maps.Point(21,43)
    );

    // Shadow for default image is different (no circle in top right)
    window.markerImageStreetcarShadowDefault = new google.maps.MarkerImage(
      'marker-images/streetcar-default-shadow.png',
      new google.maps.Size(68,43),
      new google.maps.Point(0,0),
      new google.maps.Point(21,43)
    );

    // marker shape is same for all 4 images
    window.markerImageStreetcarShape = {
      coord: [35,0,37,1,39,2,39,3,40,4,41,5,41,6,41,7,41,8,41,9,41,10,41,11,41,12,41,13,41,14,41,15,40,16,40,17,39,18,38,19,36,20,36,21,36,22,36,23,36,24,36,25,36,26,36,27,36,28,36,29,36,30,36,31,36,32,36,33,36,34,36,35,36,36,35,37,29,38,28,39,27,40,26,41,25,42,16,42,15,41,14,40,13,39,12,38,6,37,5,36,5,35,5,34,5,33,5,32,5,31,5,30,5,29,5,28,5,27,5,26,5,25,5,24,5,23,5,22,5,21,5,20,5,19,5,18,5,17,5,16,5,15,5,14,5,13,5,12,5,11,5,10,5,9,5,8,5,7,6,6,22,5,22,4,23,3,24,2,25,1,28,0,35,0],
      type: 'poly'
    };

    // Shadow for default image is a bit different (no circle in top right)
    window.markerImageStreetcarShapeDefault = {
      coord: [35,6,36,7,36,8,36,9,36,10,36,11,36,12,36,13,36,14,36,15,36,16,36,17,36,18,36,19,36,20,36,21,36,22,36,23,36,24,36,25,36,26,36,27,36,28,36,29,36,30,36,31,36,32,36,33,36,34,36,35,36,36,35,37,29,38,28,39,27,40,26,41,25,42,16,42,15,41,14,40,13,39,12,38,6,37,5,36,5,35,5,34,5,33,5,32,5,31,5,30,5,29,5,28,5,27,5,26,5,25,5,24,5,23,5,22,5,21,5,20,5,19,5,18,5,17,5,16,5,15,5,14,5,13,5,12,5,11,5,10,5,9,5,8,5,7,6,6,35,6],
      type: 'poly'
    };

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
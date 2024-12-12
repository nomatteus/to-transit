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

Label.prototype = new google.maps.OverlayView;
 
Label.prototype.onAdd = function() {
     var pane = this.getPanes().overlayImage;
     pane.appendChild(this.div_);
 
     // Ensures the label is redrawn if the text or position is changed.
     var me = this;
     this.listeners_ = [
          google.maps.event.addListener(this, 'position_changed',
               function() { me.draw(); }),
          google.maps.event.addListener(this, 'text_changed',
               function() { me.draw(); }),
          google.maps.event.addListener(this, 'zindex_changed',
               function() { me.draw(); })
     ];
};
 
// Implement onRemove
Label.prototype.onRemove = function() {
     this.div_.parentNode.removeChild(this.div_);
 
     // Label is removed from the map, stop updating its position/text.
     for (var i = 0, I = this.listeners_.length; i < I; ++i) {
          google.maps.event.removeListener(this.listeners_[i]);
     }
};
 
// Implement draw
Label.prototype.draw = function() {
     var projection = this.getProjection();
     var position = projection.fromLatLngToDivPixel(this.get('position'));
     var div = this.div_;
     div.style.left = (position != null ? position.x : 0) + 'px';
     div.style.top = (position != null ? position.y : 0) + 'px';
     div.style.display = 'block';
     div.style.zIndex = this.get('zIndex'); //ALLOW LABEL TO OVERLAY MARKER
     //console.log(this);
     var text = this.get('text') || "...";
     this.span_.innerHTML = text;

};


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
		// Close all info windows of vehicles
		_.each(this.vehicles, function(element, index, list){
			if (element.infoWindow) {
				element.infoWindow.close();
			}
		});
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
		//console.log(this.getDir());
		this.createMarker();
		//console.log(this.marker);
	},
	update: function(el) {
		/* Update vehicle info */

		// If position has changed, update marker position
		if (el.lat != this.lat || el.lng != this.lng) {
			// Update latlng
			this.lat = el.lat;
			this.lng = el.lng;
			// Position has changed -- Hide marker
			//this.hideMarker();
			// And then update position
			this.updateMarkerPosition();
		}

		this.dir = el.dir;
		this.dirTag = el.dirTag;

		this.updateMarkerIcon();
		this.updateMarkerInfoWindow();

		// Make sure marker is showing
		this.showMarker();
	},
	hideMarker: function() {
		this.marker.label.setMap(null);
		this.marker.setMap(null);
	},
	showMarker: function() {
		// Check to make sure it's not already on map
		if (this.marker.getMap() == null) {
			this.marker.setMap(window.map);	
		}
		if (this.marker.label.getMap() == null) {
			this.marker.label.setMap(window.map);	
		}
	},
	updateMarkerPosition: function() {
		//this.marker.position = new google.maps.LatLng(this.lat, this.lng);
		this.marker.setPosition(new google.maps.LatLng(this.lat, this.lng));
	},
	updateMarkerInfoWindow: function() {
		var that = this;
		this.marker.title = 'Vechicle #' + this.id;
		var contentString = '<div class="info-window">' + 
			'<h1 class="vehicle-id">Vechicle #' + this.id + '</h1>' +
			'<div class="type">Type: ' + this.type + '</div>' +
			'<div class="dir-tag">Direction Tag: ' + this.dirTag + '</div>' +
			'<div class="route-sub">Route Sub: ' + this.routeSub + '</div>' +
			'<div class="headingId">Seconds Since Last Report: ' + this.secsSinceReport + '</div>' +
			'<div class="headingId">Heading: ' + this.heading + '</div>' +
			'</div>';
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
		if (this.type == "streetcar") {
			this.marker.icon = this.routeSub == null ? window.markerImageStreetcarGrey : window.markerImageStreetcarNew
		} else {
			// Bus
			this.marker.icon = this.routeSub == null ? window.markerImageBusGrey : window.markerImageBusDefault;
		}

		if (this.marker.label == null) {
			this.marker.label = new Label({
				map: window.map
			});
		}
		this.marker.label.set('zIndex', this.route);
		this.marker.label.bindTo('position', this.marker, 'position');
		this.marker.label.set('text', this.labelText + " " + this.dir);
	},
	createMarker: function() {
		//console.log(this.dir);
		// Create marker object
		this.marker = new google.maps.Marker({
			map: null,
			icon: window.markerImageStreetcarDefault
		});
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
		google.maps.event.addListener(this.marker, 'click', function() {
			// Close any existing info windows first
			Controls.closeInfoWindows();
			// Then display the current one!
  			that.infoWindow.open(window.map, that.marker);
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
			//console.log(Route.Items);
			_.each(Route.Items, function(element, index, list){
				//console.log(element);
				// Call the Route.Instance updateVehicles method -- this will update all vehicles for route
				// console.log(element);
				element.updateVehicles();
			});

			// Update user's location on the map
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(function(position) {
				  currentLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
				  window.userloc.setPosition (currentLocation);
				}, function() {
					// ... error ...
				});
			}
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
    };
    window.map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
    var currentLocation,
    	// Bounds rect defined by SW and NE points
    	torontoBoundsSW = new google.maps.LatLng(43.564, -79.561),
    	torontoBoundsNE = new google.maps.LatLng(43.930, -79.095),
    	torontoBounds = new google.maps.LatLngBounds(torontoBoundsSW, torontoBoundsNE);

	 // Create a marker for the user's location
	 window.userloc = new google.maps.Marker({
		clickable: false,
		icon: new google.maps.MarkerImage (
			'//maps.gstatic.com/mapfiles/mobile/mobileimgs2.png',
			new google.maps.Size(22,22),
			new google.maps.Point(0,18),
			new google.maps.Point(11,11)
		),
		shadow: null,
		zIndex: 999,
		map: 	  map
	 });
  
    // W3 Geolocation (HTML5)
	 if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position){
        currentLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        if (torontoBounds.contains(currentLocation)) {
        	map.setCenter(currentLocation);
		}
      }, function(){
      	// ... error ...
      });
    }

    // Define marker images for each direction as global vars (i.e. attach to window) -- is this the best way?
    window.markerImageStreetcarEast = 'marker-images/streetcar-east.png';

    window.markerImageStreetcarNorth = 'marker-images/streetcar-north.png';

    window.markerImageStreetcarSouth = 'marker-images/streetcar-south.png';

    window.markerImageStreetcarWest = 'marker-images/streetcar-west.png';

    // Default for when direction is unknown/null
    window.markerImageStreetcarDefault = 'marker-images/streetcar-default.png';

    // Buses
    window.markerImageBusDefault = 'marker-images/bus-default.png';

    // Buses Grey - For possibly out of service/unknown status
    window.markerImageBusGrey = 'marker-images/bus-grey.png';

    // Streetcar Grey - For possibly out of service/unknown status
    window.markerImageStreetcarGrey = 'marker-images/streetcar-grey.png';

    // Custom marker image for New Flexity Streetcars
    window.markerImageStreetcarNew = 'marker-images/streetcar-new.png';

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

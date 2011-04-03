//var markers = {};




var Route = {};

Route.List = {
	'501': '501- Queen',
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
			
		},
		createSomething: function() {
			
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
		this.createMarkers();
		
	},
	createMarkers: function() {
		
	}
};

var Vehicle = {};

Vehicle.Handler = (function(){
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
				data: {},
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
})();

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
		// Update vehicle info
		// If position has changed, remove current marker from map
		if (el.lat != this.lat || el.lng != this.lng) {
			// Position has changed -- Hide marker
			this.hideMarker();
		} else {
			// Position is same -- return true, no need to do anything else
			// NOTE: Might want to check if the direction has changed, even if position hasn't? Dunno, but leave this for now.
			return true;
		}
		// Update lat/lng
		this.lat = el.lat;
		this.lng = el.lng;
		this.dir = el.dir;
		this.dirTag = el.dirTag;
		// Call update functions
		this.updateMarkerIcon();
		this.updateMarkerPosition();
		// Show Marker Again
		this.showMarker();
	},
	hideMarker: function() {
		this.marker.setMap(null);
	},
	showMarker: function() {
		this.marker.setMap(window.map);
	},
	updateMarkerPosition: function() {
		this.marker.position = new google.maps.LatLng(this.lat, this.lng);
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
		},
		addListeners: function() {
			$("#controls a.update").live("click", function(e) {
				e.preventDefault();
				Vehicle.Handler.updateVehicles();
			});
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
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    window.map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
    var initialLocation;
    var browserSupportFlag = new Boolean();

    // Try W3 Geolocation
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

	// Init vehicles    
    Vehicle.Handler.init();
    Controls.init();

}
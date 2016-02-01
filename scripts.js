var lat;
var lng;
var map;
var segmentNames = [];
var segmentKind = [];
var segmentDuration = [];
var polylineCoords = [];
var lightbox = $('#lightbox');

//Search instagram by tag, set up landing page functions
function initialize() {
    lightbox.hide();
    $.ajax({
        url: 'https://api.instagram.com/v1/tags/travel/media/recent?',
        dataType: 'jsonp',
        data:{ 
            client_id: 'CLIENT ID',
            count: 200
        },
        success: imagesFetched,    
    });
}

//Fetch image data from instagram
function imagesFetched(data) {
    //console.log("DATA: ", data);
    data.data.forEach(printImages);
}

//Check that images have location data, print images to imageContainer and link to lightbox
function printImages (data) {
    if(data.location !== null && typeof data.location !== 'undefined'){
        var imgUrl = data.images.low_resolution.url;
        var lat = data.location.latitude;
        var lng = data.location.longitude;
        var newImage = $('<img>');
        
        newImage.attr({
            src: data.images.standard_resolution.url,
            class: "image",
            alt: data.caption.text,
            onclick: "getRoute(" + lat + "," + lng + "); blockPage(this.src, this.alt);"
        });
        $('#imageContainer').append(newImage);
    }
//TÄHÄN ELSE TMS. HAKEMAAN LISÄÄ KUVIA JOS SIJAINTI EI TIEDETTY? KORVATTU LISÄÄMÄLLÄ PYYNNÖN COUNT-ARVOA
}

//Fetch route data from rome2rio
function getRoute (lat, lng) {
    //console.log("image coordinates", lat, lng);
    $.ajax({
        'url': 'http://free.rome2rio.com/api/1.2/json/Search?key=API KEY&oName=Helsinki&dPos=' + lat + ',' + lng + '&oKind=city&dKind=city',
        'success': processRoute
    });
}

//Lightbox-on
function blockPage (src, alt){
    //console.log(alt);
    lightbox.show();
    document.getElementById('routeImage').src = src;
    $('#imageCaption').append(alt);
    
    //Click outside lightbox to close
    $(document).on('click', function(event) {
      if ($(event.target).has('#routeContainer').length) {
        destroyLightbox();
      }
    });
    //ESC to close lightbox
    $(document).keyup(function(e) { 
        if (e.keyCode == 27) {
            destroyLightbox();
        }
    });
}

//Lightbox-off
function destroyLightbox(){
        lightbox.hide();
        $('#routeText').empty();
        $('#imageCaption').empty();
        $('#map').empty();
        polylineCoords = [];
    }

//Prepare and loop through route segments ie. different parts of the route
function processRoute (data){
    console.log("reitti: ", data);
    var segments = data.routes[0].segments;
    segmentNames.length = 0;
    segmentKind.length = 0;
	segmentDuration.length = 0;
    
    $.each(segments, function(index, value){
        processSegments(value);
    });
    printRoute();
    preparePolyline(data);
    initMap();
}

//Format segment data
function processSegments (segments){
        if (segments.kind !== 'flight'){
            segmentNames.push(segments.sName + ' to ' + segments.tName);
        } else {
            segmentNames.push(segments.sCode + ' to ' + segments.tCode);
        }
        segmentKind.push(segments.kind);
        if (segments.duration > 59){
            var hours = Math.floor( segments.duration / 60);          
            var mins = segments.duration % 60;
            segmentDuration.push(hours + 'h ' + mins);
		} else {
            segmentDuration.push(segments.duration);
        }
    }

// Loop and print all route segments
function printRoute (){
    for (i = 0; i < segmentKind.length; i++) {
        $('#routeText').append('<em>' + segmentKind[i] + '</em> ' + segmentNames[i] + ' <em>' + segmentDuration[i] + ' min</em><br>');
    }
}

//Place route coordinates in an array for maps polyline
function preparePolyline(data){
    var stops = data.routes[0].stops
    for (i = 0; i < stops.length; i++) {
        var loc = stops[i].pos.split(",");
        var lat = parseFloat(loc[0])
        var lng = parseFloat(loc[1])
        polylineCoords.push({lat:lat, lng:lng});
    }
}

//Set up google map for displaying route
function initMap(){
    var customMapType = new google.maps.StyledMapType([
      {
        "stylers": [
          { "hue": "#AAFFFF" },
          { "gamma": 0.66 },
          { "saturation": -83 }
        ]
      },{
        "featureType": "water",
        "stylers": [
          { "lightness": -16 },
          { "hue": "#0008ff" }
        ]
      },{
        "elementType": "labels.text",
        "stylers": [
          { "visibility": "simplified" }
        ]
      }
    ], {
      name: 'Custom Style'
  });
    var customMapTypeId = 'custom_style';
    
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -34.397, lng: 150.644},
        zoom: 2,
        disableDefaultUI: true,
        mapTypeControlOptions: {
        mapTypeIds: [google.maps.MapTypeId.ROADMAP, customMapTypeId]
        }
    });
    
    map.mapTypes.set(customMapTypeId, customMapType);
    map.setMapTypeId(customMapTypeId);
    
    //draw polyline according to rome2rio route coordinates
    var mapRoute = new google.maps.Polyline({
    path: polylineCoords,
    });

    mapRoute.setMap(map);
    centerMap(mapRoute);
}

function centerMap(mapRoute){
    var bounds = new google.maps.LatLngBounds();
    var points = mapRoute.getPath().getArray();
    for (var i = 0; i < points.length ; i++){
        bounds.extend(points[i]);
    }
    map.fitBounds(bounds);
}


$(document).ready(function() {
		initialize();
});

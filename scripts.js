var lat;
var lng;
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
            client_id: '***REMOVED***',
            count: 200
        },
        success: imagesFetched,    
    });
    $(window).on("scroll touchmove", shrinkHeader);
    $('#scroll').click(scrollDown);
}

function scrollDown () {
    $('html, body').animate({ scrollTop: 500 }, 750);
}

function shrinkHeader () {
      $('header').toggleClass('small', $(document).scrollTop() > 0);
}

//Fetch image data from instagram
function imagesFetched(data) {
    console.log("DATA: ", data);
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
            onclick: "getRoute(" + lat + "," + lng + "); blockPage(this.src);"
        });
        $('#imageContainer').append(newImage);
    }
//TÄHÄN ELSE-ERROR TMS. HAKEMAAN LISÄÄ KUVIA JOS SIJAINTI EI TIEDETTY? KORVATTU LISÄÄMÄLLÄ PYYNNÖN COUNT-ARVOA
}

//Fetch route data from rome2rio
function getRoute (lat, lng) {
    //console.log("image coordinates", lat, lng);
    $.ajax({
        'url': 'http://free.rome2rio.com/api/1.2/json/Search?key=***REMOVED***&oName=Helsinki&dPos=' + lat + ',' + lng + '&oKind=city&dKind=city',
        'success': processRoute
    });
}

//Lightbox-on
function blockPage (src){
    console.log(src);
    lightbox.show();
    document.getElementById('routeImage').src = src;
    lightbox.click(destroyLightbox);
}

//Lightbox-off
function destroyLightbox(){
        lightbox.hide();
        $('#routeText').empty();
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
    
    var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -34.397, lng: 150.644},
        zoom: 1,
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
    geodesic: true,
    });

    mapRoute.setMap(map);
    
    //PASKAAAAAA
   /*var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < polylineCoords.length; i++) {
        bounds.extend(polylineCoords[i].lat, polylineCoords[i].lng);
    }
    map.fitBounds(bounds);*/
}


$(document).ready(function() {
		initialize();
});
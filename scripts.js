var lat;
var lng;
var routeContainer;
var segmentNames = [];
var segmentKind = [];
var segmentDuration = [];
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
            src: data.images.low_resolution.url,
            class: "image",
            onclick: "getRoute(" + lat + "," + lng + "); blockPage(this.src);"
        });
        $('#imageContainer').append(newImage);
    }
//TÄHÄN ELSE-ERROR TMS. HAKEMAAN LISÄÄ KUVIA JOS SIJAINTI EI TIEDETTY? KORVATTU LISÄÄMÄLLÄ PYYNNÖN COUNT-ARVOA
}

//Fetch route data from rome2rio
function getRoute (lat, lng) {
    console.log("koordinaatit", lat, lng);
    //blockPage();
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
    }

//Prepare and loop through route segments
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

$(document).ready(function() {
		initialize();
});
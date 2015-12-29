var lat;
var lng;
var routeContainer;
var segmentNames = [];
var segmentKind = [];
var segmentDuration = [];
var lightbox = $('#lightbox');

function initialize() {
    lightbox.hide();
    $.ajax({
        url: 'https://api.instagram.com/v1/tags/travel/media/recent?',
        dataType: 'jsonp',
        data:{ 
            client_id: '***REMOVED***',
            count: 100
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

function imagesFetched(data) {
    console.log("DATA: ", data);
    data.data.forEach(printImages);
}

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

function getRoute (lat, lng) {
    console.log("koordinaatit", lat, lng);
    //blockPage();
    $.ajax({
        'url': 'http://free.rome2rio.com/api/1.2/json/Search?key=***REMOVED***&oName=Helsinki&dPos=' + lat + ',' + lng + '&oKind=city&dKind=city',
        'success': processRoute
    });
}

function blockPage (src){
    console.log(src);
    lightbox.show();
    document.getElementById('routeImage').src = src;
    lightbox.click(destroyLightbox);
}

function destroyLightbox(){
        lightbox.hide();
        $('#routeText').empty();
    }

function processRoute (data){
    console.log("reitti: ", data);
    var segments = data.routes[0].segments;
    segmentNames.length = 0;
    segmentKind.length = 0;
	segmentDuration.length = 0;
    
    segments.forEach(function (segments){
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
    });
    printRoute();
}

function printRoute (){
    for (i = 0; i < segmentKind.length; i++) {
        $('#routeText').append('<em>' + segmentKind[i] + '</em> ' + segmentNames[i] + ' <em>' + segmentDuration[i] + ' min</em><br>');
    }
}

$(document).ready(function() {
		initialize();
});
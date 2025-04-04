var map = L.map('map', {
zoom: 13,
minZoom: 4,
maxBounds: [ [43.579608, -79.639283],
                [43.855443, -79.113219] ],
maxBoundsViscosity: 1.0,
}).setView([43.7175, -79.4243], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);


var locations = [];
var issues = [];
var descriptions = [];

function cancelReport() {
    let location = document.getElementById("location");
    let issue = document.getElementById("issue");
    let description = document.getElementById("description");
    let forum = document.getElementsByClassName("form-containter")[0];
    location.value = "";
    issue.value = "";
    description.value = "";
    hide();
}

function submitReport() {
    let location = document.getElementById("location");
    let issue = document.getElementById("issue");
    let description = document.getElementById("description");
    let forum = document.getElementsByClassName("form-containter")[0];
    locations.push(location.value);
    issues.push(issue.value);
    descriptions.push(description.value);
    hide();
}

function show(){
    let forum = document.getElementsByClassName("form-container")[0];
    forum.style.display = 'block';
    
}

function hide(){
    let forum = document.getElementsByClassName("form-container")[0];
    forum.style.display = 'none';
    
}

function addMarker(e) {

    document.getElementById("location").value = e.latlng.lat + ", " + e.latlng.lng;
    show();

    document.getElementsByClassName('form-container')[0].scrollIntoView({behavior: 'smooth'});
    document.querySelector("form").addEventListener("submit",function(event) {
        event.preventDefault();
        L.marker([e.latlng.lat,e.latlng.lng]).addTo(map);
        hide();
    });
}


map.on('click', addMarker);
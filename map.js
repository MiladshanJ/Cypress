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

fetch('/reports')
    .then(res => res.json())
    .then(data => {
        data.reports.forEach(report => {
            var [lat, lng] = report.location.split(',').map(position => parseFloat(position.trim()));

            var marker = L.marker([lat, lng]).addTo(map);
            marker.bindPopup(`<b>Location:</b> ${report.location}<br><b>Issue:</b> ${report.issue}<br><b>Description:</b> ${report.desc}`);
        });
    });

var locations = [];
var issues = [];
var descriptions = [];
var currentCoord = null;

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
    var date = new Date();
    currentCoord = e.latlng;

    document.getElementById("location").value = e.latlng.lat.toFixed(9) + ", " + e.latlng.lng.toFixed(9);
    document.getElementById("time").value = date.getHours().toString().padStart(2,0) + ":" + date.getMinutes().toString().padStart(2,0) + ":" + date.getSeconds().toString().padStart(2,0);
    document.getElementById("date").value = date.getFullYear().toString() + "-" + (date.getMonth()+1).toString().padStart(2,0) + "-" + date.getDate().toString().padStart(2,0);
    show();

    document.getElementsByClassName('form-container')[0].scrollIntoView({behavior: 'smooth'});
}

document.querySelector("form").addEventListener("submit",function(event) {
    event.preventDefault();

    let successMsg = document.getElementById('successMessage');
    successMsg.classList.remove('d-none');

    let lat = currentCoord.lat;
    let lng = currentCoord.lng;
    let location = lat.toFixed(3) + ", " + lng.toFixed(3);
    let issue = document.getElementById("issue").value;
    let date = document.getElementById("date").value;
    let description = document.getElementById("description").value;
    let time = document.getElementById("time").value;
    let issueType = document.getElementById("issueType").value;
    let urgency = document.getElementById("urgency").value;
    let reportStatus = "Open";

    fetch('/submit-report', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            location,
            date,
            time,
            issueType,
            issue,
            urgency,
            reportStatus,  
            description
        })
    })

    let marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(`<b>Location:</b> ${location}<br><b>Issue:</b> ${issue}<br><b>Description:</b> ${description}`);

    this.reset();
    hide();
});


map.on('click', addMarker);
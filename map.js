var map = L.map('map', {
zoom: 12,
minZoom: 11,
maxZoom: 18,
maxBounds: [ [43.579608, -79.639283], [43.855443, -79.113219] ],
maxBoundsViscosity: 1.0,
}).setView([43.7175, -79.4243], 10);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const issueIcons = {
    infrastructure: L.icon({
        iconUrl: 'icons/infrastructure.png',
        iconSize: [60, 60], 
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    }),
    utility: L.icon({
        iconUrl: '/icons/utility.png',
        iconSize: [60, 60],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    }),
    sanitation: L.icon({
        iconUrl: '/icons/sanitation.png',
        iconSize: [60, 60],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    }),
    environment: L.icon({
        iconUrl: '/icons/environment.png',
        iconSize: [60, 60],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    }),
    traffic: L.icon({
        iconUrl: '/icons/traffic.png',
        iconSize: [60, 60],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    }),
    duplicate: L.icon({
        iconUrl: '/icons/dup.png',
        iconSize: [60, 60],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    })
};


fetch('/reports')
    .then(res => res.json())
    .then(data => {
        data.reports.forEach(report => {
            var [lat, lng] = report.location.split(',').map(position => parseFloat(position.trim()));
            var selectedIcon;

            if(report.status === "Duplicate"){
                selectedIcon = issueIcons.duplicate;
            } else {
                selectedIcon = issueIcons[report.issueType];
            }

            var marker = L.marker([lat, lng],{icon: selectedIcon}).addTo(map);
            marker.bindPopup(`<b>Location:</b> ${report.location}<br><b>Issue Type:</b> ${report.issueType}<br><b>Issue:</b> ${report.issue}<br><b>Status:</b> ${report.status}<br><b>Description:</b> ${report.description}`);
        });
    });

var forum = document.getElementsByClassName("form-container")[0];
var currentCoord = null;

function cancelReport() {
    let location = document.getElementById("location");
    let issue = document.getElementById("issue");
    let description = document.getElementById("description");
    form = document.getElementsByClassName("form-container")[0];
    location.value = "";
    issue.value = "";
    description.value = "";
    hide();
}

function submitReport() {
    let location = document.getElementById("location");
    let issue = document.getElementById("issue");
    let description = document.getElementById("description");
    form = document.getElementsByClassName("form-container")[0];
    hide();
}

function show() {
    form = document.getElementsByClassName("form-container")[0];
    forum.style.display = 'block';
    
}

function hide() {
    form = document.getElementsByClassName("form-container")[0];
    forum.style.display = 'none';
    
}

function setIssues() {
    var issueType = document.getElementById("issueType").value;
    var issueSelect = document.getElementById("issue");
    const issueTypes = {
        infrastructure: ['Pothole', 'Damaged Sidewalk', 'Cracked Pavement', 'Loose Manhole Cover'],
        utility: ['Damaged Streetlight', 'Exposed Wiring', 'Water Main'],
        sanitation: ['Overflowing Trash Bin', 'Illegal Dumping', 'Littering'],
        environment: ['Fallen Tree', 'Flooding', 'Animal Sightning', 'Blocked Drain'],
        traffic: ['Damaged Traffic Light', 'Obstructed Sign', 'Gridlock/Traffic Issues']
    };
    issueSelect.innerHTML = '';
    
    
    if (!issueTypes[issueType]) {
        var issue = document.createElement('option');
        issue.text = "Select an issue type first";
        
        issueSelect.appendChild(issue);
    } else {
        var selectMessage = document.createElement('option');
        selectMessage.text = 'Select an Issue';
        selectMessage.disabled = true;
        selectMessage.selected = true;
        selectMessage.value = '';
        issueSelect.appendChild(selectMessage);

        issueTypes[issueType].forEach(problem => {
            var issue = document.createElement('option');
            issue.value = problem.toLowerCase();
            issue.text = problem;
            issueSelect.appendChild(issue);
        });
    } 
}

function addMarker(e) {
    var date = new Date();
    currentCoord = e.latlng;

    document.getElementById("location").value = e.latlng.lat + ", " + e.latlng.lng;
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
    let username = localStorage.getItem("username");

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
            description,
            username
        })
    })
    .then(res => res.json())
    .then(data =>{
        var selectedIcon = issueIcons[data.issueType];
        
        let marker = L.marker([lat, lng],{icon: selectedIcon}).addTo(map);
        marker.bindPopup(`<b>Location:</b> ${location}<br><b>Issue:</b> ${issue}<br><b>Status:</b> ${data.status}<br><b>Description:</b> ${description}`);
    })
    .catch(err => {
        console.error("Failed to submit report:", err);
    });

    this.reset();
    setIssues();
    hide();
});


map.on('click', function(e) {
    if (map.options.maxBounds.contains(e.latlng)) {
        addMarker(e);
    } else {
        alert("Location is outside of Toronto");
    }
});
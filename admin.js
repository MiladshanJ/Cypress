const issueIcons = {
    infrastructure: L.icon({
        iconUrl: '/icons/infrastructure.png',
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

fetch('/current-reports')
    .then(res => res.json())
    .then(data => {
        console.log("Fetched Reports: ", data.reports);
        
        const container = document.getElementById('reportContainer');
        
        if (data.reports && data.reports.length > 0) {
            const reportGroups = groupReportsByDuplicate(data.reports);
            console.log("Grouped Reports: ", reportGroups); 

            reportGroups.forEach(group => {
                if (group.length > 1) {
                    const reportBox = createGroupedReportBox(group);
                    container.appendChild(reportBox);
                } else {
                    const reportBox = createReportBox(group[0]);
                    container.appendChild(reportBox);
                }
            });
        } else {
            console.error("No reports found or reports are empty.");
        }
    })
    .catch(err => console.error("Error fetching reports:", err));

function createGroupedReportBox(group) {
    const reportBox = document.createElement('div');
    reportBox.className = 'report-box grouped';

    let groupDetails = `<div id="map-${group[0].id}" class="map"></div>
                        <div class="report-info"><strong>Reports in this group:</strong> ${group.length}</div>`;

    
    group.forEach((report, index) => {
        const label = index === 0 ? "Main Report" : `Duplicate ${index}`;
        groupDetails += `
            <div class="duplicate-info"><strong>${label}:</strong></div>
            <div class="report-info"><strong>Issue:</strong> ${report.issue}</div>
            <div class="report-info"><strong>Type:</strong> ${report.issueType}</div>
            <div class="report-info"><strong>Description:</strong> ${report.description}</div>
            <div class="report-info"><strong>Status:</strong> ${report.status}</div>
            <div class="report-info"><strong>Urgency:</strong> <span class="urgency" style="color: ${getUrgencyColor(report.urgency)}">${report.urgency}</span></div>
            <div class="report-info"><strong>Date:</strong> ${report.date}</div>
            <div class="report-info"><strong>Time:</strong> ${report.time}</div>
            <div class="report-info"><strong>Location:</strong> ${report.location}</div>
            <div class="report-buttons">
                <button class="delete-btn" onclick="deleteReport(${report.id})">Delete</button>
                <button class="btn in-progress" onclick="setInProgress(${report.id})">Set In Progress</button>
                <button class="btn resolve" onclick="resolveReport(${report.id})">Resolve</button>
            </div>
        `;
    });

    reportBox.innerHTML = groupDetails;

    
    setTimeout(() => {
        const mapContainer = document.getElementById(`map-${group[0].id}`);
        if (mapContainer) {
            const [lat, lng] = group[0].location.split(',').map(coord => parseFloat(coord.trim()));
            const map = L.map(mapContainer, {
                zoomControl: false,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                boxZoom: false,
                keyboard: false,
                tap: false
            }).setView([lat, lng], 14);

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            var selectedIcon;

            if(group[0].status === "Duplicate"){
                selectedIcon = issueIcons.duplicate;
            } else {
                selectedIcon = issueIcons[group[0].issueType];
            }
            L.marker([lat, lng],{icon: selectedIcon}).addTo(map);

            for (let i = 1; i < group.length; i++) {
                const [dupLat, dupLng] = group[i].location.split(',').map(coord => parseFloat(coord.trim()));
                L.marker([dupLat, dupLng], { icon: issueIcons.duplicate }).addTo(map);
            }
        } else {
            console.error("Map container not found:", `map-${group[0].id}`);
        }
    }, 0);

    return reportBox;
}

function createReportBox(report) {
    const reportBox = document.createElement('div');
    reportBox.className = 'report-box';

    const mapId = `map-${report.id}`;

    let reportDetails = `
        <div id="${mapId}" class="map"></div>
        <div class="report-info"><strong>Issue:</strong> ${report.issue}</div>
        <div class="report-info"><strong>Type:</strong> ${report.issueType}</div>
        <div class="report-info"><strong>Description:</strong> ${report.description}</div>
        <div class="report-info"><strong>Status:</strong> ${report.status}</div>
        <div class="report-info"><strong>Urgency:</strong> <span class="urgency" style="color: ${getUrgencyColor(report.urgency)}">${report.urgency}</span></div>
        <div class="report-info"><strong>Date:</strong> ${report.date}</div>
        <div class="report-info"><strong>Time:</strong> ${report.time}</div>
        <div class="report-info"><strong>Location:</strong> ${report.location}</div>
        <div class="report-buttons">
            <button class="delete-btn" onclick="deleteReport(${report.id})">Delete</button>
            <button class="btn in-progress" onclick="setInProgress(${report.id})">Set In Progress</button>
            <button class="btn resolve" onclick="resolveReport(${report.id})">Resolve</button>
        </div>
    `;

    reportBox.innerHTML = reportDetails;

    setTimeout(() => {
        const mapContainer = document.getElementById(mapId);
        if (mapContainer) {
            const [lat, lng] = report.location.split(',').map(coord => parseFloat(coord.trim()));
            const map = L.map(mapContainer, {
                zoomControl: false,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                boxZoom: false,
                keyboard: false,
                tap: false
            }).setView([lat, lng], 14);

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
            var selectedIcon;

            if(report.status === "Duplicate"){
                selectedIcon = issueIcons.duplicate;
            } else {
                selectedIcon = issueIcons[report.issueType];
            }
            L.marker([lat, lng],{icon: selectedIcon}).addTo(map);
        } else {
            console.error("Map container not found:", mapId);
        }
    }, 0);

    return reportBox;
}

function getUrgencyColor(urgency) {
    switch(urgency) {
        case 'Low': return 'green';
        case 'Medium': return '#fc8803';
        case 'High': return 'red';
        default: return 'black'; 
    }
}

function groupReportsByDuplicate(reports) {
    const groupedReports = [];

    reports.forEach(report => {
        let foundGroup = false;

        for (let group of groupedReports) {
            const firstReport = group[0];
            if (
                firstReport.issueType === report.issueType && 
                firstReport.issue === report.issue &&
                calculateDistance(firstReport.location, report.location) <= 150
            ) {
                group.push(report);
                foundGroup = true;
                break;
            }
        }

        if (!foundGroup) {
            groupedReports.push([report]);
        }
    });

    return groupedReports;
}


function calculateDistance(loc1, loc2) {
    const [lat1, lon1] = loc1.split(',').map(coord => parseFloat(coord.trim()));
    const [lat2, lon2] = loc2.split(',').map(coord => parseFloat(coord.trim()));

    const R = 6371; // Radius of the Earth in kilometers
    const dLat = degToRad(lat2 - lat1);
    const dLon = degToRad(lon2 - lon1);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; 

    return distance;
}

function degToRad(deg) {
    return deg * (Math.PI / 180);
}

function deleteReport(reportId) {
    fetch(`/delete/${reportId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            alert("Report deleted successfully.");
            window.location.reload();
        })
        .catch(err => console.error("Error deleting report:", err));
}

function resolveReport(reportId) {
    changeStatus(reportId, 'Resolved');
}

function setInProgress(reportId) {
    changeStatus(reportId, 'In Progress');
}

function changeStatus(reportId, status) {
    fetch('/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',},
        body: JSON.stringify({ reportId, newStatus: status }),
    })
    .then(response => response.json())
    .then(data => { 
        alert(data.message);
        location.reload();
    })
}

document.getElementById('logout').addEventListener('click', () => {
    fetch('/logout', {
        method: 'POST',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.message === 'Successful Logout') {
            window.location.href = '/index.html';
        } else {
            alert('Logout failed: ' + data.message);
        }
    })
    .catch(err => {
        console.error('Logout error:', err);
    });
});
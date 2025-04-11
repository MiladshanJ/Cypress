var map = L.map('map', {
    zoom: 12,
    minZoom: 12,
    maxZoom: 18,
    maxBounds: [ [43.579608, -79.639283], [43.855443, -79.113219] ],
    maxBoundsViscosity: 1.0,
}).setView([43.7175, -79.4243], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
let allReports = [];

fetch('/reports')
    .then(res => res.json())
    .then(data => {
        allReports = data.reports;
        initIssueTypeDropdown(allReports);
        displayReports(allReports);
    })
    .catch(err => console.error('Error fetching reports:', err));

const reportsContainer = document.getElementById('reportsContainer');
const sortSelect = document.getElementById('sortSelect');
const issueTypeSelect = document.getElementById('issueTypeSelect');
const subIssueSelect = document.getElementById('subIssueSelect');
const searchInput = document.getElementById('searchInput');

sortSelect.addEventListener('change', updateDisplay);
issueTypeSelect.addEventListener('change', () => {
    populateSubIssues(issueTypeSelect.value);
    updateDisplay();
});
subIssueSelect.addEventListener('change', updateDisplay);
searchInput.addEventListener('input', updateDisplay);

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

function centerMap(lat, lon) {
    map.setView([lat, lon], 16);
}

function displayReports(reports) {
    reportsContainer.innerHTML = '';
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    reports.forEach(report => {
        const { location, issueType, issue, urgency, status, description, date, time, username } = report;

        const reportBox = document.createElement('div');
        reportBox.classList.add('report-box');

        reportBox.innerHTML = `
            <div class="report-header">
                <b>Issue Type:</b> ${issueType}
            </div>
            <div class="report-body">
                <b>Location:</b> ${location}<br>
                <b>Date:</b> ${date} | <b>Time:</b> ${time}<br>
                <b>Issue:</b> ${issue}<br>
                <b>Description:</b> ${description}<br>
            </div>
            <div class="report-footer">
                <span><b>Status:</b> ${status}</span>
                <span><b>Urgency:</b> ${urgency}</span>
            </div>
            <div class="report-info">
                <span><b>Submitted by:</b> ${username}</span>
                <a href="#" onclick="centerMap(${location.split(',')[0]}, ${location.split(',')[1]}); return false;">View on Map</a>
            </div>
        `;
        reportsContainer.appendChild(reportBox);

        var selectedIcon;
        if(report.status === "Duplicate"){
            selectedIcon = issueIcons.duplicate;
        } else {
            selectedIcon = issueIcons[report.issueType];
        }
        const [lat, lon] = location.split(',').map(Number);
        L.marker([lat, lon],{icon: selectedIcon}).addTo(map)
            .bindPopup(`<strong>${issueType}</strong><br>${issue}<br><em>${location}</em>`);
    });
}

function initIssueTypeDropdown(reports) {
    const types = Array.from(new Set(reports.map(r => r.issueType)));
    types.sort();
    types.forEach(type => {
        const opt = document.createElement('option');
        opt.value = type;
        opt.textContent = type;
        issueTypeSelect.appendChild(opt);
    });
}

function populateSubIssues(issueType) {
    subIssueSelect.innerHTML = `<option value="">-- All Sub-Issues --</option>`;
    const filtered = allReports.filter(r => r.issueType === issueType);
    const subIssues = Array.from(new Set(filtered.map(r => r.issue)));
    subIssues.sort();
    subIssues.forEach(issue => {
        const opt = document.createElement('option');
        opt.value = issue;
        opt.textContent = issue;
        subIssueSelect.appendChild(opt);
    });
}

function updateDisplay() {
    let filtered = [...allReports];

    const sortValue = sortSelect.value;
    if (sortValue === 'date') {
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortValue === 'urgency') {
        const urgencyOrder = { High: 1, Medium: 2, Low: 3 };
        filtered.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
    } else if (sortValue === 'status') {
        filtered.sort((a, b) => a.status.localeCompare(b.status));
    }

    const issueTypeVal = issueTypeSelect.value;
    const subIssueVal = subIssueSelect.value;
    if (issueTypeVal) {
        filtered = filtered.filter(r => r.issueType === issueTypeVal);
    }
    if (subIssueVal) {
        filtered = filtered.filter(r => r.issue === subIssueVal);
    }

    const keyword = searchInput.value.toLowerCase();
    if (keyword) {
        filtered = filtered.filter(r =>
            r.issueType.toLowerCase().includes(keyword) ||
            r.issue.toLowerCase().includes(keyword) ||
            r.description.toLowerCase().includes(keyword) ||
            r.status.toLowerCase().includes(keyword) ||
            r.urgency.toLowerCase().includes(keyword) ||
            r.location.toLowerCase().includes(keyword)
        );
    }

    displayReports(filtered);
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

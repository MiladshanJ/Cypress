const map = L.map('map', {
    zoom: 13,
    minZoom: 4,
    maxBounds: [
        [43.579608, -79.639283],
        [43.855443, -79.113219]
    ],
    maxBoundsViscosity: 1.0
}).setView([43.7175, -79.4243], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const reports = 
[
    {
        location: "43.7000, -79.4200",
        time: "14:05:23",
        issue: "Pothole",
        description: "Pothole near TMU.",
        reportedBy: "Ranbir Singh Fuddu"
    },
    {
        location: "43.7150, -79.4300",
        time: "15:10:12",
        issue: "Car Crash",
        description: "HELPPPPPPPP.",
        reportedBy: "Umair Pakistani Puta"
    }
];

const tableBody = document.getElementById("reportsTableBody");
fetch('/reports')
.then(res => res.json())
.then(data => {
    data.reports.forEach(report => {
        const row = document.createElement("tr");
    row.innerHTML = `
        <td>${report.location}</td>
        <td>${report.time}</td>
        <td>${report.issue}</td>
        <td>${report.description}</td>
        <td>${report.reportedBy}</td>
    `;
    tableBody.appendChild(row);

    const [lat, lng] = report.location.split(',').map(coord => parseFloat(coord.trim()));
    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(`<b>Issue:</b> ${report.issue}<br><b>Time:</b> ${report.time}<br><b>Description:</b> ${report.description}<br><b>Reported By:</b> ${report.reportedBy}`);
    });
});
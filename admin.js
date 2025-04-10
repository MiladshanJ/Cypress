fetch('/reports')
    .then(res => res.json())
    .then(data => {
        const container = document.getElementById('reportContainer');
        data.reports.forEach((report, index) => {
            const reportBox = document.createElement('div');
            reportBox.className = 'report-box';

            const mapId = `map-${index}`;
            reportBox.innerHTML = `
                <div id="${mapId}" class="map"></div>
                <div class="report-info"><strong>Issue:</strong> ${report.issue}</div>
                <div class="report-info"><strong>Type:</strong> ${report.issueType}</div>
                <div class="report-info"><strong>Description:</strong> ${report.description}</div>
                <div class="report-info"><strong>Status:</strong> ${report.status}</div>
                <div class="report-info"><strong>Urgency:</strong> ${report.urgency}</div>
                <div class="report-info"><strong>Date:</strong> ${report.date}</div>
                <div class="report-info"><strong>Time:</strong> ${report.time}</div>
                <div class="report-info"><strong>Location:</strong> ${report.location}</div>
                <div class="report-buttons">
                    <button class="delete-btn" onclick="deleteReport(${report.id})">Delete</button>
                    <button class="btn resolve" onclick="resolveReport(${report.id})">Resolve</button>
                </div>
            `;

            container.appendChild(reportBox);

            const [lat, lng] = report.location.split(',').map(coord => parseFloat(coord.trim()));
            const map = L.map(mapId, {
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

            L.marker([lat, lng]).addTo(map);
        });
    });

function deleteReport(reportId) {
    fetch(`/delete/${reportId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            alert("Report deleted successfully.");
            window.location.reload();
        })
        .catch(err => console.error("Error deleting report:", err));
}
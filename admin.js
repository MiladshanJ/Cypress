// Fetch reports from the backend and display them
fetch('/reports')
.then(res => res.json())
.then(data => {
    const reportsContainer = document.getElementById('reportsContainer');
    data.reports.forEach(report => {
        const { id, location, issueType, issue, urgency, status, description, createdAt, maker } = report;

        // Creating a report box element
        const reportBox = document.createElement('div');
        reportBox.classList.add('report-box');

        const reportDate = new Date(createdAt);
        const formattedDate = reportDate.toLocaleString();

        // Create the content for the report box
        reportBox.innerHTML = `
            <div class="report-header">
                <b>Issue Type:</b> ${issueType}
            </div>
            <div class="report-body">
                <b>Location:</b> ${location}<br>
                <b>Issue:</b> ${issue}<br>
                <b>Description:</b> ${description}<br>
            </div>
            <div class="report-footer">
                <span><b>Status:</b> ${status}</span>
                <span><b>Urgency:</b> ${urgency}</span>
            </div>
            <div class="report-info">
                <span><b>Reported by:</b> ${maker}</span>
                <a href="https://www.openstreetmap.org/?mlat=${location.split(',')[0]}&mlon=${location.split(',')[1]}" class="map-link" target="_blank">View on Map</a>
            </div>
        `;

        // Append the report box to the container
        reportsContainer.appendChild(reportBox);
    });
})
.catch(err => {
    console.error('Error fetching reports:', err);
});
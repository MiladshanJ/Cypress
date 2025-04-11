# Cypress
The **Cypress** system is a web application designed to automate and modernize the Toronto City Council system for reporting street-related problems. The current process is manual and tedious and leaves much to be desired. The system allows citizens to easily report issues, track their status, and view reports submitted by others. The application uses an interactive map to pinpoint the location of the problem and provides real-time updates.
## 🚀 Features

- 📍 Interactive map for geolocated issue reporting
- 🧾 User registration and login
- 🧑‍💻 Admin login and report management
- 🗂️ View all submitted reports from the database
- 🔐 Password hashing for user security
- 💬 Dynamic popup for each report with issue details

## 📦 Tech Stack

- **Frontend**: HTML, CSS, JavaScript, Leaflet.js
- **Backend**: Node.js, Express
- **Database**: SQLite3
- **Tools**: Git, VS Code

## Database Structure 
The Cypress system is under one database (cypress.db) with the following four tables
- **admins:** (id, username, password, email)
- **users:** (id, username, password, email, token)
- **reports:** (id, location, date, time, issueType, issue, urgency, status, description, username)
- **subscriptions:** (id, reported, username)

## ⚙️ Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/cypress.git
cd cypress

# 2. Install dependencies
npm install

# 3. Start the server
node server.js

# 4. Open your browser
http://localhost:3000

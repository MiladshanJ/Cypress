const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const session = require('express-session');

const app = express();
const port = 3000;

const hrefRedirect = '/map.html';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

app.use(session({
    secret: 'CPS406',
    resave: false,
    saveUninitialized: true,
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'map.html'));
  });

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

let user;
let report;
let admin;

const db = new sqlite3.Database("./cypress.db", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) return console.error(err.message);
    console.log('Connected To SQLite database.');
});

// Create Tables 
user = 'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, email TEXT UNIQUE)';
db.run(user);

report = 'CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, location TEXT, date TEXT, time TEXT, issueType TEXT, issue TEXT, urgency TEXT, status TEXT, description TEXT, username TEXT)';
db.run(report);

admin = 'CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, email TEXT UNIQUE)';
db.run(admin);


// Hash Function SHA-256
function hashPassword(password){
    return crypto.createHash('sha256').update(password).digest('hex');
}

function getDistance(lat1, lon1, lat2, lon2){
    const radiusWorld = 6371e3; 
    const toRad = x => x * Math.PI / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return radiusWorld * c;    
}


// ROUTES


app.post('/register', (req, res) => {
    const { username, password, email } = req.body;
    const hashedPassword = hashPassword(password);

    if (!username || !password) {
        return res.json({ message: 'Username and password are required' });
    }
    
    db.run(`INSERT INTO users (username, password, email) VALUES (?, ?, ?)`, 
        [username, hashedPassword, email], 
        function(err) {
            if (err) {
                return res.json({ message: 'Account with this username or email already exists' });
            }
            res.json({ message: 'Registration successful', redirect: hrefRedirect });
        });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = hashPassword(password);

    db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, 
        [username, hashedPassword], 
        (err, row) => {
            if (err) {
                return res.json({ message: 'Error occurred' });
            }
            if (row) {
                res.json({ message: 'Login successful', redirect: hrefRedirect, username: row.username});
            } else {
                res.json({ message: 'Invalid username or password' });
            }
        });
});

//Submit Report
app.post('/submit-report', (req, res) => {
    const {location, date, time, issueType, issue, urgency, description, username} = req.body;

    let reportStatus = "Open";
    const [lat1, lon1] = location.split(',').map(coord => parseFloat(coord.trim()));

    //Duplicate Check - Version 1
    db.all('SELECT * FROM reports WHERE issueType = ? AND issue = ?', [issueType, issue], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const duplicate = rows.find(row => {
            const [lat2, lon2] = row.location.split(',').map(coord => parseFloat(coord.trim()));
            const distance = getDistance(lat1, lon1, lat2, lon2);
            return distance <= 169;
        });
        if (duplicate) {
            reportStatus = "Duplicate";
        }

        db.run(
            'INSERT INTO reports (location, date, time, issueType, issue, urgency, status, description, username) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [location, date, time, issueType, issue, urgency, reportStatus, description, username],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.status(200).json({
                    id: this.lastID,
                    location, date, time, issueType, issue, urgency, reportStatus, description
                });
            }
        );
    });
});

//Display all Reports
app.get('/reports',(req, res) => {
    db.all('SELECT * FROM reports', [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ status: 'error', message: 'Failed to fetch reports' });
        }
        res.status(200).json({ status: 'success', reports: rows });
    })
}) 


//Login admin 
app.post('/admin-login', (req, res) => {
    const { username, password, email } = req.body;

    db.get('SELECT * FROM admins WHERE username = ?',
        [username],
        (err, row) => {  
            if (err) return res.status(500).json({ error: err.message }); 
            if (!row) return res.status(401).json({ error: "Invalid credentials" });  

            const hashedPassword = hashPassword(password);  
            if (hashedPassword !== row.password) { 
                return res.status(401).json({ error: "Invalid credentials" });  
            }
            res.status(200).json({message: "Successful Login", admin: row});
        } 
    );
});
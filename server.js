const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const session = require('express-session');
const mailer = require('nodemailer');

const app = express();
const port = 3000;

const transporter = mailer.createTransport({
    service: 'Gmail',
    auth: {
        user:'cypress.update.notification@gmail.com',
        pass:'lsca whdz ucor njye',
    },
});

const hrefRedirect = '/map.html';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

app.use(session({
    secret: 'CPS406',
    resave: false,
    saveUninitialized: true,
}));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

let user;
let report;
let admin;
let subscription;

const db = new sqlite3.Database("./cypress.db", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) return console.error(err.message);
    console.log('Connected To SQLite database.');
});

// Create Tables 
user = 'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, email TEXT UNIQUE, token TEXT, verified BOOLEAN DEFAULT FALSE)';
db.run(user);

report = 'CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, location TEXT, date TEXT, time TEXT, issueType TEXT, issue TEXT, urgency TEXT, status TEXT, description TEXT, username TEXT)';
db.run(report);

admin = 'CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, email TEXT UNIQUE)';
db.run(admin);

subscription = 'CREATE TABLE IF NOT EXISTS subscriptions (id INTEGER PRIMARY KEY AUTOINCREMENT, reportId INTEGER, username TEXT, FOREIGN KEY (reportId) REFERENCES reports(id), FOREIGN KEY (username) REFERENCES users(username))';
db.run(subscription);

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
    const token = crypto.randomBytes(32).toString('hex');

    if (!username || !password || !email) {
        return res.json({ message: 'All fields are required' });
    }
    
    db.run(`INSERT INTO users (username, password, email, token) VALUES (?, ?, ?, ?)`, 
        [username, hashedPassword, email, token], 
        function(err) {
            if (err) {
                return res.json({ message: 'Account with this username or email already exists' });
            }

            const mail = {
                from: 'cypress.update.notification@gmail.com',
                to: email,
                subject: 'Verify your Cypress Account Email',
                html: `<p>Click the link to verify your email:</p>
               http://localhost:3000/verification.html?token=${token}`
            }

            transporter.sendMail(mail, (error, info) => {
                if (error) {
                    console.error('Email sending failed:', error);
                    return res.json({ message: 'verification email sending error' });
                }
                console.log('Email sent:', info.response);
                return res.json({ message: 'Verification email sent. Please check email.' });
            });
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

            if (!row) {
                return res.json({ message: 'Invalid username or password' });
            }

            if (!row.verified) {
                return res.json({ message: 'Please verify your email before logging in.' });
            }

            return res.json({ message: 'Login successful', redirect: hrefRedirect, username: row.username });
        });
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error: ', err);
            return res.status(500).json({ message: 'Failed to Logout'});
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({ message: 'Successful Logout'});
    });
});

//Submit Report
app.post('/submit-report', (req, res) => {
    const {location, date, time, issueType, issue, urgency, description, username} = req.body;

    let reportStatus = "Pending";
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

                const reportId = this.lastID;

                db.get('SELECT email FROM users WHERE username = ?', [username], (err, userRow) => {
                    if (err || !userRow) {
                        console.error('Error getting user email:', err);
                        return res.status(500).json({ message: 'Report saved but email failed.' });
                    }

                    const userEmail = userRow.email;

                    const mail = {
                        from: 'cypress.update.notification@gmail.com',
                        to: userEmail,
                        subject: 'Report Confirmation - Cypress System',
                        html: `<p>Hi <strong>${username}</strong>,</p>
                            <p>Your report has been successfully submitted with the following details:</p>
                            <ul>
                                <li><strong>Report ID:</strong> ${reportId}</li>
                                <li><strong>Location:</strong> ${location}</li>
                                <li><strong>Date:</strong> ${date}</li>
                                <li><strong>Time:</strong> ${time}</li>
                                <li><strong>Issue Type:</strong> ${issueType}</li>
                                <li><strong>Issue:</strong> ${issue}</li>
                                <li><strong>Urgency:</strong> ${urgency}</li>
                                <li><strong>Status:</strong> ${reportStatus}</li>
                                <li><strong>Description:</strong> ${description}</li>
                            </ul>
                            <p>Thank you for submitting a report through Cypress.</p>
                            <p>You can view the report on the map <a href="http://localhost:3000/map.html">here</a></p> `
                    };

                    transporter.sendMail(mail, (error, info) => {
                        if (error) {
                            console.error('Confirmation email failed:', error);
                        } else {
                            console.log('Confirmation email sent:', info.response);
                        }
                    });
    
                    res.status(200).json({
                        id: reportId,
                        location, date, time, issueType, issue, urgency, reportStatus, description
                    });
                });
            }
        );
    });
});

app.post('/update-status', (req, res) => {
    const { reportId, newStatus } = req.body;

    if (!reportId || !newStatus) {
        return res.status(400).json({ message: 'Missing reportId or newStatus' });
    }

    db.get('SELECT * FROM reports WHERE id = ?', [reportId], (err, report) => {
        if (err || !report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        db.run('UPDATE reports SET status = ? WHERE id = ?', [newStatus, reportId], function(err) {
            if (err) {
                return res.status(500).json({ message: 'Failed to update status' });
            }

            db.all('Select users.email FROM subscriptions JOIN users ON subscriptions.username = users.username WHERE subscriptions.reportId = ?', [reportId], (err, rows) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ message: 'Failed to fetch subscribers' });
                }

                if (rows.length === 0) {
                    return res.status(200).json({ message: 'Status updated, no subscribers to notify' });
                }

                const emails = rows.map(row => row.email).join(',');

                const mail = {
                    from: 'cypress.update.notification@gmail.com',
                    to: emails,
                    subject: 'Report Update Notification',
                    html: `<p>The status of the report "<strong>${report.issue}</strong>" has been changed to <strong>${newStatus}</strong>.</p>
                           <p><a href="http://localhost:3000/map.html">View the report</a></p>`
                };

                transporter.sendMail(mail, (error, info) => {
                    if (error) {
                        console.error('Email sending failed:', error);
                        return res.json({ message: 'Status updated, email failed sending error' });
                    }
                    console.log('Email sent:', info.response);
                    return res.json({ message: 'Status update and email sent successfully to subscribers' });
                });
            });
        });
    });
});

app.post('/subscribe', (req, res) => {
    const { reportId, username } = req.body;

    db.run('INSERT INTO subscriptions (reportId, username) VALUES (?, ?)', [reportId, username], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Failed to subscribe or already subscribed' });
        }
        res.status(200).json({ message: 'Subscribed successfully' });
    }
    );
});

app.get('/verify', (req, res) => {
    const token = req.query.token;
    if (!token) return res.send('Invalid token');

    db.get('SELECT * FROM users WHERE token = ?', [token], (err,user) => {
        if (err || !user) return res.send('Invalid or expired token');

        db.run('UPDATE users SET verified = TRUE, token = NULL WHERE id = ?', [user.id], (err) => {
            if (err) return res.send('verificatio updating error');
            res.send('email verified');
        });
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

//Display Non-Resolved Reports
app.get('/current-reports',(req, res) => {
    db.all('SELECT * FROM reports WHERE status != ?', ['Resolved'], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ status: 'error', message: 'Failed to fetch reports' });
        }
        res.status(200).json({ status: 'success', reports: rows });
    })
}) 

//Login admin 
app.post('/admin-login', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = hashPassword(password); 

    db.get(`SELECT * FROM admins WHERE username = ? AND password = ?`, 
        [username, hashedPassword], 
        (err, row) => {
            if (err) {
                return res.json({ message: 'Error occurred' });
            }
            if (!row) {
                return res.json({ message: 'Invalid username or password' });
            }
            return res.json({ message: 'Login successful', redirect: 'http://localhost:3000/admin.html', username: row.username });
        });
});

//Delete Report
app.delete('/delete/:id', (req, res) => {
    const reportId = req.params.id;

    db.run('DELETE FROM reports WHERE id = ?', [reportId], function(err) {
        if (err){
            console.error(err.message);
            return res.status(500).json({error: 'Failed to delete report' });
        }
        if (this.changes === 0){
            return res.status(404).json({ error: 'Report not found' });
        }
        res.status(200).json({ message: 'Report deleted successfully' });
    });
});

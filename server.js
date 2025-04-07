const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

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
user = 'CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, email TEXT UNIQUE)';
db.run(user);

report = 'CREATE TABLE reports (id INTEGER PRIMARY KEY AUTOINCREMENT, location TEXT, issue TEXT, time TEXT, description TEXT)';
db.run(report);

admin = 'CREATE TABLE admins (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, email TEXT UNIQUE)';
db.run(admin);


// Hash Function SHA-256
function hashPassword(password){
    return crypto.createHash('sha256').update(password).digest('hex');
}


// ROUTES


//Registers a new user
app.post('/register', (req, res) => {
    const { username, password, email } = req.body;
    try {
        const hashed = hashPassword(password);

        db.run('INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
            [username, hashed, email],
            function (err) {
                if (err) return res.status(500).json({error: err.message});
                res.status(200).json({id: this.lastID, username, email});
            }
        );
    } catch (err) {
        res.status(500).json({error: "Error hashing"});
    }
});

//User login
app.post('/login', (req, res) => {
    const { username, password, email } = req.body;

    db.get('SELECT * FROM users WHERE username = ?',
        [username],
        (err, row) => {  
            if (err) return res.status(500).json({ error: err.message }); 
            if (!row) return res.status(401).json({ error: "Invalid credentials" });  

            const hashedPassword = hashPassword(password);  
            if (hashedPassword !== row.password) { 
                return res.status(401).json({ error: "Invalid credentials" });  
            }
            res.status(200).json({message: "Sucessful Login", user: row});
        } 
    );
});


//Submit Report



//Register new admin



//Login admin 
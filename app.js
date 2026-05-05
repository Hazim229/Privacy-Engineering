const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Connect to SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log(' Database created/connected!');
    }
});

// Create table
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        dob TEXT,
        address TEXT,
        is_adult INTEGER
    )
`);

// Function to calculate age
function calculateAge(dob) {
    const birthDate = new Date(dob);
    const diff = Date.now() - birthDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

// POST endpoint (add data)
app.post('/submit', (req, res) => {
    const { name, dob, address } = req.body;

    if (!name || !dob || !address) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    const age = calculateAge(dob);
    const isAdult = age >= 18 ? 1 : 0;

    db.run(
        `INSERT INTO users (name, dob, address, is_adult) VALUES (?, ?, ?, ?)`,
        [name, dob, address, isAdult],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json({
                message: 'User stored successfully',
                isAdult: !!isAdult
            });
        }
    );
});

// GET endpoint (view all users)
app.get('/users', (req, res) => {
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Optional root route
app.get('/', (req, res) => {
    res.send(' Server is working!');
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
});
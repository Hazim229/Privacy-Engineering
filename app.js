const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const XLSX = require('xlsx');

const app = express();
app.use(bodyParser.json());

// Connect to SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Database created/connected!');
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

// ====================
// POST: Add User
// ====================
app.post('/submit', (req, res) => {
    const { name, dob, address } = req.body;

    if (!name || !dob || !address) {
        return res.status(400).json({
            error: 'Missing fields'
        });
    }

    const age = calculateAge(dob);
    const isAdult = age >= 18 ? 1 : 0;

    db.run(
        `INSERT INTO users (name, dob, address, is_adult)
         VALUES (?, ?, ?, ?)`,
        [name, dob, address, isAdult],
        function (err) {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                message: 'User stored successfully',
                userId: this.lastID,
                isAdult: !!isAdult
            });
        }
    );
});

// ====================
// GET: View All Users
// ====================
app.get('/users', (req, res) => {
    db.all(
        "SELECT * FROM users",
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
});

// ====================
// GET: Export to Excel
// ====================
app.get('/export-excel', (req, res) => {
    db.all(
        "SELECT * FROM users",
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            try {
                const worksheet = XLSX.utils.json_to_sheet(rows);

                const workbook = XLSX.utils.book_new();

                XLSX.utils.book_append_sheet(
                    workbook,
                    worksheet,
                    "Users"
                );

                const fileName = "users.xlsx";

                XLSX.writeFile(workbook, fileName);

                res.download(fileName);
            } catch (error) {
                res.status(500).json({
                    error: error.message
                });
            }
        }
    );
});

// ====================
// Home Route
// ====================
app.get('/', (req, res) => {
    res.send('Server is working!');
});

// ====================
// Start Server
// ====================
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const XLSX = require('xlsx');
const path = require('path');

const app = express();
app.use(bodyParser.json());

// DATABASE
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Database connected!');
    }
});

// ORIGINAL DATA TABLE
db.run(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    dob TEXT,
    address TEXT,
    symptom TEXT,
    is_adult INTEGER
)
`);

// ANONYMISED DATA TABLE
db.run(`
CREATE TABLE IF NOT EXISTS anonymised_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_ref TEXT,
    age_group TEXT,
    symptom TEXT,
    is_adult INTEGER,
    created_at TEXT
)
`);

// HELPERS
function calculateAge(dob) {

    const birthDate = new Date(dob);

    const diff =
        Date.now() - birthDate.getTime();

    const ageDate =
        new Date(diff);

    return Math.abs(
        ageDate.getUTCFullYear() - 1970
    );
}

function getAgeGroup(age) {

    if (age < 18)
        return 'Under 18';

    if (age <= 24)
        return '18-24';

    if (age <= 34)
        return '25-34';

    if (age <= 44)
        return '35-44';

    return '45+';
}

function generatePatientRef() {

    return (
        'PAT' +
        Date.now() +
        Math.floor(Math.random() * 1000)
    );
}

// IMPORT EXCEL
app.get('/import-excel', (req, res) => {

    try {

        const excelPath =
            path.join(
                __dirname,
                'users (2).xlsx'
            );

        const workbook =
            XLSX.readFile(excelPath);

        const sheetName =
            workbook.SheetNames[0];

        const worksheet =
            workbook.Sheets[sheetName];

        const data =
            XLSX.utils.sheet_to_json(
                worksheet
            );

        db.run(
            `DELETE FROM users`
        );

        let count = 0;

        data.forEach((row) => {

            db.run(
                `
                INSERT INTO users
                (
                    name,
                    dob,
                    address,
                    symptom,
                    is_adult
                )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    row.name,
                    row.dob,
                    row.address,
                    row.symptom,
                    row.is_adult
                ]
            );

            count++;

        });

        res.json({
            message:
                `${count} records imported successfully`
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }

});

// VIEW ORIGINAL DATA
app.get('/users', (req, res) => {

    db.all(
        'SELECT * FROM users',
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

// ANONYMISE DATA
app.get('/anonymise-existing', (req, res) => {

    db.run(
        'DELETE FROM anonymised_users'
    );

    db.all(
        'SELECT * FROM users',
        [],
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            let count = 0;

            rows.forEach((user) => {

                const age =
                    calculateAge(
                        user.dob
                    );

                const ageGroup =
                    getAgeGroup(age);

                const patientRef =
                    generatePatientRef();

                const createdAt =
                    new Date().toISOString();

                db.run(
                    `
                    INSERT INTO anonymised_users
                    (
                        patient_ref,
                        age_group,
                        symptom,
                        is_adult,
                        created_at
                    )
                    VALUES (?, ?, ?, ?, ?)
                    `,
                    [
                        patientRef,
                        ageGroup,
                        user.symptom,
                        user.is_adult,
                        createdAt
                    ]
                );

                count++;

            });

            res.json({
                message:
                    `${count} records anonymised successfully`
            });

        }
    );

});

// VIEW ANONYMISED DATA
app.get('/anonymised-users', (req, res) => {

    db.all(
        'SELECT * FROM anonymised_users',
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

// EXPORT ANONYMISED EXCEL
app.get('/export-anonymised-excel', (req, res) => {

    db.all(
        'SELECT * FROM anonymised_users',
        [],
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            const worksheet =
                XLSX.utils.json_to_sheet(rows);

            const workbook =
                XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                'AnonymisedUsers'
            );

            const fileName =
                'anonymised_users.xlsx';

            XLSX.writeFile(
                workbook,
                fileName
            );

            res.download(fileName);

        }
    );

});


// AUTOMATED DESTRUCTION
setInterval(() => {

    const cutoff =
        new Date(
            Date.now() - 60000
        ).toISOString();

    db.run(
        `
        DELETE FROM anonymised_users
        WHERE created_at < ?
        `,
        [cutoff]
    );

}, 30000);

// HOME
app.get('/', (req, res) => {

    res.send(
        'Privacy Engineering Prototype Running'
    );

});

// START SERVER
const PORT = 3000;

app.listen(PORT, () => {

    console.log(
        `Server running on http://localhost:${PORT}`
    );

});

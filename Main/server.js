/**
 * PNP Checkpoint Violation Processing and Records Management System (PNP-CVPRMS)
 * Backend Server Application
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE CONFIGURATION
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================
// DATABASE INITIALIZATION
// ==========================================
const db = new sqlite3.Database('./pnp_checkpoint.db', (err) => {
    if (err) {
        console.error('[DATABASE ERROR] Failed to connect to SQLite database:', err.message);
    } else {
        console.log('[DATABASE] Connected to SQLite database (pnp_checkpoint.db).');
        initializeSchema();
    }
});

function initializeSchema() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS violations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            driver_name TEXT NOT NULL,
            license_number TEXT NOT NULL,
            plate_number TEXT NOT NULL,
            violation_type TEXT NOT NULL,
            fine_amount REAL NOT NULL,
            officer_id TEXT NOT NULL,
            date_recorded TEXT NOT NULL
        )
    `;
    db.run(createTableQuery, (err) => {
        if (err) {
            console.error('[DATABASE ERROR] Table initialization failed:', err.message);
        } else {
            console.log('[DATABASE] Violations table verified/created successfully.');
        }
    });
}

// ==========================================
// DEFENSIVE PROGRAMMING / VALIDATION HELPERS
// ==========================================
function validateViolationPayload(data) {
    const errors = [];

    if (!data.driver_name || typeof data.driver_name !== 'string' || data.driver_name.trim() === '') {
        errors.push('Driver name is required and cannot be empty.');
    }
    if (!data.license_number || typeof data.license_number !== 'string' || data.license_number.trim() === '') {
        errors.push('Driver license number is required.');
    }
    if (!data.plate_number || typeof data.plate_number !== 'string' || data.plate_number.trim() === '') {
        errors.push('Vehicle plate number is required.');
    }
    if (!data.violation_type || typeof data.violation_type !== 'string' || data.violation_type.trim() === '') {
        errors.push('Violation type selection is required.');
    }
    if (!data.officer_id || typeof data.officer_id !== 'string' || data.officer_id.trim() === '') {
        errors.push('Apprehending Officer ID/Badge is required.');
    }

    const fine = parseFloat(data.fine_amount);
    if (isNaN(fine) || fine <= 0) {
        errors.push('Fine amount must be a positive numerical value.');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// ==========================================
// REST API ROUTES
// ==========================================

// GET /api/violations - Retrieve all violation records
app.get('/api/violations', (req, res) => {
    const query = 'SELECT * FROM violations ORDER BY id DESC';
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('[ERROR] Failed to fetch violations:', err.message);
            return res.status(500).json({ success: false, message: 'Database error occurred while fetching records.' });
        }
        return res.status(200).json({ success: true, count: rows.length, data: rows });
    });
});

// GET /api/violations/search - Search violations by license or plate
app.get('/api/violations/search', (req, res) => {
    const searchTerm = req.query.q;

    // Defensive check for empty or invalid query
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
        return res.status(400).json({ success: false, message: 'Search parameter "q" cannot be empty.' });
    }

    const queryPattern = `%${searchTerm.trim()}%`;
    const sql = `
        SELECT * FROM violations 
        WHERE license_number LIKE ? OR plate_number LIKE ? OR driver_name LIKE ?
        ORDER BY id DESC
    `;

    db.all(sql, [queryPattern, queryPattern, queryPattern], (err, rows) => {
        if (err) {
            console.error('[ERROR] Search query failed:', err.message);
            return res.status(500).json({ success: false, message: 'Database search query failed.' });
        }
        return res.status(200).json({ success: true, count: rows.length, data: rows });
    });
});

// POST /api/violations - Record a new violation
app.post('/api/violations', (req, res) => {
    try {
        const validation = validateViolationPayload(req.body);
        if (!validation.isValid) {
            return res.status(422).json({ success: false, errors: validation.errors });
        }

        const { driver_name, license_number, plate_number, violation_type, fine_amount, officer_id } = req.body;
        const date_recorded = new Date().toISOString().replace('T', ' ').substring(0, 19);

        const insertSql = `
            INSERT INTO violations (driver_name, license_number, plate_number, violation_type, fine_amount, officer_id, date_recorded)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            driver_name.trim(),
            license_number.trim().toUpperCase(),
            plate_number.trim().toUpperCase(),
            violation_type.trim(),
            parseFloat(fine_amount),
            officer_id.trim(),
            date_recorded
        ];

        db.run(insertSql, params, function (err) {
            if (err) {
                console.error('[ERROR] Insert violation failed:', err.message);
                return res.status(500).json({ success: false, message: 'Failed to save record to database.' });
            }
            return res.status(201).json({
                success: true,
                message: 'Violation recorded successfully.',
                recordId: this.lastID
            });
        });
    } catch (unexpectedError) {
        console.error('[FATAL ERROR] Unexpected exception in violation handler:', unexpectedError);
        return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
});

// ==========================================
// INTENTIONAL NON-COMPLIANT ENDPOINT (FOR AUDIT)
// ==========================================
// VIOLATION: No defensive input checking, no try/catch, synchronous unhandled file I/O
app.post('/api/audit/unsafe-log', (req, res) => {
    const rawNote = req.body.note;
    // Missing input validation, could write undefined or crash on non-existent path
    fs.appendFileSync('audit_dump.txt', rawNote + '\n');
    res.send('Raw memo saved without validation or error handling');
});

// ==========================================
// GLOBAL ERROR & 404 HANDLERS
// ==========================================
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Requested endpoint does not exist.' });
});

app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  PNP-CVPRMS Web Server running at http://localhost:${PORT}`);
    console.log(`====================================================`);
});
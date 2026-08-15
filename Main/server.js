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

const OFFENSE_SCHEDULE = {
    "No Driver's License": 1500,
    "Expired Vehicle Registration": 1200,
    "No Helmet / Seatbelt": 1000,
    "Driving Under the Influence (DUI)": 5000,
    "Illegal Modification": 2500,
    "Reckless Driving": 3000
};

const SCREENING_BLACKLIST = {
    plate_numbers: ['ABC-1234', 'XYZ-9876'],
    license_numbers: ['N01-12-345678'],
    drivers: ['Juan Dela Cruz', 'Pedro Santos']
};

function normalizeViolations(input) {
    if (Array.isArray(input)) {
        return [...new Set(input
            .map((item) => String(item || '').trim())
            .filter(Boolean))];
    }

    if (typeof input === 'string') {
        return [...new Set(input
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean))];
    }

    return [];
}

function calculateViolationTotal(violations) {
    const normalized = normalizeViolations(violations);
    return normalized.reduce((total, violation) => {
        const amount = Number(OFFENSE_SCHEDULE[violation] ?? 0);
        return total + (Number.isFinite(amount) ? amount : 0);
    }, 0);
}

function generateTicketNumber() {
    const timeStamp = Date.now().toString().slice(-8);
    const suffix = Array.from({ length: 6 }, () => {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return uppercase[Math.floor(Math.random() * uppercase.length)];
    }).join('');
    return `PNP-${timeStamp}-${suffix}`;
}

function assessScreening({ licenseNumber, plateNumber, driverName }) {
    const flags = [];
    const normalizedLicense = String(licenseNumber || '').trim().toUpperCase();
    const normalizedPlate = String(plateNumber || '').trim().toUpperCase();
    const normalizedDriver = String(driverName || '').trim();

    if (SCREENING_BLACKLIST.license_numbers.includes(normalizedLicense)) {
        flags.push('License record matches a flagged or expired local record.');
    }

    if (SCREENING_BLACKLIST.plate_numbers.includes(normalizedPlate)) {
        flags.push('Plate number matches a blacklisted or stolen local vehicle record.');
    }

    if (SCREENING_BLACKLIST.drivers.includes(normalizedDriver)) {
        flags.push('Driver name appears in the local wanted/flagged watchlist.');
    }

    if (!flags.length && (normalizedLicense.includes('EXPIRED') || normalizedPlate.includes('EXPIRED'))) {
        flags.push('License or plate data indicates expiry-related review.');
    }

    if (flags.length === 0) {
        return { status: 'clear', flags: ['No screening alerts found in local rule set.'] };
    }

    return { status: flags.length > 1 ? 'warning' : 'warning', flags };
}

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
            date_recorded TEXT NOT NULL,
            ticket_number TEXT,
            screening_status TEXT DEFAULT 'clear'
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

    const violationList = normalizeViolations(data.violation_type || data.violation_types);
    if (violationList.length === 0) {
        errors.push('At least one violation type is required.');
    }

    if (!data.officer_id || typeof data.officer_id !== 'string' || data.officer_id.trim() === '') {
        errors.push('Apprehending Officer ID/Badge is required.');
    }

    const fine = Number(data.fine_amount);
    if (!Number.isFinite(fine) || fine <= 0) {
        errors.push('Fine amount must be a positive numerical value.');
    }

    const totalExpected = calculateViolationTotal(violationList);
    if (Number.isFinite(fine) && Math.round(fine) !== Math.round(totalExpected)) {
        errors.push(`Matching fine total required for selected violations: ₱${totalExpected.toFixed(2)}.`);
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

app.get('/api/reports/summary', (req, res) => {
    const sql = `
        SELECT 
            COUNT(*) AS total_records,
            COALESCE(SUM(fine_amount), 0) AS total_fines,
            COUNT(CASE WHEN screening_status = 'warning' THEN 1 END) AS flagged_records
        FROM violations
    `;

    db.get(sql, [], (err, summary) => {
        if (err) {
            console.error('[ERROR] Summary query failed:', err.message);
            return res.status(500).json({ success: false, message: 'Failed to generate summary.' });
        }

        return res.status(200).json({
            success: true,
            data: {
                total_records: Number(summary.total_records || 0),
                total_fines: Number(summary.total_fines || 0),
                flagged_records: Number(summary.flagged_records || 0)
            }
        });
    });
});

// POST /api/violations - Record a new violation
app.post('/api/violations', (req, res) => {
    try {
        const validation = validateViolationPayload(req.body);
        if (!validation.isValid) {
            return res.status(422).json({ success: false, errors: validation.errors });
        }

        const { driver_name, license_number, plate_number, officer_id } = req.body;
        const violationList = normalizeViolations(req.body.violation_type || req.body.violation_types);
        const fineAmount = Number(req.body.fine_amount);
        const date_recorded = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const tickets = generateTicketNumber();
        const screening = assessScreening({
            licenseNumber: license_number,
            plateNumber: plate_number,
            driverName: driver_name
        });

        const insertSql = `
            INSERT INTO violations (
                driver_name, license_number, plate_number, violation_type, fine_amount,
                officer_id, date_recorded, ticket_number, screening_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            driver_name.trim(),
            license_number.trim().toUpperCase(),
            plate_number.trim().toUpperCase(),
            violationList.join(', '),
            fineAmount,
            officer_id.trim(),
            date_recorded,
            tickets,
            screening.status
        ];

        db.run(insertSql, params, function (err) {
            if (err) {
                console.error('[ERROR] Insert violation failed:', err.message);
                return res.status(500).json({ success: false, message: 'Failed to save record to database.' });
            }
            return res.status(201).json({
                success: true,
                message: 'Violation recorded successfully.',
                recordId: this.lastID,
                ticket_number: tickets,
                screening_status: screening.status,
                screening_flags: screening.flags,
                total_fine: fineAmount
            });
        });
    } catch (unexpectedError) {
        console.error('[FATAL ERROR] Unexpected exception in violation handler:', unexpectedError);
        return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
});

// ==========================================
// SAFE AUDIT LOG ENDPOINT
// ==========================================
app.post('/api/audit/log', (req, res) => {
    try {
        const rawNote = typeof req.body.note === 'string' ? req.body.note.trim() : '';

        if (!rawNote) {
            return res.status(400).json({ success: false, message: 'Audit note is required.' });
        }

        const safeEntry = `${new Date().toISOString()} | ${rawNote.replace(/\r?\n/g, ' ')}\n`;
        fs.appendFileSync(path.join(__dirname, 'audit_dump.txt'), safeEntry, 'utf8');
        return res.status(201).json({ success: true, message: 'Audit note saved securely.' });
    } catch (error) {
        console.error('[ERROR] Safe audit log failed:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to save audit log securely.' });
    }
});

// ==========================================
// GLOBAL ERROR & 404 HANDLERS
// ==========================================
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Requested endpoint does not exist.' });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(`  PNP-CVPRMS Web Server running at http://localhost:${PORT}`);
        console.log(`====================================================`);
    });
}

module.exports = {
    app,
    db,
    calculateViolationTotal,
    generateTicketNumber,
    assessScreening,
    normalizeViolations
};
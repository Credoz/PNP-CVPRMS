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
const STATION_NAME = process.env.STATION_NAME || 'Agoo Municipal Police Station';

const OFFENSE_SCHEDULE = {
    "No Driver's License": 1500,
    "Expired Vehicle Registration": 1200,
    "No Helmet / Seatbelt": 1000,
    "Driving Under the Influence (DUI)": 5000,
    "Illegal Modification": 2500,
    "Reckless Driving": 3000,
    "Failure to Carry Driver's License / OR-CR": 1000,
    "Disregarding Traffic Signs (DTS) / Red Light Violation": 1000,
    "Distracted Driving (RA 10913 - Mobile Device Use)": 5000,
    "Illegal Parking / Obstruction": 1000,
    "Unified Vehicular Volume Reduction Program (Number Coding)": 500,
    "Reckless Driving / Counterflow (Illegal Overtaking)": 3000,
    "Over-speeding": 1200,
    "Defective Equipment / Smoke Belching": 1500
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

function getLocalDateTimeString(d = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function assessScreening({ licenseNumber, plateNumber, driverName, idNumber }) {
    const flags = [];
    const normalizedLicense = String(licenseNumber || '').trim().toUpperCase();
    const normalizedPlate = String(plateNumber || '').trim().toUpperCase();
    const normalizedDriver = String(driverName || '').trim();

    let isAlarm = false;

    if (SCREENING_BLACKLIST.plate_numbers.includes(normalizedPlate)) {
        flags.push('Vehicle plate matches an active HPG Alarm / Stolen Vehicle record.');
        isAlarm = true;
    }

    if (SCREENING_BLACKLIST.drivers.includes(normalizedDriver)) {
        flags.push('Driver matches an active National Police Watchlist / Court Warrant.');
        isAlarm = true;
    }

    if (normalizedLicense && !normalizedLicense.includes('UNLICENSED') && SCREENING_BLACKLIST.license_numbers.includes(normalizedLicense)) {
        flags.push('License record matches a flagged suspension or repeat offender record.');
    }

    if (!flags.length && ((!normalizedLicense.includes('UNLICENSED') && normalizedLicense.includes('EXPIRED')) || normalizedPlate.includes('EXPIRED'))) {
        flags.push('License or plate indicates expired status requiring verification.');
    }

    if (flags.length === 0) {
        return { status: 'clear', status_label: 'CLEAR', flags: ['No screening alerts found in local rule set.'] };
    }

    if (isAlarm) {
        return { status: 'alarm', status_label: 'ALARM / HPG WANTED', flags };
    }

    return { status: 'warning', status_label: 'WARNING / REPEAT OFFENDER', flags };
}

// ==========================================
// MIDDLEWARE CONFIGURATION
// ==========================================
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/config', (req, res) => {
    return res.status(200).json({
        success: true,
        data: {
            station_name: STATION_NAME,
            environment: 'local prototype'
        }
    });
});

// ==========================================
// DATABASE INITIALIZATION
// ==========================================
const dbPath = path.join(__dirname, 'pnp_checkpoint.db');
const db = new sqlite3.Database(dbPath, (err) => {
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
            id_type TEXT,
            id_number TEXT,
            plate_number TEXT NOT NULL,
            vehicle_type TEXT DEFAULT 'Private/Sedan (UV)',
            vehicle_disposition TEXT DEFAULT 'Released with Citation',
            impound_receipt_no TEXT,
            shift_info TEXT,
            checkpoint_post TEXT,
            payment_status TEXT DEFAULT 'Unsettled / Unpaid',
            evidence_image TEXT,
            fine_override INTEGER DEFAULT 0,
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
            return;
        }

        db.all('PRAGMA table_info(violations)', (pragmaErr, columns) => {
            if (pragmaErr) {
                console.error('[DATABASE ERROR] Failed to inspect schema:', pragmaErr.message);
                return;
            }

            const existingColumns = new Set((columns || []).map((column) => column.name));
            const migrationSteps = [
                { name: 'ticket_number', sql: "ALTER TABLE violations ADD COLUMN ticket_number TEXT" },
                { name: 'screening_status', sql: "ALTER TABLE violations ADD COLUMN screening_status TEXT DEFAULT 'clear'" },
                { name: 'id_type', sql: "ALTER TABLE violations ADD COLUMN id_type TEXT" },
                { name: 'id_number', sql: "ALTER TABLE violations ADD COLUMN id_number TEXT" },
                { name: 'vehicle_type', sql: "ALTER TABLE violations ADD COLUMN vehicle_type TEXT DEFAULT 'Private/Sedan (UV)'" },
                { name: 'vehicle_disposition', sql: "ALTER TABLE violations ADD COLUMN vehicle_disposition TEXT DEFAULT 'Released with Citation'" },
                { name: 'impound_receipt_no', sql: "ALTER TABLE violations ADD COLUMN impound_receipt_no TEXT" },
                { name: 'shift_info', sql: "ALTER TABLE violations ADD COLUMN shift_info TEXT" },
                { name: 'checkpoint_post', sql: "ALTER TABLE violations ADD COLUMN checkpoint_post TEXT" },
                { name: 'payment_status', sql: "ALTER TABLE violations ADD COLUMN payment_status TEXT DEFAULT 'Unsettled / Unpaid'" },
                { name: 'evidence_image', sql: "ALTER TABLE violations ADD COLUMN evidence_image TEXT" },
                { name: 'fine_override', sql: "ALTER TABLE violations ADD COLUMN fine_override INTEGER DEFAULT 0" }
            ];

            const pending = migrationSteps.filter((step) => !existingColumns.has(step.name));

            if (pending.length === 0) {
                console.log('[DATABASE] Violations table verified/created successfully.');
                return;
            }

            db.serialize(() => {
                pending.forEach((step) => {
                    db.run(step.sql, (alterErr) => {
                        if (alterErr) {
                            console.error(`[DATABASE ERROR] Failed to add ${step.name}:`, alterErr.message);
                        }
                    });
                });

                console.log('[DATABASE] Violations table migrated successfully.');
            });
        });
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

    const violationList = normalizeViolations(data.violation_type || data.violation_types);
    const isUnlicensed = violationList.includes("No Driver's License");

    if (isUnlicensed) {
        if (!data.license_number || typeof data.license_number !== 'string' || data.license_number.trim() === '') {
            errors.push("Driver license number must be set to 'N/A - Unlicensed' when 'No Driver's License' is selected.");
        }
        if (!data.id_type || typeof data.id_type !== 'string' || data.id_type.trim() === '') {
            errors.push('Alternative ID type is required for unlicensed drivers.');
        }
        if (!data.id_number || typeof data.id_number !== 'string' || data.id_number.trim() === '') {
            errors.push('Alternative ID number is required for unlicensed drivers.');
        }
    } else {
        if (!data.license_number || typeof data.license_number !== 'string' || data.license_number.trim() === '') {
            errors.push('Driver license number is required.');
        } else if (data.license_number.trim().toUpperCase() === 'N/A - UNLICENSED') {
            errors.push("Driver license number cannot be 'N/A - Unlicensed' unless 'No Driver's License' violation is selected.");
        }
    }

    if (!data.plate_number || typeof data.plate_number !== 'string' || data.plate_number.trim() === '') {
        errors.push('Vehicle plate number is required.');
    }

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

    const isFineOverride = data.fine_override === 1 || data.fine_override === '1' || data.fine_override === true || data.fine_override === 'true';
    if (!isFineOverride) {
        const totalExpected = calculateViolationTotal(violationList);
        if (Number.isFinite(fine) && Math.abs(fine - totalExpected) > 0.05) {
            errors.push(`Matching fine total required for selected violations: ₱${totalExpected.toFixed(2)}.`);
        }
    }

    // Vehicle disposition check
    if (data.vehicle_disposition === 'Impounded') {
        if (!data.impound_receipt_no || typeof data.impound_receipt_no !== 'string' || data.impound_receipt_no.trim() === '') {
            errors.push('Impound Receipt / Towing Slip Number is required when vehicle disposition is Impounded.');
        }
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

// GET /api/violations/search - Search violations by ticket, license, plate, driver, ID, officer, or violation
app.get('/api/violations/search', (req, res) => {
    const searchTerm = req.query.q;

    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
        return res.status(400).json({ success: false, message: 'Search parameter "q" cannot be empty.' });
    }

    const queryPattern = `%${searchTerm.trim()}%`;
    const sql = `
        SELECT * FROM violations 
        WHERE ticket_number LIKE ?
           OR license_number LIKE ?
           OR plate_number LIKE ?
           OR driver_name LIKE ?
           OR id_number LIKE ?
           OR id_type LIKE ?
           OR officer_id LIKE ?
           OR violation_type LIKE ?
        ORDER BY id DESC
    `;

    const searchParams = Array(8).fill(queryPattern);
    db.all(sql, searchParams, (err, rows) => {
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
            COUNT(CASE WHEN screening_status IN ('warning', 'alarm') THEN 1 END) AS flagged_records,
            COUNT(CASE WHEN payment_status IS NULL OR payment_status NOT LIKE '%Paid%' THEN 1 END) AS unsettled_records
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
                flagged_records: Number(summary.flagged_records || 0),
                unsettled_records: Number(summary.unsettled_records || 0)
            }
        });
    });
});

// POST /api/violations - Record a new violation with operational checkpoint metadata
app.post('/api/violations', (req, res) => {
    try {
        const validation = validateViolationPayload(req.body);
        if (!validation.isValid) {
            return res.status(422).json({ success: false, errors: validation.errors });
        }

        const {
            driver_name,
            license_number,
            id_type,
            id_number,
            plate_number,
            vehicle_type,
            vehicle_disposition,
            impound_receipt_no,
            shift_info,
            checkpoint_post,
            payment_status,
            evidence_image,
            fine_override,
            officer_id
        } = req.body;

        const violationList = normalizeViolations(req.body.violation_type || req.body.violation_types);
        const fineAmount = Number(req.body.fine_amount);
        const date_recorded = getLocalDateTimeString();
        const tickets = generateTicketNumber();
        const screening = assessScreening({
            licenseNumber: license_number,
            plateNumber: plate_number,
            driverName: driver_name,
            idNumber: id_number
        });

        const insertSql = `
            INSERT INTO violations (
                driver_name, license_number, id_type, id_number, plate_number,
                vehicle_type, vehicle_disposition, impound_receipt_no,
                shift_info, checkpoint_post, payment_status, evidence_image, fine_override,
                violation_type, fine_amount, officer_id, date_recorded, ticket_number, screening_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            driver_name.trim(),
            license_number.trim().toUpperCase(),
            id_type ? String(id_type).trim() : null,
            id_number ? String(id_number).trim().toUpperCase() : null,
            plate_number.trim().toUpperCase(),
            vehicle_type ? String(vehicle_type).trim() : 'Private/Sedan (UV)',
            vehicle_disposition ? String(vehicle_disposition).trim() : 'Released with Citation',
            impound_receipt_no ? String(impound_receipt_no).trim() : null,
            shift_info ? String(shift_info).trim() : null,
            checkpoint_post ? String(checkpoint_post).trim() : null,
            payment_status ? String(payment_status).trim() : 'Unsettled / Unpaid',
            evidence_image ? String(evidence_image) : null,
            fine_override ? 1 : 0,
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
                screening_status_label: screening.status_label,
                screening_flags: screening.flags,
                total_fine: fineAmount,
                payment_status: payment_status || 'Unsettled / Unpaid',
                date_recorded
            });
        });
    } catch (unexpectedError) {
        console.error('[FATAL ERROR] Unexpected exception in violation handler:', unexpectedError);
        return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
});

// PATCH /api/violations/:id/status - Update violation payment/settlement status
app.patch('/api/violations/:id/status', (req, res) => {
    const violationId = parseInt(req.params.id, 10);
    if (isNaN(violationId) || violationId <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid violation ID parameter.' });
    }
    const { payment_status } = req.body;

    const allowedStatuses = ['Unsettled / Unpaid', 'Settled / Paid at Treasury', 'Voided / Contested'];
    if (!payment_status || !allowedStatuses.includes(payment_status)) {
        return res.status(400).json({
            success: false,
            message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
        });
    }

    const sql = `UPDATE violations SET payment_status = ? WHERE id = ?`;
    db.run(sql, [payment_status, violationId], function(err) {
        if (err) {
            console.error('[ERROR] Failed to update violation status:', err.message);
            return res.status(500).json({ success: false, message: 'Database error updating status.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'Violation record not found.' });
        }
        return res.status(200).json({
            success: true,
            message: `Status updated to ${payment_status}`,
            payment_status
        });
    });
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
    STATION_NAME,
    OFFENSE_SCHEDULE,
    calculateViolationTotal,
    generateTicketNumber,
    assessScreening,
    normalizeViolations,
    validateViolationPayload,
    getLocalDateTimeString
};
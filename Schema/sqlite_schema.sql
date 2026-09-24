-- =============================================================================
-- PHILIPPINE NATIONAL POLICE (PNP)
-- Computerized Violation Processing and Records Management System (PNP-CVPRMS)
-- SQLite Database Schema (Embedded Checkpoint Prototype & Normalized Architecture)
-- =============================================================================
-- Version: 2.0.0
-- Database Engine: SQLite 3
-- Target Environment: Local Demonstration Prototype & Checkpoint POS Terminal
-- =============================================================================

PRAGMA foreign_keys = ON;

-- =============================================================================
-- SECTION 1: OPERATIONAL VIOLATIONS TABLE (DIRECT PROTOTYPE IMPLEMENTATION)
-- Used by Source Code/server.js and Source Code/pnp_checkpoint.db
-- Designed for rapid real-time checkpoint data capture, offline thermal slip POS
-- printing, and single-query search & screening.
-- =============================================================================
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
    ticket_number TEXT UNIQUE,
    screening_status TEXT DEFAULT 'clear'
);

-- Search and performance indexes for operational queries
CREATE INDEX IF NOT EXISTS idx_violations_ticket ON violations (ticket_number);
CREATE INDEX IF NOT EXISTS idx_violations_plate ON violations (plate_number);
CREATE INDEX IF NOT EXISTS idx_violations_license ON violations (license_number);
CREATE INDEX IF NOT EXISTS idx_violations_driver ON violations (driver_name);
CREATE INDEX IF NOT EXISTS idx_violations_officer ON violations (officer_id);
CREATE INDEX IF NOT EXISTS idx_violations_status ON violations (payment_status);
CREATE INDEX IF NOT EXISTS idx_violations_date ON violations (date_recorded);
CREATE INDEX IF NOT EXISTS idx_violations_screening ON violations (screening_status);

-- =============================================================================
-- SECTION 2: NORMALIZED RELATIONAL SCHEMA (SQLITE IMPLEMENTATION)
-- Crow's Foot ERD Relational Architecture (8 Core Entities + Audit Logs)
-- =============================================================================

-- 1. OFFICERS
CREATE TABLE IF NOT EXISTS officers (
    officer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    badge_number TEXT NOT NULL UNIQUE,
    rank TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    station TEXT NOT NULL DEFAULT 'Agoo Municipal Police Station',
    contact_number TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 2. CHECKPOINTS
CREATE TABLE IF NOT EXISTS checkpoints (
    checkpoint_id INTEGER PRIMARY KEY AUTOINCREMENT,
    location TEXT NOT NULL,
    date_conducted TEXT NOT NULL,
    time_start TEXT NOT NULL,
    time_end TEXT,
    shift_info TEXT,
    lead_officer_id INTEGER NOT NULL,
    status TEXT DEFAULT 'Active',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (lead_officer_id) REFERENCES officers (officer_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 3. VIOLATORS
CREATE TABLE IF NOT EXISTS violators (
    violator_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    license_number TEXT NOT NULL,
    id_type TEXT,
    id_number TEXT,
    address TEXT,
    contact_number TEXT,
    is_flagged_watchlist INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 4. VEHICLES
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_number TEXT NOT NULL UNIQUE,
    vehicle_type TEXT NOT NULL DEFAULT 'Private/Sedan (UV)',
    make TEXT,
    model TEXT,
    color TEXT,
    registered_owner TEXT,
    is_hpg_alarm INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 5. OFFENSES
CREATE TABLE IF NOT EXISTS offenses (
    offense_id INTEGER PRIMARY KEY AUTOINCREMENT,
    offense_code TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    fine_amount REAL NOT NULL,
    law_violated TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 6. TICKETS
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_number TEXT NOT NULL UNIQUE,
    date_issued TEXT NOT NULL,
    time_issued TEXT NOT NULL,
    checkpoint_id INTEGER NOT NULL,
    officer_id INTEGER NOT NULL,
    violator_id INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL,
    confiscated_item TEXT,
    vehicle_disposition TEXT NOT NULL DEFAULT 'Released with Citation',
    impound_receipt_no TEXT,
    screening_status TEXT NOT NULL DEFAULT 'clear',
    fine_override INTEGER NOT NULL DEFAULT 0,
    total_fine REAL NOT NULL DEFAULT 0.0,
    evidence_image TEXT,
    status TEXT NOT NULL DEFAULT 'Unsettled / Unpaid',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (checkpoint_id) REFERENCES checkpoints (checkpoint_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (officer_id) REFERENCES officers (officer_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (violator_id) REFERENCES violators (violator_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles (vehicle_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 7. TICKET_OFFENSES (Associative Entity)
CREATE TABLE IF NOT EXISTS ticket_offenses (
    ticket_offense_id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    offense_id INTEGER NOT NULL,
    fine_amount REAL NOT NULL,
    FOREIGN KEY (ticket_id) REFERENCES tickets (ticket_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (offense_id) REFERENCES offenses (offense_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 8. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    or_number TEXT NOT NULL UNIQUE,
    ticket_id INTEGER NOT NULL UNIQUE,
    date_paid TEXT NOT NULL,
    amount_paid REAL NOT NULL,
    handled_by TEXT NOT NULL,
    payment_method TEXT DEFAULT 'Cash',
    remarks TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (ticket_id) REFERENCES tickets (ticket_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 9. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT DEFAULT (datetime('now', 'localtime')),
    officer_id INTEGER,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    ip_address TEXT,
    FOREIGN KEY (officer_id) REFERENCES officers (officer_id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- Normalized Indexes
CREATE INDEX IF NOT EXISTS idx_norm_officer_badge ON officers (badge_number);
CREATE INDEX IF NOT EXISTS idx_norm_checkpoint_date ON checkpoints (date_conducted);
CREATE INDEX IF NOT EXISTS idx_norm_violator_license ON violators (license_number);
CREATE INDEX IF NOT EXISTS idx_norm_vehicle_plate ON vehicles (plate_number);
CREATE INDEX IF NOT EXISTS idx_norm_ticket_number ON tickets (ticket_number);
CREATE INDEX IF NOT EXISTS idx_norm_payment_or ON payments (or_number);

-- =============================================================================
-- SECTION 3: NORMALIZED VIEW FOR CROSS-COMPATIBILITY
-- Synthesizes the relational tables into a unified view mirroring the violations structure
-- =============================================================================
CREATE VIEW IF NOT EXISTS v_violation_tickets AS
SELECT 
    t.ticket_id AS id,
    (v.first_name || ' ' || v.last_name) AS driver_name,
    v.license_number,
    v.id_type,
    v.id_number,
    veh.plate_number,
    veh.vehicle_type,
    t.vehicle_disposition,
    t.impound_receipt_no,
    c.shift_info,
    c.location AS checkpoint_post,
    t.status AS payment_status,
    t.evidence_image,
    t.fine_override,
    GROUP_CONCAT(o.description, ', ') AS violation_type,
    t.total_fine AS fine_amount,
    off.badge_number AS officer_id,
    (t.date_issued || ' ' || t.time_issued) AS date_recorded,
    t.ticket_number,
    t.screening_status
FROM tickets t
JOIN violators v ON t.violator_id = v.violator_id
JOIN vehicles veh ON t.vehicle_id = veh.vehicle_id
JOIN officers off ON t.officer_id = off.officer_id
JOIN checkpoints c ON t.checkpoint_id = c.checkpoint_id
LEFT JOIN ticket_offenses tof ON t.ticket_id = tof.ticket_id
LEFT JOIN offenses o ON tof.offense_id = o.offense_id
GROUP BY t.ticket_id;

-- =============================================================================
-- SECTION 4: SEED DATA (PHILIPPINE TRAFFIC FINES & STANDARD STATIONS)
-- =============================================================================
INSERT OR IGNORE INTO offenses (offense_code, description, fine_amount, law_violated) VALUES
('NL-01', 'No Driver''s License', 1500.00, 'Republic Act 4136 / JAO 2014-01 Sec. 1(a)'),
('EX-02', 'Expired Vehicle Registration', 1200.00, 'Republic Act 4136 / JAO 2014-01 Sec. 2(b)'),
('ST-03', 'No Helmet / Seatbelt', 1000.00, 'Republic Act 10054 / Republic Act 8750'),
('DU-04', 'Driving Under the Influence (DUI)', 5000.00, 'Republic Act 10586 (Anti-Drunk & Drugged Driving)'),
('MD-05', 'Illegal Modification', 2500.00, 'JAO 2014-01 Sec. 2(e) / LTO AO 84-001'),
('RD-06', 'Reckless Driving', 3000.00, 'Republic Act 4136 Sec. 48 / JAO 2014-01'),
('NC-07', 'Failure to Carry Driver''s License / OR-CR', 1000.00, 'Republic Act 4136 Sec. 19 / JAO 2014-01'),
('TS-08', 'Disregarding Traffic Signs (DTS) / Red Light Violation', 1000.00, 'Republic Act 4136 Sec. 52 / JAO 2014-01'),
('DD-09', 'Distracted Driving (RA 10913 - Mobile Device Use)', 5000.00, 'Republic Act 10913 (Anti-Distracted Driving Act)'),
('IP-10', 'Illegal Parking / Obstruction', 1000.00, 'Republic Act 4136 Sec. 46 / Municipal Ordinance'),
('UV-11', 'Unified Vehicular Volume Reduction Program (Number Coding)', 500.00, 'MMDA Regulation / Municipal Ordinance'),
('CF-12', 'Reckless Driving / Counterflow (Illegal Overtaking)', 3000.00, 'Republic Act 4136 Sec. 39-41 / JAO 2014-01'),
('OS-13', 'Over-speeding', 1200.00, 'Republic Act 4136 Sec. 35 / JAO 2014-01'),
('DE-14', 'Defective Equipment / Smoke Belching', 1500.00, 'Republic Act 8749 (Clean Air Act) / JAO 2014-01');

INSERT OR IGNORE INTO officers (badge_number, rank, first_name, last_name, station) VALUES
('PNP-AGO-8821', 'PEMS', 'Casey', 'Freud', 'Agoo Municipal Police Station'),
('PNP-AGO-7714', 'PSSg', 'Angelo', 'Reyes', 'Agoo Municipal Police Station'),
('PNP-AGO-6540', 'PCpl', 'Antonio', 'Cruz', 'Agoo Municipal Police Station'),
('PNP-AGO-9901', 'PMSg', 'Augusto', 'Manuel', 'Agoo Municipal Police Station');

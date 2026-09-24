-- =============================================================================
-- PHILIPPINE NATIONAL POLICE (PNP)
-- Computerized Violation Processing and Records Management System (PNP-CVPRMS)
-- Target Enterprise Relational Database Schema (ANSI SQL / PostgreSQL / MySQL)
-- =============================================================================
-- Version: 2.0.0
-- Standard: Philippine National Police - JAO 2014-01 / RA 4136 / RA 10913
-- Target Platform: Enterprise Central Database (Cloud RDBMS / PostgreSQL / MariaDB / MySQL)
-- Description: Complete normalized relational schema for multi-station deployment,
--              integrating officers, checkpoints, violators, vehicles, citations,
--              itemized statutory offenses, and treasury payments.
-- =============================================================================

-- =============================================================================
-- 1. TABLE: OFFICERS
-- Holds PNP personnel and law enforcement officer credentials and assignments.
-- =============================================================================
CREATE TABLE IF NOT EXISTS officers (
    officer_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    badge_number VARCHAR(50) NOT NULL UNIQUE,
    rank VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    station VARCHAR(150) NOT NULL DEFAULT 'Agoo Municipal Police Station',
    contact_number VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_officers_badge ON officers (badge_number);
CREATE INDEX idx_officers_station ON officers (station);

-- =============================================================================
-- 2. TABLE: CHECKPOINTS
-- Records operational checkpoint operations, locations, shifts, and lead officers.
-- =============================================================================
CREATE TABLE IF NOT EXISTS checkpoints (
    checkpoint_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(255) NOT NULL,
    date_conducted DATE NOT NULL,
    time_start TIME NOT NULL,
    time_end TIME,
    shift_info VARCHAR(100), -- Shift 1: Day (06:00-14:00), Shift 2: Afternoon (14:00-22:00), Shift 3: Night (22:00-06:00)
    lead_officer_id BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Concluded', 'Cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_checkpoint_officer
        FOREIGN KEY (lead_officer_id)
        REFERENCES officers (officer_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX idx_checkpoints_date ON checkpoints (date_conducted);
CREATE INDEX idx_checkpoints_location ON checkpoints (location);

-- =============================================================================
-- 3. TABLE: VIOLATORS
-- Registry of apprehended individuals, driving credentials, and identification.
-- =============================================================================
CREATE TABLE IF NOT EXISTS violators (
    violator_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) NOT NULL, -- Driver's license number or 'N/A - Unlicensed'
    id_type VARCHAR(50),                -- 'Philippine National ID', 'Passport', 'SSS/GSIS', etc.
    id_number VARCHAR(100),             -- Alternative ID credential number
    address VARCHAR(255),
    contact_number VARCHAR(50),
    is_flagged_watchlist BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_violators_name ON violators (last_name, first_name);
CREATE INDEX idx_violators_license ON violators (license_number);
CREATE INDEX idx_violators_id_num ON violators (id_number);

-- =============================================================================
-- 4. TABLE: VEHICLES
-- Registry of vehicles screened and apprehended during checkpoint operations.
-- =============================================================================
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type VARCHAR(50) NOT NULL DEFAULT 'Private/Sedan (UV)',
    make VARCHAR(50),
    model VARCHAR(50),
    color VARCHAR(50),
    registered_owner VARCHAR(150),
    is_hpg_alarm BOOLEAN DEFAULT FALSE, -- Flagged against Highway Patrol Group stolen registry
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_plate ON vehicles (plate_number);
CREATE INDEX idx_vehicles_type ON vehicles (vehicle_type);

-- =============================================================================
-- 5. TABLE: OFFENSES
-- Standard statutory traffic violations and fines (JAO 2014-01 / RA 4136 / RA 10913).
-- =============================================================================
CREATE TABLE IF NOT EXISTS offenses (
    offense_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    offense_code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    fine_amount DECIMAL(10, 2) NOT NULL,
    law_violated VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_offenses_code ON offenses (offense_code);

-- =============================================================================
-- 6. TABLE: TICKETS
-- Master citation records issued to violators during checkpoint operations.
-- =============================================================================
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    date_issued DATE NOT NULL,
    time_issued TIME NOT NULL,
    checkpoint_id BIGINT NOT NULL,
    officer_id BIGINT NOT NULL,
    violator_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL,
    confiscated_item VARCHAR(255),
    vehicle_disposition VARCHAR(50) NOT NULL DEFAULT 'Released with Citation', -- 'Released with Citation', 'Impounded', 'Turned Over to HPG'
    impound_receipt_no VARCHAR(100),
    screening_status VARCHAR(50) NOT NULL DEFAULT 'clear', -- 'clear', 'warning', 'alarm'
    fine_override BOOLEAN NOT NULL DEFAULT FALSE,
    total_fine DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    evidence_image LONGTEXT, -- Base64 encoded or URL path to stored photo
    status VARCHAR(50) NOT NULL DEFAULT 'Unsettled / Unpaid', -- 'Unsettled / Unpaid', 'Settled / Paid at Treasury', 'Voided / Contested'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tickets_checkpoint
        FOREIGN KEY (checkpoint_id)
        REFERENCES checkpoints (checkpoint_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_tickets_officer
        FOREIGN KEY (officer_id)
        REFERENCES officers (officer_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_tickets_violator
        FOREIGN KEY (violator_id)
        REFERENCES violators (violator_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_tickets_vehicle
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicles (vehicle_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX idx_tickets_number ON tickets (ticket_number);
CREATE INDEX idx_tickets_date ON tickets (date_issued);
CREATE INDEX idx_tickets_status ON tickets (status);
CREATE INDEX idx_tickets_screening ON tickets (screening_status);
CREATE INDEX idx_tickets_checkpoint ON tickets (checkpoint_id);
CREATE INDEX idx_tickets_officer ON tickets (officer_id);

-- =============================================================================
-- 7. TABLE: TICKET_OFFENSES
-- Associative entity mapping multiple offenses to a single citation ticket.
-- =============================================================================
CREATE TABLE IF NOT EXISTS ticket_offenses (
    ticket_offense_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    offense_id BIGINT NOT NULL,
    fine_amount DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_to_ticket
        FOREIGN KEY (ticket_id)
        REFERENCES tickets (ticket_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_to_offense
        FOREIGN KEY (offense_id)
        REFERENCES offenses (offense_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX idx_to_ticket ON ticket_offenses (ticket_id);
CREATE INDEX idx_to_offense ON ticket_offenses (offense_id);

-- =============================================================================
-- 8. TABLE: PAYMENTS
-- Settlement records for tickets paid at the Municipal Treasury / Finance Office.
-- =============================================================================
CREATE TABLE IF NOT EXISTS payments (
    payment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    or_number VARCHAR(50) NOT NULL UNIQUE, -- Official Receipt Number
    ticket_id BIGINT NOT NULL UNIQUE,
    date_paid DATE NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    handled_by VARCHAR(100) NOT NULL,     -- Cashier / Treasury Staff name or ID
    payment_method VARCHAR(50) DEFAULT 'Cash', -- 'Cash', 'Online/Landbank', 'GCash'
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_ticket
        FOREIGN KEY (ticket_id)
        REFERENCES tickets (ticket_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX idx_payments_or ON payments (or_number);
CREATE INDEX idx_payments_date ON payments (date_paid);

-- =============================================================================
-- 9. TABLE: AUDIT_LOGS
-- Comprehensive security and accountability trail for critical system actions.
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    officer_id BIGINT,
    action VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    ip_address VARCHAR(45),
    CONSTRAINT fk_audit_officer
        FOREIGN KEY (officer_id)
        REFERENCES officers (officer_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE INDEX idx_audit_timestamp ON audit_logs (timestamp);
CREATE INDEX idx_audit_officer ON audit_logs (officer_id);

-- =============================================================================
-- STANDARD SEED DATA: STATUTORY TRAFFIC OFFENSES (PHILIPPINE REGULATORY SCHEDULE)
-- =============================================================================
INSERT INTO offenses (offense_code, description, fine_amount, law_violated) VALUES
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

-- =============================================================================
-- SAMPLE SEED DATA: PNP OFFICERS & CHECKPOINT POSTS
-- =============================================================================
INSERT INTO officers (badge_number, rank, first_name, last_name, station) VALUES
('PNP-AGO-8821', 'PEMS', 'Casey', 'Freud', 'Agoo Municipal Police Station'),
('PNP-AGO-7714', 'PSSg', 'Angelo', 'Reyes', 'Agoo Municipal Police Station'),
('PNP-AGO-6540', 'PCpl', 'Antonio', 'Cruz', 'Agoo Municipal Police Station'),
('PNP-AGO-9901', 'PMSg', 'Augusto', 'Manuel', 'Agoo Municipal Police Station');

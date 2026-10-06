-- ==============================================================================
-- PHILIPPINE NATIONAL POLICE (PNP)
-- CHECKPOINT VEHICULAR PASSING & VIOLATIONS RECORD MANAGEMENT SYSTEM (PNP-CVPRMS)
-- DATABASE SCHEMA DEFINITION SCRIPT (DDL)
-- ==============================================================================
-- Target Engines: SQLite 3 (Edge/Terminal) / PostgreSQL & ANSI SQL-92 (Enterprise)
-- Single Source of Truth: Source Code/server.js, pnp_checkpoint.db, Schema/schema_diagram.png
-- ==============================================================================

-- ==============================================================================
-- PART 1: PHYSICAL RUNTIME SCHEMA (ACTIVE SQLITE DATABASE: pnp_checkpoint.db)
-- Designed for autonomous edge checkpoint terminals: zero join overhead, atomic writes.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS violations (
    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_number          TEXT NOT NULL UNIQUE,
    driver_name            TEXT NOT NULL,
    license_number         TEXT NOT NULL,
    id_type                TEXT,
    id_number              TEXT,
    plate_number           TEXT NOT NULL,
    vehicle_type           TEXT NOT NULL DEFAULT 'Private/Sedan (UV)',
    vehicle_disposition    TEXT NOT NULL DEFAULT 'Released with Citation',
    impound_receipt_no     TEXT,
    shift_info             TEXT,
    checkpoint_post        TEXT,
    payment_status         TEXT NOT NULL DEFAULT 'Unsettled / Unpaid',
    evidence_image         TEXT,
    fine_override          INTEGER NOT NULL DEFAULT 0,
    violation_type         TEXT NOT NULL,
    fine_amount            REAL NOT NULL,
    officer_id             TEXT NOT NULL,
    date_recorded          TEXT NOT NULL,
    screening_status       TEXT NOT NULL DEFAULT 'clear'
);

-- Edge Performance Indexes for Wildcard Search & Dashboard Aggregations
CREATE INDEX IF NOT EXISTS idx_violations_plate_number      ON violations(plate_number);
CREATE INDEX IF NOT EXISTS idx_violations_ticket_number     ON violations(ticket_number);
CREATE INDEX IF NOT EXISTS idx_violations_driver_name       ON violations(driver_name);
CREATE INDEX IF NOT EXISTS idx_violations_license_number    ON violations(license_number);
CREATE INDEX IF NOT EXISTS idx_violations_date_recorded     ON violations(date_recorded);
CREATE INDEX IF NOT EXISTS idx_violations_payment_status    ON violations(payment_status);
CREATE INDEX IF NOT EXISTS idx_violations_screening_status  ON violations(screening_status);
CREATE INDEX IF NOT EXISTS idx_violations_officer_id        ON violations(officer_id);


-- ==============================================================================
-- PART 2: NORMALIZED ENTERPRISE RELATIONAL SCHEMA (3NF)
-- Corresponds to Schema/schema_diagram.png for centralized headquarters deployment.
-- ==============================================================================

-- 1. Law Enforcement Officers
CREATE TABLE IF NOT EXISTS officers (
    officer_id             BIGINT PRIMARY KEY,
    badge_number           VARCHAR(50) NOT NULL UNIQUE,
    rank                   VARCHAR(50) NOT NULL,
    first_name             VARCHAR(100) NOT NULL,
    last_name              VARCHAR(100) NOT NULL,
    station                VARCHAR(150) NOT NULL,
    contact_number         VARCHAR(50)
);

-- 2. Checkpoint Deployments & Shifts
CREATE TABLE IF NOT EXISTS checkpoints (
    checkpoint_id          BIGINT PRIMARY KEY,
    location               VARCHAR(255) NOT NULL,
    date_conducted         DATE NOT NULL,
    time_start             TIME NOT NULL,
    time_end               TIME,
    shift_info             VARCHAR(100) NOT NULL,
    officer_id             BIGINT NOT NULL,
    CONSTRAINT fk_checkpoints_officer FOREIGN KEY (officer_id)
        REFERENCES officers(officer_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 3. Vehicle Registry
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id             BIGINT PRIMARY KEY,
    plate_number           VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type           VARCHAR(100) NOT NULL,
    make                   VARCHAR(100),
    model                  VARCHAR(100),
    color                  VARCHAR(50),
    registered_owner       VARCHAR(255)
);

-- 4. Violators / Motorists Registry
CREATE TABLE IF NOT EXISTS violators (
    violator_id            BIGINT PRIMARY KEY,
    first_name             VARCHAR(100) NOT NULL,
    last_name              VARCHAR(100) NOT NULL,
    license_number         VARCHAR(50) NOT NULL,
    id_type                VARCHAR(100),
    id_number              VARCHAR(100),
    address                TEXT,
    contact_number         VARCHAR(50)
);

-- 5. Violation Tickets (Master Citation Header)
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id              BIGINT PRIMARY KEY,
    ticket_number          VARCHAR(50) NOT NULL UNIQUE,
    date_issued            DATE NOT NULL,
    time_issued            TIME NOT NULL,
    checkpoint_id          BIGINT NOT NULL,
    officer_id             BIGINT NOT NULL,
    violator_id            BIGINT NOT NULL,
    vehicle_id             BIGINT NOT NULL,
    confiscated_item       VARCHAR(255),
    vehicle_disposition    VARCHAR(100) NOT NULL DEFAULT 'Released with Citation',
    impound_receipt_no     VARCHAR(50),
    screening_status       VARCHAR(50) NOT NULL DEFAULT 'clear',
    total_fine             DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status                 VARCHAR(50) NOT NULL DEFAULT 'Unsettled / Unpaid',
    CONSTRAINT fk_tickets_checkpoint FOREIGN KEY (checkpoint_id)
        REFERENCES checkpoints(checkpoint_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_tickets_officer FOREIGN KEY (officer_id)
        REFERENCES officers(officer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_tickets_violator FOREIGN KEY (violator_id)
        REFERENCES violators(violator_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_tickets_vehicle FOREIGN KEY (vehicle_id)
        REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 6. Tariff / Catalog of Traffic Offenses
CREATE TABLE IF NOT EXISTS offenses (
    offense_id             BIGINT PRIMARY KEY,
    offense_code           VARCHAR(50) NOT NULL UNIQUE,
    description            VARCHAR(255) NOT NULL,
    fine_amount            DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    law_violated           VARCHAR(255) NOT NULL
);

-- 7. Ticket Offenses Junction Table (Many-to-Many Bridge)
CREATE TABLE IF NOT EXISTS ticket_offenses (
    ticket_offense_id      BIGINT PRIMARY KEY,
    ticket_id              BIGINT NOT NULL,
    offense_id             BIGINT NOT NULL,
    fine_amount            DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_ticket_offenses_ticket FOREIGN KEY (ticket_id)
        REFERENCES tickets(ticket_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ticket_offenses_offense FOREIGN KEY (offense_id)
        REFERENCES offenses(offense_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 8. Payments & Settlement Transactions
CREATE TABLE IF NOT EXISTS payments (
    payment_id             BIGINT PRIMARY KEY,
    or_number              VARCHAR(50) NOT NULL UNIQUE,
    ticket_id              BIGINT NOT NULL,
    date_paid              DATE NOT NULL,
    amount_paid            DECIMAL(10, 2) NOT NULL,
    handled_by             VARCHAR(100) NOT NULL,
    CONSTRAINT fk_payments_ticket FOREIGN KEY (ticket_id)
        REFERENCES tickets(ticket_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Enterprise Relational Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number   ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_date_issued     ON tickets(date_issued);
CREATE INDEX IF NOT EXISTS idx_tickets_status          ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate_number   ON vehicles(plate_number);
CREATE INDEX IF NOT EXISTS idx_violators_license       ON violators(license_number);
CREATE INDEX IF NOT EXISTS idx_payments_or_number      ON payments(or_number);

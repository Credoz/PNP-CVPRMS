# Entity-Relationship Diagram (ERD)

**System**: PNP Checkpoint Violation Processing & Records Management System (PNP-CVPRMS)  
**Database**: SQLite 3 (`pnp_checkpoint.db`)  
**Single Source of Truth**: [`Source Code/server.js`](file:///c:/Users/emman/PNP-CVPRMS/Source%20Code/server.js) & [`Source Code/index.html`](file:///c:/Users/emman/PNP-CVPRMS/Source%20Code/index.html)

---

## 1. Overview

This document presents both the **Conceptual / Logical Relational Model (3NF)** and the **Physical SQLite Schema Implementation** deployed in PNP-CVPRMS. 

In field checkpoint operations, high query speed, zero-latency table scans, and autonomous offline durability are critical. The physical implementation consolidates operational citations into an optimized, self-contained `violations` table, with in-memory schedules and blacklists governing business constraints.

---

## 2. Conceptual & Logical ERD Visual & Mermaid Representation

![Entity Relationship Diagram Conceptual 3NF & Physical Architecture](ENTITY_RELATIONSHIP_DIAGRAM.png)

```mermaid
erDiagram
    OFFICER ||--o{ VIOLATION : apprehrends
    CHECKPOINT_POST ||--o{ VIOLATION : logs_at
    OPERATIONAL_SHIFT ||--o{ VIOLATION : occurs_during
    MOTORIST ||--o{ VIOLATION : incurs
    MOTORIST ||--o| ALTERNATIVE_ID : presents
    VEHICLE ||--o{ VIOLATION : involved_in
    VIOLATION ||--|{ VIOLATION_ITEM : contains
    OFFENSE_SCHEDULE ||--o{ VIOLATION_ITEM : defines
    VIOLATION ||--o| IMPOUND_RECORD : mandates
    VIOLATION ||--|| SCREENING_LOG : assesses

    OFFICER {
        string officer_id PK "e.g. PNP-OFFICER-4491"
        string officer_name "PO3 J. Del Rosario"
        string rank_title "Police Officer 3"
        string station_name "Agoo Municipal Police Station"
    }

    CHECKPOINT_POST {
        string post_id PK
        string post_name "Boundary Post - Brgy. San Nicolas Norte"
        string municipality "Agoo, La Union"
    }

    OPERATIONAL_SHIFT {
        string shift_id PK
        string shift_label "Shift 1: 06:00 - 14:00 (Day)"
        string time_start "06:00"
        string time_end "14:00"
    }

    MOTORIST {
        string motorist_id PK
        string driver_name "Juan Dela Cruz"
        string license_number "N01-12-345678 or N/A - UNLICENSED"
        boolean is_unlicensed "Flag derived from offense"
    }

    ALTERNATIVE_ID {
        string id_record_id PK
        string id_type "Philippine National ID, Passport, SSS"
        string id_number "1234-5678-9012"
    }

    VEHICLE {
        string plate_number PK "ABC 1234"
        string vehicle_type "Private/Sedan (UV), Motorcycle (MC)"
    }

    VIOLATION {
        int id PK "Auto-increment primary key"
        string ticket_number UK "PNP-XXXXXXXX-XXXXXX"
        datetime date_recorded "YYYY-MM-DD HH:mm:ss"
        string vehicle_disposition "Released with Citation, Impounded, HPG"
        float fine_amount "Total PHP fine"
        int fine_override "0 = Statutory, 1 = Discretionary"
        string payment_status "Unsettled, Settled, Voided"
        string evidence_image "Base64 Compressed JPEG"
    }

    OFFENSE_SCHEDULE {
        string offense_name PK "e.g. No Driver's License"
        float statutory_fee "1500.00"
        string legal_reference "JAO 2014-01 / RA 4136"
    }

    VIOLATION_ITEM {
        int item_id PK
        string offense_name FK
        float applied_fee
    }

    IMPOUND_RECORD {
        string impound_receipt_no PK "IMP-2026-0041"
        string towing_slip_ref
        string impound_lot "Municipal Impounding Yard"
    }

    SCREENING_LOG {
        string screening_id PK
        string screening_status "clear, warning, alarm"
        string alert_flags "HPG Alarm, Court Warrant, Suspension"
    }
```

---

## 3. Physical SQLite Schema Implementation (`violations`)

In the active production system, the SQLite database (`pnp_checkpoint.db`) implements the following single-table schema:

```mermaid
erDiagram
    violations {
        INTEGER id PK "AUTOINCREMENT"
        TEXT driver_name "NOT NULL"
        TEXT license_number "NOT NULL ('N01-12-345678' | 'N/A - UNLICENSED')"
        TEXT id_type "NULLABLE ('PhilID', 'Passport', etc.)"
        TEXT id_number "NULLABLE ('1234-5678-9012')"
        TEXT plate_number "NOT NULL ('ABC 1234')"
        TEXT vehicle_type "DEFAULT 'Private/Sedan (UV)'"
        TEXT vehicle_disposition "DEFAULT 'Released with Citation'"
        TEXT impound_receipt_no "NULLABLE ('IMP-2026-0041')"
        TEXT shift_info "NULLABLE ('Shift 1: 06:00 - 14:00 (Day)')"
        TEXT checkpoint_post "NULLABLE ('Boundary Post')"
        TEXT payment_status "DEFAULT 'Unsettled / Unpaid'"
        TEXT evidence_image "NULLABLE (Base64 Data URL)"
        INTEGER fine_override "DEFAULT 0"
        TEXT violation_type "NOT NULL ('No Driver\'s License, DTS')"
        REAL fine_amount "NOT NULL (Positive Numerical)"
        TEXT officer_id "NOT NULL ('PNP-OFFICER-4491')"
        TEXT date_recorded "NOT NULL ('YYYY-MM-DD HH:mm:ss')"
        TEXT ticket_number "NULLABLE ('PNP-XXXXXXXX-XXXXXX')"
        TEXT screening_status "DEFAULT 'clear'"
    }
```

---

## 4. Entity Cardinality & Relational Semantics

| Parent Entity | Child Entity | Cardinality | Business Semantics & Referential Constraints |
| :--- | :--- | :---: | :--- |
| **`OFFICER`** | **`VIOLATION`** | `1 : N` | One checkpoint officer can record multiple apprehensions during a shift. An apprehension must specify exactly one apprehending officer badge. |
| **`CHECKPOINT_POST`** | **`VIOLATION`** | `1 : N` | One checkpoint location logs multiple daily citation records. |
| **`OPERATIONAL_SHIFT`**| **`VIOLATION`** | `1 : N` | Citations belong to exactly one 8-hour shift bracket (Day, Afternoon, Night). |
| **`MOTORIST`** | **`VIOLATION`** | `1 : N` | A driver may be cited multiple times across different dates. |
| **`MOTORIST`** | **`ALTERNATIVE_ID`** | `1 : 0..1`| An unlicensed driver is associated with exactly one alternative government ID (e.g. National ID, Passport). |
| **`VEHICLE`** | **`VIOLATION`** | `1 : N` | A vehicle plate may be apprehended in multiple distinct checkpoint incidents. |
| **`VIOLATION`** | **`IMPOUND_RECORD`** | `1 : 0..1`| Exactly one impound receipt number is mandated if `vehicle_disposition == 'Impounded'`; omitted otherwise. |
| **`VIOLATION`** | **`VIOLATION_ITEM`** | `1 : 1..N`| A citation must register at least one apprehended infraction from the official offense schedule. |

---

## 5. Denormalization Rationale in SQLite

While the 3NF relational model specifies multiple normalized entities, PNP-CVPRMS intentionally denormalizes these fields into the `violations` table for the following design reasons:
1. **Zero-Latency Offline Checkpoint Operation**: Checkpoints often operate in field environments with intermittent connectivity or on battery-powered mobile terminals. Single-table operations eliminate multi-table JOIN overhead.
2. **Atomic Self-Contained Citations**: Citations serve as legal evidentiary records. Flattening the apprehended driver's name, license number, plate, fine, and officer badge directly into the record ensures that future external roster or schedule changes never retroactively alter past citations.
3. **High-Speed Full-Text Search**: Single-table layout enables fast SQLite multi-column search (`ticket_number`, `license_number`, `plate_number`, `driver_name`, `id_number`, `officer_id`) in a single query pass.

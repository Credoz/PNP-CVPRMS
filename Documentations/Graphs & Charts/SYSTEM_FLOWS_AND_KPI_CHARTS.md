# System Flows, Architectural Graphs & KPI Charts

**System**: PNP Checkpoint Violation Processing & Records Management System (PNP-CVPRMS)  
**Single Source of Truth**: [`Source Code/server.js`](file:///c:/Users/emman/PNP-CVPRMS/Source%20Code/server.js) & [`Source Code/index.html`](file:///c:/Users/emman/PNP-CVPRMS/Source%20Code/index.html)

---

## 1. System Architecture Diagram

![System Flows and Architectural KPI Charts](SYSTEM_FLOWS_AND_KPI_CHARTS.png)

```mermaid
graph TD
    subgraph Client_Tier["Client Tier (SPA Browser / Mobile Field Terminal)"]
        UI["Modern Responsive HTML5 / CSS3 Interface"]
        DOM_SESSION["Session State Controller<br/>(Post, Shift, Officer ID, Live Clock)"]
        CLIENT_SCREEN["Real-Time Watchlist Triage Evaluator<br/>(Local Watchlist Scan)"]
        CANVAS["HTML5 Canvas Image Downscaler<br/>(Max 1200px JPEG Compression)"]
        FILTER_ENGINE["In-Memory Multi-Criteria Filtering<br/>(Date: Today/Shift/7Days, Status: Flagged/Unpaid)"]
        THERMAL["Bluetooth POS ESC/POS Print Engine<br/>(58mm / 80mm Layout @ 72mm Width)"]
    end

    subgraph Server_Tier["Application Server Tier (Node.js / Express.js)"]
        EXPRESS["Express Web Server (Port 3000)"]
        CONFIG_ROUTE["GET /api/config<br/>(Station Name, Prototype Env)"]
        VIOLATIONS_ROUTE["GET /api/violations<br/>(Registry Fetch)"]
        SEARCH_ROUTE["GET /api/violations/search<br/>(8-Column SQL LIKE Engine)"]
        SUMMARY_ROUTE["GET /api/reports/summary<br/>(Real-Time KPI Aggregate Engine)"]
        POST_ROUTE["POST /api/violations<br/>(Validation, Ticket Gen, Screening Insert)"]
        PATCH_ROUTE["PATCH /api/violations/:id/status<br/>(Treasury Settlement Transition)"]
        SCREENING_ENGINE["Backend Authoritative Screening Engine<br/>(HPG Stolen, Warrants, Suspensions)"]
    end

    subgraph Data_Tier["Data Persistence Tier (SQLite 3)"]
        SQLITE[("SQLite Database<br/>(pnp_checkpoint.db)")]
        TABLE_VIOLATIONS["violations Table<br/>(20 Structured Columns)"]
        PRAGMA["Schema Migration Manager<br/>(PRAGMA table_info Idempotent Alters)"]
    end

    %% Client to Server HTTP API calls
    UI --> DOM_SESSION
    DOM_SESSION --> EXPRESS
    UI --> CANVAS
    CANVAS --> POST_ROUTE
    CLIENT_SCREEN --> UI
    UI -->|"fetch('POST /api/violations')"| POST_ROUTE
    UI -->|"fetch('GET /api/violations')"| VIOLATIONS_ROUTE
    UI -->|"fetch('GET /api/violations/search?q=')"| SEARCH_ROUTE
    UI -->|"fetch('GET /api/reports/summary')"| SUMMARY_ROUTE
    UI -->|"fetch('PATCH /api/violations/:id/status')"| PATCH_ROUTE
    UI --> FILTER_ENGINE
    UI --> THERMAL

    %% Server Internal Routing
    POST_ROUTE --> SCREENING_ENGINE
    EXPRESS --> CONFIG_ROUTE
    EXPRESS --> VIOLATIONS_ROUTE
    EXPRESS --> SEARCH_ROUTE
    EXPRESS --> SUMMARY_ROUTE
    EXPRESS --> POST_ROUTE
    EXPRESS --> PATCH_ROUTE

    %% Server to Database
    POST_ROUTE -->|"Parameterized INSERT"| TABLE_VIOLATIONS
    VIOLATIONS_ROUTE -->|"SELECT * ORDER BY id DESC"| TABLE_VIOLATIONS
    SEARCH_ROUTE -->|"SELECT * WHERE ticket LIKE ? OR plate LIKE ? ..."| TABLE_VIOLATIONS
    SUMMARY_ROUTE -->|"SELECT COUNT(*), SUM(fine_amount)..."| TABLE_VIOLATIONS
    PATCH_ROUTE -->|"UPDATE violations SET payment_status = ?..."| TABLE_VIOLATIONS
    PRAGMA --> SQLITE
    TABLE_VIOLATIONS --> SQLITE

    %% Styling
    classDef client fill:#E2E8F0,stroke:#0B1E3D,stroke-width:2px,color:#0B1E3D;
    classDef server fill:#0B1E3D,stroke:#C5A059,stroke-width:2px,color:#ffffff;
    classDef db fill:#FFFBEB,stroke:#D97706,stroke-width:2px,color:#78350F;
    class UI,DOM_SESSION,CLIENT_SCREEN,CANVAS,FILTER_ENGINE,THERMAL client;
    class EXPRESS,CONFIG_ROUTE,VIOLATIONS_ROUTE,SEARCH_ROUTE,SUMMARY_ROUTE,POST_ROUTE,PATCH_ROUTE,SCREENING_ENGINE server;
    class SQLITE,TABLE_VIOLATIONS,PRAGMA db;
```

---

## 2. Operational Checkpoint Apprehension & Settlement Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Officer as Checkpoint Officer
    actor Driver as Motorist / Driver
    participant Browser as CVPRMS Client SPA
    participant Server as Express Server
    participant DB as SQLite DB
    actor Treasury as Municipal Treasury

    Note over Officer,Browser: Session Setup: Officer selects Post, Shift, Badge ID
    Officer->>Driver: Signal stop at checkpoint & request credentials
    Driver->>Officer: Presents License / Alternate ID, OR/CR
    Officer->>Browser: Enters Driver Name, License No, Vehicle Plate
    Browser->>Browser: evaluateLocalScreening() runs on input blur
    alt Plate/Driver in Blacklist
        Browser-->>Officer: Flares RED ALARM (HPG Wanted / Court Warrant)
    else Expired License / Suspension
        Browser-->>Officer: Flares YELLOW WARNING
    else Nominal Record
        Browser-->>Officer: Green CLEAR Indicator
    end

    Officer->>Browser: Checks apprehended violations (e.g., No Helmet, Coding)
    Browser->>Browser: updateFineTotal() calculates sum from OFFENSE_SCHEDULE
    opt Manual Discretion Overridden
        Officer->>Browser: Toggles "Manual Officer Discretion" & enters custom fine
    end
    opt Impounded Vehicle
        Officer->>Browser: Selects "Impounded" & inputs Towing / Impound Slip #
    end
    opt Evidence Capture
        Officer->>Browser: Uploads confiscated license/vehicle photo
        Browser->>Browser: processEvidenceImage() downscales to max 1200px JPEG
    end

    Officer->>Browser: Clicks "Submit & Register Citation"
    Browser->>Browser: Disables submit button & verifies inputs
    Browser->>Server: POST /api/violations (JSON Payload)
    Server->>Server: validateViolationPayload() & assessScreening()
    Server->>Server: generateTicketNumber() (PNP-Timestamp-Suffix)
    Server->>DB: INSERT INTO violations (...) VALUES (...)
    DB-->>Server: Commits row & returns this.lastID
    Server-->>Browser: Status 201 Created + Ticket # + Screening Triage
    Browser->>Browser: Clears form, resets fields, reloads summary KPI

    Officer->>Browser: Clicks "Print Citation Receipt"
    Browser->>Officer: Triggers window.print() (Thermal 72mm Receipt)
    Officer->>Driver: Hands printed citation with 7-day settlement notice
    Driver->>Officer: Signs duplicate receipt copy

    Note over Driver,Treasury: Within 7 working days, motorist settles fine
    Driver->>Treasury: Presents ticket & settles monetary fine
    Treasury->>Browser: Opens Citation Details Modal via View Action
    Treasury->>Browser: Selects "Settled / Paid at Treasury" & clicks Save
    Browser->>Server: PATCH /api/violations/:id/status
    Server->>DB: UPDATE violations SET payment_status = ? WHERE id = ?
    DB-->>Server: Updates row (changes = 1)
    Server-->>Browser: Status 200 OK
    Browser->>Browser: Refreshes table badge & decrements Unsettled KPI
```

---

## 3. Executive KPI Metric Derivation & Logic Formulations

The dashboard presents four real-time Key Performance Indicator (KPI) metrics, computed synchronously via SQL aggregation and reflected in the summary cards:

```mermaid
graph LR
    subgraph KPI_Grid["Summary KPI Dashboard Cards"]
        K1["Total Citations<br/><code>id=totalRecords</code>"]
        K2["Total Statutory Fines<br/><code>id=totalFines</code>"]
        K3["Flagged / Alarms<br/><code>id=flaggedRecords</code>"]
        K4["Unsettled Violations<br/><code>id=unsettledRecords</code>"]
    end

    subgraph SQL_Engine["Backend SQL Aggregation (GET /api/reports/summary)"]
        Q1["COUNT(*) AS total_records"]
        Q2["COALESCE(SUM(fine_amount), 0) AS total_fines"]
        Q3["COUNT(CASE WHEN screening_status IN ('warning', 'alarm') THEN 1 END)"]
        Q4["COUNT(CASE WHEN payment_status IS NULL OR payment_status LIKE '%Unpaid%' OR payment_status LIKE '%Unsettled%' THEN 1 END)"]
    end

    Q1 --> K1
    Q2 --> K2
    Q3 --> K3
    Q4 --> K4
```

### 3.1 Mathematical Formulations

1. **Total Citations ($C_{\text{total}}$)**:
   $$C_{\text{total}} = \sum_{i=1}^{N} 1 = \text{COUNT(*)}$$
   *Represents the all-time gross count of registered apprehensions in the database.*

2. **Total Statutory Fines ($F_{\text{total}}$)**:
   $$F_{\text{total}} = \sum_{i=1}^{N} \text{fine\_amount}_i$$
   *Formatted using Philippine currency representation: `₱XX,XXX.00`.*

3. **Flagged Watchlist Ratio ($R_{\text{flagged}}$)**:
   $$R_{\text{flagged}} = \frac{\sum_{i=1}^{N} [\text{screening\_status}_i \in \{\text{'warning'}, \text{'alarm'}\}]}{C_{\text{total}}} \times 100\%$$
   *Indicates the density of high-risk motorists or stolen vehicles intercepted at checkpoints.*

4. **Outstanding Delinquency Rate ($D_{\text{unsettled}}$)**:
   $$D_{\text{unsettled}} = \frac{\sum_{i=1}^{N} [\text{payment\_status}_i \in \{\text{'Unsettled / Unpaid'}\}]}{C_{\text{total}}} \times 100\%$$
   *Monitors non-compliance rate within the statutory 7-working-day treasury settlement window.*

---

## 4. Bluetooth Thermal POS Receipt Print Workflow

```mermaid
flowchart TD
    TRIGGER["Officer triggers Print<br/>(From Table Action or Modal Details)"]
    FETCH["Retrieve record from allRecords cache"]
    POPULATE["populateThermalReceipt(rec):<br/>- Format Ticket, Date, Shift, Post<br/>- Format Driver & License/Alt-ID<br/>- Format Plate & Vehicle Disposition<br/>- Map itemized violations to OFFENSE_SCHEDULE fees<br/>- Format Total Fine & Officer ID"]
    INJECT["Inject dynamic lines into #thermalReceiptArea"]
    PRINT_CMD["Execute window.print()"]
    MEDIA_QUERY["@media print CSS rules activate:<br/>- Hide all body elements with display: none<br/>- Set body visibility: hidden<br/>- Set #thermalReceiptArea visibility: visible<br/>- Width locked to 72mm (Standard 58mm/80mm roll)<br/>- Courier New monospace font (11px, 1.25 line height)"]
    PRINTER["ESC/POS Bluetooth Receipt Printer Output:<br/>- Official PNP Checkpoint Citation<br/>- Violator Signature Line<br/>- Apprehending Officer Signature Line"]

    TRIGGER --> FETCH
    FETCH --> POPULATE
    POPULATE --> INJECT
    INJECT --> PRINT_CMD
    PRINT_CMD --> MEDIA_QUERY
    MEDIA_QUERY --> PRINTER
```

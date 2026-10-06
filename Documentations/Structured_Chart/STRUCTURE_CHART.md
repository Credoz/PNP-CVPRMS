# Structure Chart Architecture

**System**: PNP Checkpoint Violation Processing & Records Management System (PNP-CVPRMS)  
**Single Source of Truth**: [`Source Code/server.js`](file:///c:/Users/emman/PNP-CVPRMS/Source%20Code/server.js) & [`Source Code/index.html`](file:///c:/Users/emman/PNP-CVPRMS/Source%20Code/index.html)  
**Database**: SQLite (`pnp_checkpoint.db`) — Table: `violations`  

---

## 1. Architectural Overview & Notational Legend

A Structure Chart models the top-down modular decomposition of a software system, delineating the calling hierarchy, the boundaries between modules, and the flow of data couples and control flags across system boundaries.

### 1.1 Coupling & Flag Notation Guide
In the diagrams and module catalogs below, data flow and control flags are represented using standard software engineering notations:

* **Data Couple `[d: parameter]` (Open Circle $\circ\rightarrow$)**: An item of application data passed between calling and called modules without altering execution path logic.
* **Control Flag `[c: flag]` (Solid Circle $\bullet\rightarrow$)**: A binary, enum, or signal flag passed between modules specifically to direct execution branching, indicate error conditions, or signal status.
* **Selection Diamond `◇`**: Conditional invocation of a subordinate module based on the state of a control flag.
* **Repetition Arc `↻`**: Iterative or looped invocation of subordinate modules over collections or event streams.

```
       +----------------------------+
       |       CALLING MODULE       |
       +----------------------------+
                 |        |
    [d: dataIn]  |        |  [c: flagOut]
   (Open Circle) v        ^ (Solid Circle)
       +----------------------------+
       |     SUBORDINATE MODULE     |
       +----------------------------+
```

---

## 2. High-Level Modular Decomposition (Root Executive)

![Hierarchical Structure Chart Architecture](STRUCTURE_CHART.png)

The diagram below maps the dual-runtime architecture of PNP-CVPRMS: the **Client Browser Executive** (`index.html`) running on the checkpoint terminal and the **Backend Server Executive** (`server.js`) running in Node.js.

```mermaid
graph TD
    %% Root Executives
    CLIENT_ROOT["<b>0.0 CLIENT EXECUTIVE</b><br/>Browser Runtime (index.html)"]
    SERVER_ROOT["<b>0.1 SERVER EXECUTIVE</b><br/>Express App (server.js:10)"]

    %% Client Level 1
    C1["<b>1.0 Client Bootstrap & Config</b><br/>loadConfig / init"]
    C2["<b>2.0 Session & Officer Manager</b><br/>syncOfficerSession / clock"]
    C3["<b>3.0 Ingestion & Verification UI</b><br/>Form Controller & Live Rules"]
    C4["<b>4.0 Registry Query & View Controller</b><br/>Filters, Search & Table Render"]
    C5["<b>5.0 Modal & Status Controller</b><br/>Record Inspection & PATCH Status"]
    C6["<b>6.0 Peripheral & Export Subsystem</b><br/>Thermal POS & UTF-8 BOM CSV"]

    CLIENT_ROOT --> C1
    CLIENT_ROOT --> C2
    CLIENT_ROOT --> C3
    CLIENT_ROOT --> C4
    CLIENT_ROOT --> C5
    CLIENT_ROOT --> C6

    %% Server Level 1
    S1["<b>7.0 Station Config Service</b><br/>GET /api/config"]
    S2["<b>8.0 Watchlist Assessment Engine</b><br/>assessScreening()"]
    S3["<b>9.0 Defensive Payload Validator</b><br/>validateViolationPayload()"]
    S4["<b>10.0 SQLite Persistence Layer</b><br/>Parameterized DB Operations"]
    S5["<b>11.0 Reporting & Summary Service</b><br/>GET /api/reports/summary"]

    SERVER_ROOT --> S1
    SERVER_ROOT --> S2
    SERVER_ROOT --> S3
    SERVER_ROOT --> S4
    SERVER_ROOT --> S5

    %% Cross-boundary Network Couples
    C1 -. "HTTP GET<br/>[d: station_name]" .-> S1
    C3 -. "HTTP POST /api/violations<br/>[d: payload, c: fine_override]" .-> S3
    S3 -. "Invokes Validation<br/>[c: isValid, d: errors]" .-> S2
    C4 -. "HTTP GET /api/violations<br/>[d: searchParams]" .-> S4
    C4 -. "HTTP GET /api/reports/summary<br/>[d: KPI aggregates]" .-> S5
    C5 -. "HTTP PATCH /api/violations/:id/status<br/>[c: payment_status]" .-> S4

    classDef client fill:#EFF6FF,stroke:#2563EB,stroke-width:2px;
    classDef server fill:#FEF3C7,stroke:#D97706,stroke-width:2px;
    class CLIENT_ROOT,C1,C2,C3,C4,C5,C6 client;
    class SERVER_ROOT,S1,S2,S3,S4,S5 server;
```

---

## 3. Client-Side Structure Chart (`Source Code/index.html`)

The frontend application coordinates user interactions, real-time field masking, client-side watchlist triage, statutory fee computations, photographic canvas downscaling, table rendering, and thermal printing.

```mermaid
graph TD
    %% Main Client Ingestion & UI Root
    C3["<b>3.0 Citation Ingestion Controller</b><br/>form.onsubmit (index.html:1632)"]

    %% Subordinate Modules under C3
    M3_1["<b>3.1 License Conditional Handler</b><br/>handleLicenseConditionalState()<br/>(index.html:1446)"]
    M3_2["<b>3.2 Disposition & Impound Handler</b><br/>vehicleDispositionSelect.onchange<br/>(index.html:1479)"]
    M3_3["<b>3.3 Statutory Fine Calculator</b><br/>updateFineTotal()<br/>(index.html:1487)"]
    M3_4["<b>3.4 Local Screening Evaluator</b><br/>evaluateLocalScreening()<br/>(index.html:1510)"]
    M3_5["<b>3.5 Canvas Image Compressor</b><br/>processEvidenceImage()<br/>(index.html:1540)"]
    M3_6["<b>3.6 Network Ingestion Dispatcher</b><br/>fetch('POST /api/violations')<br/>(index.html:1693)"]
    M3_7["<b>3.7 Thermal Receipt Formatter</b><br/>populateThermalReceipt()<br/>(index.html:2041)"]

    %% Connections with Couples
    C3 -->|"<b>[c: isUnlicensed]</b><br/>[d: altIdType, altIdNo]"| M3_1
    C3 -->|"<b>[c: isImpounded]</b><br/>[d: impoundReceiptNo]"| M3_2
    C3 -->|"<b>[c: fineOverrideActive]</b><br/>[d: selectedViolations]"| M3_3
    C3 -->|"<b>[c: alertState]</b><br/>[d: plate, license, driver]"| M3_4
    C3 -->|"<b>[d: rawImageFile]</b><br/>[d: maxDim=1200, q=0.82]"| M3_5
    C3 -->|"<b>[d: jsonPayload]</b><br/>[c: submitBtnState]"| M3_6
    C3 -->|"<b>[d: citationRecord]</b><br/>[c: printTrigger]"| M3_7

    %% Subordinates of 3.4 Local Screening
    M3_4_1["<b>3.4.1 Screening Badge Renderer</b><br/>setScreeningBadge()<br/>(index.html:1529)"]
    M3_4 -->|"<b>[c: state: clear|warning|alarm]</b><br/>[d: label, message]"| M3_4_1

    %% Subordinates of 3.5 Canvas Compressor
    M3_5_1["<b>3.5.1 HTML5 Canvas Scaler</b><br/>drawImage(img, 0, 0, w, h)<br/>(index.html:1561)"]
    M3_5_2["<b>3.5.2 JPEG DataURL Encoder</b><br/>canvas.toDataURL('image/jpeg', 0.82)<br/>(index.html:1562)"]
    M3_5 --> M3_5_1
    M3_5 --> M3_5_2

    classDef cModule fill:#F8FAFC,stroke:#334155,stroke-width:1.5px;
    classDef cSub fill:#F0FDF4,stroke:#16A34A,stroke-width:1.5px;
    class C3,M3_1,M3_2,M3_3,M3_4,M3_5,M3_6,M3_7 cModule;
    class M3_4_1,M3_5_1,M3_5_2 cSub;
```

### 3.1 Client Registry, Search, and Status Transition Hierarchy

```mermaid
graph TD
    C4["<b>4.0 Registry Presentation Controller</b><br/>applyFiltersAndRender() (index.html:1826)"]

    %% Subordinates
    M4_1["<b>4.1 Multi-Dimensional Filter</b><br/>allRecords.filter()<br/>(index.html:1834)"]
    M4_2["<b>4.2 Table DOM Painter</b><br/>renderTable()<br/>(index.html:1859)"]
    M4_3["<b>4.3 Summary KPI Synchronizer</b><br/>updateSummaryCounters() / loadSummary()<br/>(index.html:1935, 1955)"]
    M4_4["<b>4.4 RFC 4180 CSV Exporter</b><br/>exportVisibleRecords()<br/>(index.html:2094)"]

    C4 -->|"<b>[c: dateFilter, statusFilter]</b><br/>[d: allRecords]"| M4_1
    M4_1 -->|"<b>[d: visibleRecords]</b>"| M4_2
    C4 -->|"<b>[d: allRecords]</b><br/>[c: unpaidCount]"| M4_3
    C4 -->|"<b>[d: visibleRecords]</b><br/>[c: hasRecordsFlag]"| M4_4

    %% Subordinate of Table DOM Painter
    M4_2_1["<b>4.2.1 HTML Sanitizer Utility</b><br/>escapeHtml()<br/>(index.html:2126)"]
    M4_2 -->|"<b>[d: rawString]</b><br/>[d: safeHtml]"| M4_2_1

    %% Modal Subsystem
    C5["<b>5.0 Modal & Status Manager</b><br/>openRecordModal() (index.html:1961)"]
    M5_1["<b>5.1 Modal Data Hydrator</b><br/>Populate Modal DOM (index.html:1967)"]
    M5_2["<b>5.2 Status Patch Dispatcher</b><br/>saveStatusFromModal() (index.html:2008)"]
    M5_3["<b>5.3 Modal Print Trigger</b><br/>printReceiptFromModal() (index.html:2089)"]

    C5 -->|"<b>[d: recordId]</b>"| M5_1
    C5 -->|"<b>[d: recordId]</b><br/><b>[c: newStatus]</b>"| M5_2
    C5 -->|"<b>[d: recordId]</b>"| M5_3

    classDef cModule fill:#F8FAFC,stroke:#334155,stroke-width:1.5px;
    class C4,M4_1,M4_2,M4_3,M4_4,C5,M5_1,M5_2,M5_3,M4_2_1 cModule;
```

---

## 4. Backend Server Structure Chart (`Source Code/server.js`)

The Node.js/Express backend handles validation, watchlist screening, SQLite transactions, KPI aggregation, and error handling.

```mermaid
graph TD
    %% Server Executive
    SERVER["<b>0.1 Server Root Executive</b><br/>app.listen(PORT) (server.js:517)"]

    %% Level 1 Controllers
    S_INGEST["<b>1.0 Violation Ingestion Route</b><br/>POST /api/violations (server.js:380)"]
    S_QUERY["<b>2.0 Registry Query Route</b><br/>GET /api/violations (server.js:308)"]
    S_SEARCH["<b>3.0 Multi-Field Search Route</b><br/>GET /api/violations/search (server.js:320)"]
    S_REPORT["<b>4.0 KPI Summary Report Route</b><br/>GET /api/reports/summary (server.js:351)"]
    S_STATUS["<b>5.0 Settlement Status Route</b><br/>PATCH /api/violations/:id/status (server.js:470)"]

    SERVER --> S_INGEST
    SERVER --> S_QUERY
    SERVER --> S_SEARCH
    SERVER --> S_REPORT
    SERVER --> S_STATUS

    %% Subordinates of S_INGEST
    V_PAYLOAD["<b>1.1 Payload Validator</b><br/>validateViolationPayload()<br/>(server.js:237)"]
    V_NORM["<b>1.2 Violation Normalizer</b><br/>normalizeViolations()<br/>(server.js:37)"]
    V_FINE["<b>1.3 Fee Total Calculator</b><br/>calculateViolationTotal()<br/>(server.js:54)"]
    V_TICKET["<b>1.4 Ticket Number Generator</b><br/>generateTicketNumber()<br/>(server.js:62)"]
    V_DATE["<b>1.5 Local Timestamp Formatter</b><br/>getLocalDateTimeString()<br/>(server.js:71)"]
    V_SCREEN["<b>1.6 Watchlist Assessor</b><br/>assessScreening()<br/>(server.js:82)"]
    V_DB_INS["<b>1.7 SQLite Ingestion Driver</b><br/>db.run('INSERT INTO violations...')<br/>(server.js:445)"]

    S_INGEST -->|"<b>[d: req.body]</b><br/><b>[c: isValid, d: errors]</b>"| V_PAYLOAD
    V_PAYLOAD -->|"<b>[d: rawViolationList]</b><br/>[d: normalizedArray]"| V_NORM
    V_PAYLOAD -->|"<b>[d: normalizedArray]</b><br/><b>[c: isFineOverride]</b>"| V_FINE
    S_INGEST -->|"<b>[d: systemClock]</b><br/>[d: ticketNumber]"| V_TICKET
    S_INGEST -->|"<b>[d: new Date()]</b><br/>[d: dateString]"| V_DATE
    S_INGEST -->|"<b>[d: plate, license, driver]</b><br/><b>[c: screeningStatus, d: flags]</b>"| V_SCREEN
    S_INGEST -->|"<b>[d: sanitizedParams (19)]</b><br/><b>[c: insertSuccess, d: lastID]</b>"| V_DB_INS

    %% Subordinates of S_STATUS
    V_STATUS_CHK["<b>5.1 Allowed Status Validator</b><br/>allowedStatuses.includes()<br/>(server.js:477)"]
    V_STATUS_DB["<b>5.2 SQLite Update Driver</b><br/>db.run('UPDATE violations...')<br/>(server.js:486)"]
    S_STATUS -->|"<b>[c: payment_status]</b><br/><b>[c: isValidStatus]</b>"| V_STATUS_CHK
    S_STATUS -->|"<b>[d: violationId, c: payment_status]</b><br/><b>[c: changesCount]</b>"| V_STATUS_DB

    classDef sRoute fill:#FEF3C7,stroke:#B45309,stroke-width:1.5px;
    classDef sFunc fill:#F1F5F9,stroke:#334155,stroke-width:1.5px;
    class S_INGEST,S_QUERY,S_SEARCH,S_REPORT,S_STATUS sRoute;
    class V_PAYLOAD,V_NORM,V_FINE,V_TICKET,V_DATE,V_SCREEN,V_DB_INS,V_STATUS_CHK,V_STATUS_DB sFunc;
```

---

## 5. Detailed Module Interface Catalog & Coupling/Cohesion Matrix

The table below catalogs every function, handler, and routine implemented across both [`Source Code/server.js`](file:///c:/Users/emman/PNP-CVPRMS/Source%20Code/server.js) and [`Source Code/index.html`](file:///c:/Users/emman/PNP-CVPRMS/Source%20Code/index.html).

### 5.1 Backend Server Modules (`server.js`)

| Module Identifier | Function / Route Name | Source Location | Cohesion Classification | Coupling Classification | Input Parameters (Data Couples) | Control Flags Handled | Return Values / Output | Callers | Callees |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S-MOD-01** | `normalizeViolations` | `server.js:37-52` | **Functional** (transforms input to unique trimmed array) | **Data Coupling** | `input` (Array or CSV String) | None | `Array<string>` (Deduplicated violation names) | `calculateViolationTotal`, `validateViolationPayload`, `POST /api/violations` | `Array.prototype.map`, `filter` |
| **S-MOD-02** | `calculateViolationTotal` | `server.js:54-60` | **Functional** (computes arithmetic sum of offense fees) | **Data Coupling** | `violations` (Array or String) | None | `number` (Total fine amount in PHP) | `validateViolationPayload` | `normalizeViolations`, `OFFENSE_SCHEDULE` |
| **S-MOD-03** | `generateTicketNumber` | `server.js:62-69` | **Functional** (generates standardized ticket identifier) | **Data Coupling** | None | None | `string` (`PNP-<timestamp>-<6-char-random>`) | `POST /api/violations` | `Date.now()`, `Math.random()` |
| **S-MOD-04** | `getLocalDateTimeString` | `server.js:71-80` | **Functional** (formats date to standard SQL string) | **Data Coupling** | `d` (Date instance, optional) | None | `string` (`YYYY-MM-DD HH:mm:ss`) | `POST /api/violations` | `Date` get methods |
| **S-MOD-05** | `assessScreening` | `server.js:82-122` | **Functional** (triages identifiers against watchlist) | **Data & Control Coupling** | `{ licenseNumber, plateNumber, driverName }` | `isAlarm` (Control flag for arrest priority) | `{ status: 'clear'\|'warning'\|'alarm', status_label, flags: [] }` | `POST /api/violations` | `SCREENING_BLACKLIST` |
| **S-MOD-06** | `initializeSchema` | `server.js:158-232` | **Sequential** (creates table, inspects PRAGMA, migrates) | **Stamp Coupling** | None | `pending.length === 0` | None (SQLite table verified) | SQLite Database open callback | `db.run`, `db.all`, `db.serialize` |
| **S-MOD-07** | `validateViolationPayload` | `server.js:237-301` | **Functional** (executes 11 defensive validation rules) | **Control Coupling** | `data` (JSON body) | `isUnlicensed`, `isFineOverride`, `isValid` | `{ isValid: boolean, errors: string[] }` | `POST /api/violations` | `normalizeViolations`, `calculateViolationTotal` |
| **S-MOD-08** | `GET /api/config` | `server.js:135-143` | **Functional** (returns operational station metadata) | **Data Coupling** | `req`, `res` | `success: true` | JSON response with `station_name` | Express Router | None |
| **S-MOD-09** | `GET /api/violations` | `server.js:308-317` | **Functional** (retrieves all records descending) | **Data Coupling** | `req`, `res` | DB Error flag | JSON response with records array | Express Router | `db.all('SELECT * FROM violations...')` |
| **S-MOD-10** | `GET /api/violations/search` | `server.js:320-349` | **Functional** (parameterized 8-field wildcard search) | **Data Coupling** | `req.query.q` | Parameter validation flag | JSON response with matched records | Express Router | `db.all(sql, searchParams)` |
| **S-MOD-11** | `GET /api/reports/summary` | `server.js:351-377` | **Functional** (computes aggregate KPI metrics) | **Data Coupling** | `req`, `res` | DB Error flag | JSON response with `{ total_records, total_fines, flagged_records, unsettled_records }` | Express Router | `db.get(sql)` |
| **S-MOD-12** | `POST /api/violations` | `server.js:380-467` | **Sequential / Communicational** (validates, screens, inserts) | **Control Coupling** | `req.body` | `validation.isValid`, `isAlarm`, `err` | HTTP 201 JSON `{ success, recordId, ticket_number, screening_status }` or 422/500 | Express Router | `validateViolationPayload`, `assessScreening`, `db.run` |
| **S-MOD-13** | `PATCH /api/violations/:id/status` | `server.js:470-500` | **Functional** (whitelisted status mutation) | **Control Coupling** | `req.params.id`, `req.body.payment_status` | Status validity flag, `this.changes === 0` | HTTP 200 JSON `{ success, updatedStatus }` or 400/404/500 | Express Router | `db.run('UPDATE violations SET payment_status = ?')` |

---

### 5.2 Client Frontend Modules (`index.html`)

| Module Identifier | Function / Handler Name | Source Location | Cohesion Classification | Coupling Classification | Input Parameters (Data Couples) | Control Flags Handled | Return Values / Output | Callers | Callees |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **C-MOD-01** | `formatPHP` | `index.html:1355-1361` | **Functional** (formats numbers to `₱XX,XXX.00`) | **Data Coupling** | `amount` (Number or String) | None | `string` formatted currency | Table painter, modal hydrator, receipt formatter | `Number.toLocaleString` |
| **C-MOD-02** | `getLocalDateTimeString` | `index.html:1364-1373` | **Functional** (formats client clock to ISO format) | **Data Coupling** | `d` (Date instance, optional) | None | `string` (`YYYY-MM-DD HH:mm:ss`) | Form submission fallback, receipt formatter | `Date` get methods |
| **C-MOD-03** | `updateClock` | `index.html:1376-1384` | **Functional** (updates session bar live timestamp) | **Data Coupling** | None | None | None (Mutates `#sessionTime` text) | `setInterval` (1000ms timer) | `Date.toLocaleDateString` |
| **C-MOD-04** | `syncOfficerSession` | `index.html:1387-1411` | **Communicational** (syncs select badge with hidden input) | **Control Coupling** | Event trigger | `val === 'CUSTOM'` | None (Mutates DOM inputs) | Officer select change event, form reset | `prompt()`, `Option()` |
| **C-MOD-05** | `handleLicenseConditionalState` | `index.html:1446-1476` | **Functional** (toggles unlicensed ID form groups) | **Control Coupling** | DOM checklist state | `isUnlicensed` flag | None (Toggles required / disabled attributes) | Checklist change event, form reset, init | `document.querySelector` |
| **C-MOD-06** | `updateFineTotal` | `index.html:1487-1493` | **Functional** (aggregates statutory fines from schedule) | **Control Coupling** | Selected checkbox values | `fineOverrideToggle.checked` | None (Mutates `#fine_amount` value) | Checklist change event, fine toggle change | `OFFENSE_SCHEDULE` |
| **C-MOD-07** | `evaluateLocalScreening` | `index.html:1510-1527` | **Functional** (immediate client-side watchlist triage) | **Control Coupling** | Input values (`plate_number`, `driver_name`, `license_number`) | `state` (`'clear'`, `'warning'`, `'alarm'`) | None (Calls `setScreeningBadge`) | Input blur events (`plate`, `driver`, `license`) | `setScreeningBadge` |
| **C-MOD-08** | `setScreeningBadge` | `index.html:1529-1533` | **Functional** (renders color-coded triage badge) | **Control Coupling** | `state`, `label`, `message` | Class selection based on `state` | None (Mutates badge DOM elements) | `evaluateLocalScreening`, form reset | DOM class manipulation |
| **C-MOD-09** | `processEvidenceImage` | `index.html:1540-1576` | **Sequential** (reads, downscales on canvas, compresses) | **Data Coupling** | `file` (File object), `callback` (Function) | Canvas error flags, file validity | DataURL string via callback | File input change listener | `FileReader`, `HTMLCanvasElement`, `canvas.toDataURL` |
| **C-MOD-10** | `showAlert` | `index.html:1622-1629` | **Functional** (renders toast banner with auto-hide timer) | **Data Coupling** | `message` (String), `type` (`'danger'`\|`'success'`) | None | None (Mutates `#formAlert` DOM) | Form validator, network dispatchers | `setTimeout` |
| **C-MOD-11** | `form.onsubmit` | `index.html:1632-1751` | **Sequential / Communicational** (orchestrates full submission) | **Control Coupling** | Submit Event | `isUnlicensed`, `vehicleDisposition === 'Impounded'`, `fine_override` | None (Dispatches POST request, resets form) | Form submit event listener | `validateViolationPayload` rules, `fetch`, `loadAllViolations` |
| **C-MOD-12** | `loadAllViolations` | `index.html:1754-1768` | **Functional** (fetches all citations from server) | **Data Coupling** | None | Network error flag | None (Updates `allRecords` global store) | Application bootstrap, form submit, search reset | `fetch('/api/violations')`, `applyFiltersAndRender` |
| **C-MOD-13** | `executeSearch` | `index.html:1771-1797` | **Functional** (dispatches server query or fallback) | **Control Coupling** | Query string | `!query` (Triggers `loadAllViolations`) | None (Updates `allRecords`, renders view) | Search button click, Enter keydown | `fetch('/api/violations/search?q=...')` |
| **C-MOD-14** | `resetSearchAndFilters` | `index.html:1799-1808` | **Functional** (restores default filter state and reloads) | **Control Coupling** | None | `filter === 'all'` reset | None (Clears inputs, reloads table) | Reset button click | `loadAllViolations` |
| **C-MOD-15** | `applyFiltersAndRender` | `index.html:1826-1856` | **Functional** (in-memory multi-attribute filtering) | **Control Coupling** | `activeDateFilter`, `activeStatusFilter` | `isFlagged`, `isUnpaid` filter conditions | None (Sets `visibleRecords`, calls render) | Filter chip clicks, shift changes, search completion | `renderTable`, `updateSummaryCounters` |
| **C-MOD-16** | `renderTable` | `index.html:1859-1932` | **Communicational** (generates HTML table rows and badges) | **Data & Stamp Coupling** | `records` (Array of objects) | Status & screening class determinations | None (Mutates `#violationsTableBody`) | `applyFiltersAndRender` | `escapeHtml`, `formatPHP` |
| **C-MOD-17** | `loadSummary` | `index.html:1935-1953` | **Functional** (fetches server summary metrics) | **Data Coupling** | None | Network fallback flag | None (Mutates KPI metric cards) | Bootstrap, form submit, status patch | `fetch('/api/reports/summary')` |
| **C-MOD-18** | `updateSummaryCounters` | `index.html:1955-1958` | **Functional** (computes in-memory unsettled count) | **Data Coupling** | `allRecords` store | Payment status check | None (Mutates `#unsettledRecords`) | `applyFiltersAndRender`, `loadSummary` fallback | `Array.prototype.filter` |
| **C-MOD-19** | `openRecordModal` | `index.html:1961-1995` | **Communicational** (hydrates full 20-field modal view) | **Stamp Coupling** | `id` (Record primary key) | Presence of `evidence_image`, `isUnlicensed` | None (Displays modal overlay) | Table "View" button click | `allRecords.find`, DOM updates |
| **C-MOD-20** | `closeRecordModal` | `index.html:1997-2002` | **Functional** (cleanses modal state and hides DOM) | **Data Coupling** | None | None | None (Hides modal overlay) | Close button, backdrop click, Escape key | DOM class manipulation |
| **C-MOD-21** | `saveStatusFromModal` | `index.html:2008-2032` | **Functional** (dispatches status mutation to backend) | **Control Coupling** | `currentModalRecordId`, `newStatus` | `response.ok`, `result.success` | None (Updates local record, refreshes UI) | Modal "Save Status" button click | `fetch('PATCH /api/violations/:id/status')` |
| **C-MOD-22** | `populateThermalReceipt` | `index.html:2041-2079` | **Communicational** (hydrates 58mm/80mm thermal DOM) | **Stamp Coupling** | `rec` (Citation record object) | `isImpounded`, `isUnlicensed` | None (Mutates `#thermalReceiptArea`) | Form submission, print button handlers | `formatPHP`, `escapeHtml` |
| **C-MOD-23** | `printReceiptForRecord` | `index.html:2081-2086` | **Sequential** (hydrates and invokes browser print dialog) | **Data Coupling** | `id` (Record primary key) | None | None (Opens print dialog) | Table "Print" button click | `populateThermalReceipt`, `window.print()` |
| **C-MOD-24** | `exportVisibleRecords` | `index.html:2094-2124` | **Functional** (serializes view to RFC 4180 CSV with UTF-8 BOM) | **Stamp Coupling** | `visibleRecords` global array | `visibleRecords.length === 0` | None (Triggers browser file download) | Header "Export CSV" button click | `Blob`, `URL.createObjectURL`, `link.click` |
| **C-MOD-25** | `escapeHtml` | `index.html:2126-2133` | **Functional** (sanitizes text for safe innerHTML injection) | **Data Coupling** | `str` (String to escape) | None | `string` (Sanitized HTML string) | `renderTable`, `populateThermalReceipt` | `String.replace` regex |
| **C-MOD-26** | `loadConfig` | `index.html:2136-2145` | **Functional** (fetches station title from backend) | **Data Coupling** | None | None | None (Sets station header text) | Application bootstrap (`init`) | `fetch('/api/config')` |

---

## 6. Coupling and Cohesion Quality Evaluation

### 6.1 Cohesion Analysis
1. **Functional Cohesion (Optimal)**:
   - Routines such as `normalizeViolations`, `calculateViolationTotal`, `getLocalDateTimeString`, `formatPHP`, and `escapeHtml` exhibit single-task functional cohesion. Each computes a dedicated deterministic output without side effects.
   - `assessScreening` cleanly encapsulates the multi-tier criminal and stolen vehicle watchlist rules into an isolated unit.
2. **Sequential Cohesion**:
   - `processEvidenceImage` exhibits sequential cohesion: the raw `File` is ingested by `FileReader`, transformed into an `Image` object, scaled within an HTML5 `Canvas`, and converted into a lossy Base64 Data URL.
   - `POST /api/violations` runs sequentially: payload validation $\rightarrow$ ticket generation $\rightarrow$ watchlist triage $\rightarrow$ SQLite parameterized insert $\rightarrow$ response serialization.
3. **Communicational Cohesion**:
   - `openRecordModal` and `populateThermalReceipt` consume the citation data entity and update multiple display nodes simultaneously.

### 6.2 Coupling Minimization
1. **Control Coupling Containment**:
   - The flag `isUnlicensed` is evaluated locally via `violationList.includes("No Driver's License")` rather than through global variables.
   - The discretionary fine flag `fine_override` is validated on the backend to prevent unauthorized fine alterations: if `fine_override == 0`, statutory equality is strictly checked (`Math.abs(fine - totalExpected) <= 0.05`).
2. **Data Coupling Optimization**:
   - Search queries are decoupled from database implementation details: client search passes an agnostic query string `?q=`, and the backend maps it to 8 parameterized SQLite search targets using `LIKE ?`.
3. **Avoidance of Common / Global Coupling**:
   - Although the frontend uses an in-memory cache `allRecords`, state mutations are mediated through atomic controllers (`saveStatusFromModal`, `loadAllViolations`) and synchronized via server responses.

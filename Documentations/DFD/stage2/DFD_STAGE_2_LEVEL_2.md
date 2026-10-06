# Data Flow Diagram (DFD) — Stage 2: Level 2 Decompositions

**System**: PNP Checkpoint Violation Processing & Records Management System (PNP-CVPRMS)  
**Level**: Stage 2 (Detailed Functional Decompositions)  
**Source of Truth**: [`Source Code/server.js`](file:///c:/Users/emman/PNP-CVPRMS/Source%20Code/server.js) & [`Source Code/index.html`](file:///c:/Users/emman/PNP-CVPRMS/Source%20Code/index.html)

---

## 1. Overview

Stage 2 diagrams decompose the core Level 1 processes into their granular, atomic functional routines:
1. **Decomposition 2.0**: Watchlist Screening & HPG Stolen Vehicle Triage
2. **Decomposition 3.0**: Citation Apprehension Validation & Recording
3. **Decomposition 5.0**: Citation Settlement & Treasury Status Updates

![Data Flow Diagram Stage 2 Level 2 Functional Decompositions](DFD_STAGE_2_LEVEL_2.png)

---

## 2. Decomposition 2.0: Watchlist Screening Triage

```mermaid
flowchart TD
    %% Inputs
    IN_P["Vehicle Plate"]
    IN_D["Driver Full Name"]
    IN_L["Driver's License No."]

    %% Sub-processes
    P21(("2.1<br/>Cleanse & Normalize<br/>Identifiers"))
    P22(("2.2<br/>Query HPG Stolen Plates<br/>& Court Warrants"))
    P23(("2.3<br/>Query License Suspensions<br/>& Expired Status"))
    P24(("2.4<br/>Synthesize Tri-State<br/>Triage & Flags"))

    %% Data Store
    D3[("D3: Screening Blacklist<br/>(Plates, Drivers, Licenses)")]

    %% Flows
    IN_P --> P21
    IN_D --> P21
    IN_L --> P21

    P21 -->|"Cleaned Plate (No Space/Dash),<br/>Uppercase Driver & License"| P22
    P21 -->|"Normalized License & Plate"| P23

    D3 -->|"Alarm Plates & Drivers"| P22
    D3 -->|"Warning Licenses & Expired Rules"| P23

    P22 -->|"Alarm Match Flags"| P24
    P23 -->|"Warning Match Flags"| P24

    P24 -->|"Output: { status: 'clear'|'warning'|'alarm',<br/>status_label, flags[] }"| OUT["Client Screening UI / Record Metadata"]

    %% Styling
    classDef process fill:#ffffff,stroke:#0B1E3D,stroke-width:2px,color:#0B1E3D;
    classDef store fill:#F8FAFC,stroke:#475569,stroke-width:2px,stroke-dasharray: 5 5,color:#0F172A;
    class P21,P22,P23,P24 process;
    class D3 store;
```

### Process Logic (2.0):
* **2.1 Cleanse & Normalize**: Strips hyphens and whitespace from plate (`ABC 1234` -> `ABC1234`); converts driver names and license numbers to uppercase.
* **2.2 Query HPG Alarms**: Matches cleaned plate against `SCREENING_BLACKLIST.plate_numbers` and driver against `SCREENING_BLACKLIST.drivers`. If matched, assigns `isAlarm = true`.
* **2.3 Query Suspensions**: If license does not contain `'UNLICENSED'`, matches against `SCREENING_BLACKLIST.license_numbers` or scans for the keyword `'EXPIRED'`.
* **2.4 Synthesize Triage**: Returns `'alarm'` if `isAlarm == true`, `'warning'` if non-alarm flags exist, or `'clear'` with nominal diagnostic messages.

---

## 3. Decomposition 3.0: Citation Apprehension Validation & Recording

```mermaid
flowchart TD
    %% Input Payload
    PAYLOAD["Incoming Citation Payload<br/>(POST /api/violations)"]

    %% Sub-processes
    P31(("3.1<br/>Validate Driver &<br/>Unlicensed Alt-ID"))
    P32(("3.2<br/>Validate Vehicle &<br/>Impound Receipt"))
    P33(("3.3<br/>Verify Fine Calculation<br/>vs Schedule / Override"))
    P34(("3.4<br/>Compress Photographic<br/>Evidence"))
    P35(("3.5<br/>Generate Unique<br/>Ticket Number"))
    P36(("3.6<br/>Commit Record to<br/>SQLite Database"))

    %% Data Stores
    D1[("D1: Violations Database<br/>(violations table)")]
    D2[("D2: Offense Schedule<br/>(OFFENSE_SCHEDULE)")]

    %% Flows
    PAYLOAD --> P31
    PAYLOAD --> P32
    PAYLOAD --> P33
    PAYLOAD --> P34

    P31 -->|"Validation Passed"| P35
    P32 -->|"Validation Passed"| P35
    D2 -->|"Statutory Fines"| P33
    P33 -->|"Fine Verification Passed"| P35

    P34 -->|"Base64 JPEG Data URL"| P36
    P35 -->|"Ticket: PNP-{Timestamp}-{Suffix}"| P36

    P36 -->|"Execute Parameterized INSERT"| D1
    P36 -->|"Return Status 201 + Record ID + Ticket #"| RESP["Client JSON Response"]

    %% Styling
    classDef process fill:#ffffff,stroke:#0B1E3D,stroke-width:2px,color:#0B1E3D;
    classDef store fill:#F8FAFC,stroke:#475569,stroke-width:2px,stroke-dasharray: 5 5,color:#0F172A;
    class P31,P32,P33,P34,P35,P36 process;
    class D1,D2 store;
```

### Process Logic (3.0):
* **3.1 Driver Validation**: If "No Driver's License" is cited, ensures `license_number == 'N/A - Unlicensed'` and mandates both `id_type` and `id_number`. If licensed, ensures `license_number` is provided and is not `'N/A - Unlicensed'`.
* **3.2 Vehicle & Impound Validation**: Validates `plate_number`; if `vehicle_disposition == 'Impounded'`, verifies that `impound_receipt_no` is present.
* **3.3 Fine Calculation**: Verifies that `fine_amount > 0`. If `fine_override == 0`, asserts `Math.abs(fine_amount - totalExpected) <= 0.05`.
* **3.4 Evidence Downscaler**: Downscales attached photos via HTML5 Canvas (max 1200px width/height, 0.82 JPEG quality).
* **3.5 Ticket Generator**: Computes `PNP-${Date.now().toString().slice(-8)}-${6_RANDOM_CHARS}`.
* **3.6 DB Commitment**: Executes parameterized SQL `INSERT INTO violations (...) VALUES (?, ?, ...)`.

---

## 4. Decomposition 5.0: Citation Settlement & Treasury Status Updates

```mermaid
flowchart TD
    REQ["PATCH /api/violations/:id/status<br/>{ payment_status }"]

    P51(("5.1<br/>Validate Record ID<br/>Parameter"))
    P52(("5.2<br/>Verify Domain Whitelist<br/>Payment Status"))
    P53(("5.3<br/>Execute Parameterized<br/>UPDATE Query"))
    P54(("5.4<br/>Audit Affected Changes<br/>& Respond"))

    D1[("D1: Violations Database<br/>(violations table)")]

    REQ --> P51
    P51 -->|"Numeric ID > 0"| P52
    P51 -->|"Invalid ID (NaN / <=0)"| ERR1["Return 400 Bad Request"]

    P52 -->|"Status in Allowed Whitelist"| P53
    P52 -->|"Invalid Status String"| ERR2["Return 400 Bad Request"]

    P53 -->|"UPDATE violations SET payment_status = ?<br/>WHERE id = ?"| D1
    D1 -->|"Execution Callback (this.changes)"| P54

    P54 -->|"changes === 0"| ERR3["Return 404 Not Found"]
    P54 -->|"changes > 0"| SUCC["Return 200 OK + Updated Status"]

    %% Styling
    classDef process fill:#ffffff,stroke:#0B1E3D,stroke-width:2px,color:#0B1E3D;
    classDef store fill:#F8FAFC,stroke:#475569,stroke-width:2px,stroke-dasharray: 5 5,color:#0F172A;
    class P51,P52,P53,P54 process;
    class D1 store;
```

### Process Logic (5.0):
* **5.1 Validate ID**: Parses `req.params.id` as integer base 10; rejects `NaN` or values `<= 0` with HTTP 400.
* **5.2 Verify Status**: Checks if `payment_status` is in `['Unsettled / Unpaid', 'Settled / Paid at Treasury', 'Voided / Contested']`; rejects invalid transitions with HTTP 400.
* **5.3 Execute Update**: Runs parameterized SQL `UPDATE violations SET payment_status = ? WHERE id = ?`.
* **5.4 Audit Changes**: Inspects `this.changes`. If 0, returns HTTP 404 (record does not exist). If `> 0`, returns HTTP 200 with confirmation payload.

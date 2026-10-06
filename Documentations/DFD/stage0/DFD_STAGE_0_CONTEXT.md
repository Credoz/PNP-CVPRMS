# Data Flow Diagram (DFD) — Stage 0: Context Diagram

**System**: PNP Checkpoint Violation Processing & Records Management System (PNP-CVPRMS)  
**Level**: Stage 0 (Context Level Diagram)  
**Source of Truth**: [`Source Code/server.js`](file:///c:/Users/emman/PNP-CVPRMS/Source%20Code/server.js) & [`Source Code/index.html`](file:///c:/Users/emman/PNP-CVPRMS/Source%20Code/index.html)

---

## 1. Overview

The Context Level Data Flow Diagram (Stage 0) represents the entire PNP-CVPRMS application as a single conceptual process (`0.0`), identifying its operational boundary, primary external entities, input data flows, and output data flows.

---

## 2. Context Diagram Visual & Mermaid Representation

![Data Flow Diagram Stage 0 Context Diagram](DFD_STAGE_0_CONTEXT.png)

```mermaid
flowchart TD
    %% External Entities
    CO["Apprehending Checkpoint Officer"]
    MO["Motorist / Violator"]
    TO["Municipal Treasury Officer"]
    HPG["PNP Watchlist & HPG Alarm Database"]

    %% Central Process
    CVPRMS(("0.0<br/><b>PNP Checkpoint Violation<br/>Processing & Records Management<br/>System (PNP-CVPRMS)</b>"))

    %% Data Flows: Checkpoint Officer
    CO -->|"Session Parameters<br/>(Post, Shift, Badge ID)"| CVPRMS
    CO -->|"Apprehension Details<br/>(Driver, License/Alt-ID, Plate, Disposition)"| CVPRMS
    CO -->|"Infraction Selections & Discretionary Fine"| CVPRMS
    CO -->|"Confiscated Evidence / Document Photo"| CVPRMS
    CO -->|"Registry Search Queries & Date/Status Filters"| CVPRMS

    CVPRMS -->|"Real-Time Watchlist Triage Status<br/>(CLEAR / WARNING / ALARM)"| CO
    CVPRMS -->|"Generated Citation Ticket Number<br/>& Validation Notifications"| CO
    CVPRMS -->|"Formatted 58mm/80mm Thermal Print Citation"| CO
    CVPRMS -->|"Filtered Citations Registry & Shift KPI Counts"| CO
    CVPRMS -->|"Exported Citations Registry (Excel UTF-8 CSV)"| CO

    %% Data Flows: Motorist / Violator
    MO -->|"Physical Driver's License or Government ID Card"| CO
    MO -->|"Vehicle Plate & Registration Papers (OR/CR)"| CO
    CVPRMS -->|"Physical Printed Citation Ticket (Notice to Settle)"| MO
    CVPRMS -->|"Impound Receipt / Towing Slip (if impounded)"| MO

    %% Data Flows: Municipal Treasury Officer
    TO -->|"Settlement Update Request<br/>(Ticket ID, New Status: Paid / Voided)"| CVPRMS
    CVPRMS -->|"Detailed Citation Verification Record"| TO
    CVPRMS -->|"Payment Confirmation & Real-Time Status Update"| TO

    %% Data Flows: PNP / HPG Command
    HPG -->|"Screening Blacklist Rules<br/>(Stolen Plates, Wanted Drivers, Suspended Licenses)"| CVPRMS
    CVPRMS -->|"Flagged Apprehension Alerts & Daily Shift Summaries"| HPG

    %% Styling
    classDef entity fill:#0B1E3D,stroke:#C5A059,stroke-width:2px,color:#ffffff;
    classDef process fill:#ffffff,stroke:#0B1E3D,stroke-width:3px,color:#0B1E3D;
    class CO,MO,TO,HPG entity;
    class CVPRMS process;
```

---

## 3. Entity & Flow Catalog

### 3.1 External Entities

| Entity Identifier | Entity Name | Description |
| :--- | :--- | :--- |
| **`CO`** | **Apprehending Checkpoint Officer** | PNP personnel deployed at field checkpoint post. Configures active shifts, inputs motorist data, selects infractions, attaches photo evidence, inspects records, and triggers thermal receipt printing. |
| **`MO`** | **Motorist / Violator** | Driver apprehended during checkpoint screening. Presents credentials, receives citation, and is notified of the 7-day settlement period. |
| **`TO`** | **Municipal Treasury Officer** | Administrative personnel at municipal hall. Audits citations, processes fine collections, and updates settlement status (`Settled / Paid at Treasury` or `Voided / Contested`). |
| **`HPG`** | **PNP Watchlist & HPG Database** | National police repository containing Highway Patrol Group (HPG) stolen vehicle alarms, court warrants, and delinquent license lists. |

### 3.2 Key Data Flows

| Direction | Flow Name | Composition / Attributes |
| :--- | :--- | :--- |
| `CO -> CVPRMS` | **Apprehension Details** | `driver_name`, `license_number`, `id_type`, `id_number`, `plate_number`, `vehicle_type`, `vehicle_disposition`, `impound_receipt_no` |
| `CO -> CVPRMS` | **Infraction & Fine Data** | `violation_types[]`, `fine_amount`, `fine_override` (0 or 1) |
| `CO -> CVPRMS` | **Evidence Photo** | Base64-encoded JPEG image string (client downscaled to max 1200px) |
| `CVPRMS -> CO` | **Screening Triage Result** | `status` (clear/warning/alarm), `status_label`, `flags[]` |
| `CVPRMS -> CO` | **Thermal Print Receipt** | Formatted 72mm ESC/POS compatible thermal view with headers, itemized fines, notice, signature lines |
| `TO -> CVPRMS` | **Settlement Request** | Record ID, `payment_status` (`'Settled / Paid at Treasury'` or `'Voided / Contested'`) |
| `CVPRMS -> TO` | **Status Confirmation** | Updated record state, KPI metrics recount |

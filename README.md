# Computerized Violation Processing and Records Management System (PNP-CVPRMS)

**Philippine National Police — Checkpoint Vehicular Passing & Violations Record Management System**

[![Node.js Version](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-SQLite%203-blue.svg)](https://www.sqlite.org/)
[![Status](https://img.shields.io/badge/Status-Prototype%20v2.0--PRO-orange.svg)]()
[![License](https://img.shields.io/badge/License-Academic%20%2F%20Capstone-lightgrey.svg)]()

---

## 1. Executive Summary

**PNP-CVPRMS** is an operational web-based records and violation management system engineered for the **Philippine National Police (PNP)**. It modernizes checkpoint operations by replacing manual paper logbooks with an automated, low-latency digital terminal for:

- **Real-Time Checkpoint Logging**: Automating timestamping, shift assignments (*Day / Afternoon / Night*), checkpoint post tagging, and apprehending officer badge attribution.
- **Instant Watchlist & Alarm Screening**: Screening driver credentials, license numbers, and vehicle license plates against simulated PNP/HPG alarms and wanted registries (`CLEAR`, `WARNING / REPEAT OFFENDER`, `ALARM / HPG WANTED`).
- **Standardized Citation Processing**: Automatic statutory penalty calculation based on official LTO Joint Administrative Order (JAO 2014-01) schedules with optional officer discretion override.
- **Unlicensed Motorist Workflow**: Automatic toggling requiring secondary government identification (*PhilSys, UMID, Passport, Voter's ID*) when a driver has no license.
- **Thermal Citation Printing**: Built-in formatted citation receipt ready for 58mm/80mm Bluetooth thermal roll printers or centered standard A4/Letter desktop printing.
- **Audit & Analytics**: Searchable multi-field registry, CSV export with Excel UTF-8 BOM, and live Key Performance Indicator (KPI) dashboard counters.

> [!NOTE]
> **Prototype Demonstration Mode**: This release is packaged as an autonomous edge prototype running on Node.js/Express with an embedded SQLite database (`pnp_checkpoint.db`). It operates entirely offline or on local networks without requiring external government VPN access.

---

## 2. High-Level System Architecture

```text
  ┌────────────────────────────────────────────────────────┐
  │                 CLIENT BROWSER (UI)                    │
  │  HTML5 + Responsive CSS + Vanilla ES6+ Client Engine   │
  │  [Live Clock] [Violation Entry] [Thermal Print POS]    │
  └───────────────────────────┬────────────────────────────┘
                              │ HTTP / REST API (JSON)
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │              EXPRESS.JS BACKEND (server.js)            │
  │  • Session & Shift Management   • Input Sanitization   │
  │  • Watchlist Screening Engine   • Statutory Fine Calc  │
  └───────────────────────────┬────────────────────────────┘
                              │ SQL (sqlite3)
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │             LOCAL STORAGE ENGINE (SQLite 3)            │
  │  Database: pnp_checkpoint.db  | Table: violations      │
  │  B-Tree Indexed Wildcard Search | Atomic Persistence   │
  └────────────────────────────────────────────────────────┘
```

---

## 3. Quick Start & Execution

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18.x or later)
- Modern web browser (Chrome, Edge, Firefox, Brave)

### Installation & Launch

```bash
# 1. Navigate to the source code folder
cd "Source Code"

# 2. Install dependencies (express, sqlite3)
npm install

# 3. Start the application
npm start
```

Access the system in your browser at:
**`http://localhost:3000`**

### Windows Desktop Launcher (One-Click)
For instant deployment on Windows workstations or laptops:
1. Open the `Source Code` folder.
2. Double-click `Create-CVPRMS-Shortcut.bat`.
3. A desktop shortcut named **PNP-CVPRMS** with the official PNP shield icon will be placed on your Desktop.
4. Double-click the desktop shortcut anytime to launch the server and open the browser automatically.

---

## 4. Configuration & Environment Variables

The backend supports configurable runtime settings via environment variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | HTTP port on which the Express web server listens. |
| `STATION_NAME` | `Agoo Municipal Police Station` | Municipal station displayed across citation headers and reports. |

```powershell
# Example custom startup in PowerShell
$env:PORT = 3001
$env:STATION_NAME = "San Fernando City Police Station"
npm start
```

---

## 5. Automated Testing & Verification

A comprehensive automated test suite validates all business rules, calculations, and API contracts:

```bash
cd "Source Code"
npm test
```

### Verified Test Cases:
- Statutory fine schedule totaling and multi-offense aggregation
- Citation ticket number PRNG formatting (`PNP-YYYYMMDD-XXXXXX`)
- Multi-tier screening status evaluations (`clear`, `warning`, `flagged`)
- Unlicensed driver toggling and alternative ID validation
- Officer discretionary fine overrides
- Mandatory impound receipt validation for impounded vehicles
- Payment status transitions (`PUT /api/violations/:id/payment`)
- Multi-field wildcard database queries
- Dashboard KPI calculation routines
- High-capacity base64 photographic evidence upload

---

## 6. Repository Structure & Technical Documentation

Exhaustive technical documentation, architectural models, and schema definitions are cataloged in their respective directories:

```text
PNP-CVPRMS/
├── README.md                                # Root repository guide (this file)
├── Schema/                                  # Database architecture & DDL scripts
│   ├── SCHEMA.md                            # Complete schema specification & ER mapping
│   ├── schema.sql                           # Executable SQL DDL scripts
│   └── schema_diagram.png                   # 3NF Relational visual diagram
├── Documentations/                          # Technical system specifications
│   ├── Data_Dictionary/DATA_DICTIONARY.md   # Data dictionary of all active fields
│   ├── DFD/                                 # Data Flow Diagrams (Stages 0, 1, 2)
│   ├── ERD/ENTITY_RELATIONSHIP_DIAGRAM.md   # Entity-Relationship specifications
│   ├── Graphs & Charts/                     # Architectural and KPI workflow charts
│   ├── HIPO Diagram/HIPO_DIAGRAM.md         # Hierarchical Input-Process-Output tables
│   ├── Pseudo_Code/CORE_ROUTINES_PSEUDOCODE.md # Pseudocode for core algorithms
│   ├── Structured_Chart/STRUCTURE_CHART.md  # Hierarchy of modules & routines
│   └── Structured_English/STRUCTURED_ENGLISH.md # Precise logic specifications
└── Source Code/                             # Runnable application & database
    ├── server.js                            # Express.js REST API & SQLite controller
    ├── index.html                           # Single-page frontend application
    ├── pnp_checkpoint.db                    # Active SQLite 3 database file
    ├── package.json                         # Project dependencies & scripts
    ├── Create-CVPRMS-Shortcut.bat           # Desktop shortcut creator script
    ├── Start-CVPRMS.bat                     # Headless launcher script
    └── test/self_check.js                   # Automated self-check test suite
```

### Technical Documentation Quick Links:
- 📖 [Data Dictionary](file:///c:/Users/emman/PNP-CVPRMS/Documentations/Data_Dictionary/DATA_DICTIONARY.md)
- 🔀 [Data Flow Diagrams (DFD Context Stage 0)](file:///c:/Users/emman/PNP-CVPRMS/Documentations/DFD/stage0/DFD_STAGE_0_CONTEXT.md)
- 🔀 [Data Flow Diagrams (DFD Level 1 Stage 1)](file:///c:/Users/emman/PNP-CVPRMS/Documentations/DFD/stage1/DFD_STAGE_1_LEVEL_1.md)
- 🔀 [Data Flow Diagrams (DFD Level 2 Stage 2)](file:///c:/Users/emman/PNP-CVPRMS/Documentations/DFD/stage2/DFD_STAGE_2_LEVEL_2.md)
- 🗄️ [Database Schema Specification](file:///c:/Users/emman/PNP-CVPRMS/Schema/SCHEMA.md) & [SQL DDL](file:///c:/Users/emman/PNP-CVPRMS/Schema/schema.sql)
- 🔗 [Entity-Relationship Diagram (ERD)](file:///c:/Users/emman/PNP-CVPRMS/Documentations/ERD/ENTITY_RELATIONSHIP_DIAGRAM.md)
- 📊 [Graphs & Architectural Charts](file:///c:/Users/emman/PNP-CVPRMS/Documentations/Graphs%20&%20Charts/SYSTEM_FLOWS_AND_KPI_CHARTS.md)
- 📋 [HIPO Diagrams](file:///c:/Users/emman/PNP-CVPRMS/Documentations/HIPO%20Diagram/HIPO_DIAGRAM.md)
- 💻 [Core Routines Pseudocode](file:///c:/Users/emman/PNP-CVPRMS/Documentations/Pseudo_Code/CORE_ROUTINES_PSEUDOCODE.md)
- 🏗️ [Structure Chart](file:///c:/Users/emman/PNP-CVPRMS/Documentations/Structured_Chart/STRUCTURE_CHART.md)
- 📝 [Structured English Logic](file:///c:/Users/emman/PNP-CVPRMS/Documentations/Structured_English/STRUCTURED_ENGLISH.md)

---

## 7. Project Team

- **Casey Freud** — Team Leader
- Angelo
- Antonio
- Augusto Manuel
- Benjie
- Emmanuel John
- Genuflect
- Ranier

---

## 8. Disclaimer & License

**Disclaimer:** This software is an academic capstone demonstration prototype designed for simulated law enforcement workflows. Watchlist and screening checks run against local simulated databases and do not connect to live confidential PNP or LTO servers.

**License:** Developed for academic and demonstration purposes.

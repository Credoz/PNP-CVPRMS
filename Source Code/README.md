# Computerized Violation Processing and Records Management System (PNP-CVPRMS)

**Target Platform:** Online Web Application with Real-Time Data Synchronization  
**Prototype Release:** `v2.0-PRO (Demonstration & Defense Prototype)`  
**Default Station:** `Agoo Municipal Police Station`

This folder contains the complete, runnable source code, embedded database, test suite, and Windows launcher scripts for the PNP-CVPRMS application.

---

## System Vision: Online Web Platform with Real-Time Data

**PNP-CVPRMS** is designed as a centralized, online web system that delivers **real-time data synchronization** across all active police checkpoints, municipal stations, and regional command centers. 

### Target Production Capabilities:
- **Centralized Cloud Database:** Live data synchronization across all checkpoint boundary posts and police stations.
- **Real-Time Alert Feeds:** Instant broadcasting of Highway Patrol Group (HPG) alarms and court warrants across terminals via WebSockets.
- **Inter-Agency Integrations:** Live REST API queries against LTO LTMS (Land Transportation Management System) for driver's license status and vehicle registration records.
- **Treasury Payment Integration:** Instant settlement updates when fines are paid at the municipal treasury or online payment portals.

### Current Demonstration Prototype:
For coursework defense, presentations, and field demonstrations, this package runs as a **self-contained local web prototype** with full real-time operational simulation (live clock, instant citation processing, embedded SQLite database, automated fine calculation, and simulated screening rules). This allows seamless demonstration on any laptop or workstation without requiring live police cloud infrastructure or external VPNs.

---

## Quick Launch (Recommended for Windows)

### 1. Create the Desktop Shortcut
Double-click:
```text
Create-CVPRMS-Shortcut.bat
```
This automatically generates a **PNP-CVPRMS** desktop shortcut on your Windows Desktop equipped with the official PNP shield icon.

### 2. Start the System
Double-click the **PNP-CVPRMS** desktop shortcut (or double-click `Start-CVPRMS.bat`).
- The system will start the local server in the background and immediately open `http://localhost:3000` in your web browser.

---

## Manual Terminal Setup & Execution

### System Requirements
- **Node.js** (version 18.x or later) — Download from [https://nodejs.org/](https://nodejs.org/)
- **npm** (included with Node.js)
- Modern web browser (Google Chrome, Microsoft Edge, Firefox, Brave)

### Steps:
1. Open a terminal or PowerShell prompt in this folder:
   ```bash
   npm install
   ```
2. Start the backend application:
   ```bash
   npm start
   ```
3. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

---

## Transferring & Running on Another PC via Flash Drive

To present or demonstrate PNP-CVPRMS on a different computer:

1. **Copy or Zip this folder:** Copy the `Source Code` folder (or compress it into a `.zip` file) and save it to your USB flash drive.
2. **Copy to Presentation PC:** On the presentation computer, copy and extract the folder onto a permanent local drive (e.g. `C:\PNP-CVPRMS` or `Documents\PNP-CVPRMS`).
   > [!IMPORTANT]
   > Do not run the shortcut creator directly from inside the unextracted zip or while still on the USB flash drive. Copy to a permanent drive first so the shortcut points to a valid local path.
3. **Verify Node.js:** Ensure the presentation computer has Node.js installed ([https://nodejs.org/](https://nodejs.org/)).
4. **Create Shortcut:** Double-click `Create-CVPRMS-Shortcut.bat`.
5. **Launch:** Double-click the newly created **PNP-CVPRMS** desktop shortcut.
   - `Start-CVPRMS.bat` includes an **automatic dependency preflight check**. If `node_modules` is missing or was compiled under a different Node version, it will automatically install and configure dependencies on first launch!

> [!TIP]
> **Data Portability:** If `pnp_checkpoint.db` is included, all previously recorded citations travel with you. To start a fresh demonstration with zero records, simply delete `pnp_checkpoint.db` before launching; the system will automatically recreate a clean database on startup.

---

## Core System Features

- **Active Operational Session Controls:** Tag citations with active Checkpoint Post (*Boundary Post, Poblacion Plaza, MacArthur Bypass, Mobile Alpha*), Operational Shift (*Day, Afternoon, Night*), and Apprehending Officer Badge with live timestamp clock.
- **Unlicensed Driver Workflow:** Automatically disengages driver's license requirements when *"No Driver's License"* is selected and requires alternative government identification (*PhilID, Passport, SSS/GSIS, Voter's ID, PRC, Postal, Senior/PWD*).
- **Statutory Fine Calculations & Officer Discretion:** Automatically calculates fines according to LTO JAO 2014-01 / municipal schedules, with an optional toggle for manual officer discretion adjustments.
- **Vehicle Classification & Disposition:** Categorize vehicles (*Private/Sedan, Motorcycle, Tricycle, Commercial/Truck*) and log disposition (*Released with Citation, Impounded, Turned Over to HPG*) with mandatory impound slip tracking.
- **Evidence & Photo Capture:** Upload photos of confiscated licenses, OR-CR documents, or vehicle defects with client-side canvas downscaling (under ~200KB) and instant thumbnail preview.
- **Thermal Bluetooth Citation Receipt Printing:** Built-in citation ticket with PNP header, station details, driver/vehicle details, itemized violations, fine amount, payment notice, and signature lines. Centered automatically on standard Letter/A4 paper and natively compatible with 58mm/80mm thermal roll printers.
- **Multi-Tier Screening Alerts:** Real-time flagging for wanted persons, court warrants, and HPG alarm/stolen vehicle plates (`CLEAR`, `WARNING / REPEAT OFFENDER`, `ALARM / HPG WANTED`).
- **Registry Management:** Compact table with violation badges, hover tooltips, status update modal (`Unsettled`, `Paid at Treasury`, `Voided/Contested`), and full detail modal.
- **Fast Search & Quick Filter Chips:** Instant search by Ticket #, Plate, Driver, License, Alternative ID, Officer Badge, or Violation with Enter key support; one-click filter chips by Date (*Today, Active Shift, 7 Days*) and Status (*Flagged, Unsettled*).
- **Excel-Ready CSV Export:** Export current records to CSV with a UTF-8 BOM (`\uFEFF`) to preserve Philippine Peso signs (`₱`) and Filipino name accents in Windows Excel.
- **Summary Metrics Dashboard:** Live counters for Total Apprehensions, Total Fines Levied, Flagged Alarms, and Unsettled Citations.

---

## Running Automated Tests

Run the built-in test suite:

```bash
node --test
```

Executes 14 unit and integration tests covering statutory calculation, ticket numbering, screening evaluations, alternative ID enforcement, fine discretion overrides, impound validation, status PATCH routing, multi-field search, summary KPI queries, and large evidence photo payload processing.

---

## Troubleshooting

### Error: "Node.js was not found in your system PATH"
- Node.js is not yet installed on the computer. Download and run the free LTS installer from [https://nodejs.org/](https://nodejs.org/), then double-click the shortcut again.

### Port 3000 is already in use (`EADDRINUSE`)
- Another application is using port 3000. Specify an alternate port before starting:
  ```powershell
  $env:PORT = 3001
  npm start
  ```
  Then open `http://localhost:3001`.

### Creating a Fresh Clean Database
- If you wish to clear all test records and start with a fresh blank database for a new checkpoint operation, simply delete `pnp_checkpoint.db`:
  ```bash
  del pnp_checkpoint.db
  ```
  The system will automatically recreate a clean database on the next launch.

---

## Notes
This is a local prototype and does not connect to live government or police databases. The screening feature uses a basic local rule set stored in the backend rather than a real-time external API.

## License
This project is intended for academic or prototype use and may be modified as needed for coursework or presentation purposes.
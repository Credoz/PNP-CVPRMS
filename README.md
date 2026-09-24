# Computerized Violation Processing and Records Management System (PNP-CVPRMS)

**Philippine National Police — Computerized Violation Processing & Records Management System**

Repository: https://github.com/Credoz/PNP-CVPRMS  
Target Platform: **Online Web Application with Real-Time Data Synchronization**  
Current Release: **v2.0-PRO (Demonstration Prototype)**  
Default Station: `Agoo Municipal Police Station`

---

## System Overview & Vision

**PNP-CVPRMS** is an online, web-based violation processing and records management system designed for the Philippine National Police. The platform is architected to provide **centralized, real-time data synchronization** across municipal police stations, regional command centers, and field checkpoints. 

In its full operational deployment, PNP-CVPRMS interconnects checkpoint terminals directly with national law enforcement and transportation registries:
- **Real-Time Highway Patrol Group (HPG) Alarms:** Instant vehicle screening against active stolen vehicle and alarm lists.
- **National Police Watchlists & Court Warrants:** Immediate identification of flagged drivers, wanted individuals, or repeat traffic offenders.
- **LTO LTMS Integration:** Live validation of driver's license validity and vehicle official registration (OR-CR) records.
- **Treasury Settlement Sync:** Bi-directional real-time status updates when citations are settled at the Municipal Treasury.

> [!IMPORTANT]
> **Prototype Demonstration Mode:**
> For academic defense, coursework presentation, and initial field testing, this release is packaged as a **Self-Contained Web Prototype**. The system runs a complete Node.js/Express web server with real-time browser capabilities, an embedded SQLite database, and an integrated screening engine simulating live database hits. This ensures dependable, zero-downtime presentations on demonstration laptops, flash drives, or local networks without requiring external VPN access or live police server credentials.

---

## System Architecture: Vision vs. Prototype

```text
========================================================================================
                         TARGET ONLINE PRODUCTION ARCHITECTURE
========================================================================================
 [ Field Checkpoint 1 ] ──┐                                ┌── [ PNP Regional HQ ]
 [ Field Checkpoint 2 ] ──┼──► [ Central Cloud Web API ] ──┼──► [ Municipal Treasury ]
 [ Mobile Patrol Alpha ] ─┘    │   (Node.js / WebSockets)  └──► [ HPG Command Center ]
                               ▼
               [ Centralized Secure Database ]
             (PostgreSQL / PNP ITMS Cloud Engine)
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
 [ LTO LTMS Registry API ]               [ National Warrant Registry ]

========================================================================================
                   CURRENT DEMONSTRATION PROTOTYPE IMPLEMENTATION
========================================================================================
 [ Checkpoint Web Terminal ] ◄── (Real-Time REST API) ──► [ Local Node.js / Express Server ]
           │                                                               │
           ▼                                                               ▼
 [ Thermal Citation POS ]                                        [ Embedded SQLite Engine ]
 (58mm / 80mm Print Engine)                                      (Simulated Live Watchlists)
```

---

## Real-Time Features & Operational Capabilities

### 1. Active Checkpoint Operational Session
- **Real-Time Checkpoint Clock:** Live operational date and timestamp synchronization for every citation issued.
- **Operational Shift Tracking:** Instant assignment to active duty shifts (*Shift 1: Day [06:00 - 14:00]*, *Shift 2: Afternoon [14:00 - 22:00]*, *Shift 3: Night [22:00 - 06:00]*).
- **Post Location Tagging:** Geographically attributes records to designated boundary posts (*Boundary Post - Brgy. San Nicolas Norte*, *Poblacion Plaza Junction*, *MacArthur Highway Bypass*, *Mobile Checkpoint Alpha*).
- **Officer Session Synchronization:** Auto-populates apprehension forms with the logged-in apprehending officer's badge/credentials.

### 2. Live Screening & Multi-Tier Alert Engine
- Evaluates driver name, vehicle plate, license number, and ID credentials in real time against simulated law enforcement databases:
  - `CLEAR` (Emerald green badge): Clean record, no active alerts.
  - `WARNING / REPEAT OFFENDER` (Amber/orange badge): Expired driver's license, expired registration, or past apprehension flags.
  - `ALARM / HPG WANTED` (Pulsing high-visibility red badge): Active HPG alarm for stolen vehicles or national court warrant match.

### 3. Comprehensive Apprehension Entry & Validation
- **Standardized Philippine Traffic Violations:** Built-in statutory schedules based on LTO Joint Administrative Order (JAO 2014-01) and MMDA/municipal regulations:
  - *No Driver's License* (₱1,500.00)
  - *Expired Vehicle Registration* (₱1,200.00)
  - *No Helmet / Seatbelt* (₱1,000.00)
  - *Driving Under the Influence - DUI* (₱5,000.00)
  - *Illegal Modification* (₱2,500.00)
  - *Reckless Driving / Counterflow (Illegal Overtaking)* (₱3,000.00)
  - *Failure to Carry Driver's License / OR-CR* (₱1,000.00)
  - *Disregarding Traffic Signs (DTS) / Red Light* (₱1,000.00)
  - *Distracted Driving - RA 10913* (₱5,000.00)
  - *Illegal Parking / Obstruction* (₱1,000.00)
  - *Number Coding Violation (UVVRP)* (₱500.00)
  - *Over-speeding* (₱1,200.00)
  - *Defective Equipment / Smoke Belching* (₱1,500.00)
- **Searchable Violation Picker:** Live filter input to rapidly locate and select specific traffic offenses.
- **Unlicensed Driver Workflow:** Automatically disables the license number input when *"No Driver's License"* is selected and requires valid alternative government identification (*PhilID / National ID*, *Passport*, *SSS/GSIS*, *Voter's ID*, *PRC ID*, *Postal ID*, *Senior Citizen / PWD ID*).
- **Statutory Totaling with Manual Discretion Override:** Automatically totals fines while offering an authorized toggle for discretionary penalty adjustments.
- **Vehicle Classification & Disposition:** Categorize vehicles (*Private/Sedan*, *Motorcycle*, *Tricycle*, *Commercial/Truck*); tracks vehicle disposition (*Released with Citation*, *Impounded*, *Turned Over to HPG*); enforces towing/impound receipt slip validation.
- **Documentary & Media Evidence Capture:** Ingests photos of confiscated licenses, OR-CR documents, defective vehicle parts, or stencils with client-side canvas optimization (kept under ~200KB) and instant thumbnail review.

### 4. Thermal Citation Slip Printing (58mm / 80mm & Centered Desktop)
- Built-in formatted citation slip containing Republic header, ticket number, date/time, post, shift, driver/vehicle information, itemized violations, total fine, settlement instructions, and driver/officer signature lines.
- Centered automatically when printed on standard Letter/A4 paper; natively compatible with mobile Bluetooth 58mm and 80mm thermal roll printers.

### 5. Centralized Registry & KPI Metrics
- **Interactive Registry Table:** High-density layout with compact violation badges, native hover tooltips, and payment status indicators (*Unsettled / Unpaid*, *Settled / Paid at Treasury*, *Voided / Contested*).
- **Real-Time Search & Filtering:** Instant multi-field search across Ticket Number, Plate, Driver Name, License, Alternative ID, Officer Badge, or Violation with Enter key support.
- **Quick Operational Filter Chips:** Filter in real time by *All Dates*, *Today*, *Active Shift*, *Last 7 Days*, *Flagged Alarms*, and *Unsettled Only*.
- **Full Dossier Inspection:** Modal inspection displaying complete driver background, alternative IDs, and full-resolution evidence photos.
- **Payment Settlement Tracking:** Live update of citation settlement states via `PATCH /api/violations/:id/status`.
- **Excel-Ready CSV Export:** One-click CSV export with UTF-8 BOM (`\uFEFF`) ensuring Philippine Peso signs (`₱`) and Filipino name accents render cleanly in Windows Microsoft Excel.
- **KPI Metrics Dashboard:** Live counters for Total Apprehensions, Total Fines Levied, Flagged Alarms, and Unsettled Citations.

---

## Technical Stack

- **Backend:** Node.js, Express.js REST API
- **Frontend:** HTML5, Modern CSS3 (CSS Grid, Flexbox, `@media print`), Vanilla ES6+ JavaScript
- **Database:** SQLite3 embedded engine (production architecture targets PostgreSQL)
- **Tooling & Platform:** Windows PowerShell, Batch Launchers, Native WScript Shell COM API

---

## Quick Setup & Execution

### System Requirements
- **Node.js** 18.x or later ([https://nodejs.org/](https://nodejs.org/))
- **npm** (bundled with Node.js)
- Modern web browser (Chrome, Edge, Firefox, Brave)

### 1. Manual Setup
```bash
cd "Source Code"
npm install
npm start
```
Access the application in your browser at `http://localhost:3000`.

### 2. Configurable Environment Variables
```powershell
$env:PORT = 3001
$env:STATION_NAME = "San Fernando City Police Station"
npm start
```

---

## Desktop Shortcut (Windows)

1. Open the `Source Code` folder.
2. Double-click:
   ```text
   Create-CVPRMS-Shortcut.bat
   ```
3. A shortcut named **PNP-CVPRMS** with the official PNP badge icon will be placed onto your Windows Desktop.
4. Double-clicking the shortcut runs `Start-CVPRMS.bat`, initiates the local server in the background, and automatically opens `http://localhost:3000` in your default browser.

---

## USB Flash Drive Transfer (Demonstration & Defense)

To transfer and present PNP-CVPRMS on another computer:

1. **Copy or Compress:** Copy the `Source Code` folder (or compress it into a `.zip` file) onto your USB flash drive.
2. **Extract to Target PC:** On the presentation computer, extract the folder to a permanent location (e.g. `C:\PNP-CVPRMS` or `Documents\PNP-CVPRMS`).
   > [!IMPORTANT]
   > Do not run the shortcut creator directly from inside the unextracted zip or while still on the USB flash drive. Copy to a permanent drive first so desktop shortcuts point to an active local path.
3. **Verify Node.js:** Ensure the presentation computer has Node.js installed ([https://nodejs.org/](https://nodejs.org/)).
4. **Run Shortcut Creator:** Double-click `Create-CVPRMS-Shortcut.bat`.
5. **Start System:** Double-click the **PNP-CVPRMS** desktop shortcut.
   - `Start-CVPRMS.bat` includes an **automatic dependency preflight check**. If `node_modules` is missing or was compiled under a different Node.js version, it will automatically install and configure dependencies on first startup.

> [!TIP]
> **Data Portability:** If `pnp_checkpoint.db` is included, all recorded citations travel with the application. To start a fresh demonstration session with zero records, simply delete `pnp_checkpoint.db` before launching; the system will automatically create a clean database on startup.

---

## Automated Test Suite

Run the 14-test regression and feature verification suite:

```bash
cd "Source Code"
node --test
```

Tests cover:
- Statutory fine schedule totaling and expanded violation calculations
- Citation ticket number format generation
- Screening rules (Alarm, Warning, Clear, and unlicensed driver edge cases)
- Alternative ID validation for unlicensed drivers
- Fine discretion override handling
- Mandatory impound receipt validation
- Citation payment status PATCH updates and rejection of invalid states
- Multi-field search querying (ticket number, plate, officer ID, driver)
- Summary KPI calculations including unsettled records
- High-capacity base64 evidence photo upload without payload size errors

---

## Future Roadmap: Online Deployment

- [ ] **Cloud Migration:** Transition backend to cloud infrastructure (Google Cloud / AWS / Azure) running a centralized PostgreSQL cluster.
- [ ] **WebSockets / SSE:** Implement live server-sent events for instant multi-checkpoint broadcast of newly flagged stolen vehicles and warrants.
- [ ] **LTO LTMS API Gateway:** Integrate official government web APIs for real-time license and registration verification.
- [ ] **Treasury Online Payment Gateway:** Enable Landbank Link.BizPortal / GCash / Maya online payment integration for immediate citation settlement.
- [ ] **Mobile Patrol PWA:** Progressive Web App (PWA) client with offline-first caching and automatic synchronization upon reconnecting to cellular networks.

---

## Project Team

- **Casey Freud** — Team Leader
- Angelo
- Antonio
- Augusto Manuel
- Benjie
- Emmanuel John
- Genuflect
- Ranier

---

## Notes
This is a local prototype and does not connect to live government or police databases. The screening feature uses a basic local rule set stored in the backend rather than a real-time external API.

## License
This project is intended for academic or prototype use and may be modified as needed for coursework or presentation purposes.

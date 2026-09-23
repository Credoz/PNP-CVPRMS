# PNP-CVPRMS

Computerized Violation Processing and Records Management System for PNP Checkpoints.

Repository: https://github.com/Credoz/PNP-CVPRMS

## Overview

PNP-CVPRMS is a Node.js and Express prototype for recording and managing checkpoint traffic violations. It provides a browser-based interface for entering driver, vehicle, officer, and violation information; calculating fines; generating ticket numbers; applying local screening rules; and reviewing stored records.

The prototype uses SQLite for local data storage. It does not connect to live government, police, licensing, or vehicle databases. Screening uses the local rule set defined in the backend.

## Requirements

- Node.js 18 or later
- npm
- A modern web browser

## Setup and Run

From the repository root:

```bash
cd "Source Code"
npm install
npm start
```

Open `http://localhost:3000` in a browser.

To use another port, set the `PORT` environment variable before starting the server. For example, in PowerShell:

```powershell
$env:PORT = 3001
npm start
```

The station label defaults to `Agoo Municipal Police Station`. For local testing, it can be changed with the `STATION_NAME` environment variable.

## Desktop Shortcut

To create a desktop shortcut on Windows, you can either:
- Double-click `Create-CVPRMS-Shortcut.bat` inside the `Source Code` folder, or
- Run `Create-CVPRMS-Shortcut.ps1` from PowerShell inside the `Source Code` folder (`powershell -ExecutionPolicy Bypass -File .\Create-CVPRMS-Shortcut.ps1`).

The shortcut points to `Start-CVPRMS.bat`, starts the local server, opens `http://localhost:3000`, and uses the application icon at `Source Code\assets\PNPCVPRMS.ico` (automatically generated from `PNPCVPRMS.png` if missing).

## Test

Run the built-in Node.js test suite from the application directory:

```bash
cd "Source Code"
node --test
```

## Current Features

- Driver and vehicle record entry
- Multiple violations per citation
- Automatic fine calculation
- Ticket number generation
- Local screening status for flagged drivers, licenses, and vehicles
- Search by driver name, license number, or plate number
- SQLite-based violation records
- Summary reporting for total records, fines, and flagged records
- CSV export of currently displayed records
- Agoo Municipal Police Station labeling for the local prototype

## Repository Structure

```text
.
├── Main/                  Empty placeholder for the former application location
├── Documentations/        Data dictionary, diagrams, pseudo-code, and design documents
├── Config Scripts/        Configuration script resources
├── Dependencies/          Dependency-related repository resources
├── Schema/                Schema-related repository resources
├── Source Code/           Application source, package files, database, assets, and tests
├── README.md              Project overview and usage instructions
└── SCM_PLAN.md            Software configuration management plan
```

The main application files are:

- `Source Code/server.js` - Express server, API routes, validation, business rules, and SQLite schema initialization
- `Source Code/index.html` - Browser interface and client-side behavior
- `Source Code/package.json` - Project metadata, dependencies, and start script
- `Source Code/test/features.test.js` - Automated feature tests

## Team

- Casey Freud - Leader
- Angelo
- Antonio
- Augusto Manuel
- Benjie
- Emmanuel John
- Genuflect
- Ranier

## Project Status

This is an academic or prototype project intended for coursework and presentation use. It should not be treated as a production system or as a connection to official PNP records.

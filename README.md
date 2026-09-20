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
cd Main
npm install
npm start
```

Open `http://localhost:3000` in a browser.

To use another port, set the `PORT` environment variable before starting the server. For example, in PowerShell:

```powershell
$env:PORT = 3001
npm start
```

## Test

Run the built-in Node.js test suite from the application directory:

```bash
cd Main
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
- Summary reporting through the application API

## Repository Structure

```text
.
├── Main/                  Application source, package files, database, and tests
├── Documentations/        Data dictionary, diagrams, pseudo-code, and design documents
├── Config Scripts/        Configuration script resources
├── Dependencies/          Dependency-related repository resources
├── Schema/                Schema-related repository resources
├── Source Code/           Source-code repository resources
├── README.md              Project overview and usage instructions
└── SCM_PLAN.md            Software configuration management plan
```

The main application files are:

- `Main/server.js` - Express server, API routes, validation, business rules, and SQLite schema initialization
- `Main/index.html` - Browser interface and client-side behavior
- `Main/package.json` - Project metadata, dependencies, and start script
- `Main/test/features.test.js` - Automated feature tests

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

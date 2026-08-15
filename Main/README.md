# Computerized Violation Processing and Records Management System for PNP Checkpoints (PNP-CVPRMS)

This repository contains the software prototype for the PNP Checkpoint Violation Processing and Records Management System.

## System Requirements
* Node.js (version 18.x or later recommended)
* NPM (comes bundled with Node.js)
* Modern web browser (Google Chrome, Microsoft Edge, Firefox)

## How to Setup and Run the Project

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Credoz/PNP-CVPRMS.git
   ```

2. **Open the project folder:**
   ```bash
   cd PNP-CVPRMS
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run the application:**
   ```bash
   npm start
   ```

5. **Open in browser:**
   ```text
   http://localhost:3000
   ```

## Project Overview
This prototype allows checkpoint officers to:
- record driver and vehicle violation information
- select multiple violations for a single citation
- automatically compute the total fine based on the local offense schedule
- generate a ticket number
- check a basic local screening status for flagged drivers, vehicles, or license records
- search and review previous records from a local SQLite database

## Features in the Current Prototype
- Driver and plate record entry
- Multi-violation selection
- Automatic fine totaling
- Ticket generation
- Screening status indicator
- Search by driver name, license, or plate
- SQLite-based records storage

## Troubleshooting

### If `npm start` fails because scripts are disabled in PowerShell
Run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
Then run:
```bash
npm start
```

### If port 3000 is already in use
If you see `EADDRINUSE`, another app is using port 3000. You can either stop that process or run the app on another port:
```bash
set PORT=3001
npm start
```
Then open:
```text
http://localhost:3001
```

### If the database has an older schema
If you already ran the app before a feature update and see an error like `table violations has no column named ticket_number`, delete the database file and restart:
```bash
del pnp_checkpoint.db
npm start
```

## Notes
This is a local prototype and does not connect to live government or police databases. The screening feature uses a basic local rule set stored in the backend rather than a real-time external API.

## License
This project is intended for academic or prototype use and may be modified as needed for coursework or presentation purposes.
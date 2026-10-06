# PNP-CVPRMS — Source Code & Developer Guide

This folder contains the complete, runnable source code, embedded database, automated test suite, and Windows deployment scripts for the **PNP Checkpoint Vehicular Passing & Violations Record Management System (PNP-CVPRMS)**.

---

## 1. Directory File Manifest

| File / Folder | Purpose |
| :--- | :--- |
| [`server.js`](file:///c:/Users/emman/PNP-CVPRMS/Source%20Code/server.js) | Express.js REST API server, SQLite database controller, screening engine, and static file server. |
| [`index.html`](file:///c:/Users/emman/PNP-CVPRMS/Source%20Code/index.html) | Single-page application frontend containing the UI, forms, thermal print layout, modals, and client-side logic. |
| [`pnp_checkpoint.db`](file:///c:/Users/emman/PNP-CVPRMS/Source%20Code/pnp_checkpoint.db) | Embedded SQLite 3 database file storing active citation records. |
| [`package.json`](file:///c:/Users/emman/PNP-CVPRMS/Source%20Code/package.json) | Node.js project configuration, dependencies (`express`, `sqlite3`), and lifecycle scripts (`npm start`, `npm test`). |
| [`Create-CVPRMS-Shortcut.bat`](file:///c:/Users/emman/PNP-CVPRMS/Source%20Code/Create-CVPRMS-Shortcut.bat) | Windows batch script that creates a one-click desktop shortcut with the official PNP shield icon. |
| [`Start-CVPRMS.bat`](file:///c:/Users/emman/PNP-CVPRMS/Source%20Code/Start-CVPRMS.bat) | Windows launcher script that checks dependencies, starts `server.js` in the background, and opens the browser. |
| [`test/self_check.js`](file:///c:/Users/emman/PNP-CVPRMS/Source%20Code/test/self_check.js) | Automated regression test suite verifying database integrity, validation rules, and screening logic. |

---

## 2. Quick Setup & Execution

### System Requirements
- **Node.js** (v18.0.0 or later) — [https://nodejs.org/](https://nodejs.org/)
- **npm** (included with Node.js)
- Supported Browsers: Google Chrome, Microsoft Edge, Mozilla Firefox, Brave

### Option A: Standard Terminal Launch
```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start
```
Open **`http://localhost:3000`** in your browser.

### Option B: Windows One-Click Desktop Shortcut
1. Double-click `Create-CVPRMS-Shortcut.bat`.
2. A shortcut labeled **PNP-CVPRMS** will appear on your desktop.
3. Double-click the shortcut to start the server and open your default browser automatically.

---

## 3. REST API Endpoint Summary

The backend (`server.js`) exposes the following HTTP endpoints:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/violations` | Retrieve all violations (supports query params: `search`, `limit`, `offset`, `date`). |
| `POST` | `/api/violations` | Record a new violation citation (validates license, IDs, impounds, and fines). |
| `GET` | `/api/violations/:id` | Fetch complete dossier details and evidence photo for a specific violation. |
| `PUT` | `/api/violations/:id/payment` | Update payment status (`Unsettled / Unpaid` or `Settled / Paid`). |
| `GET` | `/api/violations/summary` | Return aggregated KPI statistics (Total, Fines, Alarms, Unsettled). |
| `POST` | `/api/screen` | Evaluate driver and vehicle credentials against in-memory security watchlists. |

---

## 4. Running the Automated Test Suite

To run all automated test assertions:

```bash
npm test
```
*(Or directly via Node: `node test/self_check.js`)*

Expected output:
```text
Running CVPRMS self-check test suite...
[DATABASE] Connected to SQLite database (pnp_checkpoint.db).
[DATABASE] Violations table verified/created successfully.
ALL SELF-CHECK ASSERTIONS PASSED SUCCESSFULLY!
```

---

## 5. Demonstration & USB Flash Drive Deployment

To present or run PNP-CVPRMS on an external demonstration PC:

1. **Copy or Compress:** Copy the entire `Source Code` folder onto your USB flash drive.
2. **Transfer to Local Drive:** Extract or copy the folder onto a local drive on the presentation PC (e.g. `C:\PNP-CVPRMS` or `Desktop\PNP-CVPRMS`).
   > [!IMPORTANT]
   > Do not run directly from inside a `.zip` archive or while on the USB flash drive. Running from a local drive ensures persistent database access and correct shortcut creation.
3. **Verify Node.js:** Verify that Node.js is installed on the target machine.
4. **Launch:** Run `Create-CVPRMS-Shortcut.bat` and click the generated desktop icon. `Start-CVPRMS.bat` performs an automatic dependency preflight check on startup.

### Resetting to a Clean Database
To clear all test records before a live presentation:
```bash
del pnp_checkpoint.db
```
The server will automatically generate a clean, empty `violations` table upon the next startup.

---

## 6. Troubleshooting

### `EADDRINUSE: address already in use :::3000`
Another application is already bound to port 3000. Launch on a different port:
```powershell
$env:PORT = 3001
npm start
```
Then navigate to `http://localhost:3001`.

### PowerShell Execution Policy Error (`PSSecurityException`)
If PowerShell blocks `npm` scripts (`running scripts is disabled on this system`), run commands via standard Command Prompt (`cmd.exe`) or execute:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
or run Node directly:
```powershell
node server.js
```
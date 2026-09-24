@echo off
setlocal

cd /d "%~dp0"
if not exist "server.js" (
    echo ================================================================
    echo [ERROR] CVPRMS application files were not found in:
    echo %CD%
    echo Please make sure you extract the entire zip folder before running.
    echo ================================================================
    pause
    exit /b 1
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "%ProgramFiles%\nodejs\node.exe" (
        set "PATH=%ProgramFiles%\nodejs;%PATH%"
    ) else if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
        set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
    ) else if exist "%LocalAppData%\Programs\nodejs\node.exe" (
        set "PATH=%LocalAppData%\Programs\nodejs;%PATH%"
    )
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ================================================================
    echo [ERROR] Node.js is not installed or not in system PATH!
    echo ================================================================
    echo PNP-CVPRMS requires Node.js to run its local server and database.
    echo Please download and install the free Node.js installer [LTS version]
    echo from: https://nodejs.org/
    echo Once installed, double-click the shortcut or this file again.
    echo ================================================================
    pause
    exit /b 1
)

node -e "try { require('sqlite3'); require('express'); } catch (e) { process.exit(1); }" >nul 2>nul
if %errorlevel% neq 0 (
    echo ================================================================
    echo [INFO] First-time setup detected on this computer.
    echo Initializing required packages: express, sqlite3...
    echo ================================================================
    call npm install --no-audit --no-fund
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install packages automatically.
        echo Please ensure you are connected to the internet for first-time setup.
        pause
        exit /b 1
    )
)


echo Starting PNP-CVPRMS Server at http://localhost:3000...
start "PNP-CVPRMS Server" /min cmd /c node server.js
ping -n 3 127.0.0.1 >nul
start "" http://localhost:3000


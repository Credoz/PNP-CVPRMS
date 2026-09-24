@echo off
setlocal

cd /d "%~dp0"
if not exist "server.js" (
    echo [ERROR] CVPRMS application files were not found in:
    echo %CD%
    pause
    exit /b 1
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not found in your system PATH!
    echo Please install Node.js from https://nodejs.org/ to run PNP-CVPRMS.
    pause
    exit /b 1
)

echo Starting PNP-CVPRMS Server at http://localhost:3000...
start "PNP-CVPRMS Server" /min cmd /c node server.js
timeout /t 2 /nobreak >nul
start "" http://localhost:3000

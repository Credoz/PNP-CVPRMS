@echo off
setlocal

cd /d "%~dp0"
if not exist "server.js" (
    echo CVPRMS application files were not found in:
    echo %CD%
    pause
    exit /b 1
)

echo Starting PNP-CVPRMS at http://localhost:3000
start "PNP-CVPRMS Server" /min cmd /c npm.cmd start
timeout /t 2 /nobreak >nul
start "" http://localhost:3000

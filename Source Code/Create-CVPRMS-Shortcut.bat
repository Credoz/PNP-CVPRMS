@echo off
setlocal
cd /d "%~dp0"
echo Creating PNP-CVPRMS Desktop Shortcut...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Create-CVPRMS-Shortcut.ps1"
echo.
pause

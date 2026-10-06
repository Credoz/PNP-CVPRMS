@echo off
setlocal
cd /d "%~dp0"

echo ================================================================
echo  Creating PNP-CVPRMS Desktop Shortcut...
echo ================================================================

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desktop = [Environment]::GetFolderPath('Desktop'); $sc = $ws.CreateShortcut((Join-Path $desktop 'PNP-CVPRMS.lnk')); $sc.TargetPath = '%~dp0Start-CVPRMS.bat'; $sc.WorkingDirectory = '%~dp0'; $ico = '%~dp0assets\PNPCVPRMS.ico'; if (Test-Path $ico) { $sc.IconLocation = $ico + ',0' }; $sc.Save(); Write-Host 'Desktop shortcut created successfully!' -ForegroundColor Green"

if %ERRORLEVEL% equ 0 (
    echo.
    echo ================================================================
    echo [SUCCESS] PNP-CVPRMS shortcut placed on your Desktop.
    echo Target: %~dp0Start-CVPRMS.bat
    echo Icon:   %~dp0assets\PNPCVPRMS.ico
    echo ================================================================
) else (
    echo.
    echo [ERROR] Failed to create desktop shortcut.
)
echo.
pause

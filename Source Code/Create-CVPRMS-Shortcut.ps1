$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$launcherPath = Join-Path $projectRoot 'Start-CVPRMS.bat'
$iconPath = Join-Path $projectRoot 'assets\PNPsvg.svg'
$desktopPath = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktopPath 'PNP-CVPRMS.lnk'

if (-not (Test-Path $launcherPath)) {
    throw "Launcher not found: $launcherPath"
}

if (-not (Test-Path $iconPath)) {
    throw "Icon not found: $iconPath"
}

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $launcherPath
$shortcut.WorkingDirectory = $projectRoot
$shortcut.Description = 'Start the local PNP Computerized Violation Processing and Records Management System'
$shortcut.IconLocation = "$iconPath,0"
$shortcut.Save()

Write-Host "Desktop shortcut created: $shortcutPath"
Write-Host "Icon source: $iconPath"
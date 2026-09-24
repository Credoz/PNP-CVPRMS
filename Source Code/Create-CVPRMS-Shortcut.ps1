$ErrorActionPreference = 'Stop'

# Determine project root directory reliably
$projectRoot = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $projectRoot) {
    $projectRoot = (Get-Location).Path
} else {
    $projectRoot = (Resolve-Path $projectRoot).Path
}

$launcherPath = Join-Path $projectRoot 'Start-CVPRMS.bat'

if (-not (Test-Path $launcherPath)) {
    throw "Launcher not found: $launcherPath"
}

# Assets folder and default icon paths
$assetsDir = Join-Path $projectRoot 'assets'
$defaultIco = Join-Path $assetsDir 'PNPCVPRMS.ico'
$defaultPng = Join-Path $assetsDir 'PNPCVPRMS.png'

# Helper function to generate a standard multi-resolution ICO file from an image
function Convert-ImageToIco {
    param(
        [Parameter(Mandatory = $true)][string]$InputPath,
        [Parameter(Mandatory = $true)][string]$OutputPath
    )

    Add-Type -AssemblyName System.Drawing
    $srcImg = [System.Drawing.Image]::FromFile($InputPath)
    $sizes = @(256, 64, 48, 32, 16)
    $frames = @()

    try {
        foreach ($s in $sizes) {
            $bmp = New-Object System.Drawing.Bitmap $s, $s
            $g = [System.Drawing.Graphics]::FromImage($bmp)
            $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $g.Clear([System.Drawing.Color]::Transparent)

            $ratio = [Math]::Min($s / $srcImg.Width, $s / $srcImg.Height)
            $destW = [int][Math]::Round($srcImg.Width * $ratio)
            $destH = [int][Math]::Round($srcImg.Height * $ratio)
            $destX = [int](($s - $destW) / 2)
            $destY = [int](($s - $destH) / 2)

            $g.DrawImage($srcImg, $destX, $destY, $destW, $destH)
            $g.Dispose()

            $ms = New-Object System.IO.MemoryStream
            $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
            $bytes = $ms.ToArray()
            $ms.Dispose()
            $bmp.Dispose()

            $frames += ,@($s, $bytes)
        }
    }
    finally {
        $srcImg.Dispose()
    }

    $fs = [System.IO.File]::Create($OutputPath)
    $bw = New-Object System.IO.BinaryWriter($fs)
    try {
        # ICONDIR header
        $bw.Write([uint16]0)             # Reserved
        $bw.Write([uint16]1)             # Type 1 = ICO
        $bw.Write([uint16]$frames.Count) # Image count

        $offset = 6 + (16 * $frames.Count)

        # Directory entries
        foreach ($f in $frames) {
            $s = $f[0]
            $bytes = $f[1]

            $wByte = if ($s -ge 256) { [byte]0 } else { [byte]$s }
            $hByte = if ($s -ge 256) { [byte]0 } else { [byte]$s }

            $bw.Write($wByte)
            $bw.Write($hByte)
            $bw.Write([byte]0)
            $bw.Write([byte]0)
            $bw.Write([uint16]1)
            $bw.Write([uint16]32)
            $bw.Write([uint32]$bytes.Length)
            $bw.Write([uint32]$offset)
            $offset += $bytes.Length
        }

        # Raw image frames
        foreach ($f in $frames) {
            $bw.Write($f[1])
        }
        $bw.Flush()
    }
    finally {
        $bw.Close()
        $fs.Close()
    }
}

# Resolve or generate the .ico icon
$selectedIconPath = $null

if (Test-Path $defaultIco) {
    $selectedIconPath = $defaultIco
}
elseif (Test-Path $defaultPng) {
    Write-Host "Converting $defaultPng to Windows icon format ($defaultIco)..." -ForegroundColor Cyan
    try {
        Convert-ImageToIco -InputPath $defaultPng -OutputPath $defaultIco
        $selectedIconPath = $defaultIco
    }
    catch {
        Write-Warning "Could not convert PNG to ICO: $_"
    }
}
else {
    # Check for any .ico in assets
    $anyIco = Get-ChildItem -Path $assetsDir -Filter "*.ico" -File -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($anyIco) {
        $selectedIconPath = $anyIco.FullName
    }
    else {
        # Check for any image in assets to convert
        $anyImage = Get-ChildItem -Path $assetsDir -Include "*.png", "*.jpg", "*.jpeg", "*.bmp" -File -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($anyImage) {
            try {
                $targetIco = Join-Path $assetsDir "$($anyImage.BaseName).ico"
                Write-Host "Converting $($anyImage.FullName) to $targetIco..." -ForegroundColor Cyan
                Convert-ImageToIco -InputPath $anyImage.FullName -OutputPath $targetIco
                $selectedIconPath = $targetIco
            }
            catch {
                Write-Warning "Could not convert image to ICO: $_"
            }
        }
    }
}

# Get desktop path
$desktopPath = [Environment]::GetFolderPath('Desktop')
if (-not $desktopPath -or -not (Test-Path $desktopPath)) {
    $desktopPath = Join-Path $HOME 'Desktop'
}
if (-not (Test-Path $desktopPath)) {
    throw "Desktop directory not found: $desktopPath"
}

$shortcutPath = Join-Path $desktopPath 'PNP-CVPRMS.lnk'

# Create shortcut via WScript.Shell
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $launcherPath
$shortcut.WorkingDirectory = $projectRoot
$shortcut.Description = 'Start the local PNP Computerized Violation Processing and Records Management System'

if ($selectedIconPath -and (Test-Path $selectedIconPath)) {
    $shortcut.IconLocation = "$selectedIconPath,0"
}
else {
    Write-Warning "No icon file found in assets. Creating shortcut with default system icon."
}

$shortcut.Save()

Write-Host "=================================================" -ForegroundColor Green
Write-Host " Desktop shortcut created successfully!" -ForegroundColor Green
Write-Host " Shortcut: $shortcutPath" -ForegroundColor White
Write-Host " Target:   $launcherPath" -ForegroundColor White
if ($selectedIconPath) {
    Write-Host " Icon:     $selectedIconPath" -ForegroundColor White
}
Write-Host "=================================================" -ForegroundColor Green

# Check if running directly from a removable USB flash drive
$driveLetter = [System.IO.Path]::GetPathRoot($projectRoot).TrimEnd('\')
if ($driveLetter) {
    $driveInfo = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$driveLetter'" -ErrorAction SilentlyContinue
    if ($driveInfo -and $driveInfo.DriveType -eq 2) {
        Write-Host ""
        Write-Warning "NOTICE: You created a shortcut pointing to a USB Flash Drive ($driveLetter)!"
        Write-Warning "If you remove the flash drive, this desktop shortcut will not find the files."
        Write-Warning "RECOMMENDATION: Extract/copy the folder to your local drive (e.g. C:\ or Documents), then run this shortcut creator again."
        Write-Host ""
    }
}
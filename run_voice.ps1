# Jon Continuous Voice Assistant Launcher (PowerShell)
Set-Location -Path $PSScriptRoot
if (Test-Path "venv\Scripts\Activate.ps1") {
    & "venv\Scripts\Activate.ps1"
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "     JON VOICE ASSISTANT - CONTINUOUS WAKE WORD LISTENER" -ForegroundColor Cyan
Write-Host "  Listening for wake words ('Jon', 'Hey Jon', 'Yo Jon')..." -ForegroundColor Yellow
Write-Host "  Press Ctrl+C to stop listening at any time." -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan

while ($true) {
    python main.py --voice
    $code = $LASTEXITCODE
    if ($code -ne 0) {
        Write-Host "Voice loop exited with code $code. Restarting listener in 2 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

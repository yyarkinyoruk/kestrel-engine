# Kestrel AI - Gunluk e-CED Scraper
# Kullanim: .\scripts\run-scraper.ps1

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# .env.local'den secret'i oku
$envFile = Join-Path $projectRoot ".env.local"
$secret = (Get-Content $envFile | Select-String "KESTREL_CRON_SECRET=").ToString().Split("=")[1].Trim()

if (-not $secret) {
    Write-Error "KESTREL_CRON_SECRET .env.local dosyasinda bulunamadi"
    exit 1
}

Write-Host "[Kestrel] Scraper baslatiliyor..." -ForegroundColor Cyan

# Dev server arka planda baslat
$serverJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm run dev
} -ArgumentList $projectRoot

Write-Host "[Kestrel] Server baslamasi icin 20 saniye bekleniyor..."
Start-Sleep -Seconds 20

try {
    Write-Host "[Kestrel] Scraper endpoint cagriliyor..."
    $response = curl.exe -s -w "`n%{http_code}" `
        -H "x-kestrel-secret: $secret" `
        --max-time 600 `
        "http://localhost:3000/api/scrapers/eced"
    
    $lines = $response -split "`n"
    $httpCode = $lines[-1]
    $body = ($lines[0..($lines.Length - 2)] -join "`n")
    
    Write-Host "HTTP Status: $httpCode"
    Write-Host "Response:"
    Write-Host $body
    
    # Log dosyasina yaz
    $logDir = Join-Path $projectRoot "scripts\logs"
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $logFile = Join-Path $logDir "scrape-$timestamp.log"
    "HTTP $httpCode`n$body" | Out-File $logFile
    
    Write-Host "[Kestrel] Log kaydedildi: $logFile" -ForegroundColor Green
}
finally {
    Write-Host "[Kestrel] Server durduruluyor..."
    Stop-Job -Job $serverJob
    Remove-Job -Job $serverJob -Force
}

Write-Host "[Kestrel] Tamamlandi!" -ForegroundColor Green
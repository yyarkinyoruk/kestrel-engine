# scripts/run-kariyer.ps1
# Kestrel AI — Kariyer.net Otomasyon
# Apify task'ları çalıştıktan sonra: pull + AI analiz
# Task Scheduler: Salı + Cuma 07:30

$logDir = "$PSScriptRoot\logs"
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = "$logDir\kariyer-$timestamp.log"

function Log($msg) {
    $line = "$(Get-Date -Format 'HH:mm:ss') $msg"
    Write-Host $line
    Add-Content -Path $logFile -Value $line
}

$SECRET = $env:KESTREL_CRON_SECRET
if (!$SECRET) {
    # .env.local'den oku
    $envFile = "$PSScriptRoot\..\.env.local"
    if (Test-Path $envFile) {
        $match = Select-String -Path $envFile -Pattern '^KESTREL_CRON_SECRET=(.+)$'
        if ($match) { $SECRET = $match.Matches[0].Groups[1].Value }
    }
}

if (!$SECRET) {
    Log "HATA: KESTREL_CRON_SECRET bulunamadi"
    exit 1
}

$BASE_URL = "https://kestrel-engine.vercel.app"
$headers = @{ "x-kestrel-secret" = $SECRET }

# ─── Adım 1: Kariyer Pull ─────────────────────────
Log "=== Kariyer.net Pull Basladi ==="
$maxRetry = 3
$success = $false

for ($i = 1; $i -le $maxRetry; $i++) {
    try {
        Log "Pull deneme $i/$maxRetry..."
        $pullResult = Invoke-RestMethod -Uri "$BASE_URL/api/cron/kariyer" -Headers $headers -TimeoutSec 60
        Log "Pull OK: $($pullResult.uniqueSignals) sinyal, $($pullResult.totalInDb) toplam DB"
        $success = $true
        break
    } catch {
        Log "Pull HATA: $($_.Exception.Message)"
        if ($i -lt $maxRetry) {
            $wait = $i * 10
            Log "Bekleniyor: $wait saniye..."
            Start-Sleep -Seconds $wait
        }
    }
}

if (!$success) {
    Log "Pull 3 denemede basarisiz, cikiliyor"
    exit 1
}

# ─── Adım 2: AI Analiz ────────────────────────────
Log "=== AI Analiz Basladi ==="
Start-Sleep -Seconds 5

for ($i = 1; $i -le $maxRetry; $i++) {
    try {
        Log "Analiz deneme $i/$maxRetry..."
        $analyzeResult = Invoke-RestMethod -Uri "$BASE_URL/api/analyze-jobs" -Headers $headers -TimeoutSec 120
        Log "Analiz OK: $($analyzeResult.totalAnalyzed) analiz, $($analyzeResult.keywordMatches) esleme, $($analyzeResult.aiEnriched) AI"
        break
    } catch {
        Log "Analiz HATA: $($_.Exception.Message)"
        if ($i -lt $maxRetry) {
            $wait = $i * 10
            Log "Bekleniyor: $wait saniye..."
            Start-Sleep -Seconds $wait
        }
    }
}

Log "=== Kariyer Otomasyon Tamamlandi ==="
param(
    [Parameter(Mandatory = $true)]
    [string]$ConfigPath
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$Config = Get-Content -Raw -LiteralPath $ConfigPath | ConvertFrom-Json
$DataDir = Join-Path $Root "data"
$HistoryPath = Join-Path $DataDir "history.ndjson"
$CurrentPath = Join-Path $DataDir "current.json"
$DashboardPath = Join-Path $Root "dashboard.html"
$IntervalSeconds = [Math]::Max(10, [int]$Config.intervalSeconds)
$HistoryLimit = [Math]::Max(100, [int]$Config.historyLimit)
$Prefix = "http://localhost:$($Config.port)/"

New-Item -ItemType Directory -Path $DataDir -Force | Out-Null

function Expand-ScreepsData([object]$Data) {
    if ($Data -isnot [string]) { return $Data }
    $Text = [string]$Data
    if ($Text.StartsWith("gz:")) {
        $Bytes = [Convert]::FromBase64String($Text.Substring(3))
        $InputStream = New-Object System.IO.MemoryStream(,$Bytes)
        $Gzip = New-Object System.IO.Compression.GZipStream($InputStream, [IO.Compression.CompressionMode]::Decompress)
        $Reader = New-Object System.IO.StreamReader($Gzip)
        try { $Text = $Reader.ReadToEnd() }
        finally { $Reader.Dispose(); $Gzip.Dispose(); $InputStream.Dispose() }
    }
    return $Text | ConvertFrom-Json
}

function Collect-Telemetry {
    $Base = ([string]$Config.serverUrl).TrimEnd("/")
    $Headers = @{}
    if ($Config.token -and $Config.token -ne "COLE_SEU_TOKEN_AQUI") {
        $Headers["X-Token"] = [string]$Config.token
        $Headers["X-Username"] = [string]$Config.token
    }
    if ($Config.serverPassword) { $Headers["X-Server-Password"] = [string]$Config.serverPassword }

    $Response = Invoke-RestMethod -Method Get -Uri "$Base/api/user/memory?path=telemetry" -Headers $Headers -TimeoutSec 20
    if ($Response.ok -eq 0) { throw "API retornou ok=0" }
    $Sample = Expand-ScreepsData $Response.data
    if ($null -eq $Sample) { throw "Memory.telemetry ainda nao esta disponivel" }
    $Sample | Add-Member -NotePropertyName collectedAt -NotePropertyValue ([DateTime]::UtcNow.ToString("o")) -Force
    $Json = $Sample | ConvertTo-Json -Depth 12 -Compress
    Set-Content -LiteralPath $CurrentPath -Value $Json -Encoding UTF8
    Add-Content -LiteralPath $HistoryPath -Value $Json -Encoding UTF8

    $Lines = @(Get-Content -LiteralPath $HistoryPath)
    if ($Lines.Count -gt ($HistoryLimit + 100)) {
        $Lines | Select-Object -Last $HistoryLimit | Set-Content -LiteralPath $HistoryPath -Encoding UTF8
    }
    Write-Host "[$(Get-Date -Format HH:mm:ss)] tick=$($Sample.tick) energy=$($Sample.room.energyAvailable)/$($Sample.room.energyCapacity) cpu=$($Sample.cpu.used)"
}

function Send-Response($Client, [int]$Status, [string]$ContentType, [string]$Body) {
    $Bytes = [Text.Encoding]::UTF8.GetBytes($Body)
    $Reason = if ($Status -eq 200) { "OK" } elseif ($Status -eq 404) { "Not Found" } elseif ($Status -eq 503) { "Service Unavailable" } else { "Internal Server Error" }
    $Header = "HTTP/1.1 $Status $Reason`r`nContent-Type: $ContentType; charset=utf-8`r`nContent-Length: $($Bytes.Length)`r`nConnection: close`r`nCache-Control: no-store`r`n`r`n"
    $HeaderBytes = [Text.Encoding]::ASCII.GetBytes($Header)
    $Stream = $Client.GetStream()
    $Stream.Write($HeaderBytes, 0, $HeaderBytes.Length)
    $Stream.Write($Bytes, 0, $Bytes.Length)
    $Stream.Flush()
    $Client.Close()
}

function Handle-Request($Client) {
    try {
        $Stream = $Client.GetStream()
        $Reader = New-Object System.IO.StreamReader($Stream, [Text.Encoding]::ASCII, $false, 1024, $true)
        $RequestLine = $Reader.ReadLine()
        do { $Line = $Reader.ReadLine() } while ($null -ne $Line -and $Line -ne "")
        $Path = if ($RequestLine) { ($RequestLine -split " ")[1].Split("?")[0] } else { "/" }
        switch ($Path) {
            "/" { Send-Response $Client 200 "text/html" (Get-Content -Raw -LiteralPath $DashboardPath) }
            "/api/current" {
                if (Test-Path $CurrentPath) { Send-Response $Client 200 "application/json" (Get-Content -Raw -LiteralPath $CurrentPath) }
                else { Send-Response $Client 503 "application/json" '{"error":"Aguardando primeira coleta"}' }
            }
            "/api/history" {
                $Items = @()
                if (Test-Path $HistoryPath) {
                    $Items = @(Get-Content -LiteralPath $HistoryPath | Select-Object -Last $HistoryLimit | ForEach-Object { $_ | ConvertFrom-Json })
                }
                Send-Response $Client 200 "application/json" (ConvertTo-Json -InputObject @($Items) -Depth 12 -Compress)
            }
            default { Send-Response $Client 404 "application/json" '{"error":"Nao encontrado"}' }
        }
    } catch {
        if ($Client.Connected) { Send-Response $Client 500 "application/json" (ConvertTo-Json @{ error = $_.Exception.Message } -Compress) }
    }
}

$Listener = New-Object System.Net.Sockets.TcpListener -ArgumentList ([Net.IPAddress]::Loopback), ([int]$Config.port)
$Listener.Start()
Write-Host "Dashboard: $Prefix" -ForegroundColor Green
Write-Host "Coleta: $($Config.serverUrl) a cada $IntervalSeconds segundos"
Write-Host "Use Ctrl+C para encerrar."

$NextCollection = [DateTime]::MinValue
try {
    while ($true) {
        if ([DateTime]::UtcNow -ge $NextCollection) {
            try { Collect-Telemetry }
            catch { Write-Warning "Falha na coleta: $($_.Exception.Message)" }
            $NextCollection = [DateTime]::UtcNow.AddSeconds($IntervalSeconds)
        }
        if ($Listener.Pending()) { Handle-Request ($Listener.AcceptTcpClient()) }
        else { Start-Sleep -Milliseconds 100 }
    }
} finally {
    $Listener.Stop()
}

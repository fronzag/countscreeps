$ErrorActionPreference = "Stop"

$Root = $PSScriptRoot
$ConfigPath = Join-Path $Root "config.local.json"
$ExamplePath = Join-Path $Root "config.example.json"

if (-not (Test-Path $ConfigPath)) {
    Copy-Item -LiteralPath $ExamplePath -Destination $ConfigPath
    Write-Host "Config criado em: $ConfigPath" -ForegroundColor Yellow
    Write-Host "Edite o campo token e execute este script novamente." -ForegroundColor Yellow
    exit 1
}

& (Join-Path $Root "telemetry-server.ps1") -ConfigPath $ConfigPath

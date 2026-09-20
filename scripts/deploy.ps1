$ErrorActionPreference = "Stop"

$Source = (Resolve-Path (Join-Path $PSScriptRoot "..\src")).Path
$Target = "C:\Users\guilh\AppData\Local\Screeps\scripts\screeps_newbieland_net___21025\default"

if (-not (Test-Path $Source)) {
    Write-Error "Pasta src/ nao encontrada."
}

if (-not (Test-Path $Target)) {
    Write-Error "Pasta do Screeps nao encontrada: $Target"
}

Get-ChildItem -Path $Source -Recurse -Filter "*.js" | ForEach-Object {
    $Relative = $_.FullName.Substring($Source.Length + 1)
    $Dest = Join-Path $Target $Relative
    $DestDir = Split-Path $Dest -Parent

    if (-not (Test-Path $DestDir)) {
        New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
    }

    Copy-Item -Path $_.FullName -Destination $Dest -Force
    Write-Host "  $Relative"
}

Write-Host "Deploy OK: $Target"

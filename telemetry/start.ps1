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

$Config = Get-Content -Raw -LiteralPath $ConfigPath | ConvertFrom-Json

if (-not $env:SCREEPS_USERNAME -and (-not $Config.username -or $Config.username -eq "SEU_USUARIO_NO_NEWBIELAND")) {
    Write-Host "O NewbieLand exige credenciais proprias." -ForegroundColor Yellow
    $env:SCREEPS_USERNAME = Read-Host "Usuario no NewbieLand"
}

if (-not $env:SCREEPS_PASSWORD -and -not $Config.password) {
    $SecurePassword = Read-Host "Senha do NewbieLand" -AsSecureString
    $PasswordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
    try {
        $env:SCREEPS_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($PasswordPointer)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($PasswordPointer)
    }
}

& (Join-Path $Root "telemetry-server.ps1") -ConfigPath $ConfigPath

param(
  [string]$ListenAddress = '127.0.0.1:8000',
  [string]$EnvFilePath = $env:PORTAL_ENV_FILE
)

$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host "[PORTAL API] $Message" -ForegroundColor Cyan
}

$backendRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonExe = Join-Path $backendRoot 'venv\Scripts\python.exe'
$runnerScript = Join-Path $backendRoot 'run_waitress.py'

if (-not (Test-Path -LiteralPath $pythonExe)) {
  throw "No existe Python del entorno virtual en $pythonExe"
}

if (-not (Test-Path -LiteralPath $runnerScript)) {
  throw "No existe el runner de Waitress en $runnerScript"
}

if (-not $EnvFilePath) {
  throw "Debes indicar un archivo externo de entorno mediante -EnvFilePath o la variable PORTAL_ENV_FILE"
}

if (-not (Test-Path -LiteralPath $EnvFilePath)) {
  throw "No se encontró el archivo de entorno: $EnvFilePath"
}

Set-Location -LiteralPath $backendRoot

Write-Step "Backend root: $backendRoot"
Write-Step "Archivo de entorno: $EnvFilePath"
Write-Step "Iniciando Waitress en $ListenAddress"

& $pythonExe $runnerScript --listen $ListenAddress --env-file $EnvFilePath

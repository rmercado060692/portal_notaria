param(
  [string]$ListenAddress = '127.0.0.1:8000',
  [string]$EnvFilePath = $env:PORTAL_ENV_FILE
)

$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host "[PORTAL API] $Message" -ForegroundColor Cyan
}

function Import-DotEnv {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "No se encontró el archivo de entorno: $Path"
  }

  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) {
      return
    }

    $parts = $line -split '=', 2
    if ($parts.Length -ne 2) {
      return
    }

    $name = $parts[0].Trim()
    $value = $parts[1].Trim()

    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
  }
}

$backendRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $backendRoot

$venvActivate = Join-Path $backendRoot 'venv\Scripts\Activate.ps1'
$waitressExe = Join-Path $backendRoot 'venv\Scripts\waitress-serve.exe'

if (-not (Test-Path -LiteralPath $venvActivate)) {
  throw "No existe el entorno virtual en $venvActivate"
}

if (-not (Test-Path -LiteralPath $waitressExe)) {
  throw "No existe waitress-serve en $waitressExe. Ejecuta pip install -r requirements.txt"
}

Write-Step "Activando entorno virtual..."
& $venvActivate

if (-not $EnvFilePath) {
  throw "Debes indicar un archivo externo de entorno mediante -EnvFilePath o la variable PORTAL_ENV_FILE"
}

Write-Step "Cargando variables desde $EnvFilePath"
Import-DotEnv -Path $EnvFilePath

$env:DJANGO_SETTINGS_MODULE = 'portal.settings'
$env:PORTAL_ENV_FILE = $EnvFilePath
$env:PYTHONUNBUFFERED = '1'

Write-Step "Iniciando Waitress en $ListenAddress"
Write-Step "Aplicación WSGI: portal.wsgi:application"

& $waitressExe --listen=$ListenAddress portal.wsgi:application

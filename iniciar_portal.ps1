param(
  [switch]$AbrirNavegador
)

$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host "[PORTAL] $Message" -ForegroundColor Cyan
}

function Test-PortListening {
  param([int]$Port)

  try {
    return $null -ne (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop | Select-Object -First 1)
  }
  catch {
    return $false
  }
}

function Get-PortProcessInfo {
  param([int]$Port)

  try {
    $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop | Select-Object -First 1
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)"
    $commandLine = ''
    if ($null -ne $process -and $null -ne $process.CommandLine) {
      $commandLine = [string]$process.CommandLine
    }
    $normalizedRoot = $projectRoot.ToLowerInvariant()

    return [PSCustomObject]@{
      Port = $Port
      InUse = $true
      ProcessId = $connection.OwningProcess
      CommandLine = $commandLine
      IsCurrentProject = $commandLine.ToLowerInvariant().Contains($normalizedRoot)
    }
  }
  catch {
    return [PSCustomObject]@{
      Port = $Port
      InUse = $false
      ProcessId = $null
      CommandLine = ''
      IsCurrentProject = $false
    }
  }
}

function Ensure-Command {
  param(
    [string]$CommandName,
    [string]$FriendlyName
  )

  if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
    throw "No se encontró $FriendlyName en el PATH. Instálalo antes de continuar."
  }
}

function Start-ServiceWindow {
  param(
    [string]$Title,
    [string]$WorkingDirectory,
    [string]$Command
  )

  $escapedDir = $WorkingDirectory.Replace("'", "''")
  $bootstrap = @"
Set-Location -LiteralPath '$escapedDir'
try { `$Host.UI.RawUI.WindowTitle = '$Title' } catch {}
$Command
"@

  Start-Process powershell.exe `
    -WorkingDirectory $WorkingDirectory `
    -ArgumentList @(
      '-NoExit',
      '-ExecutionPolicy', 'Bypass',
      '-Command', $bootstrap
    ) | Out-Null
}

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot 'backend'
$frontendPath = Join-Path $projectRoot 'frontend'
$backendVenvPython = Join-Path $backendPath 'venv\Scripts\python.exe'
$backendRequirements = Join-Path $backendPath 'requirements.txt'
$backendEnv = Join-Path $backendPath '.env'
$frontendNodeModules = Join-Path $frontendPath 'node_modules'
$frontendProxyMiddleware = Join-Path $frontendPath 'node_modules\http-proxy-middleware'

Write-Step "Raíz del proyecto: $projectRoot"

Ensure-Command -CommandName 'python' -FriendlyName 'Python'
Ensure-Command -CommandName 'npm' -FriendlyName 'Node.js/npm'

if (-not (Test-Path $backendVenvPython)) {
  Write-Step 'No existe el entorno virtual del backend. Creándolo...'
  Push-Location $backendPath
  try {
    python -m venv venv
  }
  finally {
    Pop-Location
  }
}

Write-Step 'Sincronizando dependencias del backend...'
& $backendVenvPython -m pip install -r $backendRequirements

if (-not (Test-Path $frontendNodeModules) -or -not (Test-Path $frontendProxyMiddleware)) {
  Write-Step 'Sincronizando dependencias del frontend...'
  Push-Location $frontendPath
  try {
    npm install
  }
  finally {
    Pop-Location
  }
}

if (-not (Test-Path $backendEnv)) {
  Write-Warning 'No existe backend\.env. El backend puede fallar si faltan variables de entorno.'
}

$backend8000 = Get-PortProcessInfo -Port 8000
if (-not $backend8000.InUse) {
  $backendPort = 8000
  $backendAlreadyRunning = $false
}
elseif ($backend8000.IsCurrentProject) {
  $backendPort = 8000
  $backendAlreadyRunning = $true
  Write-Step 'Backend de este proyecto ya está escuchando en el puerto 8000. No se abrirá otra instancia.'
}
else {
  Write-Warning "El puerto 8000 está ocupado por otro proceso ajeno a este proyecto (PID $($backend8000.ProcessId)). Se usará el puerto 8001 para este portal."
  $backend8001 = Get-PortProcessInfo -Port 8001
  if ($backend8001.InUse -and -not $backend8001.IsCurrentProject) {
    throw "El puerto 8001 también está ocupado por otro proceso (PID $($backend8001.ProcessId)). Libera 8000/8001 o ajusta el script."
  }

  $backendPort = 8001
  $backendAlreadyRunning = $backend8001.IsCurrentProject
  if ($backendAlreadyRunning) {
    Write-Step 'Backend de este proyecto ya está escuchando en el puerto 8001. No se abrirá otra instancia.'
  }
}

if (-not $backendAlreadyRunning) {
  Write-Step 'Levantando backend en una nueva ventana...'
  Start-ServiceWindow `
    -Title 'Portal Notaria - Backend Django' `
    -WorkingDirectory $backendPath `
    -Command ".\venv\Scripts\python.exe manage.py runserver 127.0.0.1:$backendPort"
}

$frontend3000 = Get-PortProcessInfo -Port 3000
if (-not $frontend3000.InUse) {
  $frontendPort = 3000
  $frontendAlreadyRunning = $false
}
elseif ($frontend3000.IsCurrentProject) {
  $frontendPort = 3000
  $frontendAlreadyRunning = $true
  Write-Step 'Frontend de este proyecto ya está escuchando en el puerto 3000. No se abrirá otra instancia.'
}
else {
  Write-Warning "El puerto 3000 está ocupado por otro proceso ajeno a este proyecto (PID $($frontend3000.ProcessId)). Se usará el puerto 3001 para este portal."
  $frontend3001 = Get-PortProcessInfo -Port 3001
  if ($frontend3001.InUse -and -not $frontend3001.IsCurrentProject) {
    throw "El puerto 3001 también está ocupado por otro proceso (PID $($frontend3001.ProcessId)). Libera 3000/3001 o ajusta el script."
  }

  $frontendPort = 3001
  $frontendAlreadyRunning = $frontend3001.IsCurrentProject
  if ($frontendAlreadyRunning) {
    Write-Step 'Frontend de este proyecto ya está escuchando en el puerto 3001. No se abrirá otra instancia.'
  }
}

$frontendBackendOrigin = "http://127.0.0.1:$backendPort"

if (-not $frontendAlreadyRunning) {
  Write-Step 'Levantando frontend en una nueva ventana...'
  Start-ServiceWindow `
    -Title 'Portal Notaria - Frontend React' `
    -WorkingDirectory $frontendPath `
    -Command "`$env:PORT='$frontendPort'; `$env:BROWSER='none'; `$env:PORTAL_BACKEND_ORIGIN='$frontendBackendOrigin'; npm start"
}

if ($AbrirNavegador) {
  Write-Step 'Esperando unos segundos antes de abrir el navegador...'
  Start-Sleep -Seconds 6
  Start-Process "http://localhost:$frontendPort/"
}

Write-Step "Backend esperado en: http://127.0.0.1:$backendPort"
Write-Step "Frontend esperado en: http://localhost:$frontendPort"
Write-Step 'Proceso de arranque automático completado.'

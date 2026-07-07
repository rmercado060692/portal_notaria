param(
  [string]$ServiceName = 'PortalNotariaAPI',
  [string]$RepoRoot = 'C:\inetpub\portal-notaria',
  [string]$EnvFilePath = 'C:\secure\portal-api\.env.production',
  [string]$ListenAddress = '127.0.0.1:8000'
)

$ErrorActionPreference = 'Stop'

function Assert-Path {
  param(
    [string]$Path,
    [string]$Description
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "No se encontró $Description en $Path"
  }
}

$backendRoot = Join-Path $RepoRoot 'backend'
$pythonExe = Join-Path $backendRoot 'venv\Scripts\python.exe'
$runnerScript = Join-Path $backendRoot 'run_waitress.py'

Assert-Path -Path $backendRoot -Description 'la carpeta backend'
Assert-Path -Path $pythonExe -Description 'python del entorno virtual'
Assert-Path -Path $runnerScript -Description 'run_waitress.py'
Assert-Path -Path $EnvFilePath -Description 'el archivo .env.production privado'

$binPath = "`"$pythonExe`" `"$runnerScript`" --listen `"$ListenAddress`" --env-file `"$EnvFilePath`""
$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

if ($existingService) {
  Write-Host "[PORTAL API] Actualizando servicio existente $ServiceName" -ForegroundColor Cyan
  if ($existingService.Status -eq 'Running') {
    Stop-Service -Name $ServiceName -Force
  }
  sc.exe config $ServiceName binPath= $binPath start= auto | Out-Null
} else {
  Write-Host "[PORTAL API] Creando servicio $ServiceName" -ForegroundColor Cyan
  sc.exe create $ServiceName binPath= $binPath start= auto DisplayName= "Portal Notaria API" | Out-Null
}

sc.exe description $ServiceName "Waitress para el Portal del Cliente de la Notaria Mendoza Vazquez" | Out-Null
sc.exe failure $ServiceName reset= 86400 actions= restart/5000/restart/5000/restart/5000 | Out-Null
sc.exe failureflag $ServiceName 1 | Out-Null

Start-Service -Name $ServiceName
Get-Service -Name $ServiceName | Select-Object Name, Status, StartType

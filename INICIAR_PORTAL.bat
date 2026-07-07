@echo off
setlocal
set SCRIPT_DIR=%~dp0
powershell.exe -ExecutionPolicy Bypass -File "%SCRIPT_DIR%iniciar_portal.ps1" -AbrirNavegador
endlocal

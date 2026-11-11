@echo off
REM QRowg - lanceur du depot (voie PowerShell). Double-clique ce fichier.
REM Durci le 2026-10-06 : ne peut plus se refermer sans rien dire.
setlocal
cd /d "%~dp0"
echo.
echo ===== QRowg - depot des lots sociaux =====
echo.
where powershell >nul 2>&1
if errorlevel 1 (
  echo PowerShell est introuvable sur cette machine.
  echo Lance plutot DEPOT-SANS-POWERSHELL.cmd : il n utilise que curl.
  echo.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0DEPOT-MAINTENANT.ps1"
set "RC=%ERRORLEVEL%"
echo.
if not exist "%~dp0depot-log.txt" (
  echo ---------------------------------------------------------------
  echo AUCUN depot-log.txt n a ete ecrit : le script PowerShell n a pas
  echo demarre du tout ^(code %RC%^). C est en general une strategie
  echo d execution verrouillee par la machine.
  echo.
  echo   =^> Lance DEPOT-SANS-POWERSHELL.cmd, qui n utilise que curl.
  echo ---------------------------------------------------------------
) else (
  echo Script PowerShell termine, code %RC%. Journal : depot-log.txt
)
echo.
pause

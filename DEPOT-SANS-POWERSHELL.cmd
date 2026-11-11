@echo off
REM QRowg - depot des lots sociaux SANS PowerShell : curl.exe uniquement.
REM Secours quand DEPOT-MAINTENANT.cmd se referme sans ecrire depot-log.txt.
REM Double-clique ce fichier. Ecrit urls.json + urls.txt dans chaque lot.
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "PROJ=yujvstejimbernkolbdu"
set "BUCKET=page-assets"
set "LOG=%~dp0depot-log.txt"
set "CURL=%SystemRoot%\System32\curl.exe"
set "TMPC=%TEMP%\qrowg_code.txt"

REM ---- Lots a deposer. Ajoute une date entre parentheses pour un lot de plus.
set "LOTS=2026-09-16 2026-09-23 2026-09-28 2026-09-29 2026-10-18 2026-10-30 2026-10-31 2026-11-01 2026-11-02 2026-11-03 2026-11-04"

echo.
echo ===== QRowg - depot sans PowerShell =====
echo.

if not exist "%CURL%" (
  echo BLOCAGE : curl.exe est introuvable dans %SystemRoot%\System32.
  echo Windows 10 1803 ou plus recent le fournit. Previens Claude.
  echo.
  pause
  exit /b 1
)

set "ENVF=apps\web\.env.depot"
if not exist "%ENVF%" set "ENVF=apps\web\.env.local"
if not exist "%ENVF%" (
  echo BLOCAGE : ni apps\web\.env.depot ni apps\web\.env.local.
  echo.
  pause
  exit /b 1
)

set "SUPAURL="
set "SVCKEY="
for /f "eol=# tokens=1,* delims==" %%A in ("%ENVF%") do (
  if /i "%%A"=="NEXT_PUBLIC_SUPABASE_URL" set "SUPAURL=%%B"
  if /i "%%A"=="SUPABASE_SERVICE_ROLE_KEY" set "SVCKEY=%%B"
)
if defined SUPAURL set "SUPAURL=%SUPAURL:"=%"
if defined SVCKEY  set "SVCKEY=%SVCKEY:"=%"

if not defined SUPAURL (
  echo BLOCAGE : NEXT_PUBLIC_SUPABASE_URL absent de %ENVF%.
  echo.
  pause
  exit /b 1
)
if not defined SVCKEY (
  echo BLOCAGE : SUPABASE_SERVICE_ROLE_KEY absent de %ENVF%.
  echo.
  pause
  exit /b 1
)
echo %SUPAURL% | find "%PROJ%" >nul
if errorlevel 1 (
  echo BLOCAGE : la cible n est pas le projet de production.
  echo   attendu : %PROJ%
  echo   lu      : %SUPAURL%
  echo.
  pause
  exit /b 1
)

echo Cles lues dans %ENVF%. Cible : %PROJ%.
echo.
> "%LOG%" echo ===== Depot QRowg sans PowerShell - %DATE% %TIME% =====
>> "%LOG%" echo Cles : %ENVF% ^| Cible : %SUPAURL%

set /a TOTOK=0
set /a TOTKO=0

for %%L in (%LOTS%) do call :DeposeLot "%%L"

echo =========================================
>> "%LOG%" echo TOTAL : !TOTOK! OK, !TOTKO! echecs.
if !TOTOK!==0 (
  echo ECHEC TOTAL : aucun visuel n est monte.
  echo Envoie depot-log.txt a Claude, il contient le code HTTP de chaque fichier.
) else (
  echo Depot termine : !TOTOK! visuel^(s^) en ligne, !TOTKO! echec^(s^).
  echo.
  echo Dis a Claude : "depot fait".
  echo Il lira les urls.json et remplira la file Buffer sans rien reproduire.
)
echo.
pause
exit /b 0

:DeposeLot
set "LOTN=%~1"
set "DIR=social-a-deposer\%LOTN%"
if not exist "%DIR%" (
  echo --- Lot %LOTN% : dossier absent, ignore.
  >> "%LOG%" echo --- Lot %LOTN% : dossier absent.
  goto :eof
)

REM Deja fait ? urls.json contenant une vraie URL = on passe.
if exist "%DIR%\urls.json" (
  find "https://" "%DIR%\urls.json" >nul 2>&1
  if not errorlevel 1 (
    echo --- Lot %LOTN% : urls.json deja rempli, ignore.
    >> "%LOG%" echo --- Lot %LOTN% : deja depose.
    goto :eof
  )
)

set /a NB=0
for %%F in ("%DIR%\*.png") do set /a NB+=1
echo --- Lot %LOTN% ^(!NB! visuels^) -^> social/%LOTN%/
>> "%LOG%" echo --- Lot %LOTN% : !NB! PNG -^> social/%LOTN%

set /a OKLOT=0
set "FIRST=1"
> "%DIR%\urls.part" echo {
type nul > "%DIR%\urls.txt.part"

for %%F in ("%DIR%\*.png") do (
  set "FN=%%~nxF"
  set "PUB=%SUPAURL%/storage/v1/object/public/%BUCKET%/social/%LOTN%/!FN!"
  "%CURL%" -s -o nul -w "%%{http_code}" -X POST -H "Authorization: Bearer %SVCKEY%" -H "apikey: %SVCKEY%" -H "x-upsert: true" -H "cache-control: max-age=31536000" -H "Content-Type: image/png" --data-binary "@%%~fF" "%SUPAURL%/storage/v1/object/%BUCKET%/social/%LOTN%/!FN!" > "%TMPC%" 2>nul
  set "CODE="
  set /p CODE=<"%TMPC%"
  set "GOOD=0"
  if "!CODE!"=="200" set "GOOD=1"
  if "!CODE!"=="201" set "GOOD=1"
  if "!GOOD!"=="1" (
    echo   OK  !FN!
    >> "%LOG%" echo   OK  !FN! ^| HTTP !CODE!
    if "!FIRST!"=="1" (
      >> "%DIR%\urls.part" echo  "!FN!": "!PUB!"
      set "FIRST=0"
    ) else (
      >> "%DIR%\urls.part" echo ,"!FN!": "!PUB!"
    )
    >> "%DIR%\urls.txt.part" echo !FN! = !PUB!
    set /a OKLOT+=1
    set /a TOTOK+=1
  ) else (
    echo   ECHEC !FN!  HTTP !CODE!
    >> "%LOG%" echo   ECHEC !FN! ^| HTTP !CODE!
    set /a TOTKO+=1
  )
)

>> "%DIR%\urls.part" echo }
if !OKLOT! GTR 0 (
  move /y "%DIR%\urls.part" "%DIR%\urls.json" >nul
  move /y "%DIR%\urls.txt.part" "%DIR%\urls.txt" >nul
  echo   Lot %LOTN% : !OKLOT!/!NB! en ligne, urls.json ecrit.
  >> "%LOG%" echo   Lot %LOTN% : !OKLOT!/!NB! OK, urls.json ecrit.
) else (
  del /q "%DIR%\urls.part" 2>nul
  del /q "%DIR%\urls.txt.part" 2>nul
  echo   Lot %LOTN% : 0 upload reussi, urls.json laisse intact.
  >> "%LOG%" echo   Lot %LOTN% : 0 upload reussi.
)
echo.
goto :eof

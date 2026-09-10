@echo off
REM QRowg - Depot des visuels du jour vers Supabase Storage (bucket page-assets).
REM Double-clique ce fichier. Il televerse tous les PNG du dossier et ecrit urls.json.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0QRowg-Depot.ps1"
pause

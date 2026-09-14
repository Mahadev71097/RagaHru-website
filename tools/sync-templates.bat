@echo off
cd /d "%~dp0.."
node tools\sync-templates.js
echo.
pause

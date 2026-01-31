@echo off
echo Starting ClipCompass Frontend...
cd /d "%~dp0frontend"
call npm run dev
pause

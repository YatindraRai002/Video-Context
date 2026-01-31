@echo off
echo Starting ClipCompass Backend...
cd /d "%~dp0backend"
if exist "..\.venv\Scripts\activate.bat" (
    call ..\.venv\Scripts\activate.bat
) else if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) else if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo No virtual environment found. Create one with: python -m venv .venv
    pause
    exit /b 1
)
echo Backend will run at http://localhost:8000
echo API docs at http://localhost:8000/docs
echo.
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause

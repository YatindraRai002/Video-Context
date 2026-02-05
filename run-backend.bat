@echo off
echo ========================================
echo  ClipCompass Backend Startup
echo ========================================
echo.

REM Check if virtual environment exists
if not exist ".venv\Scripts\activate" (
    echo [ERROR] Virtual environment not found!
    echo Please create a virtual environment first:
    echo   python -m venv .venv
    echo   .venv\Scripts\activate
    echo   cd backend
    echo   pip install -r requirements.txt
    pause
    exit /b 1
)

REM Activate virtual environment
echo [1/4] Activating virtual environment...
call .venv\Scripts\activate

REM Check if dependencies are installed
echo [2/4] Checking dependencies...
python -c "import fastapi" 2>nul
if errorlevel 1 (
    echo [WARNING] Backend dependencies not installed!
    echo Installing dependencies...
    cd backend
    pip install -r requirements.txt
    cd ..
)

REM Navigate to backend directory
echo [3/4] Starting backend server...
cd backend

REM Start the server
echo [4/4] Server running at http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

uvicorn app.main:app --host 0.0.0.0 --port 8000

cd ..

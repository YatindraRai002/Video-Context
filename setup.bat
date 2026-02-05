@echo off
echo ========================================
echo  ClipCompass - Project Setup
echo ========================================
echo.

REM Check Python installation
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.10+ from https://www.python.org/
    pause
    exit /b 1
)

REM Check Node.js installation
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Check Docker installation
docker --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Docker is not installed!
    echo Docker is optional but recommended for Qdrant and Redis.
    echo You can install from https://www.docker.com/
    echo.
)

echo [1/5] Creating virtual environment...
if not exist ".venv" (
    python -m venv .venv
    echo Virtual environment created successfully!
) else (
    echo Virtual environment already exists
)

echo.
echo [2/5] Activating virtual environment...
call .venv\Scripts\activate

echo.
echo [3/5] Installing backend dependencies...
cd backend
pip install -r requirements.txt
cd ..

echo.
echo [4/5] Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo [5/5] Creating environment file...
if not exist ".env" (
    copy .env.example .env
    echo .env file created! Please review and update if needed.
) else (
    echo .env file already exists
)

echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Start Docker services (Qdrant, Redis):
echo      docker-compose up -d qdrant redis
echo.
echo   2. Start the backend:
echo      run-backend.bat
echo.
echo   3. In a new terminal, start the frontend:
echo      run-frontend.bat
echo.
echo   4. Open http://localhost:3000 in your browser
echo.
echo For full Docker deployment, run:
echo   docker-compose up -d
echo.
pause

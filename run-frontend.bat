@echo off
echo ========================================
echo  ClipCompass Frontend Startup
echo ========================================
echo.

REM Navigate to frontend directory
cd frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo [1/2] Installing dependencies...
    call npm install
) else (
    echo [1/2] Dependencies already installed
)

REM Start the development server
echo [2/2] Starting frontend development server...
echo Frontend running at http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

call npm run dev

cd ..

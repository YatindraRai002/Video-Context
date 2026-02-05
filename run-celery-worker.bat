@echo off
echo ========================================
echo  ClipCompass Celery Worker
echo ========================================
echo.

REM Check if virtual environment exists
if not exist ".venv\Scripts\activate" (
    echo [ERROR] Virtual environment not found!
    echo Please run setup.bat first
    pause
    exit /b 1
)

REM Activate virtual environment
echo [1/2] Activating virtual environment...
call .venv\Scripts\activate

REM Navigate to backend directory
cd backend

REM Start Celery worker
echo [2/2] Starting Celery worker...
echo Worker is processing video tasks in background
echo.
echo Press Ctrl+C to stop the worker
echo ========================================
echo.

celery -A app.workers.celery_app worker --loglevel=info --concurrency=2 --pool=solo

cd ..

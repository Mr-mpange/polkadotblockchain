@echo off
echo ============================================================
echo   Polkadot Analytics - Starting All Services
echo ============================================================
echo.

REM Check if MySQL is running
echo [1/4] Checking MySQL connection...
node test-db-connection.js
if errorlevel 1 (
    echo.
    echo ERROR: MySQL is not running or not configured properly!
    echo Please start XAMPP MySQL service and try again.
    echo.
    pause
    exit /b 1
)

echo.
echo [2/4] Starting Backend...
start "Backend API" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul

echo [3/4] Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo [4/4] Starting AI Analytics...
start "AI Analytics" cmd /k "cd ai-analytics && python app.py"

echo.
echo ============================================================
echo   All services are starting!
echo ============================================================
echo.
echo   Backend:      http://localhost:3001
echo   Frontend:     http://localhost:3000
echo   AI Analytics: http://localhost:8000
echo.
echo   Press any key to close this window...
echo   (Services will continue running in separate windows)
echo ============================================================
pause >nul

@echo off
echo ==========================================
echo Polkadot Analytics - Environment Setup
echo ==========================================
echo.

REM Function to copy env file
call :setup_env "backend" "Backend"
call :setup_env "frontend" "Frontend"
call :setup_env "ai-analytics" "AI Analytics"

echo.
echo ==========================================
echo Environment files created successfully!
echo ==========================================
echo.
echo Next steps:
echo 1. Edit the .env files with your specific configuration
echo 2. Make sure MongoDB is running (or use Docker Compose)
echo 3. Run 'npm install' in backend and frontend directories
echo 4. Run 'pip install -r requirements.txt' in ai-analytics directory
echo.
echo To start all services with Docker:
echo   docker-compose up -d
echo.
echo To start services individually:
echo   Backend:       cd backend ^&^& npm run dev
echo   Frontend:      cd frontend ^&^& npm run dev
echo   AI Analytics:  cd ai-analytics ^&^& python app.py
echo.
pause
goto :eof

:setup_env
set "dir=%~1"
set "component=%~2"

if not exist "%dir%\.env" (
    echo Setting up %component% environment file...
    copy "%dir%\.env.example" "%dir%\.env" >nul 2>&1
    if exist "%dir%\.env" (
        echo Created %dir%\.env
    ) else (
        echo Failed to create %dir%\.env
    )
) else (
    echo %dir%\.env already exists, skipping...
)
goto :eof

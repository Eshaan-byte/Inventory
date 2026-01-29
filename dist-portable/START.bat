@echo off
echo ============================================
echo   AI Builder Pharma - Inventory Software
echo ============================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    echo This is a one-time process and may take a few minutes.
    echo.
    call npm install --production
    echo.
)

REM Start the backend server
echo Starting AI Builder Pharma...
echo.
echo The application will open in your browser at:
echo http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

node backend/server.js

pause

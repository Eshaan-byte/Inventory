@echo off
echo ============================================
echo   AI Builder Pharma - First Time Setup
echo ============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo Download the LTS version ^(Long Term Support^)
    echo.
    pause
    exit /b 1
)

echo Node.js detected:
node --version
echo.

echo Installing dependencies...
echo This may take a few minutes...
echo.

call npm install --production

if errorlevel 1 (
    echo.
    echo ERROR: Installation failed!
    echo Please check your internet connection and try again.
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Installation Complete!
echo ============================================
echo.
echo To start the application, run: START.bat
echo.

pause

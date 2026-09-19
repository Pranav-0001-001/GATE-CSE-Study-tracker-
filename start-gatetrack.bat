@echo off
title GATETrack Launcher
echo ===================================================
echo             Starting GATETrack...
echo ===================================================

cd /d "%~dp0"

:: Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

:: Check if node_modules exists, install if missing
if not exist "node_modules\" (
    echo [INFO] Installing dependencies, please wait...
    call npm.cmd install
)

:: Ensure database seed has run
if not exist "backend\database\gatetrack.db" (
    echo [INFO] Seeding GATE CSE Syllabus...
    call node backend\database\seed-syllabus.js
)

:: Open browser automatically after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

echo [SUCCESS] Opening GATETrack in your browser at http://localhost:3000
echo (Keep this window open while using the app. Press Ctrl+C to stop)
echo.

node backend\server.js
pause

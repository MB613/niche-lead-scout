@echo off
title NexusRank AI - Remote Public Sharing Launcher
cls
echo ====================================================================
echo   NexusRank AI - Starting Server with Remote Public Sharing...
echo ====================================================================
echo.
cd /d "%~dp0"

echo [1/2] Checking and freeing port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo [2/2] Opening public HTTPS tunnel for remote client access...
echo.
echo ====================================================================
echo Please wait 3-5 seconds while the secure public link generates...
echo ====================================================================
echo.

node server.js --tunnel
pause

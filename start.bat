@echo off
title NexusRank AI - Competitor Intelligence & Outreach Engine
cls
echo ========================================================
echo   NexusRank AI - Competitor Intelligence Engine
echo   Starting Backend & Frontend Server...
echo ========================================================
echo.
cd /d "%~dp0"

echo [1/2] Checking and freeing port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo [2/2] Starting Server on http://localhost:3000 ...
echo.
node server.js
pause

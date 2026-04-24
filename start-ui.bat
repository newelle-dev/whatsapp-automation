@echo off
title WhatsApp Automation UI
color 0B

echo ==============================================
echo 176 AVENUE - WHATSAPP AUTOMATION WEB APP
echo ==============================================
echo.

:: Check if node_modules exists
IF NOT EXIST "node_modules\" (
    echo [INFO] Dependencies missing. Installing...
    call npm install
    echo.
)

IF NOT EXIST "frontend\node_modules\" (
    echo [INFO] Frontend dependencies missing. Installing...
    cd frontend
    call npm install
    call npm run build
    cd ..
    echo.
)

echo [INFO] Starting Local Server...
echo [INFO] Opening UI in your browser...

:: Open localhost:3000 in default browser
start http://localhost:3000

node server.js

pause

@echo off
echo ========================================
echo  Agriculture Equipment Rental System
echo  Backend Server Starter
echo ========================================
echo.

cd /d "E:\agriculture-equipment-rental-system\backend"

echo Current directory: %CD%
echo.

echo Checking if server.js exists...
if exist server.js (
    echo ✅ server.js found!
    echo.
    echo Starting backend server...
    echo.
    echo 🌐 Server will run on: http://localhost:5000
    echo 🔧 API Health check: http://localhost:5000/api/health
    echo 📊 Database: agriculture
    echo.
    echo Press Ctrl+C to stop the server
    echo ========================================
    echo.
    node server.js
) else (
    echo ❌ server.js not found in backend directory!
    echo Please check if you're in the correct folder.
    echo.
    dir
)

echo.
echo Server stopped.
pause
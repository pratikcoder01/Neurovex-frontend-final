@echo off
echo ====================================
echo    NEUROVEX BCI SYSTEM STARTUP
echo ====================================
echo.
echo This will open 3 separate windows:
echo 1. Backend Server (Port 8000)
echo 2. Frontend Server (Port 3000) 
echo 3. Hardware Simulator (Port 8082)
echo.
echo Press Ctrl+C in each window to stop
echo ====================================
echo.

echo Starting Backend Server...
start "Neurovex Backend" cmd /k "cd backend && python main.py"

echo Starting Frontend Server...
start "Neurovex Frontend" cmd /k "python -m http.server 3000"

echo Starting Hardware Simulator...
start "Hardware Simulator" cmd /k "python simple_simulator.py"

echo.
echo ====================================
echo All servers starting in separate windows
echo.
echo Access the dashboard at:
echo http://localhost:3000/dashboard.html
echo.
echo API documentation at:
echo http://localhost:8000/docs
echo ====================================
echo.
pause

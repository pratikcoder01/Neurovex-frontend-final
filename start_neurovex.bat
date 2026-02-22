@echo off
echo ==========================================
echo      STARTING NEUROVEX BCI PLATFORM
echo ==========================================

echo 1. Starting Backend Server...
start "Neurovex Backend" cmd /k "cd backend && pip install -r requirements.txt && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo 2. Starting Frontend Server...
start "Neurovex Frontend" cmd /k "python -m http.server 3000"

echo 3. Launching Dashboard...
timeout /t 5
start http://localhost:3000/index.html

echo.
echo System is running!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
pause

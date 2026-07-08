@echo off
setlocal EnableExtensions
rem Порт 8011: на 8000 и 8010 оставались «зомби»-слушатели Windows после краша uvicorn
set "BACKEND_PORT=8011"
set "FRONTEND_PORT=5173"
set "ROOT=%~dp0"

echo === MeetManager ===
echo.

echo [0/3] Stopping old backend...
for /f "skip=1 tokens=1" %%a in ('wmic process where "commandline like '%%MeetManager%%uvicorn%%'" get ProcessId 2^>nul') do (
  if not "%%a"=="" taskkill /F /PID %%a >nul 2>&1
)
for %%P in (8000 8001 8002 8010 8011) do (
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%P .*LISTENING"') do taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

echo [1/3] Starting backend on port %BACKEND_PORT%...
start "MeetManager Backend" cmd /k "cd /d "%ROOT%backend" && .venv\Scripts\activate && uvicorn app.main:app --host 127.0.0.1 --port %BACKEND_PORT%"

timeout /t 3 /nobreak >nul

echo [2/3] Checking API...
cd /d "%ROOT%backend"
.venv\Scripts\python.exe scripts\check_api.py %BACKEND_PORT%
if errorlevel 1 (
  echo.
  echo ERROR: backend did not start or API is outdated.
  echo Close all MeetManager windows, run stop.bat, then start.bat again.
  echo If port 8000 is stuck, reboot Windows once.
  pause
  exit /b 1
)

echo [3/3] Starting frontend on port %FRONTEND_PORT%...
start "MeetManager Frontend" cmd /k "cd /d "%ROOT%frontend" && npm run dev -- --port %FRONTEND_PORT% --strictPort"

echo.
echo Backend:  http://127.0.0.1:%BACKEND_PORT%
echo Frontend: http://localhost:%FRONTEND_PORT%
echo API docs: http://127.0.0.1:%BACKEND_PORT%/api/docs
echo.
pause

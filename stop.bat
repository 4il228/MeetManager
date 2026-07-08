@echo off
setlocal EnableExtensions

echo Stopping MeetManager backend...

for /f "skip=1 tokens=1" %%a in ('wmic process where "commandline like '%%MeetManager%%uvicorn%%'" get ProcessId 2^>nul') do (
  if not "%%a"=="" (
    echo   kill PID %%a
    taskkill /F /PID %%a >nul 2>&1
  )
)

for %%P in (8000 8001 8002 8010 8011) do (
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%P .*LISTENING"') do (
    echo   kill port %%P PID %%a
    taskkill /F /PID %%a >nul 2>&1
  )
)

echo Done.

@echo off
setlocal

set "STATE_DIR=%TEMP%\clothify-runtime"
set "PID_FILE=%STATE_DIR%\clothify-pids.txt"

if not exist "%PID_FILE%" (
  echo Clothify is not running.
  exit /b 0
)

for /f "usebackq tokens=1,2 delims=:" %%A in ("%PID_FILE%") do (
  taskkill /PID %%B /T /F >nul 2>nul
)

del /q "%PID_FILE%" >nul 2>nul
echo Clothify has been stopped.
exit /b 0

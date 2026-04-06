@echo off
setlocal

set "ROOT=%~dp0"
set "ARCHIVE=%ROOT%legacy\backend-nodejs-archive"
set "RESTORE=%ROOT%backend"

if not exist "%ARCHIVE%\index.js" (
  echo Legacy backend archive not found at %ARCHIVE%.
  exit /b 1
)

if exist "%RESTORE%\index.js" (
  echo A backend folder already exists at %RESTORE%.
  echo If you want the Node backend there, move or rename the current folder first.
  exit /b 1
)

robocopy "%ARCHIVE%" "%RESTORE%" /E >nul
set "ROBOCOPY_EXIT=%ERRORLEVEL%"
if %ROBOCOPY_EXIT% GEQ 8 (
  echo Failed to restore the legacy backend from archive.
  exit /b 1
)

echo Legacy Node.js backend restored to %RESTORE%.
echo You can run it again with: npm start --prefix backend
echo Note: the archived Node backend keeps its original PostgreSQL config.
echo If your local PostgreSQL password is currently 123123, review backend\index.js before starting it.
exit /b 0

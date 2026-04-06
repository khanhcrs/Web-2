@echo off
setlocal

set "ROOT=%~dp0"
set "STATE_DIR=%TEMP%\clothify-runtime"
set "PID_FILE=%STATE_DIR%\clothify-pids.txt"
set "LOG_DIR=%STATE_DIR%\logs"

where php >nul 2>nul
if errorlevel 1 (
  echo PHP was not found in PATH.
  exit /b 1
)

if not exist "%ROOT%backend-php\public\index.php" (
  echo Missing backend-php runtime files.
  exit /b 1
)

if not exist "%ROOT%frontend\build\index.html" (
  echo Missing frontend build at frontend\build.
  echo Build it once before daily runtime if the bundle was removed.
  exit /b 1
)

if not exist "%ROOT%admin\dist\index.html" (
  echo Missing admin build at admin\dist.
  echo Build it once before daily runtime if the bundle was removed.
  exit /b 1
)

call "%ROOT%stop-clothify.bat" >nul 2>nul

if not exist "%STATE_DIR%" mkdir "%STATE_DIR%"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

set "CLOTHIFY_ROOT=%ROOT%"
set "CLOTHIFY_STATE_DIR=%STATE_DIR%"
set "CLOTHIFY_PID_FILE=%PID_FILE%"
set "CLOTHIFY_LOG_DIR=%LOG_DIR%"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$root = [IO.Path]::GetFullPath($env:CLOTHIFY_ROOT);" ^
  "$pidFile = [IO.Path]::GetFullPath($env:CLOTHIFY_PID_FILE);" ^
  "$logDir = [IO.Path]::GetFullPath($env:CLOTHIFY_LOG_DIR);" ^
  "New-Item -ItemType Directory -Force -Path $logDir | Out-Null;" ^
  "$services = @(" ^
    "@{ Name = 'backend'; Args = @('-S', '127.0.0.1:8000', '-t', (Join-Path $root 'backend-php\public'), (Join-Path $root 'backend-php\router.php')) }," ^
    "@{ Name = 'frontend'; Args = @('-S', '127.0.0.1:3000', (Join-Path $root 'scripts\php-runtime\frontend-router.php')) }," ^
    "@{ Name = 'admin'; Args = @('-S', '127.0.0.1:5173', (Join-Path $root 'scripts\php-runtime\admin-router.php')) }" ^
  ");" ^
  "$records = New-Object System.Collections.Generic.List[string];" ^
  "foreach ($service in $services) {" ^
    "$stdout = Join-Path $logDir ($service.Name + '.log');" ^
    "$stderr = Join-Path $logDir ($service.Name + '.err.log');" ^
    "$process = Start-Process -FilePath 'php' -ArgumentList $service.Args -WorkingDirectory $root -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru;" ^
    "$records.Add($service.Name + ':' + $process.Id);" ^
  "};" ^
  "Set-Content -Path $pidFile -Value $records"

if errorlevel 1 (
  echo Failed to start one or more Clothify services.
  exit /b 1
)

echo Clothify is starting...
echo Frontend: http://127.0.0.1:3000
echo Admin:    http://127.0.0.1:5173
echo Backend:  http://127.0.0.1:8000
echo Logs:     %LOG_DIR%
exit /b 0

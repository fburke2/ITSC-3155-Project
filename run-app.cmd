@echo off
setlocal

set "APP_DIR=%~dp0app"
set "NODE_PACKAGES=%LOCALAPPDATA%\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe"
set "NODE_DIR="

if not exist "%APP_DIR%\package.json" (
    echo Could not find app\package.json. Run this file from the project checkout.
    exit /b 1
)

for /d %%D in ("%NODE_PACKAGES%\node-v*-win-x64") do if exist "%%~fD\node.exe" set "NODE_DIR=%%~fD"
if defined NODE_DIR set "PATH=%NODE_DIR%;%PATH%"

where node.exe >nul 2>nul
if errorlevel 1 (
    echo Node.js was not found. Install Node.js LTS and run this command again.
    exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
    echo npm.cmd was not found. Reinstall Node.js LTS and run this command again.
    exit /b 1
)

if not exist "%APP_DIR%\node_modules\.bin\vite.cmd" (
    echo Installing app dependencies...
    pushd "%APP_DIR%"
    call npm.cmd ci
    if errorlevel 1 (
        popd
        exit /b 1
    )
    popd
)

pushd "%APP_DIR%"
call npm.cmd run dev -- --host 127.0.0.1
set "APP_EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %APP_EXIT_CODE%
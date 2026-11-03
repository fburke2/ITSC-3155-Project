@echo off
setlocal

rem Automatically find and run the project's run-app.cmd launcher.
set "PROJECT_LAUNCHER=%~dp0run-app.cmd"
if not exist "%PROJECT_LAUNCHER%" set "PROJECT_LAUNCHER=%~dp0ITSC-3155-Project\run-app.cmd"
if not exist "%PROJECT_LAUNCHER%" set "PROJECT_LAUNCHER=%~dp0..\ITSC-3155-Project\run-app.cmd"

if not exist "%PROJECT_LAUNCHER%" (
    echo Could not find run-app.cmd beside this file or in ITSC-3155-Project.
    exit /b 1
)

call "%PROJECT_LAUNCHER%"
exit /b %ERRORLEVEL%
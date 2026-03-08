@echo off
setlocal enabledelayedexpansion

set BASE_URL=%1
if "%BASE_URL%"=="" set BASE_URL=http://localhost:3000

echo Running quickstart against %BASE_URL%

powershell -ExecutionPolicy Bypass -File "%~dp0quickstart.ps1" -BaseUrl "%BASE_URL%"

endlocal

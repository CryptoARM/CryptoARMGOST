@echo off

if not exist "%UserProfile%\AppData\Local\Trusted\CryptoARM ViPNet" mkdir "%UserProfile%\AppData\Local\Trusted\CryptoARM ViPNet"


setlocal

@echo Installing "CryptoARM Local CA" certificate
certutil -addstore -Enterprise root "%~dp0\root.pem"

REM ####Current user
setlocal ENABLEDELAYEDEXPANSION
set certpath=%~dp0root.pem
set certName=CryptoARM Local CA

FOR /D %%P IN ("%appdata%\Mozilla\Firefox\Profiles\*") DO (
"%~dp0certutil\win32\certutil.exe" -D -n "!certName!" -d sql:"%%P"
"%~dp0certutil\win32\certutil.exe" -D -n "!certName!" -d dbm:"%%P"

"%~dp0certutil\win32\certutil.exe" -A -n "!certName!" -i "%certpath%" -t "C,c,c", -d sql:"%%P"
"%~dp0certutil\win32\certutil.exe" -A -n "!certName!" -i "%certpath%" -t "C,c,c", -d dbm:"%%P"
)
setlocal DISABLEDELAYEDEXPANSION


REM #### eof
exit /B 0

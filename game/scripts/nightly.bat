@echo off
rem PoliSim-DBE Nightly Simulation Lab — Windows scheduler script.
rem Schedule with Task Scheduler (taskschd.msc): daily, e.g. 3:00 AM, action = this .bat
setlocal
cd /d "%~dp0\.."          rem game\
if not exist reports mkdir reports
node run_nightly.js 10
echo Nightly report: reports\%date:~10,4%-%date:~4,2%-%date:~7,2%\report.html
endlocal

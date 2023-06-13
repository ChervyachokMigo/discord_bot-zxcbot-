:loop
@echo off
cd /D "F:\node_js_stuff\node_projects\!discord_bot"
title "Discord Bot"
:Restart
node.exe --inspect --trace-warnings main.js 
goto loop
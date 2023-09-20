:loop
@echo off
:Restart
start "Discord bot" /D "F:\node_js_stuff\node_projects\!discord_bot" /MIN /WAIT /B npm run start 
goto loop
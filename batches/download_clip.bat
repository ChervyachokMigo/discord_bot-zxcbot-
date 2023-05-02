cpch 1251
echo youtube-dl.exe -ciw %~1 -o %2 -f mp4
yt-dlp.exe -ci %~1 -o %2 -R "infinite" -f mp4
#!/bin/sh
# encode_videos.sh: makes the small web copies of every RELIANCE spot for the site.
# 720x1280, H.264 + AAC, capped bitrate so each file stays under ~25 MB, plus a poster frame.
#   sh tools/encode_videos.sh            (run from reliance-site/)
SRC="../reliance-reel/output"
OUT="media/video"; POS="media/posters"
# name | source file | poster time (s)
LIST="ident|ident/ISEA_reel_9x16.mp4|9.7
recruit|recruit/ISEA_recruit_9x16.mp4|19.2
ship|ship/ISEA_HELIOS_9x16.mp4|28.8
talos|talos/ISEA_TALOS_EXE_9x16.mp4|24.0
grayfile|grayfile/ISEA_GRAY_PersonnelFile_9x16.mp4|23.6
graynews|graynews/ISEA_GRAY_Newswire_9x16.mp4|12.5
cubemeal|cubemeal/ISEA_CUBEMEAL_9x16.mp4|39.5
dimming|dimming/ISEA_THE_DIMMING_9x16.mp4|27.4
cybercuff|cybercuff/KOTOSHIMA_CYBERCUFF_9x16.mp4|43.0
midnight|midnight/MIDNIGHT_HOUR_TALOS_9x16.mp4|15.0
cockpit|cockpit/ISEA_HELIOS_Cockpit_9x16.mp4|14.0"
echo "$LIST" | while IFS='|' read -r name file pt; do
  [ -f "$OUT/$name.mp4" ] || ffmpeg -nostdin -loglevel error -y -i "$SRC/$file" \
    -vf "scale=720:1280:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -crf 25 \
    -maxrate 1900k -bufsize 3800k -profile:v high -c:a aac -b:a 128k -ac 2 -movflags +faststart "$OUT/$name.mp4"
  ffmpeg -nostdin -loglevel error -y -ss "$pt" -i "$SRC/$file" -frames:v 1 -vf "scale=540:960:flags=lanczos" -q:v 4 "$POS/$name.jpg"
  echo "$name done: $(du -h "$OUT/$name.mp4" | cut -f1)"
done

#!/usr/bin/env bash
# Scarica i servizi video su 22simba (Dailymotion: askanews, Teletutto) e li ingrandisce a 1920x1080.
set -e
mkdir -p tmp/dm public/simba/vid
dl() { yt-dlp -q -f "b" -o "tmp/dm/$1.mp4" "https://www.dailymotion.com/video/$1"; }
dl xa9c6zw   # askanews – live al Fabrique, annuncio di "Miria"
dl xakxutm   # Teletutto – 22simba apre il Brescia Summer Music Festival
dl xbb1mhu   # askanews – intervista su "Miria"
up() { ffmpeg -y -loglevel error -i tmp/dm/$1.mp4 -an -vf "hqdn3d=1.5:1.5:4:4,scale=1920:1080:flags=lanczos,unsharp=5:5:0.9:5:5:0.0,eq=contrast=1.06:saturation=0.95" -c:v libx264 -crf 16 -pix_fmt yuv420p -r 30 public/simba/vid/$2.mp4; }
up xa9c6zw fabrique; up xakxutm brescia; up xbb1mhu intervista

#!/usr/bin/env bash
# Chiude un video MOTB quando arriva la voce di ElevenLabs:
# accelera leggermente la voce (come chiesto dall'utente), la allinea al testo con Whisper,
# renderizza e comprime in video/ (~25 MB, scaricabile da GitHub).
#
# uso: scripts/motb_finalizza.sh <IdComposizione> <testo.txt> <tempi.json> <voce-originale.mp3> <voce-in-public.mp3> <video/uscita.mp4> [velocità=1.12]
# es.: scripts/motb_finalizza.sh Schedine scripts/riepilogo_ig_voce.txt src/motb/riepilogo_ig.json ~/ig.mp3 public/motb/riepilogo/voce-ig.mp3 video/riepilogo-instagram.mp4
set -euo pipefail
ID=$1; TXT=$2; JSON=$3; SRC=$4; DEST=$5; OUT=$6; SPEED=${7:-1.12}
TMP=$(mktemp -d)
mkdir -p "$(dirname "$DEST")" "$(dirname "$OUT")"
ffmpeg -y -loglevel error -i "$SRC" -af "atempo=$SPEED" -c:a libmp3lame -b:a 192k "$DEST"
HF_HUB_DISABLE_XET=1 python3 scripts/motb_align.py "$TXT" "$JSON" "$DEST"
npx remotion render "$ID" "$TMP/full.mp4" --log=error
(cd "$TMP" && ffmpeg -y -loglevel error -i full.mp4 -c:v libx264 -preset slow -b:v 4500k -maxrate 6000k -bufsize 9000k -pass 1 -an -f mp4 /dev/null \
  && ffmpeg -y -loglevel error -i full.mp4 -c:v libx264 -preset slow -b:v 4500k -maxrate 6000k -bufsize 9000k -profile:v high -pix_fmt yuv420p -pass 2 -c:a aac -b:a 192k -movflags +faststart out.mp4)
mv "$TMP/out.mp4" "$OUT"
rm -rf "$TMP"
echo "fatto: $OUT ($(du -h "$OUT" | cut -f1))"

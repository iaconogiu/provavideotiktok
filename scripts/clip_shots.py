"""Divide le clip di un edit in inquadrature (dagli stacchi di scdet) e misura la luminosità al centro
di ognuna, per scartare quelle quasi nere, i titoli e i titoli di coda.
Uso: python3 scripts/clip_shots.py <cartella clip> <cartella .cuts> <uscita.json> nome:inizio:fine ..."""
import json, subprocess, sys

DIR, CUTS, OUT = sys.argv[1:4]
CLIPS = {n: (float(a), float(b)) for n, a, b in (x.split(':') for x in sys.argv[4:])}

def brightness(src, t):
    # solo il centro: alcune clip sono 4:3 con le bande nere ai lati
    out = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t), '-i', f'{DIR}/{src}.mp4', '-frames:v', '1',
                          '-vf', 'crop=iw*0.6:ih*0.8,scale=64:36,format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
    return sum(out) / max(1, len(out))

res = {}
for src, (a, b) in CLIPS.items():
    cuts = [float(x) for x in open(f'{CUTS}/{src}.cuts').read().split()]
    pts = [a] + [c for c in cuts if a < c < b] + [b]
    shots = []
    for s, e in zip(pts, pts[1:]):
        if e - s < 0.7:
            continue
        br = brightness(src, (s + e) / 2)
        if br < 22:
            continue
        shots.append([round(s, 2), round(e, 2), round(br)])
    res[src] = shots
    print(src, len(shots))
json.dump(res, open(OUT, 'w'), indent=0)

"""Divide le clip di Tipo Tossico in inquadrature (dagli stacchi di scdet) e misura la luminosità
di ognuna, per scartare quelle quasi nere, i titoli e i titoli di coda.
Uso: python3 scripts/tossico_shots.py <cartella con i .cuts>  → src/tossico/shots.json"""
import json, subprocess, sys

CUTS = sys.argv[1]
CLIPS = {
    # nome: (inizio utile, fine utile) in secondi: fuori restano titoli e titoli di coda
    'tossico': (0.5, 155),
    'roccia': (1, 192),
    'arricchiti': (17, 140),
    'ventianni': (3, 168),
}

def brightness(src, t):
    out = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t), '-i', f'public/tossico/clip/{src}.mp4', '-frames:v', '1',
                          '-vf', 'scale=64:36,format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
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
json.dump(res, open('src/tossico/shots.json', 'w'), indent=0)

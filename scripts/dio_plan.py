"""Piano di montaggio di "Piano di Dio": per ogni inquadratura sceglie un punto della clip
che resti dentro una sola ripresa (dagli stacchi di scdet) per tutta la durata."""
import json, subprocess, sys
CLIP = sys.argv[1] if len(sys.argv) > 1 else 'public/dio/clip'
D = 0.13
P = [  # inizio, clip, secondo indicativo, movimento, velocità, transizione d'entrata
 (0.00, 'lacura', 51.13, 'push', 1, 'cut'),
 (1.41, 'oldfashionverona', 24.6, 'orbit', 1, 'zoom'),
 (2.50, 'nulladibello', 143.47, 'panR', 1, 'whip'),
 (3.07, 'lacura', 87.63, 'push', 1, 'flash'),
 (4.16, 'demoni', 130.13, 'orbit', 1, 'whip'),
 (4.74, 'oldfashionverona', 148.87, 'pull', 1, 'flash'),
 (5.31, 'nulladibello', 137.77, 'push', 1, 'cut'),
 (5.86, 'demoni', 104.63, 'orbit', 1, 'zoom'),
 (6.94, 'lacura', 66.37, 'rise', 1, 'flash'),
 (8.06, 'demoni', 73.97, 'panL', 1, 'whip'),
 (8.58, 'nulladibello', 130.8, 'push', 1, 'cut'),
 (9.18, 'oldfashionverona', 108.57, 'pull', 0.5, 'flash'),
 (10.21, 'demoni', 119.53, 'push', 0.6, 'burn'),
 (10.75, 'lacura', 304.67, 'orbit', 0.8, 'zoom'),
 (12.00, 'nulladibello', 81.0, 'panR', 1, 'whip'),
 (12.80, 'demoni', 149.87, 'push', 1, 'zoom'),
 (13.66, 'lacura', 220.13, 'pull', 1, 'flash'),
 (14.46, 'nulladibello', 37.2, 'panL', 1, 'whip'),
 (15.58, 'lacura', 91.63, 'push', 1, 'burn'),
 (16.46, 'nulladibello', 122.53, 'rise', 1, 'whip'),
 (17.25, 'lacura', 62.37, 'push', 1, 'zoom'),
 (18.12, 'lacura', 306.67, 'pull', 0.7, 'flash'),
]
END = 19.0
def dur(n): return float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f'{CLIP}/{n}.mp4'],capture_output=True,text=True).stdout)
shots = []
for i, (at, src, x, mv, rate, tin) in enumerate(P):
    end = P[i + 1][0] if i + 1 < len(P) else END
    need = (end - at + 2 * D) * rate + 0.2
    cuts = [0] + [float(c) for c in open(f'public/dio/cuts/{src}.cuts').read().split()] + [dur(src)]
    segs = [(a, b) for a, b in zip(cuts, cuts[1:]) if b - a >= need]
    # la ripresa più vicina al secondo indicativo, e dentro di lei il punto più vicino
    a, b = min(segs, key=lambda s: 0 if s[0] <= x <= s[1] - need else min(abs(s[0] - x), abs(s[1] - need - x)))
    t0 = min(max(x, a + 0.1 + D * rate), b - need + D * rate)
    shots.append({'at': at, 'src': src, 't0': round(t0, 2), 'move': mv, 'rate': rate, 'tin': tin, **({'crop': 1.0} if False else {})})
    print(at, src, x, '->', round(t0, 2), f'[{a:.1f},{b:.1f}]')
# ogni inquadratura diventa un pezzetto di clip (così il progetto resta leggero)
import os
os.makedirs('public/dio/seg', exist_ok=True)
for i, sh in enumerate(shots):
    end = shots[i + 1]['at'] if i + 1 < len(shots) else END
    a = max(0, sh['t0'] - D * sh['rate'] - 0.3)
    length = (end - sh['at'] + 2 * D) * sh['rate'] + 0.8
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(a), '-i', f"{CLIP}/{sh['src']}.mp4", '-t', str(length), '-an', '-vf', 'scale=1920:1080', '-c:v', 'libx264', '-crf', '17', '-preset', 'fast', '-g', '10', f'public/dio/seg/{i}.mp4'], check=True)
    sh['seg'] = i
    sh['t0'] = round(sh['t0'] - a, 3)
json.dump({'shots': shots}, open('src/dio/plan.json', 'w'), indent=0)

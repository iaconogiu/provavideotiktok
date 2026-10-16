"""Allinea il testo della voce (scripts/testo.txt) all'audio usando le pause rilevate da ffmpeg.
Programmazione dinamica: ogni tratto parlato riceve un gruppo contiguo di parole, privilegiando
i confini sulla punteggiatura e la coerenza con la velocità media di eloquio.
Uscita: src/transcript.json nel formato Caption di @remotion/captions."""
import json, re, subprocess, sys

AUDIO = 'voce.mp3'
text = open('scripts/testo.txt', encoding='utf-8').read()
words = text.split()

def syl(w):
    w = w.lower()
    w = re.sub(r"[^a-zàèéìòù0-9']", '', w)
    if w == "'90": return 4  # "novanta"
    n = len(re.findall(r'[aeiouàèéìòù]+', w))
    return max(1, n)

S = [syl(w) for w in words]
punct = [2.0 if re.search(r'[.?!…:]$', w) else (1.0 if w.endswith(',') else 0.0) for w in words]

def speech_segments(noise, dmin):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', AUDIO, '-af', f'silencedetect=noise={noise}dB:d={dmin}', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', out)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', out)]
    dur = float(re.search(r'Duration: (\d+):(\d+):([\d.]+)', out).groups()[2]) + 60 * int(re.search(r'Duration: (\d+):(\d+)', out).group(2))
    segs, cur = [], 0.05
    for s, e in zip(starts, ends):
        if s - cur > 0.05: segs.append((cur, s))
        cur = e
    if dur - cur > 0.1: segs.append((cur, dur))
    return segs

segs = speech_segments(-35, 0.15)
total_syl = sum(S)
total_speech = sum(b - a for a, b in segs)
rate = total_speech / total_syl  # secondi per sillaba
N, M = len(words), len(segs)
INF = 1e18
# dp[j][i] = costo minimo assegnando le prime i parole ai primi j segmenti
dp = [[INF] * (N + 1) for _ in range(M + 1)]
bk = [[0] * (N + 1) for _ in range(M + 1)]
dp[0][0] = 0
pre = [0]
for s in S: pre.append(pre[-1] + s)
for j in range(1, M + 1):
    d = segs[j - 1][1] - segs[j - 1][0]
    for i in range(1, N + 1):
        best, arg = INF, 0
        for k in range(max(0, i - 25), i):
            if dp[j - 1][k] >= INF: continue
            exp = (pre[i] - pre[k]) * rate
            c = ((d - exp) / max(0.25, d)) ** 2 * 4
            c += 0 if j == M and i == N else (3.0 - punct[i - 1] * 1.5)  # confine non su punteggiatura = penalità
            v = dp[j - 1][k] + c
            if v < best: best, arg = v, k
        dp[j][i], bk[j][i] = best, arg
# ricostruzione
groups, i = [], N
for j in range(M, 0, -1):
    k = bk[j][i]; groups.append((k, i)); i = k
groups.reverse()
caps = []
for (k, i), (a, b) in zip(groups, segs):
    ws = list(range(k, i))
    w8 = [S[x] + 0.6 for x in ws]
    tot = sum(w8); t = a
    for x, w in zip(ws, w8):
        d = (b - a) * w / tot
        caps.append({'text': (' ' if caps else '') + words[x], 'startMs': round(t * 1000), 'endMs': round((t + d) * 1000),
                     'timestampMs': round((t + d / 2) * 1000), 'confidence': None})
        t += d
    print(f'{a:6.2f}-{b:6.2f}  ' + ' '.join(words[x] for x in ws))
json.dump(caps, open('src/transcript.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

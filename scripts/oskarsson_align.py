"""Tempi della voce per il video "Pronostico Óskarsson".

Legge il testo da scripts/oskarsson_voce.txt (una riga per battuta: "#id testo").
- Se esiste public/pronostico/voce.mp3 allinea il testo all'audio con le pause rilevate da ffmpeg
  (come scripts/align.py: ogni tratto parlato riceve un gruppo contiguo di parole, con i confini
  preferibilmente sulla punteggiatura e sui cambi di battuta).
- Altrimenti stima i tempi dalla lunghezza delle parole (per montare il video prima della voce).
Uscita: src/pronostico/voce.json → {audio, offset, duration, words: [{text, start, end, cue}]}
I tempi sono già spostati di `offset` (la voce parte mezzo secondo dopo l'inizio del video).

uso: python3 scripts/oskarsson_align.py [audio]
"""
import json, os, re, subprocess, sys, unicodedata

AUDIO = sys.argv[1] if len(sys.argv) > 1 else 'public/pronostico/voce.mp3'
OUT = 'src/pronostico/voce.json'
OFFSET = 0.5

words, cues = [], []
for line in open('scripts/oskarsson_voce.txt', encoding='utf-8'):
    line = line.strip()
    if not line.startswith('#'):
        continue
    cid, text = line[1:].split(' ', 1)
    for w in text.split():
        words.append(w)
        cues.append(cid)

def syl(w):
    w = unicodedata.normalize('NFD', w.lower())
    w = re.sub(r'[̀-ͯ]', '', w)
    return max(1, len(re.findall(r'[aeiouy]+', w)))

S = [syl(w) for w in words]
N = len(words)
# forza del confine dopo ogni parola: fine battuta > punto > virgola
punct = []
for i, w in enumerate(words):
    p = 2.0 if re.search(r'[.?!…:]$', w) else (1.0 if w.endswith(',') else 0.0)
    if i + 1 < N and cues[i + 1] != cues[i]:
        p = max(p, 2.5)
    punct.append(p)


def audio_duration(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], capture_output=True, text=True).stdout
    return float(out.strip())


def speech_segments(path, noise=-35, dmin=0.15):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', f'silencedetect=noise={noise}dB:d={dmin}', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r'silence_start: (-?[\d.]+)', out)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', out)]
    dur = audio_duration(path)
    segs, cur = [], 0.0
    for s, e in zip(starts, ends):
        s = max(0.0, s)
        if s - cur > 0.05:
            segs.append((cur, s))
        cur = e
    if dur - cur > 0.1:
        segs.append((cur, dur))
    return segs, dur


def from_audio(path):
    segs, dur = speech_segments(path)
    rate = sum(b - a for a, b in segs) / sum(S)
    M = len(segs)
    INF = 1e18
    dp = [[INF] * (N + 1) for _ in range(M + 1)]
    bk = [[0] * (N + 1) for _ in range(M + 1)]
    dp[0][0] = 0
    pre = [0]
    for s in S:
        pre.append(pre[-1] + s)
    for j in range(1, M + 1):
        d = segs[j - 1][1] - segs[j - 1][0]
        for i in range(1, N + 1):
            best, arg = INF, 0
            for k in range(max(0, i - 30), i):
                if dp[j - 1][k] >= INF:
                    continue
                exp = (pre[i] - pre[k]) * rate
                c = ((d - exp) / max(0.25, d)) ** 2 * 4
                c += 0 if (j == M and i == N) else (3.0 - punct[i - 1] * 1.2)
                v = dp[j - 1][k] + c
                if v < best:
                    best, arg = v, k
            dp[j][i], bk[j][i] = best, arg
    groups, i = [], N
    for j in range(M, 0, -1):
        k = bk[j][i]
        groups.append((k, i))
        i = k
    groups.reverse()
    out = []
    for (k, i), (a, b) in zip(groups, segs):
        ws = list(range(k, i))
        w8 = [S[x] + 0.6 for x in ws]
        tot = sum(w8)
        t = a
        for x, w in zip(ws, w8):
            d = (b - a) * w / tot
            out.append((x, t, t + d))
            t += d
        print(f'{a + OFFSET:6.2f}-{b + OFFSET:6.2f}  ' + ' '.join(words[x] for x in ws))
    return out, dur


def estimate():
    out, t = [], 0.1
    for i, w in enumerate(words):
        d = S[i] * 0.165 + 0.05
        out.append((i, t, t + d))
        t += d + (0.42 if punct[i] >= 2 else 0.25 if punct[i] >= 1 else 0.0)
        if i + 1 < N and cues[i + 1] != cues[i]:
            t += 0.15
    return out, t + 0.2


has_audio = os.path.exists(AUDIO)
timed, dur = from_audio(AUDIO) if has_audio else estimate()
res = {
    'audio': has_audio,
    'offset': OFFSET,
    'duration': round(dur + OFFSET, 3),
    'words': [{'text': words[x], 'start': round(a + OFFSET, 3), 'end': round(b + OFFSET, 3), 'cue': cues[x]} for x, a, b in timed],
}
json.dump(res, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(('audio' if has_audio else 'stima'), f'durata {res["duration"]:.2f}s, {N} parole →', OUT)

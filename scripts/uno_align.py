"""Allinea il testo corretto di "Uno" ai tempi parola-per-parola di Whisper (tmp/uno_words.json).
Le parole riconosciute prendono il tempo di Whisper; le altre vengono interpolate in base alle
sillabe tra le vicine. Gli ad-lib tra parentesi vengono messi nella pausa a fine verso.
Uscita: src/uno/words.json + beat del brano."""
import json, re, difflib
import numpy as np, librosa

LYRICS = open('scripts/uno_testo.txt', encoding='utf-8').read().strip().split('\n')
W = json.load(open('tmp/uno_words.json'))

norm = lambda s: re.sub(r"[^a-zàèéìòù0-9]", '', s.lower().replace('е', 'e'))
def syl(w):
    return max(1, len(re.findall(r'[aeiouàèéìòù]+', norm(w))))

words = []  # (testo, riga, adlib)
for li, line in enumerate(LYRICS):
    adlibs = re.findall(r'\(([^)]*)\)', line)
    main = re.sub(r'\([^)]*\)', '', line)
    for w in main.split():
        words.append({'text': w, 'line': li, 'adlib': False})
    for a in adlibs:
        words.append({'text': a, 'line': li, 'adlib': True})

main_idx = [i for i, w in enumerate(words) if not w['adlib']]
A = [norm(words[i]['text']) for i in main_idx]
B = [norm(w['w']) for w in W]
sm = difflib.SequenceMatcher(a=A, b=B, autojunk=False)
times = [None] * len(main_idx)
for blk in sm.get_matching_blocks():
    for k in range(blk.size):
        times[blk.a + k] = (W[blk.b + k]['s'], W[blk.b + k]['e'])
# parole simili ma non identiche (es. "Sanremo"/"Sarremo"): stessa posizione relativa nei blocchi non allineati
for tag, a0, a1, b0, b1 in sm.get_opcodes():
    if tag == 'replace' and (a1 - a0) == (b1 - b0):
        for k in range(a1 - a0):
            times[a0 + k] = (W[b0 + k]['s'], W[b0 + k]['e'])
# interpolazione per sillabe
n = len(times)
i = 0
while i < n:
    if times[i] is None:
        j = i
        while j < n and times[j] is None: j += 1
        t0 = times[i - 1][1] if i > 0 else 0.0
        t1 = times[j][0] if j < n else 41.4
        syls = [syl(words[main_idx[k]]['text']) for k in range(i, j)]
        tot = sum(syls); acc = 0
        for k, s in zip(range(i, j), syls):
            a = t0 + (t1 - t0) * acc / tot; acc += s
            times[k] = (round(a, 2), round(t0 + (t1 - t0) * acc / tot, 2))
        i = j
    else:
        i += 1
for k, (s, e) in zip(main_idx, times):
    words[k]['start'], words[k]['end'] = s, e
# ad-lib: subito dopo l'ultima parola del verso
for li in range(len(LYRICS)):
    lw = [w for w in words if w['line'] == li and not w['adlib']]
    end = max(w['end'] for w in lw)
    nxt = [w['start'] for w in words if w['line'] == li + 1 and not w['adlib']]
    gap_end = nxt[0] if nxt else end + 0.6
    ads = [w for w in words if w['line'] == li and w['adlib']]
    for a in ads:
        a['start'] = round(end, 2)
        a['end'] = round(max(end + 0.3, gap_end), 2)

y, sr = librosa.load('tmp/uno16.wav', sr=16000)
# Whisper attacca la prima parola di ogni segmento alla fine del precedente:
# la sposto sul primo attacco reale (onset) prima della parola successiva
ons = librosa.onset.onset_detect(y=y, sr=sr, hop_length=160, units='time', backtrack=False)
mains = [w for w in words if not w['adlib']]
for k in range(1, len(mains)):
    w, prev = mains[k], mains[k - 1]
    if w['line'] != prev['line'] and abs(w['start'] - prev['end']) < 0.02 and k + 1 < len(mains):
        lim = mains[k + 1]['start'] - 0.1
        cand = [o for o in ons if w['start'] + 0.05 <= o <= lim]
        if cand:
            print('sposto', w['text'], w['start'], '->', round(cand[0], 2))
            w['start'] = round(float(cand[0]), 2)
            prev['end'] = min(prev['end'], w['start'])
tempo, bf = librosa.beat.beat_track(y=y, sr=sr, hop_length=256)
beats = [round(float(t), 3) for t in librosa.frames_to_time(bf, sr=sr, hop_length=256)]
onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=256)
json.dump({'tempo': float(np.atleast_1d(tempo)[0]), 'beats': beats, 'words': words, 'duration': round(len(y) / sr, 2)},
          open('src/uno/words.json', 'w'), ensure_ascii=False, indent=1)
print('tempo', tempo, 'beats', len(beats))
for w in words: print(f"{w['start']:6.2f} {'*' if w['adlib'] else ' '} {w['text']}")

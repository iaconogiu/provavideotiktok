"""Tempi delle parole per un video MOTB.

uso: python3 scripts/motb_align.py scripts/<nome>_voce.txt src/<cartella>/voce.json [audio.mp3]

Il testo ha una riga per battuta: "#id testo".
- Senza audio stima i tempi al ritmo dei video MOTB (~6 sillabe/s, pause brevi solo tra le frasi).
- Con l'audio usa Whisper (faster-whisper, modello "medium") e assegna a ogni parola del testo il
  tempo della parola trascritta corrispondente (allineamento per somiglianza).
Uscita: {audio, duration, words: [{text, start, end, cue}]}; la voce parte a 0 s come nei video MOTB.
"""
import difflib, json, os, re, subprocess, sys, unicodedata

src, out = sys.argv[1], sys.argv[2]
audio = sys.argv[3] if len(sys.argv) > 3 else None

words, cues = [], []
for line in open(src, encoding='utf-8'):
    line = line.strip()
    if line.startswith('#'):
        cid, text = line[1:].split(' ', 1)
        for w in text.split():
            words.append(w)
            cues.append(cid)

def norm(w):
    w = unicodedata.normalize('NFD', w.lower())
    return re.sub(r'[^a-z0-9]', '', re.sub(r'[̀-ͯ]', '', w))

def syl(w):
    return max(1, len(re.findall(r'[aeiouy]+', norm(w))))

def estimate():
    res, t = [], 0.0
    for i, w in enumerate(words):
        d = syl(w) * 0.142 + 0.03
        res.append((t, t + d))
        t += d
        if re.search(r'[.?!…]$', w):
            t += 0.3
        elif re.search(r'[,:]$', w):
            t += 0.14
    return res, t + 1.3

def whisper(path):
    import numpy as np
    from faster_whisper import WhisperModel
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout
    a = np.frombuffer(raw, dtype=np.float32).copy()
    m = WhisperModel('medium', device='cpu', compute_type='int8')
    segs, _ = m.transcribe(a, language='it', word_timestamps=True, initial_prompt=' '.join(words))
    tw = [(x.word.strip(), x.start, x.end) for s in segs for x in s.words]
    sm = difflib.SequenceMatcher(a=[norm(w) for w in words], b=[norm(x[0]) for x in tw], autojunk=False)
    res = [None] * len(words)
    for i, j, n in sm.get_matching_blocks():
        for k in range(n):
            res[i + k] = (tw[j + k][1], tw[j + k][2])
    # parole non trovate: interpolate tra le vicine
    for i in range(len(res)):
        if res[i] is None:
            prev = next((res[k][1] for k in range(i - 1, -1, -1) if res[k]), 0.0)
            nxt = next((res[k][0] for k in range(i + 1, len(res)) if res[k]), prev + 0.3)
            res[i] = (prev, max(prev + 0.05, nxt))
    dur = len(a) / 16000
    return res, dur

timed, dur = whisper(audio) if audio and os.path.exists(audio) else estimate()
json.dump({'audio': bool(audio), 'duration': round(dur, 3),
           'words': [{'text': w, 'start': round(a, 3), 'end': round(b, 3), 'cue': c} for w, (a, b), c in zip(words, timed, cues)]},
          open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(('whisper' if audio else 'stima'), f'{dur:.2f}s', len(words), 'parole →', out)

"""Timing parola per parola del ritornello di "Freedom" (22simba).
Le regioni delle frasi sono state individuate sulla traccia vocale isolata (UVR-MDX-NET):
contorno melodico + onset. Dentro ogni frase le parole sono agganciate agli onset vocali."""
import json, re
import numpy as np, librosa

y, sr = librosa.load('tmp/simba_vocals.wav', sr=16000)
env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=160)
ons = librosa.onset.onset_detect(onset_envelope=env, sr=sr, hop_length=160, units='time', delta=0.08, wait=6)

LINES = [
    ('intro',   0.02, 0.62, "Ah-ah"),
    ('chiami',  2.04, 4.86, "Se chiami, guarda i fusi orari, ma io ci sarò"),
    ('fallire', 6.48, 9.30, "E potrò fallire un domani, però lo farò"),
    ('freedom', 9.90, 14.85, "Freedom, freedom, freedom, freedom, freedom"),
    ('sole',   15.65, 18.15, "Voglio il sole ricopra di raggi uno del Polo Nord"),
    ('chiami2',19.88, 22.66, "Se chiami, guarda i fusi orari, ma io ci sarò"),
]
FREEDOM_STARTS = [9.95, 11.0, 12.1, 12.78, 14.2]

def syl(w):
    w = re.sub(r"[^a-zàèéìòù]", '', w.lower())
    return max(1, len(re.findall(r'[aeiouàèéìòù]+', w)))

out = []
for key, a, b, text in LINES:
    words = text.split()
    if key == 'freedom':
        starts = FREEDOM_STARTS
    else:
        S = [syl(w) for w in words]
        tot = sum(S)
        starts, acc = [], 0
        local = [o for o in ons if a - 0.05 <= o <= b]
        for s in S:
            est = a + (b - a) * acc / tot
            near = min(local, key=lambda o: abs(o - est)) if local else est
            t = near if abs(near - est) < 0.12 else est
            if starts and t < starts[-1] + 0.1:
                t = max(est, starts[-1] + 0.12)
            starts.append(t)
            acc += s
    for i, w in enumerate(words):
        s = starts[i]
        e = starts[i + 1] if i + 1 < len(words) else b
        out.append({'line': key, 'text': w, 'startMs': round(s * 1000), 'endMs': round(e * 1000)})
json.dump(out, open('src/simba/lyrics.json', 'w'), ensure_ascii=False, indent=1)
for o in out: print(o['line'], o['startMs'], o['text'])

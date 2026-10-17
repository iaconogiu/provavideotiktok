"""Analisi audio per il video 22simba: BPM, beat, onset e profilo energetico (voce vs musica)."""
import json, sys
import numpy as np, librosa

y, sr = librosa.load('tmp/simba.wav', sr=22050, mono=True)
dur = len(y) / sr
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time')
onset_env = librosa.onset.onset_strength(y=y, sr=sr)
onsets = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, units='time')
# energia per bande ogni 50ms
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=1102))
freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
def band(lo, hi): return S[(freqs >= lo) & (freqs < hi)].mean(axis=0)
bass, voc, hi = band(30, 150), band(300, 3400), band(5000, 11000)
rms = librosa.feature.rms(y=y, hop_length=1102)[0]
t = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=1102)
norm = lambda a: (a / (a.max() + 1e-9)).round(3).tolist()
json.dump({'duration': dur, 'tempo': float(np.atleast_1d(tempo)[0]), 'beats': [round(b, 3) for b in beats], 'onsets': [round(o, 3) for o in onsets],
           'env': {'t': t.round(3).tolist(), 'rms': norm(rms), 'bass': norm(bass[:len(t)]), 'voc': norm(voc[:len(t)]), 'hi': norm(hi[:len(t)])}},
          open('src/simba/analysis.json', 'w'))
print('dur', round(dur, 2), 'tempo', tempo)
print('beats', [round(b, 2) for b in beats])
# profilo RMS grezzo ogni 0.25s
step = 5
print(' '.join(f'{t[i]:.2f}:{rms[i]/rms.max():.2f}' for i in range(0, len(t), step)))

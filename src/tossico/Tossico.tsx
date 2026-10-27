import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, random, staticFile, useCurrentFrame} from 'remotion';
import {FPS} from '../angolo/kit';
import {Lyrics, RingTunnel, type Kind, type Token} from '../angolo/style';
import shots from './shots.json';
import data from './words.json';

/**
 * "Tipo Tossico": edit sui videoclip di 22simba (Tipo Tossico, Roccia, Arricchiti, 20 Anni)
 * nello stile del video da 110k: immagini scure virate al rosso, testo bianco graffiato al
 * centro, tunnel di scritte negli stacchi forti. Stacchi a tempo sul beat.
 */

type Word = {text: string; line: number; adlib: boolean; start: number; end: number};
type Src = 'tossico' | 'roccia' | 'arricchiti' | 'ventianni';
const WORDS = (data.words as Word[]).filter((w) => !w.adlib);
const BEATS = data.beats as number[];
const SHOTS = shots as Record<Src, [number, number, number][]>;
export const DURATION = data.duration;
export const TOSSICO_FRAMES = Math.round(DURATION * FPS);

// ── testo: una o due parole alla volta (le parole corte si attaccano alla successiva) ──
const KINDS: Kind[] = ['solid', 'solid', 'ghost', 'solid', 'outline', 'solid'];
const TOKENS: Token[] = (() => {
  const out: Token[] = [];
  let pend: Word[] = [];
  WORDS.forEach((w, i) => {
    pend.push(w);
    const next = WORDS[i + 1];
    const txt = pend.map((p) => p.text).join(' ');
    const short = w.text.replace(/[^\p{L}]/gu, '').length <= 3;
    // si va avanti solo con parole corte (o una sola parola cortissima), così i pezzi seguono le frasi
    if (next && next.line === w.line && pend.length < 3 && (short || (pend.length === 1 && txt.length < 5)) && !w.text.endsWith(',')) return;
    const k = out.length;
    out.push([txt.replace(/,$/, '').toUpperCase(), pend[0].start, KINDS[k % KINDS.length]]);
    pend = [];
  });
  return out;
})();

// ── montaggio: per ogni parte del testo, da quale video pescare ──
type Section = {from: number; pool: {src: Src; min?: number; max?: number}[]; every?: number};
const SECTIONS: Section[] = [
  {from: 0, pool: [{src: 'roccia', max: 100}]}, // il milione, la Porsche: macchine e villa
  {from: 6.9, pool: [{src: 'ventianni'}]}, // "ora che ti ho persa": la coppia
  {from: 10.3, pool: [{src: 'ventianni'}, {src: 'arricchiti', min: 90}]}, // la stella e il buio
  {from: 13.34, pool: [{src: 'tossico'}]}, // "soffro come i tossici": spruzzi e onde
  {from: 16.54, pool: [{src: 'roccia', min: 100}]}, // "sta piazza è il mio salotto": la folla
  {from: 19.48, pool: [{src: 'roccia', max: 100}]}, // "se vuoi problemi"
  {from: 22.66, pool: [{src: 'tossico', min: 60}]}, // "risposto il doppio": salti
  {from: 25.8, pool: [{src: 'arricchiti'}]}, // "sembro un finto stronzo"
  {from: 32.94, pool: [{src: 'roccia', min: 100}]}, // "non tutti c'hanno chi lo odia"
  {from: 35.36, pool: [{src: 'arricchiti', min: 100}, {src: 'roccia', max: 100}]}, // gli euro
  {from: 42.54, pool: [{src: 'tossico', max: 70}], every: 4}, // "resta molto più sereno": il mare
  {from: 46.46, pool: [{src: 'arricchiti', min: 110}, {src: 'tossico'}], every: 4}, // "è tutto dentro di me"
];
// il tunnel di scritte sulle due "odia"
const TUNNELS: [number, number][] = [
  [32.16, 32.94],
  [34.56, 35.36],
];

type Slot = {at: number; end: number; src: Src; t0: number};
const SLOTS: Slot[] = (() => {
  const out: Slot[] = [];
  const used: Record<string, number> = {};
  SECTIONS.forEach((sec, si) => {
    const end = si + 1 < SECTIONS.length ? SECTIONS[si + 1].from : DURATION;
    const step = sec.every ?? 2;
    const cuts = [sec.from, ...BEATS.filter((b, i) => b > sec.from + 0.25 && b < end - 0.25 && i % step === 0)];
    cuts.forEach((c, k) => {
      const p = sec.pool[k % sec.pool.length];
      const list = SHOTS[p.src].filter(([s]) => s >= (p.min ?? 0) && s <= (p.max ?? 1e9));
      const key = `${p.src}${p.min ?? 0}`;
      const n = used[key] ?? Math.floor(random(`st${key}`) * list.length);
      used[key] = n + 1;
      const [s] = list[n % list.length];
      out.push({at: c, end: cuts[k + 1] ?? end, src: p.src, t0: s + 0.15});
    });
  });
  return out;
})();

const beatPulse = (t: number) => {
  let last = -10;
  for (const b of BEATS) {
    if (b <= t + 0.01) last = b;
    else break;
  }
  return Math.exp(-(t - last) * 9);
};

/** un'inquadratura: virata scura, spinta in avanti lenta, scatto sul beat */
const Shot: React.FC<{slot: Slot; i: number}> = ({slot, i}) => {
  const f = useCurrentFrame();
  const t = slot.at + f / FPS;
  const len = (slot.end - slot.at) * FPS;
  const push = 1.06 + (f / Math.max(1, len)) * 0.06 + beatPulse(t) * 0.035;
  // "20 Anni" ha i sottotitoli impressi in basso: ingrandisco tenendo l'alto
  const crop = slot.src === 'ventianni' ? 1.22 : 1;
  const whip = i % 4 === 0 && f < 3 ? (3 - f) * 10 : 0;
  const dx = (random(`dx${i}`) - 0.5) * 40;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          transform: `translateX(${whip * 6 + (f / Math.max(1, len)) * dx}px) scale(${push * crop})`,
          transformOrigin: crop > 1 ? '50% 20%' : '50% 50%',
          filter: `contrast(1.28) saturate(0.8) brightness(0.68)${whip ? ` blur(${whip / 3}px)` : ''}`,
        }}
      >
        <OffthreadVideo src={staticFile(`tossico/clip/${slot.src}.mp4`)} trimBefore={Math.round(slot.t0 * FPS)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Tossico: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const firstOfSection = SECTIONS.map((s) => Math.round(s.from * FPS));
  const since = Math.min(...firstOfSection.map((c) => (frame >= c ? frame - c : 999)));
  const flash = since < 5 && frame > 2 ? (5 - since) * 0.1 : 0;
  const end = Math.min(1, Math.max(0, (t - (DURATION - 0.6)) / 0.6));
  const f2 = Math.floor(frame / 2);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SLOTS.map((s, i) => {
        const from = Math.round(s.at * FPS);
        const to = Math.round(s.end * FPS);
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)}>
            <Shot slot={s} i={i} />
          </Sequence>
        );
      })}
      {/* virata alla One of One: rosso nelle ombre, vignetta forte */}
      <AbsoluteFill style={{background: '#7A0B0B', mixBlendMode: 'multiply', opacity: 0.32}} />
      <AbsoluteFill style={{background: 'radial-gradient(75% 70% at 50% 50%, transparent 35%, rgba(0,0,0,0.82) 100%)'}} />
      {TUNNELS.map(([a, b], i) => (
        <Sequence key={`t${i}`} from={Math.round(a * FPS)} durationInFrames={Math.round((b - a) * FPS)}>
          <RingTunnel word="ODIA" />
        </Sequence>
      ))}
      <Lyrics tokens={TOKENS} />
      {/* grana */}
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('simba/grain.png')})`,
          backgroundPosition: `${Math.floor(random(`g${f2}`) * 512)}px ${Math.floor(random(`h${f2}`) * 512)}px`,
          mixBlendMode: 'overlay',
          opacity: 0.16,
        }}
      />
      <AbsoluteFill style={{background: '#FFF', opacity: flash, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{background: '#000', opacity: end}} />
      <Audio src={staticFile('tossico/audio.m4a')} />
    </AbsoluteFill>
  );
};

import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, continueRender, delayRender, random, staticFile, useCurrentFrame} from 'remotion';
import data from './words.json';
import plan from './plan.json';

/**
 * "Piano di Dio": montaggio da editor su live e videoclip di 22simba.
 * - camera morbida su ogni inquadratura (spinta, ritorno, panoramica, orbita) con curve di velocità
 * - ralenti e accelerazioni (velocità diverse per inquadratura)
 * - transizioni sul beat: zoom attraverso l'immagine, panoramica a frusta con sfocatura direzionale,
 *   bruciatura di pellicola, lampo d'esposizione
 * - colore unico da film, bande cinema che respirano, grana
 * - testo: parole che salgono da dietro una linea (maschera), "Dio" grande in corsivo che si allarga
 */

export const FPS = 30;
export const DURATION = data.duration;
export const DIO_FRAMES = Math.round(DURATION * FPS);
const W = 1920;
const H = 1080;
type Word = {text: string; line: number; start: number; end: number};
const WORDS = data.words as Word[];
const BEATS = data.beats as number[];

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const prog = (g: number, a: number, b: number) => clamp((g - a) / (b - a));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2); // cubica in-out
const easeOut = (t: number) => 1 - (1 - t) ** 4;
const easeIn = (t: number) => t ** 3;
const beatPulse = (t: number) => {
  let last = -10;
  for (const b of BEATS) {
    if (b <= t + 0.01) last = b;
    else break;
  }
  return Math.exp(-(t - last) * 8);
};

const SANS = '"DOswald", "Oswald", sans-serif';
const SERIF = '"DPlay", "Playfair Display", serif';
const useFonts = () => {
  const [handle] = useState(() => delayRender('font Dio'));
  useEffect(() => {
    Promise.all([
      new FontFace('DOswald', `url(${staticFile('freedom/font/Oswald.ttf')})`).load(),
      new FontFace('DPlay', `url(${staticFile('roccia/font/PlayfairItalic.ttf')})`).load(),
    ])
      .then((fs) => fs.forEach((f) => document.fonts.add(f)))
      .finally(() => continueRender(handle));
  }, [handle]);
};

// ── piano di montaggio ──
type Move = 'push' | 'pull' | 'panL' | 'panR' | 'orbit' | 'rise';
type Trans = 'cut' | 'zoom' | 'whip' | 'burn' | 'flash';
type Shot = {at: number; src: string; seg: number; t0: number; move: Move; rate?: number; tin?: Trans; crop?: number};
const SHOTS = plan.shots as Shot[];
const ends = SHOTS.map((s, i) => (i + 1 < SHOTS.length ? SHOTS[i + 1].at : DURATION));
const D = 0.13; // durata di metà transizione (s)

/** curva di camera di un'inquadratura, p = 0..1 nel tempo dell'inquadratura */
const camera = (m: Move, p: number, seed: number) => {
  const e = ease(p);
  const side = seed > 0.5 ? 1 : -1;
  switch (m) {
    case 'push':
      return {s: 1.06 + 0.12 * e, x: side * 20 * e, y: 0, r: 0};
    case 'pull':
      return {s: 1.2 - 0.12 * e, x: 0, y: -10 * e, r: 0};
    case 'panL':
      return {s: 1.16, x: 70 - 140 * e, y: 0, r: 0};
    case 'panR':
      return {s: 1.16, x: -70 + 140 * e, y: 0, r: 0};
    case 'orbit':
      return {s: 1.12 + 0.06 * e, x: side * (40 - 80 * e), y: 0, r: side * (1.2 - 2.4 * e)};
    case 'rise':
      return {s: 1.14 + 0.04 * e, x: 0, y: 50 - 100 * e, r: 0};
  }
};

/** sfocatura direzionale (frusta) */
const DirBlur: React.FC<{id: string; x: number}> = ({id, x}) => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <filter id={id} x="-20%" y="0" width="140%" height="100%">
      <feGaussianBlur stdDeviation={`${x} 0`} />
    </filter>
  </svg>
);

const ShotView: React.FC<{i: number}> = ({i}) => {
  const f = useCurrentFrame();
  const sh = SHOTS[i];
  const a = sh.at;
  const b = ends[i];
  const g = a - D + f / FPS; // la Sequence parte D secondi prima
  const p = prog(g, a, b);
  const cam = camera(sh.move, p, random(`cam${i}`));
  const tin: Trans = sh.tin ?? 'cut';
  const tout: Trans = SHOTS[i + 1]?.tin ?? 'cut';

  let s = cam.s * (sh.crop ?? 1) * (1 + beatPulse(g) * 0.025);
  let x = cam.x;
  let blur = 0;
  let dir = 0;
  let op = 1;
  // entrata
  if (g < a) {
    if (tin !== 'burn') return null;
    op = ease(prog(g, a - D, a + D));
  } else if (g < a + D) {
    const k = 1 - easeOut(prog(g, a, a + D));
    if (tin === 'zoom') {
      s *= 1 + 0.45 * k;
      blur = 14 * k;
    }
    if (tin === 'whip') {
      x += 1100 * k;
      dir = 70 * k;
    }
    if (tin === 'burn') op = ease(prog(g, a - D, a + D));
  }
  // uscita
  if (g >= b) {
    if (tout !== 'burn') return null;
  } else if (g > b - D) {
    const k = easeIn(prog(g, b - D, b));
    if (tout === 'zoom') {
      s *= 1 + 0.7 * k;
      blur = Math.max(blur, 16 * k);
    }
    if (tout === 'whip') {
      x -= 1100 * k;
      dir = Math.max(dir, 70 * k);
    }
  }
  const id = `db${i}`;
  return (
    <AbsoluteFill style={{opacity: op}}>
      {dir > 0.5 && <DirBlur id={id} x={dir} />}
      <AbsoluteFill
        style={{
          transform: `translate(${x}px, ${cam.y}px) scale(${s}) rotate(${cam.r}deg)`,
          filter: [dir > 0.5 ? `url(#${id})` : '', blur > 0.3 ? `blur(${blur}px)` : ''].join(' ') || undefined,
        }}
      >
        <OffthreadVideo
          src={staticFile(`dio/seg/${sh.seg}.mp4`)}
          trimBefore={Math.max(0, Math.round((sh.t0 - D * (sh.rate ?? 1)) * FPS))}
          playbackRate={sh.rate ?? 1}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** bruciatura di pellicola: macchie calde che attraversano l'inquadratura */
const Burn: React.FC<{g: number; at: number}> = ({g, at}) => {
  const k = 1 - Math.abs(g - at) / (D * 1.6);
  if (k <= 0) return null;
  const q = ease(clamp(k));
  const sx = (g - at) * 900;
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', opacity: q}}>
      <AbsoluteFill style={{background: `radial-gradient(45% 70% at ${30 + sx / 30}% 40%, rgba(255,140,40,0.95) 0%, rgba(255,60,10,0.5) 40%, transparent 75%)`}} />
      <AbsoluteFill style={{background: `radial-gradient(30% 50% at ${75 - sx / 40}% 65%, rgba(255,220,150,0.9) 0%, transparent 70%)`}} />
    </AbsoluteFill>
  );
};

// ── testo ──
type Line = {words: Word[]; start: number; end: number; dio: boolean};
const LINES: Line[] = (() => {
  const out: Line[] = [];
  WORDS.forEach((w) => {
    let l = out[w.line];
    if (!l) l = out[w.line] = {words: [], start: w.start, end: 0, dio: false};
    l.words.push(w);
  });
  out.forEach((l, i) => {
    const last = l.words[l.words.length - 1];
    l.dio = /^dio$/i.test(last.text);
    l.end = Math.min(i + 1 < out.length ? out[i + 1].start - 0.18 : DURATION, last.start + 1.6);
  });
  return out;
})();

/** divide la riga in due righe bilanciate quando è lunga */
const rows = (ws: Word[]): Word[][] => {
  const len = (a: Word[]) => a.reduce((n, w) => n + w.text.length + 1, 0);
  if (len(ws) <= 16) return [ws];
  let best = 1;
  for (let k = 1; k < ws.length; k++) if (Math.abs(len(ws.slice(0, k)) - len(ws.slice(k))) < Math.abs(len(ws.slice(0, best)) - len(ws.slice(best)))) best = k;
  return [ws.slice(0, best), ws.slice(best)];
};

// parole che diventano corsivo: il "senso" della frase
const KEY = new Set(['scelta', 'fermarmi', 'giudicherò', 'lavoro', 'nulla', 'abbiamo', 'neanche']);
const isKey = (w: Word) => KEY.has(w.text.toLowerCase());

let ctx: CanvasRenderingContext2D | null = null;
const wordW = (w: Word, size: number) => {
  ctx ??= document.createElement('canvas').getContext('2d');
  if (!ctx) return w.text.length * size * 0.5;
  ctx.font = isKey(w) ? `600 ${size * 1.05}px ${SERIF}` : `600 ${size}px ${SANS}`;
  return ctx.measureText(isKey(w) ? w.text : w.text.toUpperCase()).width + size * 0.25;
};
/** grandezza che fa stare ogni riga dentro la larghezza */
const fitRows = (rs: Word[][], size: number, maxW: number) => Math.min(size, ...rs.map((r) => (size * maxW) / r.reduce((a, w) => a + wordW(w, size), 0)));

/** una parola: scatta dentro grande e si assesta subito (reattiva), poi resta */
const Pop: React.FC<{w: Word; g: number; size: number; cur: boolean}> = ({w, g, size, cur}) => {
  const t = g - w.start;
  if (t < -0.001) return <span style={{display: 'inline-block', opacity: 0, fontSize: size, marginRight: size * 0.25}}>{w.text}</span>;
  const k = Math.exp(-t * 17);
  const key = isKey(w);
  return (
    <span
      style={{
        display: 'inline-block',
        marginRight: size * 0.25,
        transform: `translateY(${k * size * 0.25}px) scale(${1 + 0.32 * k})`,
        transformOrigin: "50% 80%",
        filter: t < 0.07 ? `blur(${(1 - t / 0.07) * 6}px)` : undefined,
        opacity: Math.min(1, t / 0.035),
        fontFamily: key ? SERIF : SANS,
        fontWeight: 600,
        fontSize: key ? size * 1.05 : size,
        textTransform: key ? 'none' : 'uppercase',
        letterSpacing: key ? '0' : '0.02em',
        color: key ? '#FFD9A6' : cur ? '#FFFFFF' : 'rgba(255,255,255,0.72)',
        lineHeight: 1,
      }}
    >
      {w.text}
    </span>
  );
};

const LyricLine: React.FC<{l: Line; g: number; idx: number}> = ({l, g, idx}) => {
  if (g < l.start - 0.05 || g > l.end + 0.2) return null;
  const out = easeIn(prog(g, l.end, l.end + 0.16));
  const words = l.dio ? l.words.slice(0, -1) : l.words;
  const dio = l.dio ? l.words[l.words.length - 1] : null;
  const rs = rows(words);
  const size = fitRows(rs, 150, 1500);
  // quando arriva "Dio" la frase si ritira in alto e si rimpicciolisce
  const up = dio ? easeOut(prog(g, dio.start - 0.02, dio.start + 0.22)) : 0;
  const bp = beatPulse(g);
  const rgb = bp * 5;
  const cur = (w: Word) => {
    const i = l.words.indexOf(w);
    return g >= w.start && (i + 1 >= l.words.length || g < l.words[i + 1].start);
  };
  const totalH = rs.length * size * 1.05;
  return (
    <AbsoluteFill style={{opacity: 1 - out, filter: out > 0 ? `blur(${out * 14}px)` : undefined, transform: `scale(${1 + out * 0.15})`}}>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div
          style={{
            transform: `translateY(${-up * (230 + totalH * 0.2)}px) scale(${(1 - up * 0.5) * (1 + bp * 0.035)})`,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            textShadow: `${-rgb}px 0 0 rgba(255,40,60,0.6), ${rgb}px 0 0 rgba(40,220,255,0.6), 0 6px 34px rgba(0,0,0,0.75)`,
          }}
        >
          {rs.map((r, ri) => (
            <div key={ri} style={{lineHeight: 1.05}}>
              {r.map((w, i) => (
                <Pop key={i} w={w} g={g} size={size} cur={cur(w)} />
              ))}
            </div>
          ))}
        </div>
      </AbsoluteFill>
      {dio && <BigDio w={dio} g={g} />}
      {idx < 0 && null}
    </AbsoluteFill>
  );
};

/** "Dio": sbatte dentro enorme, si assesta e continua a crescere piano */
const BigDio: React.FC<{w: Word; g: number}> = ({w, g}) => {
  const t = g - w.start;
  if (t < 0) return null;
  const k = Math.exp(-t * 14);
  const rgb = 14 * Math.exp(-t * 9) + beatPulse(g) * 4;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 430,
          lineHeight: 1,
          color: '#FFF6EA',
          letterSpacing: `${0.01 + t * 0.04}em`,
          transform: `translateY(60px) scale(${(1 + 0.7 * k) * (1 + t * 0.04)})`,
          filter: t < 0.08 ? `blur(${(1 - t / 0.08) * 14}px)` : undefined,
          opacity: Math.min(1, t / 0.04),
          textShadow: `${-rgb}px 0 0 rgba(255,40,60,0.55), ${rgb}px 0 0 rgba(40,220,255,0.55), 0 0 50px rgba(255,210,160,0.35), 0 12px 60px rgba(0,0,0,0.6)`,
          whiteSpace: 'nowrap',
        }}
      >
        Dio
      </div>
    </AbsoluteFill>
  );
};

export const Dio: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const g = frame / FPS;
  // bande cinema: aperte all'inizio, si chiudono un po' su "Dio", si riaprono alla fine
  const dioNear = LINES.reduce((a, l) => (l.dio ? Math.max(a, 1 - Math.abs(g - (l.words[l.words.length - 1].start + 0.6)) / 1.2) : a), 0);
  const bar = 70 + 70 * ease(clamp(dioNear)) - 70 * easeOut(prog(g, DURATION - 1.2, DURATION));
  const flashes = SHOTS.filter((s) => s.tin === 'flash').map((s) => Math.exp(-Math.abs(g - s.at) * 14) * (g < s.at ? 0.4 : 1));
  const flash = Math.max(0, ...flashes) * 0.8;
  const fadeIn = 1 - easeOut(prog(g, 0, 0.6));
  const fadeOut = prog(g, DURATION - 0.5, DURATION);
  const f2 = Math.floor(frame / 2);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {/* immagini con colore da film */}
      <AbsoluteFill style={{filter: 'contrast(1.12) saturate(0.82) brightness(0.92)'}}>
        {SHOTS.map((s, i) => {
          const from = Math.round((s.at - D) * FPS);
          const to = Math.round((ends[i] + D) * FPS);
          return (
            <Sequence key={i} from={from} durationInFrames={to - from}>
              <ShotView i={i} />
            </Sequence>
          );
        })}
      </AbsoluteFill>
      {/* virata: ombre fredde, luci calde */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(20,60,80,0.35) 0%, rgba(0,0,0,0) 50%, rgba(255,150,70,0.18) 100%)', mixBlendMode: 'soft-light'}} />
      <AbsoluteFill style={{background: 'radial-gradient(80% 75% at 50% 50%, transparent 50%, rgba(0,0,0,0.55) 100%)'}} />
      {SHOTS.filter((s) => s.tin === 'burn').map((s, k) => (
        <Burn key={k} g={g} at={s.at} />
      ))}
      {LINES.map((l, i) => (
        <LyricLine key={i} l={l} g={g} idx={i} />
      ))}
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('simba/grain.png')})`,
          backgroundPosition: `${Math.floor(random(`g${f2}`) * 512)}px ${Math.floor(random(`h${f2}`) * 512)}px`,
          mixBlendMode: 'overlay',
          opacity: 0.14,
        }}
      />
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: bar, background: '#000'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: bar, background: '#000'}} />
      {flash > 0.01 && <AbsoluteFill style={{background: '#FFF3E4', opacity: flash}} />}
      <AbsoluteFill style={{background: '#000', opacity: Math.max(fadeIn, fadeOut)}} />
      <Audio src={staticFile('dio/audio.m4a')} />
    </AbsoluteFill>
  );
};

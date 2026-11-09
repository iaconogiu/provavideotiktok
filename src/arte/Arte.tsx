import '@fontsource/anton';
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, random, staticFile, useCurrentFrame} from 'remotion';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import data from './words.json';

/**
 * "Se regnasse l'arte": video verticale di sola tipografia (stile poster cinetico).
 * Le parole si impilano a tempo in blocchi: le parole forti in Anton che scattano dentro, quelle
 * di passaggio in corsivo; la parola appena detta è chiara, le altre si spengono in grigio.
 * Le parole chiave sono rosse e cerchiate a mano; la frase si scorre verso l'alto mentre cresce.
 * Due momenti su carta chiara ("ma son solo un artista…", "tu lo noti…") con l'onda dell'audio vera.
 */

export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const DURATION = data.duration;
export const ARTE_FRAMES = Math.round(DURATION * FPS);
type Word = {text: string; line: number; start: number};
const WORDS = data.words as Word[];
const BEATS = data.beats as number[];
const AUDIO = staticFile('arte/audio.m4a');
const WAVE = staticFile('arte/wave.wav'); // l'onda si legge da un wav (l'aac non si decodifica nel render)

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const prog = (g: number, a: number, b: number) => clamp((g - a) / (b - a));
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeIn = (t: number) => t ** 3;
const beatPulse = (t: number, k = 10) => {
  let last = -10;
  for (const b of BEATS) {
    if (b <= t + 0.01) last = b;
    else break;
  }
  return Math.exp(-(t - last) * k);
};

const BIG = '"Anton", "Impact", sans-serif';
const ITAL = '"AItal", "Playfair Display", serif';
const useFonts = () => {
  const [handle] = useState(() => delayRender('font Arte'));
  useEffect(() => {
    Promise.all([new FontFace('AItal', `url(${staticFile('roccia/font/PlayfairItalic.ttf')})`).load(), document.fonts.load(`100px Anton`)])
      .then(([f]) => document.fonts.add(f))
      .finally(() => continueRender(handle));
  }, [handle]);
};

// ── che cosa è una parola ──
const norm = (s: string) => s.toLowerCase().replace(/[^a-zàèéìòù']/g, '');
const SMALL = new Set(
  "come il lo la l' le i un una se da di in ci ti mi che con per ma o e non tu cui sarà son lì nelle forse certo sarei solo bene tutti".split(' '),
);
const ACCENT = new Set(["l'arte", 'disparte', 'vero', "l'odio", 'fredde', 'assente', 'gente', 'dispersi']);
const isSmall = (w: Word) => SMALL.has(norm(w.text));
const isAccent = (w: Word) => ACCENT.has(norm(w.text));

// ── blocchi: frasi che si impilano insieme, poi si cambia pagina ──
type Block = {lines: number[]; light?: boolean};
const BLOCKS: Block[] = [
  {lines: [0, 1]},
  {lines: [2, 3, 4]},
  {lines: [5, 6]},
  {lines: [7]},
  {lines: [8]},
  {lines: [9], light: true},
  {lines: [10, 11]},
  {lines: [12, 13, 14]},
  {lines: [15], light: true},
];
const blockWords = (b: Block) => WORDS.filter((w) => b.lines.includes(w.line));
const blockStart = (i: number) => blockWords(BLOCKS[i])[0].start;
const blockEnd = (i: number) => (i + 1 < BLOCKS.length ? blockStart(i + 1) - 0.03 : DURATION + 1);

// ── impaginazione misurata ──
let ctx: CanvasRenderingContext2D | null = null;
const measure = (text: string, font: string) => {
  ctx ??= document.createElement('canvas').getContext('2d');
  if (!ctx) return text.length * 50;
  ctx.font = font;
  return ctx.measureText(text).width;
};
const MAXW = 900;
const LEFT = 90;
type Row = {kind: 'big' | 'small'; words: Word[]; size: number; y: number; h: number; widths: number[]};
const layout = (ws: Word[]): Row[] => {
  const rows: Row[] = [];
  let pend: Word[] = [];
  const flush = () => {
    if (!pend.length) return;
    let size = 70;
    const wid = () => pend.map((w) => measure(w.text, `600 ${size}px ${ITAL}`));
    const total = () => wid().reduce((a, b) => a + b, 0) + size * 0.28 * (pend.length - 1);
    if (total() > MAXW) size = (size * MAXW) / total();
    rows.push({kind: 'small', words: pend, size, y: 0, h: size * 1.2, widths: wid()});
    pend = [];
  };
  ws.forEach((w) => {
    if (isSmall(w)) {
      pend.push(w);
      return;
    }
    flush();
    const txt = w.text.toUpperCase();
    const size = Math.min(285, MAXW / (measure(txt, `100px ${BIG}`) / 100));
    // due parole forti corte stanno sulla stessa riga
    const prev = rows[rows.length - 1];
    if (prev && prev.kind === 'big' && prev.words.length === 1 && prev.size < 300) {
      const both = `${prev.words[0].text.toUpperCase()} ${txt}`;
      const s2 = Math.min(240, MAXW / (measure(both, `100px ${BIG}`) / 100));
      if (s2 >= 175 && prev.words[0].text.length + w.text.length <= 11) {
        prev.words.push(w);
        prev.size = s2;
        prev.h = s2 * 0.98;
        prev.widths = prev.words.map((x) => measure(x.text.toUpperCase(), `${s2}px ${BIG}`));
        return;
      }
    }
    rows.push({kind: 'big', words: [w], size, y: 0, h: size * 0.98, widths: [measure(txt, `${size}px ${BIG}`)]});
  });
  flush();
  let y = 0;
  rows.forEach((r) => {
    r.y = y;
    y += r.h + 4;
  });
  return rows;
};

/** riquadro disegnato a mano attorno a una parola (si adatta alla parola, niente misure) */
const Scribble: React.FC<{t: number; seed: string; color: string}> = ({t, seed, color}) => {
  const p = easeOut(clamp(t / 0.28));
  if (p <= 0) return null;
  const j = (k: string, a = 4) => (random(`${seed}${k}`) - 0.5) * a;
  const pts = [
    [j('a'), j('b') + 2],
    [100 + j('c'), j('d')],
    [99 + j('e'), 100 + j('f')],
    [j('g') + 1, 99 + j('h')],
    [j('i') + 4, j('j') + 6],
  ];
  const d = pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');
  return (
    <svg style={{position: 'absolute', left: '-6%', top: '-8%', width: '112%', height: '116%', overflow: 'visible'}} viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d={d} pathLength={100} fill="none" stroke={color} strokeWidth={5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={100} strokeDashoffset={100 * (1 - p)} />
    </svg>
  );
};

/** onda dell'audio vera, a barre specchiate */
const Wave: React.FC<{width: number; height: number; color: string; frame: number}> = ({width, height, color, frame}) => {
  const audio = useAudioData(WAVE);
  if (!audio) return null;
  const n = 48;
  const vals = visualizeAudio({fps: FPS, frame, audioData: audio, numberOfSamples: 64, smoothing: true}).slice(0, n);
  const bw = width / n;
  return (
    <svg width={width} height={height} style={{overflow: 'visible'}}>
      {vals.map((v, i) => {
        const hh = Math.max(3, Math.min(1, v * 5 + 0.04) * height);
        return <rect key={i} x={i * bw + bw * 0.2} y={(height - hh) / 2} width={bw * 0.6} height={hh} rx={bw * 0.3} fill={color} />;
      })}
    </svg>
  );
};

// ── un blocco di testo ──
const BlockView: React.FC<{i: number; g: number; frame: number}> = ({i, g, frame}) => {
  const b = BLOCKS[i];
  const ws = blockWords(b);
  const rows = layout(ws);
  const a = blockStart(i);
  const e = blockEnd(i);
  if (g < a - 0.05 || g > e + 0.01) return null;
  const light = !!b.light;
  const bigs = ws.filter((w) => !isSmall(w));
  const lastBig = bigs.filter((w) => w.start - 0.03 <= g).pop();

  // camera: segue la riga più recente, con una corsa morbida
  const shown = rows.filter((r) => r.words[0].start - 0.03 <= g);
  const focusOf = (r: Row) => r.y + r.h / 2;
  let cam = rows.length ? focusOf(rows[0]) : 0;
  shown.forEach((r, k) => {
    const target = Math.max(focusOf(r), k === 0 ? 0 : 0);
    cam = cam + (target - cam) * easeOut(prog(g, r.words[0].start - 0.03, r.words[0].start + 0.32));
  });
  const anchor = 980;
  const ty = anchor - cam;

  // uscita: quattro modi, a giro
  const out = prog(g, e - 0.15, e);
  const kind = i % 4;
  const outT =
    kind === 0
      ? `scale(${1 + easeIn(out) * 0.6}, ${1 - easeIn(out) * 0.3})`
      : kind === 1
        ? `translateY(${easeIn(out) * 500}px) rotate(${easeIn(out) * 6}deg)`
        : kind === 2
          ? `scale(${1 + easeIn(out) * 1.6})`
          : `translateX(${-easeIn(out) * 900}px) skewX(${easeIn(out) * 20}deg)`;

  const dim = light ? '#B6AC9E' : '#4E4843';
  const bright = light ? '#141110' : '#F6F0E6';
  const smallC = light ? '#6E655C' : '#958C83';
  const red = '#E0262E';
  const bp = beatPulse(g);
  let bigIdx = 0;

  return (
    <AbsoluteFill style={{transform: outT, opacity: 1 - easeIn(out), filter: out > 0 ? `blur(${out * 10}px)` : undefined}}>
      <div style={{position: 'absolute', left: 0, top: ty, width: W, transform: `scale(${1 + bp * 0.012})`, transformOrigin: `50% ${cam}px`}}>
        {rows.map((r, ri) => {
          return (
            <div
              key={ri}
              style={{position: 'absolute', left: 0, top: r.y, width: W, height: r.h, display: 'flex', alignItems: 'flex-start', paddingLeft: LEFT + (r.kind === 'small' ? 8 : 0), gap: r.kind === 'big' ? r.size * 0.22 : r.size * 0.28}}
            >
              {r.words.map((w, wi) => {
                const t = g - (w.start - 0.03);
                if (t < 0) return null;
                const acc = isAccent(w);
                if (r.kind === 'small') {
                  const p = easeOut(clamp(t / 0.16));
                  return (
                    <div
                      key={wi}
                      style={{
                        position: 'relative',
                        fontFamily: ITAL,
                        fontWeight: 600,
                        fontSize: r.size,
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        color: acc ? red : smallC,
                        opacity: p,
                        transform: `translateY(${(1 - p) * 22}px)`,
                        filter: p < 1 ? `blur(${(1 - p) * 5}px)` : undefined,
                      }}
                    >
                      {w.text}
                      {acc && <Scribble t={t - 0.08} seed={`s${w.start}`} color={red} />}
                    </div>
                  );
                }
                const k = Math.exp(-t * 24);
                const isCur = lastBig === w;
                const outline = !acc && bigIdx++ % 4 === 2;
                // colore: chiaro appena detta, poi si spegne
                const fade = isCur ? 0 : 1;
                const col = acc ? red : fade ? dim : bright;
                const rgb = isCur ? bp * 2.5 + k * 9 : 0;
                return (
                  <div
                    key={wi}
                    style={{
                      position: 'relative',
                      fontFamily: BIG,
                      fontSize: r.size,
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                      letterSpacing: `${k * 0.08}em`,
                      color: outline ? 'transparent' : col,
                      WebkitTextStroke: outline ? `${Math.max(2, r.size / 70)}px ${isCur ? bright : dim}` : undefined,
                      transform: `scale(${1 + 0.32 * k}) translateY(${k * 30}px)`,
                      transformOrigin: '0% 70%',
                      opacity: Math.min(1, t / 0.03),
                      filter: t < 0.06 ? `blur(${(1 - t / 0.06) * 8}px)` : undefined,
                      textShadow: rgb > 0.5 ? `${-rgb}px 0 0 rgba(255,30,50,0.55), ${rgb}px 0 0 rgba(30,220,255,0.5)` : undefined,
                    }}
                  >
                    {w.text.toUpperCase()}
                    {acc && <Scribble t={t - 0.1} seed={`b${w.start}`} color={light ? '#141110' : '#F6F0E6'} />}
                    {acc && light && (
                      <div style={{position: 'absolute', left: 0, top: r.size * 1.02}}>
                        <Wave width={r.widths[wi]} height={r.size * 0.38} color={red} frame={frame} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** l'intermezzo strumentale: "l'arte" respira sul beat con l'onda sotto */
const Interlude: React.FC<{g: number; frame: number}> = ({g, frame}) => {
  const a = 1.75;
  const b = 5.35;
  if (g < a || g > b) return null;
  const p = easeOut(prog(g, a, a + 0.5));
  const o = 1 - easeIn(prog(g, b - 0.2, b));
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 380, opacity: p * o}}>
      <Wave width={800} height={140} color="#E0262E" frame={frame} />
    </AbsoluteFill>
  );
};

export const Arte: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const g = frame / FPS;
  const bi = BLOCKS.findIndex((_, i) => g >= blockStart(i) - 0.05 && g <= blockEnd(i) + 0.01);
  const light = bi >= 0 && !!BLOCKS[bi].light;
  // passaggio alla carta: un cerchio che si apre dal centro
  const lightStart = bi >= 0 && light ? blockStart(bi) - 0.05 : 0;
  const iris = light ? easeOut(prog(g, lightStart, lightStart + 0.22)) : 0;
  const bp = beatPulse(g);
  const f2 = Math.floor(frame / 2);
  const flash = BLOCKS.map((_, i) => (i % 4 === 3 ? Math.exp(-Math.abs(g - blockStart(i)) * 30) : 0)).reduce((x, y) => Math.max(x, y), 0);
  const fade = Math.max(1 - prog(g, 0, 0.3), prog(g, DURATION - 0.45, DURATION));
  const drift = Math.sin(g * 0.35) * 8;
  return (
    <AbsoluteFill style={{background: '#0E0C0B', overflow: 'hidden'}}>
      {/* fondo scuro caldo con una luce che vaga piano */}
      <AbsoluteFill style={{background: 'radial-gradient(75% 45% at 50% 46%, #2B2622 0%, #171412 55%, #0B0A09 100%)'}} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(40% 25% at ${45 + drift}% ${40 + drift / 2}%, rgba(255,210,170,${0.05 + bp * 0.035}) 0%, transparent 70%)`,
        }}
      />
      {/* carta chiara */}
      {light && (
        <AbsoluteFill style={{clipPath: `circle(${iris * 120}% at 50% 50%)`}}>
          <AbsoluteFill style={{background: 'radial-gradient(80% 55% at 50% 48%, #F1EBDF 0%, #E3DBCC 60%, #CFC5B4 100%)'}} />
        </AbsoluteFill>
      )}
      {/* testo */}
      <AbsoluteFill style={{transform: `rotate(${Math.sin(g * 0.5) * 0.6}deg) scale(${1 + g * 0.002})`}}>
        {BLOCKS.map((_, i) => (
          <BlockView key={i} i={i} g={g} frame={frame} />
        ))}
        <Interlude g={g} frame={frame} />
      </AbsoluteFill>
      {/* dettagli da impaginato: numero del blocco e barra di avanzamento */}
      {bi >= 0 && (
        <div
          style={{
            position: 'absolute',
            left: LEFT,
            top: 200,
            fontFamily: ITAL,
            fontSize: 34,
            color: light ? '#8A8075' : '#5C554F',
            letterSpacing: '0.1em',
          }}
        >
          N°{String(bi + 1).padStart(2, '0')}
          <span style={{display: 'inline-block', width: 12, height: 12, borderRadius: 6, background: '#E0262E', marginLeft: 16, transform: `scale(${0.7 + bp * 0.6})`}} />
        </div>
      )}
      <div style={{position: 'absolute', left: LEFT, bottom: 330, height: 3, width: (W - 2 * LEFT) * clamp(g / DURATION), background: light ? '#141110' : '#3E3833'}} />
      {/* grana */}
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('simba/grain.png')})`,
          backgroundPosition: `${Math.floor(random(`g${f2}`) * 512)}px ${Math.floor(random(`h${f2}`) * 512)}px`,
          mixBlendMode: light ? 'multiply' : 'overlay',
          opacity: light ? 0.12 : 0.16,
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(90% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.45) 100%)'}} />
      {flash > 0.02 && <AbsoluteFill style={{background: '#F6F0E6', opacity: flash * 0.8}} />}
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
      <Audio src={AUDIO} />
    </AbsoluteFill>
  );
};

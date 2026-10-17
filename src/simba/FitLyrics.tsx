import React, {useMemo} from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {DISPLAY, FPS, K, lineWords} from './theme';
import {easeOut, pop} from '../lib/anim';

const MAX_W = 860; // larghezza utile (margini di sicurezza TikTok inclusi)

// Larghezze medie dei glifi di Anton (in em): stima deterministica, non dipende dal caricamento del font
const WIDE = 'MW';
const NARROW = 'IJ1';
const textW = (w: string, size: number) =>
  [...w].reduce((a, ch) => a + (WIDE.includes(ch) ? 0.62 : NARROW.includes(ch) ? 0.26 : ch === ' ' ? 0.22 : 0.47), 0) * size * 1.06;

/** Sceglie la dimensione massima che fa stare la riga in `maxRows` righe senza tagli */
const fitSize = (words: string[], maxRows: number, maxSize: number) => {
  for (let size = maxSize; size >= 48; size -= 4) {
    const gap = size * 0.24;
    let rows = 1;
    let x = 0;
    let ok = true;
    for (const w of words) {
      const ww = textW(w, size);
      if (ww > MAX_W) {
        ok = false;
        break;
      }
      if (x === 0) x = ww;
      else if (x + gap + ww <= MAX_W) x += gap + ww;
      else {
        rows++;
        x = ww;
      }
    }
    if (ok && rows <= maxRows) return size;
  }
  return 48;
};

export const clean = (w: string) => w.replace(/[,.]$/, '').toUpperCase();

/**
 * Testo cinetico parola per parola, sempre dentro lo schermo.
 * Parola cantata = bianca piena; parole chiave = box bianco con testo nero.
 */
export const FitLyrics: React.FC<{
  line: string;
  start: number;
  top: number;
  maxRows?: number;
  maxSize?: number;
  keywords?: string[];
  hold?: number;
}> = ({line, start, top, maxRows = 3, maxSize = 104, keywords = [], hold = 0.35}) => {
  const frame = useCurrentFrame() + start * FPS;
  const t = frame / FPS;
  const words = lineWords(line);
  const texts = useMemo(() => words.map((w) => clean(w.text)), [words]);
  const size = useMemo(() => fitSize(texts, maxRows, maxSize), [texts, maxRows, maxSize]);
  if (!words.length) return null;
  const t0 = words[0].startMs / 1000 - 0.15;
  const t1 = words[words.length - 1].endMs / 1000 + hold;
  if (t < t0 || t > t1 + 0.3) return null;
  const out = interpolate(t, [t1, t1 + 0.22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: (1080 - MAX_W) / 2,
        width: MAX_W,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        columnGap: size * 0.24,
        rowGap: size * 0.08,
        fontFamily: DISPLAY,
        fontSize: size,
        lineHeight: 1.18,
        opacity: 1 - out,
        transform: `translateY(${-out * 40}px)`,
        filter: `blur(${out * 10}px)`,
      }}
    >
      {words.map((w, i) => {
        const s = w.startMs / 1000;
        const e = w.endMs / 1000;
        const p = Math.min(1, pop(frame, s * FPS - 3));
        const sung = t >= s;
        const active = sung && t < e + 0.05;
        const key = keywords.some((k) => texts[i].startsWith(k.toUpperCase()));
        return (
          // padding generoso: gli accenti (Ò, À) non vengono mai tagliati dalla maschera
          <span key={i} style={{display: 'inline-block', overflow: 'hidden', padding: `${size * 0.22}px ${size * 0.06}px ${size * 0.04}px`, margin: `${-size * 0.22}px ${-size * 0.06}px ${-size * 0.04}px`}}>
            <span
              style={{
                display: 'inline-block',
                padding: key ? `0 ${size * 0.1}px` : 0,
                background: key && sung ? K.paper : 'transparent',
                color: key && sung ? K.ink : sung ? K.paper : 'rgba(241,238,230,0.28)',
                transform: `translateY(${(1 - p) * 110}%) scale(${active && !key ? 1.05 : 1})`,
                transformOrigin: 'bottom center',
                textShadow: !key ? '0 6px 30px rgba(0,0,0,0.6)' : 'none',
              }}
            >
              {texts[i]}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** Parola singola gigante che riempie la larghezza disponibile senza uscire dallo schermo */
export const BigWord: React.FC<{text: string; width?: number; style?: React.CSSProperties; letterSpacing?: number}> = ({text, width = 900, style, letterSpacing = 0}) => {
  const base = textW(text, 100) + letterSpacing * text.length;
  const size = Math.min(320, (100 * width) / base);
  return (
    <div style={{fontFamily: DISPLAY, fontSize: size, lineHeight: 1.15, letterSpacing, whiteSpace: 'nowrap', textAlign: 'center', ...style}}>{text}</div>
  );
};

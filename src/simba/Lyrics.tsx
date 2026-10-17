import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {DISPLAY, FPS, K, lineWords} from './theme';
import {easeOut, pop} from '../lib/anim';

/**
 * Riga di testo cinetica: ogni parola sale da una maschera nel momento in cui viene cantata,
 * quella attiva è color sole.
 */
export const LyricLine: React.FC<{
  line: string;
  /** secondo assoluto in cui inizia la Sequence che contiene la riga */
  start: number;
  top: number;
  size?: number;
  color?: string;
  dim?: string;
  align?: 'center' | 'left';
  maxWidth?: number;
  hold?: number; // secondi di permanenza dopo l'ultima parola
  highlight?: string[];
}> = ({line, start, top, size = 128, color = K.paper, dim, align = 'center', maxWidth = 960, hold = 0.35, highlight = []}) => {
  const frame = useCurrentFrame() + start * FPS;
  const t = frame / FPS;
  const words = lineWords(line);
  if (!words.length) return null;
  const t0 = words[0].startMs / 1000 - 0.2;
  const t1 = words[words.length - 1].endMs / 1000 + hold;
  if (t < t0 || t > t1 + 0.3) return null;
  const out = interpolate(t, [t1, t1 + 0.25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: (1080 - maxWidth) / 2,
        width: maxWidth,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        columnGap: size * 0.22,
        rowGap: size * 0.02,
        fontFamily: DISPLAY,
        fontSize: size,
        lineHeight: 1.02,
        textTransform: 'uppercase',
        opacity: 1 - out,
        transform: `translateY(${-out * 60}px)`,
        filter: `blur(${out * 12}px)`,
      }}
    >
      {words.map((w, i) => {
        const s = w.startMs / 1000;
        const e = w.endMs / 1000;
        const f0 = s * FPS - 3;
        const p = pop(frame, f0);
        const active = t >= s && t < e + 0.05;
        const hl = highlight.some((h) => w.text.toLowerCase().startsWith(h));
        const c = active || (hl && t >= s) ? K.sun : t >= s ? color : dim ?? 'transparent';
        return (
          <span key={i} style={{display: 'inline-block', overflow: 'hidden', paddingTop: size * 0.06}}>
            <span
              style={{
                display: 'inline-block',
                color: c,
                transform: `translateY(${(1 - Math.min(1, p)) * 105}%) scale(${active ? 1.06 : 1}) rotate(${(1 - Math.min(1, p)) * 6}deg)`,
                transformOrigin: 'bottom left',
                textShadow: active ? `0 0 50px ${K.sun}88` : 'none',
              }}
            >
              {w.text.replace(/[,.]$/, '')}
            </span>
          </span>
        );
      })}
    </div>
  );
};

import '@fontsource/anton';
import React from 'react';
import {AbsoluteFill, random, staticFile, useCurrentFrame} from 'remotion';
import {FPS, usePal} from './kit';

/** Linguaggio grafico condiviso dei video 3D (One of One, Dall'angolo, …) */

export type Kind = 'solid' | 'outline' | 'ghost' | 'soft';
export type Token = [string, number, Kind];

/** Tunnel di scritte ad anelli che girano (2D), con zoom e scossa iniziale */
export const RingTunnel: React.FC<{word: string}> = ({word}) => {
  const f = useCurrentFrame();
  const {css} = usePal();
  const zoom = 1 + f * 0.012;
  const shake = Math.exp(-f / 12) * 30;
  const sx = (random(`ox${f}`) - 0.5) * shake;
  const sy = (random(`oy${f}`) - 0.5) * shake;
  return (
    <AbsoluteFill style={{background: `radial-gradient(40% 50% at 50% 50%, ${css.bg} 0%, #000 70%)`, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${zoom})`}}>
        {Array.from({length: 7}, (_, r) => {
          const R = 170 + r * 150;
          const fs = 60 + r * 12;
          const n = Math.floor((2 * Math.PI * R) / (fs * 0.58 * (word.length + 0.6)));
          const rot = (r % 2 ? 1 : -1) * f * (0.6 - r * 0.05);
          const red = r % 3 === 1;
          return (
            <div key={r} style={{position: 'absolute', left: '50%', top: '50%', transform: `rotate(${rot}deg)`}}>
              {Array.from({length: n}, (_, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    fontFamily: '"Anton", Impact, sans-serif',
                    fontSize: fs,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    color: red ? `rgba(${css.ink},0.85)` : 'transparent',
                    WebkitTextStroke: red ? undefined : '2px rgba(180,180,180,0.55)',
                    transform: `rotate(${(i / n) * 360}deg) translateY(${-R}px) translateX(-50%)`,
                    transformOrigin: '0 0',
                  }}
                >
                  {word}
                </div>
              ))}
            </div>
          );
        })}
        <AbsoluteFill style={{background: `radial-gradient(12% 18% at 50% 50%, rgba(${css.glow},0.9) 0%, rgba(${css.glow},0.3) 40%, transparent 70%)`}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// larghezza approssimata dei glifi di Anton (em)
export const textW = (s: string) => [...s].reduce((a, ch) => a + ('MW'.includes(ch) ? 0.62 : "I1'".includes(ch) ? 0.27 : ch === ' ' ? 0.24 : ch === '?' ? 0.45 : 0.5), 0);

/** testo bianco graffiato al centro, una o due parole alla volta ('soft' = dissolvenza lenta) */
export const Lyrics: React.FC<{tokens: Token[]; big?: string[]}> = ({tokens, big: bigWords = []}) => {
  const frame = useCurrentFrame();
  const {css} = usePal();
  const t = frame / FPS;
  let idx = -1;
  tokens.forEach(([, at], i) => {
    if (t >= at - 0.02) idx = i;
  });
  if (idx < 0) return null;
  const [text, at, kind] = tokens[idx];
  const lf = Math.floor((t - at) * FPS);
  const size = Math.min(230, 1400 / textW(text));
  const flick = kind === 'soft' ? Math.min(1, lf / 40) * 0.85 : lf < 6 ? [1, 0.25, 1, 0.6, 1, 1][lf] : 1;
  const sc = kind === 'soft' ? 1 + lf * 0.0006 : 1 + Math.max(0, 1 - lf / 10) * 0.08;
  const big = bigWords.includes(text);
  const common: React.CSSProperties = {
    fontFamily: '"Anton", Impact, sans-serif',
    fontSize: size * (big ? 1.25 : 1),
    lineHeight: 1,
    letterSpacing: size * 0.01,
    whiteSpace: 'nowrap',
  };
  const fill: React.CSSProperties =
    kind === 'outline'
      ? {color: 'transparent', WebkitTextStroke: '3px rgba(255,255,255,0.95)'}
      : kind === 'ghost'
        ? {color: 'rgba(120,110,130,0.75)', WebkitTextStroke: '2px #FFFFFF'}
        : {
            backgroundImage: `url(${staticFile('angolo/grunge.png')})`,
            backgroundSize: '520px',
            backgroundPosition: `${(idx * 137) % 500}px ${(idx * 211) % 500}px`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          };
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: flick}}>
      <div style={{transform: `scale(${sc}, ${sc * 1.12})`, filter: `${kind === 'soft' ? `blur(${Math.max(0, 6 - lf / 8)}px) ` : ''}drop-shadow(0 6px 18px rgba(0,0,0,0.65)) drop-shadow(0 0 22px rgba(${css.glow},0.25))`}}>
        <div style={{...common, ...fill, padding: '0.18em 0.05em 0.05em'}}>{text}</div>
      </div>
    </AbsoluteFill>
  );
};


import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {BEATS, DISPLAY, FPS, beatPulse, lineWords} from './theme';
import {easeOut} from '../lib/anim';

/**
 * "Edit dei testi" in stile TikTok: una parola alla volta, gigante, con sfondi che
 * alternano nero / bianco / rosso, RGB split, testo ondulato, graffi e scosse sul beat.
 */

type Style = 'A' | 'B' | 'C' | 'D' | 'E' | 'G' | 'V';
// A nero+bianco · B bianco+nero · C nero+rosso · D rosso+nero · E bianco+rosso · G nero+grigio (eco) · V live scuro+bianco
const LOOK: Record<Style, {bg: string; fg: string; video?: boolean}> = {
  A: {bg: '#0B0B0D', fg: '#FFFFFF'},
  B: {bg: 'radial-gradient(75% 60% at 50% 50%, #FFFFFF 40%, #B9B9B9 100%)', fg: '#0A0A0A'},
  C: {bg: '#0B0B0D', fg: '#E3141B'},
  D: {bg: 'radial-gradient(80% 60% at 50% 50%, #D9141B 30%, #6E0508 100%)', fg: '#0A0A0A'},
  E: {bg: 'radial-gradient(75% 60% at 50% 50%, #FFFFFF 40%, #B9B9B9 100%)', fg: '#E3141B'},
  G: {bg: '#0B0B0D', fg: '#6E6E70'},
  V: {bg: '#0B0B0D', fg: '#FFFFFF', video: true},
};

type Tok = {
  text: string;
  at: number;
  styles: Style[];
  cycle?: number; // frame per cambio stile
  rgb?: number; // intensità RGB split
  warp?: number; // intensità ondulazione
  grunge?: boolean;
  shake?: number;
};

const W = (line: string, i: number) => lineWords(line)[i].startMs / 1000;
const endOf = (line: string) => {
  const w = lineWords(line);
  return w[w.length - 1].endMs / 1000;
};

const B = BEATS;
const HITS = lineWords('freedom').map((w) => w.startMs / 1000);

// ── sceneggiatura parola per parola ──
const TOKENS: Tok[] = [
  {text: 'AH-AH', at: 0.0, styles: ['A', 'B'], cycle: 14},
  {text: '22SIMBA', at: B[0], styles: ['A'], rgb: 3},
  {text: 'FREEDOM', at: B[1], styles: ['G']},
  {text: 'FREEDOM', at: B[2], styles: ['G', 'A'], cycle: 10},
  // "Se chiami, guarda i fusi orari, ma io ci sarò"
  {text: 'SE CHIAMI', at: W('chiami', 0), styles: ['A']},
  {text: 'GUARDA', at: W('chiami', 2), styles: ['B']},
  {text: 'I FUSI', at: W('chiami', 3), styles: ['A', 'C'], cycle: 9},
  {text: 'ORARI', at: W('chiami', 5), styles: ['B', 'E'], cycle: 10, rgb: 3},
  {text: 'MA IO', at: W('chiami', 6), styles: ['A']},
  {text: 'CI SARÒ', at: W('chiami', 8), styles: ['B', 'A', 'C'], cycle: 8, rgb: 4},
  // eco nell'intercalare
  {text: 'CI SARÒ', at: endOf('chiami') + 0.05, styles: ['G']},
  {text: 'CI SARÒ', at: B[8], styles: ['G']},
  {text: 'CI SARÒ', at: B[9], styles: ['G', 'A'], cycle: 12},
  {text: 'CI SARÒ', at: B[10], styles: ['G']},
  // "E potrò fallire un domani, però lo farò"
  {text: 'E POTRÒ', at: W('fallire', 0), styles: ['A'], rgb: 3},
  {text: 'FALLIRE', at: W('fallire', 2), styles: ['V', 'B', 'V'], cycle: 9, rgb: 6, warp: 18, grunge: true, shake: 8},
  {text: 'UN DOMANI', at: W('fallire', 3), styles: ['A'], rgb: 4, grunge: true},
  {text: 'PERÒ', at: W('fallire', 5), styles: ['B', 'E'], cycle: 9, rgb: 5, grunge: true},
  {text: 'LO FARÒ', at: W('fallire', 6), styles: ['D', 'A', 'C'], cycle: 7, rgb: 7, warp: 10, grunge: true, shake: 10},
  {text: 'LO FARÒ', at: endOf('fallire') + 0.05, styles: ['G']},
  // FREEDOM ×5: il picco
  ...HITS.map(
    (h, i): Tok => ({
      text: 'FREEDOM',
      at: h,
      styles: ([['V', 'B', 'C'], ['D', 'A', 'E'], ['B', 'V', 'C', 'A'], ['E', 'A', 'D'], ['V', 'B', 'D', 'A', 'C']] as Style[][])[i],
      cycle: [9, 8, 7, 6, 5][i],
      rgb: 6 + i * 2,
      warp: 10 + i * 6,
      grunge: true,
      shake: 10 + i * 3,
    }),
  ),
  {text: 'FREEDOM', at: endOf('freedom') + 0.05, styles: ['G']},
  // "Voglio il sole ricopra di raggi uno del Polo Nord"
  {text: 'VOGLIO', at: W('sole', 0), styles: ['A'], rgb: 3},
  {text: 'IL SOLE', at: W('sole', 1), styles: ['E', 'B'], cycle: 12, rgb: 4},
  {text: 'RICOPRA', at: W('sole', 3), styles: ['A'], rgb: 4, warp: 8},
  {text: 'DI RAGGI', at: W('sole', 4), styles: ['B', 'E'], cycle: 9, rgb: 5, grunge: true},
  {text: 'UNO DEL', at: W('sole', 6), styles: ['A'], rgb: 4},
  {text: 'POLO NORD', at: W('sole', 8), styles: ['C', 'B', 'D'], cycle: 8, rgb: 7, warp: 12, grunge: true, shake: 8},
  // eco
  {text: 'POLO NORD', at: endOf('sole') + 0.05, styles: ['G']},
  {text: 'POLO NORD', at: B[32], styles: ['G']},
  {text: 'MIRIA', at: B[33], styles: ['V'], rgb: 5, grunge: true},
  {text: 'MIRIA', at: B[34], styles: ['G']},
  // ripresa "Se chiami…"
  {text: 'SE CHIAMI', at: W('chiami2', 0), styles: ['A', 'B'], cycle: 12, rgb: 4},
  {text: 'GUARDA', at: W('chiami2', 2), styles: ['B'], rgb: 4, grunge: true},
  {text: 'I FUSI', at: W('chiami2', 3), styles: ['V', 'C'], cycle: 9, rgb: 5, grunge: true},
  {text: 'ORARI', at: W('chiami2', 5), styles: ['E', 'B'], cycle: 8, rgb: 6, warp: 10, grunge: true},
  {text: 'MA IO', at: W('chiami2', 6), styles: ['A'], rgb: 5},
  {text: 'CI SARÒ', at: W('chiami2', 8), styles: ['D', 'B', 'A', 'C'], cycle: 6, rgb: 8, warp: 14, grunge: true, shake: 10},
  {text: '22SIMBA', at: 22.9, styles: ['V', 'A'], cycle: 14, rgb: 5, grunge: true},
];

// larghezza approssimata dei glifi di Anton (em) per far riempire la larghezza senza tagli
const textW = (s: string) => [...s].reduce((a, ch) => a + ('MW'.includes(ch) ? 0.62 : 'I1'.includes(ch) ? 0.27 : ch === ' ' ? 0.24 : ch === '-' ? 0.32 : 0.5), 0);

export const SimbaV5: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const idx = TOKENS.reduce((acc, tk, i) => (t >= tk.at - 0.02 ? i : acc), 0);
  const tok = TOKENS[idx];
  const local = Math.max(0, t - tok.at);
  const lf = Math.floor(local * FPS);
  const style = tok.styles[Math.floor(lf / (tok.cycle ?? 9999)) % tok.styles.length];
  const look = LOOK[style];

  // entrata: scatto con motion blur orizzontale e scala
  const enter = interpolate(local, [0, 0.09], [0, 1], {extrapolateRight: 'clamp', easing: easeOut});
  const bp = beatPulse(t, 10);
  const shakeAmt = (tok.shake ?? 0) * Math.exp(-local * 6) + bp * 3;
  const sx = (random(`sx${frame}`) - 0.5) * shakeAmt;
  const sy = (random(`sy${frame}`) - 0.5) * shakeAmt;
  const rgb = (tok.rgb ?? 0) * (0.6 + 0.4 * Math.abs(Math.sin(frame * 1.7))) + bp * 2;
  const warp = (tok.warp ?? 0) * (0.5 + bp);

  // dimensione: riempie ~92% della larghezza, altezza massima limitata
  const size = Math.min(400, (1080 * 0.82) / textW(tok.text));
  const scale = (1.1 - enter * 0.1) * (1 + bp * 0.04);
  const fade = interpolate(t, [23.35, 23.66], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: look.bg, overflow: 'hidden'}}>
      {/* filtro di ondulazione (SVG) */}
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id="warp">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.03" numOctaves={2} seed={Math.floor(frame / 3)} />
          <feDisplacementMap in="SourceGraphic" scale={warp} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {look.video && (
        <AbsoluteFill style={{opacity: 0.35, filter: 'grayscale(1) contrast(1.3) brightness(0.6) blur(2px)'}}>
          <OffthreadVideo src={staticFile('simba/vid/fabrique.mp4')} muted trimBefore={Math.round(54 * FPS)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </AbsoluteFill>
      )}

      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `translate(${sx}px, ${sy}px)`}}>
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: size,
            lineHeight: 1,
            color: look.fg,
            whiteSpace: 'nowrap',
            letterSpacing: size * 0.005,
            transform: `scale(${scale * (1 + (1 - enter) * 0.12)}, ${scale * 1.38})`,
            filter: `${warp > 0.5 ? 'url(#warp) ' : ''}blur(${(1 - enter) * 6}px)`,
            textShadow: rgb > 0.3 ? `${-rgb}px 0 rgba(255,0,40,0.85), ${rgb}px 0 rgba(0,230,255,0.85)` : 'none',
            opacity: enter * fade,
          }}
        >
          {tok.text}
        </div>
      </AbsoluteFill>

      {/* graffi e crepe */}
      {tok.grunge && (
        <AbsoluteFill style={{mixBlendMode: style === 'B' || style === 'E' ? 'multiply' : 'screen', opacity: 0.55, filter: style === 'B' || style === 'E' ? 'invert(1)' : undefined, transform: `translate(${(random(`gx${Math.floor(frame / 4)}`) - 0.5) * 60}px, ${(random(`gy${Math.floor(frame / 4)}`) - 0.5) * 60}px) rotate(${Math.floor(frame / 4) % 2 ? 180 : 0}deg)`}}>
          <Img src={staticFile('simba/scratches.png')} style={{width: '100%', height: '100%'}} />
        </AbsoluteFill>
      )}

      {/* grana e vignetta */}
      <AbsoluteFill style={{backgroundImage: `url(${staticFile('simba/grain.png')})`, backgroundPosition: `${Math.floor(random(`g${Math.floor(frame / 2)}`) * 512)}px ${Math.floor(random(`h${Math.floor(frame / 2)}`) * 512)}px`, mixBlendMode: 'overlay', opacity: 0.12}} />
      <AbsoluteFill style={{background: 'radial-gradient(120% 80% at 50% 50%, transparent 60%, rgba(0,0,0,0.35) 100%)'}} />
      <AbsoluteFill style={{background: '#000', opacity: 1 - fade}} />
      <Audio src={staticFile('simba/audio.m4a')} />
    </AbsoluteFill>
  );
};

import React from 'react';
import {random} from 'remotion';
import {BLUE, PAPER, SW, pop, prog} from './ink';

const line = {fill: 'none', stroke: BLUE, strokeWidth: SW, strokeLinecap: 'round', strokeLinejoin: 'round'} as const;
const solid = {fill: BLUE, stroke: BLUE, strokeWidth: SW, strokeLinejoin: 'round'} as const;
const white = {fill: PAPER, stroke: BLUE, strokeWidth: SW, strokeLinejoin: 'round'} as const;

export type Mouth = 'smile' | 'flat' | 'o' | 'grin';

/** Mano a "guantone" con pollice; disegnata con il polso nell'origine, rivolta verso +y */
const Hand: React.FC<{open?: boolean}> = ({open}) => (
  <g>
    <path d="M-24 0 C-34 20 -34 52 -14 62 C2 70 22 64 28 46 C34 28 30 10 22 0 Z" {...white} />
    <path d={open ? 'M22 18 C40 8 50 22 36 36' : 'M20 22 C30 22 32 34 22 38'} {...line} strokeWidth={8} />
  </g>
);

/** Braccio: manica + braccio + mano, ruota attorno alla spalla (origine). 0° = giù */
const Arm: React.FC<{angle: number; len?: number; open?: boolean}> = ({angle, len = 150, open}) => (
  <g transform={`rotate(${angle})`}>
    <line x1={0} y1={30} x2={0} y2={len} {...line} />
    <path d="M-28 -6 L28 -6 L30 48 L-30 48 Z" {...solid} />
    <g transform={`translate(0 ${len})`}>
      <Hand open={open} />
    </g>
  </g>
);

/**
 * Il protagonista. Coordinate locali: testa centrata in (0,0), piedi a y≈700.
 * half = solo busto (per i primi piani).
 */
export const Kid: React.FC<{
  blink?: boolean;
  mouth?: Mouth;
  look?: number; // spostamento pupille (-1..1, alto/basso)
  armL?: number;
  armR?: number;
  openL?: boolean;
  openR?: boolean;
  half?: boolean;
}> = ({blink, mouth = 'smile', look = 0, armL = 12, armR = -12, openL, openR, half}) => {
  const py = look * -8;
  return (
    <g>
      {/* gambe */}
      {!half && (
        <g>
          <path d="M-78 300 L-72 640 L-14 640 L-8 330 L8 330 L14 640 L72 640 L78 300 Z" {...white} />
          <line x1={0} y1={330} x2={0} y2={300} {...line} />
          <path d="M-80 640 C-110 640 -122 672 -100 682 L-10 682 C-6 664 -8 648 -14 640 Z" {...solid} />
          <path d="M80 640 C110 640 122 672 100 682 L10 682 C6 664 8 648 14 640 Z" {...solid} />
        </g>
      )}
      {/* braccia dietro al busto */}
      <g transform="translate(-92 150)">
        <Arm angle={armL} open={openL} />
      </g>
      <g transform="translate(92 150)">
        <Arm angle={armR} open={openR} />
      </g>
      {/* maglietta con la lunetta */}
      <path d="M-95 140 C-60 128 60 128 95 140 L100 310 L-100 310 Z" {...solid} />
      <path d="M-26 186 C-52 214 -38 258 -2 262 C-22 248 -28 214 -12 192 Z" fill={PAPER} />
      <path d="M-30 136 C-18 160 18 160 30 136" {...white} />
      {/* collo */}
      <path d="M-22 108 L-22 140 M22 108 L22 140" {...line} />
      {/* orecchie */}
      <path d="M-104 -6 C-128 -14 -132 30 -102 30" {...white} />
      <path d="M104 -6 C128 -14 132 30 102 30" {...white} />
      {/* testa */}
      <ellipse cx={0} cy={0} rx={106} ry={118} {...white} />
      {/* capelli a caschetto con frangia irregolare + ciuffo */}
      <path
        d="M-112 40 C-130 -90 -60 -132 0 -130 C70 -132 132 -88 112 40 L104 -36 Q84 -52 66 -30 Q46 -58 22 -34 Q-2 -60 -22 -34 Q-44 -58 -64 -32 Q-84 -50 -104 -30 Z"
        {...solid}
      />
      <path d="M8 -128 C0 -170 46 -180 52 -150" {...line} />
      {/* sopracciglia */}
      <path d="M-62 -14 L-26 -18 M26 -18 L62 -14" {...line} strokeWidth={8} />
      {/* occhi */}
      {blink ? (
        <path d="M-58 14 Q-44 24 -30 14 M30 14 Q44 24 58 14" {...line} strokeWidth={8} />
      ) : (
        <g>
          <ellipse cx={-44} cy={12 + py} rx={12} ry={16} fill={BLUE} />
          <ellipse cx={44} cy={12 + py} rx={12} ry={16} fill={BLUE} />
        </g>
      )}
      {/* naso */}
      <path d="M4 22 L-6 50 L10 50" {...line} strokeWidth={7} />
      {/* guance tratteggiate */}
      <path d="M-78 48 l10 -14 M-64 52 l10 -14 M-50 54 l10 -14 M50 54 l10 -14 M64 52 l10 -14 M78 48 l10 -14" {...line} strokeWidth={5} />
      {/* bocca */}
      {mouth === 'smile' && <path d="M-26 72 Q0 94 26 72" {...line} strokeWidth={8} />}
      {mouth === 'flat' && <path d="M-22 80 L22 78" {...line} strokeWidth={8} />}
      {mouth === 'o' && <ellipse cx={0} cy={80} rx={14} ry={18} {...white} strokeWidth={8} />}
      {mouth === 'grin' && <path d="M-34 66 Q0 70 34 66 Q24 104 0 104 Q-24 104 -34 66 Z" {...solid} strokeWidth={6} />}
    </g>
  );
};

/** Nuvola a bordo bombato */
export const Cloud: React.FC<{w?: number}> = ({w = 420}) => {
  const k = w / 420;
  return (
    <g transform={`scale(${k})`}>
      <path
        d="M-180 60 C-240 60 -240 -10 -180 -12 C-190 -80 -100 -100 -70 -50 C-50 -120 60 -120 70 -48 C110 -90 190 -60 170 0 C240 0 240 60 180 60 Z"
        {...white}
        strokeWidth={SW / k}
      />
      <path d="M-120 30 Q-100 44 -80 30" {...line} strokeWidth={7 / k} />
    </g>
  );
};

/** Pioggia: gocce a lacrima che cadono a scatti dentro un rettangolo */
export const Rain: React.FC<{f: number; x: number; y: number; w: number; h: number; from?: number; n?: number; seed: string; stopY?: (x: number) => number}> = ({
  f,
  x,
  y,
  w,
  h,
  from = 0,
  n = 14,
  seed,
  stopY,
}) => {
  if (f < from) return null;
  const drops: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const dx = x + random(`${seed}x${i}`) * w;
    const speed = 38 + random(`${seed}v${i}`) * 14;
    const off = random(`${seed}o${i}`) * h;
    const t = (f - from) * speed + off;
    const dy = y + (t % h);
    const limit = stopY ? stopY(dx) : Infinity;
    if (dy > limit) {
      // schizzo sull'ombrello / a terra
      if (dy - limit < speed * 2)
        drops.push(<path key={i} d={`M${dx - 22} ${limit - 6} l-10 -12 M${dx + 22} ${limit - 6} l10 -12 M${dx} ${limit - 14} l0 -14`} {...line} strokeWidth={6} />);
      continue;
    }
    if ((f - from) * speed + off < h * 0.08 && dy < y + 20) continue;
    drops.push(<path key={i} d={`M${dx} ${dy - 26} C${dx + 12} ${dy - 6} ${dx + 12} ${dy + 10} ${dx} ${dy + 10} C${dx - 12} ${dy + 10} ${dx - 12} ${dy - 6} ${dx} ${dy - 26} Z`} {...solid} strokeWidth={4} />);
  }
  return <>{drops}</>;
};

/** Ombrello: open 0→1 lo apre a ventaglio */
export const Umbrella: React.FC<{open: number}> = ({open}) => {
  const sx = 0.12 + open * 0.88;
  const sy = 0.6 + open * 0.4;
  const R = 300;
  const n = 5;
  // bordo inferiore a festoni, da destra verso sinistra
  const edge = Array.from({length: n}, (_, i) => {
    const b = R - (i * 2 * R) / n;
    const a = b - (2 * R) / n;
    return `Q${(a + b) / 2} -46 ${a} 0`;
  }).join(' ');
  return (
    <g>
      {/* manico */}
      <path d="M0 -10 L0 420 C0 470 -60 470 -60 430" {...line} strokeWidth={14} />
      <g transform={`scale(${sx} ${sy})`}>
        <path d={`M${-R} 0 C${-R} -230 ${R} -230 ${R} 0 ${edge} Z`} {...solid} />
        {/* spicchi bianchi */}
        {[-1, 1].map((s) => (
          <path key={s} d={`M${s * 50} -165 Q${s * 110} -80 ${s * 120} -30`} fill="none" stroke={PAPER} strokeWidth={14} strokeLinecap="round" />
        ))}
        <path d="M0 -172 L0 -212" {...line} strokeWidth={14} />
      </g>
    </g>
  );
};

/** Vaso con piantina che cresce: g = 0→1 crescita stelo, poi foglie e fiore a tempo */
export const Plant: React.FC<{f: number; at: number}> = ({f, at}) => {
  const stem = 'M0 0 C-30 -120 40 -220 0 -360 C-24 -440 20 -500 0 -560';
  const L = 620;
  const g = prog(f, at, at + 26);
  const leaves = [
    {y: -130, side: -1, t: at + 8},
    {y: -230, side: 1, t: at + 13},
    {y: -340, side: -1, t: at + 18},
    {y: -440, side: 1, t: at + 22},
  ];
  const bloom = pop(f, at + 30, 6);
  return (
    <g>
      <path d={stem} {...line} strokeWidth={12} strokeDasharray={L} strokeDashoffset={L * (1 - g)} />
      {leaves.map((l, i) => {
        const s = pop(f, l.t, 5);
        if (!s) return null;
        const x = [-14, 14, -10, 6][i];
        return (
          <g key={i} transform={`translate(${x} ${l.y}) scale(${l.side * s} ${s}) rotate(-20)`}>
            <path d="M0 0 C40 -70 140 -60 170 -10 C120 30 40 40 0 0 Z" {...solid} />
            <path d="M14 -4 C60 -20 110 -22 150 -12" fill="none" stroke={PAPER} strokeWidth={6} strokeLinecap="round" />
          </g>
        );
      })}
      {bloom > 0 && (
        <g transform={`translate(0 -575) scale(${bloom}) rotate(${(f % 12) < 6 ? -4 : 4})`}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <ellipse key={i} cx={0} cy={-62} rx={34} ry={58} transform={`rotate(${(i * 360) / 7})`} {...white} />
          ))}
          <circle r={42} {...solid} />
          <circle r={14} cx={-10} cy={-10} fill={PAPER} />
        </g>
      )}
      {/* vaso */}
      <path d="M-150 0 L150 0 L118 250 L-118 250 Z" {...solid} />
      <path d="M-175 -10 L175 -10 L175 50 L-175 50 Z" {...solid} />
      <path d="M-132 120 L132 120 M-126 150 L126 150" stroke={PAPER} strokeWidth={8} strokeDasharray="22 16" />
    </g>
  );
};

/** Sole con raggi che pulsano a scatti */
export const Sun: React.FC<{f: number}> = ({f}) => {
  const odd = Math.floor(f / 4) % 2;
  return (
    <g>
      {Array.from({length: 12}, (_, i) => {
        const a = (i * Math.PI * 2) / 12;
        const long = (i + odd) % 2 === 0;
        const r1 = 150;
        const r2 = long ? 240 : 200;
        return <line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2} {...line} strokeWidth={12} />;
      })}
      <circle r={120} {...solid} />
      <path d="M-50 -10 Q-36 -24 -22 -10 M22 -10 Q36 -24 50 -10 M-40 34 Q0 70 40 34" fill="none" stroke={PAPER} strokeWidth={10} strokeLinecap="round" />
    </g>
  );
};

/** Luna crescente che si disegna (draw 0→1) */
export const Moon: React.FC<{draw: number}> = ({draw}) => {
  const L = 900;
  return (
    <path
      d="M40 -150 C-120 -150 -170 80 -20 150 C100 200 180 110 160 60 C60 120 -60 40 -20 -60 C0 -110 30 -140 40 -150 Z"
      fill={draw >= 1 ? BLUE : 'none'}
      stroke={BLUE}
      strokeWidth={SW}
      strokeLinejoin="round"
      strokeDasharray={L}
      strokeDashoffset={L * (1 - draw)}
    />
  );
};

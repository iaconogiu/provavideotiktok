import '@fontsource/special-elite';
import '@fontsource/archivo-black';
import React from 'react';
import {random, useCurrentFrame} from 'remotion';

export const FPS = 24;
export const W = 1080;
export const H = 1920;

// unico colore: blu oltremare "da stampa" su carta bianca
export const BLUE = '#1E10F2';
export const PAPER = '#FFFFFF';
export const SW = 10; // spessore del tratto

export const TYPE = '"Special Elite", "Courier New", monospace';
export const BLOCK = '"Archivo Black", "Impact", sans-serif';

/** Animazione "a passo due": il tempo avanza a scatti di n fotogrammi, come il passo uno */
export const useStep = (n = 2) => Math.floor(useCurrentFrame() / n) * n;

/** 0→1 lineare tra due fotogrammi, già limitato */
export const prog = (f: number, a: number, b: number) => Math.min(1, Math.max(0, (f - a) / (b - a)));

/** Pop con rimbalzo (scala) a scatti */
export const pop = (f: number, at: number, dur = 6) => {
  const t = prog(f, at, at + dur);
  if (t <= 0) return 0;
  return t < 1 ? 1 + Math.sin(t * Math.PI) * 0.25 - (1 - t) * 0.6 : 1;
};

/**
 * Filtro "inchiostro": le linee tremolano (cambia il seme ogni 2 fotogrammi),
 * i bordi diventano irregolari e nei pieni compaiono i puntini bianchi della stampa.
 */
export const InkFilter: React.FC<{id: string; wobble?: number}> = ({id, wobble = 7}) => {
  const seed = Math.floor(useCurrentFrame() / 2) % 9;
  return (
    <defs>
      <filter id={id} filterUnits="userSpaceOnUse" x={-40} y={-40} width={W + 80} height={H + 80} colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={seed} result="w1" />
        <feDisplacementMap in="SourceGraphic" in2="w1" scale={wobble} xChannelSelector="R" yChannelSelector="G" result="d1" />
        <feTurbulence type="fractalNoise" baseFrequency="0.3" numOctaves={1} seed={seed + 20} result="w2" />
        <feDisplacementMap in="d1" in2="w2" scale={4} xChannelSelector="R" yChannelSelector="G" result="d2" />
        <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves={2} seed={seed + 40} result="g" />
        <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  18 0 0 0 -4.9" result="mask" />
        <feComposite in="d2" in2="mask" operator="in" />
      </filter>
    </defs>
  );
};

/** Una scena = un SVG a tutto schermo con il filtro inchiostro applicato a tutto */
export const InkScene: React.FC<{bg?: string; zoom?: number; origin?: [number, number]; children: React.ReactNode}> = ({
  bg = PAPER,
  zoom = 1,
  origin = [W / 2, H / 2],
  children,
}) => {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{position: 'absolute', inset: 0, background: PAPER}}>
      <InkFilter id={id} />
      <g filter={`url(#${id})`}>
        {bg !== PAPER && <rect x={-40} y={-40} width={W + 80} height={H + 80} fill={bg} />}
        <g transform={`translate(${origin[0]} ${origin[1]}) scale(${zoom}) translate(${-origin[0]} ${-origin[1]})`}>{children}</g>
      </g>
    </svg>
  );
};

// ── elementi ricorrenti ──

export const starPath = (r: number) => {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    p.push(`${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`);
  }
  return `M${p.join(' L')}Z`;
};

/** Cielo di stelline che spuntano una alla volta e "sfarfallano" */
export const Stars: React.FC<{seed: string; n?: number; from?: number; color?: string; avoid?: (x: number, y: number) => boolean}> = ({
  seed,
  n = 22,
  from = 0,
  color = BLUE,
  avoid,
}) => {
  const f = useStep(2);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n * 3 && out.length < n; i++) {
    const x = 40 + random(`${seed}x${i}`) * (W - 80);
    const y = 40 + random(`${seed}y${i}`) * (H - 80);
    if (avoid?.(x, y)) continue;
    const r = 16 + random(`${seed}r${i}`) * 20;
    const at = from + Math.floor(random(`${seed}t${i}`) * 24);
    const s = pop(f, at, 4) * (Math.floor((f + i * 2) / 6) % 4 === 0 ? 0.8 : 1);
    if (!s) continue;
    const rot = (random(`${seed}a${i}`) - 0.5) * 40;
    out.push(
      <path
        key={i}
        d={starPath(r)}
        transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinejoin="round"
      />,
    );
  }
  return <>{out}</>;
};

/** Macchia d'inchiostro con schizzi e colature */
export const Splat: React.FC<{x: number; y: number; r: number; seed: string; color?: string; drip?: number; at?: number}> = ({
  x,
  y,
  r,
  seed,
  color = BLUE,
  drip = 1,
  at = 0,
}) => {
  const f = useStep(2);
  const s = pop(f, at, 4);
  if (!s) return null;
  const pts: string[] = [];
  const N = 22;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const spike = random(`${seed}s${i}`) > 0.7 ? 1.5 + random(`${seed}k${i}`) * 0.8 : 0.85 + random(`${seed}k${i}`) * 0.3;
    pts.push(`${(Math.cos(a) * r * spike).toFixed(1)} ${(Math.sin(a) * r * spike).toFixed(1)}`);
  }
  // le colature si allungano col tempo
  const len = Math.min(1, (f - at) / 30) * drip;
  const drops = [0, 1, 2].map((i) => {
    const dx = (random(`${seed}d${i}`) - 0.5) * r * 1.4;
    const dl = r * (1 + random(`${seed}l${i}`) * 2.5) * len;
    const w = r * (0.18 + random(`${seed}w${i}`) * 0.15);
    return (
      <g key={i}>
        <line x1={dx} y1={0} x2={dx} y2={dl} stroke={color} strokeWidth={w} strokeLinecap="round" />
        <circle cx={dx} cy={dl} r={w * 0.8} fill={color} />
      </g>
    );
  });
  const dots = [0, 1, 2, 3].map((i) => {
    const a = random(`${seed}pa${i}`) * Math.PI * 2;
    const d = r * (2 + random(`${seed}pd${i}`));
    return <circle key={`p${i}`} cx={Math.cos(a) * d} cy={Math.sin(a) * d} r={r * (0.1 + random(`${seed}pr${i}`) * 0.15)} fill={color} />;
  });
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M${pts.join(' L')}Z`} fill={color} strokeLinejoin="round" />
      {drops}
      {dots}
    </g>
  );
};

/**
 * Testo "lettera anonima": ogni lettera nel suo riquadro, storta, con font e
 * dimensioni leggermente diversi. Le parole compaiono una alla volta.
 */
export const Ransom: React.FC<{
  lines: string[];
  y: number;
  size?: number;
  at?: number;
  every?: number;
  fg?: string;
  bg?: string;
  seed: string;
}> = ({lines, y, size = 120, at = 0, every = 5, fg = PAPER, bg = BLUE, seed}) => {
  const f = useStep(2);
  const cw = size * 0.74;
  let word = 0;
  return (
    <g>
      {lines.map((line, li) => {
        const chars = [...line];
        const x0 = (W - chars.length * cw) / 2 + cw / 2;
        const cy = y + li * size * 1.22;
        let wordAt = at + word * every;
        return chars.map((ch, ci) => {
          if (ch === ' ') {
            word++;
            wordAt = at + word * every;
            return null;
          }
          if (ci === chars.length - 1) word++;
          const s = pop(f, wordAt, 4);
          if (!s) return null;
          const k = `${seed}${li}-${ci}`;
          const rot = (random(`${k}r`) - 0.5) * 12;
          const sc = 0.92 + random(`${k}s`) * 0.16;
          const dy = (random(`${k}y`) - 0.5) * size * 0.12;
          const inv = random(`${k}i`) > 0.72;
          const font = random(`${k}f`) > 0.5 ? TYPE : BLOCK;
          const bw = cw * 0.92;
          const bh = size * 1.02;
          return (
            <g key={k} transform={`translate(${x0 + ci * cw} ${cy + dy}) rotate(${rot}) scale(${s * sc})`}>
              <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} fill={inv ? fg : 'none'} stroke={fg} strokeWidth={5} />
              <text
                x={0}
                y={size * 0.3}
                textAnchor="middle"
                fontFamily={font}
                fontSize={font === TYPE ? size * 0.95 : size * 0.78}
                fill={inv ? bg : fg}
              >
                {ch}
              </text>
            </g>
          );
        });
      })}
    </g>
  );
};

import '@fontsource/archivo-black';
import '@fontsource/special-elite';
import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';

export const FPS = 24;
export const W = 1080;
export const H = 1920;

/**
 * Look "risograph" a due inchiostri: verde petrolio per le linee, corallo per i pieni,
 * su carta color crema. I due inchiostri stanno su livelli separati, sovrapposti in
 * moltiplica e leggermente fuori registro, come in una vera stampa a due passaggi.
 */
export const TEAL = '#0E5C5A';
export const CORAL = '#F0564A';
export const PAPER = '#F3EAD8';
export const SW = 9;

export const DISPLAY = '"Archivo Black", "Impact", sans-serif';
export const TYPE = '"Special Elite", "Courier New", monospace';

export const useStep = (n = 2) => Math.floor(useCurrentFrame() / n) * n;
export const prog = (f: number, a: number, b: number) => Math.min(1, Math.max(0, (f - a) / (b - a)));
export const pop = (f: number, at: number, dur = 6) => {
  const t = prog(f, at, at + dur);
  if (t <= 0) return 0;
  return t < 1 ? 1 + Math.sin(t * Math.PI) * 0.25 - (1 - t) * 0.6 : 1;
};
/** secondi (relativi alla scena) → fotogrammi */
export const sec = (s: number) => Math.round(s * FPS);

type Layer = 'fill' | 'line';
const LayerCtx = React.createContext<Layer>('line');
export const useLayer = () => React.useContext(LayerCtx);

export type Ink = 'a' | 'b' | 'p' | 'w' | 'dots' | 'none';

/**
 * Forma "consapevole del livello": ogni forma piena copre ciò che sta sotto in entrambi
 * i livelli, ma stampa il proprio colore solo nel suo livello.
 * fill: a = corallo · b = petrolio · p = carta · w = buca (lascia vedere la carta) · dots = retino corallo
 * st: colore del contorno (b petrolio di default, a corallo, false nessuno)
 */
export const S: React.FC<
  {el?: 'path' | 'circle' | 'ellipse' | 'rect' | 'line' | 'polyline'; fill?: Ink; st?: 'a' | 'b' | false; sw?: number} & React.SVGProps<SVGElement>
> = ({el = 'path', fill = 'none', st = 'b', sw = SW, ...rest}) => {
  const layer = useLayer();
  const ids = useIds();
  const common = {strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round', ...rest} as Record<string, unknown>;
  const stroke = (st === 'a' && layer === 'fill') || (st === 'b' && layer === 'line') ? (st === 'a' ? CORAL : TEAL) : undefined;
  let f: string;
  if (fill === 'none') f = 'none';
  else if (fill === 'w') f = '#FFFFFF'; // in moltiplica il bianco non stampa nulla
  else if (layer === 'fill') f = fill === 'a' ? CORAL : fill === 'dots' ? `url(#${ids.dots})` : PAPER;
  else f = fill === 'b' ? TEAL : PAPER;
  if (f === 'none' && !stroke) return null;
  if (layer === 'fill' && fill === 'dots') {
    return (
      <>
        {React.createElement(el, {...common, fill: PAPER, stroke: undefined})}
        {React.createElement(el, {...common, fill: f, stroke})}
      </>
    );
  }
  return React.createElement(el, {...common, fill: f, stroke});
};

/** Tubo con contorno (maniche, dita): contorno petrolio + interno del colore scelto */
export const Tube: React.FC<{d: string; w: number; fill?: Ink}> = ({d, w, fill = 'p'}) => {
  const layer = useLayer();
  const ids = useIds();
  const inner = layer === 'fill' ? (fill === 'a' ? CORAL : fill === 'dots' ? `url(#${ids.dots})` : PAPER) : fill === 'b' ? TEAL : PAPER;
  const props = {d, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round'} as const;
  return (
    <>
      <path {...props} stroke={layer === 'line' ? TEAL : PAPER} strokeWidth={w + SW * 2} />
      {fill === 'dots' && layer === 'fill' && <path {...props} stroke={PAPER} strokeWidth={w} />}
      <path {...props} stroke={inner} strokeWidth={w} />
    </>
  );
};

// id unici per ogni SVG (filtri e retino), altrimenti url(#…) prende il primo del documento
const IdCtx = React.createContext({dots: 'dots', ink: 'ink'});
export const useIds = () => React.useContext(IdCtx);

const Filters: React.FC<{seed: number; layer: Layer}> = ({seed, layer}) => {
  const ids = useIds();
  return (
  <defs>
    <pattern id={ids.dots} width={16} height={16} patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
      <circle cx={8} cy={8} r={4.6} fill={CORAL} />
    </pattern>
    <filter id={ids.ink} filterUnits="userSpaceOnUse" x={-60} y={-60} width={W + 120} height={H + 120} colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={2} seed={seed + (layer === 'fill' ? 50 : 0)} result="w1" />
      <feDisplacementMap in="SourceGraphic" in2="w1" scale={layer === 'fill' ? 8 : 5} xChannelSelector="R" yChannelSelector="G" result="d1" />
      <feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves={1} seed={seed + 20} result="w2" />
      <feDisplacementMap in="d1" in2="w2" scale={3} xChannelSelector="R" yChannelSelector="G" result="d2" />
      <feTurbulence type="fractalNoise" baseFrequency={layer === 'fill' ? 0.45 : 0.7} numOctaves={2} seed={seed + 40} result="g" />
      <feColorMatrix
        in="g"
        type="matrix"
        values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${layer === 'fill' ? '9 0 0 0 -2.2' : '18 0 0 0 -4.4'}`}
        result="mask"
      />
      <feComposite in="d2" in2="mask" operator="in" />
    </filter>
  </defs>
  );
};

const LayerSvg: React.FC<{layer: Layer; children: React.ReactNode; offset?: [number, number]}> = ({layer, children, offset = [0, 0]}) => {
  const seed = Math.floor(useCurrentFrame() / 2) % 7;
  const uid = React.useId().replace(/:/g, '');
  const ids = React.useMemo(() => ({dots: `dots${uid}`, ink: `ink${uid}`}), [uid]);
  return (
    <IdCtx.Provider value={ids}>
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: layer === 'fill' ? 0.92 : 0.95}}
    >
      <Filters seed={seed} layer={layer} />
      <g filter={`url(#${ids.ink})`}>
        <g transform={`translate(${offset[0]} ${offset[1]})`}>
          <LayerCtx.Provider value={layer}>{children}</LayerCtx.Provider>
        </g>
      </g>
    </svg>
    </IdCtx.Provider>
  );
};

/** Carta: crema con fibre leggere (texture fissa, non cambia nel tempo) */
export const Paper: React.FC = () => (
  <AbsoluteFill style={{background: PAPER}}>
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: 0.5}}>
      <filter id="paper">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={3} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.85  0 0 0 0 0.8  0 0 0 0 0.72  0 0 0 -1.4 1.05" />
      </filter>
      <rect width={W} height={H} filter="url(#paper)" />
    </svg>
  </AbsoluteFill>
);

/**
 * Una scena: il contenuto viene stampato due volte (corallo e petrolio).
 * Il livello corallo è spostato di qualche pixel e "balla" un poco: il fuori registro.
 */
export const Riso: React.FC<{zoom?: number; origin?: [number, number]; shake?: number; children: React.ReactNode; seed?: string}> = ({
  zoom = 1,
  origin = [W / 2, H / 2],
  shake = 0,
  children,
  seed = 'r',
}) => {
  const f = useCurrentFrame();
  const k = Math.floor(f / 4);
  const reg: [number, number] = [5 + Math.round(random(`${seed}rx${k}`) * 3), -4 + Math.round(random(`${seed}ry${k}`) * 3)];
  const j = Math.floor(f / 2);
  const sx = shake ? (random(`sx${j}`) - 0.5) * shake : 0;
  const sy = shake ? (random(`sy${j}`) - 0.5) * shake : 0;
  const inner = (
    <g transform={`translate(${sx} ${sy}) translate(${origin[0]} ${origin[1]}) scale(${zoom}) translate(${-origin[0]} ${-origin[1]})`}>{children}</g>
  );
  return (
    <AbsoluteFill>
      <LayerSvg layer="fill" offset={reg}>
        {inner}
      </LayerSvg>
      <LayerSvg layer="line">{inner}</LayerSvg>
    </AbsoluteFill>
  );
};

export const starPath = (r: number) => {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    p.push(`${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`);
  }
  return `M${p.join(' L')}Z`;
};

export const heartPath = (r: number) =>
  `M0 ${r * 0.9} C${-r * 1.5} ${-r * 0.1} ${-r * 0.9} ${-r * 1.25} 0 ${-r * 0.45} C${r * 0.9} ${-r * 1.25} ${r * 1.5} ${-r * 0.1} 0 ${r * 0.9} Z`;

/** Stelline sparse (a = alcune piene corallo) */
export const Stars: React.FC<{seed: string; n?: number; from?: number; area?: [number, number, number, number]}> = ({
  seed,
  n = 14,
  from = 0,
  area = [60, 120, W - 60, 1200],
}) => {
  const f = useStep(2);
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const x = area[0] + random(`${seed}x${i}`) * (area[2] - area[0]);
        const y = area[1] + random(`${seed}y${i}`) * (area[3] - area[1]);
        const r = 12 + random(`${seed}r${i}`) * 16;
        const s = pop(f, from + Math.floor(random(`${seed}t${i}`) * 16), 4) * (Math.floor((f + i * 2) / 6) % 4 === 0 ? 0.75 : 1);
        if (!s) return null;
        return (
          <S
            key={i}
            d={starPath(r)}
            transform={`translate(${x} ${y}) rotate(${(random(`${seed}a${i}`) - 0.5) * 40}) scale(${s})`}
            fill={i % 3 === 0 ? 'a' : 'none'}
            st={i % 3 === 0 ? false : 'b'}
            sw={5}
          />
        );
      })}
    </>
  );
};

/** Testo stampato in petrolio (nel livello corallo copre con la carta) */
export const Txt: React.FC<{x: number; y: number; text: string; size: number; font?: string; anchor?: 'start' | 'middle' | 'end'; ink?: 'a' | 'b'}> = ({
  x,
  y,
  text,
  size,
  font = DISPLAY,
  anchor = 'middle',
  ink = 'b',
}) => <S el={'text' as 'path'} x={x} y={y} fill={ink} st={false} textAnchor={anchor} fontFamily={font} fontSize={size} {...({children: text} as object)} />;

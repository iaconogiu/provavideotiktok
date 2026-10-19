import '@fontsource/archivo-black';
import '@fontsource/special-elite';
import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';

export const FPS = 24;
export const W = 1080;
export const H = 1920;

/**
 * Look "risograph" a due inchiostri: verde petrolio e corallo su carta crema.
 * I due inchiostri stanno su livelli separati, sovrapposti in moltiplica e
 * leggermente fuori registro, come in una vera stampa a due passaggi.
 */
export const TEAL = '#0E5C5A';
export const CORAL = '#F0564A';
export const PAPER = '#F3EAD8';
const SKIN = '#EED9BC';
const WHITE = '#FFFFFF'; // in moltiplica il bianco non stampa: serve a coprire senza colorare
export const SW = 8;

// la cornice dell'illustrazione: tutto il disegno sta qui dentro, il testo va sotto
export const PX = 60;
export const PY = 150;
export const PW = 960;
export const PH = 1160;

export const DISPLAY = '"Archivo Black", "Impact", sans-serif';
export const TYPE = '"Special Elite", "Courier New", monospace';

export const useStep = (n = 2) => Math.floor(useCurrentFrame() / n) * n;
export const prog = (f: number, a: number, b: number) => Math.min(1, Math.max(0, (f - a) / (b - a)));
export const ease = (t: number) => t * t * (3 - 2 * t);
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

/**
 * a = corallo pieno · b = petrolio pieno · p = carta/pelle · w = copre senza stampare
 * c1 c2 c3 = retino corallo chiaro→fitto · t1 t2 t3 = retino petrolio chiaro→fitto
 * g1 g2 = luce: retino corallo trasparente, non copre ciò che sta dietro (aloni, fasci)
 */
export type Ink = 'a' | 'b' | 'p' | 'w' | 'c1' | 'c2' | 'c3' | 't1' | 't2' | 't3' | 'g1' | 'g2' | 'none';
const CORAL_SCREENS = ['c1', 'c2', 'c3'];
const TEAL_SCREENS = ['t1', 't2', 't3'];

// id unici per ogni SVG (filtri, retini, ritaglio): url(#…) prende il primo del documento
type Ids = {ink: string; clip: string; [k: string]: string};
const IdCtx = React.createContext<Ids>({ink: 'ink', clip: 'clip'});
const useIds = () => React.useContext(IdCtx);

/** colore di un inchiostro nel livello dato, e se sotto al retino serve un fondo che copra */
const paint = (fill: Ink, layer: Layer, ids: Ids): [string, boolean] => {
  if (fill === 'none') return ['none', false];
  if (fill === 'g1' || fill === 'g2') return layer === 'fill' ? [`url(#${ids[fill === 'g1' ? 'c1' : 'c2']})`, false] : ['none', false];
  if (layer === 'fill') {
    if (fill === 'a') return [CORAL, false];
    if (fill === 'p') return [SKIN, false];
    if (CORAL_SCREENS.includes(fill)) return [`url(#${ids[fill]})`, true];
    return [WHITE, false];
  }
  if (fill === 'b') return [TEAL, false];
  if (TEAL_SCREENS.includes(fill)) return [`url(#${ids[fill]})`, true];
  return [WHITE, false];
};

/**
 * Forma "consapevole del livello": ogni forma piena copre ciò che sta dietro in entrambi
 * i livelli, ma stampa il proprio colore solo nel suo livello.
 * st: contorno petrolio (b, default), corallo (a) o nessuno (false)
 */
export const S: React.FC<
  {el?: 'path' | 'circle' | 'ellipse' | 'rect' | 'line' | 'polyline' | 'polygon'; fill?: Ink; st?: 'a' | 'b' | false; sw?: number} & React.SVGProps<SVGElement>
> = ({el = 'path', fill = 'none', st = 'b', sw = SW, ...rest}) => {
  const layer = useLayer();
  const ids = useIds();
  const common = {strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round', ...rest} as Record<string, unknown>;
  const stroke = (st === 'a' && layer === 'fill') || (st === 'b' && layer === 'line') ? (st === 'a' ? CORAL : TEAL) : undefined;
  const [f, under] = paint(fill, layer, ids);
  if (f === 'none' && !stroke) return null;
  if (under) {
    return (
      <>
        {React.createElement(el, {...common, fill: WHITE, stroke: undefined})}
        {React.createElement(el, {...common, fill: f, stroke})}
      </>
    );
  }
  return React.createElement(el, {...common, fill: f, stroke});
};

/** Tubo con contorno (fili, pali, braccia): contorno petrolio + interno dell'inchiostro scelto */
export const Tube: React.FC<{d: string; w: number; fill?: Ink}> = ({d, w, fill = 'p'}) => {
  const layer = useLayer();
  const ids = useIds();
  const [inner, under] = paint(fill, layer, ids);
  const props = {d, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round'} as const;
  return (
    <>
      <path {...props} stroke={layer === 'line' ? TEAL : WHITE} strokeWidth={w + SW * 2} />
      {under && <path {...props} stroke={WHITE} strokeWidth={w} />}
      <path {...props} stroke={inner} strokeWidth={w} />
    </>
  );
};

/** Testo stampato (petrolio o corallo) */
export const Txt: React.FC<{x: number; y: number; text: string; size: number; font?: string; anchor?: 'start' | 'middle' | 'end'; ink?: 'a' | 'b'}> = ({
  x,
  y,
  text,
  size,
  font = DISPLAY,
  anchor = 'middle',
  ink = 'b',
}) => <S el={'text' as 'path'} x={x} y={y} fill={ink} st={false} textAnchor={anchor} fontFamily={font} fontSize={size} {...({children: text} as object)} />;

const SCREENS: [string, string, number, number, number][] = [
  // id, colore, raggio, passo, angolo (angoli diversi come nei veri retini)
  ['c1', CORAL, 2.4, 15, 30],
  ['c2', CORAL, 4.3, 15, 30],
  ['c3', CORAL, 6.2, 15, 30],
  ['t1', TEAL, 2.1, 13, 75],
  ['t2', TEAL, 3.8, 13, 75],
  ['t3', TEAL, 5.4, 13, 75],
];

const Defs: React.FC<{seed: number; layer: Layer}> = ({seed, layer}) => {
  const ids = useIds();
  return (
    <defs>
      {SCREENS.map(([k, c, r, step, ang]) => (
        <pattern key={k} id={ids[k]} width={step} height={step} patternUnits="userSpaceOnUse" patternTransform={`rotate(${ang})`}>
          <circle cx={step / 2} cy={step / 2} r={r} fill={c} />
        </pattern>
      ))}
      <clipPath id={ids.clip}>
        <rect x={PX} y={PY} width={PW} height={PH} rx={14} />
      </clipPath>
      <filter id={ids.ink} filterUnits="userSpaceOnUse" x={-60} y={-60} width={W + 120} height={H + 120} colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={2} seed={seed + (layer === 'fill' ? 50 : 0)} result="w1" />
        <feDisplacementMap in="SourceGraphic" in2="w1" scale={layer === 'fill' ? 6 : 4} xChannelSelector="R" yChannelSelector="G" result="d1" />
        <feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves={1} seed={seed + 20} result="w2" />
        <feDisplacementMap in="d1" in2="w2" scale={2.5} xChannelSelector="R" yChannelSelector="G" result="d2" />
        <feTurbulence type="fractalNoise" baseFrequency={layer === 'fill' ? 0.45 : 0.7} numOctaves={2} seed={seed + 40} result="g" />
        <feColorMatrix
          in="g"
          type="matrix"
          values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${layer === 'fill' ? '9 0 0 0 -2.1' : '18 0 0 0 -4.3'}`}
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
  const ids = React.useMemo(() => {
    const o: Ids = {ink: `ink${uid}`, clip: `clip${uid}`};
    for (const [k] of SCREENS) o[k] = `${k}${uid}`;
    return o;
  }, [uid]);
  return (
    <IdCtx.Provider value={ids}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply'}}>
        <Defs seed={seed} layer={layer} />
        <g filter={`url(#${ids.ink})`}>
          <g transform={`translate(${offset[0]} ${offset[1]})`}>
            <LayerCtx.Provider value={layer}>{children}</LayerCtx.Provider>
          </g>
        </g>
      </svg>
    </IdCtx.Provider>
  );
};

/** Carta: crema con fibre leggere (texture fissa) */
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

const ClipPanel: React.FC<{children: React.ReactNode}> = ({children}) => <g clipPath={`url(#${useIds().clip})`}>{children}</g>;

/**
 * Una scena: il contenuto viene stampato due volte (corallo e petrolio), con il corallo
 * fuori registro di qualche pixel. Con panel il disegno usa coordinate della cornice
 * (0..PW, 0..PH) e viene ritagliato dentro di essa.
 */
export const Riso: React.FC<{
  zoom?: number;
  origin?: [number, number];
  pan?: [number, number];
  shake?: number;
  panel?: boolean;
  children: React.ReactNode;
  seed?: string;
}> = ({zoom = 1, origin, pan = [0, 0], shake = 0, panel = true, children, seed = 'r'}) => {
  const f = useCurrentFrame();
  const k = Math.floor(f / 4);
  const reg: [number, number] = [4 + Math.round(random(`${seed}rx${k}`) * 2), -3 + Math.round(random(`${seed}ry${k}`) * 2)];
  const j = Math.floor(f / 2);
  const sx = shake ? (random(`sx${j}`) - 0.5) * shake : 0;
  const sy = shake ? (random(`sy${j}`) - 0.5) * shake : 0;
  const o = origin ?? (panel ? [PW / 2, PH / 2] : [W / 2, H / 2]);
  const cam = (
    <g transform={`translate(${sx - pan[0]} ${sy - pan[1]}) translate(${o[0]} ${o[1]}) scale(${zoom}) translate(${-o[0]} ${-o[1]})`}>{children}</g>
  );
  const inner = panel ? (
    <>
      <ClipPanel>
        <g transform={`translate(${PX} ${PY})`}>{cam}</g>
      </ClipPanel>
      <S el="rect" x={PX} y={PY} width={PW} height={PH} rx={14} sw={9} />
    </>
  ) : (
    cam
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

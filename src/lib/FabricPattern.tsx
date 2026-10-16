import React, {useMemo} from 'react';
import {random} from 'remotion';
import {FABRIC} from './theme';

type Shape =
  | {kind: 'squiggle'; d: string; color: string; w: number; delay: number}
  | {kind: 'tri'; points: string; color: string; delay: number}
  | {kind: 'dot'; cx: number; cy: number; r: number; color: string; delay: number}
  | {kind: 'zig'; d: string; color: string; w: number; delay: number}
  | {kind: 'ring'; cx: number; cy: number; r: number; color: string; delay: number};

const buildTile = (seed: string, size: number, colors: string[], density: number): Shape[] => {
  const r = (k: string) => random(`${seed}-${k}`);
  const pick = (k: string) => colors[Math.floor(r(k) * colors.length) % colors.length];
  const shapes: Shape[] = [];
  const n = Math.round(38 * density);
  for (let i = 0; i < n; i++) {
    const x = r(`x${i}`) * size;
    const y = r(`y${i}`) * size;
    const t = r(`t${i}`);
    const color = pick(`c${i}`);
    const delay = r(`d${i}`);
    if (t < 0.3) {
      // scarabocchio sinuoso, tipico delle moquette anni '90
      const len = size * (0.12 + r(`l${i}`) * 0.12);
      const a = r(`a${i}`) * Math.PI * 2;
      const dx = Math.cos(a) * len;
      const dy = Math.sin(a) * len;
      const nx = -dy * 0.6;
      const ny = dx * 0.6;
      const d = `M ${x} ${y} q ${dx / 4 + nx} ${dy / 4 + ny} ${dx / 2} ${dy / 2} t ${dx / 2} ${dy / 2}`;
      shapes.push({kind: 'squiggle', d, color, w: size * 0.014, delay});
    } else if (t < 0.5) {
      const s = size * (0.035 + r(`s${i}`) * 0.05);
      const a = r(`a${i}`) * Math.PI * 2;
      const pts = [0, 1, 2]
        .map((k) => {
          const aa = a + (k * Math.PI * 2) / 3;
          return `${x + Math.cos(aa) * s},${y + Math.sin(aa) * s}`;
        })
        .join(' ');
      shapes.push({kind: 'tri', points: pts, color, delay});
    } else if (t < 0.7) {
      shapes.push({kind: 'dot', cx: x, cy: y, r: size * (0.008 + r(`s${i}`) * 0.018), color, delay});
    } else if (t < 0.87) {
      const seg = size * 0.025;
      const steps = 4;
      let d = `M ${x} ${y}`;
      for (let k = 1; k <= steps; k++) d += ` L ${x + k * seg} ${y + (k % 2 ? -seg : 0)}`;
      shapes.push({kind: 'zig', d, color, w: size * 0.01, delay});
    } else {
      shapes.push({kind: 'ring', cx: x, cy: y, r: size * (0.02 + r(`s${i}`) * 0.02), color, delay});
    }
  }
  return shapes;
};

export const FabricPattern: React.FC<{
  id: string;
  seed?: string;
  tile?: number;
  /** 0..1, le forme compaiono una dopo l'altra */
  reveal?: number;
  /** spostamento del pattern (parallax) */
  offsetX?: number;
  offsetY?: number;
  base?: string;
  colors?: string[];
  density?: number;
  /** aggiunge la trama del tessuto (fili) */
  weave?: boolean;
  style?: React.CSSProperties;
}> = ({
  id,
  seed = 'bus',
  tile = 260,
  reveal = 1,
  offsetX = 0,
  offsetY = 0,
  base = FABRIC.base,
  colors = FABRIC.colors,
  density = 1,
  weave = true,
  style,
}) => {
  const shapes = useMemo(() => buildTile(seed, tile, colors, density), [seed, tile, colors, density]);

  // Ripete le forme ai bordi del tile per un pattern senza cuciture
  const wrapped = [-tile, 0, tile];

  const renderShape = (s: Shape, i: number, ox: number, oy: number) => {
    const local = Math.min(1, Math.max(0, (reveal - s.delay * 0.7) / 0.3));
    if (local <= 0) return null;
    const sc = 0.4 + local * 0.6;
    const common = {
      opacity: local,
      key: `${i}-${ox}-${oy}`,
    };
    const tr = (cx: number, cy: number) =>
      `translate(${ox + cx} ${oy + cy}) scale(${sc}) translate(${-cx} ${-cy})`;
    switch (s.kind) {
      case 'squiggle':
      case 'zig': {
        const m = /M ([\d.-]+) ([\d.-]+)/.exec(s.d)!;
        return (
          <path
            {...common}
            d={s.d}
            transform={tr(+m[1], +m[2])}
            stroke={s.color}
            strokeWidth={s.w}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        );
      }
      case 'tri': {
        const [px, py] = s.points.split(' ')[0].split(',').map(Number);
        return <polygon {...common} points={s.points} fill={s.color} transform={tr(px, py)} />;
      }
      case 'dot':
        return <circle {...common} cx={s.cx} cy={s.cy} r={s.r} fill={s.color} transform={tr(s.cx, s.cy)} />;
      case 'ring':
        return (
          <circle
            {...common}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill="none"
            stroke={s.color}
            strokeWidth={tile * 0.008}
            transform={tr(s.cx, s.cy)}
          />
        );
    }
  };

  return (
    <svg
      width="100%"
      height="100%"
      style={{position: 'absolute', inset: 0, display: 'block', ...style}}
      preserveAspectRatio="none"
    >
      <defs>
        <pattern
          id={`fab-${id}`}
          width={tile}
          height={tile}
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${offsetX} ${offsetY})`}
        >
          <rect width={tile} height={tile} fill={base} />
          {wrapped.flatMap((ox) => wrapped.map((oy) => shapes.map((s, i) => renderShape(s, i, ox, oy))))}
        </pattern>
        {weave && (
          <pattern id={`weave-${id}`} width={6} height={6} patternUnits="userSpaceOnUse">
            <rect width={6} height={3} fill="rgba(255,255,255,0.05)" />
            <rect width={3} height={6} fill="rgba(0,0,0,0.10)" />
          </pattern>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#fab-${id})`} />
      {weave && <rect width="100%" height="100%" fill={`url(#weave-${id})`} />}
    </svg>
  );
};

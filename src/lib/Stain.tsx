import React, {useMemo} from 'react';
import {random} from 'remotion';

/** Macchia organica generata (caffè, fango, acqua, gomma) */
export const Stain: React.FC<{
  seed: string;
  x: number;
  y: number;
  size: number;
  color: string;
  progress: number; // 0..1 comparsa
  opacity?: number;
  blend?: React.CSSProperties['mixBlendMode'];
}> = ({seed, x, y, size, color, progress, opacity = 0.85, blend = 'normal'}) => {
  const d = useMemo(() => {
    const n = 14;
    const pts = Array.from({length: n}, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const r = 0.32 + random(`${seed}-${i}`) * 0.16;
      return [50 + Math.cos(a) * r * 100, 50 + Math.sin(a) * r * 100];
    });
    let p = `M ${(pts[0][0] + pts[n - 1][0]) / 2} ${(pts[0][1] + pts[n - 1][1]) / 2}`;
    for (let i = 0; i < n; i++) {
      const c = pts[i];
      const nx = pts[(i + 1) % n];
      p += ` Q ${c[0]} ${c[1]} ${(c[0] + nx[0]) / 2} ${(c[1] + nx[1]) / 2}`;
    }
    return p;
  }, [seed]);
  const drops = useMemo(
    () =>
      Array.from({length: 5}, (_, i) => ({
        a: random(`${seed}-da${i}`) * Math.PI * 2,
        r: 0.5 + random(`${seed}-dr${i}`) * 0.25,
        s: 3 + random(`${seed}-ds${i}`) * 5,
      })),
    [seed],
  );
  if (progress <= 0) return null;
  const sc = Math.min(1, progress);
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{position: 'absolute', left: x - size / 2, top: y - size / 2, opacity: opacity * Math.min(1, progress * 2), mixBlendMode: blend, overflow: 'visible'}}
    >
      <g transform={`translate(50 50) scale(${sc}) translate(-50 -50)`}>
        <path d={d} fill={color} />
        <path d={d} fill="none" stroke={color} strokeWidth={3} opacity={0.6} transform="translate(50 50) scale(0.9) translate(-50 -50)" />
        {drops.map((p, i) => (
          <circle key={i} cx={50 + Math.cos(p.a) * p.r * 100 * sc} cy={50 + Math.sin(p.a) * p.r * 100 * sc} r={p.s * sc} fill={color} />
        ))}
      </g>
    </svg>
  );
};

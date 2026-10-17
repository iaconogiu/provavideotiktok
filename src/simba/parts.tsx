import React, {useMemo} from 'react';
import {random} from 'remotion';
import {DISPLAY, K, UI} from './theme';

/** Orologio analogico minimal */
export const Clock: React.FC<{size: number; hours: number; minutes: number; label: string; sub?: string; accent?: boolean; dark?: boolean}> = ({
  size,
  hours,
  minutes,
  label,
  sub,
  accent,
  dark = true,
}) => {
  const fg = dark ? K.paper : K.ink;
  const ha = ((hours % 12) + minutes / 60) * 30;
  const ma = minutes * 6;
  return (
    <div style={{width: size, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: size * 0.08, fontFamily: UI}}>
      <svg width={size} height={size} viewBox="-50 -50 100 100">
        <circle r={48} fill={dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'} stroke={accent ? K.sun : fg} strokeOpacity={accent ? 1 : 0.35} strokeWidth={1.4} />
        {Array.from({length: 12}, (_, i) => (
          <line key={i} x1={0} y1={-44} x2={0} y2={i % 3 === 0 ? -38 : -41} stroke={fg} strokeOpacity={0.6} strokeWidth={i % 3 === 0 ? 2 : 1} transform={`rotate(${i * 30})`} />
        ))}
        <line x1={0} y1={4} x2={0} y2={-24} stroke={fg} strokeWidth={3.4} strokeLinecap="round" transform={`rotate(${ha})`} />
        <line x1={0} y1={6} x2={0} y2={-36} stroke={accent ? K.sun : fg} strokeWidth={2} strokeLinecap="round" transform={`rotate(${ma})`} />
        <circle r={2.6} fill={K.sun} />
      </svg>
      <div style={{fontSize: size * 0.16, fontWeight: 800, letterSpacing: 2, color: fg, textTransform: 'uppercase'}}>{label}</div>
      {sub && <div style={{fontSize: size * 0.11, fontWeight: 500, color: K.gray, marginTop: -size * 0.06}}>{sub}</div>}
    </div>
  );
};

/** Anello di catena (per "freedom") */
export const ChainLink: React.FC<{w: number; vertical?: boolean; color?: string}> = ({w, vertical, color = K.paper}) => (
  <div
    style={{
      width: vertical ? w * 0.9 : w,
      height: vertical ? w * 0.2 : w * 0.55,
      borderRadius: w,
      border: `${w * 0.13}px solid ${color}`,
      boxShadow: 'inset 0 4px 10px rgba(255,255,255,0.25), 0 10px 30px rgba(0,0,0,0.5)',
    }}
  />
);

/** Albero della vita generato (motivo di "Miria"): rami e radici con disegno progressivo */
export const TreeOfLife: React.FC<{size: number; grow: number; color?: string; roots?: boolean}> = ({size, grow, color = K.paper, roots = true}) => {
  const segs = useMemo(() => {
    const out: {d: string; depth: number; w: number}[] = [];
    const branch = (x: number, y: number, a: number, len: number, depth: number, sign: 1 | -1, seed: string) => {
      if (depth > 7 || len < 4) return;
      const bend = (random(`${seed}b`) - 0.5) * 0.5;
      const x2 = x + Math.cos(a) * len;
      const y2 = y + Math.sin(a) * len * sign;
      const cx = x + Math.cos(a + bend) * len * 0.5;
      const cy = y + Math.sin(a + bend) * len * 0.5 * sign;
      out.push({d: `M ${x} ${y} Q ${cx} ${cy} ${x2} ${y2}`, depth, w: Math.max(0.6, 7 - depth)});
      const n = depth < 2 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const spread = 0.42 + random(`${seed}s${i}`) * 0.3;
        const na = a + (i - (n - 1) / 2) * spread * 1.4 + (random(`${seed}r${i}`) - 0.5) * 0.3;
        branch(x2, y2, na, len * (0.68 + random(`${seed}l${i}`) * 0.12), depth + 1, sign, `${seed}${i}`);
      }
    };
    branch(0, 0, -Math.PI / 2, 46, 0, 1, 't');
    if (roots) branch(0, 0, -Math.PI / 2, 22, 2, -1, 'r');
    return out;
  }, [roots]);
  return (
    <svg width={size} height={size} viewBox="-130 -230 260 300" style={{overflow: 'visible'}}>
      {segs.map((s, i) => {
        const p = Math.min(1, Math.max(0, grow * 8 - s.depth));
        if (p <= 0) return null;
        return (
          <path key={i} d={s.d} stroke={color} strokeWidth={s.w} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
        );
      })}
      {/* frutti/luci sulle punte */}
      {grow > 0.85 &&
        segs
          .filter((s) => s.depth === 7)
          .filter((_, i) => i % 3 === 0)
          .map((s, i) => {
            const m = /([\d.-]+) ([\d.-]+)$/.exec(s.d)!;
            return <circle key={i} cx={+m[1]} cy={+m[2]} r={2.6 * Math.min(1, (grow - 0.85) * 8)} fill={K.sun} />;
          })}
    </svg>
  );
};

/** Titolo tipografico 22SIMBA (titolo, non il logo ufficiale) */
export const Wordmark: React.FC<{size: number; color?: string; progress?: number; spacing?: number}> = ({size, color = K.paper, progress = 1, spacing = 0.02}) => {
  const letters = '22SIMBA'.split('');
  return (
    <div style={{fontFamily: DISPLAY, fontSize: size, lineHeight: 0.9, letterSpacing: size * spacing, color, display: 'flex', justifyContent: 'center'}}>
      {letters.map((l, i) => {
        const p = Math.min(1, Math.max(0, progress * letters.length - i));
        return (
          <span key={i} style={{display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 40}%) scaleY(${0.6 + p * 0.4})`, color: i < 2 ? K.sun : color}}>
            {l}
          </span>
        );
      })}
    </div>
  );
};

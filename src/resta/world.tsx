import React from 'react';
import {random} from 'remotion';
import {Ink, PH, PW, S, Tube, pop} from './riso';

/** Cielo a fasce di retino (in alto la prima): sfumatura fatta solo coi puntini */
export const Bands: React.FC<{y0?: number; y1: number; inks: Ink[]; x0?: number; x1?: number}> = ({y0 = 0, y1, inks, x0 = -200, x1 = PW + 400}) => {
  const h = (y1 - y0) / inks.length;
  return (
    <>
      {inks.map((ink, i) => (
        <S key={i} el="rect" x={x0} y={y0 + i * h} width={x1 - x0} height={h + 1} fill={ink} st={false} />
      ))}
    </>
  );
};

export const sparkPath = (r: number) => `M0 ${-r} Q${r * 0.18} ${-r * 0.18} ${r} 0 Q${r * 0.18} ${r * 0.18} 0 ${r} Q${-r * 0.18} ${r * 0.18} ${-r} 0 Q${-r * 0.18} ${-r * 0.18} 0 ${-r} Z`;

/** Stelline bucate nel cielo (color carta) che brillano a scatti */
export const Sparkles: React.FC<{f: number; seed: string; n?: number; area: [number, number, number, number]; from?: number; maxY?: number}> = ({
  f,
  seed,
  n = 24,
  area,
  from = 0,
  maxY = Infinity,
}) => (
  <>
    {Array.from({length: n}, (_, i) => {
      const x = area[0] + random(`${seed}x${i}`) * (area[2] - area[0]);
      const y = area[1] + random(`${seed}y${i}`) * (area[3] - area[1]);
      if (y > maxY) return null;
      const big = random(`${seed}b${i}`) > 0.8;
      const r = big ? 16 : 6 + random(`${seed}r${i}`) * 6;
      const tw = Math.floor((f + i * 3) / 6) % 5 === 0 ? 0.6 : 1;
      const s = pop(f, from + Math.floor(random(`${seed}t${i}`) * 14), 4) * tw;
      if (!s) return null;
      return <S key={i} d={sparkPath(r)} transform={`translate(${x} ${y}) scale(${s})`} fill={i % 7 === 0 ? 'a' : 'w'} st={false} />;
    })}
  </>
);

export const Moon: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => (
  <g transform={`translate(${x} ${y})`}>
    <S el="circle" r={r} fill="w" sw={6} />
    <S el="circle" cx={-r * 0.3} cy={-r * 0.2} r={r * 0.18} fill="t1" st={false} />
    <S el="circle" cx={r * 0.35} cy={r * 0.25} r={r * 0.12} fill="t1" st={false} />
    <S el="circle" cx={-r * 0.1} cy={r * 0.45} r={r * 0.08} fill="t1" st={false} />
  </g>
);

/** Profilo di città: palazzi pieni petrolio, finestre corallo che si accendono (lit 0→1) */
export const Skyline: React.FC<{
  base: number;
  width: number;
  seed: string;
  lit?: number;
  minH?: number;
  maxH?: number;
  ink?: Ink;
  clockAt?: number;
  clockF?: number;
  winOn?: (i: number) => boolean;
}> = ({base, width, seed, lit = 0, minH = 140, maxH = 380, ink = 'b', clockAt, clockF = 0, winOn}) => {
  const out: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  let wi = 0;
  while (x < width + 40) {
    const w = 90 + Math.floor(random(`${seed}w${k}`) * 90);
    const h = minH + random(`${seed}h${k}`) * (maxH - minH);
    const top = base - h;
    const roof = random(`${seed}r${k}`);
    out.push(<S key={`b${k}`} el="rect" x={x} y={top} width={w} height={h + 4} fill={ink} st={false} />);
    if (roof > 0.75) out.push(<S key={`a${k}`} d={`M${x + w * 0.5} ${top} L${x + w * 0.5} ${top - 50} M${x + w * 0.5 - 16} ${top - 34} L${x + w * 0.5 + 16} ${top - 34}`} sw={5} />);
    else if (roof > 0.5) out.push(<S key={`t${k}`} d={`M${x} ${top} L${x + w / 2} ${top - 40} L${x + w} ${top} Z`} fill={ink} st={false} />);
    // finestre
    for (let yy = top + 26; yy < base - 40; yy += 46) {
      for (let xx = x + 16; xx < x + w - 30; xx += 34) {
        const r = random(`${seed}win${wi}`);
        const on = winOn ? winOn(wi) : r < lit;
        if (on) out.push(<S key={`w${wi}`} el="rect" x={xx} y={yy} width={16} height={22} fill="a" st={false} />);
        wi++;
      }
    }
    x += w - 2;
    k++;
  }
  if (clockAt !== undefined) {
    const cx = clockAt;
    const top = base - maxH - 90;
    out.push(
      <g key="clock">
        <S el="rect" x={cx - 50} y={top} width={100} height={maxH + 94} fill={ink} st={false} />
        <S d={`M${cx - 58} ${top} L${cx} ${top - 110} L${cx + 58} ${top} Z`} fill={ink} st={false} />
        <S el="circle" cx={cx} cy={top + 60} r={36} fill="w" sw={5} />
        <S d={`M${cx} ${top + 60} l0 -26`} transform={`rotate(${clockF * 36} ${cx} ${top + 60})`} sw={5} />
        <S d={`M${cx} ${top + 60} l0 -18`} transform={`rotate(${clockF * 4} ${cx} ${top + 60})`} sw={7} />
      </g>,
    );
  }
  return <>{out}</>;
};

/** Mare: retino leggero + trattini di onda che scorrono + riflesso corallo sotto una luce */
export const Sea: React.FC<{y: number; f: number; glowX?: number; ink?: Ink; h?: number}> = ({y, f, glowX, ink = 't1', h = PH - y + 200}) => (
  <>
    <S el="rect" x={-200} y={y} width={PW + 600} height={h} fill={ink} st={false} />
    {Array.from({length: 9}, (_, row) => {
      const yy = y + 30 + row * row * 9 + row * 26;
      const len = 30 + row * 10;
      const gap = 60 + row * 26;
      const off = ((f * (2 + row * 0.6)) % gap) - gap;
      const segs: string[] = [];
      for (let x = off + (row % 2) * gap * 0.5; x < PW + 200; x += gap) segs.push(`M${x} ${yy} l${len} 0`);
      return <S key={row} d={segs.join(' ')} sw={4 + row * 0.6} />;
    })}
    {glowX !== undefined &&
      Array.from({length: 8}, (_, i) => {
        const yy = y + 14 + i * 34;
        const wob = Math.floor(f / 4 + i) % 2 ? 10 : -10;
        const w = 120 - i * 8 + (i % 2) * 30;
        return <S key={`g${i}`} d={`M${glowX - w / 2 + wob} ${yy} l${w} 0`} st="a" sw={10} />;
      })}
  </>
);

/** Faro con fascio di luce; beam = angolo in gradi (0 = destra, 90 = giù, 270 = su) */
export const Lighthouse: React.FC<{x: number; base: number; beam: number; spread?: number; strong?: boolean}> = ({x, base, beam, spread = 12, strong}) => {
  const lampY = base - 470;
  const a1 = ((beam - spread) * Math.PI) / 180;
  const a2 = ((beam + spread) * Math.PI) / 180;
  const L = 1600;
  const towerTop = base - 420;
  const wTop = 70;
  const wBot = 120;
  const bands = 5;
  return (
    <g>
      <S d={`M${x} ${lampY} L${x + Math.cos(a1) * L} ${lampY + Math.sin(a1) * L} L${x + Math.cos(a2) * L} ${lampY + Math.sin(a2) * L} Z`} fill={strong ? 'g2' : 'g1'} st={false} />
      {/* scogli */}
      <S d={`M${x - 220} ${base + 40} C${x - 200} ${base - 40} ${x - 120} ${base - 50} ${x - 60} ${base - 10} C${x} ${base - 40} ${x + 120} ${base - 60} ${x + 180} ${base} C${x + 220} ${base + 20} ${x + 260} ${base + 40} ${x + 280} ${base + 60} L${x - 240} ${base + 60} Z`} fill="b" />
      {/* torre a fasce */}
      {Array.from({length: bands}, (_, i) => {
        const y0 = base - 10 - (i * 410) / bands;
        const y1 = base - 10 - ((i + 1) * 410) / bands;
        const w0 = wBot - ((wBot - wTop) * i) / bands;
        const w1 = wBot - ((wBot - wTop) * (i + 1)) / bands;
        return <S key={i} d={`M${x - w0} ${y0} L${x - w1} ${y1} L${x + w1} ${y1} L${x + w0} ${y0} Z`} fill={i % 2 ? 'w' : 'a'} />;
      })}
      <S el="rect" x={x - 92} y={towerTop - 16} width={184} height={20} fill="b" />
      <S el="rect" x={x - 50} y={lampY - 40} width={100} height={70} fill="w" />
      <S el="circle" cx={x} cy={lampY} r={22} fill="a" st={false} />
      <S d={`M${x - 50} ${lampY - 40} L${x + 50} ${lampY - 40} L${x} ${lampY - 100} Z`} fill="b" />
      <S d={`M${x} ${lampY - 100} l0 -20`} sw={6} />
    </g>
  );
};

/** Barchetta a vela con lanterna; people: 0 nessuno, 1 lui, 2 lui e lei (di spalle) */
export const Boat: React.FC<{people?: 0 | 1 | 2; sail?: Ink}> = ({people = 1, sail = 'w'}) => (
  <g>
    <S d="M0 -230 L0 -10" sw={7} />
    <S d="M8 -220 L8 -60 L120 -60 Z" fill={sail} />
    <S d="M-8 -200 L-8 -60 L-80 -60 Z" fill={sail === 'w' ? 'c1' : 'w'} />
    <S d="M0 -230 L36 -218 L0 -206 Z" fill="a" st={false} />
    {people >= 1 && (
      <g transform="translate(-40 -40)">
        <S el="circle" r={20} fill="p" sw={6} />
        <S d="M-21 -2 C-22 -30 22 -30 21 -2 Z" fill="a" sw={6} />
        <S el="circle" cx={0} cy={-26} r={7} fill="c2" sw={4} />
      </g>
    )}
    {people >= 2 && (
      <g transform="translate(-4 -40)">
        {[-14, 0, 14, -8, 8].map((dx, i) => (
          <S key={i} el="circle" cx={dx} cy={i < 3 ? -10 : 4} r={13} fill="b" st={false} />
        ))}
      </g>
    )}
    <S d="M-150 -30 L150 -30 L110 30 L-110 30 Z" fill="b" />
    <S el="circle" cx={-120} cy={-56} r={9} fill="a" st={false} />
    <S d="M-120 -30 L-120 -48" sw={4} />
  </g>
);

/** Uccellino posato (verso destra) */
export const Perched: React.FC<{flip?: boolean}> = ({flip}) => (
  <g transform={flip ? 'scale(-1 1)' : undefined}>
    <S d="M-26 -6 L-44 6 L-30 8 Z" fill="b" st={false} />
    <S el="ellipse" cx={0} cy={-14} rx={26} ry={18} fill="b" st={false} />
    <S el="circle" cx={20} cy={-30} r={12} fill="b" st={false} />
    <S d="M30 -32 L42 -28 L30 -24 Z" fill="a" st={false} />
    <S el="ellipse" cx={2} cy={-8} rx={12} ry={8} fill="a" st={false} />
    <S d="M-4 2 L-6 10 M6 2 L6 10" sw={4} />
  </g>
);

/** Uccello in volo (ali su/giù a scatti) */
export const Flying: React.FC<{up: boolean; s?: number}> = ({up, s = 1}) => (
  <S d={up ? 'M-34 -12 Q-16 -18 0 2 Q16 -18 34 -12' : 'M-34 10 Q-16 -6 0 2 Q16 -6 34 10'} transform={`scale(${s})`} sw={7} />
);

/** Lanterna di carta che sale */
export const Lantern: React.FC<{s?: number; f: number; i: number}> = ({s = 1, f, i}) => (
  <g transform={`scale(${s})`}>
    <S el="circle" r={Math.floor((f + i) / 4) % 2 ? 64 : 72} cy={-10} fill="g1" st={false} />
    <S d="M-30 -50 L30 -50 L40 30 L-40 30 Z" fill="a" />
    <S d="M-30 -50 L-40 30 M0 -50 L0 30 M30 -50 L40 30" sw={4} />
    <S el="ellipse" cx={0} cy={30} rx={40} ry={8} fill="c3" sw={4} />
  </g>
);

/** LUI di spalle, seduto (la parte sotto la vita resta nascosta dal muretto) */
export const LuiBack: React.FC = () => (
  <g>
    <S d="M-110 0 C-100 -110 -60 -130 0 -130 C60 -130 100 -110 110 0 L120 140 L-120 140 Z" fill="w" />
    {[-90, -50, -10, 30].map((y) => (
      <S key={y} d={`M${-112 - (y + 90) * 0.06} ${y} L${112 + (y + 90) * 0.06} ${y} L${114 + (y + 90) * 0.06} ${y + 18} L${-114 - (y + 90) * 0.06} ${y + 18} Z`} fill="a" st={false} />
    ))}
    <S d="M-110 0 C-100 -110 -60 -130 0 -130 C60 -130 100 -110 110 0 L120 140 L-120 140 Z" />
    <S d="M-24 -170 L-24 -128 M24 -170 L24 -128" />
    <S el="circle" cx={-74} cy={-212} r={16} fill="p" />
    <S el="circle" cx={74} cy={-212} r={16} fill="p" />
    <S el="circle" cx={0} cy={-220} r={74} fill="p" />
    <S d="M-74 -232 C-80 -170 -40 -150 0 -150 C40 -150 80 -170 74 -232 Z" fill="b" />
    <S d="M-30 -152 L-24 -140 M0 -150 L0 -138 M30 -152 L24 -140" sw={6} />
    <S d="M-78 -224 C-82 -320 82 -320 78 -224 Z" fill="a" />
    <S d="M-80 -236 L80 -236" sw={6} />
    <S el="circle" cx={0} cy={-310} r={22} fill="c2" sw={6} />
  </g>
);

/** LEI di spalle, seduta: ricci a nuvola, vestito corallo. lean = gradi verso sinistra */
export const LeiBack: React.FC<{lean?: number}> = ({lean = 0}) => (
  <g>
    <S d="M-96 0 C-90 -100 -50 -124 0 -124 C50 -124 90 -100 96 0 L110 140 L-110 140 Z" fill="a" />
    <S d="M-20 -160 L-20 -120 M20 -160 L20 -120" />
    <g transform={`rotate(${-lean} 0 -140)`}>
      {Array.from({length: 11}, (_, i) => {
        const a = (i / 11) * Math.PI * 2;
        return <S key={i} el="circle" cx={Math.cos(a) * 64} cy={-214 + Math.sin(a) * 64} r={40} fill="b" />;
      })}
      <S el="circle" cx={0} cy={-214} r={70} fill="b" st={false} />
    </g>
  </g>
);

/** Gatto seduto di profilo, coda che oscilla */
export const Cat: React.FC<{f: number}> = ({f}) => (
  <g>
    <S d={Math.floor(f / 6) % 2 ? 'M30 0 C80 0 90 -40 70 -70' : 'M30 0 C80 6 100 -20 96 -56'} sw={12} />
    <S d="M-40 0 C-50 -60 -20 -100 10 -100 C40 -100 50 -50 40 0 Z" fill="b" st={false} />
    <S el="circle" cx={-6} cy={-118} r={34} fill="b" st={false} />
    <S d="M-34 -136 L-30 -170 L-12 -146 Z M0 -148 L18 -172 L22 -138 Z" fill="b" st={false} />
    <S el="circle" cx={-18} cy={-120} r={5} fill="a" st={false} />
  </g>
);

/** Poligono-quadrilatero interpolato (per la prospettiva della strada) */
export type Pt = [number, number];
export const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const quadPt = (q: [Pt, Pt, Pt, Pt], u: number, v: number): Pt => lerp(lerp(q[0], q[1], u), lerp(q[3], q[2], u), v);
export const quadD = (pts: Pt[]) => `M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L')} Z`;

/** Palo della luce con traverse */
export const Pole: React.FC<{x: number; top: number; bottom: number}> = ({x, top, bottom}) => (
  <g>
    <Tube d={`M${x} ${bottom} L${x} ${top}`} w={22} fill="b" />
    <S d={`M${x - 70} ${top + 40} L${x + 70} ${top + 40} M${x - 54} ${top + 90} L${x + 54} ${top + 90}`} sw={12} />
  </g>
);

/** Nuvola bianca con contorno */
export const Cloud: React.FC<{s?: number}> = ({s = 1}) => (
  <S
    d="M-150 40 C-200 40 -200 -20 -150 -20 C-160 -80 -80 -90 -60 -50 C-40 -110 60 -110 70 -50 C110 -80 170 -50 150 0 C200 10 190 40 150 40 Z"
    transform={`scale(${s})`}
    fill="w"
    sw={6 / s}
  />
);


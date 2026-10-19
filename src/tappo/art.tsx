import React from 'react';
import {C} from '../lib/theme';

export const CAP_BLUE = '#1F5FE0';

/**
 * Tappo di penna (vista laterale) con volume dato da gradienti.
 * `turn` 0..1 simula la rotazione attorno all'asse: sposta la clip e i riflessi.
 */
export const Cap: React.FC<{
  width?: number;
  color?: string;
  turn?: number;
  holeGlow?: number; // 0..1 evidenzia il buco
  bites?: number; // 0..1 segni dei morsi
  style?: React.CSSProperties;
}> = ({width = 220, color = CAP_BLUE, turn = 0, holeGlow = 0, bites = 0, style}) => {
  const h = width * 2.9;
  const id = `cap${Math.round(width)}${color.replace('#', '')}`;
  const clipX = 100 + Math.sin(turn * Math.PI * 2) * 52; // la clip gira attorno al tappo
  const clipFront = Math.cos(turn * Math.PI * 2) > -0.2;
  const hi = 70 + Math.sin(turn * Math.PI * 2 + 1) * 18;
  return (
    <svg width={width} height={h} viewBox="0 0 200 580" style={{overflow: 'visible', ...style}}>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" x2="1">
          <stop offset="0" stopColor={color} stopOpacity={1} />
          <stop offset={hi / 200} stopColor="#FFFFFF" stopOpacity={0.55} />
          <stop offset={(hi + 30) / 200} stopColor={color} />
          <stop offset="1" stopColor="#0A2A70" />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor={C.accent} stopOpacity={0.9} />
          <stop offset="1" stopColor={C.accent} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* clip dietro */}
      {!clipFront && <rect x={clipX - 9} y={40} width={18} height={330} rx={9} fill="#0E3A9A" />}
      {/* corpo */}
      <path d="M 52 70 Q 52 30 100 26 Q 148 30 148 70 L 156 560 Q 156 572 144 572 L 56 572 Q 44 572 44 560 Z" fill={`url(#${id}-body)`} />
      {/* anello di battuta */}
      <rect x={44} y={520} width={112} height={14} rx={4} fill="#000" opacity={0.12} />
      {/* buco in cima */}
      <circle cx={100} cy={46} r={40 * holeGlow + 0.01} fill={`url(#${id}-glow)`} />
      <ellipse cx={100} cy={44} rx={13} ry={7} fill="#06122E" />
      <ellipse cx={100} cy={42} rx={9} ry={4} fill="#000" />
      {/* segni dei morsi */}
      {bites > 0 &&
        [0, 1, 2].map((i) => (
          <path key={i} d={`M ${68 + i * 26} ${500 - i * 3} q 8 -14 16 0`} stroke="#0A2A70" strokeWidth={4} fill="none" strokeLinecap="round" opacity={bites * 0.8} />
        ))}
      {/* clip davanti */}
      {clipFront && (
        <g>
          <rect x={clipX - 10} y={40} width={20} height={340} rx={10} fill={`url(#${id}-body)`} stroke="#0A2A70" strokeOpacity={0.4} />
          <ellipse cx={clipX} cy={376} rx={12} ry={9} fill={color} />
        </g>
      )}
    </svg>
  );
};

/**
 * Penna intera in spaccato (orizzontale): fusto trasparente esagonale, refill con inchiostro,
 * buchino laterale. `inkLevel` 0..1, `air` 0..1 bolle d'aria che entrano.
 */
export const Pen: React.FC<{width?: number; inkLevel?: number; air?: number; t?: number; holeGlow?: number}> = ({width = 900, inkLevel = 0.8, air = 0, t = 0, holeGlow = 0}) => {
  const H = width * 0.18;
  const inkEnd = 140 + 640 * inkLevel;
  return (
    <svg width={width} height={H} viewBox="0 0 1000 180" style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id="barrel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="0.25" stopColor="#E6EAF2" stopOpacity={0.55} />
          <stop offset="0.6" stopColor="#C9D2E2" stopOpacity={0.45} />
          <stop offset="1" stopColor="#9AA6BC" stopOpacity={0.7} />
        </linearGradient>
        <radialGradient id="penGlow">
          <stop offset="0" stopColor={C.accent} stopOpacity={0.9} />
          <stop offset="1" stopColor={C.accent} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* punta */}
      <path d="M 60 90 L 130 62 L 130 118 Z" fill="#C8CCD4" />
      <circle cx={58} cy={90} r={6} fill="#555" />
      {/* refill */}
      <rect x={130} y={80} width={700} height={20} rx={10} fill="#F4F6FA" stroke="#B9C0CC" />
      <rect x={130} y={82} width={Math.max(0, inkEnd - 130)} height={16} rx={8} fill={CAP_BLUE} />
      {/* fusto esagonale trasparente */}
      <path d="M 120 50 L 900 50 Q 920 50 920 70 L 920 110 Q 920 130 900 130 L 120 130 Q 105 90 120 50 Z" fill="url(#barrel)" stroke="#AEB6C4" strokeWidth={2} />
      <line x1={130} y1={72} x2={900} y2={72} stroke="#fff" strokeOpacity={0.8} strokeWidth={3} />
      <line x1={130} y1={110} x2={900} y2={110} stroke="#8A94A8" strokeOpacity={0.4} strokeWidth={2} />
      {/* tappino posteriore */}
      <rect x={905} y={58} width={50} height={64} rx={12} fill={CAP_BLUE} />
      {/* buchino laterale */}
      <circle cx={520} cy={56} r={46 * holeGlow + 0.01} fill="url(#penGlow)" />
      <ellipse cx={520} cy={56} rx={8} ry={5} fill="#1D1D1F" />
      {/* bolle d'aria che entrano dal buchino e scorrono verso il fondo del refill */}
      {air > 0 &&
        Array.from({length: 7}, (_, i) => {
          const k = ((t * 0.6 + i / 7) % 1);
          const x = 520 + k * 300;
          const y = 56 + Math.min(1, k * 4) * 34;
          return <circle key={i} cx={x} cy={y} r={6 - k * 2} fill="none" stroke={C.accent} strokeWidth={3} opacity={air * (1 - k)} />;
        })}
    </svg>
  );
};

/**
 * Schema stilizzato delle vie aeree (sezione verticale) con il tappo bloccato.
 * `capY` posizione del tappo (0 = fuori in alto, 1 = bloccato), `flow` 0..1 aria che passa.
 */
export const Airway: React.FC<{capY: number; flow: number; t: number; width?: number}> = ({capY, flow, t, width = 620}) => {
  const H = width * 1.45;
  const capTop = -260 + capY * 560;
  return (
    <svg width={width} height={H} viewBox="0 0 620 900" style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id="wall" x1="0" x2="1">
          <stop offset="0" stopColor="#E9E9EE" />
          <stop offset="0.5" stopColor="#F7F7FA" />
          <stop offset="1" stopColor="#E1E1E8" />
        </linearGradient>
        <clipPath id="tube">
          <path d="M 220 0 L 400 0 L 380 520 Q 380 560 352 600 L 268 600 Q 240 560 240 520 Z" />
        </clipPath>
      </defs>
      {/* condotto */}
      <path d="M 170 0 L 450 0 L 430 540 Q 430 620 380 700 L 380 900 L 240 900 L 240 700 Q 190 620 190 540 Z" fill="url(#wall)" />
      <path d="M 220 0 L 400 0 L 380 520 Q 380 560 352 600 L 268 600 Q 240 560 240 520 Z" fill="#FFFFFF" stroke="#D2D2D7" strokeWidth={3} />
      {/* anelli cartilaginei */}
      {Array.from({length: 7}, (_, i) => (
        <path key={i} d={`M ${226 + i * 2} ${60 + i * 70} Q 310 ${80 + i * 70} ${394 - i * 2} ${60 + i * 70}`} stroke="#E5E5EA" strokeWidth={10} fill="none" strokeLinecap="round" />
      ))}
      <g clipPath="url(#tube)">
        {/* particelle d'aria: salgono e convergono nel buco del tappo */}
        {flow > 0 &&
          Array.from({length: 26}, (_, i) => {
            const k = (t * 0.45 + i / 26) % 1;
            const lane = ((i * 37) % 11) / 10 - 0.5;
            const y = 600 - k * 760;
            const holeY = capTop + 30;
            const near = Math.max(0, 1 - Math.abs(y - holeY) / 160);
            const x = 310 + lane * 120 * (1 - near * 0.95);
            return <circle key={i} cx={x} cy={y} r={5 + near * 2} fill={C.accent} opacity={flow * (0.35 + near * 0.65)} />;
          })}
      </g>
      {/* tappo */}
      <g transform={`translate(${310 - 64} ${capTop}) scale(0.64)`}>
        <Cap width={200} holeGlow={flow} />
      </g>
    </svg>
  );
};

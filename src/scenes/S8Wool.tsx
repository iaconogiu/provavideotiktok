import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Glass} from '../lib/Glass';
import {FlameIcon, ShieldIcon} from '../lib/Icons';
import {drift, easeOut, keys, pop, soft, tween} from '../lib/anim';
import {useScene} from '../lib/useScene';
import {wordAt} from '../lib/timing';
import {C, FABRIC, FONT} from '../lib/theme';

const START = 45.85;

/** Macro della trama: fili che si intrecciano sopra/sotto */
const Weave: React.FC<{f: number; grow: number; tension: number}> = ({f, grow, tension}) => {
  const n = 14;
  const gap = 90;
  const size = n * gap;
  const th = 62;
  const els: React.ReactNode[] = [];
  const colorOf = (i: number) => FABRIC.colors[i % FABRIC.colors.length];
  for (let i = 0; i < n; i++) {
    const g = Math.min(1, Math.max(0, grow * 1.6 - i / n));
    // trama orizzontale
    els.push(
      <rect key={`h${i}`} x={0} y={i * gap + (gap - th) / 2} width={size * g} height={th} rx={th / 2} fill={i % 3 === 0 ? FABRIC.base : '#3A3560'} />,
    );
  }
  for (let j = 0; j < n; j++) {
    const g = Math.min(1, Math.max(0, grow * 1.6 - j / n - 0.2));
    const x = j * gap + (gap - th) / 2 + Math.sin(f / 20 + j) * tension * 4;
    // ordito verticale: passa sopra a celle alterne
    for (let i = 0; i < n; i++) {
      if ((i + j) % 2 === 0) continue;
      const y = i * gap - 10;
      els.push(
        <rect key={`v${j}-${i}`} x={x} y={y} width={th} height={(gap + 20) * g} rx={th / 2} fill={colorOf(j)} />,
      );
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="fiber" x1="0" x2="1">
          <stop offset="0" stopColor="black" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="white" stopOpacity="0.12" />
          <stop offset="1" stopColor="black" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <rect width={size} height={size} fill="#141228" />
      {els}
      <rect width={size} height={size} fill="url(#fiber)" opacity={0.5} />
    </svg>
  );
};

const Badge: React.FC<{f: number; t: number; y: number; icon: React.ReactNode; title: string; sub: string}> = ({f, t, y, icon, title, sub}) => {
  const p = pop(f, t - 4);
  if (f < t - 6) return null;
  return (
    <div style={{position: 'absolute', left: 110, top: y, transform: `perspective(1400px) rotateY(${(1 - p) * -70 + drift(f, 0.7, 3)}deg) translateZ(${(1 - p) * -300}px)`, opacity: Math.min(1, p * 1.5), transformOrigin: 'left center'}}>
      <Glass radius={44} style={{padding: '28px 40px', display: 'flex', alignItems: 'center', gap: 28, width: 860}}>
        <div style={{width: 120, height: 120, borderRadius: 32, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{icon}</div>
        <div>
          <div style={{fontSize: 64, fontWeight: 800, letterSpacing: -2}}>{title}</div>
          <div style={{fontSize: 34, fontWeight: 500, color: C.gray, marginTop: 4}}>{sub}</div>
        </div>
      </Glass>
    </div>
  );
};

// "E non è finita. Quel tessuto è quasi sempre in lana mista: resistentissimo, e difficile da incendiare."
export const S8Wool: React.FC = () => {
  const {f, T} = useScene(START);
  const tFinita = T(wordAt('finita.'));
  const tLana = T(wordAt('lana'));
  const tResist = T(wordAt('resistentissimo,'));
  const tDifficile = T(wordAt('difficile'));
  const tIncendiare = T(wordAt('incendiare.'));

  const grow = tween(f, [0, tLana], [0.15, 1], easeOut);
  const tension = tween(f, [tResist, tResist + 20], [0, 1]) * (1 - tween(f, [tResist + 50, tResist + 70], [0, 1]));
  const rotZ = keys(f, [0, tLana, tResist, tIncendiare + 60], [-30, -12, 0, 10]);
  const tilt = keys(f, [0, tLana, tIncendiare + 60], [60, 38, 46]) + drift(f, 0.6, 2);
  const zoom = keys(f, [0, tLana, tResist, tIncendiare + 60], [2.4, 1.3, 1.15, 1.05]);

  // fiamma che prova ad accendersi e si spegne
  const flameP = pop(f, tDifficile - 4);
  const flameDie = tween(f, [tIncendiare, tIncendiare + 40], [0, 1], easeOut);
  const flicker = 1 + Math.sin(f * 0.9) * 0.08 + Math.sin(f * 1.7) * 0.05;
  const lanaP = soft(f, tLana - 6, 15);

  return (
    <AbsoluteFill style={{background: '#0E0C1E', fontFamily: FONT, overflow: 'hidden'}}>
      <AbsoluteFill style={{perspective: 1300, perspectiveOrigin: '50% 30%'}}>
        <div style={{position: 'absolute', left: 540 - 630, top: 160, transform: `scale(${zoom}) rotateX(${tilt}deg) rotateZ(${rotZ}deg)`, transformOrigin: '50% 40%'}}>
          <Weave f={f} grow={grow} tension={tension} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(14,12,30,0.75) 0%, rgba(14,12,30,0) 30%, rgba(14,12,30,0) 55%, rgba(14,12,30,0.9) 100%)'}} />

      {/* "E non è finita." */}
      <div
        style={{
          position: 'absolute',
          top: 160,
          width: '100%',
          textAlign: 'center',
          color: C.white,
          fontSize: 96,
          fontWeight: 900,
          letterSpacing: -4,
          opacity: soft(f, tFinita - 30) * (1 - tween(f, [tLana - 20, tLana], [0, 1])),
          transform: `translateY(${(1 - soft(f, tFinita - 30)) * 40}px)`,
        }}
      >
        E non è finita<span style={{color: C.accent}}>.</span>
      </div>

      {/* LANA MISTA */}
      <div
        style={{
          position: 'absolute',
          top: 170,
          width: '100%',
          textAlign: 'center',
          opacity: lanaP,
          transform: `perspective(1200px) rotateX(${(1 - lanaP) * 60}deg) translateY(${tween(f, [tResist - 20, tResist + 20], [0, -20])}px)`,
        }}
      >
        <div style={{fontSize: 40, fontWeight: 700, letterSpacing: 6, color: C.accent, textTransform: 'uppercase'}}>Materiale</div>
        <div style={{fontSize: 150, fontWeight: 900, letterSpacing: -6, color: C.white}}>Lana mista</div>
      </div>

      <Badge f={f} t={tResist} y={560} icon={<ShieldIcon size={84} color="white" stroke={7} />} title="Resistentissimo" sub="Sopporta anni di uso continuo" />
      <Badge f={f} t={tDifficile} y={800} icon={<FlameIcon size={84} color="white" stroke={7} />} title="Ignifugo" sub="Difficile da incendiare" />

      {/* fiamma */}
      {f > tDifficile - 6 && (
        <div
          style={{
            position: 'absolute',
            left: 820,
            top: 1060,
            transform: `scale(${flameP * flicker * (1 - flameDie)}) translateY(${flameDie * 30}px)`,
            transformOrigin: 'bottom center',
            filter: `drop-shadow(0 0 30px ${C.accent})`,
          }}
        >
          <FlameIcon size={150} color={C.accent} stroke={8} />
        </div>
      )}
      {flameDie > 0 && (
        <div style={{position: 'absolute', left: 860, top: 980 - flameDie * 160, width: 80, height: 80, borderRadius: 40, background: 'rgba(255,255,255,0.25)', filter: 'blur(18px)', opacity: 1 - flameDie, transform: `scale(${1 + flameDie * 2})`}} />
      )}
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, Sequence, continueRender, delayRender} from 'remotion';
import {Cloud, Kid, Moon, Plant, Rain, Sun, Umbrella} from './drawings';
import {BLUE, H, InkScene, PAPER, Ransom, SW, Splat, Stars, W, pop, prog, useStep} from './ink';

/**
 * Prova di stile "inchiostro blu": illustrazioni disegnate in SVG, un solo colore,
 * linee che tremolano, animazione a passo due e cartelli a lettere ritagliate.
 */

const Ground: React.FC<{y: number}> = ({y}) => (
  <g fill="none" stroke={BLUE} strokeWidth={SW} strokeLinecap="round">
    <line x1={60} y1={y} x2={W - 60} y2={y} />
    {[150, 210, 820, 900, 960].map((x) => (
      <path key={x} d={`M${x} ${y} l-8 -26 M${x} ${y} l2 -34 M${x} ${y} l12 -24`} strokeWidth={6} />
    ))}
  </g>
);

// 1 · primo piano, cielo stellato, arriva la nuvola e inizia a piovere
const S1: React.FC = () => {
  const f = useStep(2);
  const zoom = 1 + prog(f, 0, 72) * 0.06;
  const cloudX = -320 + prog(f, 24, 40) * 1100;
  const look = f >= 28 ? 1 : 0;
  const mouth = f >= 52 ? 'o' : f >= 34 ? 'flat' : 'smile';
  const blink = (f >= 12 && f < 16) || (f >= 44 && f < 48);
  const headTop = (x: number) => (Math.abs(x - 540) < 230 ? 930 + ((x - 540) / 230) ** 2 * 120 : H);
  return (
    <InkScene zoom={zoom} origin={[540, 1150]}>
      <Stars seed="s1" n={20} avoid={(x, y) => y > 820 || (x > 640 && y < 520)} />
      <g transform="translate(830 330)">
        <Moon draw={prog(f, 2, 20)} />
      </g>
      <g transform={`translate(${cloudX} 400)`}>
        <Cloud w={520} />
      </g>
      <Rain f={f} x={260} y={460} w={560} h={1300} from={44} n={10} seed="r1" stopY={headTop} />
      <g transform="translate(540 1260) scale(2)">
        <Kid half look={look} mouth={mouth} blink={blink} />
      </g>
    </InkScene>
  );
};

// 2 · cartello blu
const S2: React.FC = () => {
  const f = useStep(2);
  return (
    <InkScene bg={BLUE} zoom={1 + prog(f, 0, 60) * 0.05}>
      <Splat x={170} y={330} r={60} seed="a" color={PAPER} at={2} />
      <Splat x={900} y={260} r={44} seed="b" color={PAPER} at={6} />
      <Splat x={820} y={1560} r={70} seed="c" color={PAPER} at={30} />
      <Splat x={230} y={1640} r={40} seed="d" color={PAPER} at={34} />
      <Ransom lines={['OGGI PIOVE', 'SOLO', 'SU DI ME']} y={800} size={124} at={4} every={6} seed="t1" />
    </InkScene>
  );
};

// 3 · figura intera sotto la pioggia, apre l'ombrello
const S3: React.FC = () => {
  const f = useStep(2);
  const open = prog(f, 18, 28);
  const raised = f >= 14;
  const K = {x: 540, y: 880, s: 1.15};
  // tetto dell'ombrello in coordinate schermo (per far rimbalzare le gocce)
  const ux = K.x + 143 * K.s;
  const uy = K.y - 241 * K.s;
  const uw = 300 * 0.9 * K.s * (0.12 + open * 0.88);
  const stopY = (x: number) => {
    if (raised && Math.abs(x - ux) < uw) return uy - 175 * Math.sqrt(1 - ((x - ux) / uw) ** 2) * (0.6 + open * 0.4);
    return 1690;
  };
  return (
    <InkScene zoom={1 + prog(f, 0, 78) * 0.04} origin={[540, 1000]}>
      <Ground y={1690} />
      <Rain f={f} x={40} y={-40} w={1000} h={1760} n={26} seed="r3" stopY={stopY} />
      <g transform={`translate(${K.x} ${K.y}) scale(${K.s})`}>
        {raised && (
          <g transform="translate(143 -241) scale(0.9)">
            <Umbrella open={open} />
          </g>
        )}
        <Kid
          mouth={f >= 34 ? 'grin' : 'flat'}
          blink={(f >= 4 && f < 8) || (f >= 50 && f < 54)}
          look={raised && f < 34 ? 1 : 0}
          armL={f >= 34 ? 30 + (Math.floor(f / 6) % 2) * 25 : 10}
          armR={raised ? -160 : -10}
          openL={f >= 34}
        />
      </g>
    </InkScene>
  );
};

// 4 · spunta il sole, cresce la piantina
const S4: React.FC = () => {
  const f = useStep(2);
  const sunY = 760 - prog(f, 0, 16) * 400;
  return (
    <InkScene zoom={1 + prog(f, 0, 72) * 0.07} origin={[540, 1300]}>
      <Stars seed="s4" n={12} from={4} avoid={(x, y) => y > 600 || (x > 560 && y < 640)} />
      <g transform={`translate(800 ${sunY}) scale(0.85)`}>
        <Sun f={f} />
      </g>
      <Ground y={1825} />
      <g transform="translate(540 1500) scale(1.3)">
        <Plant f={f} at={8} />
      </g>
    </InkScene>
  );
};

// 5 · cartello bianco
const S5: React.FC = () => {
  const f = useStep(2);
  return (
    <InkScene zoom={1 + prog(f, 0, 54) * 0.04}>
      <Splat x={860} y={360} r={66} seed="e" at={2} />
      <Splat x={200} y={1580} r={56} seed="g" at={24} />
      <Splat x={900} y={1700} r={30} seed="h" at={28} />
      <Ransom lines={['E QUALCOSA', 'FIORISCE', 'LO STESSO']} y={800} size={124} at={2} every={5} fg={BLUE} bg={PAPER} seed="t2" />
      <g transform={`translate(540 1300) scale(${pop(f, 34, 6) * 0.9})`}>
        <path d="M0 40 C-90 -20 -60 -100 0 -50 C60 -100 90 -20 0 40 Z" fill={BLUE} />
      </g>
    </InkScene>
  );
};

export const SCENES: [React.FC, number][] = [
  [S1, 72],
  [S2, 60],
  [S3, 78],
  [S4, 72],
  [S5, 54],
];
export const INCHIOSTRO_FRAMES = SCENES.reduce((a, [, d]) => a + d, 0);

export const Inchiostro: React.FC = () => {
  // le scritte sono testo SVG: aspetta che i font siano caricati
  const [handle] = React.useState(() => delayRender('font'));
  React.useEffect(() => {
    Promise.all(['100px "Special Elite"', '100px "Archivo Black"'].map((f) => document.fonts.load(f))).then(() => continueRender(handle));
  }, [handle]);
  let from = 0;
  return (
    <AbsoluteFill style={{background: PAPER}}>
      {SCENES.map(([Scene, d], i) => {
        const el = (
          <Sequence key={i} from={from} durationInFrames={d}>
            <Scene />
          </Sequence>
        );
        from += d;
        return el;
      })}
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FabricPattern} from '../lib/FabricPattern';
import {Glass} from '../lib/Glass';
import {drift, keys, pop, soft, tween} from '../lib/anim';
import {useScene} from '../lib/useScene';
import {wordAt} from '../lib/timing';
import {C, FABRIC, FONT} from '../lib/theme';

const START = 4.3;

const Chip: React.FC<{t: number; f: number; x: number; y: number; rot: number; children: React.ReactNode}> = ({t, f, x, y, rot, children}) => {
  const p = pop(f, t);
  if (f < t - 2) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translateZ(${(1 - p) * -600 + 120}px) scale(${0.6 + p * 0.4}) rotate(${rot + drift(f, 0.9, 2)}deg)`,
        opacity: Math.min(1, p * 1.5),
      }}
    >
      <Glass style={{padding: '26px 40px', fontSize: 58, fontWeight: 800, letterSpacing: -1.5, whiteSpace: 'nowrap'}}>{children}</Glass>
    </div>
  );
};

// "Pensaci. Colori a caso, disegni senza senso, fantasie … incubo degli anni '90."
export const S2Chaos: React.FC = () => {
  const {f, T} = useScene(START);
  const tPensaci = T(wordAt('Pensaci.'));
  const tColori = T(wordAt('Colori'));
  const tDisegni = T(wordAt('disegni'));
  const tFantasie = T(wordAt('fantasie'));
  const tIncubo = T(wordAt('incubo'));
  const t90 = T(wordAt("'90."));

  // camera che sorvola il tessuto come un pavimento infinito
  const fly = f * 2.2;
  const tilt = keys(f, [0, tColori, tFantasie, t90 + 30], [10, 52, 40, 58]) + drift(f, 0.6, 2);
  const rotZ = keys(f, [0, tDisegni, tIncubo, t90 + 40], [0, -12, 8, -4]);
  const zoom = keys(f, [0, tPensaci + 30, tFantasie, t90 + 40], [1.6, 1.1, 1.25, 1.0]);
  const reveal = tween(f, [0, 60], [0.35, 1]);

  // forme estratte dal tessuto e portate in primo piano
  const swatch = (i: number) => {
    const p = pop(f, tColori + i * 5);
    const a = (i / FABRIC.colors.length) * Math.PI * 2 + f / 80;
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: 540 + Math.cos(a) * 300 - 50,
          top: 560 + Math.sin(a) * 160 - 50,
          width: 100,
          height: 100,
          borderRadius: 50,
          background: FABRIC.colors[i],
          boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3)',
          transform: `translateZ(${p * 260 + Math.sin(a) * 120}px) scale(${p})`,
          opacity: tween(f, [tDisegni + 10, tDisegni + 30], [1, 0]),
        }}
      />
    );
  };

  const nineties = soft(f, tIncubo, 14);

  return (
    <AbsoluteFill style={{background: FABRIC.base, overflow: 'hidden', perspective: 1400, perspectiveOrigin: '50% 30%'}}>
      <div
        style={{
          position: 'absolute',
          left: -1400,
          top: -1400,
          width: 3880,
          height: 4720,
          transform: `scale(${zoom}) rotateX(${tilt}deg) rotateZ(${rotZ}deg)`,
          transformOrigin: '50% 45%',
        }}
      >
        <FabricPattern id="s2" seed="bus" tile={340} reveal={reveal} offsetY={fly} offsetX={fly * 0.3} />
      </div>
      {/* vignetta morbida per profondità */}
      <AbsoluteFill style={{background: 'radial-gradient(120% 80% at 50% 40%, transparent 40%, rgba(10,8,25,0.6) 100%)'}} />

      <AbsoluteFill style={{transformStyle: 'preserve-3d', perspective: 1400}}>
        {FABRIC.colors.map((_, i) => swatch(i))}
        <Chip t={tColori} f={f} x={110} y={300} rot={-5}>Colori a caso</Chip>
        <Chip t={tDisegni} f={f} x={300} y={520} rot={4}>Disegni senza senso</Chip>
        <Chip t={tFantasie} f={f} x={140} y={740} rot={-3}>Fantasie da incubo</Chip>
      </AbsoluteFill>

      {/* "anni '90" con effetto retro */}
      {f >= tIncubo - 2 && (
        <div
          style={{
            position: 'absolute',
            width: '100%',
            top: 950,
            textAlign: 'center',
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 230,
            letterSpacing: -8,
            color: C.white,
            opacity: nineties,
            transform: `perspective(1200px) rotateX(${(1 - nineties) * 70}deg) scale(${0.8 + nineties * 0.2})`,
            textShadow: `8px 8px 0 ${FABRIC.colors[0]}, 16px 16px 0 ${FABRIC.colors[1]}, 24px 24px 0 ${FABRIC.colors[2]}`,
          }}
        >
          ANNI '90
        </div>
      )}
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {Backdrop} from '../lib/Backdrop';
import {Seat} from '../lib/Seat';
import {Stain} from '../lib/Stain';
import {Glass} from '../lib/Glass';
import {CoffeeIcon, GumIcon, PersonIcon, RainIcon, ShoeIcon, SunIcon} from '../lib/Icons';
import {drift, easeOut, keys, pop, soft, tween} from '../lib/anim';
import {useScene} from '../lib/useScene';
import {wordAt} from '../lib/timing';
import {C, FONT} from '../lib/theme';

const START = 21.7;

export const PLAIN = '#55607A';

/** Macchie condivise tra la scena dello sporco e quella del "trucco" */
export const STAINS = [
  {key: 'caffe', seed: 'coffee', x: 150, y: 250, size: 210, color: '#4A2C17'},
  {key: 'scarpe', seed: 'mud', x: 300, y: 470, size: 190, color: '#3B3428'},
  {key: 'pioggia', seed: 'rain', x: 320, y: 170, size: 170, color: '#2C3346'},
  {key: 'gomma', seed: 'gum', x: 120, y: 500, size: 90, color: '#E86AA8'},
] as const;

export const StainLayer: React.FC<{progress: number[]; opacity?: number; blend?: React.CSSProperties['mixBlendMode']}> = ({progress, opacity = 0.85, blend}) => (
  <>
    {STAINS.map((s, i) => (
      <Stain key={s.key} seed={s.seed} x={s.x} y={s.y} size={s.size} color={s.color} progress={progress[i]} opacity={opacity} blend={blend} />
    ))}
  </>
);

// "Perché ogni giorno, su quei sedili, si siedono centinaia di persone.
//  Con il caffè in mano, le scarpe sporche, la pioggia addosso.
//  E qualcuno… ci attacca pure la gomma da masticare."
export const S5Dirt: React.FC = () => {
  const {f, T} = useScene(START);
  const tGiorno = T(wordAt('giorno,'));
  const tSiedono = T(wordAt('siedono'));
  const tCentinaia = T(wordAt('centinaia'));
  const tCaffe = T(wordAt('caffè'));
  const tScarpe = T(wordAt('scarpe'));
  const tPioggia = T(wordAt('pioggia'));
  const tQualcuno = T(wordAt('qualcuno…'));
  const tGomma = T(wordAt('gomma'));

  // Fase A: persone (griglia di 120 omini che si riempie)
  const phaseB = tween(f, [tCaffe - 30, tCaffe], [0, 1]);
  const people = 120;
  const fill = tween(f, [tCentinaia - 10, tCaffe - 30], [0, 1], easeOut);
  const sun = soft(f, tGiorno - 20);
  const gridTilt = 28 + drift(f, 0.6, 3);

  // Fase B: sedile in tinta unita che si sporca
  const hits = [tCaffe + 10, tScarpe + 10, tPioggia + 10, tGomma + 12];
  const stainP = hits.map((t) => tween(f, [t, t + 18], [0, 1], easeOut));
  const shake = hits.reduce((a, t) => a + Math.max(0, 1 - Math.abs(f - t - 4) / 10) * Math.sin(f * 2.4) * 8, 0);
  const seatIn = soft(f, tCaffe - 34, 18);
  const orbit = keys(f, [tCaffe - 30, tGomma + 60], [-30, 18]) + drift(f, 0.5, 3);

  const icons = [
    {t: tCaffe, Icon: CoffeeIcon, label: 'Caffè', x: 70, y: 260},
    {t: tScarpe, Icon: ShoeIcon, label: 'Scarpe', x: 740, y: 330},
    {t: tPioggia, Icon: RainIcon, label: 'Pioggia', x: 80, y: 760},
    {t: tGomma, Icon: GumIcon, label: 'Gomma', x: 720, y: 840},
  ];

  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <Backdrop />

      {/* FASE A */}
      {phaseB < 1 && (
        <AbsoluteFill style={{opacity: 1 - phaseB, transform: `scale(${1 + phaseB * 0.6})`, filter: `blur(${phaseB * 16}px)`}}>
          <div style={{position: 'absolute', top: 170, width: '100%', display: 'flex', justifyContent: 'center', opacity: sun, transform: `translateY(${(1 - sun) * -30}px)`}}>
            <Glass radius={100} style={{padding: '16px 34px', display: 'flex', alignItems: 'center', gap: 16, fontSize: 40, fontWeight: 700}}>
              <SunIcon size={56} color={C.accent} stroke={7} /> Ogni giorno
            </Glass>
          </div>
          <div style={{position: 'absolute', inset: 0, perspective: 1500, perspectiveOrigin: '50% 30%'}}>
            <div
              style={{
                position: 'absolute',
                left: 90,
                top: 350,
                width: 900,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 14,
                transform: `rotateX(${gridTilt}deg) rotateZ(${drift(f, 0.4, 3)}deg) translateZ(${tween(f, [tSiedono - 20, tCaffe], [-300, 120])}px)`,
              }}
            >
              {Array.from({length: people}, (_, i) => {
                const on = fill * people > i + random(`p${i}`) * 6;
                const p = on ? 1 : 0.0;
                return (
                  <div key={i} style={{width: 62, height: 62, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.6 + p * 0.4})`}}>
                    <PersonIcon size={58} color={on ? (i % 9 === 0 ? C.accent : C.ink) : C.line} stroke={8} />
                  </div>
                );
              })}
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              width: '100%',
              top: 1080,
              textAlign: 'center',
              fontSize: 120,
              fontWeight: 900,
              letterSpacing: -5,
              color: C.ink,
              opacity: soft(f, tCentinaia),
            }}
          >
            {Math.round(fill * 100)}
            <span style={{color: C.accent}}>+</span>
          </div>
        </AbsoluteFill>
      )}

      {/* FASE B */}
      {f > tCaffe - 40 && (
        <AbsoluteFill style={{perspective: 1600, perspectiveOrigin: '50% 35%', opacity: seatIn}}>
          <div
            style={{
              position: 'absolute',
              left: 540 - 220,
              top: 330,
              transformStyle: 'preserve-3d',
              transform: `translateZ(${(1 - seatIn) * -1200 + tween(f, [tCaffe, tGomma + 60], [-200, 40])}px) translateX(${shake}px) rotateX(16deg) rotateY(${orbit}deg)`,
            }}
          >
            <Seat id="s5" width={440} height={600} plain={PLAIN} patternOpacity={0}>
              <StainLayer progress={stainP} />
            </Seat>
          </div>
          {icons.map(({t, Icon, label, x, y}, i) => {
            const p = pop(f, t - 4);
            if (f < t - 6) return null;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  transform: `translateZ(${(1 - p) * -400}px) scale(${p}) translateY(${drift(f, 1.1, 10, i)}px)`,
                  opacity: Math.min(1, p),
                }}
              >
                <Glass radius={40} style={{padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 230}}>
                  <Icon size={110} color={C.ink} stroke={6} />
                  <div style={{fontSize: 38, fontWeight: 700}}>{label}</div>
                </Glass>
              </div>
            );
          })}
          {/* "e qualcuno…" : cerchio che evidenzia la gomma */}
          {f > tQualcuno && (
            <div
              style={{
                position: 'absolute',
                left: 540 - 220 + 120 - 90,
                top: 330 + 500 - 90,
                width: 180,
                height: 180,
                borderRadius: 90,
                border: `8px solid ${C.accent}`,
                opacity: tween(f, [tGomma + 16, tGomma + 30], [0, 1]) * tween(f, [tGomma + 90, tGomma + 110], [1, 0]),
                transform: `scale(${pop(f, tGomma + 16)})`,
              }}
            />
          )}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

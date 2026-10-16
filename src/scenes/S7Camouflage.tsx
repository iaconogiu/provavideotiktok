import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Backdrop} from '../lib/Backdrop';
import {Seat} from '../lib/Seat';
import {Glass} from '../lib/Glass';
import {EyeIcon} from '../lib/Icons';
import {drift, easeOut, keys, pop, soft, tween} from '../lib/anim';
import {useScene} from '../lib/useScene';
import {wordAt} from '../lib/timing';
import {C, FONT} from '../lib/theme';
import {PLAIN, StainLayer} from './S5Dirt';

const START = 35.15;
const ALL = [1, 1, 1, 1];

// "Su una fantasia così caotica, le macchie spariscono.
//  L'occhio non riesce a distinguere lo sporco dal disegno.
//  Così il sedile sembra pulito e nuovo anche dopo anni."
export const S7Camouflage: React.FC = () => {
  const {f, T} = useScene(START);
  const tFantasia = T(wordAt('fantasia'));
  const tMacchie = T(wordAt('macchie'));
  const tSpariscono = T(wordAt('spariscono.'));
  const tOcchio = T(wordAt("L'occhio"));
  const tSporco = T(wordAt('sporco'));
  const tDisegno = T(wordAt('disegno.'));
  const tCosi = T(wordAt('Così', 40));
  const tPulito = T(wordAt('pulito'));
  const tAnni = T(wordAt('anni.', 44));

  // 1) la fantasia invade il sedile sporco
  const clip = tween(f, [tFantasia - 10, tMacchie], [0, 1], easeOut);
  // 2) le macchie si fondono (multiply + calo opacità)
  const camo = tween(f, [tMacchie, tSpariscono + 30], [0.85, 0.32]);

  // 3) confronto: due sedili affiancati (tinta unita vs fantasia)
  const split = soft(f, tOcchio - 8, 20);
  const merge = tween(f, [tCosi - 10, tCosi + 30], [0, 1]);
  const splitX = split * (1 - merge) * 270;

  // camera: push-in, orbita lenta, poi pull-back per il confronto
  const z = keys(f, [0, tMacchie, tOcchio, tCosi, tAnni + 60], [-80, 120, -380, -380, -60]);
  const ry = keys(f, [0, tSpariscono, tOcchio, tCosi, tAnni + 60], [-14, 12, 0, 0, -16]) + drift(f, 0.6, 3);

  // lente che "cerca" lo sporco sul sedile a fantasia
  const lensP = tween(f, [tSporco - 10, tDisegno + 40], [0, 1]);
  const lensOn = tween(f, [tSporco - 14, tSporco], [0, 1]) * (1 - tween(f, [tDisegno + 40, tDisegno + 56], [0, 1]));

  // contatore anni
  const years = Math.round(tween(f, [tPulito, tAnni + 20], [1, 10]));
  const yearsIn = soft(f, tPulito - 6);

  const seatW = 400;
  const seatH = 560;

  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <Backdrop />
      <AbsoluteFill style={{perspective: 1600, perspectiveOrigin: '50% 34%'}}>
        <div style={{position: 'absolute', left: 540, top: 330, transformStyle: 'preserve-3d', transform: `translateZ(${z}px) rotateX(14deg) rotateY(${ry}deg)`}}>
          {/* sedile "di controllo" in tinta unita (solo durante il confronto) */}
          {split > 0.01 && merge < 1 && (
            <div style={{position: 'absolute', left: -seatW / 2 - splitX, top: 0, transformStyle: 'preserve-3d', opacity: split * (1 - merge), transform: `rotateY(${split * 10}deg)`}}>
              <Seat id="s7a" width={seatW} height={seatH} plain={PLAIN} patternOpacity={0}>
                <StainLayer progress={ALL} />
              </Seat>
            </div>
          )}
          {/* sedile protagonista: la fantasia nasconde le macchie */}
          <div style={{position: 'absolute', left: -seatW / 2 + splitX, top: 0, transformStyle: 'preserve-3d', transform: `rotateY(${-split * (1 - merge) * 10}deg)`}}>
            <Seat id="s7b" width={seatW} height={seatH} plain={PLAIN} patternClip={clip} seed="bus">
              <StainLayer progress={ALL} opacity={camo} blend="multiply" />
              {/* lente d'ingrandimento */}
              {lensOn > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 60 + Math.sin(lensP * Math.PI * 2) * 120 + 70,
                    top: 120 + lensP * 260,
                    width: 170,
                    height: 170,
                    borderRadius: 85,
                    border: '6px solid white',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.4), inset 0 0 30px rgba(255,255,255,0.4)',
                    opacity: lensOn,
                    backdropFilter: 'brightness(1.15) saturate(1.2)',
                  }}
                />
              )}
              {/* brillantini "come nuovo" */}
              {[0, 1, 2].map((i) => {
                const p = pop(f, tPulito + i * 8);
                const tw = Math.max(0, Math.sin((f - tPulito - i * 8) / 7));
                return f > tPulito + i * 8 ? (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: [70, 300, 190][i],
                      top: [90, 210, 420][i],
                      width: 60,
                      height: 60,
                      transform: `scale(${p * (0.6 + tw * 0.5)}) rotate(${f * 2}deg)`,
                      background: 'white',
                      clipPath: 'polygon(50% 0, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0 50%, 40% 40%)',
                      opacity: 0.95,
                    }}
                  />
                ) : null;
              })}
            </Seat>
          </div>
        </div>
      </AbsoluteFill>

      {/* etichette del confronto */}
      {split > 0.01 && merge < 1 && (
        <>
          {[
            {t: 'Tinta unita', x: 540 - 270 - splitX * 0.15, icon: false},
            {t: 'Fantasia', x: 540 + 270 + splitX * 0.15, icon: true},
          ].map((l, i) => (
            <div key={i} style={{position: 'absolute', top: 1110, left: l.x, transform: `translateX(-50%) scale(${split})`, opacity: split * (1 - merge)}}>
              <Glass radius={100} style={{padding: '16px 30px', fontSize: 38, fontWeight: 700, whiteSpace: 'nowrap', color: i ? C.accent : C.ink}}>
                {l.t} {i ? '✓' : '✕'}
              </Glass>
            </div>
          ))}
        </>
      )}

      {/* occhio confuso */}
      {f > tOcchio - 10 && merge < 1 && (
        <div style={{position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center', opacity: soft(f, tOcchio - 6) * (1 - merge)}}>
          <Glass radius={100} style={{padding: '14px 34px', display: 'flex', alignItems: 'center', gap: 18, fontSize: 40, fontWeight: 700}}>
            <EyeIcon size={64} color={C.accent} stroke={7} style={{transform: `translateX(${Math.sin(f / 6) * 6}px)`}} />
            Sporco o disegno?
          </Glass>
        </div>
      )}

      {/* "anche dopo anni" */}
      {f > tPulito - 8 && (
        <div style={{position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center', opacity: yearsIn, transform: `translateY(${(1 - yearsIn) * -40}px)`}}>
          <Glass radius={100} style={{padding: '16px 38px', fontSize: 46, fontWeight: 800, letterSpacing: -1}}>
            Anno <span style={{color: C.accent, display: 'inline-block', minWidth: 60, textAlign: 'center'}}>{years}</span> · come nuovo
          </Glass>
        </div>
      )}
    </AbsoluteFill>
  );
};

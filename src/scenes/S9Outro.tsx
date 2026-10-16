import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Backdrop} from '../lib/Backdrop';
import {Seat} from '../lib/Seat';
import {drift, easeOut, keys, pop, soft, tween} from '../lib/anim';
import {useScene} from '../lib/useScene';
import {wordAt} from '../lib/timing';
import {C, FONT} from '../lib/theme';

const START = 53.05;
const ROWS = 6;

// "Quindi la prossima volta che lo vedi… sappi che è brutto apposta."
export const S9Outro: React.FC = () => {
  const {f, T} = useScene(START);
  const tVedi = T(wordAt('vedi…'));
  const tBrutto = T(wordAt('brutto', 55));
  const tApposta = T(wordAt('apposta.'));

  // dolly lungo il corridoio del pullman, poi la camera si alza per il titolo
  const dolly = keys(f, [0, tVedi, tBrutto, tApposta + 80], [-1700, -900, -500, -420], easeOut);
  const camY = keys(f, [0, tBrutto, tApposta + 80], [0, 140, 260]);
  const yaw = keys(f, [0, tVedi, tApposta + 80], [-14, 6, 0]) + drift(f, 0.5, 2);
  const dim = tween(f, [tBrutto - 10, tBrutto + 30], [0, 1]);

  const t1 = soft(f, tBrutto - 6, 16);
  const t2 = pop(f, tApposta - 4);

  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <Backdrop />
      <AbsoluteFill style={{perspective: 1500, perspectiveOrigin: '50% 30%', filter: `blur(${dim * 8}px)`, opacity: 1 - dim * 0.45}}>
        <div style={{position: 'absolute', left: 540, top: 700 + camY, transformStyle: 'preserve-3d', transform: `translateZ(${dolly}px) rotateX(12deg) rotateY(${yaw}deg)`}}>
          {/* pavimento */}
          <div style={{position: 'absolute', left: -700, top: 380, width: 1400, height: 5200, background: 'linear-gradient(180deg, #DCDCE2, #F5F5F7)', transformOrigin: 'top', transform: 'rotateX(-90deg)', borderRadius: 40}} />
          {Array.from({length: ROWS}).flatMap((_, r) =>
            [-1, 1].map((side) => {
              const z = -r * 760;
              return (
                <div key={`${r}${side}`} style={{position: 'absolute', left: side * 420 - 190, top: -260, transformStyle: 'preserve-3d', transform: `translateZ(${z}px)`}}>
                  <Seat id={`s9-${r}-${side}`} width={380} height={520} seed={`row${(r + side + 2) % 3}`} />
                </div>
              );
            }),
          )}
        </div>
      </AbsoluteFill>

      <div style={{position: 'absolute', top: 400, width: '100%', textAlign: 'center', color: C.ink}}>
        <div
          style={{
            fontSize: 190,
            fontWeight: 900,
            letterSpacing: -9,
            lineHeight: 1,
            opacity: t1,
            transform: `perspective(1400px) translateZ(${(1 - t1) * -500}px) rotateX(${(1 - t1) * 40}deg)`,
          }}
        >
          Brutto<span style={{color: C.accent}}>.</span>
        </div>
        <div
          style={{
            fontSize: 190,
            fontWeight: 900,
            letterSpacing: -9,
            lineHeight: 1.05,
            color: C.accent,
            opacity: Math.min(1, t2 * 1.4),
            transform: `scale(${0.6 + t2 * 0.4}) rotate(${(1 - t2) * -8}deg)`,
            textShadow: `0 30px 90px ${C.accent}55`,
          }}
        >
          Apposta.
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 40,
            fontWeight: 600,
            color: C.gray,
            opacity: tween(f, [tApposta + 30, tApposta + 60], [0, 1], easeOut),
          }}
        >
          Nasconde lo sporco · dura anni · resiste al fuoco
        </div>
      </div>
    </AbsoluteFill>
  );
};

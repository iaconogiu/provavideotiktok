import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Backdrop} from '../lib/Backdrop';
import {Seat} from '../lib/Seat';
import {Kicker} from '../lib/Glass';
import {drift, keys, pop, soft, tween, easeOut} from '../lib/anim';
import {useScene} from '../lib/useScene';
import {wordAt} from '../lib/timing';
import {C, FONT} from '../lib/theme';

// "Perché i sedili dei pullman hanno quel tessuto così… brutto?"
export const S1Hook: React.FC = () => {
  const {f, T} = useScene(0);
  const tTessuto = T(wordAt('tessuto'));
  const tBrutto = T(wordAt('brutto?'));

  // camera: dolly-in + orbit da sinistra, poi push verso il tessuto su "brutto"
  const dolly = keys(f, [0, tTessuto, tBrutto, tBrutto + 50], [-1400, -350, -200, 380], easeOut);
  const orbitY = keys(f, [0, tTessuto, tBrutto + 50], [-48, -14, 6]) + drift(f, 0.7, 3);
  const tiltX = keys(f, [0, tBrutto + 50], [24, 12]) + drift(f, 0.5, 2);
  const reveal = tween(f, [10, tTessuto + 20], [0, 1]);

  const kick = soft(f, 6);
  const q = pop(f, tBrutto);

  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{perspective: 1600, perspectiveOrigin: '50% 38%'}}>
        <div
          style={{
            position: 'absolute',
            left: 540 - 230,
            top: 330,
            transformStyle: 'preserve-3d',
            transform: `translateZ(${dolly}px) rotateX(${tiltX}deg) rotateY(${orbitY}deg)`,
          }}
        >
          <Seat id="s1" width={460} height={620} reveal={reveal} />
        </div>
      </AbsoluteFill>

      {/* domanda in alto */}
      <div
        style={{
          position: 'absolute',
          top: 150,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: kick,
          transform: `translateY(${(1 - kick) * -40}px)`,
        }}
      >
        <Kicker>Lo sapevi?</Kicker>
      </div>

      {/* "?" gigante che esplode su "brutto" */}
      <div
        style={{
          position: 'absolute',
          right: 90,
          top: 250,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 300,
          color: C.accent,
          opacity: Math.min(1, q * 1.2),
          transform: `scale(${q}) rotate(${(1 - q) * 30 + drift(f, 2, 4)}deg)`,
          textShadow: `0 30px 80px ${C.accent}55`,
        }}
      >
        ?
      </div>
    </AbsoluteFill>
  );
};

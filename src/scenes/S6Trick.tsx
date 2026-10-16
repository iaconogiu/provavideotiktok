import React from 'react';
import {AbsoluteFill} from 'remotion';
import {drift, soft, tween} from '../lib/anim';
import {useScene} from '../lib/useScene';
import {wordAt} from '../lib/timing';
import {C, FONT} from '../lib/theme';

const START = 33.8;

// "Ed ecco il trucco." — momento keynote: buio, luce, parola.
export const S6Trick: React.FC = () => {
  const {f, T} = useScene(START);
  const tTrucco = T(wordAt('trucco.'));
  const letters = 'Il trucco'.split('');
  const sweep = tween(f, [tTrucco - 10, tTrucco + 40], [-40, 140]);
  const spot = soft(f, 0, 20);

  return (
    <AbsoluteFill style={{background: '#0A0A0B', fontFamily: FONT, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 40% at 50% 38%, ${C.accent}44 0%, transparent 70%)`,
          opacity: spot,
          transform: `scale(${0.8 + spot * 0.3 + drift(f, 1, 0.03)})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 560,
          width: '100%',
          textAlign: 'center',
          fontSize: 190,
          fontWeight: 900,
          letterSpacing: -7,
          perspective: 1200,
          transform: `scale(${1 + f * 0.0015})`,
        }}
      >
        {letters.map((ch, i) => {
          const p = soft(f, tTrucco - 30 + i * 2.5, 15);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                whiteSpace: 'pre',
                color: C.white,
                opacity: p,
                transform: `rotateY(${(1 - p) * 90}deg) translateY(${(1 - p) * 60}px)`,
                backgroundImage: `linear-gradient(100deg, #fff 0%, #fff ${sweep - 20}%, ${C.accent} ${sweep}%, #fff ${sweep + 20}%, #fff 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {ch}
            </span>
          );
        })}
        <span style={{color: C.accent, opacity: soft(f, tTrucco + 10)}}>.</span>
      </div>
    </AbsoluteFill>
  );
};

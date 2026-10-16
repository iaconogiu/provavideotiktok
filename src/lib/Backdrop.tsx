import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from './theme';
import {drift} from './anim';

/** Sfondo chiaro "Apple" con due aloni morbidi che si muovono lentamente. */
export const Backdrop: React.FC<{tint?: number}> = ({tint = 1}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          width: 1400,
          height: 1400,
          left: -500 + drift(f, 0.25, 120),
          top: -300 + drift(f, 0.2, 160, 1),
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.accent}${Math.round(26 * tint)
            .toString(16)
            .padStart(2, '0')} 0%, transparent 60%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 1300,
          height: 1300,
          right: -600 + drift(f, 0.22, 140, 2),
          bottom: -400 + drift(f, 0.3, 120, 3),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,0,0,0.06) 0%, transparent 60%)',
        }}
      />
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT} from './lib/theme';
import {FabricPattern} from './lib/FabricPattern';

/** Foto profilo del canale (1080×1080, pensata per il ritaglio circolare di TikTok) */
export const Avatar: React.FC<{variant: 'blu' | 'nero' | 'tessuto'}> = ({variant}) => {
  const bg = variant === 'blu' ? C.accent : variant === 'nero' ? '#0B0B0D' : '#0B0B0D';
  return (
    <AbsoluteFill style={{background: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
      {variant === 'tessuto' && (
        <AbsoluteFill style={{opacity: 0.9}}>
          <FabricPattern id="av" tile={420} />
        </AbsoluteFill>
      )}
      {variant === 'tessuto' && <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.55) 70%)'}} />}
      <div
        style={{
          width: variant === 'tessuto' ? 560 : 1080,
          height: variant === 'tessuto' ? 560 : 1080,
          borderRadius: '50%',
          background: variant === 'tessuto' ? 'rgba(255,255,255,0.92)' : 'transparent',
          boxShadow: variant === 'tessuto' ? '0 30px 90px rgba(0,0,0,0.5)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: variant === 'tessuto' ? 'blur(20px)' : undefined,
        }}
      >
        <span
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: variant === 'tessuto' ? 400 : 640,
            lineHeight: 1,
            letterSpacing: -20,
            color: variant === 'blu' ? '#FFFFFF' : variant === 'nero' ? '#FFFFFF' : '#0B0B0D',
            transform: 'translateY(-4%)',
          }}
        >
          ?
          {variant === 'nero' && <span style={{color: C.accent}}>!</span>}
        </span>
      </div>
    </AbsoluteFill>
  );
};

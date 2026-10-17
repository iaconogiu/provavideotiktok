import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame} from 'remotion';

/** Grana pellicola + vignetta: cambia ad ogni frame (a 30fps per un look più "film") */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.14}) => {
  const f = Math.floor(useCurrentFrame() / 2);
  const x = Math.floor(random(`gx${f}`) * 512);
  const y = Math.floor(random(`gy${f}`) * 512);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('simba/grain.png')})`,
          backgroundPosition: `${x}px ${y}px`,
          mixBlendMode: 'overlay',
          opacity,
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(130% 90% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)'}} />
      {/* precarico invisibile per evitare frame senza texture */}
      <Img src={staticFile('simba/grain.png')} style={{width: 1, height: 1, opacity: 0}} />
    </AbsoluteFill>
  );
};

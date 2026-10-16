import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {easeInOut} from './anim';

export type Tx = 'zoomThrough' | 'slide3d' | 'fade' | 'rise' | 'none';

/**
 * Involucro di scena: gestisce entrata/uscita con transizioni 3D.
 * Le scene si sovrappongono di `overlap` frame, quindi non ci sono mai tagli secchi.
 */
export const SceneShell: React.FC<{
  enter?: Tx;
  exit?: Tx;
  inDur?: number;
  outDur?: number;
  children: React.ReactNode;
}> = ({enter = 'fade', exit = 'fade', inDur = 24, outDur = 24, children}) => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  const ip = interpolate(f, [0, inDur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut});
  const op = interpolate(f, [d - outDur, d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut});

  const style = (t: Tx, p: number, dir: 1 | -1): React.CSSProperties => {
    // p: 0 = scena piena, 1 = scena assente
    switch (t) {
      case 'zoomThrough':
        return dir === -1
          ? {transform: `scale(${1 + p * 2.6})`, opacity: 1 - p, filter: `blur(${p * 24}px)`}
          : {transform: `scale(${1 - p * 0.45})`, opacity: 1 - p, filter: `blur(${p * 16}px)`};
      case 'slide3d':
        return {
          transform: `perspective(1800px) translateX(${dir * -p * 900}px) rotateY(${dir * p * 55}deg) translateZ(${-p * 500}px)`,
          opacity: 1 - p * 0.9,
        };
      case 'rise':
        return {transform: `translateY(${dir * -p * 380}px) scale(${1 - p * 0.15})`, opacity: 1 - p, filter: `blur(${p * 12}px)`};
      case 'fade':
        return {opacity: 1 - p, filter: `blur(${p * 10}px)`};
      default:
        return {};
    }
  };

  const enterStyle = style(enter, 1 - ip, 1);
  const exitStyle = style(exit, op, -1);
  return (
    <AbsoluteFill style={{...enterStyle}}>
      <AbsoluteFill style={{...exitStyle}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Backdrop} from '../lib/Backdrop';
import {Cap3D, Pen3D, Studio, Trachea3D} from './three';

export const Test3D: React.FC<{which: 'cap' | 'pen' | 'trachea'}> = ({which}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop />
      <ThreeCanvas width={1080} height={1920} camera={{position: [0, 0.5, 12], fov: 30}} gl={{antialias: true, alpha: true}}>
        <Studio />
        {which === 'cap' && <Cap3D rotation={[0.25, f * 0.03 + 0.6, 0.12]} holeGlow={0.6} bites={1} />}
        {which === 'pen' && <Pen3D rotation={[0.3, 0.5, -0.25]} holeGlow={0.8} air={1} t={f / 60} scale={0.55} />}
        {which === 'trachea' && <Trachea3D capY={1} flow={1} t={f / 60} rotation={[0.25, 0.4, 0]} scale={0.32} />}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

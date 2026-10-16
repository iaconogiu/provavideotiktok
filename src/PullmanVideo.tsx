import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import type {Caption} from '@remotion/captions';
import transcript from './transcript.json';
import {Backdrop} from './lib/Backdrop';
import {Seat} from './lib/Seat';
import {Subtitles} from './lib/Subtitles';
import {drift} from './lib/anim';

const captions = transcript as Caption[];

export const PullmanVideo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{perspective: 1800, alignItems: 'center', justifyContent: 'center'}}>
        <div style={{transformStyle: 'preserve-3d', transform: `translateY(-200px) rotateX(${8 + drift(f, 0.6, 4)}deg) rotateY(${drift(f, 0.5, 25)}deg)`}}>
          <Seat id="test" reveal={Math.min(1, f / 120)} />
        </div>
      </AbsoluteFill>
      <Subtitles captions={captions} />
      <Audio src={staticFile('voce.mp3')} />
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import {Subtitles} from '../lib/Subtitles';
import {SceneShell, Tx} from '../lib/SceneShell';
import {FPS} from '../lib/theme';
import {captions, T1Hook, T2Life, T3No, T4World, T5Trick, T6Airway, T7Norm, T8Pen, T9Outro} from './scenes';

// scene sincronizzate sulla trascrizione Whisper (src/tappo/transcript.json)
const SCENES: {from: number; to: number; C: React.FC; enter: Tx; exit: Tx}[] = [
  {from: 0, to: 3.15, C: T1Hook, enter: 'none', exit: 'zoomThrough'},
  {from: 2.8, to: 12.55, C: T2Life, enter: 'fade', exit: 'slide3d'},
  {from: 12.2, to: 17.45, C: T3No, enter: 'slide3d', exit: 'rise'},
  {from: 17.1, to: 26.2, C: T4World, enter: 'rise', exit: 'zoomThrough'},
  {from: 25.85, to: 27.55, C: T5Trick, enter: 'fade', exit: 'zoomThrough'},
  {from: 27.2, to: 35.0, C: T6Airway, enter: 'fade', exit: 'slide3d'},
  {from: 34.65, to: 41.25, C: T7Norm, enter: 'slide3d', exit: 'zoomThrough'},
  {from: 40.9, to: 48.9, C: T8Pen, enter: 'fade', exit: 'slide3d'},
  {from: 48.55, to: 999, C: T9Outro, enter: 'slide3d', exit: 'none'},
];

export const TAPPO_KEYWORDS = ['buco', 'buchino', 'trucco', 'aria', "l'aria", 'respirare', 'vita', 'norma'];

export const TappoVideo: React.FC = () => {
  const {durationInFrames} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#F5F5F7'}}>
      {SCENES.map(({from, to, C, enter, exit}, i) => {
        const start = Math.round(from * FPS);
        const end = Math.min(durationInFrames, Math.round(to * FPS));
        return (
          <Sequence key={i} from={start} durationInFrames={end - start} name={`Scena ${i + 1}`}>
            <SceneShell enter={enter} exit={exit} inDur={21} outDur={21}>
              <C />
            </SceneShell>
          </Sequence>
        );
      })}
      <Subtitles captions={captions} keywords={TAPPO_KEYWORDS} />
      <Audio src={staticFile('tappo/voce.mp3')} />
    </AbsoluteFill>
  );
};

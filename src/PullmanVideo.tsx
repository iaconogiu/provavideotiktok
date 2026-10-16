import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import {Subtitles} from './lib/Subtitles';
import {SceneShell, Tx} from './lib/SceneShell';
import {captions} from './lib/timing';
import {FPS} from './lib/theme';
import {S1Hook} from './scenes/S1Hook';
import {S2Chaos} from './scenes/S2Chaos';
import {S3Everywhere} from './scenes/S3Everywhere';
import {S4NotChance} from './scenes/S4NotChance';
import {S5Dirt} from './scenes/S5Dirt';
import {S6Trick} from './scenes/S6Trick';
import {S7Camouflage} from './scenes/S7Camouflage';
import {S8Wool} from './scenes/S8Wool';
import {S9Outro} from './scenes/S9Outro';

// Ogni scena: [inizio, fine] in secondi (sincronizzati con la voce), con sovrapposizione per le transizioni
export const SCENES: {from: number; to: number; C: React.FC; enter: Tx; exit: Tx}[] = [
  {from: 0, to: 4.65, C: S1Hook, enter: 'none', exit: 'zoomThrough'},
  {from: 4.3, to: 12.2, C: S2Chaos, enter: 'fade', exit: 'slide3d'},
  {from: 11.85, to: 17.7, C: S3Everywhere, enter: 'slide3d', exit: 'zoomThrough'},
  {from: 17.35, to: 22.05, C: S4NotChance, enter: 'fade', exit: 'rise'},
  {from: 21.7, to: 34.15, C: S5Dirt, enter: 'rise', exit: 'zoomThrough'},
  {from: 33.8, to: 35.5, C: S6Trick, enter: 'fade', exit: 'zoomThrough'},
  {from: 35.15, to: 46.2, C: S7Camouflage, enter: 'fade', exit: 'zoomThrough'},
  {from: 45.85, to: 53.4, C: S8Wool, enter: 'fade', exit: 'slide3d'},
  {from: 53.05, to: 999, C: S9Outro, enter: 'slide3d', exit: 'none'},
];

export const PullmanVideo: React.FC = () => {
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
      <Subtitles captions={captions} />
      <Audio src={staticFile('voce.mp3')} />
    </AbsoluteFill>
  );
};

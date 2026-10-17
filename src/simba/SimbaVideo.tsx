import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {SceneShell, Tx} from '../lib/SceneShell';
import {Grain} from './Grain';
import {FPS, K, beatPulse} from './theme';
import {SceneCall, SceneIntro} from './scenesA';
import {SceneFallire, SceneFreedom, SceneOutro, ScenePolo, SceneTree} from './scenesB';

type S = {from: number; to: number; enter: Tx; exit: Tx; node: (from: number, to: number) => React.ReactNode};

// Timeline sincronizzata sulla voce (vedi scripts/simba_lyrics.py) e sul beat (107.7 BPM)
const TIMELINE: S[] = [
  {from: 0, to: 2.15, enter: 'none', exit: 'none', node: () => <SceneIntro />},
  {from: 1.95, to: 6.55, enter: 'zoomThrough', exit: 'slide3d', node: (f) => <SceneCall start={f} line="chiami" />},
  {from: 6.35, to: 9.75, enter: 'slide3d', exit: 'zoomThrough', node: (f) => <SceneFallire start={f} />},
  {from: 9.6, to: 15.2, enter: 'zoomThrough', exit: 'none', node: (f) => <SceneFreedom start={f} />},
  {from: 15.05, to: 18.4, enter: 'fade', exit: 'zoomThrough', node: (f) => <ScenePolo start={f} />},
  {from: 18.25, to: 19.95, enter: 'zoomThrough', exit: 'slide3d', node: (f, t) => <SceneTree start={f} end={t} />},
  {from: 19.75, to: 22.85, enter: 'slide3d', exit: 'zoomThrough', node: (f) => <SceneCall start={f} line="chiami2" />},
  {from: 22.7, to: 99, enter: 'zoomThrough', exit: 'none', node: (f, t) => <SceneOutro start={f} end={t} />},
];

export const SimbaVideo: React.FC = () => {
  const {durationInFrames} = useVideoConfig();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  // "respiro" di camera globale sul beat
  const bump = 1 + beatPulse(t, 9) * 0.018;
  return (
    <AbsoluteFill style={{background: K.black}}>
      <AbsoluteFill style={{transform: `scale(${bump})`}}>
        {TIMELINE.map((s, i) => {
          const start = Math.round(s.from * FPS);
          const end = Math.min(durationInFrames, Math.round(s.to * FPS));
          const to = end / FPS;
          return (
            <Sequence key={i} from={start} durationInFrames={end - start} name={`Scena ${i + 1}`}>
              <SceneShell enter={s.enter} exit={s.exit} inDur={12} outDur={12}>
                {s.node(start / FPS, to)}
              </SceneShell>
            </Sequence>
          );
        })}
      </AbsoluteFill>
      <Grain />
      <Audio src={staticFile('simba/audio.m4a')} />
    </AbsoluteFill>
  );
};

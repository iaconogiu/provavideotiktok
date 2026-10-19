import React from 'react';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile} from 'remotion';
import {DURATION, Lyrics} from './lyrics';
import {FPS, Paper} from './riso';
import {SCENES} from './scenes';

/**
 * Video sul brano "Resta": illustrazioni disegnate in SVG con look risograph a due
 * inchiostri, una scena per frase, testo in basso parola per parola.
 */
export const RESTA_FRAMES = Math.round(DURATION * FPS);

export const Resta: React.FC = () => {
  // il testo è SVG e viene misurato: aspetta i font prima del primo fotogramma
  const [handle] = React.useState(() => delayRender('font'));
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    Promise.all(['70px "Archivo Black"', '40px "Special Elite"'].map((f) => document.fonts.load(f))).then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);
  return (
    <AbsoluteFill>
      <Paper />
      {SCENES.map(([Scene, start], i) => {
        const from = Math.round(start * FPS);
        const to = i + 1 < SCENES.length ? Math.round(SCENES[i + 1][1] * FPS) : RESTA_FRAMES;
        return (
          <Sequence key={i} from={from} durationInFrames={to - from}>
            <Scene start={start} />
          </Sequence>
        );
      })}
      {ready && <Lyrics />}
      <Audio src={staticFile('resta/audio.m4a')} />
    </AbsoluteFill>
  );
};

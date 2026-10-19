import React from 'react';
import {Composition, staticFile} from 'remotion';
import {getAudioDurationInSeconds} from '@remotion/media-utils';
import {PullmanVideo} from './PullmanVideo';
import {FPS, H, W} from './lib/theme';
import {SimbaV5} from './simba/SimbaV5';
import {Avatar} from './Avatar';
import {DURATION} from './simba/theme';
import {INCHIOSTRO_FRAMES, Inchiostro} from './inchiostro/Inchiostro';
import * as INK from './inchiostro/ink';
import {RESTA_FRAMES, Resta} from './resta/Resta';

export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="PullmanVideo"
    component={PullmanVideo}
    width={W}
    height={H}
    fps={FPS}
    durationInFrames={FPS * 58}
    calculateMetadata={async () => {
      // la durata del video è quella dell'audio
      const sec = await getAudioDurationInSeconds(staticFile('voce.mp3'));
      return {durationInFrames: Math.ceil(sec * FPS)};
    }}
  />
  <Composition id="Simba22Freedom" component={SimbaV5} width={W} height={H} fps={FPS} durationInFrames={Math.floor(DURATION * FPS)} />
  <Composition id="Avatar" component={Avatar} width={1080} height={1080} fps={30} durationInFrames={1} defaultProps={{variant: 'blu' as const}} />
  <Composition id="Inchiostro" component={Inchiostro} width={INK.W} height={INK.H} fps={INK.FPS} durationInFrames={INCHIOSTRO_FRAMES} />
  <Composition id="Resta" component={Resta} width={INK.W} height={INK.H} fps={INK.FPS} durationInFrames={RESTA_FRAMES} />
  </>
);

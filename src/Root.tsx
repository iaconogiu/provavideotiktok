import React from 'react';
import {Composition, staticFile} from 'remotion';
import {getAudioDurationInSeconds} from '@remotion/media-utils';
import {PullmanVideo} from './PullmanVideo';
import {FPS, H, W} from './lib/theme';
import {SimbaV5} from './simba/SimbaV5';
import {Avatar} from './Avatar';
import {TappoVideo} from './tappo/TappoVideo';
import {Test3D} from './tappo/Test3D';
import {DURATION} from './simba/theme';
import {INCHIOSTRO_FRAMES, Inchiostro} from './inchiostro/Inchiostro';
import * as INK from './inchiostro/ink';
import {RESTA_FRAMES, Resta} from './resta/Resta';
import {FPS as UNO_FPS, UNO_FRAMES, Uno} from './uno/Uno';
import {ANGOLO_FRAMES, Angolo} from './angolo/Angolo';
import {FPS as ANG_FPS} from './angolo/kit';
import {LUNA_FRAMES, Luna} from './luna/Luna';

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
  <Composition
    id="TappoPenna"
    component={TappoVideo}
    width={W}
    height={H}
    fps={FPS}
    durationInFrames={FPS * 55}
    calculateMetadata={async () => ({durationInFrames: Math.ceil((await getAudioDurationInSeconds(staticFile('tappo/voce.mp3'))) * FPS)})}
  />
  <Composition id="Test3D" component={Test3D} width={1080} height={1920} fps={60} durationInFrames={120} defaultProps={{which: 'cap' as const}} />
  <Composition id="Avatar" component={Avatar} width={1080} height={1080} fps={30} durationInFrames={1} defaultProps={{variant: 'blu' as const}} />
  <Composition id="Inchiostro" component={Inchiostro} width={INK.W} height={INK.H} fps={INK.FPS} durationInFrames={INCHIOSTRO_FRAMES} />
  <Composition id="Resta" component={Resta} width={INK.W} height={INK.H} fps={INK.FPS} durationInFrames={RESTA_FRAMES} />
  <Composition id="Uno" component={Uno} width={1080} height={1920} fps={UNO_FPS} durationInFrames={UNO_FRAMES} />
  <Composition id="Angolo" component={Angolo} width={1920} height={1080} fps={ANG_FPS} durationInFrames={ANGOLO_FRAMES} />
  <Composition id="Luna" component={Luna} width={1920} height={1080} fps={ANG_FPS} durationInFrames={LUNA_FRAMES} />
  </>
);

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
import {TOSSICO_FRAMES, Tossico} from './tossico/Tossico';
import {FIERO_FRAMES, Fiero} from './fiero/Fiero';
import {FREEDOM_FRAMES, Freedom} from './freedom/Freedom';
import {FPS as ROC_FPS, ROCCIA_FRAMES, Roccia} from './roccia/Roccia';
import {DIO_FRAMES, Dio, FPS as DIO_FPS} from './dio/Dio';
import {ARTE_FRAMES, Arte, FPS as ARTE_FPS} from './arte/Arte';
import {FPS as PRO_FPS, PRONOSTICO_FRAMES, Pronostico} from './pronostico/Pronostico';
import {FPS as MOTB_FPS, OSK_MOTB_FRAMES, OskarssonMotb} from './motb/OskarssonMotb';

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
  <Composition id="Tossico" component={Tossico} width={1920} height={1080} fps={ANG_FPS} durationInFrames={TOSSICO_FRAMES} />
  <Composition id="Fiero" component={Fiero} width={1920} height={1080} fps={ANG_FPS} durationInFrames={FIERO_FRAMES} />
  <Composition id="Freedom" component={Freedom} width={1920} height={1080} fps={60} durationInFrames={FREEDOM_FRAMES} />
      <Composition id="Roccia" component={Roccia} width={1920} height={1080} fps={ROC_FPS} durationInFrames={ROCCIA_FRAMES} />
      <Composition id="Dio" component={Dio} width={1920} height={1080} fps={DIO_FPS} durationInFrames={DIO_FRAMES} />
      <Composition id="Arte" component={Arte} width={1080} height={1920} fps={ARTE_FPS} durationInFrames={ARTE_FRAMES} />
      <Composition id="OskarssonPronostico" component={Pronostico} width={1080} height={1920} fps={PRO_FPS} durationInFrames={PRONOSTICO_FRAMES} />
      <Composition id="OskarssonMotb" component={OskarssonMotb} width={1080} height={1920} fps={MOTB_FPS} durationInFrames={OSK_MOTB_FRAMES} />
  </>
);

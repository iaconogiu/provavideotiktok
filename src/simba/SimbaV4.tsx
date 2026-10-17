import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './Grain';
import {FPS, K, UI, beatPulse, lineWords} from './theme';
import {BigWord, FitLyrics} from './FitLyrics';
import {CallBanner, Clocks, FallireFx, FreedomFx, HITS, T} from './SimbaV3';
import {easeInOut, easeOut, soft} from '../lib/anim';

const cl = (t: number, a: number, b: number, e = easeInOut) =>
  interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
const sp = (t: number, at: number) => soft(t * FPS, at * FPS, 16, 0.7);
const ws = (line: string, i: number) => lineWords(line)[i].startMs / 1000;
const vid = (n: Src) => staticFile(`simba/vid/${n}.mp4`);

type Src = 'fabrique' | 'brescia' | 'intervista';
type Clip = {
  src: Src;
  at: number; // secondo nel video sorgente
  from: number; // secondo nell'audio
  to: number;
  rate?: number;
  fx?: number; // centro del ritaglio quadrato (0..1 sulla larghezza)
  z0?: number;
  z1?: number;
  enter?: 'flash' | 'zoom' | 'whip';
  fit?: 'width'; // mostra tutto il 16:9 (per il logo sul palco)
};

// Finestra quadrata 1080×1080: il ritaglio esclude i loghi delle testate (accreditate in basso)
const WIN_Y = 300;
const WIN = 1080;

const CLIPS: Clip[] = [
  {src: 'fabrique', at: 3.0, from: 0, to: 2.05, fx: 0.55, z0: 1.0, z1: 1.12},
  {src: 'intervista', at: 24.0, from: 2.05, to: T.fusi, fx: 0.42, z0: 1.08, z1: 1.15, enter: 'zoom'},
  {src: 'brescia', at: 42.0, from: T.fusi, to: T.saro - 0.08, fx: 0.5, z0: 1.05, z1: 1.15, enter: 'whip'},
  {src: 'fabrique', at: 54.0, from: T.saro - 0.08, to: 5.2, fx: 0.55, z0: 1.0, z1: 1.1, enter: 'flash'},
  {src: 'intervista', at: 2.0, from: 5.2, to: 6.45, fx: 0.5, z0: 1.05, z1: 1.12},
  {src: 'intervista', at: 151.0, from: 6.45, to: ws('fallire', 4), fx: 0.55, z0: 1.05, z1: 1.15, enter: 'whip'},
  {src: 'intervista', at: 122.0, from: ws('fallire', 4), to: T.pero, fx: 0.5, z0: 1.1, z1: 1.18, enter: 'zoom'},
  {src: 'intervista', at: 161.7, from: T.pero, to: HITS[0] - 0.02, fx: 0.5, z0: 1.0, z1: 1.1, enter: 'flash'},
  {src: 'fabrique', at: 11.5, from: HITS[0] - 0.02, to: HITS[1] - 0.02, fx: 0.6, z0: 1.18, z1: 1.04, enter: 'flash'},
  {src: 'intervista', at: 88.0, from: HITS[1] - 0.02, to: HITS[2] - 0.02, fx: 0.5, z0: 1.18, z1: 1.04, enter: 'flash'},
  {src: 'fabrique', at: 69.5, from: HITS[2] - 0.02, to: HITS[3] - 0.02, fx: 0.55, z0: 1.18, z1: 1.04, enter: 'flash'},
  {src: 'intervista', at: 91.8, from: HITS[3] - 0.02, to: 13.49, fx: 0.5, z0: 1.15, z1: 1.04, enter: 'flash'},
  {src: 'intervista', at: 52.05, from: 13.49, to: HITS[4] - 0.02, fx: 0.5, z0: 1.05, z1: 1.15, enter: 'zoom'},
  {src: 'intervista', at: 128.25, from: HITS[4] - 0.02, to: T.sole - 0.05, fx: 0.6, z0: 1.2, z1: 1.0, enter: 'flash'},
  // l'albero della vita proiettato sul palco cresce (accelerato)
  {src: 'fabrique', at: 27.6, from: T.sole - 0.05, to: 18.25, rate: 3.6, fx: 0.5, z0: 1.0, z1: 1.12},
  // il logo MIRIA svelato dal vivo
  {src: 'fabrique', at: 43.5, from: 18.25, to: T.chiami2 - 0.05, rate: 2.5, fx: 0.5, z0: 1.0, z1: 1.08, fit: 'width'},
  {src: 'intervista', at: 94.05, from: T.ma2, to: T.outro, fx: 0.55, z0: 1.05, z1: 1.15, enter: 'flash'},
  {src: 'fabrique', at: 49.0, from: T.outro, to: 99, rate: 0.5, fx: 0.5, z0: 1.05, z1: 1.12, enter: 'zoom', fit: 'width'},
];

/** Video ritagliato in un riquadro (la sorgente 1920×1080 viene ritagliata attorno a fx) */
const Framed: React.FC<{c: Clip; t: number; w: number; h: number; bg?: boolean}> = ({c, t, w, h, bg}) => {
  const k = cl(t, c.from, c.to, (x) => x);
  const e = cl(t, c.from - 0.02, c.from + 0.22, easeOut);
  const z = (c.z0 ?? 1.05) + ((c.z1 ?? 1.12) - (c.z0 ?? 1.05)) * k + (c.enter === 'zoom' ? (1 - e) * 0.2 : c.enter === 'flash' ? (1 - e) * 0.08 : 0);
  const tx = c.enter === 'whip' ? (1 - e) * 600 : 0;
  const blur = c.enter === 'whip' ? (1 - e) * 20 : c.enter === 'zoom' ? (1 - e) * 8 : 0;
  // dimensione del video affinché copra il riquadro in altezza
  const fitW = c.fit === 'width' && !bg;
  const vh = fitW ? (w * 9) / 16 : h;
  const vw = fitW ? w : (vh * 16) / 9;
  const left = fitW ? 0 : w / 2 - vw * (c.fx ?? 0.5);
  const top = fitW ? (h - vh) / 2 : 0;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left, top, width: vw, height: vh, transform: `translateX(${tx}px) scale(${bg ? 1 : z})`, transformOrigin: `${(c.fx ?? 0.5) * 100}% 50%`, filter: bg ? 'blur(40px) brightness(0.4) saturate(1.2)' : `blur(${blur}px)`}}>
        <OffthreadVideo src={vid(c.src)} muted trimBefore={Math.round(c.at * FPS)} playbackRate={c.rate ?? 1} style={{width: '100%', height: '100%'}} />
      </div>
    </div>
  );
};

const ClipLayer: React.FC<{c: Clip; bg?: boolean}> = ({c, bg}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS + c.from;
  return bg ? <Framed c={c} t={t} w={1080} h={1920} bg /> : <Framed c={c} t={t} w={WIN} h={WIN} />;
};

/** Ripresa di "Se chiami…": tre fasce video che entrano sulle parole */
const STACK: {c: Clip; at: number; dir: number}[] = [
  {c: {src: 'intervista', at: 19.0, from: T.chiami2 - 0.05, to: T.ma2, fx: 0.5}, at: ws('chiami2', 0), dir: -1},
  {c: {src: 'brescia', at: 45.3, from: T.chiami2 - 0.05, to: T.ma2, fx: 0.5}, at: ws('chiami2', 2), dir: 1},
  {c: {src: 'fabrique', at: 61.5, from: T.chiami2 - 0.05, to: T.ma2, fx: 0.55}, at: ws('chiami2', 4), dir: -1},
];

export const SimbaV4: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const bump = 1 + beatPulse(t, 9) * 0.02;
  const inFree = t >= HITS[0] - 0.05 && t < T.sole - 0.1;
  const n = HITS.filter((h) => t >= h - 0.02).length;
  const lastHit = n ? HITS[n - 1] : -10;
  const flashCuts = [T.saro - 0.08, T.pero, ...HITS.map((h) => h - 0.02), T.ma2];
  const flash = Math.max(0, ...flashCuts.map((c) => (t >= c ? Math.exp(-(t - c) * 14) : 0)));
  const shake = inFree ? Math.exp(-(t - lastHit) * 7) * 16 : t > T.faro && t < T.faro + 0.5 ? Math.exp(-(t - T.faro) * 8) * 16 : 0;
  const sun = cl(t, T.raggi - 0.2, T.polo + 0.2) * (1 - cl(t, 18.1, 18.4));
  const outro = sp(t, T.outro + 0.32);
  const dim = Math.max(cl(t, T.fallire - 0.2, T.fallire) * (1 - cl(t, T.faro + 0.6, T.faro + 0.9)) * 0.4, inFree ? 0.3 : 0, outro * 0.45);
  const inStack = t >= T.chiami2 - 0.05 && t < T.ma2;
  const intro = cl(t, 0, 0.35);

  const seq = (c: Clip, i: number, bg?: boolean) => {
    const from = Math.round(c.from * FPS);
    const dur = Math.round(Math.min(c.to, 23.66) * FPS) - from;
    return (
      <Sequence key={`${bg ? 'b' : 'f'}${i}`} from={from} durationInFrames={Math.max(1, dur)} layout="none">
        <ClipLayer c={c} bg={bg} />
      </Sequence>
    );
  };

  return (
    <AbsoluteFill style={{background: K.black, overflow: 'hidden'}}>
      {/* sfondo: stesso video, sfocato */}
      <AbsoluteFill>{CLIPS.map((c, i) => seq(c, i, true))}</AbsoluteFill>

      {/* finestra video */}
      {!inStack && (
        <div style={{position: 'absolute', left: 0, top: WIN_Y, width: WIN, height: WIN, overflow: 'hidden', boxShadow: '0 30px 100px rgba(0,0,0,0.6)', transform: `scale(${bump}) translate(${(random(`x${frame}`) - 0.5) * shake}px, ${(random(`y${frame}`) - 0.5) * shake}px)`}}>
          {CLIPS.map((c, i) => seq(c, i))}
          <AbsoluteFill style={{opacity: sun, mixBlendMode: 'screen', background: 'radial-gradient(60% 50% at 50% 55%, rgba(255,200,130,0.85) 0%, rgba(255,120,40,0.3) 45%, transparent 75%)'}} />
          <AbsoluteFill style={{background: '#000', opacity: dim}} />
          <AbsoluteFill style={{background: 'linear-gradient(180deg, transparent 70%, rgba(0,0,0,0.55) 100%)'}} />
        </div>
      )}

      {/* tre fasce per la ripresa */}
      {inStack &&
        STACK.map((s, i) => {
          const e = Math.min(1, sp(t, s.at - 0.05));
          const H = 560;
          return (
            <div key={i} style={{position: 'absolute', left: 0, top: 120 + i * (H + 10), width: 1080, height: H, overflow: 'hidden', transform: `translateX(${(1 - e) * s.dir * 1100}px)`}}>
              <Sequence from={Math.round(s.c.from * FPS)} layout="none">
                <StackClip c={s.c} h={H} />
              </Sequence>
            </div>
          );
        })}

      <AbsoluteFill style={{background: '#fff', opacity: flash * 0.5}} />

      {/* crediti video */}
      <div style={{position: 'absolute', left: 30, top: WIN_Y + WIN - 46, fontFamily: UI, fontSize: 22, fontWeight: 600, color: 'rgba(255,255,255,0.7)', opacity: inStack ? 0 : 1}}>video: askanews · Teletutto</div>

      {/* INTRO */}
      {t < 2.3 && (
        <div style={{position: 'absolute', left: 90, width: 900, top: 640, opacity: sp(t, 0.62) * (1 - cl(t, 1.85, 2.15))}}>
          <BigWord text="22SIMBA" width={900} style={{color: K.paper, textShadow: '0 10px 60px rgba(0,0,0,0.7)'}} />
          <BigWord text="FREEDOM" width={480} letterSpacing={20} style={{color: K.paper, opacity: sp(t, 1.2)}} />
        </div>
      )}

      <CallBanner t={t} inAt={T.chiami - 0.3} outAt={T.fallire - 0.4} acceptAt={T.saro} since={T.saro} />
      <Clocks t={t} inAt={T.fusi - 0.1} outAt={T.saro - 0.1} top={980} />
      <CallBanner t={t} inAt={T.chiami2 - 0.2} outAt={T.outro} acceptAt={0} since={T.saro - 17} />
      <Clocks t={t} inAt={T.ma2 - 0.05} outAt={T.outro + 0.05} top={980} converge={T.saro2} />

      <FallireFx t={t} />
      {inFree && <FreedomFx t={t} />}

      <FitLyrics line="intro" start={0} top={1440} maxRows={1} maxSize={96} />
      <FitLyrics line="chiami" start={0} top={1440} maxRows={2} maxSize={96} keywords={['fusi', 'orari']} />
      <FitLyrics line="fallire" start={0} top={1440} maxRows={2} maxSize={96} keywords={['farò']} />
      <FitLyrics line="sole" start={0} top={1440} maxRows={2} maxSize={96} keywords={['sole', 'raggi']} />
      <FitLyrics line="chiami2" start={0} top={1820 - 380} maxRows={2} maxSize={96} keywords={['fusi', 'orari']} />

      {/* OUTRO */}
      {t > T.outro && (
        <div style={{position: 'absolute', left: 90, width: 900, top: 1440, opacity: outro}}>
          <BigWord text="22SIMBA" width={620} style={{color: K.paper, margin: '0 auto'}} />
          <div style={{textAlign: 'center', fontFamily: UI, fontSize: 30, fontWeight: 700, letterSpacing: 12, color: 'rgba(241,238,230,0.7)'}}>FREEDOM · DALL’ALBUM MIRIA</div>
        </div>
      )}
      <AbsoluteFill style={{background: '#000', opacity: Math.max(1 - intro, cl(t, 23.4, 23.66))}} />
      <Grain opacity={0.1} />
      <Audio src={staticFile('simba/audio.m4a')} />
      <Img src={staticFile('simba/img/freedom_cover.jpg')} style={{display: 'none'}} />
    </AbsoluteFill>
  );
};

const StackClip: React.FC<{c: Clip; h: number}> = ({c, h}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS + c.from;
  return <Framed c={{...c, z0: 1.05, z1: 1.12}} t={t} w={1080} h={Math.max(h, 1080 * (9 / 16))} />;
};

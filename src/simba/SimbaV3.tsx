import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './Grain';
import {DISPLAY, FPS, K, UI, beatPulse, lineWords} from './theme';
import {Clock} from './parts';
import {BigWord, FitLyrics} from './FitLyrics';
import {drift, easeInOut, easeOut, pop, soft} from '../lib/anim';

const cl = (t: number, a: number, b: number, e = easeInOut) =>
  interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
const sp = (t: number, at: number) => soft(t * FPS, at * FPS, 16, 0.7);
const pp = (t: number, at: number) => pop(t * FPS, at * FPS);
const ws = (line: string, i: number) => lineWords(line)[i].startMs / 1000;
const img = (name: string) => staticFile(`simba/img/${name}.jpg`);

const HITS = lineWords('freedom').map((w) => w.startMs / 1000);
const T = {
  chiami: ws('chiami', 0),
  fusi: ws('chiami', 4),
  saro: ws('chiami', 9),
  fallire: ws('fallire', 2),
  domani: ws('fallire', 4),
  pero: ws('fallire', 5),
  faro: ws('fallire', 7),
  sole: ws('sole', 0),
  raggi: ws('sole', 5),
  polo: ws('sole', 8),
  chiami2: ws('chiami2', 0),
  fusi2: ws('chiami2', 4),
  ma2: ws('chiami2', 6),
  saro2: ws('chiami2', 9),
  outro: 22.7,
};

type ShotDef = {
  src: string;
  from: number;
  to: number;
  fx?: number; // punto focale orizzontale 0..1
  fy?: number;
  z0?: number;
  z1?: number;
  pan?: number; // spostamento orizzontale in px durante lo shot
  enter?: 'zoom' | 'whipL' | 'whipR' | 'fade' | 'flash';
  grade?: string;
};

// ── montaggio: ogni taglio cade su una parola o su un colpo di beat ──
const SHOTS: ShotDef[] = [
  {src: 'freedom_cover', from: 0, to: 2.05, fx: 0.5, fy: 0.55, z0: 1.0, z1: 1.28, enter: 'fade'},
  {src: 'smile', from: 2.05, to: T.fusi, fx: 0.5, fy: 0.38, z0: 1.12, z1: 1.25, enter: 'zoom'},
  {src: 'forum_a', from: T.fusi, to: T.saro - 0.08, fx: 0.42, fy: 0.5, z0: 1.05, z1: 1.18, pan: -60, enter: 'whipL'},
  {src: 'crowd_bw', from: T.saro - 0.08, to: 5.2, fx: 0.5, fy: 0.5, z0: 1.0, z1: 1.12, enter: 'flash'},
  {src: 'nonna', from: 5.2, to: 6.45, fx: 0.47, fy: 0.45, z0: 1.05, z1: 1.16, enter: 'fade'},
  {src: 'roccia_a', from: 6.45, to: T.domani - 0.1, fx: 0.42, fy: 0.45, z0: 1.05, z1: 1.15, pan: 40, enter: 'whipR'},
  {src: 'roccia_b', from: T.domani - 0.1, to: T.pero, fx: 0.55, fy: 0.45, z0: 1.1, z1: 1.2, enter: 'zoom'},
  {src: 'roccia_crowd', from: T.pero, to: HITS[0] - 0.02, fx: 0.55, fy: 0.5, z0: 1.0, z1: 1.12, enter: 'flash'},
  {src: 'stage22', from: HITS[0] - 0.02, to: HITS[1] - 0.02, fx: 0.5, fy: 0.5, z0: 1.15, z1: 1.0, enter: 'flash'},
  {src: 'verona_b', from: HITS[1] - 0.02, to: HITS[2] - 0.02, fx: 0.45, fy: 0.45, z0: 1.18, z1: 1.04, enter: 'flash'},
  {src: 'forum_b', from: HITS[2] - 0.02, to: HITS[3] - 0.02, fx: 0.4, fy: 0.45, z0: 1.18, z1: 1.06, enter: 'flash'},
  {src: 'shine_a', from: HITS[3] - 0.02, to: 13.49, fx: 0.45, fy: 0.45, z0: 1.18, z1: 1.06, enter: 'flash'},
  {src: 'shine_b', from: 13.49, to: HITS[4] - 0.02, fx: 0.5, fy: 0.45, z0: 1.1, z1: 1.18, enter: 'zoom'},
  {src: 'rho_b', from: HITS[4] - 0.02, to: T.sole - 0.05, fx: 0.47, fy: 0.42, z0: 1.2, z1: 1.0, enter: 'flash'},
  {src: 'tree_night', from: T.sole - 0.05, to: T.raggi, fx: 0.5, fy: 0.5, z0: 1.0, z1: 1.12, enter: 'fade'},
  {src: 'tree_sunset', from: T.raggi, to: 18.25, fx: 0.5, fy: 0.5, z0: 1.12, z1: 1.25, enter: 'fade'},
  {src: 'blue_art', from: 18.25, to: T.chiami2 - 0.05, fx: 0.3, fy: 0.5, z0: 1.05, z1: 1.1, pan: -260, enter: 'fade'},
  // 19.85 → 21.74: pannelli impilati (vedi Stack)
  {src: 'fans_b', from: T.ma2, to: T.outro, fx: 0.55, fy: 0.45, z0: 1.05, z1: 1.18, enter: 'flash'},
  {src: 'freedom_cover2', from: T.outro, to: 99, fx: 0.5, fy: 0.55, z0: 1.15, z1: 1.3, enter: 'zoom'},
];

const Shot: React.FC<{s: ShotDef; t: number}> = ({s, t}) => {
  if (t < s.from - 0.2 || t >= s.to) return null;
  const k = cl(t, s.from, s.to, (x) => x);
  const e = cl(t, s.from - 0.02, s.from + 0.22, easeOut); // entrata
  const z = (s.z0 ?? 1.05) + ((s.z1 ?? 1.15) - (s.z0 ?? 1.05)) * k;
  let tx = (s.pan ?? 0) * k;
  let extraZ = 0;
  let blur = 0;
  let op = 1;
  switch (s.enter) {
    case 'zoom':
      extraZ = (1 - e) * 0.18;
      blur = (1 - e) * 10;
      break;
    case 'whipL':
    case 'whipR':
      tx += (1 - e) * (s.enter === 'whipL' ? 700 : -700);
      blur = (1 - e) * 22;
      break;
    case 'fade':
      op = cl(t, s.from - 0.2, s.from + 0.25);
      break;
    case 'flash':
      extraZ = (1 - e) * 0.1;
      break;
  }
  return (
    <AbsoluteFill style={{opacity: op, overflow: 'hidden'}}>
      <Img
        src={img(s.src)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: `${(s.fx ?? 0.5) * 100}% ${(s.fy ?? 0.5) * 100}%`,
          transform: `translateX(${tx}px) scale(${z + extraZ}) rotate(${drift(t * FPS, 0.4, 0.6)}deg)`,
          filter: `blur(${blur}px) contrast(1.06) saturate(0.95) ${s.grade ?? ''}`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Pannelli impilati per la ripresa di "Se chiami…" */
const Stack: React.FC<{t: number}> = ({t}) => {
  const from = T.chiami2 - 0.05;
  const to = T.ma2;
  if (t < from || t >= to) return null;
  const panels = [
    {src: 'session_a', at: ws('chiami2', 0), dir: -1},
    {src: 'verona_a', at: ws('chiami2', 2), dir: 1},
    {src: 'fans_a', at: ws('chiami2', 4), dir: -1},
  ];
  const H = 600;
  return (
    <AbsoluteFill style={{background: K.black}}>
      {panels.map((p, i) => {
        const e = Math.min(1, sp(t, p.at - 0.05));
        return (
          <div key={i} style={{position: 'absolute', left: 0, top: 30 + i * (H + 12), width: 1080, height: H, overflow: 'hidden', transform: `translateX(${(1 - e) * p.dir * 1100}px)`}}>
            <Img src={img(p.src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.08 + cl(t, p.at, to, (x) => x) * 0.08})`, filter: 'contrast(1.06)'}} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ── banner di chiamata (stile iOS) ──
const CallBanner: React.FC<{t: number; inAt: number; outAt: number; acceptAt: number; since: number}> = ({t, inAt, outAt, acceptAt, since}) => {
  const p = sp(t, inAt) * (1 - cl(t, outAt - 0.2, outAt));
  if (p <= 0.001) return null;
  const acc = t >= acceptAt;
  const ring = !acc ? beatPulse(t, 5) : 0;
  const secs = Math.max(0, Math.floor(t - since));
  return (
    <div style={{position: 'absolute', left: 50, top: 150, width: 980, opacity: p, transform: `translateY(${(1 - p) * -80}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 24, padding: '22px 26px', borderRadius: 46, background: 'rgba(18,18,20,0.6)', backdropFilter: 'blur(30px) saturate(150%)', border: '1px solid rgba(255,255,255,0.14)', fontFamily: UI, color: K.paper}}>
        <div style={{width: 92, height: 92, borderRadius: 46, overflow: 'hidden', border: `2px solid ${K.paper}`, transform: `scale(${1 + ring * 0.08})`}}>
          <Img src={img('freedom_cover')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </div>
        <div style={{flex: 1}}>
          <div style={{fontSize: 26, fontWeight: 600, color: 'rgba(241,238,230,0.6)'}}>{acc ? `In chiamata · 00:${String(secs).padStart(2, '0')}` : 'Chiamata in arrivo…'}</div>
          <div style={{fontSize: 50, fontWeight: 800, letterSpacing: -1}}>22simba</div>
        </div>
        <div style={{width: 86, height: 86, borderRadius: 43, background: acc ? '#3A3A3C' : '#30D158', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + ring * 0.14})`}}>
          <svg width={42} height={42} viewBox="0 0 24 24" style={{transform: `rotate(${acc ? 135 : 0}deg)`}}>
            <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" fill="#fff" />
          </svg>
        </div>
      </div>
    </div>
  );
};

const CITIES = [
  {label: 'Milano', h: 3},
  {label: 'New York', h: 21},
  {label: 'Tokyo', h: 10},
];
const Clocks: React.FC<{t: number; inAt: number; outAt: number; top: number; converge?: number}> = ({t, inAt, outAt, top, converge}) => {
  const p = sp(t, inAt) * (1 - cl(t, outAt - 0.2, outAt));
  if (p <= 0.001) return null;
  const spin = cl(t, inAt, inAt + 0.9);
  const conv = converge ? cl(t, converge - 0.4, converge + 0.25, easeOut) : 0;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center', gap: 34}}>
      {CITIES.map((c, i) => {
        const q = Math.min(1, pp(t, inAt + i * 0.07));
        const extra = spin * 720 * (i % 2 ? -1 : 1);
        return (
          <div key={i} style={{padding: '20px 16px 14px', borderRadius: 32, background: 'rgba(18,18,20,0.55)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.14)', opacity: p * q, transform: `translateY(${(1 - q) * 70}px)`}}>
            <Clock size={180} hours={c.h + (22 - c.h) * conv + extra / 720} minutes={22 + extra / 6} label={c.label} sub={conv > 0.9 ? '22:22' : undefined} accent={conv > 0.9} />
          </div>
        );
      })}
    </div>
  );
};

const FallireFx: React.FC<{t: number}> = ({t}) => {
  if (t < T.fallire - 0.2 || t > T.faro + 1.0) return null;
  const appear = sp(t, T.fallire - 0.08);
  const rebuild = sp(t, T.pero);
  const stamp = Math.min(1, pp(t, T.faro - 0.04));
  const out = cl(t, T.faro + 0.6, T.faro + 0.9);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 560, opacity: 1 - out}}>
      <div style={{display: 'flex', justifyContent: 'center'}}>
        {'FALLIRE'.split('').map((l, i) => {
          const ft = Math.max(0, Math.min(t, T.pero) - (T.fallire + 0.3 + i * 0.07));
          const y = 0.5 * 2600 * ft * ft * (1 - rebuild);
          const rz = ft * (random(`rz${i}`) - 0.5) * 260 * (1 - rebuild);
          return (
            <span key={i} style={{fontFamily: DISPLAY, fontSize: 230, lineHeight: 1.2, color: K.paper, opacity: appear, display: 'inline-block', transform: `translateY(${y + (1 - appear) * 100}px) rotateZ(${rz}deg)`, textShadow: '0 10px 50px rgba(0,0,0,0.7)'}}>
              {l}
            </span>
          );
        })}
      </div>
      <div style={{display: 'flex', justifyContent: 'center', marginTop: 10, opacity: stamp, transform: `scale(${2 - stamp}) rotate(-3deg)`}}>
        <div style={{background: K.paper, padding: '0 34px', borderRadius: 8}}>
          <BigWord text="LO FARÒ" width={620} style={{color: K.ink}} />
        </div>
      </div>
    </div>
  );
};

const VARIANTS: React.CSSProperties[] = [
  {},
  {color: K.paper},
  {color: 'transparent', WebkitTextStroke: `4px ${K.paper}`},
  {color: K.ink, background: K.paper, padding: '0 30px'},
  {color: 'transparent', WebkitTextStroke: `4px ${K.paper}`},
  {color: K.paper},
];

const FreedomFx: React.FC<{t: number}> = ({t}) => {
  const n = HITS.filter((h) => t >= h - 0.02).length;
  if (!n || t > T.sole - 0.1) return null;
  const last = HITS[n - 1];
  const p = Math.min(1.15, pp(t, last));
  const out = cl(t, T.sole - 0.6, T.sole - 0.1);
  return (
    <>
      {[1, 2].map((k) => (
        <div key={k} style={{position: 'absolute', left: 0, right: 0, top: 820, display: 'flex', justifyContent: 'center', opacity: (0.3 / k) * (1 - out), transform: `scale(${1 + k * 0.2 * p})`}}>
          <BigWord text="FREEDOM" width={900} style={{color: 'transparent', WebkitTextStroke: `2px ${K.paper}`}} />
        </div>
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, top: 820, display: 'flex', justifyContent: 'center', opacity: 1 - out, transform: `scale(${1.4 - p * 0.4})`}}>
        <div style={{...VARIANTS[n], borderRadius: 10, textShadow: VARIANTS[n].background ? 'none' : '0 10px 60px rgba(0,0,0,0.6)'}}>
          <BigWord text="FREEDOM" width={n === 3 ? 840 : 900} style={{color: 'inherit', WebkitTextStroke: VARIANTS[n].WebkitTextStroke}} />
        </div>
      </div>
      <div style={{position: 'absolute', top: 1180, width: '100%', display: 'flex', justifyContent: 'center', gap: 24, opacity: 1 - out}}>
        {HITS.map((_, i) => (
          <div key={i} style={{width: 24, height: 24, borderRadius: 12, background: i < n ? K.paper : 'rgba(255,255,255,0.25)', transform: `scale(${i === n - 1 ? 2.15 - p : 1})`}} />
        ))}
      </div>
    </>
  );
};

export const SimbaV3: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const bump = 1 + beatPulse(t, 9) * 0.02;
  const inFree = t >= HITS[0] - 0.05 && t < T.sole - 0.1;
  const n = HITS.filter((h) => t >= h - 0.02).length;
  const lastHit = n ? HITS[n - 1] : -10;
  // flash bianco sui tagli "flash" e sui colpi di freedom
  const flashCuts = [T.saro - 0.08, T.pero, ...HITS.map((h) => h - 0.02), T.ma2];
  const flash = Math.max(0, ...flashCuts.map((c) => (t >= c ? Math.exp(-(t - c) * 14) : 0)));
  const shake = inFree ? Math.exp(-(t - lastHit) * 7) * 18 : t > T.faro && t < T.faro + 0.5 ? Math.exp(-(t - T.faro) * 8) * 18 : 0;
  const sun = cl(t, T.raggi - 0.2, T.polo + 0.2) * (1 - cl(t, 18.1, 18.4));
  const logoMid = cl(t, 18.35, 18.75) * (1 - cl(t, T.chiami2 - 0.25, T.chiami2));
  const logoNonna = cl(t, 5.45, 5.85, easeOut) * (1 - cl(t, 6.25, 6.45));
  const outro = sp(t, T.outro + 0.1);
  const dim = Math.max(cl(t, T.fallire - 0.2, T.fallire) * (1 - cl(t, T.faro + 0.6, T.faro + 0.9)) * 0.45, inFree ? 0.35 : 0, logoMid * 0.35, outro * 0.5);

  return (
    <AbsoluteFill style={{background: K.black, overflow: 'hidden'}}>
      {/* immagini */}
      <AbsoluteFill style={{transform: `scale(${bump}) translate(${(random(`x${frame}`) - 0.5) * shake}px, ${(random(`y${frame}`) - 0.5) * shake}px)`}}>
        {SHOTS.map((s, i) => (
          <Shot key={i} s={s} t={t} />
        ))}
        <Stack t={t} />
      </AbsoluteFill>

      {/* luce del sole sull'albero */}
      <AbsoluteFill style={{opacity: sun, mixBlendMode: 'screen', background: 'radial-gradient(60% 40% at 50% 62%, rgba(255,200,130,0.9) 0%, rgba(255,120,40,0.35) 40%, transparent 75%)'}} />
      <AbsoluteFill style={{background: '#000', opacity: dim}} />
      {/* gradienti di leggibilità */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 18%, transparent 55%, rgba(0,0,0,0.75) 85%)'}} />
      <AbsoluteFill style={{background: '#fff', opacity: flash * 0.55}} />

      {/* INTRO */}
      {t < 2.3 && (
        <div style={{position: 'absolute', left: 90, width: 900, top: 760, opacity: sp(t, 0.62) * (1 - cl(t, 1.85, 2.15))}}>
          <BigWord text="22SIMBA" width={900} style={{color: K.paper, textShadow: '0 10px 60px rgba(0,0,0,0.6)'}} />
          <BigWord text="FREEDOM" width={480} letterSpacing={20} style={{color: K.paper, opacity: sp(t, 1.2)}} />
        </div>
      )}

      {/* MIRIA: nonna e intermezzo */}
      <Img src={staticFile('simba/img/logo_miria.png')} style={{position: 'absolute', left: 140, width: 800, top: 1130, opacity: logoNonna, filter: 'drop-shadow(0 6px 24px rgba(0,0,0,0.8))'}} />
      <Img src={staticFile('simba/img/logo_miria.png')} style={{position: 'absolute', left: 60, width: 960, top: 760, opacity: logoMid, transform: `scale(${0.9 + logoMid * 0.1 + (t - 18.3) * 0.03})`, filter: 'drop-shadow(0 6px 30px rgba(0,0,0,0.9))'}} />

      <CallBanner t={t} inAt={T.chiami - 0.3} outAt={T.fallire - 0.4} acceptAt={T.saro} since={T.saro} />
      <Clocks t={t} inAt={T.fusi - 0.1} outAt={T.saro - 0.1} top={760} />
      <CallBanner t={t} inAt={T.chiami2 - 0.2} outAt={T.outro} acceptAt={0} since={T.saro - 17} />
      <Clocks t={t} inAt={T.ma2 - 0.05} outAt={T.outro + 0.05} top={820} converge={T.saro2} />

      <FallireFx t={t} />
      {inFree && <FreedomFx t={t} />}

      {/* testi (sempre dentro lo schermo) */}
      <FitLyrics line="intro" start={0} top={1340} maxRows={1} maxSize={100} />
      <FitLyrics line="chiami" start={0} top={1340} keywords={['fusi', 'orari']} />
      <FitLyrics line="fallire" start={0} top={1340} keywords={['farò']} />
      <FitLyrics line="sole" start={0} top={1340} keywords={['sole', 'raggi']} />
      <FitLyrics line="chiami2" start={0} top={1340} keywords={['fusi', 'orari']} />

      {/* OUTRO */}
      {t > T.outro && (
        <div style={{position: 'absolute', left: 90, width: 900, top: 640, opacity: outro, transform: `scale(${1.12 - outro * 0.12})`}}>
          <BigWord text="22SIMBA" width={900} style={{color: K.paper, textShadow: '0 10px 60px rgba(0,0,0,0.7)'}} />
          <BigWord text="FREEDOM" width={480} letterSpacing={20} style={{color: K.paper}} />
          <Img src={staticFile('simba/img/logo_miria.png')} style={{width: 640, marginLeft: 130, marginTop: 30, filter: 'drop-shadow(0 6px 24px rgba(0,0,0,0.8))'}} />
        </div>
      )}
      <AbsoluteFill style={{background: '#000', opacity: Math.max(1 - cl(t, 0, 0.35), cl(t, 23.4, 23.66))}} />

      <Grain opacity={0.1} />
      <Audio src={staticFile('simba/audio.m4a')} />
    </AbsoluteFill>
  );
};

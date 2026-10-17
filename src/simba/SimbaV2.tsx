import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './Grain';
import {BEATS, DISPLAY, FPS, K, UI, beatPulse, lineWords} from './theme';
import {Clock, TreeOfLife} from './parts';
import {BigWord, FitLyrics} from './FitLyrics';
import {drift, easeInOut, easeOut, pop, soft} from '../lib/anim';

// ── geometria della "finestra" sul filmato live ──
// sorgente 576×1024: area utile senza didascalia/bande nere = y 305…895
const SRC_W = 576;
const SRC_TOP = 305;
const SRC_H = 590;
const CARD_W = 1000;
const SCALE = CARD_W / SRC_W;
const CARD_H = Math.round(SRC_H * SCALE); // ≈1024
const CARD_X = 40;
const CARD_Y = 200;

const cl = (t: number, a: number, b: number, e = easeInOut) =>
  interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
const sp = (t: number, at: number) => soft(t * FPS, at * FPS, 16, 0.7);
const pp = (t: number, at: number) => pop(t * FPS, at * FPS);
const ws = (line: string, i: number) => lineWords(line)[i].startMs / 1000;

const HITS = lineWords('freedom').map((w) => w.startMs / 1000);
const T = {
  cardIn: BEATS[0],
  chiami: ws('chiami', 0),
  fusi: ws('chiami', 4),
  orari: ws('chiami', 5),
  saro: ws('chiami', 9),
  fallStart: 6.3,
  fallire: ws('fallire', 2),
  domani: ws('fallire', 4),
  pero: ws('fallire', 5),
  faro: ws('fallire', 7),
  freeEnd: HITS[4] + 0.6,
  sole: ws('sole', 0),
  raggi: ws('sole', 5),
  polo: ws('sole', 8),
  miria: 18.25,
  chiami2: ws('chiami2', 0),
  fusi2: ws('chiami2', 4),
  saro2: ws('chiami2', 9),
  outro: 22.72,
};

const Video: React.FC<{style?: React.CSSProperties}> = ({style}) => (
  <OffthreadVideo src={staticFile('simba/live.mov')} muted style={{position: 'absolute', left: 0, top: -SRC_TOP * SCALE, width: CARD_W, height: 1024 * SCALE, ...style}} />
);

// ── banner di chiamata in stile iOS ──
const CallBanner: React.FC<{t: number; inAt: number; outAt: number; acceptAt: number; connectedSince: number}> = ({t, inAt, outAt, acceptAt, connectedSince}) => {
  const p = sp(t, inAt) * (1 - cl(t, outAt - 0.25, outAt));
  if (p <= 0.001) return null;
  const acc = cl(t, acceptAt, acceptAt + 0.3, easeOut);
  const ring = t < acceptAt ? beatPulse(t, 5) : 0;
  const secs = Math.max(0, Math.floor(t - connectedSince));
  return (
    <div style={{position: 'absolute', left: CARD_X + 30, top: CARD_Y + 30, width: CARD_W - 60, opacity: p, transform: `translateY(${(1 - p) * -60}px) scale(${0.94 + p * 0.06})`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 26, padding: '24px 28px', borderRadius: 44, background: 'rgba(20,20,22,0.62)', backdropFilter: 'blur(30px) saturate(150%)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 20px 60px rgba(0,0,0,0.45)', fontFamily: UI, color: K.paper}}>
        <div style={{width: 96, height: 96, borderRadius: 48, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${K.paper}`, transform: `scale(${1 + ring * 0.08})`}}>
          <TreeOfLife size={78} grow={1} roots={false} />
        </div>
        <div style={{flex: 1}}>
          <div style={{fontSize: 26, fontWeight: 600, color: 'rgba(241,238,230,0.6)'}}>{acc > 0.5 ? `In chiamata · 00:${String(secs).padStart(2, '0')}` : 'Chiamata in arrivo…'}</div>
          <div style={{fontSize: 52, fontWeight: 800, letterSpacing: -1}}>22simba</div>
        </div>
        <div style={{width: 88, height: 88, borderRadius: 44, background: acc > 0.5 ? '#3A3A3C' : '#30D158', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + ring * 0.14})`}}>
          <svg width={44} height={44} viewBox="0 0 24 24" style={{transform: `rotate(${acc * 135}deg)`}}>
            <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" fill="#fff" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// ── fila di orologi: girano su "fusi orari", nella ripresa convergono alle 22:22 ──
const CITIES = [
  {label: 'Milano', h: 3, m: 22},
  {label: 'New York', h: 21, m: 22},
  {label: 'Tokyo', h: 10, m: 22},
];
const Clocks: React.FC<{t: number; inAt: number; outAt: number; spinAt: number; converge?: number}> = ({t, inAt, outAt, spinAt, converge}) => {
  const p = sp(t, inAt) * (1 - cl(t, outAt - 0.25, outAt));
  if (p <= 0.001) return null;
  const spin = cl(t, spinAt - 0.05, spinAt + 0.8, easeInOut);
  const conv = converge ? cl(t, converge - 0.5, converge + 0.3, easeOut) : 0;
  return (
    <div style={{position: 'absolute', left: CARD_X, top: CARD_Y + CARD_H - 330, width: CARD_W, display: 'flex', justifyContent: 'center', gap: 40}}>
      {CITIES.map((c, i) => {
        const q = Math.min(1, pp(t, inAt + i * 0.06));
        const extra = spin * 720 * (i % 2 ? -1 : 1);
        const hh = c.h + (22 - c.h) * conv;
        return (
          <div key={i} style={{padding: '22px 18px 16px', borderRadius: 34, background: 'rgba(20,20,22,0.55)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.12)', opacity: p * q, transform: `translateY(${(1 - q) * 80}px) rotate(${drift(t * FPS, 0.9, 2, i)}deg)`}}>
            <Clock size={190} hours={hh + extra / 720} minutes={c.m + extra / 6} label={c.label} sub={conv > 0.9 ? '22:22' : undefined} accent={conv > 0.9} />
          </div>
        );
      })}
    </div>
  );
};

export const SimbaV2: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const bp = beatPulse(t, 8);

  // ── camera sul filmato ──
  const cardIn = Math.min(1, pp(t, T.cardIn - 0.05));
  const outro = cl(t, T.outro, T.outro + 0.45, easeInOut);
  const nHit = HITS.filter((h) => t >= h - 0.02).length;
  const inFreedom = t >= HITS[0] - 0.05 && t < T.freeEnd;
  const lastHit = nHit ? HITS[nHit - 1] : -10;
  const hitK = Math.exp(-Math.max(0, t - lastHit) * 6);
  const punch = inFreedom ? 0.22 * hitK : 0;
  const kenBurns = 1.04 + 0.04 * Math.sin(t * 0.5);
  const shakeAmt = (t > T.fallire + 0.3 && t < T.pero ? 6 : 0) + (inFreedom ? hitK * 14 : 0) + Math.exp(-Math.max(0, t - T.faro) * 7) * (t > T.faro ? 16 : 0);
  const shX = (random(`sx${frame}`) - 0.5) * shakeAmt;
  const shY = (random(`sy${frame}`) - 0.5) * shakeAmt;
  const tiltY = drift(t * FPS, 0.45, 5) + (inFreedom ? [0, -6, 6, -4, 5, 0][nHit] * hitK : 0);
  const tiltX = drift(t * FPS, 0.35, 3, 1);
  const vidScale = kenBurns + punch + bp * 0.02;
  const invert = inFreedom && t - lastHit < 0.05 && nHit % 2 === 0 ? 1 : 0;

  // atmosfera per sezione
  const scrimFallire = cl(t, T.fallire - 0.2, T.fallire + 0.1) * (1 - cl(t, T.faro + 0.5, T.faro + 0.9));
  const sunLeak = cl(t, T.sole - 0.3, T.raggi + 0.4) * (1 - cl(t, 18.1, 18.6));
  const miria = cl(t, T.miria, T.miria + 0.4) * (1 - cl(t, T.chiami2 - 0.25, T.chiami2 + 0.1));

  return (
    <AbsoluteFill style={{background: K.black, overflow: 'hidden'}}>
      {/* sfondo: lo stesso filmato, sfocato e scuro */}
      <AbsoluteFill style={{opacity: 0.55 * cardIn * (1 - outro)}}>
        <OffthreadVideo src={staticFile('simba/live.mov')} muted style={{position: 'absolute', left: -540, top: -400, width: 2160, height: 3840, filter: 'blur(50px) brightness(0.45) contrast(1.2)'}} />
      </AbsoluteFill>

      {/* header */}
      <div style={{position: 'absolute', top: 110, width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 70px', boxSizing: 'border-box', fontFamily: UI, fontSize: 28, fontWeight: 700, letterSpacing: 8, color: K.paper, opacity: cardIn * (1 - outro)}}>
        <span>22SIMBA</span>
        <span style={{color: 'rgba(241,238,230,0.55)'}}>FREEDOM · MIRIA</span>
      </div>

      {/* finestra sul live */}
      <div style={{position: 'absolute', inset: 0, perspective: 1600}}>
        <div
          style={{
            position: 'absolute',
            left: CARD_X,
            top: CARD_Y,
            width: CARD_W,
            height: CARD_H,
            borderRadius: 40,
            overflow: 'hidden',
            boxShadow: '0 40px 120px rgba(0,0,0,0.7)',
            opacity: cardIn * (1 - outro),
            transform: `translate(${shX}px, ${shY}px) rotateX(${tiltX + (1 - cardIn) * 25}deg) rotateY(${tiltY}deg) scale(${(0.7 + cardIn * 0.3) * (1 - outro * 0.25)})`,
            filter: invert ? 'invert(1)' : undefined,
          }}
        >
          <div style={{position: 'absolute', inset: 0, transform: `scale(${vidScale})`, transformOrigin: '50% 45%', filter: 'grayscale(1) contrast(1.18) brightness(1.02)'}}>
            <Video />
          </div>
          {/* gradiente in basso per leggibilità */}
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, transparent 25%, transparent 60%, rgba(0,0,0,0.55) 100%)'}} />
          {/* luce del sole che "ricopre di raggi" il filmato */}
          <div style={{position: 'absolute', inset: 0, opacity: sunLeak, mixBlendMode: 'screen', background: `radial-gradient(70% 55% at ${85 - sunLeak * 25}% ${5 + sunLeak * 10}%, rgba(255,214,150,0.95) 0%, rgba(255,140,60,0.55) 35%, transparent 70%)`}} />
          <div style={{position: 'absolute', inset: 0, opacity: sunLeak * 0.35, mixBlendMode: 'color', background: '#FF9A4A'}} />
          {/* scuro per "fallire" e "miria" */}
          <div style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', opacity: Math.max(scrimFallire, miria, inFreedom ? 0.45 : 0)}} />
          {/* flash su ogni freedom */}
          <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: inFreedom ? Math.exp(-Math.max(0, t - lastHit) * 16) * 0.6 : 0}} />
        </div>
      </div>

      {/* ── INTRO: titolo prima che entri il filmato ── */}
      {t < T.cardIn + 0.4 && (
        <div style={{position: 'absolute', top: 820, left: 90, width: 900, opacity: 1 - cl(t, T.cardIn - 0.05, T.cardIn + 0.3), transform: `scale(${1 + cl(t, T.cardIn - 0.05, T.cardIn + 0.3) * 0.6})`}}>
          <BigWord text="22SIMBA" width={900} style={{color: K.paper}} />
          <div style={{textAlign: 'center', fontFamily: UI, fontSize: 32, fontWeight: 700, letterSpacing: 12, color: 'rgba(241,238,230,0.6)', opacity: sp(t, 0.25)}}>FREEDOM</div>
        </div>
      )}

      {/* ── SE CHIAMI… (banner + orologi) ── */}
      <CallBanner t={t} inAt={T.chiami - 0.3} outAt={T.fallire - 0.4} acceptAt={T.saro} connectedSince={T.saro} />
      <Clocks t={t} inAt={T.fusi - 0.15} outAt={T.saro + 0.6} spinAt={T.fusi} />
      <CallBanner t={t} inAt={T.chiami2 - 0.3} outAt={T.outro + 0.1} acceptAt={-1} connectedSince={T.saro - 17} />
      <Clocks t={t} inAt={T.fusi2 - 0.15} outAt={T.outro + 0.1} spinAt={T.fusi2} converge={T.saro2} />

      {/* ── FALLIRE / LO FARÒ ── */}
      <FallireFx t={t} />

      {/* ── FREEDOM ×5 ── */}
      {inFreedom && <FreedomFx t={t} n={nHit} lastHit={lastHit} />}

      {/* ── POLO NORD: coordinate ── */}
      {t > T.sole - 0.3 && t < 18.6 && (
        <div style={{position: 'absolute', left: CARD_X + 34, top: CARD_Y + 34, opacity: sp(t, T.sole - 0.2) * (1 - cl(t, 18.1, 18.5)), fontFamily: UI, color: K.paper}}>
          <div style={{padding: '14px 24px', borderRadius: 30, background: 'rgba(20,20,22,0.5)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', fontSize: 28, fontWeight: 700, letterSpacing: 4}}>90°00′N · POLO NORD</div>
        </div>
      )}

      {/* ── MIRIA ── */}
      {miria > 0.01 && (
        <div style={{position: 'absolute', left: CARD_X, top: CARD_Y + 120, width: CARD_W, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: miria}}>
          <TreeOfLife size={520} color="#FFFFFF" grow={cl(t, T.miria + 0.05, T.chiami2 - 0.3, easeOut)} />
          <BigWord text="MIRIA" width={520} letterSpacing={30} style={{color: K.paper, marginTop: -20}} />
        </div>
      )}

      {/* ── testi ── */}
      <FitLyrics line="intro" start={0} top={1290} maxRows={1} maxSize={110} />
      <FitLyrics line="chiami" start={0} top={1290} keywords={['fusi', 'orari']} />
      <FitLyrics line="fallire" start={0} top={1290} keywords={['farò']} />
      <FitLyrics line="sole" start={0} top={1290} keywords={['polo', 'nord']} />
      <FitLyrics line="chiami2" start={0} top={1290} keywords={['fusi', 'orari']} />

      {/* ── OUTRO ── */}
      {t > T.outro && (
        <div style={{position: 'absolute', top: 700, left: 90, width: 900, opacity: sp(t, T.outro + 0.15), transform: `scale(${1.15 - sp(t, T.outro + 0.15) * 0.15})`}}>
          <BigWord text="22SIMBA" width={900} style={{color: K.paper}} />
          <BigWord text="FREEDOM" width={520} letterSpacing={18} style={{color: K.paper, opacity: 0.85}} />
          <div style={{textAlign: 'center', marginTop: 30, fontFamily: UI, fontSize: 30, fontWeight: 600, letterSpacing: 10, color: 'rgba(241,238,230,0.55)'}}>DALL’ALBUM “MIRIA”</div>
        </div>
      )}
      <AbsoluteFill style={{background: '#000', opacity: cl(t, 23.4, 23.66)}} />

      <Grain opacity={0.12} />
      <Audio src={staticFile('simba/audio.m4a')} />
    </AbsoluteFill>
  );
};

// "FALLIRE" che cade lettera per lettera, poi si ricompone; "LO FARÒ" come timbro
const FallireFx: React.FC<{t: number}> = ({t}) => {
  if (t < T.fallire - 0.2 || t > T.faro + 1.2) return null;
  const appear = sp(t, T.fallire - 0.08);
  const rebuild = sp(t, T.pero);
  const stamp = Math.min(1.2, pp(t, T.faro - 0.04));
  const out = cl(t, T.faro + 0.8, T.faro + 1.1);
  const letters = 'FALLIRE'.split('');
  return (
    <div style={{position: 'absolute', left: CARD_X, top: CARD_Y + 230, width: CARD_W, opacity: 1 - out}}>
      <div style={{display: 'flex', justifyContent: 'center', perspective: 1200}}>
        {letters.map((l, i) => {
          const fs = T.fallire + 0.3 + i * 0.07;
          const ft = Math.max(0, Math.min(t, T.pero) - fs);
          const y = 0.5 * 2600 * ft * ft * (1 - rebuild);
          const rz = ft * (random(`rz${i}`) - 0.5) * 260 * (1 - rebuild);
          return (
            <span key={i} style={{fontFamily: DISPLAY, fontSize: 230, lineHeight: 1.2, color: K.paper, opacity: appear, display: 'inline-block', transform: `translateY(${y + (1 - appear) * 100}px) rotateZ(${rz}deg)`, textShadow: '0 10px 40px rgba(0,0,0,0.6)'}}>
              {l}
            </span>
          );
        })}
      </div>
      <div style={{display: 'flex', justifyContent: 'center', marginTop: 10, opacity: Math.min(1, stamp * 1.5), transform: `scale(${2 - Math.min(1, stamp)}) rotate(-3deg)`}}>
        <div style={{background: K.paper, color: K.ink, padding: '0 34px', borderRadius: 8}}>
          <BigWord text="LO FARÒ" width={620} style={{color: K.ink}} />
        </div>
      </div>
    </div>
  );
};

const VARIANTS: React.CSSProperties[] = [
  {},
  {color: 'transparent', WebkitTextStroke: `4px ${K.paper}`},
  {color: K.paper},
  {color: K.ink, background: K.paper, padding: '0 30px'},
  {color: 'transparent', WebkitTextStroke: `4px ${K.paper}`},
  {color: K.paper},
];

const FreedomFx: React.FC<{t: number; n: number; lastHit: number}> = ({t, n, lastHit}) => {
  if (!n) return null;
  const p = Math.min(1.15, pp(t, lastHit));
  const end = cl(t, HITS[4] + 0.3, T.freeEnd, (x) => x * x);
  return (
    <>
      {/* eco: copie che si allontanano dietro la parola */}
      {[1, 2, 3].map((k) => (
        <div key={k} style={{position: 'absolute', left: 0, right: 0, top: 640, display: 'flex', justifyContent: 'center', opacity: (0.35 / k) * (1 - end), transform: `scale(${1 + k * 0.18 * p})`}}>
          <BigWord text="FREEDOM" width={900} style={{color: 'transparent', WebkitTextStroke: `2px ${K.paper}`}} />
        </div>
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, top: 640, display: 'flex', justifyContent: 'center', opacity: 1 - end, transform: `scale(${(1.4 - p * 0.4) * (1 + end * 2)})`}}>
        <div style={{...VARIANTS[n], borderRadius: 10}}>
          <BigWord text="FREEDOM" width={n === 3 ? 840 : 900} style={{color: 'inherit', WebkitTextStroke: VARIANTS[n].WebkitTextStroke}} />
        </div>
      </div>
      {/* contatore ×5 */}
      <div style={{position: 'absolute', top: 1320, width: '100%', display: 'flex', justifyContent: 'center', gap: 26, opacity: 1 - end}}>
        {HITS.map((_, i) => (
          <div key={i} style={{width: 26, height: 26, borderRadius: 13, background: i < n ? K.paper : 'rgba(255,255,255,0.2)', transform: `scale(${i === n - 1 ? 1 + (1.15 - p) : 1})`}} />
        ))}
      </div>
      <div style={{position: 'absolute', top: 1390, width: '100%', textAlign: 'center', fontFamily: UI, fontSize: 34, fontWeight: 700, letterSpacing: 14, color: 'rgba(241,238,230,0.6)', opacity: 1 - end}}>FREEDOM ×{n}</div>
    </>
  );
};

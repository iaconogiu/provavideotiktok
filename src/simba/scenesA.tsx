import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {DISPLAY, FPS, K, UI, BEATS, beatPulse, envAt, lineWords} from './theme';
import {Clock, TreeOfLife, Wordmark} from './parts';
import {LyricLine} from './Lyrics';
import {drift, easeOut, easeInOut, pop, soft} from '../lib/anim';

/** tempo assoluto (s) e frame locale della Sequence che inizia a `start` secondi */
export const useT = (start: number) => {
  const f = useCurrentFrame();
  return {f, t: f / FPS + start};
};
const cl = (t: number, a: number, b: number, e = easeInOut) =>
  interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
const sp = (t: number, at: number, kind: 'pop' | 'soft' = 'soft') => (kind === 'pop' ? pop(t * FPS, at * FPS) : soft(t * FPS, at * FPS, 16, 0.7));
const wStart = (line: string, i: number) => lineWords(line)[i].startMs / 1000;

/** Sole con alone, pulsa sul beat */
export const Sun: React.FC<{t: number; r: number; x: number; y: number; glow?: number}> = ({t, r, x, y, glow = 1}) => {
  const p = beatPulse(t, 6);
  const rr = r * (1 + p * 0.08);
  return (
    <>
      <div style={{position: 'absolute', left: x - rr * 5, top: y - rr * 5, width: rr * 10, height: rr * 10, borderRadius: '50%', background: `radial-gradient(circle, ${K.sun}${Math.round(90 * glow).toString(16).padStart(2, '0')} 0%, transparent 60%)`}} />
      <div style={{position: 'absolute', left: x - rr, top: y - rr, width: rr * 2, height: rr * 2, borderRadius: '50%', background: `radial-gradient(circle at 40% 35%, #FFD3A8, ${K.sun} 55%, #E2380C)`, boxShadow: `0 0 ${80 + p * 60}px ${K.sun}`}} />
    </>
  );
};

// ───────────────────────────── A · INTRO "Ah-ah" ─────────────────────────────
export const SceneIntro: React.FC = () => {
  const {t} = useT(0);
  const b1 = BEATS[0];
  const b2 = BEATS[1];
  const b3 = BEATS[2];
  const sunR = interpolate(t, [0, 0.35], [0, 46], {extrapolateRight: 'clamp', easing: easeOut});
  const ah = cl(t, 0.05, 0.25, easeOut) * (1 - cl(t, 0.6, 0.85));
  const wm = cl(t, b1 - 0.06, b1 + 0.22, easeOut);
  const fr = sp(t, b2 - 0.04, 'pop');
  const mi = sp(t, b3 - 0.04);
  const camZ = interpolate(t, [0, 2.1], [-200, 140]);
  const rotY = drift(t * FPS, 0.6, 6);
  const zoomOut = cl(t, 1.95, 2.2, Easing2);

  return (
    <AbsoluteFill style={{background: K.black, overflow: 'hidden'}}>
      {/* anelli che si espandono sui beat */}
      {BEATS.slice(0, 4).map((b, i) => {
        const k = (t - b) / 1.1;
        if (k < 0 || k > 1) return null;
        return <div key={i} style={{position: 'absolute', left: 540 - 60 - k * 700, top: 820 - 60 - k * 700, width: 120 + k * 1400, height: 120 + k * 1400, borderRadius: '50%', border: `${3 - k * 2}px solid ${K.sun}`, opacity: 1 - k}} />;
      })}
      <AbsoluteFill style={{perspective: 1400, transform: `scale(${1 + zoomOut * 5})`, opacity: 1 - zoomOut, transformOrigin: '540px 820px'}}>
        <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `translateZ(${camZ}px) rotateY(${rotY}deg) rotateX(${drift(t * FPS, 0.5, 3)}deg)`}}>
          <Sun t={t} r={sunR} x={540} y={820} />
          {/* "AH—AH" gigante in outline */}
          <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: DISPLAY, fontSize: 330, color: 'transparent', WebkitTextStroke: `3px ${K.paper}`, opacity: ah, transform: `scale(${1.35 - ah * 0.35}) translateZ(120px)`, letterSpacing: 10}}>
            AH—AH
          </div>
          <div style={{position: 'absolute', top: 390, width: '100%', transform: `translateZ(${(1 - wm) * 500}px)`}}>
            <Wordmark size={250} progress={wm} />
          </div>
          <div
            style={{
              position: 'absolute',
              top: 1000,
              width: '100%',
              textAlign: 'center',
              fontFamily: DISPLAY,
              fontSize: 210,
              letterSpacing: 18 + (1 - fr) * 60,
              color: 'transparent',
              WebkitTextStroke: `3px ${K.paper}`,
              opacity: Math.min(1, fr * 1.5),
              transform: `translateZ(${(1 - fr) * -400}px) scale(${0.8 + fr * 0.2})`,
            }}
          >
            FREEDOM
          </div>
          <div style={{position: 'absolute', top: 1270, width: '100%', textAlign: 'center', fontFamily: UI, fontSize: 38, fontWeight: 600, letterSpacing: 14, color: K.gray, opacity: mi, transform: `translateY(${(1 - mi) * 30}px)`}}>
            DA “MIRIA”
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
const Easing2 = (x: number) => x * x * x;

// ───────────────────────────── B · CHIAMATA + FUSI ORARI ─────────────────────────────
const CITIES = [
  {label: 'Milano', h: 3, m: 22, off: '+0h'},
  {label: 'New York', h: 21, m: 22, off: '−6h'},
  {label: 'Tokyo', h: 10, m: 22, off: '+7h'},
  {label: 'Sydney', h: 12, m: 22, off: '+9h'},
  {label: 'Polo Nord', h: 0, m: 0, off: 'tutti'},
];

const CallCard: React.FC<{t: number; tAccept: number; tConnected0: number; title?: string}> = ({t, tAccept, tConnected0, title = 'MIRIA'}) => {
  const acc = cl(t, tAccept, tAccept + 0.35, easeOut);
  const ring = t < tAccept ? beatPulse(t, 5) : 0;
  const secs = Math.max(0, Math.floor(t - tConnected0));
  return (
    <div
      style={{
        width: 820,
        padding: '44px 50px',
        borderRadius: 60,
        background: 'rgba(30,30,32,0.55)',
        backdropFilter: 'blur(40px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 40px 120px rgba(0,0,0,0.6)',
        fontFamily: UI,
        color: K.paper,
        display: 'flex',
        alignItems: 'center',
        gap: 34,
      }}
    >
      <div style={{width: 150, height: 150, borderRadius: 75, background: '#151515', border: `3px solid ${K.sun}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + ring * 0.08})`, boxShadow: `0 0 ${ring * 60}px ${K.sun}`}}>
        <TreeOfLife size={120} grow={1} color={K.paper} roots={false} />
      </div>
      <div style={{flex: 1}}>
        <div style={{fontSize: 30, fontWeight: 600, color: acc > 0.5 ? K.sun : K.gray, letterSpacing: 1}}>
          {acc > 0.5 ? `In chiamata · 00:${String(secs).padStart(2, '0')}` : 'Chiamata in arrivo…'}
        </div>
        <div style={{fontFamily: DISPLAY, fontSize: 110, lineHeight: 1, marginTop: 6, letterSpacing: 2}}>{title}</div>
        <div style={{fontSize: 28, color: K.gray, marginTop: 6}}>Polo Nord · 90°N</div>
      </div>
      <div style={{position: 'relative', width: 120, height: 120}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: 60, background: acc > 0.5 ? '#2A2A2C' : K.sun, transform: `scale(${1 + ring * 0.12}) translateX(${acc * -10}px)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width={58} height={58} viewBox="0 0 24 24" style={{transform: `rotate(${acc * 135}deg)`}}>
            <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" fill={K.paper} />
          </svg>
        </div>
      </div>
    </div>
  );
};

export const SceneCall: React.FC<{start: number; line: 'chiami' | 'chiami2'}> = ({start, line}) => {
  const {t} = useT(start);
  const reprise = line === 'chiami2';
  const tFusi = wStart(line, 4);
  const tOrari = wStart(line, 5);
  const tSaro = wStart(line, 9);
  const tFirst = wStart(line, 0);
  const cardIn = sp(t, tFirst - 0.35);
  // gli orologi: girano veloci su "fusi orari"; nella ripresa convergono tutti alle 22:22
  const spin = cl(t, tFusi - 0.1, tOrari + 0.4, easeInOut);
  const conv = reprise ? cl(t, tSaro - 0.6, tSaro + 0.3, easeOut) : 0;
  const ringRot = (t - start) * 22;
  const orbitIn = sp(t, tFirst - 0.1);

  return (
    <AbsoluteFill style={{background: K.black, overflow: 'hidden', fontFamily: UI}}>
      <div style={{position: 'absolute', left: -300, top: 200 + drift(t * FPS, 0.3, 60), width: 1200, height: 1200, borderRadius: '50%', background: `radial-gradient(circle, ${K.sun}33, transparent 60%)`}} />
      <AbsoluteFill style={{perspective: 1500, perspectiveOrigin: '50% 30%'}}>
        <div style={{position: 'absolute', left: 540, top: 760, transformStyle: 'preserve-3d', transform: `rotateX(${20 + drift(t * FPS, 0.5, 3)}deg) rotateY(${ringRot}deg) scale(${0.6 + orbitIn * 0.4})`}}>
          {CITIES.map((c, i) => {
            const a = (i / CITIES.length) * 360;
            const extra = spin * 720 * (i % 2 ? -1 : 1);
            const hh = c.h + (conv ? (22 - c.h) * conv : 0);
            const mm = c.m + extra / 6 + (conv ? (22 - c.m) * conv : 0);
            return (
              <div key={i} style={{position: 'absolute', left: -85, top: -120, transform: `rotateY(${a}deg) translateZ(440px) rotateY(${-a - ringRot}deg)`, opacity: orbitIn}}>
                <Clock size={170} hours={hh + extra / 360} minutes={mm} label={c.label} sub={reprise && conv > 0.9 ? '22:22' : c.off} accent={c.label === 'Polo Nord' || conv > 0.9} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 190, width: '100%', display: 'flex', justifyContent: 'center', opacity: cardIn, transform: `perspective(1400px) translateY(${(1 - cardIn) * -120}px) rotateX(${(1 - cardIn) * 40 + drift(t * FPS, 0.7, 2)}deg)`}}>
        <CallCard t={t} tAccept={reprise ? start - 10 : tSaro} tConnected0={reprise ? tSaro - 17 : tSaro} />
      </div>
      {/* waveform della voce mentre la chiamata è attiva */}
      <div style={{position: 'absolute', top: 1080, width: '100%', display: 'flex', justifyContent: 'center', gap: 10, opacity: reprise || t > tSaro ? 1 : 0.25}}>
        {Array.from({length: 24}, (_, i) => {
          const v = envAt(t - i * 0.02, 'voc');
          return <div key={i} style={{width: 12, height: 14 + v * 150 * (0.5 + Math.abs(Math.sin(i * 1.7 + t * 6)) * 0.5), borderRadius: 6, background: i % 6 === 0 ? K.sun : K.paper, opacity: 0.85}} />;
        })}
      </div>
      <LyricLine line={line} start={start} top={1260} size={118} highlight={['fusi', 'orari', 'sarò']} />
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, interpolate, random} from 'remotion';
import {DISPLAY, FPS, K, UI, beatPulse, lineWords} from './theme';
import {TreeOfLife, Wordmark} from './parts';
import {LyricLine} from './Lyrics';
import {Sun, useT} from './scenesA';
import {drift, easeInOut, easeOut, pop, soft} from '../lib/anim';

const cl = (t: number, a: number, b: number, e = easeInOut) =>
  interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
const wStart = (line: string, i: number) => lineWords(line)[i].startMs / 1000;

// ───────────────────────────── C · "E potrò fallire un domani, però lo farò" ─────────────────────────────
export const SceneFallire: React.FC<{start: number}> = ({start}) => {
  const {t} = useT(start);
  const tFall = wStart('fallire', 2);
  const tDomani = wStart('fallire', 4);
  const tPero = wStart('fallire', 5);
  const tFaro = wStart('fallire', 7);
  const word = 'FALLIRE'.split('');
  const appear = soft(t * FPS, (tFall - 0.08) * FPS, 14, 0.6);
  const rebuild = soft(t * FPS, tPero * FPS, 13, 0.8);
  const stamp = pop(t * FPS, (tFaro - 0.04) * FPS);
  const cal = soft(t * FPS, (tDomani - 0.15) * FPS, 14, 0.7);
  const shake = Math.exp(-Math.max(0, t - tFaro) * 8) * (t > tFaro ? 1 : 0) * Math.sin(t * 90) * 10;

  return (
    <AbsoluteFill style={{background: K.paper, overflow: 'hidden', transform: `translateX(${shake}px)`}}>
      {/* righe da quaderno */}
      {Array.from({length: 22}, (_, i) => (
        <div key={i} style={{position: 'absolute', left: 0, right: 0, top: i * 90 + ((t * 40) % 90), height: 2, background: 'rgba(0,0,0,0.05)'}} />
      ))}
      <AbsoluteFill style={{perspective: 1300}}>
        <div style={{position: 'absolute', top: 360, width: '100%', display: 'flex', justifyContent: 'center', fontFamily: DISPLAY, fontSize: 270, lineHeight: 1}}>
          {word.map((l, i) => {
            // ogni lettera cade con la gravità, poi su "però" torna al suo posto
            const fallStart = tFall + 0.35 + i * 0.07;
            const ft = Math.max(0, Math.min(t, tPero) - fallStart);
            const g = 2600;
            const y = 0.5 * g * ft * ft * (1 - rebuild);
            const rz = ft * (random(`rz${i}`) - 0.5) * 260 * (1 - rebuild);
            const rx = ft * 120 * (1 - rebuild);
            const color = rebuild > 0.5 ? K.sun : K.ink;
            return (
              <span key={i} style={{display: 'inline-block', color, opacity: appear, transform: `translateY(${y + (1 - appear) * 120}px) rotateZ(${rz}deg) rotateX(${rx}deg)`}}>
                {l}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
      {/* calendario "domani" */}
      <div style={{position: 'absolute', left: 540 - 150, top: 720, width: 300, height: 320, borderRadius: 40, background: '#fff', boxShadow: '0 30px 80px rgba(0,0,0,0.18)', overflow: 'hidden', fontFamily: UI, opacity: cal * (1 - rebuild), transform: `perspective(1200px) rotateX(${(1 - cal) * -90 + drift(t * FPS, 0.8, 4)}deg) scale(${0.8 + cal * 0.2})`, transformOrigin: 'top'}}>
        <div style={{height: 90, background: K.sun, color: '#fff', fontWeight: 800, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: 4}}>DOMANI</div>
        <div style={{fontFamily: DISPLAY, fontSize: 170, textAlign: 'center', color: K.ink, lineHeight: 1.3}}>?</div>
      </div>
      {/* LO FARÒ: timbro */}
      <div style={{position: 'absolute', top: 700, width: '100%', textAlign: 'center', fontFamily: DISPLAY, fontSize: 250, color: K.ink, opacity: Math.min(1, stamp * 1.5), transform: `scale(${2.2 - stamp * 1.2}) rotate(${-4 + (1 - stamp) * -10}deg)`}}>
        LO FARÒ<span style={{color: K.sun}}>.</span>
      </div>
      <LyricLine line="fallire" start={start} top={1260} size={112} color={K.ink} highlight={['fallire', 'farò']} />
    </AbsoluteFill>
  );
};

// ───────────────────────────── D · FREEDOM ×5 ─────────────────────────────
const FREEDOM_HITS = () => lineWords('freedom').map((w) => w.startMs / 1000);

export const SceneFreedom: React.FC<{start: number}> = ({start}) => {
  const {t} = useT(start);
  const hits = FREEDOM_HITS();
  const n = hits.filter((h) => t >= h - 0.02).length; // quanti "freedom" finora
  const last = n ? hits[n - 1] : start;
  const k = Math.max(0, t - last);
  const hitP = n ? pop(k * FPS, 0) : 0;
  const flash = n ? Math.exp(-k * 14) : 0;
  const roll = [0, 0, 7, -5, 3, 0][n] * cl(t, last, last + 0.3, easeOut);
  const end = cl(t, hits[4] + 0.35, hits[4] + 0.75, (x) => x * x);

  // varianti per ogni colpo
  const style: React.CSSProperties[] = [
    {color: 'transparent', WebkitTextStroke: `3px ${K.paper}`},
    {color: K.paper},
    {color: K.sun},
    {color: 'transparent', WebkitTextStroke: `3px ${K.sun}`},
    {color: K.paper, letterSpacing: 14},
    {color: K.sun},
  ];


  return (
    <AbsoluteFill style={{background: K.black, overflow: 'hidden', fontFamily: DISPLAY}}>
      {/* raggi di sole che crescono a ogni colpo */}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 0.12 + n * 0.08}}>
        <g transform={`translate(540 520) rotate(${t * 14}) scale(${1 + n * 0.12 + beatPulse(t) * 0.04})`}>
          {Array.from({length: 24}, (_, i) => (
            <path key={i} d="M0 0 L -60 -1400 L 60 -1400 Z" fill={i % 2 ? K.sun : '#2a1408'} transform={`rotate(${i * 15})`} opacity={i % 2 ? 0.7 : 0.4} />
          ))}
        </g>
      </svg>
      <Sun t={t} r={70 + n * 16} x={540} y={520} glow={0.7} />

      {/* tunnel infinito di FREEDOM in prospettiva */}
      <AbsoluteFill style={{perspective: 900, perspectiveOrigin: '50% 50%'}}>
        <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateZ(${roll}deg)`}}>
          {Array.from({length: 9}, (_, i) => {
            const zz = ((i * 520 + (t - start) * 900) % (9 * 520)) - 9 * 520 + 300;
            const o = interpolate(zz, [-4400, -2000, 0, 260], [0, 0.5, 0.5, 0]);
            return (
              <div key={i} style={{position: 'absolute', top: 820, width: '100%', textAlign: 'center', fontSize: 300, color: 'transparent', WebkitTextStroke: `2px ${i % 3 === 0 ? K.sun : K.paper}`, opacity: o, transform: `translateZ(${zz}px)`}}>
                FREEDOM
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* colpo principale */}
      {n > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 820,
            width: '100%',
            textAlign: 'center',
            fontSize: 300,
            lineHeight: 1,
            transform: `perspective(1200px) translateZ(${(1 - hitP) * 400 + end * 1600}px) rotateZ(${roll}deg) scaleX(${n === 5 ? 1 + (1 - hitP) * 0.3 : 1})`,
            opacity: 1 - end,
            textShadow: n === 3 ? `0 0 30px ${K.sun}aa` : 'none',
            ...style[n],
          }}
        >
          FREEDOM
        </div>
      )}
      {/* contatore */}
      <div style={{position: 'absolute', top: 260, width: '100%', textAlign: 'center', fontFamily: UI, fontSize: 40, fontWeight: 700, letterSpacing: 16, color: K.gray}}>
        {Array.from({length: 5}, (_, i) => (
          <span key={i} style={{display: 'inline-block', width: 70, color: i < n ? K.sun : '#333', transform: `scale(${i === n - 1 ? 1 + hitP * 0.3 : 1})`}}>
            ●
          </span>
        ))}
      </div>

      {/* flash morbido sul colpo */}
      <AbsoluteFill style={{background: n % 2 ? K.paper : K.sun, opacity: flash * 0.35, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{background: K.paper, opacity: end}} />
    </AbsoluteFill>
  );
};

// ───────────────────────────── E · "Voglio il sole … Polo Nord" ─────────────────────────────
export const ScenePolo: React.FC<{start: number}> = ({start}) => {
  const {t} = useT(start);
  const tSole = wStart('sole', 2);
  const tRaggi = wStart('sole', 5);
  const tPolo = wStart('sole', 8);
  const R = 360;
  const sunRise = cl(t, start, tSole + 0.3, easeOut);
  const rays = cl(t, tRaggi - 0.1, tPolo + 0.2, easeOut);
  const warm = cl(t, tRaggi, tPolo + 0.5);
  const whiteIn = 1 - cl(t, start, start + 0.35);
  const spin = (t - start) * 10;
  const sunX = 540 + 330 - sunRise * 120;
  const sunY = 1080 - sunRise * 560;

  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${mix('#05070D', '#1A0A04', warm)}, ${mix('#0B1424', '#3A1606', warm)})`, overflow: 'hidden', fontFamily: UI}}>
      {/* stelle */}
      {Array.from({length: 60}, (_, i) => (
        <div key={i} style={{position: 'absolute', left: random(`sx${i}`) * 1080, top: random(`sy${i}`) * 1200, width: 3, height: 3, borderRadius: 2, background: '#fff', opacity: (0.2 + random(`so${i}`) * 0.6) * (1 - warm)}} />
      ))}
      <div style={{position: 'absolute', top: 170, width: '100%', textAlign: 'center', fontSize: 34, fontWeight: 600, letterSpacing: 10, color: K.gray}}>90°00′00″ N · POLO NORD</div>
      <AbsoluteFill style={{perspective: 1600}}>
        <div style={{position: 'absolute', left: 540 - R, top: 680 - R, width: R * 2, height: R * 2, transform: `rotateX(${32 + drift(t * FPS, 0.5, 3)}deg) rotateZ(${spin}deg)`}}>
          <svg width={R * 2} height={R * 2} viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`}>
            <defs>
              <radialGradient id="ice" cx="0.45" cy="0.4">
                <stop offset="0" stopColor={mix('#FFFFFF', '#FFE2C4', warm)} />
                <stop offset="1" stopColor={mix('#9FB4CC', K.sun, warm)} />
              </radialGradient>
            </defs>
            <circle r={R} fill={mix('#0E2238', '#4A1A06', warm)} />
            <path d={blob(R * 0.62)} fill="url(#ice)" />
            {[0.25, 0.5, 0.75].map((k) => (
              <circle key={k} r={R * k} fill="none" stroke="#fff" strokeOpacity={0.18} strokeWidth={2} />
            ))}
            {Array.from({length: 12}, (_, i) => (
              <line key={i} x1={0} y1={0} x2={0} y2={-R} stroke="#fff" strokeOpacity={0.14} strokeWidth={2} transform={`rotate(${i * 30})`} />
            ))}
            <circle r={R} fill="none" stroke={mix('#ffffff', K.sun, warm)} strokeOpacity={0.5} strokeWidth={3} />
            <circle r={9} fill={K.sun} />
          </svg>
        </div>
      </AbsoluteFill>
      {/* raggi che ricoprono il polo */}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}}>
        <g transform={`translate(${sunX} ${sunY})`}>
          {Array.from({length: 14}, (_, i) => {
            const a = 150 + i * 6.5;
            const len = 1500 * rays;
            return <path key={i} d={`M0 0 L ${-14} ${len} L 14 ${len} Z`} fill={K.sun} opacity={0.28} transform={`rotate(${a + drift(t * FPS, 0.8, 2, i)})`} />;
          })}
        </g>
      </svg>
      <Sun t={t} r={70} x={sunX} y={sunY} />
      <LyricLine line="sole" start={start} top={1180} size={104} highlight={['sole', 'raggi', 'polo', 'nord']} />
      <AbsoluteFill style={{background: K.paper, opacity: whiteIn}} />
    </AbsoluteFill>
  );
};
const blob = (r: number) => {
  let d = '';
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const rr = r * (0.82 + Math.sin(a * 3) * 0.08 + Math.cos(a * 5 + 1) * 0.06 + random(`b${i % 40}`) * 0.06);
    d += `${i ? 'L' : 'M'} ${Math.cos(a) * rr} ${Math.sin(a) * rr} `;
  }
  return d + 'Z';
};
const mix = (a: string, b: string, k: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(',')})`;
};

// ───────────────────────────── F · MIRIA (albero della vita) ─────────────────────────────
export const SceneTree: React.FC<{start: number; end: number}> = ({start, end}) => {
  const {t} = useT(start);
  const grow = cl(t, start + 0.1, end - 0.2, easeOut);
  const title = soft(t * FPS, (start + 0.3) * FPS, 18, 0.9);
  return (
    <AbsoluteFill style={{background: K.black, overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 520, width: '100%', textAlign: 'center', fontFamily: DISPLAY, fontSize: 380, color: 'transparent', WebkitTextStroke: `2px ${K.sun}`, opacity: 0.55 * title, letterSpacing: 30 * title, transform: `scale(${1.1 - title * 0.1 + (t - start) * 0.03})`}}>MIRIA</div>
      <div style={{position: 'absolute', left: 540 - 380, top: 300, transform: `translateY(${(1 - grow) * 60}px) scale(${1 + (t - start) * 0.04})`}}>
        <TreeOfLife size={760} grow={grow} color={K.paper} />
      </div>
      <div style={{position: 'absolute', top: 1200, width: '100%', textAlign: 'center', fontFamily: UI, fontSize: 34, letterSpacing: 12, color: K.gray, opacity: title}}>RADICI · RAMI · LUCE</div>
    </AbsoluteFill>
  );
};

// ───────────────────────────── H · OUTRO ─────────────────────────────
export const SceneOutro: React.FC<{start: number; end: number}> = ({start, end}) => {
  const {t} = useT(start);
  const a = pop(t * FPS, (start + 0.05) * FPS);
  const b = soft(t * FPS, (start + 0.3) * FPS);
  const out = cl(t, end - 0.25, end);
  return (
    <AbsoluteFill style={{background: K.black, overflow: 'hidden'}}>
      <Sun t={t} r={40 + a * 20} x={540} y={520} />
      <div style={{position: 'absolute', top: 660, width: '100%', transform: `scale(${1.3 - a * 0.3})`, opacity: Math.min(1, a * 1.5)}}>
        <Wordmark size={240} progress={1} />
      </div>
      <div style={{position: 'absolute', top: 900, width: '100%', textAlign: 'center', fontFamily: DISPLAY, fontSize: 150, color: K.sun, letterSpacing: 14 + (1 - b) * 40, opacity: b}}>FREEDOM</div>
      <div style={{position: 'absolute', top: 1090, width: '100%', textAlign: 'center', fontFamily: UI, fontSize: 36, fontWeight: 600, letterSpacing: 14, color: K.gray, opacity: b}}>DALL’ALBUM “MIRIA”</div>
      <AbsoluteFill style={{background: K.black, opacity: out}} />
    </AbsoluteFill>
  );
};

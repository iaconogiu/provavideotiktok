import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import data from './riepilogo_ig.json';
import {Backdrop, FONT, FPS, M, W, clamp, easeBack, easeIn, easeOut, hit, makeTiming, prog, useFontReady, type VW} from './kit';

/**
 * Riepilogo Instagram della giornata di Nations League (12–14/11/2026), sul modello del video
 * "10 giorni, 19 letture": titolo → "come sono finite?" → 7 singole (screen con FATTO ✓) →
 * "e le multiple?" → 3 multiple (screen dell'app, già pagate) → finale "10 su 10".
 * Ogni screen entra sulla sua frase e resta sotto i 4 s. Voce: public/motb/riepilogo/voce-ig.mp3,
 * tempi in riepilogo_ig.json (scripts/motb_align.py; senza mp3 sono stimati).
 * Bollino verde sulle singole: sei verificate sui risultati, Frattesi confermata dall'utente.
 */

export {FPS};
type Shot = {file: string; w: number; h: number; dot?: {x: number; y: number}};
const SLIPS: Shot[] = [
  {file: '1-turchia-belgio', w: 1206, h: 576, dot: {x: 116, y: 354}},
  {file: '1b-italia-francia', w: 1206, h: 621, dot: {x: 116, y: 380}},
  {file: '2-montenegro-lettonia', w: 1206, h: 609, dot: {x: 116, y: 376}},
  {file: '3-serbia-germania', w: 1206, h: 577, dot: {x: 116, y: 360}},
  {file: '4-bulgaria-islanda', w: 1149, h: 489},
  {file: '5-portogallo-danimarca-over', w: 1206, h: 564, dot: {x: 116, y: 364}},
  {file: '6-portogallo-danimarca-damsgaard', w: 1206, h: 568, dot: {x: 116, y: 353}},
];
// multiple: screen dell'app già pagati, tagliati sotto la quota totale (niente importi né vincita;
// codice della giocata sfocato)
const MULTI: Shot[] = [
  {file: 'm-12-11', w: 576, h: 842},
  {file: 'm-14-11-a', w: 792, h: 900},
  {file: 'm-14-11-b', w: 576, h: 864},
];
const NS = SLIPS.length;
const NM = MULTI.length;
const N = NS + NM;

const {cue, at} = makeTiming(data.words as VW[]);
const TAIL = data.audio ? 0.8 : 1.2;
const T_Q = at('titolo', 'come') - 0.1;
const START = SLIPS.map((_, i) => cue(`s${i + 1}`).start - 0.15);
const STAMP = SLIPS.map((_, i) => at(`s${i + 1}`, 'fatto') - 0.05);
const T_S = START[0];
const T_M = cue('multi').start - 0.1;
const MSTART = MULTI.map((_, j) => cue(`m${j + 1}`).start - 0.15);
const MSTAMP = MULTI.map((_, j) => at(`m${j + 1}`, 'fatto') - 0.05);
const T_G = cue('fine').start - 0.15;
const END = data.duration + TAIL;
export const SCHEDINE_FRAMES = Math.ceil(END * FPS);

const TEAL = '#2EE6B6';
const CARD_W = 960;
const MULTI_H = 1060;
const src = (s: Shot) => staticFile(`motb/schedine/${s.file}.png`);

const Counter: React.FC<{g: number; n: number; at: number; y: number; size?: number}> = ({g, n, at: t, y, size = 150}) => {
  const p = easeBack(prog(g, t, t + 0.3));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: size * 0.12}}>
      <span style={{fontFamily: FONT, fontSize: size, lineHeight: 1, color: TEAL, display: 'inline-block', transform: `scale(${0.6 + 0.4 * p})`, textShadow: `0 0 40px ${TEAL}66`}}>{n}</span>
      <span style={{fontFamily: FONT, fontSize: size * 0.55, lineHeight: 1, color: '#fff'}}>{n === 1 ? 'LETTURA' : 'LETTURE'}</span>
    </div>
  );
};

const Kicker: React.FC<{y: number; o?: number; children: React.ReactNode}> = ({y, o = 1, children}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontFamily: FONT, fontSize: 40, letterSpacing: 6, color: M.cyan, opacity: o}}>{children}</div>
);

const Stamp: React.FC<{g: number; at: number; x: number; y: number}> = ({g, at: t, x, y}) => {
  const p = easeBack(prog(g, t, t + 0.28));
  if (g < t) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, padding: '10px 30px', background: TEAL, color: M.ink, fontFamily: FONT, fontSize: 64, lineHeight: 1, borderRadius: 10, boxShadow: `0 0 50px ${TEAL}88, 0 14px 30px rgba(0,0,0,0.4)`, transform: `rotate(-6deg) scale(${(2 - p) * p})`, opacity: clamp(p * 3), whiteSpace: 'nowrap', zIndex: 200}}>
      FATTO ✓
    </div>
  );
};

const CheckBadge: React.FC<{s: number}> = ({s}) => (
  <div style={{width: s, height: s, borderRadius: '50%', background: M.green, border: `${s * 0.07}px solid #fff`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(0,0,0,0.4)'}}>
    <svg width={s * 0.55} height={s * 0.55} viewBox="0 0 24 24">
      <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#fff" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

/** singola: entra da destra, prende il FATTO ✓, poi sale dietro alla successiva */
const SlipCard: React.FC<{g: number; i: number}> = ({g, i}) => {
  const s = SLIPS[i];
  const a = START[i];
  if (g < a - 0.05 || g > T_M + 0.3) return null;
  const h = (CARD_W * s.h) / s.w;
  const inP = easeOut(prog(g, a, a + 0.35));
  const d = Math.min(2.6, [1, 2, 3].reduce((sum, k) => (i + k < NS ? sum + easeOut(prog(g, START[i + k] - 0.05, START[i + k] + 0.3)) : sum), 0));
  const exitAll = easeIn(prog(g, T_M - 0.1, T_M + 0.25));
  const y = 840 - d * 55;
  const sc = (0.92 + 0.08 * inP) * (1 - d * 0.08);
  const op = Math.min(inP, d > 2.4 ? clamp(3 - d) / 0.6 : 1) * (1 - exitAll) * (d > 0.01 ? 1 - Math.min(0.55, d * 0.3) : 1);
  const tStamp = STAMP[i];
  const ring = s.dot && g > a + 0.4 ? (g - a - 0.4) % 0.9 : -1;
  const sx = CARD_W / s.w;
  return (
    <div
      style={{
        position: 'absolute',
        left: (W - CARD_W) / 2,
        top: y,
        width: CARD_W,
        height: h,
        transform: `translateX(${(1 - inP) * 700}px) rotate(${(1 - inP) * 6}deg) scale(${sc})`,
        transformOrigin: '50% 0',
        opacity: op,
        zIndex: 100 - Math.round(d * 10),
        filter: d > 0.05 ? `blur(${Math.min(4, d * 2)}px)` : undefined,
      }}
    >
      <Img src={src(s)} style={{width: CARD_W, height: h, borderRadius: 26, display: 'block', boxShadow: '0 30px 70px rgba(0,0,0,0.5)', border: `4px solid ${g > tStamp ? TEAL : 'rgba(255,255,255,0.5)'}`}} />
      {ring >= 0 && ring < 0.8 && d < 0.05 && (
        <div style={{position: 'absolute', left: s.dot!.x * sx - 30 - ring * 40, top: s.dot!.y * sx - 30 - ring * 40, width: 60 + ring * 80, height: 60 + ring * 80, borderRadius: '50%', border: `5px solid ${M.green}`, opacity: 1 - ring / 0.8}} />
      )}
      {d < 0.05 && <Stamp g={g} at={tStamp} x={CARD_W - 330} y={h - 40} />}
    </div>
  );
};

/** multipla: screen alto al centro; entra da destra ed esce a sinistra quando arriva la successiva */
const MultiCard: React.FC<{g: number; j: number}> = ({g, j}) => {
  const s = MULTI[j];
  const a = MSTART[j];
  const b = j + 1 < NM ? MSTART[j + 1] : T_G;
  if (g < a - 0.05 || g > b + 0.35) return null;
  const w = (MULTI_H * s.w) / s.h;
  const inP = easeOut(prog(g, a, a + 0.35));
  const out = easeIn(prog(g, b - 0.05, b + 0.3));
  return (
    <div
      style={{
        position: 'absolute',
        left: (W - w) / 2,
        top: 590,
        width: w,
        height: MULTI_H,
        transform: `translateX(${(1 - inP) * 800 - out * 900}px) rotate(${(1 - inP) * 6 - out * 6}deg)`,
        opacity: Math.min(inP, 1 - out),
      }}
    >
      <Img src={src(s)} style={{width: w, height: MULTI_H, borderRadius: 26, display: 'block', boxShadow: '0 30px 80px rgba(0,0,0,0.55)', border: `5px solid ${g > MSTAMP[j] ? TEAL : 'rgba(255,255,255,0.5)'}`}} />
      {out < 0.05 && <Stamp g={g} at={MSTAMP[j]} x={w - 300} y={MULTI_H - 230} />}
    </div>
  );
};

/** finale: le tre multiple a ventaglio */
const Finale: React.FC<{g: number}> = ({g}) => {
  if (g < T_G - 0.05) return null;
  const hh = 760;
  const rot = [-9, 0, 9];
  const dx = [-250, 0, 250];
  return (
    <>
      {MULTI.map((s, j) => {
        const w = (hh * s.w) / s.h;
        const t = T_G + 0.1 + j * 0.12;
        const p = easeBack(prog(g, t, t + 0.35));
        return (
          <div key={s.file} style={{position: 'absolute', left: (W - w) / 2 + dx[j], top: 760 + Math.abs(dx[j]) * 0.12, width: w, transform: `rotate(${rot[j]}deg) scale(${p})`, opacity: clamp(p * 2), zIndex: j === 1 ? 3 : 1}}>
            <Img src={src(s)} style={{width: w, height: hh, borderRadius: 20, display: 'block', border: `4px solid ${TEAL}`, boxShadow: '0 20px 50px rgba(0,0,0,0.55)'}} />
            <div style={{position: 'absolute', right: -16, top: -16}}>
              <CheckBadge s={66} />
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, top: 650, textAlign: 'center', fontFamily: FONT, fontSize: 48, color: '#fff', opacity: easeOut(prog(g, T_G + 0.4, T_G + 0.7))}}>
        {NS} SINGOLE <span style={{color: TEAL}}>✓</span> · {NM} MULTIPLE <span style={{color: TEAL}}>✓</span>
      </div>
    </>
  );
};

export const Schedine: React.FC = () => {
  useFontReady();
  const frame = useCurrentFrame();
  const g = frame / FPS;
  const titleOut = easeIn(prog(g, T_Q - 0.15, T_Q + 0.1));
  const qIn = easeOut(prog(g, T_Q, T_Q + 0.3));
  const qOut = easeIn(prog(g, T_S - 0.15, T_S + 0.1));
  const mIn = easeOut(prog(g, T_M, T_M + 0.3));
  const mOut = easeIn(prog(g, MSTART[0] - 0.15, MSTART[0] + 0.1));
  const flash = Math.max(...[T_Q, T_M, T_G, ...START, ...MSTART].map((c) => hit(g, c, 14) * 0.18));
  const stamps = [...STAMP, ...MSTAMP];
  const done = stamps.filter((t) => g >= t).length;
  const lastDone = stamps[Math.max(0, done - 1)];
  return (
    <AbsoluteFill style={{background: M.bgBottom, overflow: 'hidden'}}>
      <Backdrop g={g} />
      {g < T_S + 0.2 && (
        <AbsoluteFill style={{opacity: 1 - qOut}}>
          <Img src={staticFile('motb/haaland/norvegia-stadio.png')} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.1 + g * 0.03})`, filter: `blur(${2 + qIn * 10}px)`}} />
          <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(11,15,51,0.45) 0%, rgba(11,15,51,${0.55 + qIn * 0.3}) 100%)`}} />
        </AbsoluteFill>
      )}

      {/* 1 · titolo */}
      {g < T_Q + 0.15 && (
        <AbsoluteFill style={{opacity: 1 - titleOut, filter: titleOut > 0.01 ? `blur(${titleOut * 14}px)` : undefined}}>
          <Kicker y={560} o={easeOut(prog(g, 0, 0.3))}>NATIONS LEAGUE · 1 GIORNATA</Kicker>
          <Counter g={g} n={NS} at={at('titolo', 'sette') - 0.05} y={640} size={200} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 860, textAlign: 'center', fontFamily: FONT, fontSize: 90, color: '#fff', opacity: easeOut(prog(g, at('titolo', 'tre') - 0.1, at('titolo', 'tre') + 0.2))}}>
            + <span style={{color: TEAL}}>{NM}</span> MULTIPLE
          </div>
        </AbsoluteFill>
      )}

      {/* 2 · come sono finite? */}
      {g >= T_Q - 0.05 && g < T_S + 0.15 && (
        <AbsoluteFill style={{opacity: qIn * (1 - qOut)}}>
          {[0, 1, 2, 3, 4].map((k) => (
            <div key={k} style={{position: 'absolute', left: 90 + (k % 2) * 40, top: 360 + k * 150, width: 900, height: 120, borderRadius: 18, background: 'rgba(60,90,230,0.35)', filter: 'blur(6px)', transform: `translateX(${Math.sin(g * 2 + k) * 20}px)`}} />
          ))}
          <div style={{position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', fontFamily: FONT, fontSize: 300, color: '#fff', lineHeight: 1, transform: `scale(${easeBack(qIn)})`}}>?</div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 990, textAlign: 'center', fontFamily: FONT, fontSize: 90, color: '#fff'}}>COME SONO FINITE?</div>
        </AbsoluteFill>
      )}

      {/* 3 · singole e multiple: contatore in alto */}
      {g >= T_S - 0.05 && g < T_G + 0.3 && (
        <>
          <Kicker y={330}>NATIONS LEAGUE · 12–14 NOVEMBRE</Kicker>
          {done > 0 && <Counter g={g} n={done} at={lastDone} y={400} />}
        </>
      )}
      {SLIPS.map((_, i) => (
        <SlipCard key={i} g={g} i={i} />
      ))}

      {/* 4 · e le multiple? */}
      {g >= T_M - 0.05 && g < MSTART[0] + 0.15 && (
        <AbsoluteFill style={{opacity: mIn * (1 - mOut)}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 700, textAlign: 'center', fontFamily: FONT, fontSize: 260, color: '#fff', lineHeight: 1, transform: `scale(${easeBack(mIn)})`}}>?</div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 1000, textAlign: 'center', fontFamily: FONT, fontSize: 100, color: '#fff'}}>
            E LE <span style={{color: TEAL}}>MULTIPLE?</span>
          </div>
        </AbsoluteFill>
      )}
      {MULTI.map((_, j) => (
        <MultiCard key={j} g={g} j={j} />
      ))}

      {/* 5 · finale */}
      {g >= T_G - 0.05 && (
        <>
          <Kicker y={300}>NATIONS LEAGUE · 5ª GIORNATA</Kicker>
          <Counter g={g} n={N} at={at('fine', 'dieci')} y={370} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 545, textAlign: 'center', fontFamily: FONT, fontSize: 56, color: TEAL, opacity: easeOut(prog(g, at('fine', 'su') - 0.05, at('fine', 'su') + 0.25))}}>
            {N} SU {N} ✓
          </div>
          <Finale g={g} />
        </>
      )}

      <AbsoluteFill style={{background: '#fff', opacity: flash, mixBlendMode: 'screen'}} />
      {data.audio && <Audio src={staticFile('motb/riepilogo/voce-ig.mp3')} />}
    </AbsoluteFill>
  );
};

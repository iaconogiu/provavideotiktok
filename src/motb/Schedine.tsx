import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import data from './riepilogo.json';
import {Backdrop, FONT, FPS, M, W, clamp, easeBack, easeIn, easeOut, hit, makeTiming, prog, useFontReady, type VW} from './kit';

/**
 * Riepilogo della giornata di Nations League (12–14/11/2026) per Instagram, sul modello del
 * video "10 giorni, 19 letture": titolo → "come sono finite?" → una schermata per giocata
 * (ognuna sulla sua frase, sempre sotto i 4 s) con FATTO ✓ sulla parola "fatto" → griglia finale.
 * Voce: public/motb/riepilogo/voce.mp3 (ElevenLabs accelerata del 12%), tempi in riepilogo.json.
 * Bollino verde solo sulle giocate vinte (public/motb/schedine/): sei verificate sui risultati,
 * Frattesi (tiri) confermata dall'utente.
 */

export {FPS};
type Slip = {file: string; w: number; h: number; dot?: {x: number; y: number}};
const SLIPS: Slip[] = [
  {file: '1-turchia-belgio', w: 1206, h: 576, dot: {x: 116, y: 354}},
  {file: '1b-italia-francia', w: 1206, h: 621, dot: {x: 116, y: 380}},
  {file: '2-montenegro-lettonia', w: 1206, h: 609, dot: {x: 116, y: 376}},
  {file: '3-serbia-germania', w: 1206, h: 577, dot: {x: 116, y: 360}},
  {file: '4-bulgaria-islanda', w: 1149, h: 489},
  {file: '5-portogallo-danimarca-over', w: 1206, h: 564, dot: {x: 116, y: 364}},
  {file: '6-portogallo-danimarca-damsgaard', w: 1206, h: 568, dot: {x: 116, y: 353}},
];
const N = SLIPS.length;
const {cue, at} = makeTiming(data.words as VW[]);
const T_Q = at('titolo', 'come') - 0.1; // "come sono finite?"
const START = SLIPS.map((_, i) => cue(`s${i + 1}`).start - 0.15); // ogni schermata entra sulla sua frase
const STAMP = SLIPS.map((_, i) => at(`s${i + 1}`, 'fatto') - 0.05); // FATTO ✓ quando si dice "fatto"
const T_S = START[0];
const T_G = cue('fine').start - 0.15; // griglia finale
const END = data.duration + 0.8;
export const SCHEDINE_FRAMES = Math.ceil(END * FPS);

const TEAL = '#2EE6B6';
const CARD_W = 960;

const src = (s: Slip) => staticFile(`motb/schedine/${s.file}.png`);

/** numero grande + "LETTURE", come nel video di riferimento */
const Counter: React.FC<{g: number; n: number; at: number; y: number; size?: number}> = ({g, n, at, y, size = 150}) => {
  const p = easeBack(prog(g, at, at + 0.3));
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

const Stamp: React.FC<{g: number; at: number; x: number; y: number; s?: number}> = ({g, at, x, y, s = 1}) => {
  const p = easeBack(prog(g, at, at + 0.28));
  if (g < at) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        padding: `${10 * s}px ${30 * s}px`,
        background: TEAL,
        color: M.ink,
        fontFamily: FONT,
        fontSize: 64 * s,
        lineHeight: 1,
        borderRadius: 10 * s,
        boxShadow: `0 0 50px ${TEAL}88, 0 14px 30px rgba(0,0,0,0.4)`,
        transform: `rotate(-6deg) scale(${(2 - p) * p})`,
        opacity: clamp(p * 3),
        whiteSpace: 'nowrap',
      }}
    >
      FATTO ✓
    </div>
  );
};

/** una schermata: entra da destra, prende il FATTO ✓, poi sale dietro alla successiva */
const SlipCard: React.FC<{g: number; i: number}> = ({g, i}) => {
  const s = SLIPS[i];
  const a = START[i];
  if (g < a - 0.05 || g > T_G + 0.3) return null;
  const h = (CARD_W * s.h) / s.w;
  const inP = easeOut(prog(g, a, a + 0.35));
  // quante schermate sono arrivate dopo questa: la pila si sposta in alto e si rimpicciolisce
  const d = Math.min(2.6, [1, 2, 3].reduce((sum, k) => (i + k < N ? sum + easeOut(prog(g, START[i + k] - 0.05, START[i + k] + 0.3)) : sum), 0));
  const exitAll = easeIn(prog(g, T_G - 0.1, T_G + 0.25));
  const y0 = 840;
  const y = y0 - d * 55;
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
      {/* richiamo sul bollino verde */}
      {ring >= 0 && ring < 0.8 && d < 0.05 && (
        <div style={{position: 'absolute', left: s.dot!.x * sx - 30 - ring * 40, top: s.dot!.y * sx - 30 - ring * 40, width: 60 + ring * 80, height: 60 + ring * 80, borderRadius: '50%', border: `5px solid ${M.green}`, opacity: 1 - ring / 0.8}} />
      )}
      {d < 0.05 && <Stamp g={g} at={tStamp} x={CARD_W - 330} y={h - 40} />}
    </div>
  );
};

/** griglia finale con tutte le giocate */
const Grid: React.FC<{g: number}> = ({g}) => {
  if (g < T_G - 0.05) return null;
  const cw = 440;
  return (
    <>
      {SLIPS.map((s, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const h = (cw * s.h) / s.w;
        const alone = i === SLIPS.length - 1 && SLIPS.length % 2 === 1;
        const left = alone ? (W - cw) / 2 : (W - 2 * cw - 40) / 2 + col * (cw + 40);
        const at = T_G + 0.1 + i * 0.12;
        const p = easeBack(prog(g, at, at + 0.3));
        return (
          <div key={s.file} style={{position: 'absolute', left, top: 630 + row * 238, width: cw, transform: `scale(${p})`, opacity: clamp(p * 2)}}>
            <Img src={src(s)} style={{width: cw, height: h, borderRadius: 16, display: 'block', border: `3px solid ${TEAL}`, boxShadow: '0 16px 40px rgba(0,0,0,0.45)'}} />
            <div style={{position: 'absolute', right: -14, top: -14, width: 56, height: 56, borderRadius: '50%', background: M.green, border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(0,0,0,0.4)'}}>
              <svg width="30" height="30" viewBox="0 0 24 24">
                <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#fff" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        );
      })}
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
  const cuts = [T_Q, T_G, ...START];
  const flash = Math.max(...cuts.map((c) => hit(g, c, 14) * 0.18));
  // contatore: sale quando ogni schermata prende il FATTO ✓
  const done = STAMP.filter((t) => g >= t).length;
  const lastDone = STAMP[Math.max(0, done - 1)];
  return (
    <AbsoluteFill style={{background: M.bgBottom, overflow: 'hidden'}}>
      <Backdrop g={g} />
      {/* foto dello stadio dietro al titolo */}
      {g < T_S + 0.2 && (
        <AbsoluteFill style={{opacity: 1 - qOut}}>
          <Img src={staticFile('motb/haaland/norvegia-stadio.png')} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.1 + g * 0.03})`, filter: `blur(${2 + qIn * 10}px)`}} />
          <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(11,15,51,0.45) 0%, rgba(11,15,51,${0.55 + qIn * 0.3}) 100%)`}} />
        </AbsoluteFill>
      )}

      {/* 1 · titolo */}
      {g < T_Q + 0.15 && (
        <AbsoluteFill style={{opacity: 1 - titleOut, filter: titleOut > 0.01 ? `blur(${titleOut * 14}px)` : undefined}}>
          <Kicker y={620} o={easeOut(prog(g, 0, 0.3))}>NATIONS LEAGUE</Kicker>
          <div style={{position: 'absolute', left: 0, right: 0, top: 700, textAlign: 'center', fontFamily: FONT, fontSize: 110, color: '#fff', lineHeight: 1, transform: `scale(${0.8 + 0.2 * easeBack(prog(g, 0.05, 0.35))})`}}>1 GIORNATA</div>
          <Counter g={g} n={N} at={at('titolo', 'sette') - 0.05} y={830} size={250} />
        </AbsoluteFill>
      )}

      {/* 2 · come sono finite? */}
      {g >= T_Q - 0.05 && g < T_S + 0.15 && (
        <AbsoluteFill style={{opacity: qIn * (1 - qOut)}}>
          {/* schede fantasma sullo sfondo */}
          {[0, 1, 2, 3, 4].map((k) => (
            <div key={k} style={{position: 'absolute', left: 90 + (k % 2) * 40, top: 360 + k * 150, width: 900, height: 120, borderRadius: 18, background: 'rgba(60,90,230,0.35)', filter: 'blur(6px)', transform: `translateX(${Math.sin(g * 2 + k) * 20}px)`}} />
          ))}
          <div style={{position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', fontFamily: FONT, fontSize: 300, color: '#fff', lineHeight: 1, transform: `scale(${easeBack(qIn)})`}}>?</div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 990, textAlign: 'center', fontFamily: FONT, fontSize: 90, color: '#fff'}}>COME SONO FINITE?</div>
        </AbsoluteFill>
      )}

      {/* 3 · una schermata per giocata */}
      {g >= T_S - 0.05 && g < T_G + 0.3 && (
        <>
          <Kicker y={330}>NATIONS LEAGUE · 12–14 NOVEMBRE</Kicker>
          {done > 0 && <Counter g={g} n={done} at={lastDone} y={400} />}
        </>
      )}
      {SLIPS.map((_, i) => (
        <SlipCard key={i} g={g} i={i} />
      ))}

      {/* 4 · griglia finale */}
      {g >= T_G - 0.05 && (
        <>
          <Kicker y={300}>NATIONS LEAGUE · 5ª GIORNATA</Kicker>
          <Counter g={g} n={N} at={at('fine', 'sette')} y={370} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 545, textAlign: 'center', fontFamily: FONT, fontSize: 52, color: TEAL, opacity: easeOut(prog(g, at('fine', 'su') - 0.05, at('fine', 'su') + 0.25))}}>{N} SU {N} ✓</div>
          <Grid g={g} />
        </>
      )}

      <AbsoluteFill style={{background: '#fff', opacity: flash, mixBlendMode: 'screen'}} />
      {data.audio && <Audio src={staticFile('motb/riepilogo/voce.mp3')} />}
    </AbsoluteFill>
  );
};

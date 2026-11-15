import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import data from './riepilogo.json';
import {Backdrop, FONT, FPS, FlagIcon, M, W, clamp, easeBack, easeIn, easeOut, hit, makeTiming, prog, useFontReady, type VW} from './kit';

/**
 * Versione TikTok del riepilogo di Nations League: nessuno screen, nessuna quota, nessun
 * bookmaker. Ogni giocata è ricostruita come "lettura" del canale (partita, data, lettura in
 * parole semplici, risultato reale) come nel video "10 giorni, 19 letture".
 * Stessa voce e stessi tempi della versione Instagram (riepilogo.json).
 */

export {FPS};
type Lettura = {date: string; home: string; away: string; hf: string; af: string; text: string; result: string};
const LETTURE: Lettura[] = [
  {date: '12/11', home: 'TURCHIA', away: 'BELGIO', hf: 'tr', af: 'be', text: 'TURCHIA DA 1 A 3 GOL, BELGIO DA 2 A 4', result: 'FINITA 1-2'},
  {date: '12/11', home: 'ITALIA', away: 'FRANCIA', hf: 'it', af: 'fr', text: 'FRATTESI (E CHI LO SOSTITUISCE) ALMENO 3 TIRI', result: 'FINITA 3-1 · GOL DI FRATTESI'},
  {date: '12/11', home: 'MONTENEGRO', away: 'LETTONIA', hf: 'me', af: 'lv', text: 'KRSTOVIĆ SEGNA O COLPISCE UN PALO', result: "GOL DI KRSTOVIĆ AL 70'"},
  {date: '13/11', home: 'SERBIA', away: 'GERMANIA', hf: 'rs', af: 'de', text: 'GERMANIA CON ALMENO 3 ANGOLI IN PIÙ NEL 1° TEMPO', result: 'ANGOLI NEL 1° TEMPO: 0-4'},
  {date: '13/11', home: 'BULGARIA', away: 'ISLANDA', hf: 'bg', af: 'is', text: 'ÓSKARSSON SEGNA O COLPISCE UN PALO', result: 'FINITA 0-5 · GOL DI ÓSKARSSON'},
  {date: '14/11', home: 'PORTOGALLO', away: 'DANIMARCA', hf: 'pt', af: 'dk', text: 'DANIMARCA ALMENO 2 TRA GOL E PALI', result: 'FINITA 1-4'},
  {date: '14/11', home: 'PORTOGALLO', away: 'DANIMARCA', hf: 'pt', af: 'dk', text: 'DAMSGAARD SEGNA O FA ASSIST', result: 'ASSIST DI DAMSGAARD PER LO 0-2'},
];
const N = LETTURE.length;
const {cue, at} = makeTiming(data.words as VW[]);
const T_Q = at('titolo', 'come') - 0.1;
const START = LETTURE.map((_, i) => cue(`s${i + 1}`).start - 0.15);
const STAMP = LETTURE.map((_, i) => at(`s${i + 1}`, 'fatto') - 0.05);
const T_S = START[0];
const T_G = cue('fine').start - 0.15;
const END = data.duration + 0.8;
export const LETTURE_FRAMES = Math.ceil(END * FPS);

const TEAL = '#2EE6B6';
const CARD_W = 960;
const CARD_H = 300;

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

const CheckDot: React.FC<{s: number; p?: number}> = ({s, p = 1}) => (
  <div style={{width: s, height: s, borderRadius: '50%', background: M.green, border: `${s * 0.07}px solid #fff`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 ${s * 0.5}px ${M.green}99`, transform: `scale(${p})`}}>
    <svg width={s * 0.55} height={s * 0.55} viewBox="0 0 24 24">
      <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#fff" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

/** la scheda di una lettura (grande, oppure piccola per la griglia finale) */
const Card: React.FC<{l: Lettura; w: number; done: number; showResult?: number; mini?: boolean}> = ({l, w, done, showResult = 0, mini}) => {
  const k = w / CARD_W;
  return (
    <div style={{position: 'relative', width: w, height: CARD_H * k * (mini ? 0.62 : 1)}}>
      {/* pannello a parallelogramma, blu del canale */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: 'skewX(-6deg)',
          borderRadius: 22 * k,
          background: `linear-gradient(135deg, #3346E0 0%, #2533B0 45%, ${M.navy} 100%)`,
          border: `${4 * k}px solid ${done > 0.5 ? TEAL : 'rgba(150,170,255,0.55)'}`,
          boxShadow: `0 ${8 * k}px 0 -${k}px ${M.cyan}, 0 ${30 * k}px ${70 * k}px rgba(0,0,0,0.5)${done > 0.5 ? `, 0 0 ${50 * k}px ${TEAL}55` : ''}`,
        }}
      />
      <div style={{position: 'absolute', left: 44 * k, right: 44 * k, top: (mini ? 18 : 26) * k}}>
        {/* data, bandiere, competizione */}
        {!mini && (
          <div style={{display: 'flex', alignItems: 'center', gap: 14 * k}}>
            <div style={{fontFamily: FONT, fontSize: 30 * k, color: 'rgba(255,255,255,0.75)'}}>{l.date}</div>
            <FlagIcon code={l.hf} h={26 * k} />
            <FlagIcon code={l.af} h={26 * k} />
            <div style={{marginLeft: 'auto', padding: `${4 * k}px ${14 * k}px`, borderRadius: 6 * k, background: M.white, color: M.ink, fontFamily: FONT, fontSize: 24 * k, transform: 'skewX(-10deg)'}}>NATIONS LEAGUE</div>
          </div>
        )}
        <div style={{fontFamily: FONT, fontSize: (mini ? 62 : 74) * k, lineHeight: 1.1, color: '#fff', marginTop: (mini ? 0 : 10) * k, whiteSpace: 'nowrap'}}>
          {l.home} – {l.away}
        </div>
        <div style={{fontFamily: FONT, fontSize: (mini ? 30 : 36) * k, lineHeight: 1.15, color: '#C9D6FF', marginTop: 6 * k, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: (mini ? 760 : 820) * k}}>{l.text}</div>
        {!mini && (
          <div style={{fontFamily: FONT, fontSize: 38 * k, color: M.yellow, marginTop: 10 * k, opacity: showResult, transform: `translateY(${(1 - showResult) * 14 * k}px)`}}>
            {l.result}
          </div>
        )}
      </div>
      <div style={{position: 'absolute', right: 30 * k, top: (mini ? 30 : 116) * k}}>
        {done > 0 && <CheckDot s={(mini ? 70 : 84) * k} p={easeBack(clamp(done))} />}
      </div>
    </div>
  );
};

const Stamp: React.FC<{g: number; at: number; x: number; y: number}> = ({g, at: t, x, y}) => {
  const p = easeBack(prog(g, t, t + 0.28));
  if (g < t) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, padding: '10px 30px', background: TEAL, color: M.ink, fontFamily: FONT, fontSize: 64, lineHeight: 1, borderRadius: 10, boxShadow: `0 0 50px ${TEAL}88, 0 14px 30px rgba(0,0,0,0.4)`, transform: `rotate(-6deg) scale(${(2 - p) * p})`, opacity: clamp(p * 3), whiteSpace: 'nowrap'}}>
      FATTO ✓
    </div>
  );
};

/** una lettura: entra da destra, prende il FATTO ✓ e il risultato, poi sale dietro alla successiva */
const Slide: React.FC<{g: number; i: number}> = ({g, i}) => {
  const l = LETTURE[i];
  const a = START[i];
  if (g < a - 0.05 || g > T_G + 0.3) return null;
  const inP = easeOut(prog(g, a, a + 0.35));
  const d = Math.min(2.6, [1, 2, 3].reduce((sum, k) => (i + k < N ? sum + easeOut(prog(g, START[i + k] - 0.05, START[i + k] + 0.3)) : sum), 0));
  const exitAll = easeIn(prog(g, T_G - 0.1, T_G + 0.25));
  const y = 820 - d * 60;
  const sc = (0.92 + 0.08 * inP) * (1 - d * 0.08);
  const op = Math.min(inP, d > 2.4 ? clamp(3 - d) / 0.6 : 1) * (1 - exitAll) * (d > 0.01 ? 1 - Math.min(0.55, d * 0.3) : 1);
  const done = prog(g, STAMP[i], STAMP[i] + 0.25);
  const res = easeOut(prog(g, a + 0.5, a + 0.8));
  return (
    <div
      style={{
        position: 'absolute',
        left: (W - CARD_W) / 2,
        top: y,
        transform: `translateX(${(1 - inP) * 700}px) rotate(${(1 - inP) * 6}deg) scale(${sc})`,
        transformOrigin: '50% 0',
        opacity: op,
        zIndex: 100 - Math.round(d * 10),
        filter: d > 0.05 ? `blur(${Math.min(4, d * 2)}px)` : undefined,
      }}
    >
      <Card l={l} w={CARD_W} done={done} showResult={res} />
      {d < 0.05 && <Stamp g={g} at={STAMP[i]} x={CARD_W - 330} y={CARD_H - 40} />}
    </div>
  );
};

const Grid: React.FC<{g: number}> = ({g}) => {
  if (g < T_G - 0.05) return null;
  const cw = 900;
  return (
    <>
      {LETTURE.map((l, i) => {
        const t = T_G + 0.1 + i * 0.1;
        const p = easeBack(prog(g, t, t + 0.3));
        return (
          <div key={i} style={{position: 'absolute', left: (W - cw) / 2 + (i % 2 ? 20 : -20), top: 640 + i * 150, transform: `scale(${p})`, opacity: clamp(p * 2)}}>
            <Card l={l} w={cw} done={1} mini />
          </div>
        );
      })}
    </>
  );
};

export const LettureTikTok: React.FC = () => {
  useFontReady();
  const frame = useCurrentFrame();
  const g = frame / FPS;
  const titleOut = easeIn(prog(g, T_Q - 0.15, T_Q + 0.1));
  const qIn = easeOut(prog(g, T_Q, T_Q + 0.3));
  const qOut = easeIn(prog(g, T_S - 0.15, T_S + 0.1));
  const flash = Math.max(...[T_Q, T_G, ...START].map((c) => hit(g, c, 14) * 0.18));
  const done = STAMP.filter((t) => g >= t).length;
  const lastDone = STAMP[Math.max(0, done - 1)];
  return (
    <AbsoluteFill style={{background: M.bgBottom, overflow: 'hidden'}}>
      <Backdrop g={g} />
      {g < T_S + 0.2 && (
        <AbsoluteFill style={{opacity: 1 - qOut}}>
          <Img src={staticFile('motb/haaland/norvegia-stadio.png')} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.1 + g * 0.03})`, filter: `blur(${2 + qIn * 10}px)`}} />
          <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(11,15,51,0.45) 0%, rgba(11,15,51,${0.55 + qIn * 0.3}) 100%)`}} />
        </AbsoluteFill>
      )}

      {g < T_Q + 0.15 && (
        <AbsoluteFill style={{opacity: 1 - titleOut, filter: titleOut > 0.01 ? `blur(${titleOut * 14}px)` : undefined}}>
          <Kicker y={620} o={easeOut(prog(g, 0, 0.3))}>NATIONS LEAGUE</Kicker>
          <div style={{position: 'absolute', left: 0, right: 0, top: 700, textAlign: 'center', fontFamily: FONT, fontSize: 110, color: '#fff', lineHeight: 1, transform: `scale(${0.8 + 0.2 * easeBack(prog(g, 0.05, 0.35))})`}}>1 GIORNATA</div>
          <Counter g={g} n={N} at={at('titolo', 'sette') - 0.05} y={830} size={250} />
        </AbsoluteFill>
      )}

      {g >= T_Q - 0.05 && g < T_S + 0.15 && (
        <AbsoluteFill style={{opacity: qIn * (1 - qOut)}}>
          {[0, 1, 2, 3, 4].map((k) => (
            <div key={k} style={{position: 'absolute', left: 90 + (k % 2) * 40, top: 360 + k * 150, width: 900, height: 120, borderRadius: 18, background: 'rgba(60,90,230,0.35)', filter: 'blur(6px)', transform: `translateX(${Math.sin(g * 2 + k) * 20}px) skewX(-6deg)`}} />
          ))}
          <div style={{position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', fontFamily: FONT, fontSize: 300, color: '#fff', lineHeight: 1, transform: `scale(${easeBack(qIn)})`}}>?</div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 990, textAlign: 'center', fontFamily: FONT, fontSize: 90, color: '#fff'}}>COME SONO FINITE?</div>
        </AbsoluteFill>
      )}

      {g >= T_S - 0.05 && g < T_G + 0.3 && (
        <>
          <Kicker y={330}>NATIONS LEAGUE · 12–14 NOVEMBRE</Kicker>
          {done > 0 && <Counter g={g} n={done} at={lastDone} y={400} />}
        </>
      )}
      {LETTURE.map((_, i) => (
        <Slide key={i} g={g} i={i} />
      ))}

      {g >= T_G - 0.05 && (
        <>
          <Kicker y={300}>NATIONS LEAGUE · 5ª GIORNATA</Kicker>
          <Counter g={g} n={N} at={at('fine', 'sette')} y={370} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 545, textAlign: 'center', fontFamily: FONT, fontSize: 52, color: TEAL, opacity: easeOut(prog(g, at('fine', 'su') - 0.05, at('fine', 'su') + 0.25))}}>
            {N} SU {N} ✓
          </div>
          <Grid g={g} />
        </>
      )}

      <AbsoluteFill style={{background: '#fff', opacity: flash, mixBlendMode: 'screen'}} />
      {data.audio && <Audio src={staticFile('motb/riepilogo/voce.mp3')} />}
    </AbsoluteFill>
  );
};

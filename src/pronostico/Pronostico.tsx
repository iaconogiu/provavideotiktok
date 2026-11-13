import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, random, staticFile, useCurrentFrame} from 'remotion';
import {CLIPS} from './clips';
import {C, DISPLAY, FPS, FRAMES, FlagBG, FlagIS, H, SCENES, UI, VOICE, W, WavingFlag, at, clamp, cue, easeBack, easeIn, easeInOut, easeOut, hit, prog, scene} from './kit';
import {Andata, Chiusura, Liga, Lettura, Nazionale, Pronostico5} from './Scenes';

/**
 * Pronostico Bulgaria–Islanda (Nations League, Lega C): il nome da seguire è Orri Óskarsson.
 * Stile "notte di Nations League": blu notte, scie di luce argento/ciano, riflettori sul campo;
 * le due squadre entrano con i loro colori (Bulgaria bianco-verde-rosso, Islanda blu con croce
 * bianca e rossa). Intro: sfida → frase gancio → presentazione del giocatore; poi le scene di
 * Scenes.tsx. Tutto è agganciato ai tempi della voce (src/pronostico/voce.json).
 */

export {FPS};
export const PRONOSTICO_FRAMES = FRAMES;

// ── tempi dell'intro, presi dalla voce ──
const vs = at('intro', 'bulgaria') + 0.35;
const hook = at('intro', "c'e") - 0.05;
const date = at('intro', 'stasera');
const T = {
  panelsIn: Math.max(0.05, vs - 0.75),
  vs,
  date,
  panelsOut: Math.max(date + 0.5, hook - 0.35),
  hook,
  reveal: at('chi', 'orri') - 0.35,
  name: at('chi', 'oskarsson'),
  nine: at('chi', 'numero'),
  end: scene('intro').b,
};

// ───────────────────────── sfondo ─────────────────────────

/** campo di notte visto dall'alto in prospettiva, con la camera che scivola lenta */
const Pitch: React.FC<{g: number}> = ({g}) => {
  const drift = g * 38;
  const line = 'rgba(235,245,255,0.55)';
  return (
    <AbsoluteFill style={{perspective: 1300, perspectiveOrigin: '50% 30%'}}>
      <div
        style={{
          position: 'absolute',
          left: W / 2 - 1500,
          top: 420,
          width: 3000,
          height: 4200,
          transformOrigin: '50% 0%',
          transform: `rotateX(64deg) translateY(${-600 - drift}px) rotateZ(${-6 + g * 0.6}deg)`,
          background: 'repeating-linear-gradient(0deg, #1A6A40 0 260px, #22794C 260px 520px)',
        }}
      >
        {/* linee del campo */}
        <div style={{position: 'absolute', left: 300, right: 300, top: 300, bottom: 300, border: `8px solid ${line}`}} />
        <div style={{position: 'absolute', left: 300, right: 300, top: 2100, height: 8, background: line}} />
        <div style={{position: 'absolute', left: 1500 - 380, top: 2104 - 380, width: 760, height: 760, borderRadius: '50%', border: `8px solid ${line}`}} />
        <div style={{position: 'absolute', left: 1500 - 18, top: 2104 - 18, width: 36, height: 36, borderRadius: '50%', background: line}} />
        <div style={{position: 'absolute', left: 1500 - 900, top: 300, width: 1800, height: 700, border: `8px solid ${line}`, borderTop: 'none'}} />
        <div style={{position: 'absolute', left: 1500 - 900, bottom: 300, width: 1800, height: 700, border: `8px solid ${line}`, borderBottom: 'none'}} />
      </div>
    </AbsoluteFill>
  );
};

/** riflettori dello stadio: aloni in alto e coni di luce che scendono sul campo */
const Floodlights: React.FC<{g: number}> = ({g}) => {
  const on = easeOut(prog(g, 0, 0.5));
  const flick = 0.92 + 0.08 * Math.sin(g * 9.0) * Math.sin(g * 3.7);
  const spots = [
    {x: 120, y: 40},
    {x: 960, y: 70},
  ];
  return (
    <AbsoluteFill style={{opacity: on * flick, mixBlendMode: 'screen'}}>
      {spots.map((s, i) => (
        <React.Fragment key={i}>
          <div
            style={{
              position: 'absolute',
              left: s.x - 520,
              top: s.y - 520,
              width: 1040,
              height: 1040,
              background: 'radial-gradient(circle, rgba(220,235,255,0.55) 0%, rgba(120,170,255,0.18) 30%, transparent 62%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: s.x - 30,
              top: s.y,
              width: 60,
              height: 1900,
              transformOrigin: '50% 0%',
              transform: `rotate(${i === 0 ? -24 : 22}deg) scaleX(9)`,
              background: 'linear-gradient(180deg, rgba(190,215,255,0.20) 0%, rgba(190,215,255,0.04) 60%, transparent 100%)',
            }}
          />
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};

/** scie di luce diagonali (stile notte di Nations League) */
const BURSTS = [0.15, T.reveal, ...SCENES.slice(1).map((s) => s.a)];
const Streaks: React.FC<{g: number}> = ({g}) => (
  <AbsoluteFill style={{mixBlendMode: 'screen', overflow: 'hidden'}}>
    {Array.from({length: BURSTS.length * 4}, (_, i) => {
      const start = BURSTS[Math.floor(i / 4)] + (i % 4) * 0.09;
      const p = prog(g, start, start + 0.75);
      if (p <= 0 || p >= 1) return null;
      const y = 200 + random(`sy${i}`) * 1500;
      const len = 500 + random(`sl${i}`) * 700;
      const x = -len + easeInOut(p) * (W + len * 2);
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y - x * 0.08,
            width: len,
            height: 3 + random(`sw${i}`) * 4,
            transform: 'rotate(-4.2deg)',
            background: `linear-gradient(90deg, transparent, ${i % 2 ? C.cyan : C.silver}, transparent)`,
            boxShadow: `0 0 24px ${C.cyan}`,
            opacity: Math.sin(p * Math.PI),
          }}
        />
      );
    })}
  </AbsoluteFill>
);

const Background: React.FC<{g: number}> = ({g}) => (
  <AbsoluteFill style={{background: C.night}}>
    <Pitch g={g} />
    {/* clip delle squadre, se ci sono: coprono il campo animato nella loro scena */}
    {SCENES.map(({id, a, b}) => {
      const clips = CLIPS[id] ?? [];
      if (!clips.length) return null;
      const len = Math.ceil(((b - a) * FPS) / clips.length);
      return clips.map((c, i) => (
        <Sequence key={`${id}${i}`} from={Math.round(a * FPS) + i * len} durationInFrames={len}>
          <AbsoluteFill style={{transform: `scale(${1.08 + (g - a) * 0.01})`}}>
            <OffthreadVideo src={staticFile(c.src)} startFrom={Math.round((c.from ?? 0) * FPS)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </AbsoluteFill>
        </Sequence>
      ));
    })}
    {/* gradazione blu notte: tiene coerenti clip e grafica */}
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${C.night}E6 0%, ${C.navy}66 38%, ${C.navy}80 70%, ${C.night}EE 100%)`}} />
      <Floodlights g={g} />
  </AbsoluteFill>
);

// ───────────────────────── sfida ─────────────────────────

const PANEL_H = 640;
const SLANT = 80; // dislivello del taglio diagonale (≈ 4.2°)

/** fondo dei pannelli: la bandiera vera, a tutta larghezza, che sventola */
const BulgariaFill: React.FC<{g: number}> = ({g}) => <WavingFlag kind="bg" g={g} fw={1130} vw={W} vh={PANEL_H} ox={-25} oy={-19} amp={14} />;
const IcelandFill: React.FC<{g: number}> = ({g}) => <WavingFlag kind="is" g={g + 0.6} fw={1130} vw={W} vh={PANEL_H} ox={-25} oy={-200} amp={14} />;

const TeamPanel: React.FC<{g: number; side: 'top' | 'bottom'}> = ({g, side}) => {
  const top = side === 'top';
  const inP = easeOut(prog(g, T.panelsIn + (top ? 0 : 0.12), T.panelsIn + (top ? 0.6 : 0.72)));
  const outP = easeIn(prog(g, T.panelsOut, T.panelsOut + 0.45));
  const tx = (1 - inP) * (top ? -1 : 1) * (W + 200);
  const ty = outP * (top ? -1 : 1) * 1200;
  const y0 = top ? 300 : 300 + PANEL_H + 60;
  const clip = `polygon(0 ${SLANT}px, 100% 0, 100% ${PANEL_H - SLANT}px, 0 ${PANEL_H}px)`;
  const nameIn = easeOut(prog(g, T.panelsIn + 0.35 + (top ? 0 : 0.12), T.panelsIn + 0.85 + (top ? 0 : 0.12)));
  return (
    <div style={{position: 'absolute', left: 0, top: y0, width: W, height: PANEL_H, transform: `translate(${tx}px, ${ty}px)`}}>
      <div style={{position: 'absolute', inset: 0, clipPath: clip, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
        {top ? <BulgariaFill g={g} /> : <IcelandFill g={g} />}
        {/* ombra dal lato del nome, per leggerlo su qualsiasi colore */}
        <AbsoluteFill
          style={{
            background: top
              ? 'linear-gradient(90deg, rgba(4,8,30,0.78) 0%, rgba(4,8,30,0.45) 45%, rgba(4,8,30,0) 75%)'
              : 'linear-gradient(270deg, rgba(4,8,30,0.78) 0%, rgba(4,8,30,0.45) 45%, rgba(4,8,30,0) 75%)',
          }}
        />
        {/* bordo luminoso sul taglio */}
        <AbsoluteFill style={{boxShadow: `inset 0 0 0 4px ${C.silver}55`}} />
      </div>
      <div
        style={{
          position: 'absolute',
          [top ? 'left' : 'right']: 70,
          top: top ? 190 : 300,
          textAlign: top ? 'left' : 'right',
          transform: `translateX(${(1 - nameIn) * (top ? -140 : 140)}px)`,
          opacity: nameIn,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 16, flexDirection: top ? 'row' : 'row-reverse'}}>
          <WavingFlag kind={top ? 'bg' : 'is'} g={g * 1.2} fw={96} amp={3} strips={16} style={{boxShadow: '0 6px 18px rgba(0,0,0,0.5)'}} />
          <div style={{fontFamily: UI, fontWeight: 800, fontSize: 30, letterSpacing: 8, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.8)'}}>{top ? 'IN CASA' : 'OSPITI'}</div>
        </div>
        <div style={{fontFamily: DISPLAY, fontSize: 190, lineHeight: 1, color: '#fff', textShadow: '0 4px 0 rgba(0,0,0,0.35), 0 10px 40px rgba(0,0,0,0.8)'}}>{top ? 'BULGARIA' : 'ISLANDA'}</div>
      </div>
    </div>
  );
};

const VsBadge: React.FC<{g: number}> = ({g}) => {
  const p = prog(g, T.vs, T.vs + 0.35);
  if (p <= 0) return null;
  const out = easeIn(prog(g, T.panelsOut - 0.05, T.panelsOut + 0.3));
  const s = (2.6 - 1.6 * easeBack(p)) * (1 - out);
  return (
    <div
      style={{
        position: 'absolute',
        left: W / 2 - 115,
        top: 300 + PANEL_H + 30 - 115,
        width: 230,
        height: 230,
        transform: `scale(${s}) rotate(${-4.2 + (1 - p) * -25}deg)`,
        opacity: clamp(p * 3),
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 30%, #1A2A7A 0%, ${C.navy} 70%)`,
        border: `6px solid ${C.silver}`,
        boxShadow: `0 0 0 10px ${C.navy}, 0 0 70px ${C.cyan}AA`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: DISPLAY,
        fontSize: 120,
        color: '#fff',
        letterSpacing: 2,
      }}
    >
      VS
    </div>
  );
};

/** in alto: competizione e orario */
const Header: React.FC<{g: number}> = ({g}) => {
  const a = easeOut(prog(g, 0.1, 0.6));
  const d = easeOut(prog(g, T.date, T.date + 0.4));
  const out = easeIn(prog(g, T.reveal - 0.3, T.reveal));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center', opacity: 1 - out}}>
      <div style={{fontFamily: UI, fontWeight: 800, fontSize: 30, letterSpacing: 10, color: C.silver, opacity: a, transform: `translateY(${(1 - a) * -30}px)`}}>
        NATIONS LEAGUE · LEGA C
      </div>
      <div
        style={{
          display: 'inline-block',
          marginTop: 22,
          padding: '12px 34px',
          borderRadius: 999,
          background: `${C.cyan}22`,
          border: `2px solid ${C.cyan}`,
          fontFamily: UI,
          fontWeight: 700,
          fontSize: 34,
          letterSpacing: 4,
          color: '#fff',
          opacity: d,
          transform: `scale(${0.8 + 0.2 * easeBack(d)})`,
        }}
      >
        STASERA · ORE 20:45
      </div>
    </div>
  );
};

// ───────────────────────── frase gancio ─────────────────────────

const HOOK: {t: string; at: number; hi?: boolean}[][] = [
  [{t: 'UN', at: at('intro', 'un')}, {t: 'NOME', at: at('intro', 'nome')}],
  [{t: 'CHE', at: at('intro', 'che')}, {t: 'IN POCHI', at: at('intro', 'in'), hi: true}],
  [{t: 'STANNO', at: at('intro', 'stanno')}],
  [{t: 'GUARDANDO', at: at('intro', 'guardando')}],
];

const Hook: React.FC<{g: number}> = ({g}) => {
  const out = easeIn(prog(g, T.reveal - 0.15, T.reveal + 0.2));
  if (g < T.hook || out >= 1) return null;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + out * 0.4})`, opacity: 1 - out, filter: out > 0 ? `blur(${out * 12}px)` : undefined}}>
      <div style={{textAlign: 'center', transform: `translateY(-60px) scale(${1 + (g - T.hook) * 0.03})`}}>
        {HOOK.map((row, r) => (
          <div key={r} style={{display: 'flex', gap: 34, justifyContent: 'center'}}>
            {row.map((w) => {
              const p = prog(g, w.at - 0.06, w.at + 0.16);
              return (
                <span
                  key={w.t}
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: 170,
                    lineHeight: 1.08,
                    color: w.hi ? C.navy : '#fff',
                    background: w.hi ? C.cyan : undefined,
                    padding: w.hi ? '0 22px' : undefined,
                    transform: `translateY(${(1 - easeOut(p)) * 70}px) scale(${0.85 + 0.15 * easeBack(p)})`,
                    opacity: clamp(p * 2),
                    textShadow: w.hi ? undefined : '0 10px 40px rgba(0,0,0,0.6)',
                    boxShadow: w.hi ? `0 0 60px ${C.cyan}88` : undefined,
                  }}
                >
                  {w.t}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── presentazione del giocatore ─────────────────────────

const Reveal: React.FC<{g: number}> = ({g}) => {
  if (g < T.reveal - 0.05 || g > T.end) return null;
  const out = easeIn(prog(g, T.end - 0.35, T.end));
  const wipe = easeInOut(prog(g, T.reveal - 0.05, T.reveal + 0.4));
  const nine = 0.45 * easeOut(prog(g, T.reveal + 0.2, T.reveal + 1.0)) + 0.55 * easeOut(prog(g, T.nine, T.nine + 0.4));
  const nineHit = hit(g, T.nine + 0.1, 6);
  const first = easeOut(prog(g, T.reveal + 0.35, T.reveal + 0.7));
  const last = prog(g, T.name - 0.12, T.name + 0.3);
  const bar = easeOut(prog(g, T.name + 0.25, T.name + 0.6));
  const TAGS = [
    {t: 'ISLANDA', at: at('chi', "dell'islanda")},
    {t: 'ATTACCANTE', at: at('chi', 'attaccante')},
    {t: 'REAL SOCIEDAD', at: at('chi', 'real')},
  ];
  const push = 1 + Math.max(0, g - T.reveal) * 0.02;
  return (
    <AbsoluteFill style={{clipPath: `inset(${(1 - wipe) * 100}% 0 0 0)`, opacity: 1 - out, transform: `translateY(${-out * 140}px)`}}>
      {/* la bandiera islandese vera, grande, con l'incrocio della croce in alto a sinistra */}
      <AbsoluteFill style={{background: C.isBlue}}>
        <WavingFlag kind="is" g={g} fw={3600} vw={W} vh={H} ox={-860} oy={-620} amp={22} strips={60} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,12,45,0.05) 0%, rgba(0,12,45,0.2) 40%, rgba(0,12,45,0.72) 60%, rgba(0,12,45,0.82) 100%)'}} />
      {/* numero 9 gigante, solo contorno */}
      <div
        style={{
          position: 'absolute',
          right: -40,
          top: 160,
          fontFamily: DISPLAY,
          fontSize: 1250,
          lineHeight: 1,
          color: 'transparent',
          WebkitTextStroke: `${6 + nineHit * 6}px rgba(255,255,255,${0.4 * nine + nineHit * 0.3})`,
          transform: `translateY(${(1 - Math.min(1, nine * 2.2)) * 200}px) scale(${push + nineHit * 0.05})`,
        }}
      >
        9
      </div>
      <AbsoluteFill style={{background: 'radial-gradient(80% 50% at 50% 50%, transparent 40%, rgba(0,10,40,0.55) 100%)'}} />
      <div style={{position: 'absolute', left: 80, right: 60, top: 990, transform: `scale(${push})`, transformOrigin: '0 50%'}}>
        <div style={{fontFamily: UI, fontWeight: 800, fontSize: 34, letterSpacing: 10, color: C.cyan, opacity: first}}>IL NOME DA SEGUIRE</div>
        <div style={{fontFamily: DISPLAY, fontSize: 170, lineHeight: 1.05, color: '#fff', marginTop: 10, opacity: first, transform: `translateX(${(1 - first) * -120}px)`}}>ORRI</div>
        <div style={{display: 'flex', fontFamily: DISPLAY, fontSize: 196, lineHeight: 1, color: '#fff', textShadow: '0 14px 50px rgba(0,0,0,0.5)'}}>
          {'ÓSKARSSON'.split('').map((ch, i) => {
            const p = easeOut(clamp(last * 9 - i * 0.7));
            return (
              <span key={i} style={{display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 90}px)`}}>
                {ch}
              </span>
            );
          })}
        </div>
        <div style={{height: 14, width: 520, marginTop: 18, background: C.isRed, transformOrigin: '0 50%', transform: `scaleX(${bar})`}} />
        <div style={{display: 'flex', gap: 16, marginTop: 30}}>
          {TAGS.map(({t, at: ta}) => {
            const tp = easeOut(prog(g, ta - 0.08, ta + 0.25));
            return (
              <div key={t} style={{display: 'flex', alignItems: 'center', gap: 10, fontFamily: UI, fontWeight: 800, fontSize: 28, letterSpacing: 2, color: '#fff', padding: '10px 22px', border: '2px solid rgba(255,255,255,0.7)', borderRadius: 8, background: 'rgba(0,20,60,0.35)', opacity: tp, transform: `translateY(${(1 - tp) * 30}px) scale(${0.9 + 0.1 * easeBack(tp)})`}}>
                {t === 'REAL SOCIEDAD' && <Img src={staticFile('pronostico/logo/realsociedad.svg')} style={{height: 36}} />}
                {t}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── composizione ─────────────────────────

/** momenti forti: scossa e lampo */
const SLAMS = [at('andata', 'doppietta'), at('pron', 'segno')];

/** dopo l'intro resta in alto la "grafica TV" della partita */
const ScoreBug: React.FC<{g: number}> = ({g}) => {
  const p = easeOut(prog(g, T.end, T.end + 0.4));
  if (p <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 110, display: 'flex', justifyContent: 'center', opacity: p, transform: `translateY(${(1 - p) * -60}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '12px 26px', borderRadius: 999, background: 'rgba(6,10,34,0.78)', border: `2px solid ${C.silver}44`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)'}}>
        <FlagBG w={52} />
        <div style={{fontFamily: DISPLAY, fontSize: 40, color: '#fff', letterSpacing: 1}}>BUL</div>
        <div style={{fontFamily: UI, fontWeight: 800, fontSize: 24, color: C.cyan, letterSpacing: 3}}>VS</div>
        <div style={{fontFamily: DISPLAY, fontSize: 40, color: '#fff', letterSpacing: 1}}>ISL</div>
        <FlagIS w={52} />
        <div style={{width: 2, height: 34, background: `${C.silver}55`, margin: '0 4px'}} />
        <div style={{fontFamily: UI, fontWeight: 800, fontSize: 24, color: C.silver, letterSpacing: 4}}>NATIONS LEAGUE</div>
      </div>
    </div>
  );
};

export const Pronostico: React.FC = () => {
  const frame = useCurrentFrame();
  const g = frame / FPS;
  const slam = Math.max(hit(g, T.vs + 0.2, 9), ...SLAMS.map((t) => hit(g, t + 0.15, 9) * 0.8));
  const shake = slam * 14;
  const sx = (random(`kx${frame}`) - 0.5) * shake;
  const sy = (random(`ky${frame}`) - 0.5) * shake;
  const flash = Math.max(hit(g, T.vs + 0.22, 10) * 0.55, hit(g, T.reveal + 0.35, 8) * 0.35, ...SLAMS.map((t) => hit(g, t + 0.15, 10) * 0.3), ...SCENES.slice(1).map((s) => hit(g, s.a, 12) * 0.12));
  const fadeIn = 1 - prog(g, 0, 0.35);
  const fadeOut = prog(g, SCENES[SCENES.length - 1].b - 0.5, SCENES[SCENES.length - 1].b);
  // spinta lenta della camera, che riparte a ogni scena (senza accumularsi)
  const sceneStart = [...SCENES].reverse().find((sc) => g >= sc.a)?.a ?? 0;
  const push = 1 + Math.min(0.035, (g - sceneStart) * 0.006);
  const f2 = Math.floor(frame / 2);
  return (
    <AbsoluteFill style={{background: C.night, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${push})`}}>
        <Background g={g} />
        <Streaks g={g} />
        <TeamPanel g={g} side="top" />
        <TeamPanel g={g} side="bottom" />
        <VsBadge g={g} />
        <Hook g={g} />
        <Reveal g={g} />
        <Header g={g} />
        {/* scene un po' più in basso: centro ottico tra la grafica in alto e le scritte di TikTok in basso */}
        <AbsoluteFill style={{transform: 'translateY(80px)'}}>
          <Liga g={g} />
          <Nazionale g={g} />
          <Andata g={g} />
          <Lettura g={g} />
          <Pronostico5 g={g} />
          <Chiusura g={g} />
        </AbsoluteFill>
        <ScoreBug g={g} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#fff', opacity: flash, mixBlendMode: 'screen'}} />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('simba/grain.png')})`,
          backgroundPosition: `${Math.floor(random(`g${f2}`) * 512)}px ${Math.floor(random(`h${f2}`) * 512)}px`,
          mixBlendMode: 'overlay',
          opacity: 0.12,
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(100% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)'}} />
      <AbsoluteFill style={{background: '#000', opacity: Math.max(fadeIn, fadeOut * 0.85)}} />
      {VOICE.audio && (
        <Sequence from={Math.round(VOICE.offset * FPS)}>
          <Audio src={staticFile('pronostico/voce.mp3')} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, interpolate, random} from 'remotion';
import type {Caption} from '@remotion/captions';
import transcript from './transcript.json';
import {Backdrop} from '../lib/Backdrop';
import {Glass, Kicker} from '../lib/Glass';
import {ShieldIcon} from '../lib/Icons';
import {drift, easeOut, keys, pop, soft, tween} from '../lib/anim';
import {useScene} from '../lib/useScene';
import {C, FONT, FPS} from '../lib/theme';
import {ThreeCanvas} from '@remotion/three';
import {Cap3D, Pen3D, Studio, Trachea3D} from './three';

export const captions = transcript as Caption[];
const norm = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');
/** secondo d'inizio della parola (prima occorrenza dopo `after`) */
export const at = (word: string, after = 0) => {
  const c = captions.find((c) => c.startMs / 1000 >= after - 0.05 && norm(c.text) === norm(word));
  if (!c) throw new Error(`Parola non trovata: ${word} dopo ${after}`);
  return c.startMs / 1000;
};

/** Tela 3D a tutto schermo, sfondo trasparente (si vede il Backdrop sotto) */
const Stage3D: React.FC<{children: React.ReactNode; z?: number; fov?: number; y?: number}> = ({children, z = 12, fov = 30, y = 0}) => (
  <AbsoluteFill>
    <ThreeCanvas width={1080} height={1920} camera={{position: [0, y, z], fov}} gl={{antialias: true, alpha: true}}>
      <Studio />
      {children}
    </ThreeCanvas>
  </AbsoluteFill>
);

const Title: React.FC<{text: React.ReactNode; p: number; top: number; size?: number; color?: string}> = ({text, p, top, size = 120, color = C.ink}) => (
  <div style={{position: 'absolute', top, width: '100%', textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: -size * 0.04, color, opacity: p, transform: `translateY(${(1 - p) * 40}px)`}}>{text}</div>
);

// ── 1 · "Perché il tappo della penna ha un buco in cima?" ──
export const T1Hook: React.FC = () => {
  const {f, T} = useScene(0);
  const tBuco = T(at('buco'));
  const tCima = T(at('cima?'));
  const spin = f * 0.025 + 0.6;
  // su "cima" il tappo si inclina verso la camera e il buco riempie l'inquadratura
  const tilt = keys(f, [0, tBuco, tCima + 30], [0.15, 0.25, 1.15], easeOut);
  const sc = keys(f, [0, tBuco, tCima + 40], [0.55, 0.66, 2.2], easeOut);
  const py = keys(f, [0, tBuco, tCima + 40], [0.9, 1.0, -2.2], easeOut);
  const kick = soft(f, 6);
  const q = pop(f, tCima);
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center', opacity: kick}}>
        <Kicker>Lo sapevi?</Kicker>
      </div>
      <Stage3D>
        <Cap3D position={[0, py, 0]} rotation={[tilt, spin, 0.12 + drift(f, 0.5, 0.05)]} scale={sc} holeGlow={tween(f, [tBuco - 5, tBuco + 20], [0, 1])} />
      </Stage3D>
      <div style={{position: 'absolute', right: 110, top: 300, fontFamily: FONT, fontWeight: 900, fontSize: 260, color: C.accent, opacity: Math.min(1, q * 1.3), transform: `scale(${q}) rotate(${(1 - q) * 25}deg)`}}>?</div>
    </AbsoluteFill>
  );
};

// ── 2 · "Pensaci… mordicchiato, perso, ritrovato… ma quel buchino…" ──
const START2 = 2.8;
export const T2Life: React.FC = () => {
  const {f, T} = useScene(START2);
  const tBimbo = T(at('bambino,'));
  const tMord = T(at('mordicchiato,'));
  const tPerso = T(at('perso,'));
  const tRitr = T(at('ritrovato,'));
  const tBuchino = T(at('buchino'));
  const tServe = T(at('serve?'));
  const bite = tween(f, [tMord, tMord + 20], [0, 1]);
  const chomp = f > tMord && f < tMord + 30 ? Math.abs(Math.sin((f - tMord) / 5)) * 0.08 : 0;
  const lost = tween(f, [tPerso, tPerso + 26], [0, 1], easeOut) * (1 - tween(f, [tRitr - 4, tRitr + 26], [0, 1], easeOut));
  const toTop = tween(f, [tBuchino - 10, tServe + 20], [0, 1], easeOut);
  const big = 0.55 * (1 + toTop * 2.4);
  const chips = [
    {t: tBimbo, label: 'da sempre', x: 90, y: 330},
    {t: tMord, label: 'Mordicchiato', x: 600, y: 470},
    {t: tPerso, label: 'Perso', x: 120, y: 760},
    {t: tRitr, label: 'Ritrovato', x: 610, y: 900},
  ];
  return (
    <AbsoluteFill>
      <Backdrop />
      <Stage3D>
        <Cap3D
          position={[lost * 5, 0.9 + lost * 4 - toTop * 2.6, 0]}
          rotation={[0.2 + toTop * 1.0, f * 0.02 + lost * 9, 0.15 + lost * 3]}
          scale={[(1 + chomp) * big, (1 - chomp) * big, (1 + chomp) * big]}
          bites={bite}
          holeGlow={tween(f, [tBuchino - 4, tBuchino + 16], [0, 1])}
        />
      </Stage3D>
      {chips.map((c, i) => {
        const p = pop(f, c.t - 4);
        if (f < c.t - 6) return null;
        const out = tween(f, [tBuchino - 10, tBuchino + 10], [0, 1]);
        return (
          <div key={i} style={{position: 'absolute', left: c.x, top: c.y, opacity: Math.min(1, p) * (1 - out), transform: `scale(${0.6 + p * 0.4}) rotate(${(i % 2 ? 4 : -4) + drift(f, 0.9, 2, i)}deg)`}}>
            <Glass style={{padding: '22px 36px', fontFamily: FONT, fontSize: 52, fontWeight: 800, letterSpacing: -1}}>{c.label}</Glass>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ── 3 · "No, non è per far asciugare l'inchiostro. E non è un errore di fabbrica" ──
const START3 = 12.2;
const Strike: React.FC<{f: number; tIn: number; tStrike: number; y: number; rot: number; text: string}> = ({f, tIn, tStrike, y, rot, text}) => {
  const p = soft(f, tIn - 6, 16);
  const s = tween(f, [tStrike, tStrike + 16], [0, 1], easeOut);
  const x = pop(f, tStrike + 8);
  return (
    <div style={{position: 'absolute', top: y, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: p, transform: `perspective(1500px) rotateX(${(1 - p) * -80}deg) rotateY(${rot + drift(f, 0.7, 4)}deg)`}}>
      <Glass radius={44} style={{padding: '30px 50px', display: 'flex', alignItems: 'center', gap: 26, fontFamily: FONT}}>
        <span style={{fontSize: 70, fontWeight: 800, letterSpacing: -2, color: s > 0.5 ? C.gray : C.ink, position: 'relative'}}>
          {text}
          <span style={{position: 'absolute', left: -8, right: -8, top: '52%', height: 9, borderRadius: 5, background: C.accent, transformOrigin: 'left', transform: `scaleX(${s})`}} />
        </span>
        <span style={{width: 76, height: 76, borderRadius: 38, background: C.ink, color: '#fff', fontSize: 46, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${x})`}}>✕</span>
      </Glass>
    </div>
  );
};
export const T3No: React.FC = () => {
  const {f, T} = useScene(START3);
  const no = pop(f, T(at('No,')) - 4);
  return (
    <AbsoluteFill>
      <Backdrop tint={1.4} />
      <div style={{position: 'absolute', width: '100%', top: 300, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 220, letterSpacing: -8, color: C.ink, transform: `scale(${no})`}}>
        No<span style={{color: C.accent}}>.</span>
      </div>
      <Strike f={f} tIn={T(at('asciugare'))} tStrike={T(at("l'inchiostro."))} y={620} rot={-5} text="Fa asciugare l'inchiostro" />
      <Strike f={f} tIn={T(at('errore'))} tStrike={T(at('fabbrica,'))} y={860} rot={5} text="Errore di fabbrica" />
    </AbsoluteFill>
  );
};

// ── 4 · "Perché ogni anno, in tutto il mondo, qualcuno ingoia… soprattutto i bambini… compiti" ──
const START4 = 17.1;
export const T4World: React.FC = () => {
  const {f, T} = useScene(START4);
  const tAnno = T(at('anno,'));
  const tMondo = T(at('mondo,'));
  const tIngoia = T(at('ingoia'));
  const tBambini = T(at('bambini,'));
  const tCompiti = T(at('compiti.'));
  const globe = soft(f, tMondo - 10) * (1 - tween(f, [tIngoia + 30, tIngoia + 50], [0, 1]));
  const R = 330;
  const dots: React.ReactNode[] = [];
  for (let lat = -75; lat <= 75; lat += 12) {
    const phi = (lat * Math.PI) / 180;
    const n = Math.max(5, Math.round(30 * Math.cos(phi)));
    for (let k = 0; k < n; k++) {
      const lon = (k / n) * Math.PI * 2 + f * 0.01;
      if (Math.cos(lon) < 0) continue;
      const land = Math.sin(lon * 3 + phi * 2) + Math.cos(lon * 2 - phi * 3) > 0.5;
      dots.push(<circle key={`${lat}-${k}`} cx={Math.sin(lon) * Math.cos(phi) * R} cy={-Math.sin(phi) * R} r={land ? 7 : 4} fill={land ? C.accent : C.line} opacity={0.4 + Math.cos(lon) * 0.6} />);
    }
  }
  const rainOn = tween(f, [tBambini - 10, tBambini + 10], [1, 0]);
  const rain = f > tIngoia - 5 && rainOn > 0.01 && (
    <Stage3D z={16}>
      {Array.from({length: 12}, (_, i) => {
        const k = (f - tIngoia - i * 4) / 80;
        if (k < 0) return null;
        const x = (random(`rx${i}`) - 0.5) * 7;
        return <Cap3D key={i} position={[x, 9 - k * 20, (random(`rz${i}`) - 0.5) * 4]} rotation={[random(`a${i}`) * 6 + k * 4, random(`b${i}`) * 6 + k * 3, random(`c${i}`) * 6]} scale={0.45 * rainOn} />;
      })}
    </Stage3D>
  );
  const kid = soft(f, tBambini - 6);
  const year = pop(f, tAnno - 4);
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{position: 'absolute', top: 160, width: '100%', display: 'flex', justifyContent: 'center', opacity: Math.min(1, year), transform: `scale(${0.7 + Math.min(1, year) * 0.3})`}}>
        <Kicker>Ogni anno · ovunque</Kicker>
      </div>
      {globe > 0.01 && (
        <div style={{position: 'absolute', left: 540 - R, top: 680 - R, opacity: globe, transform: `scale(${0.7 + globe * 0.3})`}}>
          <svg width={R * 2} height={R * 2} viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`}>
            <circle r={R} fill="#fff" opacity={0.7} />
            {dots}
          </svg>
        </div>
      )}
      {rain}
      {/* bambino che fa i compiti: quaderno + matita + tappo in bocca (icone) */}
      {f > tBambini - 8 && (
        <>
        <div style={{position: 'absolute', left: 0, right: 0, top: 420, display: 'flex', justifyContent: 'center', opacity: kid, transform: `translateY(${(1 - kid) * 80}px) rotate(${drift(f, 0.6, 2)}deg)`}}>
          <Glass radius={56} style={{width: 760, height: 620, position: 'relative', overflow: 'hidden'}}>
            {/* quaderno a righe */}
            <div style={{position: 'absolute', left: 60, top: 60, width: 420, height: 500, borderRadius: 24, background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', transform: 'rotate(-4deg)'}}>
              {Array.from({length: 11}, (_, i) => (
                <div key={i} style={{position: 'absolute', left: 30, right: 30, top: 60 + i * 40, height: 3, background: '#D7E4FF'}} />
              ))}
              <div style={{position: 'absolute', left: 30, top: 60, width: Math.min(360, tween(f, [tCompiti - 20, tCompiti + 40], [0, 360])), height: 6, background: C.ink, borderRadius: 3, transform: 'translateY(-16px)'}} />
            </div>
            {/* matita stilizzata */}
            <div style={{position: 'absolute', left: 330, top: 150, width: 28, height: 360, borderRadius: 14, background: 'linear-gradient(90deg, #F4C430, #FFD95A, #E0A800)', transform: 'rotate(28deg)', boxShadow: '0 10px 20px rgba(0,0,0,0.15)'}} />
          </Glass>
        </div>
        <div style={{position: 'absolute', inset: 0, opacity: kid}}>
          <Stage3D>
            <Cap3D position={[0.95, 1.1, 1]} rotation={[0.3, f * 0.02, -0.5 + drift(f, 1.2, 0.1)]} scale={0.38} bites={1} />
          </Stage3D>
        </div>
        </>
      )}
    </AbsoluteFill>
  );
};

// ── 5 · "Ed ecco il trucco." ──
const START5 = 25.85;
export const T5Trick: React.FC = () => {
  const {f, T} = useScene(START5);
  const tT = T(at('trucco.'));
  const letters = 'Il trucco'.split('');
  const sweep = tween(f, [tT - 10, tT + 40], [-40, 140]);
  return (
    <AbsoluteFill style={{background: '#0A0A0B', fontFamily: FONT, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `radial-gradient(60% 40% at 50% 38%, ${C.accent}44 0%, transparent 70%)`, opacity: soft(f, 0, 20)}} />
      <div style={{position: 'absolute', top: 560, width: '100%', textAlign: 'center', fontSize: 190, fontWeight: 900, letterSpacing: -7, transform: `scale(${1 + f * 0.0015})`}}>
        {letters.map((ch, i) => {
          const p = soft(f, tT - 30 + i * 2.5, 15);
          return (
            <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: p, transform: `rotateY(${(1 - p) * 90}deg) translateY(${(1 - p) * 60}px)`, backgroundImage: `linear-gradient(100deg, #fff 0%, #fff ${sweep - 20}%, ${C.accent} ${sweep}%, #fff ${sweep + 20}%, #fff 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
              {ch}
            </span>
          );
        })}
        <span style={{color: C.accent, opacity: soft(f, tT + 10)}}>.</span>
      </div>
    </AbsoluteFill>
  );
};

// ── 6 · "Se il tappo si blocca in gola, quel buco lascia passare l'aria… respirare… ospedale" ──
const START6 = 27.2;
export const T6Airway: React.FC = () => {
  const {f, T} = useScene(START6);
  const tBlocca = T(at('blocca'));
  const tAria = T(at("l'aria."));
  const tPassare = T(at('passare'));
  const tRespirare = T(at('respirare'));
  const tOspedale = T(at('ospedale.'));
  const capY = tween(f, [0, tBlocca + 14], [0, 1], easeOut);
  const shake = f > tBlocca + 10 && f < tBlocca + 30 ? Math.sin(f * 2) * 0.05 : 0;
  const flow = tween(f, [tPassare - 6, tAria + 10], [0, 1]);
  // camera: vista intera → zoom sulla cima del tappo dove esce l'aria → di nuovo larga
  const sc = keys(f, [0, tBlocca + 20, tAria + 30, tOspedale], [0.3, 0.33, 0.6, 0.33]);
  const py = keys(f, [0, tBlocca + 20, tAria + 30, tOspedale], [0.1, 0.1, -1.4, 0.1]);
  const ok = pop(f, tRespirare);
  const hosp = soft(f, tOspedale - 6);
  const ekg = (() => {
    let d = 'M 0 60';
    for (let x = 0; x <= 600; x += 10) {
      const ph = ((x + f * 6) % 200) / 200;
      const yy = ph > 0.45 && ph < 0.5 ? 10 : ph > 0.5 && ph < 0.55 ? 100 : ph > 0.55 && ph < 0.6 ? 40 : 60;
      d += ` L ${x} ${yy}`;
    }
    return d;
  })();
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <Kicker>{f < tPassare ? 'Tappo bloccato in gola' : 'L’aria passa dal buco'}</Kicker>
      </div>
      <AbsoluteFill style={{opacity: 1 - hosp}}>
        <Stage3D z={14}>
          <Trachea3D capY={capY} flow={flow} t={f / FPS} position={[shake, py, 0]} rotation={[0.18, 0.5 + f * 0.003, 0]} scale={sc} />
        </Stage3D>
      </AbsoluteFill>
      {flow > 0.05 && (
        <div style={{position: 'absolute', right: 70, top: 520, opacity: flow * (1 - hosp)}}>
          <Glass style={{padding: '18px 28px', fontFamily: FONT, fontSize: 40, fontWeight: 800, color: C.accent}}>↑ aria</Glass>
        </div>
      )}
      {f > tRespirare - 4 && (
        <div style={{position: 'absolute', left: 70, top: 640, opacity: Math.min(1, ok) * (1 - hosp), transform: `scale(${0.6 + Math.min(1, ok) * 0.4})`}}>
          <Glass style={{padding: '18px 28px', fontFamily: FONT, fontSize: 40, fontWeight: 800}}>Respira ✓</Glass>
        </div>
      )}
      {hosp > 0.01 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 520, display: 'flex', justifyContent: 'center', opacity: hosp, transform: `scale(${0.85 + hosp * 0.15})`}}>
          <Glass radius={56} style={{width: 760, padding: '40px 40px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
            <div style={{width: 110, height: 110, borderRadius: 28, background: C.accent, position: 'relative'}}>
              <div style={{position: 'absolute', left: 42, top: 18, width: 26, height: 74, background: '#fff', borderRadius: 6}} />
              <div style={{position: 'absolute', left: 18, top: 42, width: 74, height: 26, background: '#fff', borderRadius: 6}} />
            </div>
            <svg width={600} height={120} viewBox="0 0 600 120">
              <path d={ekg} stroke={C.accent} strokeWidth={6} fill="none" strokeLinejoin="round" />
            </svg>
            <div style={{fontFamily: FONT, fontSize: 46, fontWeight: 800}}>Il tempo di arrivare in ospedale</div>
          </Glass>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ── 7 · "Esiste addirittura una norma internazionale…" ──
const START7 = 34.65;
export const T7Norm: React.FC = () => {
  const {f, T} = useScene(START7);
  const tNorma = T(at('norma'));
  const tFatti = T(at('fatti'));
  const tQuesto = T(at('questo.'));
  const card = soft(f, tNorma - 12);
  const rows = ['Buco di ventilazione', 'Passaggio d’aria minimo', 'Testata sui tappi'];
  return (
    <AbsoluteFill>
      <Backdrop tint={1.3} />
      <AbsoluteFill style={{perspective: 1600}}>
        <div style={{position: 'absolute', left: 120, top: 300, width: 840, transform: `rotateX(${(1 - card) * 60 + drift(f, 0.5, 3)}deg) rotateY(${drift(f, 0.4, 6)}deg) translateY(${(1 - card) * 200}px)`, opacity: card}}>
          <Glass radius={56} style={{padding: '50px 54px', fontFamily: FONT}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
              <div style={{width: 120, height: 120, borderRadius: 32, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <ShieldIcon size={86} color="#fff" stroke={7} />
              </div>
              <div>
                <div style={{fontSize: 30, fontWeight: 700, letterSpacing: 4, color: C.accent, textTransform: 'uppercase'}}>Norma internazionale</div>
                <div style={{fontSize: 64, fontWeight: 900, letterSpacing: -2}}>ISO 11540</div>
              </div>
            </div>
            <div style={{height: 2, background: C.line, margin: '34px 0'}} />
            {rows.map((r, i) => {
              const p = pop(f, tFatti - 10 + i * 12);
              return (
                <div key={i} style={{display: 'flex', alignItems: 'center', gap: 22, margin: '18px 0', opacity: Math.min(1, p), transform: `translateX(${(1 - Math.min(1, p)) * -60}px)`}}>
                  <div style={{width: 54, height: 54, borderRadius: 27, background: C.accent, color: '#fff', fontSize: 34, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${p})`}}>✓</div>
                  <div style={{fontSize: 46, fontWeight: 700, letterSpacing: -1}}>{r}</div>
                </div>
              );
            })}
          </Glass>
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, pop(f, tQuesto - 4))}}>
        <Stage3D>
          <Cap3D position={[1.4, -1.5, 0]} rotation={[0.3, f * 0.03, 0.35]} scale={0.38} holeGlow={0.8} />
        </Stage3D>
      </div>
    </AbsoluteFill>
  );
};

// ── 8 · "E non è finita. Anche la penna ha un buchino sul fianco… l'inchiostro scende sempre uguale" ──
const START8 = 40.9;
export const T8Pen: React.FC = () => {
  const {f, T} = useScene(START8);
  const tFinita = T(at('finita.'));
  const tBuchino = T(at('buchino', 42));
  const tEntrare = T(at('entrare'));
  const tScende = T(at('scende'));
  const penIn = soft(f, tFinita + 6);
  const glow = tween(f, [tBuchino, tBuchino + 20], [0, 1]);
  const air = tween(f, [tEntrare - 10, tEntrare + 10], [0, 1]);
  const ink = keys(f, [tScende - 20, tScende + 140], [0.85, 0.5]);
  const sc = keys(f, [0, tBuchino + 10, tEntrare + 40, tScende + 80], [0.42, 0.85, 0.85, 0.45], easeOut);
  const px = keys(f, [0, tBuchino + 10, tEntrare + 40, tScende + 80], [0, -0.3, -0.3, 0], easeOut);
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{position: 'absolute', top: 160, width: '100%', textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 96, letterSpacing: -3, color: C.ink, opacity: soft(f, tFinita - 30) * (1 - tween(f, [tBuchino - 10, tBuchino + 5], [0, 1]))}}>
        E non è finita<span style={{color: C.accent}}>.</span>
      </div>
      <AbsoluteFill style={{opacity: penIn}}>
        <Stage3D z={14}>
          <Pen3D position={[px * sc, 0.6, 0]} rotation={[0.3 + drift(f, 0.4, 0.05), -0.3 + drift(f, 0.3, 0.08), 1.05]} scale={sc * (0.85 + penIn * 0.15)} inkLevel={ink} air={air} t={f / FPS} holeGlow={glow} />
        </Stage3D>
      </AbsoluteFill>
      {f > tBuchino && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1060, display: 'flex', justifyContent: 'center', gap: 24, opacity: soft(f, tBuchino + 6)}}>
          <Glass style={{padding: '18px 28px', fontFamily: FONT, fontSize: 40, fontWeight: 800, color: C.accent, opacity: air}}>aria dentro ↓</Glass>
          <Glass style={{padding: '18px 28px', fontFamily: FONT, fontSize: 40, fontWeight: 800, opacity: tween(f, [tScende - 10, tScende + 10], [0, 1])}}>inchiostro costante</Glass>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ── 9 · "Quindi la prossima volta che lo mordicchi, sappi che quel buco può salvare una vita." ──
const START9 = 48.55;
export const T9Outro: React.FC = () => {
  const {f, T} = useScene(START9);
  const tMord = T(at('mordicchi,'));
  const tBuco = T(at('buco', 51));
  const tVita = T(at('vita.'));
  const z = keys(f, [0, tBuco, tVita + 40], [0.8, 1.0, 0.75], easeOut);
  const t1 = soft(f, tBuco - 6);
  const t2 = pop(f, tVita - 4);
  return (
    <AbsoluteFill>
      <Backdrop />
      <Stage3D>
        <Cap3D position={[0, 1.6, 0]} rotation={[0.25, f * 0.025, 0.1 + drift(f, 0.5, 0.06)]} scale={z * 0.48} bites={tween(f, [tMord, tMord + 20], [0, 1])} holeGlow={tween(f, [tBuco - 5, tBuco + 15], [0, 1])} />
      </Stage3D>
      <Title text={<>Può salvare</>} p={t1} top={880} size={120} />
      <Title text={<span style={{color: C.accent}}>una vita.</span>} p={Math.min(1, t2)} top={1010} size={140} />
      <div style={{position: 'absolute', top: 1190, width: '100%', textAlign: 'center', fontFamily: FONT, fontSize: 36, fontWeight: 600, color: C.gray, letterSpacing: 4, opacity: tween(f, [tVita + 40, tVita + 70], [0, 1])}}>
        FATTO APPOSTA.
      </div>
    </AbsoluteFill>
  );
};


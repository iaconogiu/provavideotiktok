import '@fontsource/anton';
import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Sequence, random, staticFile, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {Dust, FPS, Figure, Floor, Glow, HOTRED, Lamp, Maze, Rig, Stage, Star, ease, easeOut, lerp3, makeMaze, pathAt, prog} from './kit';
import {Africa, Compass, Corridor, Question, Rings} from './objects';

/**
 * "Dall'angolo": stesso linguaggio di One of One (3D rosso/nero/oro, bagliore, testo
 * bianco graffiato al centro) con oggetti nuovi legati al senso di questo testo.
 */

export const DURATION = 20.63;
export const ANGOLO_FRAMES = Math.round(DURATION * FPS);

type Kind = 'solid' | 'outline' | 'ghost';
// [testo, inizio in secondi, stile]: tempi da Whisper, ritoccati sugli attacchi della voce
const TOKENS: [string, number, Kind][] = [
  ['EH', 0.4, 'solid'],
  ['EH OH', 0.95, 'solid'],
  ["DALL'ANGOLO", 2.12, 'outline'],
  ['CI SCAPPI', 3.1, 'solid'],
  ['SOLO SE', 4.02, 'ghost'],
  ['SOGNI', 4.58, 'solid'],
  ['QUALCOSA', 5.04, 'solid'],
  ['EH', 5.62, 'solid'],
  ['EH OH', 6.06, 'solid'],
  ['ANCHE SE', 7.28, 'ghost'],
  ['PER ADESSO', 8.02, 'outline'],
  ['NON SAI', 8.84, 'solid'],
  ['BENE COSA', 9.32, 'solid'],
  ['E BOH', 10.2, 'solid'],
  ['IL COGNOME', 12.08, 'solid'],
  ['DI MAMMA', 12.75, 'ghost'],
  ['E PÀ', 13.25, 'solid'],
  ['VIENE', 14.22, 'ghost'],
  ["DALL'AFRICA", 14.42, 'solid'],
  ['E CHE', 15.18, 'ghost'],
  ['SENSO HA?', 15.5, 'solid'],
  ['ODDIO', 17.4, 'solid'],
  ['NON SEMPRE', 18.26, 'solid'],
  ['LO SI', 19.22, 'ghost'],
  ['TROVA', 19.96, 'solid'],
];

type SP = {start: number};
const useT = (start: number) => (t: number) => Math.round((t - start) * FPS);

// ── 1 · "eh oh": un lampione si accende a scatti nel buio ──
const S1: React.FC<SP> = ({start}) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const a = T(0.4);
  const b = T(0.95);
  let on = 0;
  if (f >= a) on = [1, 1, 0, 0, 1, 0.2, 1][Math.min(6, Math.floor((f - a) / 3))] * 0.75;
  if (f >= b) on = 1.15 - Math.min(0.15, (f - b) * 0.01);
  const k = ease(prog(f, 0, T(2.12)));
  return (
    <Stage near={5} far={20}>
      <Rig pos={lerp3([0.2, 1.1, 9.5], [0, 2.3, 6.2], k)} look={[0, 2.3, 0]} />
      <Floor />
      <Lamp on={on} position={[-0.9, 0, 0]} />
      <pointLight position={[-4, 3, -3]} intensity={on * 30} color={HOTRED} distance={12} />
      <Dust n={120} center={[0, 2.5, 0]} box={[8, 5, 6]} seed="s1" />
    </Stage>
  );
};

// ── 2 · "dall'angolo ci scappi": labirinto, la figurina corre fuori ──
const MAZE = makeMaze(9, 'angolo');
const S2: React.FC<SP> = ({start}) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const out = T(3.4);
  const p = ease(prog(f, 0, out + 10));
  const [x, z, ang] = pathAt(MAZE, p);
  const burst = f >= out ? Math.exp(-(f - out) / 10) : 0;
  return (
    <Stage near={8} far={30}>
      <Rig pos={[x * 0.4 + 1, 12.5 - p * 2, z * 0.4 + 8 - p * 2]} look={[x * 0.6, 0, z * 0.6]} />
      <Floor color="#0c0202" />
      <Maze maze={MAZE} />
      <group position={[x, 0, z]} rotation={[0, ang, 0]}>
        <Figure scale={0.5} walk={f * 0.45} glow={3.5} />
        <pointLight position={[0, 1, 0]} intensity={8 + burst * 60} distance={5} color="#FFE7CF" />
      </group>
      <ambientLight intensity={0.15} color="#ff4030" />
      <directionalLight position={[5, 10, 4]} intensity={0.6} color="#ff8060" />
    </Stage>
  );
};

// ── 3 · "solo se sogni qualcosa": la figura e una stella d'oro sopra di lei ──
const S3: React.FC<SP> = ({start}) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const k = ease(prog(f, 0, T(5.62)));
  const beam = easeOut(prog(f, T(5.04), T(5.04) + 18));
  const dream = prog(f, T(4.58), T(4.58) + 20);
  return (
    <Stage near={6} far={24}>
      <Rig pos={lerp3([0, 1.3, 7.5], [0.3, 0.9, 8.5], k)} look={lerp3([0, 1.6, 0], [0, 3.7, 0], k)} />
      <Floor />
      <Figure glow={2.6} rotation={[0, 0.25, 0]} />
      <Star position={[0, 5.4, -0.8]} rotation={[0.2, f * 0.03, 0]} scale={0.8} glow={0.4 + beam * 0.8} />
      <pointLight position={[0, 5.4, 0]} intensity={12 + beam * 25} distance={12} color="#FFB060" />
      <spotLight position={[0, 8, 3]} angle={0.4} penumbra={0.8} intensity={40} color="#FF3A2A" />
      {beam > 0 && (
        <mesh position={[0, 3.4, -0.4]}>
          <cylinderGeometry args={[0.25 * beam + 0.05, 0.6 * beam + 0.05, 4, 32, 1, true]} />
          <meshBasicMaterial color="#FFB060" transparent opacity={0.1 * beam} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
      <Dust n={Math.round(60 + dream * 140)} center={[0, 3.5, -0.5]} box={[5, 6, 4]} seed="s3" />
    </Stage>
  );
};

// ── 4 · "eh oh": una fila di lampioni che si accendono a tempo ──
const S4: React.FC<SP> = ({start}) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const k = ease(prog(f, 0, T(7.28)));
  const times = [5.62, 5.62, 6.06, 6.06, 6.4, 6.72].map(T);
  return (
    <Stage near={6} far={28}>
      <Rig pos={lerp3([-7, 2.6, 6.5], [5, 2.4, 5.5], k)} look={lerp3([-4, 2.2, -1.5], [8, 2.2, -1.5], k)} />
      <Floor />
      {times.map((t, i) => {
        const on = f >= t ? Math.min(1, 0.4 + (f - t) * 0.12) : 0;
        return <Lamp key={i} on={on} position={[-7 + i * 3.6, 0, -1.5]} />;
      })}
      <Dust n={140} center={[0, 2.5, -1]} box={[24, 5, 6]} seed="s4" />
    </Stage>
  );
};

// ── 5 · "anche se per adesso non sai bene cosa": corridoio di porte chiuse ──
const S5: React.FC<SP> = ({start}) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const k = prog(f, 0, T(10.2));
  const z = 4 - k * 24;
  return (
    <Stage near={4} far={34} bloom={1.2}>
      <Rig pos={[Math.sin(f * 0.01) * 0.3, 2.2, z]} look={[0, 2.1, z - 10]} />
      <Corridor len={44} open={k} />
      <ambientLight intensity={0.12} color="#ff3020" />
      <pointLight position={[0, 4, z - 2]} intensity={14} distance={10} color="#FF9A6A" />
      <Dust n={100} center={[0, 2.5, z - 6]} box={[5, 4, 14]} seed="s5" />
    </Stage>
  );
};

// ── 6 · "e boh": un punto interrogativo d'oro che alza le spalle ──
const S6: React.FC<SP> = ({start}) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const boh = T(10.35);
  const shrug = f >= boh ? Math.sin((f - boh) * 0.25) * 0.35 * Math.exp(-(f - boh) / 40) : 0;
  const lift = f >= boh ? Math.sin(Math.min(Math.PI, (f - boh) * 0.18)) * 0.35 : 0;
  return (
    <Stage near={5} far={22}>
      <Rig pos={[Math.sin(f * 0.012) * 1.5, 2.2, 9 - prog(f, 0, T(12.08)) * 1.2]} look={[0, 2.1, 0]} />
      <Floor />
      <Question position={[0, 2.5 + lift, 0]} rotation={[0, f * 0.025, shrug]} scale={1.0} />
      <spotLight position={[3, 7, 4]} angle={0.5} penumbra={0.7} intensity={28} color="#FFC890" />
      <pointLight position={[-3, 2, -3]} intensity={40} distance={12} color={HOTRED} />
      <Dust n={160} center={[0, 2.5, 0]} box={[10, 6, 6]} seed="s6" />
    </Stage>
  );
};

// ── 7 · "il cognome di mamma e pà": due anelli intrecciati ──
const S7: React.FC<SP> = ({start}) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const k = ease(prog(f, 0, T(14.22)));
  return (
    <Stage fog="#1a0202" near={6} far={26}>
      <Rig pos={lerp3([0, 2.4, 8], [0.6, 2.2, 5.6], k)} look={[0, 2.1, 0]} />
      <Rings spin={f * 0.02} position={[0, 2.1, 0]} />
      <spotLight position={[2, 6, 5]} angle={0.5} penumbra={0.7} intensity={32} color="#FFD0A0" />
      <pointLight position={[0, 1, -3]} intensity={50} distance={12} color={HOTRED} />
      <Dust n={220} center={[0, 2.2, 0]} box={[12, 7, 8]} seed="s7" />
    </Stage>
  );
};

// ── 8 · "viene dall'Africa": il continente d'oro e una scia che parte ──
const S8: React.FC<SP> = ({start}) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const k = ease(prog(f, 0, T(15.18)));
  const trail = prog(f, T(14.42), T(15.18));
  const dots = useMemo(() => {
    const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0.1, 2.8, 0.4), new THREE.Vector3(0.6, 4.6, 2.2), new THREE.Vector3(-1.2, 5.8, 4.2));
    return c.getPoints(24);
  }, []);
  return (
    <Stage fog="#0f0101" near={6} far={24}>
      <Rig pos={lerp3([0, 1.8, 13], [0.8, 2.4, 11], k)} look={[0, 2.4, 0]} />
      <Africa position={[0, 2.2, 0]} rotation={[-0.15, -0.55 + k * 0.6, 0]} scale={0.75} glow={0.04} />
      {dots.slice(0, Math.floor(trail * dots.length)).map((p, i) => (
        <mesh key={i} position={[p.x, p.y - 0.4, p.z]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <Glow color="#FFC56B" k={4} />
        </mesh>
      ))}
      <spotLight position={[3, 6, 6]} angle={0.5} penumbra={0.6} intensity={26} color="#FFD8A8" />
      <pointLight position={[-3, 2, -2]} intensity={45} distance={12} color={HOTRED} />
      <pointLight position={[3, 3, -2]} intensity={35} distance={10} color={HOTRED} />
      <Dust n={160} center={[0, 2.2, 0]} box={[12, 7, 6]} seed="s8" />
    </Stage>
  );
};

// ── 9 · "e che senso ha?": la bussola con l'ago impazzito ──
const S9: React.FC<SP> = ({start}) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const fast = f >= T(15.5) ? 1 : 0.4;
  const needle = f * 0.18 * fast + Math.sin(f * 0.11) * 2.2 + (random(`n${Math.floor(f / 3)}`) - 0.5) * 0.4 * fast;
  const k = ease(prog(f, 0, T(17.4)));
  return (
    <Stage near={5} far={22}>
      <Rig pos={lerp3([-2.8, 4.6, 8], [2.2, 3.6, 6.8], k)} look={[0, 1.5, 0]} shake={f >= T(15.75) && f < T(15.75) + 10 ? 0.08 : 0} />
      <Floor />
      <Compass needle={needle} position={[0, 1.4, 0]} rotation={[-0.95, 0, 0]} />
      <spotLight position={[0, 7, 3]} angle={0.5} penumbra={0.7} intensity={26} color="#FFD0A0" />
      <pointLight position={[-4, 2, -2]} intensity={40} distance={12} color={HOTRED} />
      <Dust n={140} center={[0, 2.2, 0]} box={[10, 6, 6]} seed="s9" />
    </Stage>
  );
};

// ── 10 · "oddio": tunnel di scritte ad anelli (2D, come il "CASO" di One of One) ──
const S10: React.FC<SP> = () => {
  const f = useCurrentFrame();
  const zoom = 1 + f * 0.012;
  const shake = Math.exp(-f / 12) * 30;
  const sx = (random(`ox${f}`) - 0.5) * shake;
  const sy = (random(`oy${f}`) - 0.5) * shake;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(40% 50% at 50% 50%, #3a0303 0%, #000 70%)', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${zoom})`}}>
        {Array.from({length: 7}, (_, r) => {
          const R = 170 + r * 150;
          const fs = 60 + r * 12;
          const n = Math.floor((2 * Math.PI * R) / (fs * 2.9));
          const rot = (r % 2 ? 1 : -1) * f * (0.6 - r * 0.05);
          const red = r % 3 === 1;
          return (
            <div key={r} style={{position: 'absolute', left: '50%', top: '50%', transform: `rotate(${rot}deg)`}}>
              {Array.from({length: n}, (_, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    fontFamily: '"Anton", Impact, sans-serif',
                    fontSize: fs,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    color: red ? 'rgba(227,20,27,0.85)' : 'transparent',
                    WebkitTextStroke: red ? undefined : '2px rgba(180,180,180,0.55)',
                    transform: `rotate(${(i / n) * 360}deg) translateY(${-R}px) translateX(-50%)`,
                    transformOrigin: '0 0',
                  }}
                >
                  ODDIO
                </div>
              ))}
            </div>
          );
        })}
        <AbsoluteFill style={{background: 'radial-gradient(12% 18% at 50% 50%, rgba(255,80,40,0.9) 0%, rgba(255,40,20,0.3) 40%, transparent 70%)'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── 11 · "non sempre lo si trova": torna il labirinto, la figurina resta in mezzo ──
const S11: React.FC<SP> = ({start}) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const k = ease(prog(f, 0, T(DURATION)));
  const fade = 1 - prog(f, T(DURATION - 0.6), T(DURATION - 0.1));
  const [cx, cz] = [0, 0];
  return (
    <Stage near={10} far={45}>
      <Rig pos={lerp3([0.5, 5, 4.5], [0, 20, 9], k)} look={[cx, 0, cz]} />
      <Floor color="#0c0202" />
      <Maze maze={MAZE} edge={2.2 * fade} />
      <Figure scale={0.5} glow={3.5 * fade} position={[cx, 0, cz]} rotation={[0, f * 0.01, 0]} />
      <pointLight position={[cx, 1, cz]} intensity={10 * fade} distance={5} color="#FFE7CF" />
      <ambientLight intensity={0.12 * fade} color="#ff4030" />
      <directionalLight position={[5, 10, 4]} intensity={0.5 * fade} color="#ff8060" />
    </Stage>
  );
};

const SCENES: [React.FC<SP>, number][] = [
  [S1, 0],
  [S2, 2.12],
  [S3, 4.02],
  [S4, 5.62],
  [S5, 7.28],
  [S6, 10.2],
  [S7, 12.08],
  [S8, 14.22],
  [S9, 15.18],
  [S10, 17.4],
  [S11, 18.26],
];

// larghezza approssimata dei glifi di Anton (em)
const textW = (s: string) => [...s].reduce((a, ch) => a + ('MW'.includes(ch) ? 0.62 : "I1'".includes(ch) ? 0.27 : ch === ' ' ? 0.24 : ch === '?' ? 0.45 : 0.5), 0);

/** testo bianco graffiato al centro, una o due parole alla volta */
const Lyrics: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let idx = -1;
  TOKENS.forEach(([, at], i) => {
    if (t >= at - 0.02) idx = i;
  });
  if (idx < 0) return null;
  const [text, at, kind] = TOKENS[idx];
  const lf = Math.floor((t - at) * FPS);
  const size = Math.min(230, 1400 / textW(text));
  const flick = lf < 6 ? [1, 0.25, 1, 0.6, 1, 1][lf] : 1;
  const sc = 1 + Math.max(0, 1 - lf / 10) * 0.08;
  const big = text === 'ODDIO';
  const common: React.CSSProperties = {
    fontFamily: '"Anton", Impact, sans-serif',
    fontSize: size * (big ? 1.25 : 1),
    lineHeight: 1,
    letterSpacing: size * 0.01,
    whiteSpace: 'nowrap',
  };
  const fill: React.CSSProperties =
    kind === 'outline'
      ? {color: 'transparent', WebkitTextStroke: '3px rgba(255,255,255,0.95)'}
      : kind === 'ghost'
        ? {color: 'rgba(120,110,130,0.75)', WebkitTextStroke: '2px #FFFFFF'}
        : {
            backgroundImage: `url(${staticFile('angolo/grunge.png')})`,
            backgroundSize: '520px',
            backgroundPosition: `${(idx * 137) % 500}px ${(idx * 211) % 500}px`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          };
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: flick}}>
      <div style={{transform: `scale(${sc}, ${sc * 1.12})`, filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.65)) drop-shadow(0 0 22px rgba(255,90,60,0.25))'}}>
        <div style={{...common, ...fill, padding: '0.18em 0.05em 0.05em'}}>{text}</div>
      </div>
    </AbsoluteFill>
  );
};

export const Angolo: React.FC = () => {
  const frame = useCurrentFrame();
  const cuts = SCENES.map(([, s]) => Math.round(s * FPS));
  const sinceCut = Math.min(...cuts.map((c) => (frame >= c ? frame - c : 999)));
  const flash = sinceCut < 4 && frame > 2 ? (4 - sinceCut) * 0.08 : 0;
  const end = Math.min(1, Math.max(0, (frame / FPS - (DURATION - 0.3)) / 0.3));
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SCENES.map(([Scene, s], i) => {
        const from = Math.round(s * FPS);
        const to = i + 1 < SCENES.length ? Math.round(SCENES[i + 1][1] * FPS) : ANGOLO_FRAMES;
        return (
          <Sequence key={i} from={from} durationInFrames={to - from}>
            <Scene start={s} />
          </Sequence>
        );
      })}
      <Lyrics />
      <AbsoluteFill style={{background: '#FFF', opacity: flash, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{background: '#000', opacity: end}} />
      <Audio src={staticFile('angolo/audio.m4a')} />
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {BLUE_PALETTE, Dust, FPS, Figure, Floor, Glow, PaletteProvider, Rig, Stage, ease, easeOut, lerp3, prog} from '../angolo/kit';

// pezzo chill: blu notte al posto del rosso, l'oro resta per gli oggetti
const HOT = BLUE_PALETTE.hot;
import {Corridor} from '../angolo/objects';
import {Lyrics, RingTunnel, type Token} from '../angolo/style';
import {Chain, Curtains, Heart, Moon, Scale, SpotCone, Thorns} from './objects';

/**
 * "Ne varrà la pena": stesso linguaggio di One of One (il pendente, il palco, il tunnel
 * di scritte) in blu notte, oggetti nuovi per questo testo. L'ultima frase sfuma nel buio.
 */

export const DURATION = 29.4;
export const LUNA_FRAMES = Math.round(DURATION * FPS);

// [testo, inizio (s), stile]: tempi da Whisper, ritoccati sugli attacchi della voce
const TOKENS: Token[] = [
  ['NE VARRÀ LA PENA', 0.05, 'solid'],
  ['NE VARRÀ LA PENA', 0.5, 'outline'],
  ['NE VARRÀ LA PENA', 1.18, 'ghost'],
  ['NE VARRÀ LA PENA', 1.92, 'solid'],
  ['SAPRÒ DARTI', 3.94, 'solid'],
  ['ANCHE', 4.78, 'ghost'],
  ['LA LUNA', 4.98, 'solid'],
  ['PROPRIO', 5.44, 'outline'],
  ['TI PROMETTO', 6.3, 'solid'],
  ['CHE DAL', 6.92, 'ghost'],
  ['BUIO', 7.32, 'solid'],
  ['TI CI', 8.92, 'ghost'],
  ['ACCOMPAGNERÒ', 9.38, 'solid'],
  ['FUORI', 10.12, 'solid'],
  ['MA SE', 11.56, 'ghost'],
  ['CI RESTO', 12.12, 'solid'],
  ['TROPPO', 12.54, 'outline'],
  ['A LUNGO', 12.9, 'solid'],
  ['TU LEVAMI', 14.52, 'solid'],
  ['DAI', 15.16, 'ghost'],
  ['RIFLETTORI', 15.36, 'solid'],
  ['E RICORDAMI', 16.64, 'solid'],
  ['QUANTO', 17.76, 'ghost'],
  ['FA MALE', 18.18, 'solid'],
  ['NON AVERE', 19.35, 'solid'],
  ['PIÙ', 20.32, 'ghost'],
  ['NULLA', 20.62, 'solid'],
  ['DA FARE', 21.12, 'outline'],
  ['SE MI', 22.1, 'ghost'],
  ['STRAPPO', 22.76, 'solid'],
  ['DAL PETTO', 23.18, 'solid'],
  ['QUEL POCO', 23.88, 'ghost'],
  ['CHE RIMANE', 24.38, 'solid'],
  ['POI CHE COSA', 26.6, 'soft'],
  ['RIMANE?', 27.36, 'soft'],
];

type SP = {start: number};
const useT = (start: number) => (t: number) => Math.round((t - start) * FPS);

// ── 1 · "ne varrà la pena" ×4: la bilancia pende sempre più dalla parte del cuore ──
const S1: React.FC<SP> = ({start}) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const hits = [0.05, 0.5, 1.18, 1.92].map(T);
  let tilt = 0;
  hits.forEach((h, i) => {
    if (f >= h) {
      const k = f - h;
      tilt = 0.07 * (i + 1) + Math.sin(k * 0.35) * 0.05 * Math.exp(-k / 12);
    }
  });
  const k = ease(prog(f, 0, T(3.94)));
  return (
    <Stage near={6} far={24}>
      <Rig pos={lerp3([0, 2.9, 9.2], [0.3, 2.6, 7.8], k)} look={[0, 2.1, 0]} />
      <Floor />
      <Scale tilt={tilt} />
      <spotLight position={[0, 9, 3]} angle={0.45} penumbra={0.7} intensity={40} color="#DCE8FF" />
      <pointLight position={[-4, 2, -3]} intensity={40} distance={12} color={HOT} />
      <pointLight position={[4, 2, -3]} intensity={30} distance={12} color={HOT} />
      <Dust n={160} center={[0, 3, 0]} box={[12, 7, 6]} seed="l1" />
    </Stage>
  );
};

// ── 2 · "saprò darti anche la luna": la luna scende appesa a una catenella ──
const S2: React.FC<SP> = ({start}) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const drop = easeOut(prog(f, 0, T(5.0)));
  const y = 8 - drop * 5.6;
  const sway = Math.sin(f * 0.05) * 0.06;
  return (
    <Stage fog="#01040f" near={6} far={26}>
      <Rig pos={lerp3([0, 2.6, 8.5], [0.4, 2.4, 7.2], ease(prog(f, 0, T(6.3))))} look={[0, 2.4, 0]} />
      <group position={[0, y, 0]} rotation={[0, f * 0.01, sway]}>
        <Moon scale={1.25} />
        <Chain len={9} link={1.2} position={[0, 1.44, 0]} />
      </group>
      <pointLight position={[2, y + 1, 4]} intensity={10} distance={10} color="#E8F0FF" />
      <pointLight position={[-4, 1, -3]} intensity={40} distance={12} color={HOT} />
      <Dust n={220} center={[0, 3, 0]} box={[14, 8, 8]} seed="l2" />
    </Stage>
  );
};

// ── 3 · "ti prometto che dal buio ti ci accompagnerò fuori": due figure verso la luce ──
const S3: React.FC<SP> = ({start}) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const k = prog(f, 0, T(11.56));
  const z = 2 - k * 20;
  const out = easeOut(prog(f, T(10.12), T(10.12) + 30));
  return (
    <Stage near={3} far={28} bloom={0.8 + out * 0.6}>
      <Rig pos={[0.4, 2.0, z + 5.5]} look={[0, 1.6, z - 8]} />
      <Corridor len={40} open={out * 3} />
      <ambientLight intensity={0.05 + out * 0.2} color={HOT} />
      {[-0.32, 0.32].map((x, i) => (
        <Figure key={i} position={[x, 0, z]} rotation={[0, Math.PI, 0]} walk={f * 0.22 + i * Math.PI} glow={1.1} scale={0.95} />
      ))}
      {/* le mani unite */}
      <mesh position={[0, 0.95, z]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <Glow k={1.5} />
      </mesh>
      <Dust n={120} center={[0, 2.2, z - 4]} box={[5, 4, 12]} seed="l3" />
    </Stage>
  );
};

// ── 4 · "ma se ci resto troppo a lungo, tu levami dai riflettori": il palco ──
const S4: React.FC<SP> = ({start}) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const target: [number, number, number] = [0, 0, 1.5];
  const lights: [number, number, number][] = [
    [0, 9, 4],
    [-5, 8.5, 5],
    [5, 8.5, 5],
    [-3, 9.5, 7],
    [3, 9.5, 7],
  ];
  // si accendono uno alla volta fino a "lungo", poi si spengono su "levami dai riflettori"
  const onAt = [11.56, 12.12, 12.54, 12.9, 13.08].map(T);
  const offAt = [14.52, 14.76, 15.16, 15.36, 15.6].map(T);
  const open = 1 - ease(prog(f, T(15.36), T(16.4)));
  const k = ease(prog(f, 0, T(16.64)));
  return (
    <Stage near={6} far={30}>
      <Rig pos={lerp3([0, 3.0, 13], [0, 2.4, 9.5], k)} look={[0, 2.6, 0]} />
      <Floor />
      <Curtains open={open} f={f} position={[0, 0, -1]} />
      <Figure position={target} glow={2.8} />
      {/* sagome scure ai lati, come in One of One */}
      {[-3.2, -2.2, 2.2, 3.2].map((x, i) => (
        <group key={i} position={[x, 0, 0.6]} scale={0.95}>
          <mesh position={[0, 1.55, 0]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color="#05081a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <capsuleGeometry args={[0.22, 0.9, 6, 12]} />
            <meshStandardMaterial color="#05081a" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {lights.map((p, i) => {
        const on = f >= onAt[i] ? (f >= offAt[i] ? 0 : Math.min(1, (f - onAt[i]) / 4)) : 0;
        return <SpotCone key={i} from={p} to={target} on={on} />;
      })}
      <ambientLight intensity={0.06} color={HOT} />
    </Stage>
  );
};

// ── 5 · "e ricordami quanto fa male": cuore d'oro stretto da una corona di spine ──
const S5: React.FC<SP> = ({start}) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const hurt = T(18.18);
  const tight = ease(prog(f, hurt - 6, hurt + 10));
  const pulse = f >= hurt ? Math.exp(-(f - hurt) / 18) : 0;
  return (
    <Stage fog="#020614" near={5} far={22} bloom={0.75 + pulse * 0.8}>
      <Rig pos={lerp3([0, 2.8, 7.5], [0.5, 2.4, 6], ease(prog(f, 0, T(19.35))))} look={[0, 2.3, 0]} shake={pulse * 0.06} />
      <group position={[0, 2.3, 0]} rotation={[0, Math.sin(f * 0.02) * 0.5, 0]}>
        <Heart scale={1.05} glow={0.12 + pulse * 0.5} bail />
        <Thorns tight={tight} rotation={[0.25, 0, 0]} />
        <Chain len={6} link={1.1} position={[0, 0.69, 0]} />
      </group>
      <spotLight position={[2, 7, 5]} angle={0.5} penumbra={0.7} intensity={30} color="#E2ECFF" />
      <pointLight position={[0, 2, -2.5]} intensity={40 + pulse * 120} distance={10} color={HOT} />
      <Dust n={160} center={[0, 2.5, 0]} box={[10, 6, 6]} seed="l5" />
    </Stage>
  );
};

// ── 6 · "non avere più nulla da fare": il tunnel di scritte ──
const S6: React.FC<SP> = () => <RingTunnel word="NULLA" />;

// ── 7 · "se mi strappo dal petto quel poco che rimane": il cuore esce dal petto ──
const S7: React.FC<SP> = ({start}) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const rip = T(22.76);
  const pull = easeOut(prog(f, rip, T(24.6)));
  const k = ease(prog(f, 0, T(26.6)));
  return (
    <Stage near={5} far={22} bloom={0.85}>
      <Rig pos={lerp3([0, 1.6, 6.5], [0.3, 1.5, 5.2], k)} look={[0, 1.3, 0]} />
      <Floor />
      <Figure glow={2.4 - pull * 1.2} />
      <group position={[0, 1.1 + pull * 0.6, 0.15 + pull * 1.8]} rotation={[0, f * 0.02 * pull, 0]}>
        <Heart scale={0.16 + pull * 0.14} glow={0.25 + (1 - pull) * 0.6} />
      </group>
      {pull > 0 && (
        <mesh position={[0, 1.1, 0.16]}>
          <sphereGeometry args={[0.1 * (1 - pull) + 0.02, 12, 12]} />
          <Glow color={HOT} k={3} />
        </mesh>
      )}
      <pointLight position={[1, 2, 2.5]} intensity={10} distance={6} color="#D8E6FF" />
      <pointLight position={[-3, 2, -3]} intensity={40} distance={12} color={HOT} />
      <Dust n={Math.round(80 + pull * 160)} center={[0, 1.6, 1]} box={[6, 4, 5]} seed="l7" />
    </Stage>
  );
};

// ── 8 · "poi che cosa rimane?": il cuore gira da solo sulla catenella e tutto sfuma ──
const S8: React.FC<SP> = ({start}) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const fade = 1 - ease(prog(f, T(27.8), T(DURATION - 0.1)));
  return (
    <Stage fog="#010309" near={5} far={20} bloom={0.75 * fade}>
      <Rig pos={lerp3([0, 2.4, 6], [0, 2.4, 8.5], ease(prog(f, 0, T(DURATION))))} look={[0, 2.4, 0]} />
      <group position={[0, 2.4, 0]} rotation={[0, f * 0.012, Math.sin(f * 0.03) * 0.05]}>
        <Heart scale={0.7} glow={0.15 * fade} bail />
        <Chain len={6} position={[0, 0.46, 0]} />
      </group>
      <spotLight position={[0, 7, 4]} angle={0.45} penumbra={0.8} intensity={30 * fade} color="#E2ECFF" />
      <pointLight position={[0, 2, -2.5]} intensity={30 * fade} distance={10} color={HOT} />
      <Dust n={Math.round(140 * fade) + 1} center={[0, 2.5, 0]} box={[9, 6, 6]} seed="l8" />
    </Stage>
  );
};

const SCENES: [React.FC<SP>, number][] = [
  [S1, 0],
  [S2, 3.94],
  [S3, 6.3],
  [S4, 11.56],
  [S5, 16.64],
  [S6, 19.35],
  [S7, 22.1],
  [S8, 26.6],
];

export const Luna: React.FC = () => {
  const frame = useCurrentFrame();
  const cuts = SCENES.map(([, s]) => Math.round(s * FPS));
  const sinceCut = Math.min(...cuts.map((c) => (frame >= c ? frame - c : 999)));
  // nessun flash sull'ultimo stacco: l'ultima frase entra morbida
  const lastCut = cuts[cuts.length - 1];
  const flash = sinceCut < 4 && frame > 2 && frame - sinceCut !== lastCut ? (4 - sinceCut) * 0.08 : 0;
  const end = Math.min(1, Math.max(0, (frame / FPS - (DURATION - 0.5)) / 0.5));
  return (
    <PaletteProvider value={BLUE_PALETTE}>
    <AbsoluteFill style={{background: '#000'}}>
      {SCENES.map(([Scene, s], i) => {
        const from = Math.round(s * FPS);
        const to = i + 1 < SCENES.length ? Math.round(SCENES[i + 1][1] * FPS) : LUNA_FRAMES;
        return (
          <Sequence key={i} from={from} durationInFrames={to - from}>
            <Scene start={s} />
          </Sequence>
        );
      })}
      <Lyrics tokens={TOKENS} big={['NULLA']} />
      <AbsoluteFill style={{background: '#FFF', opacity: flash, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{background: '#000', opacity: end}} />
      <Audio src={staticFile('luna/audio.m4a')} />
    </AbsoluteFill>
    </PaletteProvider>
  );
};


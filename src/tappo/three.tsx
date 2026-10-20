import React, {useMemo} from 'react';
import {useThree, type ThreeElements} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';

export const BLUE = '#1550E8';
export const ACCENT = '#0A84FF';

/** Illuminazione da studio: environment map per riflessi realistici + luci morbide */
export const Studio: React.FC<{intensity?: number}> = ({intensity = 1}) => {
  const {gl, scene} = useThree();
  // environment map creata in modo sincrono: deve esserci già nel primo frame renderizzato
  useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.7;
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = 1.0;
    pmrem.dispose();
  }, [gl, scene]);
  return (
    <>
      <ambientLight intensity={0.25 * intensity} />
      <directionalLight position={[4, 6, 5]} intensity={1.6 * intensity} />
      <directionalLight position={[-5, 2, -3]} intensity={0.8 * intensity} color="#cfe0ff" />
      <pointLight position={[0, -4, 4]} intensity={6 * intensity} color="#ffffff" distance={20} />
    </>
  );
};

// ───────────────────────── TAPPO ─────────────────────────
// profilo per LatheGeometry: guscio cavo con buco in cima (unità: altezza 4, raggio 0.5)
const capProfile = () => {
  const pts: THREE.Vector2[] = [];
  const hole = 0.085;
  // calotta esterna: dal bordo del buco fino al fianco
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * (Math.PI / 2);
    pts.push(new THREE.Vector2(hole + Math.sin(a) * (0.5 - hole), 3.55 + Math.cos(a) * 0.45));
  }
  // fianco leggermente svasato
  pts.push(new THREE.Vector2(0.505, 3.0));
  pts.push(new THREE.Vector2(0.515, 0.35));
  // anello di battuta
  pts.push(new THREE.Vector2(0.535, 0.3));
  pts.push(new THREE.Vector2(0.535, 0.06));
  pts.push(new THREE.Vector2(0.51, 0));
  pts.push(new THREE.Vector2(0.43, 0));
  // interno
  pts.push(new THREE.Vector2(0.42, 3.45));
  for (let i = 0; i <= 12; i++) {
    const a = (i / 12) * (Math.PI / 2);
    pts.push(new THREE.Vector2(0.42 - Math.sin(a) * (0.42 - hole), 3.45 + Math.sin(a) * 0.43));
  }
  pts.push(new THREE.Vector2(hole, 4.0));
  return pts;
};

const roundedRect = (w: number, h: number, r: number) => {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
};

export const Cap3D: React.FC<{
  color?: string;
  holeGlow?: number;
  bites?: number;
} & ThreeElements['group']> = ({color = BLUE, holeGlow = 0, bites = 0, ...g}) => {
  const body = useMemo(() => new THREE.LatheGeometry(capProfile(), 96), []);
  const clip = useMemo(() => new THREE.ExtrudeGeometry(roundedRect(0.24, 2.6, 0.1), {depth: 0.09, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4}), []);
  const bridge = useMemo(() => new THREE.ExtrudeGeometry(roundedRect(0.24, 0.32, 0.1), {depth: 0.09, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4}), []);
  return (
    <group {...g}>
      {/* centro il tappo sull'origine */}
      <group position={[0, -2, 0]}>
        <mesh geometry={body}>
          <meshPhysicalMaterial color={color} roughness={0.28} metalness={0} clearcoat={1} clearcoatRoughness={0.06} side={THREE.DoubleSide} />
        </mesh>
        {/* buco: disco scuro interno + alone luminoso */}
        <mesh position={[0, 3.93, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.085, 32]} />
          <meshBasicMaterial color="#030817" />
        </mesh>
        {holeGlow > 0 && (
          <mesh position={[0, 4.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.09, 0.09 + 0.25 * holeGlow, 48]} />
            <meshBasicMaterial color={ACCENT} transparent opacity={0.85 * holeGlow} />
          </mesh>
        )}
        {/* clip */}
        <mesh geometry={clip} position={[0, 2.35, 0.56]}>
          <meshPhysicalMaterial color={color} roughness={0.22} clearcoat={1} clearcoatRoughness={0.08} />
        </mesh>
        <mesh geometry={bridge} position={[0, 3.62, 0.43]} rotation={[0.35, 0, 0]}>
          <meshPhysicalMaterial color={color} roughness={0.22} clearcoat={1} clearcoatRoughness={0.08} />
        </mesh>
        <mesh position={[0, 1.1, 0.6]}>
          <sphereGeometry args={[0.13, 32, 16]} />
          <meshPhysicalMaterial color={color} roughness={0.22} clearcoat={1} />
        </mesh>
        {/* segni dei morsi vicino al bordo */}
        {bites > 0 &&
          [-0.28, 0, 0.28].map((a, i) => (
            <mesh key={i} position={[Math.sin(a) * 0.528, 0.42 + (i % 2) * 0.05, Math.cos(a) * 0.528]} rotation={[0, a, 0]} scale={[1, bites, 1]}>
              <boxGeometry args={[0.16, 0.05, 0.02]} />
              <meshStandardMaterial color="#0A2A70" roughness={0.6} />
            </mesh>
          ))}
      </group>
    </group>
  );
};

// ───────────────────────── PENNA ─────────────────────────
/** Penna in stile "Cristal": fusto esagonale trasparente, refill, punta, tappino. Asse lungo X, punta a sinistra. */
export const Pen3D: React.FC<{
  inkLevel?: number; // 0..1
  holeGlow?: number;
  air?: number;
  t?: number;
  withCap?: boolean;
} & ThreeElements['group']> = ({inkLevel = 0.85, holeGlow = 0, air = 0, t = 0, withCap = false, ...g}) => {
  const L = 7;
  const inkLen = Math.max(0.05, (L - 0.6) * inkLevel);
  return (
    <group {...g}>
      <group rotation={[0, 0, Math.PI / 2]}>
        {/* fusto esagonale trasparente */}
        <mesh>
          <cylinderGeometry args={[0.42, 0.42, L, 6, 1, false]} />
          <meshPhysicalMaterial color="#E3ECFA" transmission={0.92} thickness={0.2} roughness={0.05} ior={1.2} clearcoat={1} clearcoatRoughness={0.04} specularIntensity={1} attenuationColor="#9FB7E6" attenuationDistance={2.5} transparent />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.CylinderGeometry(0.42, 0.42, L, 6, 1, false)]} />
          <lineBasicMaterial color="#8FA3C4" transparent opacity={0.55} />
        </lineSegments>
        {/* refill bianco traslucido */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.12, 0.12, L - 0.6, 32]} />
          <meshPhysicalMaterial color="#ffffff" transmission={0.6} roughness={0.3} thickness={0.1} transparent opacity={0.9} />
        </mesh>
        {/* inchiostro: parte dalla punta (in basso) */}
        <mesh position={[0, -L / 2 + 0.3 + inkLen / 2, 0]}>
          <cylinderGeometry args={[0.095, 0.095, inkLen, 32]} />
          <meshPhysicalMaterial color={BLUE} roughness={0.25} clearcoat={0.6} />
        </mesh>
        {/* punta conica */}
        <mesh position={[0, -L / 2 - 0.45, 0]} rotation={[Math.PI, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.36, 0.9, 6]} />
          <meshPhysicalMaterial color="#F4F8FF" transmission={1} thickness={0.4} roughness={0.08} transparent />
        </mesh>
        <mesh position={[0, -L / 2 - 0.92, 0]} rotation={[Math.PI, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.1, 0.35, 24]} />
          <meshStandardMaterial color="#C9CDD4" metalness={1} roughness={0.2} />
        </mesh>
        <mesh position={[0, -L / 2 - 1.1, 0]}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshStandardMaterial color="#888" metalness={1} roughness={0.15} />
        </mesh>
        {/* tappino posteriore */}
        <mesh position={[0, L / 2 + 0.12, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.5, 32]} />
          <meshPhysicalMaterial color={BLUE} roughness={0.22} clearcoat={1} />
        </mesh>
        {/* buchino laterale su una faccia dell'esagono */}
        <group position={[0, 0.6, 0]} rotation={[0, Math.PI / 6, 0]}>
          <mesh position={[0, 0, 0.365]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.02, 24]} />
            <meshBasicMaterial color="#05070C" />
          </mesh>
          {holeGlow > 0 && (
            <mesh position={[0, 0, 0.38]}>
              <ringGeometry args={[0.08, 0.08 + 0.22 * holeGlow, 40]} />
              <meshBasicMaterial color={ACCENT} transparent opacity={0.85 * holeGlow} side={THREE.DoubleSide} />
            </mesh>
          )}
          {/* bolle d'aria che entrano */}
          {air > 0 &&
            Array.from({length: 8}, (_, i) => {
              const k = (t * 0.7 + i / 8) % 1;
              const inward = Math.min(1, k * 3);
              return (
                <mesh key={i} position={[0, k * 2.4, 0.38 - inward * 0.28]}>
                  <sphereGeometry args={[0.045 * (1 - k * 0.4), 16, 16]} />
                  <meshBasicMaterial color={ACCENT} transparent opacity={air * (1 - k)} />
                </mesh>
              );
            })}
        </group>
      </group>
      {withCap && <Cap3D position={[-L / 2 - 0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={0.95} />}
    </group>
  );
};

// ───────────────────────── TRACHEA ─────────────────────────
/**
 * Trachea in vetro con anelli, tappo incastrato e particelle d'aria:
 * l'aria entra dalla base aperta del tappo, attraversa il buco in cima ed esce come un filo che si riapre.
 */
export const TRACHEA = {R: 1.15, H: 18, capScale: 1.85};
export const Trachea3D: React.FC<{capY: number; flow: number; t: number} & ThreeElements['group']> = ({capY, flow, t, ...g}) => {
  const {R, H, capScale} = TRACHEA;
  const capLen = 4 * capScale;
  const capCenter = 1.0 + (1 - capY) * 12; // scende dall'alto e si ferma
  const capTop = capCenter + capLen / 2;
  const capBottom = capCenter - capLen / 2;
  return (
    <group {...g}>
      <mesh>
        <cylinderGeometry args={[R, R, H, 96, 1, true]} />
        <meshPhysicalMaterial color="#F9E3E6" transmission={0.85} thickness={0.4} roughness={0.15} ior={1.3} side={THREE.DoubleSide} attenuationColor="#E9A9B4" attenuationDistance={3} transparent opacity={0.95} />
      </mesh>
      {Array.from({length: 22}, (_, i) => (
        <mesh key={i} position={[0, -H / 2 + 0.6 + i * 0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[R + 0.03, 0.09, 16, 96]} />
          <meshPhysicalMaterial color="#FFFFFF" roughness={0.35} clearcoat={0.5} transparent opacity={0.9} />
        </mesh>
      ))}
      <Cap3D position={[0, capCenter, 0]} scale={capScale} holeGlow={flow} rotation={[0, 0.4 + t * 0.1, 0]} />
      {flow > 0 &&
        Array.from({length: 60}, (_, i) => {
          const k = (t * 0.22 + i / 60) % 1;
          const y = -H / 2 + k * H;
          const a = i * 2.39996 + t * 0.4;
          const rr = 0.2 + (((i * 7) % 10) / 10) * 0.65;
          let r: number;
          if (y < capBottom) r = rr * (0.8 + 0.2 * Math.min(1, (capBottom - y) / 3));
          else if (y < capTop) r = rr * Math.max(0.05, 1 - (y - capBottom) / capLen);
          else r = 0.04 + rr * Math.min(1, (y - capTop) / 3.5);
          const near = y > capTop ? Math.max(0, 1 - (y - capTop) / 2) : 0;
          return (
            <mesh key={i} position={[Math.cos(a) * r, y, Math.sin(a) * r]}>
              <sphereGeometry args={[(0.13 + near * 0.06) * Math.min(1, flow * 1.5), 14, 14]} />
              <meshBasicMaterial color={ACCENT} />
            </mesh>
          );
        })}
    </group>
  );
};

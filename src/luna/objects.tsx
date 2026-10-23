import React, {useMemo} from 'react';
import type {ThreeElements} from '@react-three/fiber';
import * as THREE from 'three';
import {Glow, Gold, Red} from '../angolo/kit';

type G = ThreeElements['group'];

/** Cuore estruso (contorno in coordinate unitarie, centrato) */
const heartGeo = (depth = 0.35) => {
  const s = new THREE.Shape();
  s.moveTo(0, -1);
  s.bezierCurveTo(-0.6, -0.55, -1.25, -0.1, -1.0, 0.45);
  s.bezierCurveTo(-0.8, 0.95, -0.2, 0.95, 0, 0.5);
  s.bezierCurveTo(0.2, 0.95, 0.8, 0.95, 1.0, 0.45);
  s.bezierCurveTo(1.25, -0.1, 0.6, -0.55, 0, -1);
  const g = new THREE.ExtrudeGeometry(s, {depth, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.08, bevelSegments: 5, curveSegments: 32});
  g.center();
  return g;
};

export const Heart: React.FC<{glow?: number} & G> = ({glow = 0.15, ...g}) => {
  const geo = useMemo(() => heartGeo(), []);
  return (
    <group {...g}>
      <mesh geometry={geo}>
        <Gold glow={glow} />
      </mesh>
    </group>
  );
};

/** Catenella d'oro verticale che scende dall'alto fino all'origine */
export const Chain: React.FC<{len?: number} & G> = ({len = 6, ...g}) => {
  const n = Math.round(len / 0.2);
  return (
    <group {...g}>
      {Array.from({length: n}, (_, i) => (
        <mesh key={i} position={[0, 0.1 + i * 0.2, 0]} rotation={[0, i % 2 ? Math.PI / 2 : 0, 0]}>
          <torusGeometry args={[0.07, 0.022, 8, 20]} />
          <Gold />
        </mesh>
      ))}
    </group>
  );
};

/** Luna: sfera chiara luminosa con crateri */
export const Moon: React.FC<G> = (g) => (
  <group {...g}>
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial color="#F3E2C0" roughness={0.9} emissive="#FFDCA0" emissiveIntensity={0.12} />
    </mesh>
    {[
      [0.35, 0.3, 0.88, 0.2],
      [-0.4, -0.15, 0.9, 0.14],
      [0.05, -0.5, 0.86, 0.1],
      [-0.2, 0.55, 0.81, 0.09],
    ].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]}>
        <sphereGeometry args={[r, 24, 24]} />
        <meshStandardMaterial color="#C9B48E" roughness={1} emissive="#7a5a30" emissiveIntensity={0.3} />
      </mesh>
    ))}
    {/* anello di aggancio */}
    <mesh position={[0, 1.08, 0]}>
      <torusGeometry args={[0.12, 0.035, 10, 24]} />
      <Gold />
    </mesh>
  </group>
);

/** Corona di spine attorno a un oggetto: tight 0→1 la stringe */
export const Thorns: React.FC<{tight?: number} & G> = ({tight = 0, ...g}) => {
  const R = 1.55 - tight * 0.35;
  return (
    <group {...g}>
      {[0, 1].map((k) => (
        <mesh key={k} rotation={[Math.PI / 2 + (k ? 0.25 : -0.25), k ? 0.3 : -0.2, 0]}>
          <torusGeometry args={[R, 0.045, 8, 120]} />
          <meshStandardMaterial color="#7a5430" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      {Array.from({length: 28}, (_, i) => {
        const a = (i / 28) * Math.PI * 2;
        const tilt = (i % 2 ? 1 : -1) * 0.25;
        return (
          <mesh key={`s${i}`} position={[Math.cos(a) * R, Math.sin(a * 2) * 0.12, Math.sin(a) * R]} rotation={[tilt, -a, Math.PI / 2 + (i % 3) * 0.4]}>
            <coneGeometry args={[0.04, 0.32, 6]} />
            <meshStandardMaterial color="#8a6034" metalness={0.7} roughness={0.4} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Bilancia d'oro: tilt = inclinazione del giogo (positivo: scende il piatto sinistro, quello col cuore) */
export const Scale: React.FC<{tilt: number} & G> = ({tilt, ...g}) => {
  const arm = 2.2;
  const hang = 1.3;
  const pan = (side: number, content: React.ReactNode) => {
    const y = Math.sin(tilt) * arm * side * -1;
    return (
      <group position={[side * Math.cos(tilt) * arm, 3.2 - y, 0]}>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.35, -hang / 2, Math.sin(a) * 0.35]} rotation={[Math.sin(a) * 0.27, 0, -Math.cos(a) * 0.27]}>
              <cylinderGeometry args={[0.012, 0.012, hang * 1.04, 6]} />
              <Gold />
            </mesh>
          );
        })}
        <mesh position={[0, -hang, 0]}>
          <cylinderGeometry args={[0.8, 0.55, 0.12, 48]} />
          <Gold />
        </mesh>
        <group position={[0, -hang + 0.06, 0]}>{content}</group>
      </group>
    );
  };
  return (
    <group {...g}>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[1, 1.15, 0.16, 64]} />
        <Gold />
      </mesh>
      <mesh position={[0, 1.65, 0]}>
        <cylinderGeometry args={[0.07, 0.11, 3.1, 24]} />
        <Gold />
      </mesh>
      <mesh position={[0, 3.3, 0]}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <Gold glow={0.3} />
      </mesh>
      <group position={[0, 3.2, 0]} rotation={[0, 0, tilt]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, arm * 2, 16]} />
          <Gold />
        </mesh>
      </group>
      {pan(-1, <Heart scale={0.42} position={[0, 0.42, 0]} rotation={[0, 0.3, 0]} glow={0.35} />)}
      {pan(
        1,
        <mesh position={[0, 0.3, 0]} rotation={[0.4, 0.6, 0.2]}>
          <dodecahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial color="#1a1010" roughness={0.8} metalness={0.2} />
        </mesh>,
      )}
    </group>
  );
};

/** Sipario rosso a pieghe: open 1 = aperto, 0 = chiuso */
export const Curtains: React.FC<{open: number; f: number} & G> = ({open, f, ...g}) => {
  const folds = 14;
  const half = 7.5;
  return (
    <group {...g}>
      {/* fondale */}
      <mesh position={[0, 4, -0.6]}>
        <planeGeometry args={[16, 9]} />
        <Red rough={0.8} />
      </mesh>
      {[-1, 1].map((side) => {
        const cover = (1 - open) * half;
        return Array.from({length: folds}, (_, i) => {
          const u = i / (folds - 1);
          const x = side * (half - u * (0.6 + cover));
          return (
            <mesh key={`${side}${i}`} position={[x, 4, 0.2 + Math.sin(i * 1.7 + f * 0.03) * 0.05]}>
              <cylinderGeometry args={[0.32, 0.32, 9, 16, 1, false, 0, Math.PI]} />
              <Red rough={0.45} glow={0.02} />
            </mesh>
          );
        });
      })}
      {/* mantovana */}
      <mesh position={[0, 8.3, 0.35]}>
        <boxGeometry args={[16, 0.9, 0.3]} />
        <Red rough={0.45} glow={0.04} />
      </mesh>
    </group>
  );
};

/** Cono di riflettore volumetrico (dall'alto verso target) */
export const SpotCone: React.FC<{from: [number, number, number]; to: [number, number, number]; on: number; color?: string}> = ({from, to, on, color = '#FFE2B8'}) => {
  const dir = new THREE.Vector3(...to).sub(new THREE.Vector3(...from));
  const len = dir.length();
  const mid = new THREE.Vector3(...from).add(dir.clone().multiplyScalar(0.5));
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.clone().normalize());
  if (on <= 0) return null;
  return (
    <group>
      <mesh position={mid} quaternion={q}>
        <coneGeometry args={[0.9, len, 40, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.035 * on} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={from}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <Glow color={color} k={4 * on} />
      </mesh>
      <spotLight position={from} target-position={to} angle={0.22} penumbra={0.5} intensity={40 * on} distance={20} color={color} />
    </group>
  );
};


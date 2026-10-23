import React, {useMemo} from 'react';
import type {ThreeElements} from '@react-three/fiber';
import * as THREE from 'three';
import {Glow, Gold, Red, usePal} from './kit';

type G = ThreeElements['group'];

/** Corridoio rosso con porte d'oro chiuse ai lati e una luce in fondo */
export const Corridor: React.FC<{len?: number; open?: number} & G> = ({len = 40, open = 0, ...g}) => {
  const pal = usePal();
  const doors = Math.floor(len / 4);
  return (
    <group {...g}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -len / 2]}>
        <planeGeometry args={[6, len + 10]} />
        <meshStandardMaterial color={pal.floor} metalness={0.6} roughness={0.28} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, -len / 2]}>
        <planeGeometry args={[6, len + 10]} />
        <Red />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 3, 2.5, -len / 2]} rotation={[0, -s * (Math.PI / 2), 0]}>
          <planeGeometry args={[len + 10, 5]} />
          <Red rough={0.7} />
        </mesh>
      ))}
      {/* archi */}
      {Array.from({length: doors + 1}, (_, i) => (
        <group key={`ar${i}`} position={[0, 0, -i * 4]}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 2.85, 2.4, 0]}>
              <boxGeometry args={[0.3, 4.8, 0.3]} />
              <Red rough={0.4} />
            </mesh>
          ))}
          <mesh position={[0, 4.85, 0]}>
            <boxGeometry args={[6, 0.3, 0.3]} />
            <Red glow={0.15} rough={0.4} />
          </mesh>
        </group>
      ))}
      {Array.from({length: doors}, (_, i) =>
        [-1, 1].map((s) => (
          <group key={`${i}${s}`} position={[s * 2.98, 0, -2 - i * 4]} rotation={[0, -s * (Math.PI / 2), 0]}>
            <mesh position={[0, 1.55, 0]}>
              <boxGeometry args={[1.5, 3.1, 0.06]} />
              <Gold />
            </mesh>
            <mesh position={[0, 1.5, 0.04]}>
              <boxGeometry args={[1.25, 2.9, 0.06]} />
              <meshStandardMaterial color="#3a0505" roughness={0.45} metalness={0.3} />
            </mesh>
            <mesh position={[s > 0 ? -0.45 : 0.45, 1.45, 0.12]}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <Gold glow={0.3} />
            </mesh>
          </group>
        )),
      )}
      {/* la luce in fondo */}
      <mesh position={[0, 2.5, -len - 2]}>
        <planeGeometry args={[6, 5]} />
        <Glow color={pal.warm} k={1.6 + open * 3} />
      </mesh>
      <pointLight position={[0, 3, -len]} intensity={80} distance={30} color={pal.warm} />
    </group>
  );
};

/** Punto interrogativo d'oro (tubo lungo una curva + puntino) */
export const Question: React.FC<{glow?: number} & G> = ({glow = 0.2, ...g}) => {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    // ricciolo: mezzo cerchio in alto, poi giù fino al gambo
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI * 1.05 - (i / 24) * Math.PI * 1.45;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.75, 1.15 + Math.sin(a) * 0.75, 0));
    }
    pts.push(new THREE.Vector3(0.05, 0.25, 0));
    pts.push(new THREE.Vector3(0, -0.15, 0));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.2, 20, false);
  }, []);
  return (
    <group {...g}>
      <mesh geometry={geo}>
        <Gold glow={glow} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <sphereGeometry args={[0.2, 20, 20]} />
        <Gold glow={glow} />
      </mesh>
      <mesh position={[0, -0.75, 0]}>
        <sphereGeometry args={[0.26, 24, 24]} />
        <Gold glow={glow} />
      </mesh>
    </group>
  );
};

/** Due anelli intrecciati */
export const Rings: React.FC<{spin: number} & G> = ({spin, ...g}) => {
  const pal = usePal();
  return (
  <group {...g}>
    <group rotation={[0.3, spin, 0.2]} position={[-0.55, 0, 0]}>
      <mesh>
        <torusGeometry args={[1, 0.13, 32, 96]} />
        <Gold glow={0.15} />
      </mesh>
    </group>
    <group rotation={[Math.PI / 2 + 0.3, -spin * 0.8, 0.4]} position={[0.55, 0, 0]}>
      <mesh>
        <torusGeometry args={[1, 0.13, 32, 96]} />
        <Gold glow={0.15} />
      </mesh>
      {/* pietra sul secondo anello */}
      <mesh position={[0, 1.13, 0]}>
        <octahedronGeometry args={[0.2, 0]} />
        <Glow color={pal.hot} k={3} />
      </mesh>
    </group>
  </group>
  );
};

// contorno dell'Africa (longitudine, latitudine) semplificato, più il Madagascar
const AFRICA: [number, number][] = [
  [-6, 36], [3, 37], [10, 37], [11, 33], [15, 32], [20, 31], [25, 32], [32, 31], [34, 28], [36, 22], [38, 18], [43, 12], [51, 12], [51, 10],
  [47, 5], [44, 2], [41, -2], [40, -10], [36, -18], [35, -24], [32, -28], [28, -33], [20, -35], [17, -29], [14, -22], [12, -17], [13, -9],
  [9, -1], [9, 4], [5, 6], [-2, 5], [-8, 4], [-13, 8], [-17, 14], [-17, 21], [-13, 27], [-10, 30],
];
const MADAGASCAR: [number, number][] = [[44, -12], [50, -15], [48, -25], [44, -24], [43, -17]];

export const Africa: React.FC<{glow?: number} & G> = ({glow = 0.1, ...g}) => {
  const geo = useMemo(() => {
    const mk = (pts: [number, number][]) => {
      const s = new THREE.Shape();
      pts.forEach(([x, y], i) => (i ? s.lineTo(x / 10, y / 10) : s.moveTo(x / 10, y / 10)));
      s.closePath();
      return s;
    };
    const geom = new THREE.ExtrudeGeometry([mk(AFRICA), mk(MADAGASCAR)], {depth: 0.45, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 4});
    geom.center();
    return geom;
  }, []);
  return (
    <group {...g}>
      <mesh geometry={geo}>
        <Gold glow={glow} env={0.55} />
      </mesh>
    </group>
  );
};

/** Bussola d'oro; needle = angolo dell'ago in radianti */
export const Compass: React.FC<{needle: number} & G> = ({needle, ...g}) => {
  const pal = usePal();
  return (
  <group {...g}>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[2, 2.1, 0.45, 96]} />
      <Gold env={0.6} />
    </mesh>
    <mesh position={[0, 0, 0.24]}>
      <circleGeometry args={[1.8, 96]} />
      <meshStandardMaterial color="#2a0303" roughness={0.6} />
    </mesh>
    <mesh position={[0, 0, 0.25]}>
      <ringGeometry args={[1.62, 1.68, 96]} />
      <Gold glow={0.3} />
    </mesh>
    {Array.from({length: 36}, (_, i) => {
      const a = (i / 36) * Math.PI * 2;
      const big = i % 9 === 0;
      return (
        <mesh key={i} position={[Math.sin(a) * 1.48, Math.cos(a) * 1.48, 0.26]} rotation={[0, 0, -a]}>
          <boxGeometry args={[big ? 0.08 : 0.03, big ? 0.26 : 0.13, 0.02]} />
          <Gold glow={big ? 0.4 : 0.1} />
        </mesh>
      );
    })}
    {/* rosa dei venti */}
    {[0, 1, 2, 3].map((i) => (
      <mesh key={`r${i}`} position={[0, 0, 0.26]} rotation={[0, 0, (i * Math.PI) / 2 + Math.PI / 4]}>
        <coneGeometry args={[0.12, 1.4, 4]} />
        <meshStandardMaterial color="#5a0a0a" roughness={0.5} />
      </mesh>
    ))}
    {/* ago */}
    <group position={[0, 0, 0.42]} rotation={[0, 0, needle]}>
      <mesh position={[0, 0.62, 0]}>
        <coneGeometry args={[0.16, 1.25, 4]} />
        <Glow color={pal.hot} k={2.4} />
      </mesh>
      <mesh position={[0, -0.62, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.16, 1.25, 4]} />
        <Gold />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.12, 0.12, 0.12, 24]} />
        <Gold glow={0.3} />
      </mesh>
    </group>
    {/* vetro */}
    <mesh position={[0, 0, 0.55]}>
      <circleGeometry args={[1.82, 96]} />
      <meshPhysicalMaterial color="#ffffff" transparent opacity={0.08} roughness={0.05} metalness={0} clearcoat={1} />
    </mesh>
  </group>
  );
};

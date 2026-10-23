import React, {useMemo} from 'react';
import type {ThreeElements} from '@react-three/fiber';
import * as THREE from 'three';
import {GOLD, Glow, Gold, Red} from '../angolo/kit';

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

/** Cuore d'oro; bail aggiunge l'anello in cima (tra i due lobi) per appenderlo */
export const Heart: React.FC<{glow?: number; bail?: boolean} & G> = ({glow = 0.15, bail, ...g}) => {
  const geo = useMemo(() => heartGeo(), []);
  return (
    <group {...g}>
      <mesh geometry={geo}>
        <Gold glow={glow} />
      </mesh>
      {bail && <Bail size={1.3} position={[0, 0.66, 0]} />}
    </group>
  );
};

/** Oro per oggetti piccoli e fitti (catene, fili): meno riflessi, niente bagliori sparsi */
const SoftGold: React.FC = () => <meshStandardMaterial color={GOLD} metalness={1} roughness={0.32} envMapIntensity={0.85} />;

/**
 * Catenella d'oro verticale che sale dall'origine: maglie ovali che si incastrano
 * l'una nell'altra, ognuna ruotata di 90° rispetto alla precedente.
 */
export const Chain: React.FC<{len?: number; link?: number} & G> = ({len = 6, link = 1, ...g}) => {
  const r = 0.085 * link; // raggio della maglia
  const tube = 0.022 * link;
  const stretch = 1.6; // maglia ovale
  const pitch = 2 * r * stretch - 2 * tube - 0.02 * link; // passo: le maglie si sovrappongono
  const n = Math.ceil(len / pitch);
  return (
    <group {...g}>
      {Array.from({length: n}, (_, i) => (
        <mesh key={i} position={[0, r * stretch + i * pitch, 0]} rotation={[0, i % 2 ? Math.PI / 2 : 0, 0]} scale={[1, stretch, 1]}>
          <torusGeometry args={[r, tube, 10, 28]} />
          <SoftGold />
        </mesh>
      ))}
    </group>
  );
};

/** Anello di aggancio (la catena ci passa dentro): asse sull'asse z, in cima all'oggetto */
export const Bail: React.FC<{size?: number} & G> = ({size = 1, ...g}) => (
  <group {...g}>
    <mesh rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[0.13 * size, 0.035 * size, 12, 32]} />
      <SoftGold />
    </mesh>
  </group>
);

/** Luna: sfera chiara luminosa con crateri */
export const Moon: React.FC<G> = (g) => (
  <group {...g}>
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial color="#BCC6D6" roughness={0.9} emissive="#CFE0FF" emissiveIntensity={0.04} />
    </mesh>
    {[
      [0.35, 0.3, 0.88, 0.2],
      [-0.4, -0.15, 0.9, 0.14],
      [0.05, -0.5, 0.86, 0.1],
      [-0.2, 0.55, 0.81, 0.09],
    ].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]}>
        <sphereGeometry args={[r, 24, 24]} />
        <meshStandardMaterial color="#AEB8C8" roughness={1} emissive="#30405a" emissiveIntensity={0.3} />
      </mesh>
    ))}
    {/* calotta e anello di aggancio */}
    <mesh position={[0, 0.98, 0]}>
      <cylinderGeometry args={[0.09, 0.14, 0.12, 24]} />
      <SoftGold />
    </mesh>
    <Bail position={[0, 1.15, 0]} />
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

/** Asticella tra due punti */
const Rod: React.FC<{a: THREE.Vector3; b: THREE.Vector3; r?: number}> = ({a, b, r = 0.012}) => {
  const d = b.clone().sub(a);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  return (
    <mesh position={a.clone().add(d.multiplyScalar(0.5))} quaternion={q}>
      <cylinderGeometry args={[r, r, b.distanceTo(a), 8]} />
      <SoftGold />
    </mesh>
  );
};

/** Piatto a ciotola (profilo ruotato) */
const dishGeo = () => {
  const pts = [
    [0, 0],
    [0.35, 0.01],
    [0.62, 0.06],
    [0.78, 0.17],
    [0.8, 0.2],
    [0.76, 0.2],
    [0.6, 0.1],
    [0.33, 0.05],
    [0, 0.04],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, 64);
};

/**
 * Bilancia a due piatti. tilt = rotazione del giogo (positivo: scende il piatto sinistro,
 * quello col cuore). I piatti restano sempre in verticale sotto il loro gancio.
 */
export const Scale: React.FC<{tilt: number} & G> = ({tilt, ...g}) => {
  const arm = 2.1;
  const pivotY = 3.3;
  const hang = 1.45;
  const dish = useMemo(() => dishGeo(), []);
  const pan = (side: number, content: React.ReactNode) => {
    // gancio all'estremità del giogo, ruotato di tilt attorno al perno
    const hook = new THREE.Vector3(side * Math.cos(tilt) * arm, pivotY + Math.sin(tilt) * arm * side, 0);
    const rim = 0.72;
    const center = new THREE.Vector3(hook.x, hook.y - hang, 0);
    return (
      <group>
        {/* gancio */}
        <mesh position={[hook.x, hook.y - 0.08, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.07, 0.018, 8, 20]} />
          <SoftGold />
        </mesh>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
          return <Rod key={i} a={new THREE.Vector3(hook.x, hook.y - 0.14, 0)} b={new THREE.Vector3(center.x + Math.cos(a) * rim, center.y + 0.19, Math.sin(a) * rim)} />;
        })}
        <mesh geometry={dish} position={center}>
          <Gold env={0.9} />
        </mesh>
        <group position={[center.x, center.y + 0.06, 0]}>{content}</group>
      </group>
    );
  };
  return (
    <group {...g}>
      {/* base a gradini */}
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[1.05, 1.15, 0.14, 64]} />
        <Gold env={0.9} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.7, 0.85, 0.14, 64]} />
        <Gold env={0.9} />
      </mesh>
      {/* colonna con anelli */}
      <mesh position={[0, 1.75, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 3.0, 24]} />
        <Gold env={0.9} />
      </mesh>
      {[0.45, 1.6, 2.9].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <torusGeometry args={[0.11, 0.03, 10, 28]} />
          <SoftGold />
        </mesh>
      ))}
      {/* perno e lancetta */}
      <mesh position={[0, pivotY, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.2, 24]} />
        <Gold env={0.9} />
      </mesh>
      <mesh position={[0, pivotY + 0.32, 0]}>
        <coneGeometry args={[0.06, 0.3, 16]} />
        <Gold env={0.9} glow={0.2} />
      </mesh>
      {/* giogo: barra affusolata che ruota attorno al perno */}
      <group position={[0, pivotY, 0]} rotation={[0, 0, tilt]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, arm * 2, 16]} />
          <SoftGold />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.035, arm * 0.7, 16]} />
          <SoftGold />
        </mesh>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[sd * arm, 0, 0]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <SoftGold />
          </mesh>
        ))}
      </group>
      {pan(-1, <Heart scale={0.36} position={[0, 0.34, 0]} rotation={[0, 0.25, 0]} glow={0.3} />)}
      {pan(
        1,
        <mesh position={[0, 0.2, 0]} rotation={[0.4, 0.6, 0.2]}>
          <dodecahedronGeometry args={[0.24, 0]} />
          <meshStandardMaterial color="#20232c" roughness={0.85} metalness={0.15} />
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
export const SpotCone: React.FC<{from: [number, number, number]; to: [number, number, number]; on: number; color?: string}> = ({from, to, on, color = '#D6E6FF'}) => {
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


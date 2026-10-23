import React, {useMemo} from 'react';
import {useFrame, useThree, type ThreeElements} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {random, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';

export const FPS = 60;
export const W = 1920;
export const H = 1080;

export const GOLD = '#FFB547';
export const RED = '#7A0B0B';
export const HOTRED = '#FF2414';

/** Palette della scena: il rosso di One of One o un blu notte per i pezzi più chill */
export type Palette = {wall: string; hot: string; fog: string; floor: string; dust: string; warm: string; css: {bg: string; ink: string; glow: string}};
export const RED_PALETTE: Palette = {
  wall: RED,
  hot: HOTRED,
  fog: '#050000',
  floor: '#1a0303',
  dust: '#FFC56B',
  warm: '#FF6A3A',
  css: {bg: '#3a0303', ink: '227,20,27', glow: '255,90,60'},
};
export const BLUE_PALETTE: Palette = {
  wall: '#0C1C4D',
  hot: '#3D7BFF',
  fog: '#01030A',
  floor: '#040A1C',
  dust: '#BFD8FF',
  warm: '#7FB0FF',
  css: {bg: '#06123a', ink: '70,130,255', glow: '90,150,255'},
};
const PalCtx = React.createContext<Palette>(RED_PALETTE);
export const PaletteProvider = PalCtx.Provider;
export const usePal = () => React.useContext(PalCtx);

export const prog = (f: number, a: number, b: number) => Math.min(1, Math.max(0, (f - a) / (b - a)));
export const ease = (t: number) => t * t * (3 - 2 * t);
export const easeOut = (t: number) => 1 - (1 - t) ** 3;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: number[], b: number[], t: number): [number, number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** Telecamera guidata a ogni fotogramma (posizione + punto guardato) con un filo di "mano" */
export const Rig: React.FC<{pos: number[]; look: number[]; shake?: number; fov?: number}> = ({pos, look, shake = 0, fov}) => {
  const {camera} = useThree();
  const f = useCurrentFrame();
  const n = (k: string) => (Math.sin(f * 0.031 + k.length) * 0.6 + Math.sin(f * 0.017 + k.length * 3) * 0.4) * 0.03;
  const j = shake ? (random(`sh${f}`) - 0.5) * shake : 0;
  camera.position.set(pos[0] + n('x') + j, pos[1] + n('yy') + j * 0.6, pos[2]);
  if (fov && (camera as THREE.PerspectiveCamera).fov !== fov) {
    (camera as THREE.PerspectiveCamera).fov = fov;
    camera.updateProjectionMatrix();
  }
  camera.lookAt(look[0] + n('lx'), look[1] + n('lyy'), look[2]);
  return null;
};

/** Riflessi d'ambiente (servono all'oro) + nebbia scura */
const Env: React.FC<{fog?: string; near?: number; far?: number}> = ({fog: fogIn, near = 8, far = 40}) => {
  const {gl, scene} = useThree();
  const fog = fogIn ?? usePal().fog;
  useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
    pmrem.dispose();
  }, [gl, scene]);
  scene.fog = new THREE.Fog(fog, near, far);
  scene.background = new THREE.Color(fog);
  return null;
};

/**
 * Bagliore: composer di three.js creato in modo sincrono, così è pronto già dal primo
 * fotogramma (quello di @react-three/postprocessing monta i passaggi in ritardo e
 * Remotion catturava fotogrammi neri).
 */
const BloomFX: React.FC<{strength: number}> = ({strength}) => {
  const {gl, scene, camera} = useThree();
  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.setPixelRatio(1);
    c.setSize(W, H);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), strength, 0.45, 0.82));
    c.addPass(new OutputPass());
    return c;
  }, [gl, scene, camera, strength]);
  useFrame(() => composer.render(), 1);
  return null;
};

/** Una scena 3D a tutto schermo con bagliore, vignetta e grana */
export const Stage: React.FC<{children: React.ReactNode; fog?: string; near?: number; far?: number; bloom?: number}> = ({children, fog, near, far, bloom = 0.75}) => {
  // la palette viene ripassata dentro la tela 3D, che ha un suo albero React
  const pal = usePal();
  return (
  <ThreeCanvas width={W} height={H} camera={{position: [0, 2, 10], fov: 38, near: 0.1, far: 200}} gl={{antialias: true, preserveDrawingBuffer: true}}>
    <PaletteProvider value={pal}>
    <Env fog={fog} near={near} far={far} />
    {children}
    </PaletteProvider>
    <BloomFX strength={bloom} />
  </ThreeCanvas>
  );
};

export const Gold: React.FC<{glow?: number; env?: number}> = ({glow = 0, env = 1.4}) => (
  <meshStandardMaterial color={GOLD} metalness={1} roughness={0.22} envMapIntensity={env} emissive="#FF8A1A" emissiveIntensity={glow} />
);
/** Materiale delle pareti (rosso o blu secondo la palette) */
export const Red: React.FC<{glow?: number; rough?: number}> = ({glow = 0, rough = 0.55}) => {
  const pal = usePal();
  return <meshStandardMaterial color={pal.wall} metalness={0.15} roughness={rough} emissive={pal.hot} emissiveIntensity={glow} />;
};
export const Glow: React.FC<{color?: string; k?: number}> = ({color = '#FFFFFF', k = 3}) => <meshStandardMaterial color="#000" emissive={color} emissiveIntensity={k} toneMapped={false} />;

/** Pavimento lucido scuro */
export const Floor: React.FC<{y?: number; color?: string; size?: number}> = ({y = 0, color: colorIn, size = 200}) => {
  const color = colorIn ?? usePal().floor;
  return (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
    <planeGeometry args={[size, size]} />
    <meshStandardMaterial color={color} metalness={0.5} roughness={0.35} envMapIntensity={0.12} />
  </mesh>
  );
};

/** Pulviscolo dorato che fluttua */
export const Dust: React.FC<{n?: number; box?: [number, number, number]; center?: [number, number, number]; seed?: string; size?: number; color?: string}> = ({
  n = 160,
  box = [16, 9, 12],
  center = [0, 3, 0],
  seed = 'd',
  size = 0.025,
  color: colorIn,
}) => {
  const color = colorIn ?? usePal().dust;
  const f = useCurrentFrame();
  const ref = React.useRef<THREE.InstancedMesh>(null);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const base = useMemo(
    () =>
      Array.from({length: n}, (_, i) => [
        (random(`${seed}x${i}`) - 0.5) * box[0],
        (random(`${seed}y${i}`) - 0.5) * box[1],
        (random(`${seed}z${i}`) - 0.5) * box[2],
        0.4 + random(`${seed}s${i}`),
        random(`${seed}p${i}`) * 100,
      ]),
    [n, seed, box],
  );
  React.useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    base.forEach(([x, y, z, s, p], i) => {
      const yy = ((y + f * 0.004 * s + box[1] / 2) % box[1]) - box[1] / 2;
      const tw = 0.5 + 0.5 * Math.sin(f * 0.08 + p);
      m.makeScale(s * tw, s * tw, s * tw);
      m.setPosition(center[0] + x + Math.sin(f * 0.01 + p) * 0.2, center[1] + yy, center[2] + z);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshStandardMaterial color="#000" emissive={color} emissiveIntensity={1.6} toneMapped={false} />
    </instancedMesh>
  );
};

/** Figurina luminosa (stile sagoma) */
export const Figure: React.FC<{glow?: number; walk?: number} & ThreeElements['group']> = ({glow = 3, walk = 0, ...g}) => {
  const sw = Math.sin(walk) * 0.35;
  return (
    <group {...g}>
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.2, 24, 24]} />
        <Glow k={glow} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <capsuleGeometry args={[0.2, 0.5, 8, 16]} />
        <Glow k={glow} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.1, 0.72, 0]} rotation={[sw * s, 0, 0]}>
          <mesh position={[0, -0.36, 0]}>
            <capsuleGeometry args={[0.075, 0.55, 6, 12]} />
            <Glow k={glow} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((s) => (
        <group key={`a${s}`} position={[s * 0.27, 1.25, 0]} rotation={[-sw * s, 0, s * 0.12]}>
          <mesh position={[0, -0.28, 0]}>
            <capsuleGeometry args={[0.06, 0.45, 6, 12]} />
            <Glow k={glow} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** Lampione con cono di luce volumetrico (on 0→1) */
export const Lamp: React.FC<{on: number} & ThreeElements['group']> = ({on, ...g}) => (
  <group {...g}>
    <mesh position={[0, 2.2, 0]}>
      <cylinderGeometry args={[0.06, 0.09, 4.4, 16]} />
      <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.4} />
    </mesh>
    <mesh position={[0.45, 4.35, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.04, 0.04, 0.9, 12]} />
      <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.4} />
    </mesh>
    <mesh position={[0.9, 4.25, 0]}>
      <coneGeometry args={[0.32, 0.3, 24, 1, true]} />
      <Gold />
    </mesh>
    <mesh position={[0.9, 4.12, 0]}>
      <sphereGeometry args={[0.13, 16, 16]} />
      <Glow color="#FFD7A0" k={on * 6} />
    </mesh>
    {on > 0 && (
      <>
        <mesh position={[0.9, 2.05, 0]}>
          <coneGeometry args={[1.6, 4.1, 48, 1, true]} />
          <meshBasicMaterial color="#FF3A1E" transparent opacity={0.06 * on} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <spotLight position={[0.9, 4.1, 0]} angle={0.5} penumbra={0.6} intensity={60 * on} distance={14} color="#FF6A3A" target-position={[0.9, 0, 0]} />
        <mesh position={[0.9, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.7, 48]} />
          <meshBasicMaterial color="#FF3A1A" transparent opacity={0.16 * on} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </>
    )}
  </group>
);

/** Stella d'oro estrusa */
export const Star: React.FC<{glow?: number} & ThreeElements['group']> = ({glow = 0.4, ...g}) => {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? 0.42 : 1;
      if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    s.closePath();
    const geom = new THREE.ExtrudeGeometry(s, {depth: 0.25, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 4});
    geom.center();
    return geom;
  }, []);
  return (
    <group {...g}>
      <mesh geometry={geo}>
        <Gold glow={glow} />
      </mesh>
    </group>
  );
};

/** Labirinto (backtracking ricorsivo con seme fisso) + percorso dall'ingresso all'uscita */
export const makeMaze = (n: number, seed: string) => {
  // muri: per ogni cella [nord, est, sud, ovest]
  const walls = Array.from({length: n * n}, () => [true, true, true, true]);
  const seen = new Array(n * n).fill(false);
  const stack = [0];
  seen[0] = true;
  let k = 0;
  const dirs: [number, number, number, number][] = [
    [0, -1, 0, 2],
    [1, 0, 1, 3],
    [0, 1, 2, 0],
    [-1, 0, 3, 1],
  ];
  while (stack.length) {
    const c = stack[stack.length - 1];
    const x = c % n;
    const y = Math.floor(c / n);
    const opts = dirs.filter(([dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      return nx >= 0 && ny >= 0 && nx < n && ny < n && !seen[ny * n + nx];
    });
    if (!opts.length) {
      stack.pop();
      continue;
    }
    const [dx, dy, w, ow] = opts[Math.floor(random(`${seed}${k++}`) * opts.length)];
    const nc = (y + dy) * n + x + dx;
    walls[c][w] = false;
    walls[nc][ow] = false;
    seen[nc] = true;
    stack.push(nc);
  }
  // ingresso al centro, uscita sul bordo est in basso
  const start = Math.floor(n / 2) * n + Math.floor(n / 2);
  const exit = (n - 1) * n + (n - 1);
  walls[exit][1] = false;
  const prev = new Array(n * n).fill(-1);
  const q = [start];
  const vis = new Array(n * n).fill(false);
  vis[start] = true;
  while (q.length) {
    const c = q.shift()!;
    const x = c % n;
    const y = Math.floor(c / n);
    dirs.forEach(([dx, dy, w]) => {
      if (walls[c][w]) return;
      const nc = (y + dy) * n + x + dx;
      if (nc < 0 || nc >= n * n || vis[nc] || x + dx < 0 || x + dx >= n) return;
      vis[nc] = true;
      prev[nc] = c;
      q.push(nc);
    });
  }
  const path: number[] = [];
  for (let c = exit; c !== -1; c = prev[c]) path.unshift(c);
  return {walls, path, n};
};

export const Maze: React.FC<{maze: ReturnType<typeof makeMaze>; cell?: number; h?: number; edge?: number}> = ({maze, cell = 1.2, h = 0.9, edge = 2.2}) => {
  const {walls, n} = maze;
  const hot = usePal().hot;
  const off = ((n - 1) * cell) / 2;
  const t = 0.12;
  const segs: [number, number, number, number][] = []; // x, z, lunghezza, orientamento (0 = lungo x)
  walls.forEach((w, c) => {
    const x = (c % n) * cell - off;
    const z = Math.floor(c / n) * cell - off;
    if (w[0]) segs.push([x, z - cell / 2, cell + t, 0]);
    if (w[3]) segs.push([x - cell / 2, z, cell + t, 1]);
    if (Math.floor(c / n) === n - 1 && w[2]) segs.push([x, z + cell / 2, cell + t, 0]);
    if (c % n === n - 1 && w[1]) segs.push([x + cell / 2, z, cell + t, 1]);
  });
  return (
    <group>
      {segs.map(([x, z, l, o], i) => (
        <group key={i} position={[x, h / 2, z]}>
          <mesh>
            <boxGeometry args={o ? [t, h, l] : [l, h, t]} />
            <Red />
          </mesh>
          <mesh position={[0, h / 2 + 0.005, 0]}>
            <boxGeometry args={o ? [t * 1.05, 0.02, l] : [l, 0.02, t * 1.05]} />
            <Glow color={hot} k={edge} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export const cellPos = (maze: ReturnType<typeof makeMaze>, c: number, cell = 1.2): [number, number] => {
  const off = ((maze.n - 1) * cell) / 2;
  return [(c % maze.n) * cell - off, Math.floor(c / maze.n) * cell - off];
};

/** posizione lungo il percorso (t 0→1), con l'uscita prolungata fuori dal bordo */
export const pathAt = (maze: ReturnType<typeof makeMaze>, t: number, cell = 1.2): [number, number, number] => {
  const pts = maze.path.map((c) => cellPos(maze, c, cell));
  const last = pts[pts.length - 1];
  pts.push([last[0] + cell * 2.5, last[1]]);
  const u = Math.min(0.9999, Math.max(0, t)) * (pts.length - 1);
  const i = Math.floor(u);
  const a = pts[i];
  const b = pts[i + 1];
  const k = u - i;
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(b[0] - a[0], b[1] - a[1])];
};

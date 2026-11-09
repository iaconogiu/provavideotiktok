import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, random, staticFile, useCurrentFrame} from 'remotion';
import data from './words.json';

/**
 * "Se regnasse l'arte" — versione 3D. Le parole stanno sospese in una città di notte sotto la
 * pioggia, a profondità e angoli diversi; una telecamera virtuale vola da una parola all'altra
 * mentre vengono cantate (spinta, rotazione, rollio), con profondità di campo, scia di movimento,
 * pavimento bagnato che riflette le luci e pioggia che reagisce alla velocità della camera.
 */

export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const DURATION = data.duration;
export const ARTE_FRAMES = Math.round(DURATION * FPS);
type Word = {text: string; line: number; start: number};
const WORDS = data.words as Word[];
const BEATS = data.beats as number[];

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const prog = (g: number, a: number, b: number) => clamp((g - a) / (b - a));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const beatPulse = (t: number, k = 10) => {
  let last = -10;
  for (const b of BEATS) {
    if (b <= t + 0.01) last = b;
    else break;
  }
  return Math.exp(-(t - last) * k);
};

const WIDE = '"AUnb", sans-serif';
const MONO = '"AMono", monospace';
const useFonts = () => {
  const [handle] = useState(() => delayRender('font Arte 3D'));
  useEffect(() => {
    Promise.all([
      new FontFace('AUnb', `url(${staticFile('arte/font/Unbounded.ttf')})`, {weight: '200 900'}).load(),
      new FontFace('AMono', `url(${staticFile('arte/font/SpaceMonoItalic.ttf')})`).load(),
    ])
      .then((fs) => fs.forEach((f) => document.fonts.add(f)))
      .finally(() => continueRender(handle));
  }, [handle]);
};

// ── parole ──
const norm = (s: string) => s.toLowerCase().replace(/[^a-zàèéìòù']/g, '');
const SMALL = new Set("come il lo la l' le i un una se da di in ci ti mi che con per ma o e non tu cui sarà son lì nelle forse certo sarei solo bene tutti".split(' '));
const ACCENT = new Set(["l'arte", 'disparte', 'vero', "l'odio", 'fredde', 'assente', 'gente', 'dispersi', 'casa', 'artista']);
const isSmall = (w: Word) => SMALL.has(norm(w.text));
const isAccent = (w: Word) => ACCENT.has(norm(w.text));
const COLD = (line: number) => line >= 12 && line <= 14; // "veniamo tutti da case fredde…": luce fredda

// ── mondo: ogni parola forte ha un posto nello spazio ──
type V3 = {x: number; y: number; z: number};
type Placed = {w: Word; p: V3; yaw: number; pitch: number; size: number; small: Placed[]; idx: number};
const D = 520; // distanza della camera dalla parola che guarda

let ctx: CanvasRenderingContext2D | null = null;
const textW = (t: string, font: string) => {
  ctx ??= document.createElement('canvas').getContext('2d');
  if (!ctx) return t.length * 60;
  ctx.font = font;
  return ctx.measureText(t).width;
};

let WORLD: Placed[] | null = null;
const world = (): Placed[] => {
  if (WORLD) return WORLD;
  const out: Placed[] = [];
  let base: V3 = {x: 0, y: 0, z: 0};
  let heading = 0;
  let pendingSmall: Word[] = [];
  let lastLine = -1;
  let k = 0;
  WORDS.forEach((w) => {
    if (isSmall(w)) {
      pendingSmall.push(w);
      return;
    }
    if (w.line !== lastLine && out.length) {
      // nuova frase: la strada gira e sale/scende
      const prev = out[out.length - 1].p;
      heading += (random(`h${w.line}`) > 0.5 ? 1 : -1) * (0.55 + random(`hh${w.line}`) * 0.35);
      base = {x: prev.x + Math.sin(heading) * 1100, y: prev.y + (random(`y${w.line}`) - 0.5) * 500, z: prev.z - Math.cos(heading) * 1100};
      k = 0;
    }
    lastLine = w.line;
    const up = w.text.toUpperCase();
    const size = Math.min(250, (980 / textW(up, `800 100px ${WIDE}`)) * 100);
    const side = k % 2 ? 1 : -1;
    const fwd = k * 780;
    const lat = side * 230;
    const p = {
      x: base.x + Math.sin(heading) * fwd + Math.cos(heading) * lat,
      y: base.y + ((k % 3) - 1) * 170,
      z: base.z - Math.cos(heading) * fwd + Math.sin(heading) * lat,
    };
    const yaw = heading - side * 0.32;
    const pitch = ((k % 3) - 1) * -0.12;
    const pl: Placed = {w, p, yaw, pitch, size, small: [], idx: out.length};
    // le parole piccole davanti si attaccano a questa, sopra
    pendingSmall.forEach((s) => pl.small.push({w: s, p, yaw, pitch, size: 52, small: [], idx: -1}));
    pendingSmall = [];
    out.push(pl);
    k++;
  });
  // parole piccole finali (dopo l'ultima forte della riga): vanno sotto la precedente
  if (pendingSmall.length) out[out.length - 1].small.push(...pendingSmall.map((s) => ({w: s, p: out[out.length - 1].p, yaw: 0, pitch: 0, size: 52, small: [], idx: -1})));
  // si memorizza solo quando i font sono pronti (le misure dipendono dal font)
  if (typeof document !== 'undefined' && document.fonts.check(`800 100px ${WIDE}`)) WORLD = out;
  return out;
};

// ── telecamera ──
type Cam = {x: number; y: number; z: number; yaw: number; pitch: number; roll: number};
const camFor = (pl: Placed, i: number): Cam => {
  const side = random(`cs${i}`) > 0.5 ? 1 : -1;
  const yaw = pl.yaw + side * 0.18;
  const dist = D + (pl.size < 150 ? -60 : 0);
  return {
    x: pl.p.x + Math.sin(yaw) * dist,
    y: pl.p.y - 40 + (random(`cy${i}`) - 0.5) * 120,
    z: pl.p.z + Math.cos(yaw) * dist,
    yaw,
    pitch: pl.pitch * 0.6 + (random(`cp${i}`) - 0.5) * 0.08,
    roll: (random(`cr${i}`) - 0.5) * (isAccent(pl.w) ? 0.22 : 0.1),
  };
};
const mix = (a: Cam, b: Cam, t: number): Cam => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  z: lerp(a.z, b.z, t),
  yaw: lerp(a.yaw, b.yaw, t),
  pitch: lerp(a.pitch, b.pitch, t),
  roll: lerp(a.roll, b.roll, t),
});
const camera = (g: number): Cam => {
  const W3 = world();
  let cam = camFor(W3[0], 0);
  // partenza: lontano e in alto, poi scende sulla prima parola
  cam = {...cam, z: cam.z + 2200, y: cam.y - 500, pitch: 0.25};
  W3.forEach((pl, i) => {
    const s = pl.w.start - 0.06;
    const prev = W3[i - 1];
    const newPhrase = !prev || prev.w.line !== pl.w.line;
    const dur = newPhrase ? 0.55 : Math.min(0.42, Math.max(0.2, pl.w.start - (prev?.w.start ?? 0)));
    const t = prog(g, s, s + dur);
    if (t > 0) cam = mix(cam, camFor(pl, i), easeInOut(t));
  });
  // l'intermezzo: orbita lenta attorno a "l'arte"
  const orb = prog(g, 1.7, 5.3);
  if (orb > 0 && orb < 1) {
    const pl = W3.find((x) => norm(x.w.text) === "l'arte")!;
    const a = pl.yaw + Math.sin(orb * Math.PI) * 0.9;
    const r = D + 250 * Math.sin(orb * Math.PI);
    const o: Cam = {x: pl.p.x + Math.sin(a) * r, y: pl.p.y - 60 - 260 * Math.sin(orb * Math.PI), z: pl.p.z + Math.cos(a) * r, yaw: a, pitch: 0.18 * Math.sin(orb * Math.PI), roll: -0.06};
    cam = mix(cam, o, Math.sin(orb * Math.PI) ** 0.5);
  }
  // finale: la camera si allontana e sale
  const fin = easeInOut(prog(g, 28.25, DURATION + 0.4));
  if (fin > 0) cam = {...cam, z: cam.z + Math.cos(cam.yaw) * 900 * fin, x: cam.x + Math.sin(cam.yaw) * 900 * fin, y: cam.y - 300 * fin};
  // mano: piccolo respiro continuo
  return {...cam, x: cam.x + Math.sin(g * 0.9) * 14, y: cam.y + Math.sin(g * 1.3) * 10, roll: cam.roll + Math.sin(g * 0.7) * 0.015};
};

/** posizione di un punto nello spazio della camera (z negativo = davanti) */
const toCam = (p: V3, c: Cam) => {
  const x = p.x - c.x;
  const y = p.y - c.y;
  const z = p.z - c.z;
  const cy = Math.cos(-c.yaw);
  const sy = Math.sin(-c.yaw);
  return {x: x * cy + z * sy, y, z: -x * sy + z * cy};
};

const PERSP = 1500;

const WordView: React.FC<{pl: Placed; g: number; cam: Cam; cur: boolean}> = ({pl, g, cam, cur}) => {
  const t = g - (pl.w.start - 0.04);
  if (t < 0) return null;
  const cs = toCam(pl.p, cam);
  const depth = -cs.z;
  if (depth < 120 || depth > 6000) return null;
  const k = Math.exp(-t * 16);
  const blur = Math.min(9, Math.abs(depth - D) / 260) + k * 6;
  const fog = clamp(1 - (depth - 1500) / 3500);
  const acc = isAccent(pl.w);
  const cold = COLD(pl.w.line);
  const accC = cold ? '#7FE6FF' : '#FF8A2A';
  const color = acc ? accC : cur ? '#F2F6FF' : '#8D9BB5';
  const glow = acc ? `0 0 30px ${accC}, 0 0 80px ${accC}66` : cur ? '0 0 26px rgba(170,200,255,0.45)' : 'none';
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: `translate3d(${pl.p.x}px, ${pl.p.y}px, ${pl.p.z}px) rotateY(${pl.yaw}rad) rotateX(${pl.pitch}rad) translate(-50%, -50%) scale(${1 + 0.5 * k})`,
        opacity: Math.min(1, t / 0.05) * fog,
        filter: blur > 0.6 ? `blur(${blur.toFixed(1)}px)` : undefined,
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      {/* parole piccole sopra: mono corsivo, entrano a tempo */}
      <div style={{fontFamily: MONO, fontSize: 58, color: '#A9BCDD', letterSpacing: '0.06em', height: 72, marginBottom: 8}}>
        {pl.small
          .filter((s) => g >= s.w.start - 0.04)
          .map((s, i) => (
            <span key={i} style={{opacity: Math.min(1, (g - s.w.start + 0.04) / 0.1), marginRight: 18}}>
              {s.w.text}
            </span>
          ))}
      </div>
      <div
        style={{
          fontFamily: WIDE,
          fontWeight: 800,
          fontSize: pl.size,
          lineHeight: 1,
          color,
          textShadow: glow,
          letterSpacing: `${-0.01 + k * 0.1}em`,
        }}
      >
        {pl.w.text.toUpperCase()}
      </div>
    </div>
  );
};

/** pavimento bagnato: griglia che riflette le luci, segue la camera */
const Floor: React.FC<{cam: Cam; cold: number}> = ({cam, cold}) => {
  const step = 400;
  const fx = Math.round(cam.x / step) * step;
  const fz = Math.round(cam.z / step) * step;
  const c = cold > 0.5 ? '120,220,255' : '255,140,60';
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 12000,
        height: 12000,
        transform: `translate3d(${fx}px, ${cam.y + 1000}px, ${fz}px) translate(-50%, -50%) rotateX(90deg)`,
        backgroundColor: 'rgba(4,6,12,0.9)',
        backgroundImage: `linear-gradient(rgba(${c},0.45) 3px, transparent 3px), linear-gradient(90deg, rgba(${c},0.45) 3px, transparent 3px), radial-gradient(closest-side, rgba(${c},0.12), transparent)`,
        backgroundSize: `${step}px ${step}px, ${step}px ${step}px, 100% 100%`,
        backgroundPosition: 'center',
        WebkitMaskImage: 'radial-gradient(closest-side, #000 20%, transparent 75%)',
      }}
    />
  );
};

/** luci della città lontane, sfocate */
const Bokeh: React.FC<{cam: Cam; cold: number}> = ({cam, cold}) => (
  <>
    {Array.from({length: 46}, (_, i) => {
      const a = random(`bk${i}`) * Math.PI * 2;
      const r = 5000 + random(`br${i}`) * 3000;
      const p = {x: Math.sin(a) * r, y: -300 + random(`by${i}`) * 1100, z: -Math.cos(a) * r};
      const cs = toCam(p, {...cam, x: cam.x * 0.15, z: cam.z * 0.15});
      if (-cs.z < 200) return null;
      const s = PERSP / -cs.z;
      const sx = W / 2 + cs.x * s;
      const sy = H / 2 + (cs.y - 0) * s;
      if (sx < -200 || sx > W + 200) return null;
      const sz = 30 + random(`bs${i}`) * 70;
      const hue = random(`bc${i}`);
      const col = cold > 0.5 ? (hue > 0.5 ? '120,220,255' : '180,200,255') : hue > 0.6 ? '255,150,60' : hue > 0.3 ? '255,90,70' : '160,200,255';
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: sx - sz / 2,
            top: sy - sz / 2,
            width: sz,
            height: sz,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${col},0.55) 0%, rgba(${col},0.15) 50%, transparent 70%)`,
          }}
        />
      );
    })}
  </>
);

/** pioggia: righe sottili, più inclinate quando la camera si muove di lato */
const Rain: React.FC<{g: number; vx: number}> = ({g, vx}) => (
  <>
    {Array.from({length: 90}, (_, i) => {
      const x0 = random(`rx${i}`) * (W + 400) - 200;
      const sp = 2600 + random(`rs${i}`) * 1600;
      const len = 60 + random(`rl${i}`) * 120;
      const y = ((random(`ry${i}`) * (H + 400) + g * sp) % (H + 400)) - 200;
      const ang = Math.max(-35, Math.min(35, -vx * 0.012)) + 8;
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x0 - (y * Math.tan((ang * Math.PI) / 180)) * 0.3,
            top: y,
            width: 2,
            height: len,
            background: 'linear-gradient(transparent, rgba(190,210,255,0.35))',
            transform: `rotate(${ang}deg)`,
          }}
        />
      );
    })}
  </>
);

export const Arte: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const g = frame / FPS;
  const W3 = world();
  const cam = camera(g);
  const prev = camera(g - 1 / FPS);
  const speed = Math.hypot(cam.x - prev.x, cam.y - prev.y, cam.z - prev.z) * FPS + Math.abs(cam.yaw - prev.yaw) * FPS * 900;
  const vx = (cam.x - prev.x) * Math.cos(cam.yaw) * FPS - (cam.z - prev.z) * Math.sin(cam.yaw) * FPS + (cam.yaw - prev.yaw) * FPS * 1200;
  const shown = W3.filter((p) => g >= p.w.start - 0.04);
  const cur = shown[shown.length - 1];
  const coldNow = cur && COLD(cur.w.line) ? 1 : 0;
  const bp = beatPulse(g);
  const motionBlur = Math.min(7, speed / 900);
  const accHit = cur && isAccent(cur.w) ? Math.exp(-(g - cur.w.start) * 6) : 0;
  const fade = Math.max(1 - prog(g, 0, 0.5), prog(g, DURATION - 0.4, DURATION));
  const f2 = Math.floor(frame / 2);
  const sky = coldNow
    ? 'linear-gradient(180deg, #02060C 0%, #071624 45%, #0C2A3A 62%, #03080E 100%)'
    : 'linear-gradient(180deg, #02030A 0%, #08101F 45%, #1A1420 62%, #04050A 100%)';
  return (
    <AbsoluteFill style={{background: '#03040A', overflow: 'hidden'}}>
      <AbsoluteFill style={{background: sky}} />
      <Bokeh cam={cam} cold={coldNow} />
      {/* mondo 3D */}
      <AbsoluteFill style={{perspective: PERSP, perspectiveOrigin: '50% 50%', filter: motionBlur > 0.5 ? `blur(${motionBlur.toFixed(1)}px)` : undefined}}>
        <div
          style={{
            position: 'absolute',
            left: W / 2,
            top: H / 2,
            width: 0,
            height: 0,
            transformStyle: 'preserve-3d',
            transform: `scale(${1 + bp * 0.015 + accHit * 0.04}) rotateZ(${-cam.roll}rad) rotateX(${-cam.pitch}rad) rotateY(${-cam.yaw}rad) translate3d(${-cam.x}px, ${-cam.y}px, ${-cam.z}px)`,
          }}
        >
          <Floor cam={cam} cold={coldNow} />
          {W3.map((pl) => (
            <WordView key={pl.idx} pl={pl} g={g} cam={cam} cur={pl === cur} />
          ))}
        </div>
      </AbsoluteFill>
      <Rain g={g} vx={vx} />
      {/* bagliore sulle parole chiave */}
      {accHit > 0.02 && <AbsoluteFill style={{background: `radial-gradient(60% 40% at 50% 50%, ${coldNow ? 'rgba(120,230,255,' : 'rgba(255,140,50,'}${accHit * 0.25}) 0%, transparent 70%)`, mixBlendMode: 'screen'}} />}
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('simba/grain.png')})`,
          backgroundPosition: `${Math.floor(random(`g${f2}`) * 512)}px ${Math.floor(random(`h${f2}`) * 512)}px`,
          mixBlendMode: 'overlay',
          opacity: 0.14,
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(95% 65% at 50% 50%, transparent 50%, rgba(0,0,0,0.65) 100%)'}} />
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
      <Audio src={staticFile('arte/audio.m4a')} />
    </AbsoluteFill>
  );
};

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

// ── mondo: ogni frase è un cartellone sospeso nello spazio ──
type V3 = {x: number; y: number; z: number};
type Row = {kind: 'big' | 'small'; words: Word[]; size: number};
type Plate = {line: number; words: Word[]; rows: Row[]; p: V3; yaw: number; pitch: number; h: number; start: number; end: number};
const PERSP = 1500;
const PLATE_W = 1000;

let ctx: CanvasRenderingContext2D | null = null;
const textW = (t: string, font: string) => {
  ctx ??= document.createElement('canvas').getContext('2d');
  if (!ctx) return t.length * 60;
  ctx.font = font;
  return ctx.measureText(t).width;
};

/** impagina la frase: parole forti su righe grandi, quelle di passaggio su righe medie */
const layoutRows = (ws: Word[]): Row[] => {
  const rows: Row[] = [];
  let pend: Word[] = [];
  const flush = () => {
    if (!pend.length) return;
    const txt = pend.map((w) => w.text).join(' ');
    rows.push({kind: 'small', words: pend, size: Math.min(96, (PLATE_W / textW(txt, `100px ${MONO}`)) * 100)});
    pend = [];
  };
  ws.forEach((w) => {
    if (isSmall(w)) return void pend.push(w);
    flush();
    const up = w.text.toUpperCase();
    const prev = rows[rows.length - 1];
    // due parole forti corte stanno insieme sulla stessa riga
    if (prev && prev.kind === 'big' && prev.words.length === 1 && prev.words[0].text.length + w.text.length <= 10) {
      const both = `${prev.words[0].text.toUpperCase()} ${up}`;
      prev.words.push(w);
      prev.size = Math.min(250, (PLATE_W / textW(both, `800 100px ${WIDE}`)) * 100);
      return;
    }
    rows.push({kind: 'big', words: [w], size: Math.min(250, (PLATE_W / textW(up, `800 100px ${WIDE}`)) * 100)});
  });
  flush();
  return rows;
};

let PLATES: Plate[] | null = null;
const plates = (): Plate[] => {
  if (PLATES) return PLATES;
  const lines = [...new Set(WORDS.map((w) => w.line))];
  let pos: V3 = {x: 0, y: 0, z: 0};
  let heading = 0;
  const out = lines.map((line, i) => {
    const words = WORDS.filter((w) => w.line === line);
    const rows = layoutRows(words);
    const h = rows.reduce((a, r) => a + r.size * (r.kind === 'big' ? 1.02 : 1.25), 0);
    if (i > 0) {
      heading += (random(`h${line}`) > 0.5 ? 1 : -1) * (0.5 + random(`hh${line}`) * 0.4);
      pos = {x: pos.x + Math.sin(heading) * 2300, y: pos.y + (random(`y${line}`) - 0.5) * 700, z: pos.z - Math.cos(heading) * 2300};
    }
    const next = WORDS.find((w) => w.line === line + 1);
    return {
      line,
      words,
      rows,
      p: pos,
      yaw: heading + (random(`py${line}`) - 0.5) * 0.5,
      pitch: (random(`pp${line}`) - 0.5) * 0.25,
      h,
      start: words[0].start,
      end: next ? next.start : DURATION + 1,
    };
  });
  if (typeof document !== 'undefined' && document.fonts.check(`800 100px ${WIDE}`)) PLATES = out;
  return out;
};

// ── telecamera ──
type Cam = {x: number; y: number; z: number; yaw: number; pitch: number; roll: number};
const KEYS_ = ['x', 'y', 'z', 'yaw', 'pitch', 'roll'] as const;
/** distanza perché tutta la frase stia nello schermo, il più grande possibile */
const distFor = (pl: Plate) => Math.max(PERSP * (PLATE_W / (W * 0.72)) - PERSP, PERSP * (pl.h / (H * 0.58)) - PERSP, 300);
const camFor = (pl: Plate, push = 0, swing = 0): Cam => {
  const side = random(`cs${pl.line}`) > 0.5 ? 1 : -1;
  const yaw = pl.yaw + side * (0.06 + swing);
  const dist = distFor(pl) * (1 - push);
  return {
    x: pl.p.x + Math.sin(yaw) * dist,
    y: pl.p.y - 20,
    z: pl.p.z + Math.cos(yaw) * dist,
    yaw,
    pitch: pl.pitch * 0.7,
    roll: (random(`cr${pl.line}`) - 0.5) * 0.08,
  };
};
const mix = (a: Cam, b: Cam, t: number): Cam => {
  const o = {} as Cam;
  KEYS_.forEach((k) => (o[k] = lerp(a[k], b[k], t)));
  return o;
};
const TRAVEL = 0.42; // quanto dura il volo verso la frase nuova (parte quando la frase comincia)

/**
 * la camera resta sulla frase mentre viene cantata (si avvicina piano e gira appena),
 * e parte verso la frase dopo esattamente quando questa comincia.
 */
const camera = (g: number): Cam => {
  const P = plates();
  let idx = P.findIndex((pl) => g < pl.end) ;
  if (idx < 0) idx = P.length - 1;
  const pl = P[idx];
  // sosta: dall'arrivo alla partenza, spinta lenta in avanti
  const hold = (x: Plate, gg: number) => {
    const a = x.start + (x.line === 0 ? 0 : TRAVEL);
    const t = prog(gg, a, x.end);
    // la prima frase ha la pausa strumentale: la camera ci gira attorno
    const orb = x.line === 0 ? Math.sin(prog(gg, 1.6, 5.4) * Math.PI) : 0;
    const swing = x.line === 0 ? orb * 0.35 : t * 0.05;
    return camFor(x, 0.05 + t * 0.12 - orb * 0.45, swing);
  };
  if (idx === 0) {
    // entrata: dall'alto e lontano
    const c = hold(pl, g);
    const far = {...c, x: c.x + Math.sin(c.yaw) * 2600, z: c.z + Math.cos(c.yaw) * 2600, y: c.y - 700, pitch: 0.3};
    return mix(far, c, easeInOut(prog(g, -0.3, 0.45)));
  }
  const prevPl = P[idx - 1];
  const from = hold(prevPl, pl.start);
  const to = hold(pl, g);
  const t = prog(g, pl.start - 0.02, pl.start + TRAVEL);
  let c = t < 1 ? mix(from, to, easeInOut(t)) : to;
  // nel volo la camera si inclina nella curva
  c = {...c, roll: c.roll + Math.sin(t * Math.PI) * 0.12 * (pl.yaw > prevPl.yaw ? -1 : 1)};
  // finale: si allontana
  const fin = easeInOut(prog(g, 28.25, DURATION + 0.4));
  if (fin > 0) c = {...c, x: c.x + Math.sin(c.yaw) * 900 * fin, z: c.z + Math.cos(c.yaw) * 900 * fin, y: c.y - 250 * fin};
  return {...c, x: c.x + Math.sin(g * 0.9) * 8, y: c.y + Math.sin(g * 1.3) * 6};
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

/** un cartellone: le parole si accendono mentre vengono cantate */
const PlateView: React.FC<{pl: Plate; g: number; cam: Cam; vis: number; focus: boolean}> = ({pl, g, cam, vis, focus}) => {
  if (vis <= 0.01) return null;
  const depth = -toCam(pl.p, cam).z;
  if (depth < 80) return null;
  const blur = focus ? 0 : Math.min(8, Math.abs(depth - distFor(pl)) / 300);
  const cold = COLD(pl.line);
  const accC = cold ? '#7FE6FF' : '#FF8A2A';
  const curW = pl.words.filter((w) => w.start - 0.04 <= g).pop();
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: PLATE_W + 200,
        transform: `translate3d(${pl.p.x}px, ${pl.p.y}px, ${pl.p.z}px) rotateY(${pl.yaw}rad) rotateX(${pl.pitch}rad) translate(-50%, -50%)`,
        transformOrigin: '0 0',
        opacity: vis,
        filter: blur > 0.6 ? `blur(${blur.toFixed(1)}px)` : undefined,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      {pl.rows.map((r, ri) => (
        <div key={ri} style={{display: 'flex', gap: r.size * (r.kind === 'big' ? 0.25 : 0.4), height: r.size * (r.kind === 'big' ? 1.02 : 1.25), alignItems: 'center'}}>
          {r.words.map((w, wi) => {
            const t = g - (w.start - 0.04);
            const k = t >= 0 ? Math.exp(-t * 16) : 1;
            const acc = isAccent(w);
            const now = w === curW;
            const big = r.kind === 'big';
            const col = acc ? accC : now ? '#FFFFFF' : big ? '#C9D4E8' : '#B9CAE6';
            return (
              <span
                key={wi}
                style={{
                  display: 'inline-block',
                  fontFamily: big ? WIDE : MONO,
                  fontWeight: big ? 800 : 400,
                  fontSize: r.size,
                  lineHeight: 1,
                  color: col,
                  opacity: t < 0 ? 0 : Math.min(1, t / 0.05),
                  transform: `translateY(${k * r.size * 0.25}px) scale(${1 + 0.35 * (t >= 0 ? k : 0)})`,
                  filter: t >= 0 && t < 0.06 ? `blur(${(1 - t / 0.06) * 6}px)` : undefined,
                  textShadow: acc && t >= 0 ? `0 0 30px ${accC}, 0 0 80px ${accC}66` : now ? '0 0 26px rgba(170,200,255,0.45)' : 'none',
                  letterSpacing: big ? `${-0.01 + k * 0.08}em` : '0.02em',
                }}
              >
                {big ? w.text.toUpperCase() : w.text}
              </span>
            );
          })}
        </div>
      ))}
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
  const cam = camera(g);
  const prev = camera(g - 1 / FPS);
  const speed = Math.hypot(cam.x - prev.x, cam.y - prev.y, cam.z - prev.z) * FPS + Math.abs(cam.yaw - prev.yaw) * FPS * 900;
  const vx = (cam.x - prev.x) * Math.cos(cam.yaw) * FPS - (cam.z - prev.z) * Math.sin(cam.yaw) * FPS + (cam.yaw - prev.yaw) * FPS * 1200;
  const P = plates();
  const pi = Math.max(0, P.findIndex((pl) => g < pl.end));
  const cur = WORDS.filter((w) => w.start - 0.04 <= g).pop();
  const coldNow = COLD(P[pi].line) ? 1 : 0;
  const bp = beatPulse(g);
  const motionBlur = Math.min(7, speed / 900);
  const accHit = cur && isAccent(cur) ? Math.exp(-(g - cur.start) * 6) : 0;
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
          {P.map((pl, i) => {
            // si vede la frase in corso; quella prima sparisce durante il volo, la prossima appare da lontano
            const vis = i === pi ? 1 : i === pi - 1 ? 1 - prog(g, P[pi].start, P[pi].start + TRAVEL * 0.8) : i === pi + 1 ? 0.35 * prog(g, pl.start - 1.2, pl.start) : 0;
            return <PlateView key={pl.line} pl={pl} g={g} cam={cam} vis={vis} focus={i === pi} />;
          })}
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

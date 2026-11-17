import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, random, staticFile, useCurrentFrame} from 'remotion';
import data from './words.json';

/**
 * "Ti Dirò" (22simba, dall'album Miria) — reel di motion graphic.
 * Struttura da reel di motion design: campi di colore pieni che si alternano a tempo,
 * scritte larghe e corsivi, griglia di punti, sfera di particelle con le lettere in orbita,
 * grafico a curva, albero disegnato, palazzi che salgono, schermo che si divide, cartellone finale.
 * Colori presi dalla copertina di Miria: cielo al tramonto (lilla, pesca, arancio), l'albero,
 * l'inchiostro dei tatuaggi, l'oro della catena, la carta.
 */

export const FPS = 60;
export const W = 1920;
export const H = 1080;
export const DURATION = data.duration;
export const TIDIRO_FRAMES = Math.round(DURATION * FPS);
type Word = {text: string; line: number; start: number};
const WORDS = data.words as Word[];
const BEATS = data.beats as number[];

// palette di Miria
const C = {
  night: '#0E0C0B',
  ink: '#16233A', // inchiostro dei tatuaggi
  inkDeep: '#0B1322',
  lilac: '#8C7BB8', // cielo alto al tramonto
  peach: '#F2A27E',
  sunset: '#E8642C',
  ember: '#C8401E',
  gold: '#D9A946', // la catena
  skin: '#C79A7A',
  paper: '#F1E6D8',
  grass: '#4F6B3A',
};

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const prog = (g: number, a: number, b: number) => clamp((g - a) / (b - a));
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const expoOut = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeIn = (t: number) => t ** 3;
const spring = (t: number) => (t <= 0 ? 0 : 1 - Math.exp(-t * 11) * Math.cos(t * 16));
const beatPulse = (t: number, k = 10) => {
  let last = -10;
  for (const b of BEATS) {
    if (b <= t + 0.01) last = b;
    else break;
  }
  return Math.exp(-(t - last) * k);
};
const at = (text: string, line: number, n = 0) => WORDS.filter((w) => w.line === line && w.text.toLowerCase() === text.toLowerCase())[n].start;

const WIDE = '"TUnb", sans-serif';
const SERIF = '"TPlay", serif';
const MONO = '"TMono", monospace';
const useFonts = () => {
  const [handle] = useState(() => delayRender('font Ti Dirò'));
  useEffect(() => {
    Promise.all([
      new FontFace('TUnb', `url(${staticFile('arte/font/Unbounded.ttf')})`, {weight: '200 900'}).load(),
      new FontFace('TPlay', `url(${staticFile('roccia/font/PlayfairItalic.ttf')})`).load(),
      new FontFace('TMono', `url(${staticFile('tidiro/SpaceMono.ttf')})`).load(),
    ])
      .then((fs) => fs.forEach((f) => document.fonts.add(f)))
      .finally(() => continueRender(handle));
  }, [handle]);
};

// ── mattoncini ──
const Fill: React.FC<{bg: string; children?: React.ReactNode; style?: React.CSSProperties}> = ({bg, children, style}) => (
  <AbsoluteFill style={{background: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...style}}>{children}</AbsoluteFill>
);

/** parola larga che entra con uno scatto (scala + sfocatura breve) */
const Slam: React.FC<{g: number; t0: number; children: React.ReactNode; size: number; color: string; style?: React.CSSProperties; outline?: boolean}> = ({
  g,
  t0,
  children,
  size,
  color,
  style,
  outline,
}) => {
  const t = g - t0 + 0.03;
  if (t < 0) return null;
  const k = Math.exp(-t * 30);
  return (
    <div
      style={{
        fontFamily: WIDE,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 0.95,
        letterSpacing: `${-0.02 + k * 0.12}em`,
        color: outline ? 'transparent' : color,
        WebkitTextStroke: outline ? `${Math.max(2, size / 60)}px ${color}` : undefined,
        whiteSpace: 'nowrap',
        transform: `scale(${1 + 0.28 * k}) translateY(${k * size * 0.08}px)`,
        filter: t < 0.06 ? `blur(${(1 - t / 0.06) * 10}px)` : undefined,
        opacity: Math.min(1, t / 0.03),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** corsivo che sale da dietro una linea */
const Rise: React.FC<{g: number; t0: number; children: React.ReactNode; size: number; color: string; style?: React.CSSProperties}> = ({g, t0, children, size, color, style}) => {
  const p = expoOut(prog(g, t0 - 0.03, t0 + 0.2));
  if (p <= 0) return null;
  return (
    <div style={{overflow: 'hidden', padding: `0 ${size * 0.1}px ${size * 0.12}px`, ...style}}>
      <div style={{fontFamily: SERIF, fontWeight: 600, fontSize: size, lineHeight: 1.08, color, whiteSpace: 'nowrap', transform: `translateY(${(1 - p) * 110}%)`}}>{children}</div>
    </div>
  );
};

/** testo piccolo da interfaccia */
const Meta: React.FC<{children: React.ReactNode; color: string; size?: number; style?: React.CSSProperties}> = ({children, color, size = 22, style}) => (
  <div style={{fontFamily: MONO, fontSize: size, letterSpacing: '0.08em', textTransform: 'uppercase', color, whiteSpace: 'nowrap', ...style}}>{children}</div>
);

// ═════════ SCENE ═════════

/** 0. "Che c**** di storia scontata": un punto, una linea, poi la carta */
const S0: React.FC<{g: number}> = ({g}) => {
  const dot = easeOut(prog(g, 0, 0.12));
  const line = easeInOut(prog(g, 0.08, 0.2));
  if (g < 0.2) {
    return (
      <Fill bg={C.night}>
        <div style={{position: 'absolute', left: W / 2 - (W * 0.45 * line), width: W * 0.9 * line + 16 * dot, top: H / 2 - 8, height: 16 * (1 - line) + 3, borderRadius: 8, background: C.sunset}} />
      </Fill>
    );
  }
  const strike = easeInOut(prog(g, 1.25, 1.5));
  return (
    <Fill bg={`radial-gradient(70% 70% at 50% 50%, ${C.paper} 30%, #DCCDBB 100%)`}>
      <Meta color="#6B5E52" style={{position: 'absolute', top: 260}}>
        22simba — miria — atto ii
      </Meta>
      <div style={{display: 'flex', gap: 40, alignItems: 'baseline'}}>
        <Slam g={g} t0={at('che', 0)} size={150} color={C.night}>
          CHE
        </Slam>
        <Slam g={g} t0={at('c****', 0)} size={150} color={C.night}>
          C****
        </Slam>
        <Slam g={g} t0={at('di', 0)} size={150} color={C.night}>
          DI
        </Slam>
      </div>
      <Slam g={g} t0={at('storia', 0)} size={250} color={C.night}>
        STORIA
      </Slam>
      <div style={{position: 'relative'}}>
        <Rise g={g} t0={at('scontata', 0)} size={170} color={C.sunset}>
          scontata.
        </Rise>
        <div style={{position: 'absolute', left: 0, top: '52%', height: 10, width: `${strike * 100}%`, background: C.night}} />
      </div>
    </Fill>
  );
};

/** 1. pausa: griglia di punti che ondeggia, i colori del tramonto */
const S1: React.FC<{g: number}> = ({g}) => {
  const a = 1.6;
  const cols = 32;
  const rows = 18;
  const t = g - a;
  const pinch = easeInOut(prog(g, 2.6, 3.2)); // alla fine i punti si stringono verso il centro
  const dots: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const x0 = ((c + 0.5) / cols) * W;
      const y0 = ((r + 0.5) / rows) * H;
      const dx = x0 - W / 2;
      const dy = y0 - H / 2;
      const d = Math.hypot(dx, dy);
      const wave = Math.sin(d / 90 - t * 7);
      const appear = clamp((t * 1400 - d) / 200);
      const s = (6 + 9 * (wave * 0.5 + 0.5)) * appear * (1 + beatPulse(g) * 0.4);
      const x = x0 - dx * pinch * 0.92;
      const y = y0 - dy * pinch * 0.92;
      const k = (wave + 1) / 2;
      const col = k > 0.75 ? C.sunset : k > 0.5 ? C.peach : k > 0.25 ? C.lilac : '#3A3550';
      dots.push(<div key={`${r}-${c}`} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: (c + r) % 5 === 0 ? 2 : '50%', background: col}} />);
    }
  return (
    <Fill bg={C.night}>
      {dots}
      <Meta color={C.peach} style={{position: 'absolute', bottom: 120, left: 120}}>
        miria / il tramonto
      </Meta>
    </Fill>
  );
};

/** 2. "E ti dirò, ti dirò cose che, se vuoi, smaltiamo col sesso" sull'arancio del tramonto */
const S2: React.FC<{g: number}> = ({g}) => {
  const t1 = at('ti', 1, 0);
  const t2 = at('ti', 1, 1);
  const tCose = at('cose', 1);
  const tSe = at('se', 1);
  const tSm = at('smaltiamo', 1);
  const tCol = at('col', 1);
  const stage = g < t2 - 0.03 ? 0 : g < tCose - 0.03 ? 1 : g < tSm - 0.03 ? 2 : 3;
  // righe di "TI DIRÒ" vuote che scorrono dietro
  const marquee = (
    <AbsoluteFill style={{justifyContent: 'center', opacity: 0.22, transform: 'rotate(-6deg) scale(1.15)'}}>
      {Array.from({length: 7}, (_, r) => (
        <div
          key={r}
          style={{
            fontFamily: WIDE,
            fontWeight: 800,
            fontSize: 150,
            lineHeight: 1.05,
            whiteSpace: 'nowrap',
            color: 'transparent',
            WebkitTextStroke: `2px ${C.paper}`,
            transform: `translateX(${(((r % 2 ? 1 : -1) * (g - 3.2) * 260) % 1200) - 600}px)`,
          }}
        >
          {'TI DIRÒ · '.repeat(8)}
        </div>
      ))}
    </AbsoluteFill>
  );
  return (
    <Fill bg={`radial-gradient(80% 80% at 50% 45%, ${C.sunset} 30%, ${C.ember} 100%)`}>
      {marquee}
      {stage === 0 && (
        <Slam g={g} t0={t1} size={300} color={C.night}>
          TI DIRÒ
        </Slam>
      )}
      {stage === 1 && (
        <div style={{position: 'relative'}}>
          <Slam g={g} t0={t2} size={300} color={C.paper} outline>
            TI DIRÒ
          </Slam>
          <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - expoOut(prog(g, t2 + 0.1, t2 + 0.5)) * 100}% 0 0)`}}>
            <Slam g={g} t0={t2} size={300} color={C.paper}>
              TI DIRÒ
            </Slam>
          </div>
        </div>
      )}
      {stage === 2 && (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <Rise g={g} t0={tCose} size={190} color={C.night}>
            cose che,
          </Rise>
          <Rise g={g} t0={tSe} size={190} color={C.paper}>
            se vuoi,
          </Rise>
        </div>
      )}
      {stage === 3 && (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <Slam g={g} t0={tSm} size={230} color={C.night}>
            SMALTIAMO
          </Slam>
          <Rise g={g} t0={tCol} size={150} color={C.paper}>
            col sesso.
          </Rise>
        </div>
      )}
    </Fill>
  );
};

/** 3. "Mi dirai, mi dirai, mi dirai": sfera di particelle sull'inchiostro, lettere in orbita */
const S3: React.FC<{g: number}> = ({g}) => {
  const a = 6.5;
  const t = g - a;
  const hits = [at('mi', 2, 0), at('mi', 2, 1), at('mi', 2, 2)];
  const n = hits.filter((h) => g >= h - 0.03).length;
  const kick = hits.reduce((s, h) => s + (g >= h - 0.03 ? Math.exp(-(g - h + 0.03) * 7) : 0), 0);
  const R = 300 * (1 + kick * 0.12) * easeOut(prog(g, a, a + 0.5));
  const rot = t * 0.9;
  const tilt = 0.35 + Math.sin(t * 1.2) * 0.1;
  const pts: React.ReactNode[] = [];
  const N = 420;
  for (let i = 0; i < N; i++) {
    // punti distribuiti sulla sfera (spirale di Fibonacci)
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = i * 2.39996 + rot;
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r;
    const yy = y * Math.cos(tilt) - z * Math.sin(tilt);
    const zz = y * Math.sin(tilt) + z * Math.cos(tilt);
    const s = 2.5 + (zz + 1) * 2.2;
    pts.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          left: W / 2 + x * R - s / 2,
          top: H / 2 + yy * R - s / 2,
          width: s,
          height: s,
          borderRadius: '50%',
          background: i % 37 === 0 ? C.sunset : C.paper,
          opacity: 0.25 + (zz + 1) * 0.37,
        }}
      />,
    );
  }
  // anello di lettere: "MI DIRAI" in orbita, una volta in più a ogni ripetizione
  const ring = 'MI DIRAI  '.repeat(Math.max(1, n)).split('');
  const RR = R * 1.38;
  const step = 0.17;
  return (
    <Fill bg={`radial-gradient(60% 70% at 50% 50%, #2B3F8F 0%, ${C.ink} 45%, ${C.inkDeep} 100%)`}>
      {pts}
      {ring.map((ch, i) => {
        const ang = Math.PI / 2 + (ring.length / 2 - i) * step + Math.sin(rot * 0.7) * 0.5;
        const x = Math.cos(ang) * RR;
        const z = Math.sin(ang);
        const y = z * RR * 0.28;
        const front = z > 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: W / 2 + x,
              top: H / 2 + y,
              transform: `translate(-50%, -50%) rotate(${(-Math.cos(ang) * 0.28) * 57}deg) scale(${0.7 + (z + 1) * 0.3})`,
              fontFamily: WIDE,
              fontWeight: 800,
              fontSize: 64,
              color: front ? C.sunset : 'rgba(232,100,44,0.35)',
              zIndex: front ? 2 : 0,
            }}
          >
            {ch}
          </div>
        );
      })}
      <Meta color={C.peach} style={{position: 'absolute', left: 120, bottom: 150}}>
        mi dirai ×{n}
      </Meta>
      <Meta color="rgba(241,230,216,0.55)" style={{position: 'absolute', left: 120, bottom: 115}}>
        segreti / orbita
      </Meta>
    </Fill>
  );
};

/**
 * 4. "cose che ad altri tu non hai mai detto": tanti punti grigi (gli altri) si spengono e si allontanano,
 * due punti arancio (tu e io) si avvicinano al centro, e su "mai detto" un cerchio si chiude attorno a loro.
 */
const S4: React.FC<{g: number}> = ({g}) => {
  const tAltri = at('ad', 3);
  const tTu = at('tu', 3);
  const tMai = at('mai', 3);
  const CX = 470;
  const CY = 540;
  const away = expoOut(prog(g, tAltri, tAltri + 0.35));
  const come = expoOut(prog(g, tTu, tTu + 0.3));
  const ring = expoOut(prog(g, tMai, tMai + 0.3));
  const bp = beatPulse(g, 12);
  const crowd = Array.from({length: 46}, (_, i) => {
    const ang = random(`ca${i}`) * Math.PI * 2;
    const r0 = 90 + random(`cr${i}`) * 260;
    const r = r0 + away * (180 + random(`cd${i}`) * 220);
    const appear = expoOut(prog(g, 7.95 + random(`ct${i}`) * 0.3, 8.15 + random(`ct${i}`) * 0.3));
    const s = (14 + random(`cs${i}`) * 14) * appear * (1 - away * 0.4);
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: CX + Math.cos(ang) * r - s / 2,
          top: CY + Math.sin(ang) * r - s / 2,
          width: s,
          height: s,
          borderRadius: '50%',
          background: away > 0.05 ? '#A89A89' : C.night,
          opacity: 1 - away * 0.25,
        }}
      />
    );
  });
  const two = [-1, 1].map((side) => {
    const x = CX + side * (240 - come * 200);
    const s = 46 * expoOut(prog(g, tTu - 0.05, tTu + 0.15)) * (1 + bp * 0.15);
    return <div key={side} style={{position: 'absolute', left: x - s / 2, top: CY - s / 2, width: s, height: s, borderRadius: '50%', background: C.sunset}} />;
  });
  return (
    <Fill bg={`radial-gradient(75% 75% at 50% 50%, ${C.paper} 35%, #DACAB6 100%)`}>
      {crowd}
      {two}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <circle cx={CX} cy={CY} r={110} fill="none" stroke={C.night} strokeWidth={6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring} transform={`rotate(-90 ${CX} ${CY})`} />
      </svg>
      <Meta color="#8C7E70" style={{position: 'absolute', left: CX - 300, top: CY - 360, opacity: away}}>
        gli altri
      </Meta>
      <Meta color={C.sunset} style={{position: 'absolute', left: CX - 30, top: CY + 140, opacity: ring}}>
        noi
      </Meta>
      <div style={{position: 'absolute', left: 1000, top: 250, display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
        {(
          [
            ['Cose che', at('cose', 3), false],
            ['ad altri', tAltri, true],
            ['tu non hai', tTu, false],
            ['mai detto.', tMai, true],
          ] as [string, number, boolean][]
        ).map(([w, t0, acc], i) => (
          <Rise key={i} g={g} t0={t0} size={118} color={acc ? C.sunset : C.night}>
            {w}
          </Rise>
        ))}
      </div>
    </Fill>
  );
};

// albero della vita (copertina di Miria): rami come tratti che si disegnano
type Br = {x: number; y: number; a: number; l: number; d: number; i: string};
const TREE: Br[] = (() => {
  const out: Br[] = [];
  const grow = (x: number, y: number, a: number, l: number, d: number, id: string) => {
    out.push({x, y, a, l, d, i: id});
    if (d >= 6) return;
    const x2 = x + Math.cos(a) * l;
    const y2 = y + Math.sin(a) * l;
    const n = d < 2 ? 2 : 3;
    for (let k = 0; k < n; k++) {
      const spread = (k - (n - 1) / 2) * (0.55 + random(`ts${id}${k}`) * 0.25);
      grow(x2, y2, a + spread + (random(`tj${id}${k}`) - 0.5) * 0.25, l * (0.7 + random(`tl${id}${k}`) * 0.12), d + 1, `${id}${k}`);
    }
  };
  grow(W / 2, 900, -Math.PI / 2, 150, 0, 'r');
  return out;
})();

/** 5. "Finché ti chiamerò casa": cielo al tramonto, l'albero che cresce */
const S5: React.FC<{g: number}> = ({g}) => {
  const a = 10.5;
  const t = g - a;
  const tCasa = at('casa', 4);
  return (
    <Fill bg={`linear-gradient(180deg, ${C.lilac} 0%, #B48DB0 35%, ${C.peach} 68%, ${C.sunset} 86%, #3A2A20 100%)`}>
      <div style={{position: 'absolute', left: W / 2 - 160, top: 640, width: 320, height: 320, borderRadius: '50%', background: `radial-gradient(circle, #FFD9A0 0%, ${C.sunset} 60%, transparent 72%)`, opacity: 0.85}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 900, bottom: 0, background: `linear-gradient(180deg, ${C.grass}, #1E2616)`}} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {TREE.map((b) => {
          const s = 0.15 + b.d * 0.17;
          const p = easeOut(prog(t, s, s + 0.3));
          if (p <= 0) return null;
          const x2 = b.x + Math.cos(b.a) * b.l * p;
          const y2 = b.y + Math.sin(b.a) * b.l * p;
          return <line key={b.i} x1={b.x} y1={b.y} x2={x2} y2={y2} stroke="#1A1410" strokeWidth={Math.max(2, 26 * 0.62 ** b.d)} strokeLinecap="round" />;
        })}
        {TREE.filter((b) => b.d === 6).map((b) => {
          const p = easeOut(prog(t, 1.2 + random(`lf${b.i}`) * 0.4, 1.6 + random(`lf${b.i}`) * 0.4));
          return p > 0 ? <circle key={`l${b.i}`} cx={b.x + Math.cos(b.a) * b.l} cy={b.y + Math.sin(b.a) * b.l} r={16 * p} fill="#22301A" opacity={0.85} /> : null;
        })}
      </svg>
      <div style={{position: 'absolute', top: 110, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 26}}>
        {(['finché', 'ti', 'chiamerò'] as const).map((w) => (
          <Rise key={w} g={g} t0={at(w, 4)} size={96} color={C.paper}>
            {w}
          </Rise>
        ))}
      </div>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 40}}>
        <Slam g={g} t0={tCasa} size={230} color={C.paper} style={{textShadow: '0 10px 40px rgba(60,20,0,0.4)'}}>
          CASA
        </Slam>
      </AbsoluteFill>
    </Fill>
  );
};

/** 6. "ma chiameranno i palazzi": i palazzi salgono a tempo e coprono il cielo */
const S6: React.FC<{g: number}> = ({g}) => {
  const a = 12.3;
  const tP = at('palazzi', 5);
  const blds = Array.from({length: 14}, (_, i) => {
    const w = 110 + random(`bw${i}`) * 90;
    const h = 380 + random(`bh${i}`) * 520;
    return {w, h, x: i * 140 - 40, t: a + 0.1 + (i % 7) * 0.12 + (i > 6 ? 0.5 : 0)};
  });
  return (
    <Fill bg={`linear-gradient(180deg, ${C.inkDeep} 0%, ${C.ink} 70%, #22324F 100%)`}>
      {blds.map((b, i) => {
        const p = spring(g - b.t);
        const top = H - b.h * Math.min(1.04, p);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: b.x,
              top,
              width: b.w,
              height: b.h + 20,
              background: i % 3 ? '#1C2A44' : '#24365A',
              borderTop: `3px solid ${i % 4 === 0 ? C.gold : '#2E4470'}`,
              backgroundImage: `radial-gradient(circle, ${C.gold} 2.5px, transparent 3px)`,
              backgroundSize: '26px 34px',
              backgroundPosition: '8px 16px',
              opacity: 0.95,
            }}
          />
        );
      })}
      <Meta color="rgba(241,230,216,0.7)" style={{position: 'absolute', top: 180, left: 0, right: 0, textAlign: 'center'}} size={30}>
        {g >= at('ma', 5) ? 'ma ' : ''}
        {g >= at('chiameranno', 5) ? 'chiameranno' : ''}
      </Meta>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 120}}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 40}}>
          <Rise g={g} t0={at('i', 5)} size={160} color={C.gold}>
            i
          </Rise>
          <Slam g={g} t0={tP} size={250} color={C.paper}>
            PALAZZI
          </Slam>
        </div>
      </AbsoluteFill>
    </Fill>
  );
};

/** 7. "Noi dovremo separarci": lo schermo si apre in due */
const S7: React.FC<{g: number}> = ({g}) => {
  const tSep = at('separarci', 6);
  const open = easeInOut(prog(g, tSep + 0.35, tSep + 1.05));
  const word = (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', gap: 34, marginBottom: 20}}>
        <Rise g={g} t0={at('noi', 6)} size={120} color={C.paper}>
          noi
        </Rise>
        <Rise g={g} t0={at('dovremo', 6)} size={120} color={C.paper}>
          dovremo
        </Rise>
      </div>
      <Slam g={g} t0={tSep} size={225} color={C.paper}>
        SEPARARCI
      </Slam>
    </AbsoluteFill>
  );
  return (
    <Fill bg={C.night}>
      <AbsoluteFill style={{clipPath: 'inset(0 50% 0 0)', transform: `translateX(${-open * 260}px) rotate(${-open * 3}deg)`}}>
        <Fill bg={`linear-gradient(135deg, ${C.lilac}, #5E4F8A)`}>{word}</Fill>
      </AbsoluteFill>
      <AbsoluteFill style={{clipPath: 'inset(0 0 0 50%)', transform: `translateX(${open * 260}px) rotate(${open * 3}deg)`}}>
        <Fill bg={`linear-gradient(135deg, ${C.sunset}, ${C.ember})`}>{word}</Fill>
      </AbsoluteFill>
      {open > 0.02 && <Meta color={C.peach} style={{position: 'absolute', top: H / 2 - 12, left: W / 2 - 40, opacity: open}}>noi</Meta>}
    </Fill>
  );
};

/** il simbolo: l'albero in un cerchio, con i raggi del tramonto che girano */
const Emblem: React.FC<{g: number; size: number}> = ({g, size}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100">
    {Array.from({length: 12}, (_, i) => {
      const a = (i / 12) * Math.PI * 2 + g * 0.6;
      return <line key={i} x1={Math.cos(a) * 34} y1={Math.sin(a) * 34} x2={Math.cos(a) * 46} y2={Math.sin(a) * 46} stroke={C.sunset} strokeWidth={4} strokeLinecap="round" />;
    })}
    <circle r={26} fill="none" stroke={C.sunset} strokeWidth={4} />
    <path d="M0,18 L0,2 M0,6 L-9,-4 M0,4 L9,-6 M0,-2 L-4,-12 M0,-2 L5,-13" stroke={C.paper} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    <circle cx={-10} cy={-6} r={4} fill={C.grass} />
    <circle cx={10} cy={-8} r={4.5} fill={C.grass} />
    <circle cx={0} cy={-15} r={5} fill={C.grass} />
  </svg>
);

/** 8. finale: "che c**** di storia scontata" e il cartellone */
const S8: React.FC<{g: number}> = ({g}) => {
  const a = 16.6;
  const e = expoOut(prog(g, a, a + 0.5));
  const ws = WORDS.filter((w) => w.line === 7);
  return (
    <Fill bg={`radial-gradient(70% 70% at 50% 45%, #1B1714 0%, ${C.night} 100%)`}>
      <div style={{transform: `scale(${0.6 + 0.4 * e})`, opacity: e, marginBottom: 20}}>
        <Emblem g={g} size={150} />
      </div>
      <Slam g={g} t0={a} size={210} color={C.paper}>
        TI DIRÒ
      </Slam>
      <div style={{display: 'flex', gap: 22, marginTop: 10}}>
        {ws.map((w, i) => (
          <Rise key={i} g={g} t0={w.start} size={64} color={i === ws.length - 1 ? C.sunset : 'rgba(241,230,216,0.8)'}>
            {w.text}
          </Rise>
        ))}
      </div>
      <Meta color="rgba(241,230,216,0.45)" style={{marginTop: 40, opacity: prog(g, 17.0, 17.3)}}>
        22simba — miria — atto ii — island records
      </Meta>
      <div style={{position: 'absolute', top: 90, right: 120, padding: '8px 20px', borderRadius: 30, background: C.sunset, opacity: prog(g, 16.9, 17.1)}}>
        <Meta color={C.night} size={20}>
          fuori ora
        </Meta>
      </div>
    </Fill>
  );
};

const SCENES: [number, number, React.FC<{g: number}>][] = [
  [0, 1.6, S0],
  [1.6, 3.24, S1],
  [3.24, 6.5, S2],
  [6.5, 7.95, S3],
  [7.95, 10.5, S4],
  [10.5, 12.3, S5],
  [12.3, 14.6, S6],
  [14.6, 16.6, S7],
  [16.6, DURATION + 1, S8],
];
const LIGHT = new Set([0, 4]); // scene chiare: l'interfaccia diventa scura

/** cornice da reel: etichette agli angoli, timecode che scorre, puntino sul beat */
const Hud: React.FC<{g: number; light: boolean; frame: number}> = ({g, light, frame}) => {
  const col = light ? 'rgba(20,17,16,0.65)' : 'rgba(241,230,216,0.6)';
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <Meta color={col} size={18} style={{position: 'absolute', left: 60, top: 44}}>
        22simba · ti dirò
      </Meta>
      <Meta color={col} size={18} style={{position: 'absolute', right: 60, top: 44}}>
        miria · atto ii
      </Meta>
      <div style={{position: 'absolute', left: 60, right: 60, bottom: 50, height: 1, background: col, opacity: 0.4}} />
      <div style={{position: 'absolute', left: 60, bottom: 50, height: 2, width: (W - 120) * clamp(g / DURATION), background: C.sunset}} />
    </AbsoluteFill>
  );
};

export const TiDiro: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const g = frame / FPS;
  const si = SCENES.findIndex(([a, b]) => g >= a && g < b);
  const [a, , Sc] = SCENES[Math.max(0, si)];
  // ingresso di ogni scena: piccolo scatto di scala
  const enter = 1 - expoOut(prog(g, a, a + 0.14));
  const punch = 1 + beatPulse(g, 12) * 0.006 + enter * 0.04;
  const f2 = Math.floor(frame / 2);
  const fade = prog(g, DURATION - 0.45, DURATION);
  return (
    <AbsoluteFill style={{background: C.night, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${punch})`}}>
        <Sc g={g} />
      </AbsoluteFill>
      <Hud g={g} light={LIGHT.has(si)} frame={frame} />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('simba/grain.png')})`,
          backgroundPosition: `${Math.floor(random(`g${f2}`) * 512)}px ${Math.floor(random(`h${f2}`) * 512)}px`,
          mixBlendMode: 'overlay',
          opacity: 0.12,
        }}
      />
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
      <Audio src={staticFile('tidiro/audio.m4a')} />
    </AbsoluteFill>
  );
};

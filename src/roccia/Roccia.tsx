import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, random, staticFile, useCurrentFrame} from 'remotion';
import data from './words.json';

/**
 * "Roccia": edit su oggetti generati. Le scritte sono morbide: ogni lettera entra con una molla
 * (piccolo rimbalzo), galleggia, trema sui colpi e vive dentro la stessa "camera" dell'immagine,
 * quindi zooma, trema e si deforma (onda liquida negli stacchi, calore sul fiammifero) insieme a lei.
 */

export const FPS = 60;
export const DURATION = 31.9;
export const ROCCIA_FRAMES = Math.round(DURATION * FPS);
const W = 1920;
const H = 1080;
const BEATS = data.beats as number[];

const src = (p: string) => staticFile(`roccia/${p}`);
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const prog = (g: number, a: number, b: number) => clamp((g - a) / (b - a));
const ease = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeIn = (t: number) => t * t * t;
const hit = (g: number, at: number, k = 10) => (g >= at ? Math.exp(-(g - at) * k) : 0);
// molla smorzata: arriva a 1 con un piccolo rimbalzo
const spring = (t: number) => (t <= 0 ? 0 : 1 - Math.exp(-t * 9) * Math.cos(t * 13));

const beatPulse = (t: number) => {
  let last = -10;
  for (const b of BEATS) {
    if (b <= t + 0.01) last = b;
    else break;
  }
  return Math.exp(-(t - last) * 9);
};

const ITAL = '"RItal", "Playfair Display", serif';
const BOLD = '"RBold", "Playfair Display", serif';
const CREAM = '#F7ECDD';
const GLOW = '0 0 16px rgba(255,214,160,0.35), 0 0 42px rgba(255,170,90,0.18), 0 5px 26px rgba(0,0,0,0.9)';

const useFonts = () => {
  const [handle] = useState(() => delayRender('font Roccia'));
  useEffect(() => {
    Promise.all([
      new FontFace('RItal', `url(${src('font/PlayfairItalic.ttf')})`, {style: 'normal'}).load(),
      new FontFace('RBold', `url(${src('font/PlayfairBold.ttf')})`).load(),
    ])
      .then((fs) => fs.forEach((f) => document.fonts.add(f)))
      .finally(() => continueRender(handle));
  }, [handle]);
};

let ctx: CanvasRenderingContext2D | null = null;
const fit = (text: string, size: number, caps: boolean | undefined, maxW: number) => {
  ctx ??= document.createElement('canvas').getContext('2d');
  if (!ctx) return size;
  ctx.font = caps ? `800 ${size}px ${BOLD}` : `600 ${size}px ${ITAL}`;
  const w = ctx.measureText(caps ? text.toUpperCase() : text).width * (caps ? 1.04 : 1);
  return w > maxW ? (size * maxW) / w : size;
};

// ── testo morbido ──
type Ln = {
  w: [string, number][]; // parole con l'istante in cui escono
  x: number;
  y: number;
  size: number;
  caps?: boolean;
  align?: 'left' | 'center' | 'right';
  max?: number;
  until?: number;
  color?: string;
  float?: number; // deriva verso l'alto (px/s), come pagine
};

/**
 * una riga: lettere che salgono con una molla, sfocate all'inizio, che poi galleggiano piano;
 * `jelly` le fa tremare come gelatina sui colpi; `skew` le piega quando la camera si sposta.
 */
const Line: React.FC<{l: Ln; g: number; jelly?: number; skew?: number}> = ({l, g, jelly = 0, skew = 0}) => {
  const first = l.w[0][1];
  if (g < first - 0.001) return null;
  if (l.until !== undefined && g > l.until + 0.4) return null;
  const text = l.w.map((x) => x[0]).join(' ');
  const align = l.align ?? 'center';
  const max = l.max ?? (align === 'center' ? 1700 : align === 'left' ? W - l.x - 90 : l.x - 90);
  const size = fit(text, l.size, l.caps, max);
  const tx = align === 'left' ? 0 : align === 'center' ? -50 : -100;
  let idx = 0;
  const drift = l.float ? -(g - first) * l.float : 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: l.x,
        top: l.y + drift,
        transform: `translate(${tx}%, -50%) rotate(${Math.sin(g * 0.7 + l.y * 0.01) * 1.2}deg) skewX(${skew}deg)`,
        transformOrigin: '50% 60%',
        whiteSpace: 'nowrap',
        fontFamily: l.caps ? BOLD : ITAL,
        fontWeight: l.caps ? 800 : 600,
        fontSize: size,
        letterSpacing: l.caps ? '0.04em' : '0.01em',
        lineHeight: 1.1,
        color: l.color ?? CREAM,
        textShadow: GLOW,
      }}
    >
      {l.w.map(([word, at], wi) => (
        <React.Fragment key={wi}>
          {wi > 0 && <span style={{display: 'inline-block', width: '0.28em'}} />}
          {[...(l.caps ? word.toUpperCase() : word)].map((ch, ci) => {
            const i = idx++;
            if (ch === ' ') return <span key={ci} style={{display: 'inline-block', width: '0.28em'}} />;
            const t = g - (at + ci * 0.024);
            if (t < 0) return <span key={ci} style={{display: 'inline-block', opacity: 0}}>{ch}</span>;
            const s = spring(t);
            const op = clamp(t / 0.12);
            const bl = Math.max(0, 1 - t / 0.2) * 9;
            // uscita: le lettere salgono e si sciolgono una dopo l'altra
            const e = l.until !== undefined ? easeIn(prog(g, l.until + i * 0.012, l.until + 0.25 + i * 0.012)) : 0;
            const wob = Math.sin(g * 2.3 + i * 0.5) * size * 0.022;
            const jel = jelly * Math.sin(i * 1.7 + g * 34) * size * 0.07;
            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  transform: `translateY(${(1 - s) * size * 0.5 + wob + jel - e * size * 0.6}px) rotate(${(1 - s) * -16 + Math.sin(g * 1.6 + i * 0.7) * 2 + jelly * Math.sin(i * 2.3) * 6}deg) scale(${0.85 + 0.15 * s})`,
                  opacity: op * (1 - e),
                  filter: bl + e * 10 > 0.3 ? `blur(${bl + e * 10}px)` : undefined,
                }}
              >
                {ch}
              </span>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};
const Lines: React.FC<{ls: Ln[]; g: number; jelly?: number; skew?: number}> = ({ls, g, jelly, skew}) => (
  <>
    {ls.map((l, i) => (
      <Line key={i} l={l} g={g} jelly={jelly} skew={skew} />
    ))}
  </>
);

// ── deformazione liquida (stacchi) ──
const Warp: React.FC<{id: string; scale: number; freq?: string; seed?: number}> = ({id, scale, freq = '0.006 0.012', seed = 3}) => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <filter id={id} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={2} seed={seed} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </svg>
);

// ── particelle ──
type PP = {
  n: number;
  seed: string;
  g: number;
  t0: number;
  color: string;
  size: [number, number];
  // drift: nascono in un'area e scorrono (si ripetono); burst: esplodono da un punto
  mode: 'drift' | 'burst';
  area?: [number, number, number, number];
  vel?: [number, number];
  spread?: number;
  origin?: [number, number];
  speed?: number;
  gravity?: number;
  life?: number;
  shard?: boolean;
};
const Particles: React.FC<PP> = (p) => {
  const out: React.ReactNode[] = [];
  const dt = p.g - p.t0;
  if (dt < 0) return null;
  for (let i = 0; i < p.n; i++) {
    const r = (k: string) => random(`${p.seed}${i}${k}`);
    const sz = p.size[0] + r('s') * (p.size[1] - p.size[0]);
    let x: number, y: number, op: number;
    if (p.mode === 'drift') {
      const [x0, y0, x1, y1] = p.area ?? [0, 0, W, H];
      const [vx, vy] = p.vel ?? [0, -60];
      const sp = 0.5 + r('v');
      const hh = y1 - y0 + 80;
      x = x0 + r('x') * (x1 - x0) + vx * sp * dt + Math.sin(dt * (1 + r('f') * 2) + i) * 18;
      const yy = r('y') * hh + vy * sp * dt;
      y = y0 - 40 + (((yy % hh) + hh) % hh);
      op = 0.35 + 0.65 * Math.abs(Math.sin(dt * (1.5 + r('t') * 3) + i));
    } else {
      const life = p.life ?? 1.2;
      if (dt > life) continue;
      const a = r('a') * Math.PI * 2;
      const v = (p.speed ?? 600) * (0.3 + r('v'));
      const [ox, oy] = p.origin ?? [W / 2, H / 2];
      const k = 1 - Math.exp(-dt * 2.2);
      x = ox + (Math.cos(a) * v * k) / 2.2;
      y = oy + (Math.sin(a) * v * k) / 2.2 + (p.gravity ?? 0) * dt * dt;
      op = 1 - dt / life;
    }
    out.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: sz,
          height: p.shard ? sz * 1.4 : sz,
          background: p.color,
          borderRadius: p.shard ? 0 : '50%',
          clipPath: p.shard ? 'polygon(50% 0, 100% 70%, 20% 100%)' : undefined,
          transform: p.shard ? `rotate(${r('r') * 360 + dt * 200 * (r('d') - 0.5)}deg)` : undefined,
          opacity: op,
          boxShadow: p.shard ? undefined : `0 0 ${sz * 2}px ${p.color}`,
        }}
      />,
    );
  }
  return <>{out}</>;
};

// ── pezzi comuni ──
const Full: React.FC<{name: string; style?: React.CSSProperties}> = ({name, style}) => (
  <Img src={src(name)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style}} />
);
/** palco nero con un fascio di luce dall'alto, come nelle immagini */
const Stage: React.FC<{g: number; warm?: number; x?: number}> = ({g, warm = 1, x = 50}) => {
  const fl = 0.85 + 0.15 * Math.sin(g * 7) * Math.sin(g * 3.1);
  return (
    <AbsoluteFill style={{background: '#030202'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(22% 70% at ${x}% -8%, rgba(255,${200 + 20 * (1 - warm)},${150 + 60 * (1 - warm)},${0.34 * fl}) 0%, rgba(255,190,130,${0.08 * fl}) 45%, transparent 80%)`,
        }}
      />
      <AbsoluteFill style={{background: `radial-gradient(40% 12% at ${x}% 98%, rgba(255,200,150,0.1) 0%, transparent 100%)`}} />
    </AbsoluteFill>
  );
};

type SP = {start: number; end: number};
const useG = (start: number) => start + useCurrentFrame() / FPS;

/**
 * contenitore camera: immagine e testo stanno qui dentro, quindi si muovono e si deformano insieme.
 * Negli stacchi un'onda liquida piega tutto (entrata e uscita).
 */
const Cam: React.FC<{
  id: string;
  g: number;
  start: number;
  end: number;
  s?: number;
  x?: number;
  y?: number;
  r?: number;
  origin?: string;
  warp?: number;
  freq?: string;
  children: React.ReactNode;
}> = ({id, g, start, end, s = 1, x = 0, y = 0, r = 0, origin = '50% 50%', warp = 0, freq, children}) => {
  const w = Math.max(warp, 150 * Math.exp(-(g - start) * 11), 150 * Math.exp(-(end - g) * 13));
  const on = w > 1.5;
  // le scritte seguono la camera ma più piano (restano sempre dentro lo schermo)
  const all = React.Children.toArray(children);
  const isText = (c: React.ReactNode) => React.isValidElement(c) && c.type === Lines;
  const ts = 1 + (s - 1) * 0.3;
  return (
    <AbsoluteFill style={{filter: on ? `url(#${id})` : undefined}}>
      {on && <Warp id={id} scale={w} freq={freq} seed={Math.floor(g * 6)} />}
      <AbsoluteFill style={{transform: `translate(${x}px, ${y}px) scale(${s}) rotate(${r}deg)`, transformOrigin: origin}}>{all.filter((c) => !isText(c))}</AbsoluteFill>
      <AbsoluteFill style={{transform: `translate(${x * 0.6}px, ${y * 0.6}px) scale(${ts}) rotate(${r * 0.5}deg)`, transformOrigin: '50% 50%'}}>{all.filter(isText)}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// tremolio della camera dopo un colpo (decadimento morbido)
const shakeAt = (g: number, hits: number[], amp = 22) => {
  let x = 0;
  let y = 0;
  for (const h of hits) {
    const k = hit(g, h, 7);
    x += Math.sin((g - h) * 55) * amp * k;
    y += Math.cos((g - h) * 47) * amp * 0.7 * k;
  }
  return [x, y];
};
const jellyAt = (g: number, hits: number[]) => hits.reduce((a, h) => a + hit(g, h, 6), 0);

// ═════════ SCENE ═════════

/** 0. copertina: la camera sale dal basso, nebbia, il titolo si posa morbido */
const SCover: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = ease(prog(g, 0, end));
  const fog = (k: number) => `translateX(${Math.sin(g * 0.4 + k) * 80 + g * 25 * (k % 2 ? 1 : -1)}px)`;
  return (
    <Cam id="w0" g={g} start={-1} end={end} s={1.28 - 0.2 * p} y={-120 + 150 * p} origin="50% 70%">
      <AbsoluteFill style={{transform: `translateY(${-30 * p}px)`}}>
        <Full name="plate-1-cover.jpg" />
      </AbsoluteFill>
      <AbsoluteFill style={{transform: `translateY(${-70 * p}px) scale(${1 + 0.03 * p})`, transformOrigin: '50% 100%'}}>
        <Full name="cut/1-cover.png" />
      </AbsoluteFill>
      {[0, 1, 2].map((k) => (
        <AbsoluteFill
          key={k}
          style={{
            transform: fog(k),
            background: `radial-gradient(45% 18% at ${30 + k * 25}% ${88 - k * 4}%, rgba(200,200,210,0.16) 0%, transparent 100%)`,
          }}
        />
      ))}
      <Particles n={60} seed="cv" g={g} t0={0} color="rgba(255,220,180,0.7)" size={[2, 5]} mode="drift" vel={[15, -30]} />
      <Lines
        g={g}
        ls={[
          {w: [['Roccia', 1.3]], x: W / 2, y: 690, size: 260, until: 3.55},
          {w: [['22simba', 2.25]], x: W / 2, y: 840, size: 64, until: 3.45, color: '#E7B77A'},
          {w: [['il', 3.8]], x: 175, y: 420, size: 120, align: 'left'},
        ]}
      />
    </Cam>
  );
};

/** 1. il mondo di vetro gira piano e su "il cuore" si spacca lungo la crepa */
const SMondo: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = prog(g, start, end);
  const split = easeOut(prog(g, 6.22, 6.6));
  const beat = beatPulse(g);
  // crepa lungo la diagonale del globo: i due pezzi si allontanano lungo la normale
  const nx = 0.64;
  const ny = 0.77;
  const d = split * 60;
  const globe = (clip: string, sx: number) => (
    <AbsoluteFill
      style={{
        clipPath: clip,
        transform: `translate(${nx * d * sx}px, ${ny * d * sx}px) rotate(${split * 3 * sx}deg)`,
        transformOrigin: '48% 45%',
      }}
    >
      <Full name="cut/2-mondo.png" />
    </AbsoluteFill>
  );
  return (
    <Cam id="w1" g={g} start={start} end={end} s={1.02 + 0.08 * p + beat * 0.01} x={-40 * p}>
      <Stage g={g} x={50} />
      <AbsoluteFill style={{transform: `rotate(${-6 + 10 * p}deg) translateY(${Math.sin(g * 1.4) * 10}px)`, transformOrigin: '49% 45%'}}>
        {split > 0 && (
          <div
            style={{
              position: 'absolute',
              left: 960 - 450,
              top: 464 - 3,
              width: 900,
              height: 6,
              transform: 'rotate(-40deg)',
              background: `rgba(255,200,120,${split * 0.8})`,
              boxShadow: `0 0 30px 8px rgba(255,160,60,${split * 0.5})`,
              borderRadius: 4,
            }}
          />
        )}
        {split > 0 ? (
          <>
            {globe('polygon(0 0, 80% -2%, 20% 88%, 12% 100%, 0 100%)', -1)}
            {globe('polygon(80% -2%, 100% -2%, 100% 100%, 12% 100%, 20% 88%)', 1)}
          </>
        ) : (
          <Full name="cut/2-mondo.png" />
        )}
      </AbsoluteFill>
      <Particles n={26} seed="sh" g={g} t0={start} color="rgba(225,240,255,0.85)" size={[5, 14]} mode="drift" area={[560, 150, 1320, 860]} vel={[40, -25]} shard />
      {split > 0 && <Particles n={40} seed="sb" g={g} t0={6.22} color="rgba(255,225,190,0.95)" size={[3, 10]} mode="burst" origin={[930, 430]} speed={900} life={1} shard />}
      <Lines
        g={g}
        jelly={hit(g, 6.22, 5)}
        ls={[
          {w: [['il', 3.8], ['mondo', 4.36], ['mio', 4.8]], x: 175, y: 420, size: 120, align: 'left', max: 400},
          {w: [['non', 5.04], ['comprende', 5.58]], x: 175, y: 560, size: 110, align: 'left', max: 470},
          {w: [['il cuore', 6.04]], x: 1310, y: 700, size: 150, align: 'left', max: 440, color: '#FFD9A8'},
        ]}
      />
    </Cam>
  );
};

/** 2. il gatto: la camera si avvicina agli occhi, che si accendono su "gatti" */
const SGatto: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = ease(prog(g, start, end));
  const eye = hit(g, 7.8, 4) + 0.25 + 0.1 * Math.sin(g * 9);
  return (
    <Cam id="w2" g={g} start={start} end={end} s={1.0 + 0.32 * p} origin="50% 28%">
      <Stage g={g} />
      <AbsoluteFill style={{transform: `translateY(${Math.sin(g * 1.1) * 6}px)`}}>
        <Full name="cut/3-gatto.png" />
        {[877, 1004].map((x) => (
          <div
            key={x}
            style={{
              position: 'absolute',
              left: x - 60,
              top: 276 - 60,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,190,60,0.9) 0%, rgba(255,140,20,0.35) 30%, transparent 70%)',
              opacity: eye,
              mixBlendMode: 'screen',
            }}
          />
        ))}
      </AbsoluteFill>
      <Particles n={30} seed="gt" g={g} t0={start} color="rgba(255,210,160,0.6)" size={[2, 4]} mode="drift" vel={[10, -20]} />
      <Lines
        g={g}
        jelly={hit(g, 7.8, 6) * 0.6}
        ls={[
          {w: [['mi', 6.72], ['fido', 7.02], ['più', 7.3]], x: 175, y: 470, size: 120, align: 'left', max: 520},
          {w: [['dei', 7.58], ['gatti', 7.8]], x: 1300, y: 620, size: 140, align: 'left', max: 440},
        ]}
      />
    </Cam>
  );
};

/** 3. la statua: gira piano nello spazio; su "sparati" e sui "poh" trema e si sbriciola */
const SStatua: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = ease(prog(g, start, end));
  const hits = [9.1, 9.62, 10.0];
  const [sx, sy] = shakeAt(g, hits, 26);
  const punch = hits.reduce((a, h) => a + hit(g, h, 9) * 0.07, 0);
  return (
    <Cam id="w3" g={g} start={start} end={end} s={1.04 + 0.1 * p + punch} x={sx} y={sy} r={sx * 0.04}>
      <Stage g={g} />
      <AbsoluteFill style={{perspective: 1400}}>
        <AbsoluteFill style={{transform: `rotateY(${-10 + 18 * p}deg) translateY(${Math.sin(g * 1.2) * 8}px)`}}>
          <Full name="cut/4-statua.png" style={{filter: `brightness(${1 + punch * 4})`}} />
        </AbsoluteFill>
      </AbsoluteFill>
      {hits.map((h, i) => (
        <Particles key={i} n={22} seed={`st${i}`} g={g} t0={h} color="rgba(235,225,210,0.95)" size={[6, 18]} mode="burst" origin={[1080, 330]} speed={1100} gravity={900} life={1.1} shard />
      ))}
      <Lines
        g={g}
        jelly={jellyAt(g, hits)}
        skew={sx * 0.15}
        ls={[
          {w: [['Dio', 8.16], ['gli', 8.44], ['direi', 8.72]], x: 175, y: 380, size: 115, align: 'left', max: 470},
          {w: [['sparati', 9.1]], x: W / 2, y: 800, size: 250, caps: true},
          {w: [['poh', 9.62]], x: 1400, y: 360, size: 110, align: 'left', color: '#FFD9A8'},
          {w: [['poh', 10.0]], x: 1500, y: 500, size: 110, align: 'left', color: '#FFD9A8'},
        ]}
      />
    </Cam>
  );
};

/** 4. il libro: la camera scende tra le pagine che volano, le parole salgono come fogli */
const SLibro: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = ease(prog(g, start, end));
  return (
    <Cam id="w4" g={g} start={start} end={end} s={1.05 + 0.25 * p} y={60 * p} origin="50% 40%">
      <Full name="src/5-libro.webp" />
      <Particles n={70} seed="lb" g={g} t0={start} color="rgba(255,150,50,0.95)" size={[2, 6]} mode="drift" area={[450, 100, 1500, 1000]} vel={[20, -180]} />
      <Lines
        g={g}
        ls={[
          {w: [['incontrassi', 10.56]], x: 175, y: 300, size: 115, align: 'left', max: 560, float: 14},
          {w: [['sto', 11.24], ['nel', 11.44], ['mio', 11.66]], x: 175, y: 440, size: 100, align: 'left', max: 520, float: 14},
          {w: [['mentre', 11.78], ['raccontan', 12.2]], x: 1745, y: 330, size: 105, align: 'right', max: 600, float: 14},
          {w: [['storie', 12.84]], x: W / 2, y: 560, size: 230, float: 40, color: '#FFE3B8'},
        ]}
      />
    </Cam>
  );
};

/** 5. il fiammifero: l'aria trema per il calore (anche le scritte), su "sparagli" la fiamma esplode */
const SFiamma: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = ease(prog(g, start, end));
  const boom = hit(g, 15.68, 5);
  const flick = 0.9 + 0.12 * Math.sin(g * 23) * Math.sin(g * 11.3) + boom * 0.6;
  const [sx, sy] = shakeAt(g, [15.68], 30);
  return (
    <Cam
      id="w5"
      g={g}
      start={start}
      end={end}
      s={1.08 + 0.12 * p + boom * 0.12}
      x={sx}
      y={sy}
      origin="48% 50%"
      warp={10 + boom * 40}
      freq={`0.004 ${(0.018 + 0.004 * Math.sin(g * 3)).toFixed(4)}`}
    >
      <Full name="src/6-fiammifero.webp" style={{filter: `brightness(${flick}) saturate(${1.05 + boom * 0.3})`}} />
      <AbsoluteFill style={{background: `radial-gradient(30% 40% at 52% 30%, rgba(255,150,40,${0.18 + boom * 0.5}) 0%, transparent 70%)`, mixBlendMode: 'screen'}} />
      <Particles n={50} seed="fm" g={g} t0={start} color="rgba(255,160,60,0.95)" size={[2, 5]} mode="drift" area={[500, 0, 1400, 700]} vel={[60, -220]} />
      <Particles n={60} seed="fb" g={g} t0={15.68} color="rgba(255,200,110,1)" size={[3, 8]} mode="burst" origin={[860, 420]} speed={1600} gravity={300} life={1.2} />
      <Lines
        g={g}
        jelly={hit(g, 15.68, 5)}
        skew={sx * 0.12}
        ls={[
          {w: [['sui', 13.32], ['peggio', 13.62], ['modi', 13.92]], x: 175, y: 760, size: 110, align: 'left', max: 560},
          {w: [['per', 14.28], ['farli', 14.6]], x: 175, y: 890, size: 110, align: 'left', max: 520},
          {w: [['un', 14.88], ['socio', 15.08], ['dice', 15.38]], x: 1745, y: 760, size: 105, align: 'right', max: 600},
          {w: [['sparagli', 15.68]], x: W / 2, y: 540, size: 250, caps: true, color: '#FFE7C2'},
        ]}
      />
    </Cam>
  );
};

/** 6. i soldi: la camera gira intorno alla pila, un riflesso d'oro passa sulla catena */
const SSoldi: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = ease(prog(g, start, end));
  const sweep = prog(g, 17.3, 18.1);
  const beat = beatPulse(g);
  return (
    <Cam id="w6" g={g} start={start} end={end} s={1.0 + 0.1 * p + beat * 0.012} origin="50% 60%">
      <Stage g={g} />
      <AbsoluteFill style={{perspective: 1600}}>
        <AbsoluteFill style={{transform: `rotateY(${12 - 20 * p}deg) rotateX(${4 - 4 * p}deg)`, transformOrigin: '50% 70%'}}>
          <Full name="cut/7-soldi.png" />
          <AbsoluteFill
            style={{
              WebkitMaskImage: `url(${src('cut/7-soldi.png')})`,
              WebkitMaskSize: '100% 100%',
              background: `linear-gradient(110deg, transparent ${sweep * 140 - 30}%, rgba(255,230,160,0.7) ${sweep * 140 - 20}%, transparent ${sweep * 140 - 10}%)`,
              mixBlendMode: 'screen',
            }}
          />
        </AbsoluteFill>
      </AbsoluteFill>
      <Particles n={45} seed="sd" g={g} t0={start} color="rgba(255,215,120,0.9)" size={[2, 5]} mode="drift" vel={[0, 70]} />
      <Lines
        g={g}
        jelly={hit(g, 17.46, 6)}
        ls={[
          {w: [['io', 16.44], ['che', 16.72], ['saremo', 16.98]], x: W / 2, y: 120, size: 100},
          {w: [['ricchi', 17.46]], x: 1745, y: 400, size: 220, caps: true, align: 'right', max: 560, color: '#FFD27A'},
          {w: [['glielo', 17.94], ['giuro', 18.44]], x: 1745, y: 580, size: 110, align: 'right', max: 420},
        ]}
      />
    </Cam>
  );
};

/** 7 / 10. "Roccia": la parola nasce dentro la pietra, le crepe si accendono */
const SRock: React.FC<SP & {at: number}> = ({start, end, at}) => {
  const g = useG(start);
  const p = ease(prog(g, start, end));
  const glow = hit(g, at, 3);
  return (
    <Cam id={`wr${at}`} g={g} start={start} end={end} s={1.15 - 0.1 * p} r={-2 + 3 * p}>
      <Full name="src/12-roccia.webp" style={{filter: `brightness(${0.75 + glow * 0.7}) contrast(1.1)`}} />
      <AbsoluteFill style={{background: `radial-gradient(50% 50% at 50% 50%, rgba(255,140,30,${glow * 0.35}) 0%, transparent 70%)`, mixBlendMode: 'screen'}} />
      <Lines g={g} jelly={glow * 0.7} ls={[{w: [['roccia', at]], x: W / 2, y: H / 2, size: 330, caps: true, color: '#FFE2B0'}]} />
    </Cam>
  );
};

/** 8. la mano sulla corda: la camera tira con lei a ogni colpo, sassi che cadono */
const SMano: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = ease(prog(g, start, end));
  const beat = beatPulse(g);
  const [sx, sy] = shakeAt(g, [19.82, 20.62, 21.02], 14);
  return (
    <Cam id="w8" g={g} start={start} end={end} s={1.06 + 0.16 * p + beat * 0.02} x={sx - 40 * p} y={sy - beat * 10} origin="58% 45%">
      <Full name="src/8-mano.webp" />
      <Particles n={30} seed="mn" g={g} t0={start} color="rgba(120,100,80,0.95)" size={[5, 14]} mode="drift" area={[950, 300, 1300, 1080]} vel={[-10, 420]} shard />
      <Lines
        g={g}
        jelly={jellyAt(g, [20.62, 21.02]) * 0.6}
        skew={sx * 0.1}
        ls={[
          {w: [['non', 19.82], ['mollare', 20.06]], x: 175, y: 330, size: 125, align: 'left', max: 500},
          {w: [['la', 20.62], ['corda', 21.02]], x: 175, y: 520, size: 200, align: 'left', max: 500, color: '#FFD9A8'},
        ]}
      />
    </Cam>
  );
};

/** 9. la clessidra si capovolge su "col tempo"; "tossico" la incrina */
const SClessidra: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = ease(prog(g, start, end));
  const flip = spring(g - 21.56) * 180;
  const [sx, sy] = shakeAt(g, [23.52, 24.3], 20);
  return (
    <Cam id="w9" g={g} start={start} end={end} s={1.0 + 0.1 * p} x={sx} y={sy}>
      <Stage g={g} />
      <AbsoluteFill style={{transform: `rotate(${flip}deg) translateY(${Math.sin(g * 1.3) * 6}px)`, transformOrigin: '49% 49%'}}>
        <Full name="cut/9-clessidra.png" style={{filter: `brightness(${1 + hit(g, 23.52, 6) * 0.8})`}} />
      </AbsoluteFill>
      <Particles n={40} seed="cl" g={g} t0={start} color="rgba(180,160,140,0.8)" size={[2, 5]} mode="drift" vel={[0, 90]} />
      <Lines
        g={g}
        jelly={jellyAt(g, [23.52, 24.3])}
        skew={sx * 0.12}
        ls={[
          {w: [['col', 21.56], ['tempo', 21.72]], x: 175, y: 300, size: 115, align: 'left', max: 430},
          {w: [["chi l'ha", 22.1], ['fatto', 22.56]], x: 175, y: 440, size: 105, align: 'left', max: 430},
          {w: [['lo', 22.88], ['chiami', 23.22]], x: 175, y: 580, size: 105, align: 'left', max: 430},
          {w: [['tossico', 23.52]], x: 1745, y: 460, size: 190, caps: true, align: 'right', max: 560},
          {w: [['o', 24.16], ['troia', 24.3]], x: 1745, y: 640, size: 150, align: 'right', max: 560, color: '#FFD9A8'},
        ]}
      />
    </Cam>
  );
};

/** 11. la rosa diventa pietra da destra a sinistra mentre si sbriciola */
const SRosa: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = ease(prog(g, start, end));
  const stone = prog(g, start, end + 0.2);
  return (
    <Cam id="w11" g={g} start={start} end={end} s={1.04 + 0.12 * p} x={-50 * p} origin="40% 50%">
      <Full name="src/10-rosa.webp" />
      <AbsoluteFill
        style={{
          WebkitMaskImage: `linear-gradient(90deg, transparent ${100 - stone * 90}%, #000 ${110 - stone * 90}%)`,
        }}
      >
        <Full name="src/10-rosa.webp" style={{filter: 'grayscale(1) sepia(0.35) brightness(0.9) contrast(1.15)'}} />
      </AbsoluteFill>
      <Particles n={70} seed="rs" g={g} t0={start} color="rgba(200,180,160,0.9)" size={[2, 7]} mode="drift" area={[1000, 50, 1920, 900]} vel={[160, -40]} />
      <Lines
        g={g}
        ls={[
          {w: [['non', 25.82], ['ti', 25.96], ['fotte', 26.18]], x: 1745, y: 760, size: 110, align: 'right', max: 480},
          {w: [['una', 26.46], ['donna', 26.74]], x: 1745, y: 900, size: 140, align: 'right', max: 480, color: '#FFB3A0'},
        ]}
      />
    </Cam>
  );
};

/** 12. la cima: la camera si alza sul cielo, il sole esplode su "faremo" */
const SCima: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = ease(prog(g, start, 31.2));
  const boom = hit(g, 30.06, 2.5);
  const rays = prog(g, 29.9, 31.5);
  return (
    <Cam id="w12" g={g} start={start} end={end + 5} s={1.3 - 0.18 * p + boom * 0.05} y={-150 + 260 * p} origin="50% 40%">
      <Full name="src/11-cima.webp" style={{filter: `brightness(${0.85 + boom * 0.4})`}} />
      <AbsoluteFill
        style={{
          background: `repeating-conic-gradient(from ${g * 12}deg at 74% 38%, rgba(255,200,120,${0.18 * rays}) 0deg 3deg, transparent 3deg 12deg)`,
          WebkitMaskImage: 'radial-gradient(60% 60% at 74% 38%, #000 0%, transparent 100%)',
          mixBlendMode: 'screen',
        }}
      />
      <AbsoluteFill style={{background: `radial-gradient(${18 + boom * 30}% ${18 + boom * 30}% at 74% 38%, rgba(255,230,170,${0.35 + boom * 0.6}) 0%, transparent 70%)`, mixBlendMode: 'screen'}} />
      <Particles n={50} seed="cm" g={g} t0={start} color="rgba(255,220,160,0.8)" size={[2, 5]} mode="drift" vel={[30, -40]} />
      <Lines
        g={g}
        jelly={hit(g, 30.06, 4)}
        ls={[
          {w: [['ripetilo', 27.78]], x: W / 2, y: 120, size: 110},
          {w: [['noi', 28.7], ['ce', 29.06], ['la', 29.64]], x: W / 2, y: 245, size: 130},
          {w: [['faremo', 30.06]], x: W / 2, y: 420, size: 260, caps: true, color: '#FFE0A6'},
        ]}
      />
    </Cam>
  );
};

const SCENES: [number, number, React.FC<SP>][] = [
  [0, 4.36, SCover],
  [4.36, 6.62, SMondo],
  [6.62, 8.16, SGatto],
  [8.16, 10.36, SStatua],
  [10.36, 13.31, SLibro],
  [13.31, 16.44, SFiamma],
  [16.44, 19.14, SSoldi],
  [19.14, 19.82, (p) => <SRock {...p} at={19.14} />],
  [19.82, 21.56, SMano],
  [21.56, 25.0, SClessidra],
  [25.0, 25.82, (p) => <SRock {...p} at={25.0} />],
  [25.82, 27.78, SRosa],
  [27.78, DURATION, SCima],
];

// stacchi: lampi bianchi brevi o negativo
const FLASH: [number, 'inv' | 'white', number][] = [
  [4.36, 'white', 6],
  [9.1, 'inv', 3],
  [9.62, 'white', 3],
  [10.0, 'white', 3],
  [15.68, 'white', 5],
  [19.14, 'white', 8],
  [23.52, 'inv', 3],
  [25.0, 'white', 6],
  [30.06, 'white', 10],
];

export const Roccia: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const g = frame / FPS;
  let inv = false;
  let white = 0;
  for (const [at, kind, n] of FLASH) {
    const k = frame - Math.round(at * FPS);
    if (k < 0 || k >= n) continue;
    if (kind === 'inv') inv = true;
    else white = Math.max(white, (1 - k / n) * 0.85);
  }
  const black = Math.max(1 - prog(g, 0, 0.8), prog(g, DURATION - 0.6, DURATION));
  const punch = 1 + beatPulse(g) * 0.008;
  const f2 = Math.floor(frame / 2);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${punch})`, filter: inv ? 'invert(1) hue-rotate(180deg)' : undefined}}>
        {SCENES.map(([a, b, C], i) => {
          const from = Math.round(a * FPS);
          return (
            <Sequence key={i} from={from} durationInFrames={Math.round(b * FPS) - from}>
              <C start={a} end={b} />
            </Sequence>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(85% 80% at 50% 50%, transparent 50%, rgba(0,0,0,0.6) 100%)'}} />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('simba/grain.png')})`,
          backgroundPosition: `${Math.floor(random(`g${f2}`) * 512)}px ${Math.floor(random(`h${f2}`) * 512)}px`,
          mixBlendMode: 'overlay',
          opacity: 0.13,
        }}
      />
      {white > 0 && <AbsoluteFill style={{background: '#FFF6EA', opacity: white}} />}
      {black > 0 && <AbsoluteFill style={{background: '#000', opacity: black}} />}
      <Audio src={src('audio.m4a')} />
    </AbsoluteFill>
  );
};

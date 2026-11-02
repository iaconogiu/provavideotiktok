import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, random, staticFile, useCurrentFrame} from 'remotion';
import data from './words.json';

/**
 * "Freedom": edit "da After Effects" su oggetti generati (cuore, lupo, pillola, mare, telefono,
 * colomba, gabbia, aquila, salto, iceberg) più la copertina. Testo serif condensato che vive
 * nella scena, oggetti davanti alle parole (che restano sempre leggibili), stacchi in negativo /
 * bianco / nero, lente, scacchiera invertita e bicromia sullo strobo di "freedom", sole con
 * raggi che sorge dietro l'iceberg.
 */

export const FPS = 60;
export const DURATION = 28.15;
export const FREEDOM_FRAMES = Math.round(DURATION * FPS);
const W = 1920;
const H = 1080;
const BEATS = data.beats as number[];

const src = (p: string) => staticFile(`freedom/${p}`);
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const prog = (g: number, a: number, b: number) => clamp((g - a) / (b - a));
const ease = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeIn = (t: number) => t * t * t;

const beatPulse = (t: number) => {
  let last = -10;
  for (const b of BEATS) {
    if (b <= t + 0.01) last = b;
    else break;
  }
  return Math.exp(-(t - last) * 10);
};
// colpo che decade da un istante preciso (parole, stacchi)
const hit = (g: number, at: number, k = 12) => (g >= at ? Math.exp(-(g - at) * k) : 0);

const SERIF = '"FBodoni", "Bodoni Moda", serif';
const SANS = '"FOswald", "Oswald", sans-serif';
const SERIF_X = 0.74; // condensato
const SANS_Y = 1.4; // allungato
const GLOW = '0 0 14px rgba(255,255,255,0.5), 0 0 46px rgba(255,214,170,0.3), 0 4px 22px rgba(0,0,0,0.7)';

/** carica i font prima di renderizzare */
const useFonts = () => {
  const [handle] = useState(() => delayRender('font Freedom'));
  useEffect(() => {
    Promise.all([
      new FontFace('FBodoni', `url(${src('font/BodoniModa.ttf')})`).load(),
      new FontFace('FOswald', `url(${src('font/Oswald.ttf')})`).load(),
    ])
      .then((fs) => fs.forEach((f) => document.fonts.add(f)))
      .finally(() => continueRender(handle));
  }, [handle]);
};

// misura reale della parola: la riduce finché sta nella larghezza data
let ctx: CanvasRenderingContext2D | null = null;
const fit = (text: string, size: number, sans: boolean | undefined, maxW: number) => {
  ctx ??= document.createElement('canvas').getContext('2d');
  if (!ctx) return size;
  ctx.font = sans ? `600 ${size}px ${SANS}` : `800 ${size}px ${SERIF}`;
  const w = ctx.measureText(text).width * (sans ? 1 : SERIF_X);
  return w > maxW ? (size * maxW) / w : size;
};

// ── testo ──
type Wd = {
  text: string;
  at: number;
  x: number;
  y: number;
  size: number;
  until?: number;
  sans?: boolean;
  dim?: boolean;
  align?: 'left' | 'center';
  max?: number;
};

/** una parola che entra sfocata e ingrandita, come una scritta che "atterra" nella scena */
const Word: React.FC<{w: Wd; g: number; vanish?: number}> = ({w, g, vanish = 0}) => {
  if (g < w.at - 0.001 || (w.until !== undefined && g >= w.until)) return null;
  const p = easeOut(prog(g, w.at, w.at + 0.14));
  const left = w.align === 'left';
  const size = fit(w.text, w.size, w.sans, w.max ?? (left ? W - w.x - 120 : 1640));
  return (
    <div
      style={{
        position: 'absolute',
        left: w.x,
        top: w.y,
        transform: `translate(${left ? 0 : -50}%, -50%) scale(${1.22 - 0.22 * p}) ${w.sans ? `scaleY(${SANS_Y})` : `scaleX(${SERIF_X})`}`,
        transformOrigin: left ? '0% 50%' : '50% 50%',
        opacity: p * (w.dim ? 0.7 : 1),
        filter: p < 1 ? `blur(${(1 - p) * 12}px)` : undefined,
        fontFamily: w.sans ? SANS : SERIF,
        fontWeight: w.sans ? 600 : 800,
        fontSize: size,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        color: '#FFFFFF',
        textShadow: GLOW,
      }}
    >
      {vanish > 0
        ? [...w.text].map((ch, i) => (
            <span key={i} style={{opacity: random(`v${w.text}${i}`) < vanish ? 0 : 1}}>
              {ch}
            </span>
          ))
        : w.text}
    </div>
  );
};
const Words: React.FC<{ws: Wd[]; g: number; vanish?: number}> = ({ws, g, vanish}) => (
  <>
    {ws.map((w, i) => (
      <Word key={i} w={w} g={g} vanish={vanish} />
    ))}
  </>
);

/** l'ultima parola uscita in un elenco, grande; sempre intera dentro lo schermo */
const BigWord: React.FC<{list: [string, number][]; g: number; size: number; x?: number; y?: number; sans?: boolean; max?: number}> = ({
  list,
  g,
  size,
  x = W / 2,
  y = H / 2,
  sans,
  max = 1700,
}) => {
  let cur: [string, number] | null = null;
  for (const it of list) if (g >= it[1]) cur = it;
  if (!cur) return null;
  const p = easeOut(prog(g, cur[1], cur[1] + 0.12));
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${1.15 - 0.15 * p}) ${sans ? `scaleY(${SANS_Y})` : `scaleX(${SERIF_X})`}`,
        fontFamily: sans ? SANS : SERIF,
        fontWeight: sans ? 600 : 800,
        fontSize: fit(cur[0], size, sans, max),
        lineHeight: 1,
        whiteSpace: 'nowrap',
        color: '#FFFFFF',
        textShadow: GLOW,
        opacity: p,
        filter: p < 1 ? `blur(${(1 - p) * 14}px)` : undefined,
      }}
    >
      {cur[0]}
    </div>
  );
};

const Cut: React.FC<{name: string; style?: React.CSSProperties; w?: number; dy?: number}> = ({name, style, w = W, dy = 0}) => (
  <Img src={src(`cut/${name}.png`)} style={{position: 'absolute', width: w, left: (W - w) / 2, top: (H - (w * 2) / 3) / 2 + dy, ...style}} />
);
const Full: React.FC<{name: string; style?: React.CSSProperties}> = ({name, style}) => (
  <Img src={src(name)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style}} />
);

// ── scene: ognuna riceve l'istante d'inizio e lavora in tempo globale g ──
type SP = {start: number; end: number};
const useG = (start: number) => start + useCurrentFrame() / FPS;

/** A. la copertina: lo sfondo ricostruito resta dietro, albero e muretto avanzano appena */
const SCover: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = ease(prog(g, start, end));
  const whip = easeIn(prog(g, end - 0.14, end));
  const cam = (k: number) => `scale(${(1.08 + k * p) * (1 + whip * 2.2)})`;
  return (
    <AbsoluteFill style={{filter: whip > 0 ? `blur(${whip * 18}px)` : undefined}}>
      <AbsoluteFill style={{transform: cam(0.05), transformOrigin: '50% 62%'}}>
        <Full name="plate-cover.jpg" />
      </AbsoluteFill>
      <AbsoluteFill style={{transform: cam(0.1), transformOrigin: '50% 62%'}}>
        <Full name="cut/cover.png" />
      </AbsoluteFill>
      <AbsoluteFill style={{opacity: 1 - whip}}>
        <Words
          g={g}
          ws={[
            {text: 'E A VOLTE', at: 0.0, x: 110, y: 290, size: 96, align: 'left', max: 420},
            {text: 'QUESTA MIA', at: 0.58, x: 110, y: 400, size: 96, align: 'left', max: 420},
            {text: 'RABBIA', at: 1.06, x: 1590, y: 345, size: 170, max: 520},
          ]}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** B. il cuore di vetro sopra la parola, batte sul beat */
const SHeart: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = prog(g, start, end);
  const beat = beatPulse(g);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(60% 60% at 50% 45%, #3a0806 0%, #0b0101 70%, #000 100%)'}}>
      <BigWord
        list={[
          ['MANGIA', 1.32],
          ['ANCORA', 1.6],
          ['IL CUORE', 1.76],
        ]}
        g={g}
        size={330}
        y={850}
        max={1640}
      />
      <div style={{position: 'absolute', inset: 0, transform: `scale(${0.95 + p * 0.08 + beat * 0.06}) rotate(${-3 + p * 6}deg)`, transformOrigin: '50% 40%'}}>
        <Cut name="1-cuore" w={1080} dy={-95} style={{filter: `drop-shadow(0 0 ${30 + beat * 50}px rgba(255,70,20,${0.35 + beat * 0.4})) brightness(${1 + beat * 0.35})`}} />
      </div>
    </AbsoluteFill>
  );
};

/** C. il lupo entra da destra; su "reale" la parola esplode accanto a lui */
const SWolf: React.FC<SP> = ({start}) => {
  const g = useG(start);
  const inP = easeOut(prog(g, start, start + 0.3));
  const real = g >= 3.98;
  const shake = hit(g, 3.98, 6) * 26;
  const sx = (random(`wx${Math.floor(g * 30)}`) - 0.5) * shake;
  const sy = (random(`wy${Math.floor(g * 30)}`) - 0.5) * shake;
  const split = hit(g, 3.98, 5) * 22;
  const wolf = (x: number, filter?: string, blend?: React.CSSProperties['mixBlendMode']) => (
    <Cut
      name="2-lupo"
      w={1500}
      style={{left: 560 + (1 - inP) * 700 + x + (real ? 250 : 0), transform: `scale(${real ? 1.1 + (g - 3.98) * 0.08 : 1})`, filter, mixBlendMode: blend}}
    />
  );
  return (
    <AbsoluteFill style={{background: 'radial-gradient(70% 70% at 65% 45%, #0b1d48 0%, #030714 65%, #000 100%)', transform: `translate(${sx}px, ${sy}px)`}}>
      {real && <BigWord list={[['REALE', 3.98]]} g={g} size={520} x={620} max={1000} />}
      <AbsoluteFill style={{filter: inP < 1 ? `blur(${(1 - inP) * 10}px)` : undefined}}>
        {split > 1 && wolf(-split, 'sepia(1) saturate(6) hue-rotate(-50deg) brightness(0.9)', 'screen')}
        {split > 1 && wolf(split, 'sepia(1) saturate(6) hue-rotate(170deg) brightness(0.9)', 'screen')}
        {wolf(0)}
      </AbsoluteFill>
      <Words
        g={g}
        ws={[
          {text: 'E A VOLTE', at: 2.47, x: 140, y: 300, size: 96, align: 'left', until: 3.98, max: 560},
          {text: 'QUELLA', at: 2.84, x: 140, y: 410, size: 96, align: 'left', until: 3.98, max: 560},
          {text: 'MINACCIA', at: 3.08, x: 140, y: 560, size: 170, align: 'left', until: 3.98, max: 620},
          {text: 'DIVENTA', at: 3.6, x: 140, y: 715, size: 96, align: 'left', until: 3.98, max: 560},
        ]}
      />
    </AbsoluteFill>
  );
};

/** D. la capsula aperta con la sua polvere vera, che scivola giù */
const SPill: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = ease(prog(g, start, end));
  const k = g - start;
  // la polvere dell'immagine originale: una copia mascherata che scende piano
  const powder = 'radial-gradient(9% 20% at 49% 76%, #000 30%, transparent 100%)';
  return (
    <AbsoluteFill style={{background: 'radial-gradient(55% 55% at 50% 45%, #1c0404 0%, #000 75%)'}}>
      <AbsoluteFill style={{transform: `scale(${0.92 + p * 0.1}) rotate(${-2 + p * 4}deg)`, transformOrigin: '50% 40%'}}>
        <Img src={src('3-pillola.webp')} style={{position: 'absolute', width: 1500, left: (W - 1500) / 2, top: -40, mixBlendMode: 'lighten'}} />
        <Img
          src={src('3-pillola.webp')}
          style={{
            position: 'absolute',
            width: 1500,
            left: (W - 1500) / 2,
            top: -40 + k * 45,
            mixBlendMode: 'lighten',
            opacity: 0.85,
            WebkitMaskImage: powder,
            maskImage: powder,
          }}
        />
        <Img src={src('cut/3-pillola.png')} style={{position: 'absolute', width: 1500, left: (W - 1500) / 2, top: -40}} />
      </AbsoluteFill>
      <Words
        g={g}
        ws={[
          {text: "NON C'È", at: 4.65, x: W / 2, y: 140, size: 110},
          {text: 'CALMA', at: 5.0, x: W / 2, y: 900, size: 260},
          {text: "(NON C'È CURA)", at: 5.84, x: W / 2, y: 225, size: 46, dim: true, sans: true},
        ]}
      />
    </AbsoluteFill>
  );
};

/** E. il tramonto che diventa alba: "l'alba" sdraiata sul mare */
const SSea: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = ease(prog(g, start, end));
  const dawn = ease(prog(g, 7.62, 8.3));
  const flare = hit(g, 7.7, 3) * 0.9 + dawn * 0.25;
  return (
    <AbsoluteFill style={{transform: `scale(${1.04 + p * 0.1})`, transformOrigin: '50% 55%'}}>
      <Full name="4a-tramonto.webp" />
      <Full
        name="4b-alba.webp"
        style={{
          WebkitMaskImage: `linear-gradient(to top, #000 ${dawn * 130 - 30}%, transparent ${dawn * 130}%)`,
          maskImage: `linear-gradient(to top, #000 ${dawn * 130 - 30}%, transparent ${dawn * 130}%)`,
        }}
      />
      <AbsoluteFill style={{background: `radial-gradient(22% 30% at 50% 54%, rgba(255,240,210,${flare}) 0%, transparent 100%)`, mixBlendMode: 'screen'}} />
      <Words
        g={g}
        ws={[
          {text: 'MA DOPO', at: 6.14, x: W / 2, y: 170, size: 90, until: 7.7},
          {text: 'UN TRAMONTO', at: 6.34, x: W / 2, y: 280, size: 140, until: 7.7},
          {text: 'SI IMPARA', at: 6.82, x: W / 2, y: 390, size: 78, until: 7.22},
          {text: 'AD APPREZZARE', at: 7.22, x: W / 2, y: 390, size: 78, until: 7.7},
        ]}
      />
      {g >= 7.7 && (
        <div style={{position: 'absolute', left: 0, top: 560, width: W, height: 520, perspective: 700}}>
          <div style={{position: 'absolute', inset: 0, transform: 'rotateX(58deg)', transformOrigin: '50% 0%'}}>
            <Words g={g} ws={[{text: "L'ALBA", at: 7.7, x: W / 2, y: 230, size: 330, max: 1500}]} />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/** F. "ah-ah": la lente gonfia il sole, poi il mare si specchia nel cielo */
const SAh: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  // la lente: copie concentriche sempre più ingrandite verso il centro (bombatura a gradini, sfumata dal mosso)
  const k = hit(g, 9.0, 3.5) * 0.9 + hit(g, 9.4, 3.5) * 1.1;
  const out = easeIn(prog(g, end - 0.45, end));
  const punch = 1 + hit(g, 9.0, 8) * 0.12 + hit(g, 9.4, 8) * 0.16;
  const RINGS = 9;
  const img = (
    <AbsoluteFill>
      <Full name="4b-alba.webp" style={{transform: 'scale(1.25)', transformOrigin: '50% 55%'}} />
      {k > 0.02 &&
        Array.from({length: RINGS}, (_, i) => {
          const r = 62 * (1 - i / RINGS);
          const s = 1.25 * (1 + k * ((i + 1) / RINGS) ** 1.6);
          return (
            <AbsoluteFill key={i} style={{clipPath: `circle(${r}% at 50% 55%)`}}>
              <Full name="4b-alba.webp" style={{transform: `scale(${s})`, transformOrigin: '50% 55%'}} />
            </AbsoluteFill>
          );
        })}
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${punch * (1 + out * 1.5)}) rotate(${out * 25}deg)`, filter: `blur(${k * 3 + out * 20}px)${out > 0 ? ` brightness(${1 - out * 0.8})` : ''}`}}>
        {img}
        {g >= 9.4 && <AbsoluteFill style={{clipPath: 'inset(0 0 55% 0)', transform: 'scaleY(-1)', transformOrigin: '50% 50%'}}>{img}</AbsoluteFill>}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** G. il telefono che squilla dentro gli anelli dei fusi orari */
const CITIES = 'ROMA 03:00 · NEW YORK 21:00 · TOKYO 11:00 · LOS ANGELES 18:00 · DUBAI 06:00 · SYDNEY 12:00 · LONDRA 02:00 · ';
const PHONE_Y = H / 2 - 90;
const Ring: React.FC<{r: number; rot: number; size: number; color: string; id: string; outline?: boolean}> = ({r, rot, size, color, id, outline}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, transform: `rotate(${rot}deg)`, transformOrigin: `50% ${(PHONE_Y / H) * 100}%`}}>
    <defs>
      <path id={id} d={`M ${W / 2 - r} ${PHONE_Y} a ${r} ${r} 0 1 1 ${2 * r} 0 a ${r} ${r} 0 1 1 ${-2 * r} 0`} />
    </defs>
    <text
      fontFamily={SANS}
      fontWeight={600}
      fontSize={size}
      letterSpacing={size * 0.08}
      fill={outline ? 'none' : color}
      stroke={outline ? color : 'none'}
      strokeWidth={1.5}
      textLength={2 * Math.PI * r * 0.995}
      lengthAdjust="spacingAndGlyphs"
    >
      <textPath href={`#${id}`}>{CITIES}</textPath>
    </text>
  </svg>
);
const SPhone: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = prog(g, start, end);
  const ring = g < 11.66 ? Math.sin(g * 70) * 3.2 * (0.6 + 0.4 * Math.sin(g * 9)) : 0;
  const rings = ease(prog(g, 11.6, 12.0));
  // "ma io": la camera si tuffa nel disco del telefono, poi torna indietro su "ci sarò"
  const dive = easeIn(prog(g, 12.66, 12.9)) * (1 - easeOut(prog(g, 12.9, 13.3)));
  const after = g >= 12.9;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(60% 60% at 50% 42%, #241808 0%, #070401 70%, #000 100%)'}}>
      <AbsoluteFill style={{filter: dive > 0.05 ? `blur(${dive * 12}px)` : undefined}}>
        <AbsoluteFill style={{opacity: rings * 0.8}}>
          <Ring id="r1" r={420} rot={-g * 14} size={30} color="#E8C27A" />
          <Ring id="r2" r={350} rot={g * 22} size={22} color="#E8C27A" outline />
        </AbsoluteFill>
        <div style={{position: 'absolute', inset: 0, transform: `scale(${(after ? 0.62 + (g - 12.9) * 0.04 : 0.72 + p * 0.06) * (1 + dive * 3)}) rotate(${ring}deg)`, transformOrigin: `44% ${(PHONE_Y / H) * 100}%`}}>
          <Cut name="5-telefono" w={1250} dy={-90} style={{filter: 'drop-shadow(0 0 40px rgba(255,190,90,0.25))'}} />
        </div>
      </AbsoluteFill>
      {after ? (
        <BigWord
          list={[
            ['CI', 12.9],
            ['CI SARÒ', 13.16],
          ]}
          g={g}
          size={300}
          y={890}
          max={1500}
        />
      ) : (
        <BigWord
          list={[
            ['SE CHIAMI', 10.5],
            ['GUARDA', 11.66],
            ['I FUSI ORARI', 11.88],
            ['MA IO', 12.66],
          ]}
          g={g}
          size={190}
          y={930}
          sans
          max={1500}
        />
      )}
    </AbsoluteFill>
  );
};

/** H. il salto: "fallire" cade a pezzi dietro di lui, "lo farò" resta */
const SJump: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = ease(prog(g, start, end));
  const word = 'FALLIRE';
  const size = fit(word, 400, false, 1500);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${1.06 + p * 0.05})`}}>
        <Full name="plate-6d-salto.jpg" style={{filter: 'sepia(0.35) contrast(1.15) brightness(0.8)'}} />
      </AbsoluteFill>
      {g >= 15.92 && (
        <div
          style={{
            position: 'absolute',
            left: W / 2,
            top: 600,
            transform: `translate(-50%, -50%) scaleX(${SERIF_X})`,
            fontFamily: SERIF,
            fontWeight: 800,
            fontSize: size,
            lineHeight: 1,
            color: '#fff',
            textShadow: GLOW,
            whiteSpace: 'nowrap',
            opacity: easeOut(prog(g, 15.92, 16.05)),
          }}
        >
          {[...word].map((ch, i) => {
            const t0 = 16.3 + random(`f${i}`) * 0.6;
            const k = Math.max(0, g - t0);
            return (
              <span key={i} style={{display: 'inline-block', transform: `translateY(${k * k * 2600}px) rotate(${k * (random(`fr${i}`) - 0.5) * 220}deg)`}}>
                {ch}
              </span>
            );
          })}
        </div>
      )}
      <AbsoluteFill style={{transform: `scale(${1.06 + p * 0.1}) translateY(${-p * 20}px)`}}>
        <Full name="cut/6d-salto.png" style={{filter: 'sepia(0.35) contrast(1.15) brightness(0.8)'}} />
      </AbsoluteFill>
      <Words
        g={g}
        ws={[
          {text: 'E POTRÒ', at: 14.9, x: 1560, y: 200, size: 110, until: 16.3, max: 560},
          {text: 'UN DOMANI', at: 16.3, x: 1560, y: 200, size: 110, until: 17.02, max: 560},
          {text: 'PERÒ', at: 17.02, x: 1560, y: 200, size: 130, until: 17.32, max: 560},
          {text: 'LO FARÒ', at: 17.32, x: W / 2, y: 850, size: 280, max: 1300},
        ]}
      />
    </AbsoluteFill>
  );
};

/** I. FREEDOM: bicromia, scacchiera invertita, strobo, griglia; la scritta resta sempre leggibile */
const HITS = [18.57, 19.42, 20.7, 21.48, 22.54];
const IMGS = ['6b-gabbia.webp', '6a-colomba.webp', '6e-aquila.webp', '6d-salto.webp'];
const Duo: React.FC = () => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <filter id="duo" colorInterpolationFilters="sRGB">
      <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0" />
      <feComponentTransfer>
        <feFuncR type="table" tableValues="0.03 0.91 1" />
        <feFuncG type="table" tableValues="0.03 0.52 0.96" />
        <feFuncB type="table" tableValues="0.09 0.14 0.86" />
      </feComponentTransfer>
    </filter>
  </svg>
);
const checker = (size: number, off: number) => {
  const m = `repeating-conic-gradient(#000 0% 25%, transparent 0% 50%) ${off}px ${off}px / ${size}px ${size}px`;
  return {WebkitMask: m, mask: m} as React.CSSProperties;
};
const FreedomText: React.FC<{scale?: number}> = ({scale = 1}) => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
    <div
      style={{
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: fit('FREEDOM', 420, true, 1720),
        lineHeight: 1,
        transform: `scale(${scale}) scaleY(1.7)`,
        whiteSpace: 'nowrap',
        color: '#FFF3DC',
        WebkitTextStroke: '3px #120A02',
        textShadow: '0 0 30px rgba(0,0,0,0.85), 0 0 60px rgba(255,180,90,0.45)',
      }}
    >
      FREEDOM
    </div>
  </AbsoluteFill>
);
const SFreedom: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const f = Math.floor((g - start) * FPS);
  let ph = 0;
  HITS.forEach((h, i) => {
    if (g >= h) ph = i;
  });
  const beat = beatPulse(g);
  const strobe = Math.floor(f / 5) % 2 === 0;
  const off = Math.floor(g / 0.55) * 60;
  const zoom = 1 + hit(g, HITS[ph], 7) * 0.15 + beat * 0.03;
  const base = (name: string) => <Full name={name} style={{filter: 'url(#duo) contrast(1.25)'}} />;
  const white = easeIn(prog(g, end - 0.5, end));
  // quando c'è la scritta lo sfondo si abbassa, così FREEDOM si legge
  let text = false;
  let scene: React.ReactNode = null;
  if (ph === 0) {
    text = strobe;
    scene = (
      <>
        {base(IMGS[0])}
        <AbsoluteFill style={{...checker(270, off), filter: 'invert(1)'}}>{base(IMGS[0])}</AbsoluteFill>
      </>
    );
  } else if (ph === 1) {
    text = true;
    const a = strobe ? IMGS[1] : IMGS[0];
    scene = (
      <>
        {base(a)}
        <AbsoluteFill style={{...checker(180, off), filter: 'invert(1)'}}>{base(a)}</AbsoluteFill>
      </>
    );
  } else if (ph === 2) {
    const z = 1.7 - 0.7 * easeOut(prog(g, HITS[2], HITS[2] + 0.5));
    scene = (
      <AbsoluteFill style={{transform: `scale(${z})`, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)'}}>
        {Array.from({length: 9}, (_, i) => (
          <div key={i} style={{position: 'relative', overflow: 'hidden', filter: (i + Math.floor(f / 6)) % 2 ? 'invert(1)' : undefined}}>
            {base(IMGS[2])}
          </div>
        ))}
      </AbsoluteFill>
    );
  } else if (ph === 3) {
    text = true;
    const img = <AbsoluteFill>{base(strobe ? IMGS[3] : IMGS[2])}</AbsoluteFill>;
    scene = (
      <>
        {img}
        <AbsoluteFill style={{clipPath: 'inset(0 0 0 50%)', transform: 'scaleX(-1)'}}>{img}</AbsoluteFill>
      </>
    );
  } else {
    text = true;
    const cyc = Math.floor(f / 4);
    scene = (
      <AbsoluteFill style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(4, 1fr)'}}>
        {Array.from({length: 16}, (_, i) => (
          <div key={i} style={{position: 'relative', overflow: 'hidden', filter: (i + cyc) % 3 === 0 ? 'invert(1)' : undefined}}>
            {base(IMGS[(i + cyc) % 4])}
          </div>
        ))}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Duo />
      <AbsoluteFill style={{transform: `scale(${zoom})`, filter: `brightness(${(text ? 0.42 : 1) + beat * 0.25})`}}>{scene}</AbsoluteFill>
      {text && <FreedomText scale={ph === 4 ? 1 + prog(g, HITS[4], end) * 0.06 : 1} />}
      <AbsoluteFill style={{background: '#FFF6E6', opacity: white}} />
    </AbsoluteFill>
  );
};

/** J. il sole sorge dietro l'iceberg: la notte blu diventa oro */
const SIce: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = ease(prog(g, start, end));
  const rise = easeOut(prog(g, start + 0.1, 27.2));
  const sunY = 760 - rise * 420;
  const sy = (sunY / H) * 100;
  const warm = ease(prog(g, 24.4, 27.2));
  const vanish = prog(g, 27.0, 27.9);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${1.05 + p * 0.08})`, transformOrigin: '54% 60%'}}>
        {/* cielo e mare: aurora portata sul blu notte, poi scaldata dall'oro */}
        <Full name="7-iceberg.webp" style={{filter: `hue-rotate(${50 - warm * 30}deg) saturate(${0.75 - warm * 0.35}) brightness(${0.75 + warm * 0.15})`}} />
        <AbsoluteFill style={{background: `radial-gradient(90% 80% at 54% ${sy}%, rgba(255,160,60,${warm * 0.55}) 0%, rgba(120,60,20,${warm * 0.3}) 60%, transparent 100%)`, mixBlendMode: 'soft-light'}} />
        <AbsoluteFill
          style={{
            background: `repeating-conic-gradient(from ${g * 8}deg at 54% ${sy}%, rgba(255,210,140,0.5) 0deg 4deg, transparent 4deg 13deg)`,
            WebkitMaskImage: `radial-gradient(48% 70% at 54% ${sy}%, #000 0%, transparent 100%)`,
            maskImage: `radial-gradient(48% 70% at 54% ${sy}%, #000 0%, transparent 100%)`,
            opacity: rise * 0.8,
            mixBlendMode: 'screen',
            filter: 'blur(3px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: W * 0.54 - 260,
            top: sunY - 260,
            width: 520,
            height: 520,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #FFFDF2 0%, #FFE8A8 22%, rgba(255,170,60,0.75) 40%, rgba(255,120,30,0) 70%)',
            mixBlendMode: 'screen',
            opacity: 0.4 + rise * 0.6,
          }}
        />
        <Full name="cut/7-iceberg.png" style={{filter: `saturate(${0.35 + warm * 0.4}) sepia(${warm * 0.75}) hue-rotate(${-warm * 8}deg) brightness(${0.95 + warm * 0.2})`}} />
      </AbsoluteFill>
      <Words
        g={g}
        vanish={vanish}
        ws={[
          {text: 'VOGLIO IL SOLE', at: 23.96, x: W / 2, y: 140, size: 110},
          {text: 'RICOPRA DI RAGGI', at: 24.72, x: W / 2, y: 260, size: 110},
          {text: 'UNO DEL', at: 25.78, x: W / 2, y: 850, size: 100},
          {text: 'POLO NORD', at: 26.24, x: W / 2, y: 970, size: 160},
        ]}
      />
      <AbsoluteFill style={{background: '#000', opacity: ease(prog(g, 27.55, end))}} />
    </AbsoluteFill>
  );
};

// ── montaggio ──
const SCENES: [number, number, React.FC<SP>][] = [
  [0, 1.32, SCover],
  [1.32, 2.47, SHeart],
  [2.47, 4.65, SWolf],
  [4.65, 6.14, SPill],
  [6.14, 9.0, SSea],
  [9.0, 10.5, SAh],
  [10.5, 14.9, SPhone],
  [14.9, 18.5, SJump],
  [18.5, 23.9, SFreedom],
  [23.9, DURATION, SIce],
];
// stacchi: negativo, bianco, nero (istante, tipo, fotogrammi)
const FLASH: [number, 'inv' | 'white' | 'black', number][] = [
  [1.32, 'inv', 3],
  [2.47, 'white', 2],
  [3.98, 'inv', 3],
  [4.65, 'black', 3],
  [6.14, 'black', 3],
  [7.7, 'white', 5],
  [9.0, 'inv', 4],
  [9.4, 'inv', 4],
  [10.5, 'white', 2],
  [12.66, 'inv', 2],
  [12.9, 'white', 3],
  [14.9, 'white', 4],
  [18.5, 'inv', 3],
  [23.9, 'white', 8],
];

export const Freedom: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const g = frame / FPS;
  let inv = false;
  let white = 0;
  let black = false;
  for (const [at, kind, n] of FLASH) {
    const k = frame - Math.round(at * FPS);
    if (k < 0 || k >= n) continue;
    if (kind === 'inv') inv = true;
    if (kind === 'white') white = Math.max(white, 1 - k / n);
    if (kind === 'black') black = true;
  }
  white = Math.max(white, 1 - prog(g, 0, 0.18));
  const punch = 1 + beatPulse(g) * 0.012;
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
      <AbsoluteFill style={{background: 'radial-gradient(80% 75% at 50% 50%, transparent 45%, rgba(0,0,0,0.6) 100%)'}} />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('simba/grain.png')})`,
          backgroundPosition: `${Math.floor(random(`g${f2}`) * 512)}px ${Math.floor(random(`h${f2}`) * 512)}px`,
          mixBlendMode: 'overlay',
          opacity: 0.12,
        }}
      />
      {white > 0 && <AbsoluteFill style={{background: '#FFFFFF', opacity: white}} />}
      {black && <AbsoluteFill style={{background: '#000'}} />}
      <Audio src={src('audio.m4a')} />
    </AbsoluteFill>
  );
};

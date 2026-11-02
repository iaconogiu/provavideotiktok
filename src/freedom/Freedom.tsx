import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, random, staticFile, useCurrentFrame} from 'remotion';
import data from './words.json';

/**
 * "Freedom": edit "da After Effects" su oggetti generati (cuore, lupo, pillola, mare, telefono,
 * colomba, gabbia, aquila, salto, iceberg) più la copertina. Testo serif condensato che vive
 * dentro la scena, oggetti ritagliati tra due strati di testo, stacchi in negativo / bianco /
 * nero, lente che deforma, scacchiera invertita e bicromia sullo strobo di "freedom",
 * sole con raggi che sorge dietro l'iceberg.
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
const GLOW = '0 0 14px rgba(255,255,255,0.55), 0 0 46px rgba(255,214,170,0.35)';

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

// ── testo ──
type Wd = {
  text: string;
  at: number;
  x: number;
  y: number;
  size: number;
  until?: number;
  sans?: boolean;
  outline?: boolean;
  dim?: boolean;
  align?: 'left' | 'center';
};

/** una parola che entra sfocata e ingrandita, come una scritta che "atterra" nella scena */
const Word: React.FC<{w: Wd; g: number; vanish?: number}> = ({w, g, vanish = 0}) => {
  if (g < w.at - 0.001 || (w.until !== undefined && g >= w.until)) return null;
  const p = easeOut(prog(g, w.at, w.at + 0.14));
  const letters = [...w.text];
  return (
    <div
      style={{
        position: 'absolute',
        left: w.x,
        top: w.y,
        transform: `translate(${w.align === 'left' ? 0 : -50}%, -50%) scale(${1.28 - 0.28 * p}) ${w.sans ? 'scaleY(1.35)' : 'scaleX(0.74)'}`,
        transformOrigin: w.align === 'left' ? '0% 50%' : '50% 50%',
        opacity: p * (w.dim ? 0.55 : 1),
        filter: p < 1 ? `blur(${(1 - p) * 14}px)` : undefined,
        fontFamily: w.sans ? SANS : SERIF,
        fontWeight: w.sans ? 600 : 800,
        fontSize: w.size,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        letterSpacing: w.sans ? '-0.01em' : '0.005em',
        color: w.outline ? 'transparent' : '#FFFFFF',
        WebkitTextStroke: w.outline ? `${Math.max(2, w.size / 90)}px #FFFFFF` : undefined,
        textShadow: GLOW,
      }}
    >
      {vanish > 0
        ? letters.map((ch, i) => (
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

/** l'ultima parola uscita in un elenco, enorme dietro (o davanti) all'oggetto */
const BigWord: React.FC<{list: [string, number][]; g: number; size: number; y?: number; sans?: boolean; clip?: string; outline?: boolean}> = ({
  list,
  g,
  size,
  y = H / 2,
  sans,
  clip,
  outline,
}) => {
  let cur: [string, number] | null = null;
  for (const it of list) if (g >= it[1]) cur = it;
  if (!cur) return null;
  const p = easeOut(prog(g, cur[1], cur[1] + 0.12));
  return (
    <AbsoluteFill style={{clipPath: clip}}>
      <div
        style={{
          position: 'absolute',
          left: W / 2,
          top: y,
          transform: `translate(-50%, -50%) scale(${1.18 - 0.18 * p}) ${sans ? 'scaleY(1.45)' : 'scaleX(0.7)'}`,
          fontFamily: sans ? SANS : SERIF,
          fontWeight: sans ? 600 : 800,
          fontSize: size,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          color: outline ? 'transparent' : '#FFFFFF',
          WebkitTextStroke: outline ? '4px #FFFFFF' : undefined,
          textShadow: GLOW,
          opacity: p,
          filter: p < 1 ? `blur(${(1 - p) * 16}px)` : undefined,
        }}
      >
        {cur[0]}
      </div>
    </AbsoluteFill>
  );
};

const Cut: React.FC<{name: string; style?: React.CSSProperties; w?: number}> = ({name, style, w = W}) => (
  <Img src={src(`cut/${name}.png`)} style={{position: 'absolute', width: w, left: (W - w) / 2, top: (H - (w * 2) / 3) / 2, ...style}} />
);
const Full: React.FC<{name: string; style?: React.CSSProperties}> = ({name, style}) => (
  <Img src={src(name)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style}} />
);

// ── scene: ognuna riceve l'istante d'inizio e lavora in tempo globale g ──
type SP = {start: number; end: number};
const useG = (start: number) => start + useCurrentFrame() / FPS;

/** A. la copertina: la camera entra nel campo, l'albero col muretto si stacca dal cielo */
const SCover: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = ease(prog(g, start, end));
  const whip = easeIn(prog(g, end - 0.12, end));
  const cam = (k: number) => `scale(${(1.1 + k * p) * (1 + whip * 2.2)})`;
  return (
    <AbsoluteFill style={{filter: whip > 0 ? `blur(${whip * 18}px)` : undefined}}>
      <AbsoluteFill style={{transform: cam(0.06), transformOrigin: '50% 60%'}}>
        <Full name="cover.webp" />
      </AbsoluteFill>
      <AbsoluteFill style={{transform: cam(0.22), transformOrigin: '50% 60%'}}>
        <Full name="cut/cover.png" />
      </AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${1 + p * 0.04 + whip * 2})`, transformOrigin: '50% 60%'}}>
        <Words
          g={g}
          ws={[
            {text: 'E A VOLTE', at: 0.0, x: 90, y: 300, size: 104, align: 'left'},
            {text: 'QUESTA MIA', at: 0.58, x: 90, y: 420, size: 104, align: 'left'},
            {text: 'RABBIA', at: 1.06, x: 1600, y: 360, size: 190},
          ]}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** B. il cuore di vetro tra le parole, batte sul beat */
const SHeart: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = prog(g, start, end);
  const beat = beatPulse(g);
  const list: [string, number][] = [
    ['MANGIA', 1.32],
    ['ANCORA', 1.6],
    ['IL CUORE', 1.76],
  ];
  const heart = (
    <div style={{position: 'absolute', inset: 0, transform: `scale(${0.95 + p * 0.1 + beat * 0.06}) rotate(${-3 + p * 6}deg)`}}>
      <Cut name="1-cuore" w={1450} style={{filter: `drop-shadow(0 0 ${30 + beat * 50}px rgba(255,70,20,${0.35 + beat * 0.4})) brightness(${1 + beat * 0.35})`}} />
    </div>
  );
  return (
    <AbsoluteFill style={{background: 'radial-gradient(60% 60% at 50% 50%, #3a0806 0%, #0b0101 70%, #000 100%)'}}>
      <BigWord list={list} g={g} size={440} />
      {heart}
      {/* la metà bassa della parola torna davanti: il cuore resta incastrato nel testo */}
      <BigWord list={list} g={g} size={440} clip="inset(56% 0 0 0)" />
    </AbsoluteFill>
  );
};

/** C. il lupo entra da destra; su "reale" la parola esplode dietro di lui */
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
      style={{left: 560 + (1 - inP) * 700 + x + (real ? -180 : 0), transform: `scale(${real ? 1.18 + (g - 3.98) * 0.08 : 1})`, filter, mixBlendMode: blend}}
    />
  );
  return (
    <AbsoluteFill style={{background: 'radial-gradient(70% 70% at 65% 45%, #0b1d48 0%, #030714 65%, #000 100%)', transform: `translate(${sx}px, ${sy}px)`}}>
      {real && <BigWord list={[['REALE', 3.98]]} g={g} size={560} />}
      <AbsoluteFill style={{filter: inP < 1 ? `blur(${(1 - inP) * 10}px)` : undefined}}>
        {split > 1 && wolf(-split, 'sepia(1) saturate(6) hue-rotate(-50deg) brightness(0.9)', 'screen')}
        {split > 1 && wolf(split, 'sepia(1) saturate(6) hue-rotate(170deg) brightness(0.9)', 'screen')}
        {wolf(0)}
      </AbsoluteFill>
      <Words
        g={g}
        ws={[
          {text: 'E A VOLTE', at: 2.47, x: 140, y: 300, size: 96, align: 'left', until: 3.98},
          {text: 'QUELLA', at: 2.84, x: 140, y: 410, size: 96, align: 'left', until: 3.98},
          {text: 'MINACCIA', at: 3.08, x: 140, y: 560, size: 170, align: 'left', until: 3.98},
          {text: 'DIVENTA', at: 3.6, x: 140, y: 715, size: 96, align: 'left', until: 3.98, outline: true},
        ]}
      />
    </AbsoluteFill>
  );
};

/** D. la capsula si apre in due, la polvere cade */
const SPill: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = ease(prog(g, start, end));
  const d = 40 + p * 150;
  const half = (left: boolean) => (
    <div style={{position: 'absolute', inset: 0, transform: `translateX(${left ? -d : d}px) rotate(${left ? -p * 7 : p * 7}deg)`}}>
      <Cut name="3-pillola" w={1650} style={{clipPath: left ? 'inset(0 50% 0 0)' : 'inset(0 0 0 50%)'}} />
    </div>
  );
  return (
    <AbsoluteFill style={{background: 'radial-gradient(55% 55% at 50% 55%, #1c0404 0%, #000 75%)', transform: `scale(${1 + p * 0.08})`}}>
      <BigWord list={[['CALMA', 5.0]]} g={g} size={380} outline />
      {half(true)}
      {half(false)}
      {/* polvere */}
      {Array.from({length: 70}, (_, i) => {
        const t0 = start + random(`pt${i}`) * 1.2;
        const k = g - t0;
        if (k < 0) return null;
        const x = W / 2 + (random(`px${i}`) - 0.5) * 300 + (random(`pv${i}`) - 0.5) * 160 * k;
        const y = 600 + 320 * k * k + 60 * k;
        const r = 2 + random(`pr${i}`) * 6;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: r, background: '#F4EEE8', opacity: Math.max(0, 0.9 - k * 0.5)}} />;
      })}
      <Words
        g={g}
        ws={[
          {text: "NON C'È", at: 4.65, x: W / 2, y: 190, size: 120},
          {text: "NON C'È CURA", at: 5.84, x: W / 2, y: 930, size: 60, dim: true, sans: true},
        ]}
      />
    </AbsoluteFill>
  );
};

/** E. il tramonto che diventa alba: le parole stanno sul mare */
const SSea: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = ease(prog(g, start, end));
  const dawn = ease(prog(g, 7.62, 8.3));
  const flare = hit(g, 7.7, 3) * 0.9 + dawn * 0.25;
  return (
    <AbsoluteFill style={{transform: `scale(${1.04 + p * 0.1})`, transformOrigin: '50% 55%'}}>
      <Full name="4a-tramonto.webp" />
      {/* l'alba sale dall'orizzonte verso l'alto */}
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
          {text: 'MA DOPO', at: 6.14, x: W / 2, y: 190, size: 96, until: 7.7},
          {text: 'UN TRAMONTO', at: 6.34, x: W / 2, y: 300, size: 140, until: 7.7},
          {text: 'SI IMPARA', at: 6.82, x: 520, y: 430, size: 80, until: 7.7, outline: true},
          {text: 'AD APPREZZARE', at: 7.22, x: 1400, y: 430, size: 80, until: 7.7, outline: true},
        ]}
      />
      {/* "l'alba" sdraiata sull'acqua, con il riflesso */}
      {g >= 7.7 && (
        <div style={{position: 'absolute', left: 0, top: 560, width: W, height: 520, perspective: 700}}>
          <div style={{position: 'absolute', inset: 0, transform: 'rotateX(58deg)', transformOrigin: '50% 0%'}}>
            <Words g={g} ws={[{text: "L'ALBA", at: 7.7, x: W / 2, y: 230, size: 330}]} />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/** F. "ah-ah": la lente deforma il sole, specchio, negativi */
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
        {/* specchio: dopo il secondo "ah" il mare si riflette nel cielo */}
        {g >= 9.4 && <AbsoluteFill style={{clipPath: 'inset(0 0 55% 0)', transform: 'scaleY(-1)', transformOrigin: '50% 50%'}}>{img}</AbsoluteFill>}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** G. il telefono che squilla, gli anelli dei fusi orari, "ci sarò" */
const CITIES = 'ROMA 03:00 · NEW YORK 21:00 · TOKYO 11:00 · LOS ANGELES 18:00 · DUBAI 06:00 · SYDNEY 12:00 · LONDRA 02:00 · ';
const Ring: React.FC<{r: number; rot: number; size: number; color: string; id: string; outline?: boolean}> = ({r, rot, size, color, id, outline}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, transform: `rotate(${rot}deg)`}}>
    <defs>
      <path id={id} d={`M ${W / 2 - r} ${H / 2} a ${r} ${r} 0 1 1 ${2 * r} 0 a ${r} ${r} 0 1 1 ${-2 * r} 0`} />
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
  const list: [string, number][] = after
    ? [
        ['CI', 12.9],
        ['CI SARÒ', 13.16],
      ]
    : [
        ['SE CHIAMI', 10.5],
        ['GUARDA', 11.66],
        ['I FUSI ORARI', 11.88],
        ['MA IO', 12.66],
      ];
  const phone = (
    <div style={{position: 'absolute', inset: 0, transform: `scale(${(after ? 0.78 + (g - 12.9) * 0.05 : 0.9 + p * 0.1) * (1 + dive * 3)}) rotate(${ring}deg)`, transformOrigin: '44% 52%'}}>
      <Cut name="5-telefono" w={1250} style={{filter: 'drop-shadow(0 0 40px rgba(255,190,90,0.25))'}} />
    </div>
  );
  return (
    <AbsoluteFill style={{background: 'radial-gradient(60% 60% at 50% 50%, #241808 0%, #070401 70%, #000 100%)', filter: dive > 0.05 ? `blur(${dive * 12}px)` : undefined}}>
      <AbsoluteFill style={{opacity: rings * 0.85}}>
        <Ring id="r1" r={470} rot={-g * 14} size={34} color="#E8C27A" />
        <Ring id="r2" r={395} rot={g * 22} size={26} color="#E8C27A" outline />
      </AbsoluteFill>
      <BigWord list={list} g={g} size={after ? 470 : 330} sans={!after} />
      {phone}
      <BigWord list={list} g={g} size={after ? 470 : 330} sans={!after} clip="inset(60% 0 0 0)" />
    </AbsoluteFill>
  );
};

/** H. il salto: "fallire" cade a pezzi, "lo farò" resta */
const SJump: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = ease(prog(g, start, end));
  const word = 'FALLIRE';
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${1.06 + p * 0.06}) translateY(${p * 20}px)`}}>
        <Full name="6d-salto.webp" style={{filter: 'sepia(0.35) contrast(1.15) brightness(0.8)'}} />
      </AbsoluteFill>
      {/* FALLIRE: dietro l'uomo, poi le lettere cadono una a una */}
      {g >= 15.92 && (
        <div
          style={{
            position: 'absolute',
            left: W / 2,
            top: 520,
            transform: 'translate(-50%, -50%) scaleX(0.7)',
            fontFamily: SERIF,
            fontWeight: 800,
            fontSize: 430,
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
      <AbsoluteFill style={{transform: `scale(${1.06 + p * 0.16}) translateY(${-p * 30}px)`}}>
        <Full name="cut/6d-salto.png" />
      </AbsoluteFill>
      <Words
        g={g}
        ws={[
          {text: 'E POTRÒ', at: 14.9, x: W / 2, y: 170, size: 110, until: 16.3},
          {text: 'UN DOMANI', at: 16.3, x: W / 2, y: 170, size: 110, until: 17.02, outline: true},
          {text: 'PERÒ', at: 17.02, x: W / 2, y: 300, size: 150, until: 17.32},
          {text: 'LO FARÒ', at: 17.32, x: W / 2, y: 820, size: 300},
        ]}
      />
    </AbsoluteFill>
  );
};

/** I. FREEDOM: bicromia, scacchiera invertita, strobo, scritta-finestra, griglia */
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
const FreedomText: React.FC<{fill?: string; outline?: boolean; scale?: number; diff?: boolean}> = ({fill, outline, scale = 1, diff}) => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', mixBlendMode: diff ? 'difference' : undefined}}>
    <div
      style={{
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: 470,
        lineHeight: 1,
        letterSpacing: '-0.02em',
        transform: `scale(${scale}) scaleY(1.75)`,
        whiteSpace: 'nowrap',
        ...(fill
          ? {backgroundImage: `url(${src(fill)})`, backgroundSize: 'cover', backgroundPosition: 'center', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'url(#duo) contrast(1.2)'}
          : outline
            ? {color: 'transparent', WebkitTextStroke: '5px #FFF3DC'}
            : {color: '#FFF3DC', textShadow: '0 0 40px rgba(255,200,120,0.5)'}),
        ...(diff ? {color: '#FFFFFF', textShadow: 'none', WebkitTextStroke: undefined} : {}),
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
  const base = (name: string, extra?: React.CSSProperties) => <Full name={name} style={{filter: 'url(#duo) contrast(1.25)', ...extra}} />;
  const white = easeIn(prog(g, end - 0.5, end));
  let scene: React.ReactNode = null;
  if (ph === 0) {
    scene = (
      <>
        {base(IMGS[0])}
        <AbsoluteFill style={{...checker(270, off), filter: 'invert(1)'}}>{base(IMGS[0])}</AbsoluteFill>
        {strobe && <FreedomText fill={IMGS[1]} />}
      </>
    );
  } else if (ph === 1) {
    const a = strobe ? IMGS[1] : IMGS[0];
    scene = (
      <>
        {base(a)}
        <AbsoluteFill style={{...checker(180, off), filter: 'invert(1)'}}>{base(a)}</AbsoluteFill>
        <FreedomText diff />
      </>
    );
  } else if (ph === 2) {
    const z = 1.7 - 0.7 * easeOut(prog(g, HITS[2], HITS[2] + 0.5));
    scene = (
      <AbsoluteFill style={{transform: `scale(${z})`, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)'}}>
        {Array.from({length: 9}, (_, i) => (
          <div key={i} style={{position: 'relative', overflow: 'hidden', filter: (i + Math.floor(f / 6)) % 2 ? 'invert(1)' : undefined}}>
            <Full name={IMGS[2]} style={{filter: 'url(#duo) contrast(1.25)'}} />
          </div>
        ))}
      </AbsoluteFill>
    );
  } else if (ph === 3) {
    const img = (
      <AbsoluteFill>
        {base(strobe ? IMGS[3] : IMGS[2])}
      </AbsoluteFill>
    );
    scene = (
      <>
        {img}
        <AbsoluteFill style={{clipPath: 'inset(0 0 0 50%)', transform: 'scaleX(-1)'}}>{img}</AbsoluteFill>
        <FreedomText fill={IMGS[1]} />
      </>
    );
  } else {
    const cyc = Math.floor(f / 4);
    scene = (
      <>
        <AbsoluteFill style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(4, 1fr)'}}>
          {Array.from({length: 16}, (_, i) => (
            <div key={i} style={{position: 'relative', overflow: 'hidden', filter: (i + cyc) % 3 === 0 ? 'invert(1)' : undefined}}>
              <Full name={IMGS[(i + cyc) % 4]} style={{filter: 'url(#duo) contrast(1.25)'}} />
            </div>
          ))}
        </AbsoluteFill>
        <FreedomText scale={1 + prog(g, HITS[4], end) * 0.6} />
      </>
    );
  }
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Duo />
      <AbsoluteFill style={{transform: `scale(${zoom})`, filter: `brightness(${1 + beat * 0.3})`}}>{scene}</AbsoluteFill>
      <AbsoluteFill style={{background: '#FFF6E6', opacity: white}} />
    </AbsoluteFill>
  );
};

/** J. il sole sorge dietro l'iceberg e lo scalda, le parole si sciolgono */
const SIce: React.FC<SP> = ({start, end}) => {
  const g = useG(start);
  const p = ease(prog(g, start, end));
  const rise = easeOut(prog(g, start + 0.1, 27.2));
  const sunY = 760 - rise * 420;
  const warm = ease(prog(g, 24.5, 27.4));
  const vanish = prog(g, 27.0, 27.9);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${1.05 + p * 0.08})`, transformOrigin: '54% 60%'}}>
        <Full name="7-iceberg.webp" style={{filter: `brightness(${0.85 + warm * 0.2}) saturate(${1 - warm * 0.5})`}} />
        {/* raggi e sole, dietro l'iceberg */}
        <AbsoluteFill
          style={{
            background: `repeating-conic-gradient(from ${g * 8}deg at 54% ${(sunY / H) * 100}%, rgba(255,214,140,0.55) 0deg 4deg, transparent 4deg 13deg)`,
            WebkitMaskImage: `radial-gradient(48% 70% at 54% ${(sunY / H) * 100}%, #000 0%, transparent 100%)`,
            maskImage: `radial-gradient(48% 70% at 54% ${(sunY / H) * 100}%, #000 0%, transparent 100%)`,
            opacity: rise * 0.9,
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
        <Full name="cut/7-iceberg.png" style={{filter: `sepia(${warm * 0.7}) saturate(${1 + warm * 1.4}) hue-rotate(${-warm * 10}deg) brightness(${1 + warm * 0.25})`}} />
        <AbsoluteFill style={{background: `radial-gradient(60% 55% at 54% ${(sunY / H) * 100}%, rgba(255,150,50,${warm * 0.35}) 0%, transparent 100%)`, mixBlendMode: 'screen'}} />
      </AbsoluteFill>
      <Words
        g={g}
        vanish={vanish}
        ws={[
          {text: 'VOGLIO IL SOLE', at: 23.96, x: W / 2, y: 150, size: 120, outline: true},
          {text: 'RICOPRA DI RAGGI', at: 24.72, x: W / 2, y: 275, size: 120, outline: true},
          {text: 'UNO DEL', at: 25.78, x: W / 2, y: 830, size: 110},
          {text: 'POLO NORD', at: 26.24, x: W / 2, y: 960, size: 170},
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
      <AbsoluteFill style={{background: 'radial-gradient(80% 75% at 50% 50%, transparent 45%, rgba(0,0,0,0.7) 100%)'}} />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('simba/grain.png')})`,
          backgroundPosition: `${Math.floor(random(`g${f2}`) * 512)}px ${Math.floor(random(`h${f2}`) * 512)}px`,
          mixBlendMode: 'overlay',
          opacity: 0.14,
        }}
      />
      {white > 0 && <AbsoluteFill style={{background: '#FFFFFF', opacity: white}} />}
      {black && <AbsoluteFill style={{background: '#000'}} />}
      <Audio src={src('audio.m4a')} />
    </AbsoluteFill>
  );
};

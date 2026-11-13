import '@fontsource/anton';
import '@fontsource-variable/inter';
import React from 'react';
import voce from './voce.json';

/** materiali comuni del video: misure, colori, tempi della voce, piccoli componenti grafici */

export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const C = {
  night: '#060A22',
  navy: '#0B1240',
  cyan: '#4FE3FF',
  silver: '#DCE6F5',
  bgWhite: '#FFFFFF',
  bgGreen: '#00966E',
  bgRed: '#D62612',
  isBlue: '#02529C',
  isRed: '#DC1E35',
  rsBlue: '#0067B1',
};
export const DISPLAY = '"Anton", "Impact", sans-serif';
export const UI = '"Inter Variable", sans-serif';

// ── funzioni di animazione ──
export const clamp = (v: number) => Math.min(1, Math.max(0, v));
export const prog = (g: number, a: number, b: number) => clamp((g - a) / (b - a));
export const easeOut = (t: number) => 1 - (1 - t) ** 3;
export const easeIn = (t: number) => t * t * t;
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeBack = (t: number) => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2;
export const hit = (g: number, at: number, k = 7) => (g < at ? 0 : Math.exp(-(g - at) * k));

/** comparsa "a scatto" di un elemento al tempo t: sale, si ingrandisce un filo oltre e si assesta */
export const pop = (g: number, t: number, dy = 60, dur = 0.3): React.CSSProperties => {
  const p = prog(g, t, t + dur);
  return {opacity: clamp(p * 2.5), transform: `translateY(${(1 - easeOut(p)) * dy}px) scale(${0.85 + 0.15 * easeBack(p)})`};
};

// ── tempi della voce (src/pronostico/voce.json, generato da scripts/oskarsson_align.py) ──
type VW = {text: string; start: number; end: number; cue: string};
export const WORDS = voce.words as VW[];
export const VOICE = {audio: voce.audio as boolean, offset: voce.offset as number};
export const DURATION = voce.duration + 1.2;
export const FRAMES = Math.ceil(DURATION * FPS);

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9']/g, '');

/** inizio e fine di una battuta */
export const cue = (id: string) => {
  const ws = WORDS.filter((w) => w.cue === id);
  if (!ws.length) throw new Error(`battuta mancante: ${id}`);
  return {start: ws[0].start, end: ws[ws.length - 1].end};
};
/** momento in cui viene detta una parola (la n-esima che comincia così) dentro una battuta */
export const at = (id: string, word: string, nth = 0) => {
  const ws = WORDS.filter((w) => w.cue === id && norm(w.text).startsWith(norm(word)));
  if (!ws.length) throw new Error(`parola "${word}" non trovata nella battuta ${id}`);
  return (ws[nth] ?? ws[ws.length - 1]).start;
};
export const atEnd = (id: string, word: string, nth = 0) => {
  const ws = WORDS.filter((w) => w.cue === id && norm(w.text).startsWith(norm(word)));
  return (ws[nth] ?? ws[ws.length - 1]).end;
};

// ── scene: ognuna comincia poco prima della sua prima battuta e finisce dove comincia la successiva ──
export type SceneId = 'intro' | 'liga' | 'naz' | 'andata' | 'lettura' | 'pron' | 'chiusura';
const FIRST: Record<SceneId, string> = {intro: 'intro', liga: 'liga', naz: 'naz', andata: 'andata', lettura: 'lettura', pron: 'pron', chiusura: 'chiusura'};
const ORDER: SceneId[] = ['intro', 'liga', 'naz', 'andata', 'lettura', 'pron', 'chiusura'];
export const SCENES = ORDER.map((id, i) => ({
  id,
  a: i === 0 ? 0 : cue(FIRST[id]).start - 0.3,
  b: i === ORDER.length - 1 ? DURATION : cue(FIRST[ORDER[i + 1]]).start - 0.3,
}));
export const scene = (id: SceneId) => SCENES.find((s) => s.id === id)!;

/** contenitore di una scena: entra salendo, esce salendo con un po' di sfocatura */
export const SceneBox: React.FC<{g: number; id: SceneId; children: React.ReactNode}> = ({g, id, children}) => {
  const {a, b} = scene(id);
  if (g < a - 0.01 || g > b + 0.01) return null;
  const inP = easeOut(prog(g, a, a + 0.35));
  const out = easeIn(prog(g, b - 0.3, b));
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: Math.min(inP * 1.5, 1 - out),
        transform: `translateY(${(1 - inP) * 90 - out * 120}px) scale(${1 + out * 0.06})`,
        filter: out > 0.02 ? `blur(${out * 14}px)` : undefined,
      }}
    >
      {children}
    </div>
  );
};

// ── grafica ──

export const FlagBG: React.FC<{w: number}> = ({w}) => (
  <svg width={w} height={(w * 3) / 5} viewBox="0 0 5 3" style={{display: 'block', borderRadius: 4, boxShadow: '0 4px 14px rgba(0,0,0,0.4)'}}>
    <rect width="5" height="1" fill={C.bgWhite} />
    <rect y="1" width="5" height="1" fill={C.bgGreen} />
    <rect y="2" width="5" height="1" fill={C.bgRed} />
  </svg>
);

export const FlagIS: React.FC<{w: number}> = ({w}) => (
  <svg width={w} height={(w * 18) / 25} viewBox="0 0 25 18" style={{display: 'block', borderRadius: 4, boxShadow: '0 4px 14px rgba(0,0,0,0.4)'}}>
    <rect width="25" height="18" fill={C.isBlue} />
    <rect x="7" width="4" height="18" fill="#fff" />
    <rect y="7" width="25" height="4" fill="#fff" />
    <rect x="8" width="2" height="18" fill={C.isRed} />
    <rect y="8" width="25" height="2" fill={C.isRed} />
  </svg>
);

/** pallone stilizzato */
export const Ball: React.FC<{size: number; style?: React.CSSProperties}> = ({size, style}) => {
  const pts = (r: number, rot: number) =>
    Array.from({length: 5}, (_, i) => {
      const a = rot + (i * 2 * Math.PI) / 5;
      return `${50 + r * Math.sin(a)},${50 - r * Math.cos(a)}`;
    }).join(' ');
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{display: 'block', filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.45))', ...style}}>
      <circle cx="50" cy="50" r="46" fill="#fff" stroke="#0B1240" strokeWidth="4" />
      <polygon points={pts(16, 0)} fill="#0B1240" />
      {Array.from({length: 5}, (_, i) => {
        const a = (i * 2 * Math.PI) / 5;
        const x1 = 50 + 16 * Math.sin(a);
        const y1 = 50 - 16 * Math.cos(a);
        const x2 = 50 + 36 * Math.sin(a);
        const y2 = 50 - 36 * Math.cos(a);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0B1240" strokeWidth="4" />;
      })}
      {Array.from({length: 5}, (_, i) => {
        const a = (i * 2 * Math.PI) / 5;
        const cx = 50 + 44 * Math.sin(a);
        const cy = 50 - 44 * Math.cos(a);
        return <circle key={i} cx={cx} cy={cy} r="9" fill="#0B1240" />;
      })}
    </svg>
  );
};

/** etichetta piccola spaziata (sopratitolo delle scene) */
export const Kicker: React.FC<{children: React.ReactNode; style?: React.CSSProperties; color?: string}> = ({children, style, color = C.cyan}) => (
  <div style={{fontFamily: UI, fontWeight: 800, fontSize: 34, letterSpacing: 10, color, ...style}}>{children}</div>
);

/** pannello "vetro scuro" su cui stanno numeri e scritte */
export const glass: React.CSSProperties = {
  background: 'linear-gradient(160deg, rgba(20,32,96,0.82) 0%, rgba(8,14,48,0.88) 100%)',
  border: `2px solid ${C.silver}33`,
  borderRadius: 26,
  boxShadow: '0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
};

/** spunta */
export const Check: React.FC<{size: number; color?: string}> = ({size, color = C.cyan}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}>
    <path d="M4 12.5l5 5L20 6.5" fill="none" stroke={color} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── bandiere vere, che sventolano ──

/** bandiera con la geometria ufficiale (Bulgaria 3:5, tre fasce uguali; Islanda 18:25, croce 7-1-2-1-14 × 7-1-2-1-7) */
export const FlagSvg: React.FC<{kind: 'bg' | 'is'; w: number; h: number}> = ({kind, w, h}) =>
  kind === 'bg' ? (
    <svg width={w} height={h} viewBox="0 0 5 3" preserveAspectRatio="none" style={{display: 'block'}}>
      <rect width="5" height="1.01" fill={C.bgWhite} />
      <rect y="1" width="5" height="1.01" fill={C.bgGreen} />
      <rect y="2" width="5" height="1" fill={C.bgRed} />
    </svg>
  ) : (
    <svg width={w} height={h} viewBox="0 0 25 18" preserveAspectRatio="none" style={{display: 'block'}}>
      <rect width="25" height="18" fill={C.isBlue} />
      <rect x="7" width="4" height="18" fill="#fff" />
      <rect y="7" width="25" height="4" fill="#fff" />
      <rect x="8" width="2" height="18" fill={C.isRed} />
      <rect y="8" width="25" height="2" fill={C.isRed} />
    </svg>
  );

export const FLAG_RATIO = {bg: 5 / 3, is: 25 / 18};

/**
 * Bandiera al vento: un'onda che scorre dall'asta al bordo libero deforma la stoffa (mappa di
 * spostamento SVG, un pezzo unico, niente giunture) e le dà luce e ombra. `fw` è la larghezza della
 * bandiera intera (l'altezza segue le proporzioni ufficiali); `vw`×`vh` è la finestra visibile e
 * `ox`,`oy` dove sta la bandiera dentro la finestra.
 */
export const WavingFlag: React.FC<{
  kind: 'bg' | 'is';
  g: number;
  fw: number;
  vw?: number;
  vh?: number;
  ox?: number;
  oy?: number;
  amp?: number;
  strips?: number;
  style?: React.CSSProperties;
}> = ({kind, g, fw, vw, vh, ox = 0, oy = 0, amp, style}) => {
  const fid = `wave${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const fh = fw / FLAG_RATIO[kind];
  const W0 = vw ?? fw;
  const H0 = vh ?? fh;
  const A = amp ?? Math.max(2, fw * 0.022);
  const wl = Math.max(220, fw * 0.55); // lunghezza d'onda
  const phase = (x: number) => g * 3.4 - ((x - ox) / wl) * Math.PI * 2;
  const along = (x: number) => clamp((x - ox) / fw); // 0 all'asta, 1 al bordo libero
  const N = 32;
  const xs = Array.from({length: N + 1}, (_, k) => (k / N) * W0);
  // mappa di spostamento: canale rosso = spostamento verticale
  const mapStops = xs
    .map((x, k) => {
      const v = Math.sin(phase(x)) * (0.25 + along(x) * 0.75);
      return `<stop offset='${(k / N).toFixed(4)}' stop-color='rgb(${Math.round(127.5 + 127 * v)},128,128)'/>`;
    })
    .join('');
  const map = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${W0}' height='${H0}'><defs><linearGradient id='m' x1='0' x2='1' y1='0' y2='0'>${mapStops}</linearGradient></defs><rect width='${W0}' height='${H0}' fill='url(#m)'/></svg>`,
  )}`;
  // luce e ombra in un'unica sfumatura continua sopra la stoffa
  const shade = xs
    .map((x, k) => {
      const sh = Math.cos(phase(x)) * (0.4 + along(x) * 0.6);
      const col = sh > 0 ? `rgba(255,255,255,${(0.17 * sh).toFixed(3)})` : `rgba(0,0,25,${(0.32 * -sh).toFixed(3)})`;
      return `${col} ${((k / N) * 100).toFixed(2)}%`;
    })
    .join(', ');
  return (
    <div style={{position: 'relative', width: W0, height: H0, ...style}}>
      <svg width={W0} height={H0} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <defs>
          <filter id={fid} filterUnits="userSpaceOnUse" x={0} y={-A * 2} width={W0} height={H0 + A * 4} colorInterpolationFilters="sRGB">
            <feImage href={map} x={0} y={-A * 2} width={W0} height={H0 + A * 4} preserveAspectRatio="none" result="m" />
            <feDisplacementMap in="SourceGraphic" in2="m" scale={A * 2} xChannelSelector="G" yChannelSelector="R" />
          </filter>
        </defs>
        <g filter={`url(#${fid})`}>
          <g transform={`translate(${ox} ${oy})`}>
            <FlagSvg kind={kind} w={fw} h={fh} />
          </g>
        </g>
      </svg>
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${shade})`}} />
    </div>
  );
};

/** maglia stilizzata: strisce verticali (Real Sociedad) o tinta unita con bordi (Islanda) */
export const Shirt: React.FC<{size: number; kind: 'rs' | 'is'; num?: string}> = ({size, kind, num}) => {
  const id = `sh${kind}`;
  const body = 'M30 8 L42 4 Q50 12 58 4 L70 8 L94 24 L84 42 L74 36 L74 96 L26 96 L26 36 L16 42 L6 24 Z';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{display: 'block', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.45))'}}>
      <defs>
        <clipPath id={id}>
          <path d={body} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {kind === 'rs' ? (
          <>
            <rect width="100" height="100" fill="#fff" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect key={i} x={i * 18 - 2} width="9" height="100" fill={C.rsBlue} />
            ))}
          </>
        ) : (
          <>
            <rect width="100" height="100" fill={C.isBlue} />
            <path d="M42 4 Q50 12 58 4" stroke="#fff" strokeWidth="5" fill="none" />
            <path d="M84 42 L94 24" stroke={C.isRed} strokeWidth="6" />
            <path d="M16 42 L6 24" stroke={C.isRed} strokeWidth="6" />
          </>
        )}
      </g>
      <path d={body} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" />
      {num && (
        <text x="50" y="74" textAnchor="middle" fontFamily={DISPLAY} fontSize="40" fill="#fff" stroke={kind === 'rs' ? C.navy : 'none'} strokeWidth="1.5">
          {num}
        </text>
      )}
    </svg>
  );
};

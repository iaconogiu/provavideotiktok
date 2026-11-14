import '@fontsource/anton';
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, random} from 'remotion';
import {FlagSvg} from '../pronostico/kit';

/**
 * Grafica del canale MOTB (@manofthebet11), rifatta dai video di riferimento: vedi docs/STILE-MOTB.md.
 * Tutto è in coordinate 1080×1920 e si aggancia ai tempi delle parole della voce.
 */

export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const M = {
  bgTop: '#1E2483',
  bgMid: '#171C66',
  bgLow: '#10144A',
  bgBottom: '#0B0F33',
  white: '#F0F4FF',
  ink: '#141A5E',
  navy: '#1B2170',
  card: '#10123F',
  yellow: '#FFD404',
  cyan: '#46D9E6',
  red: '#E5263F',
  green: '#1FBF6A',
  triangle: '#3FA4FF',
};
export const FONT = '"Anton", "Impact", sans-serif';

// ── animazione ──
export const clamp = (v: number) => Math.min(1, Math.max(0, v));
export const prog = (g: number, a: number, b: number) => clamp((g - a) / (b - a));
export const easeOut = (t: number) => 1 - (1 - t) ** 3;
export const easeIn = (t: number) => t * t * t;
export const easeBack = (t: number) => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2;
export const hit = (g: number, at: number, k = 9) => (g < at ? 0 : Math.exp(-(g - at) * k));

// ── tempi della voce ──
export type VW = {text: string; start: number; end: number; cue: string};
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9']/g, '');

export const makeTiming = (words: VW[]) => {
  const cue = (id: string) => {
    const ws = words.filter((w) => w.cue === id);
    if (!ws.length) throw new Error(`battuta mancante: ${id}`);
    return {start: ws[0].start, end: ws[ws.length - 1].end};
  };
  const at = (id: string, word: string, nth = 0) => {
    const ws = words.filter((w) => w.cue === id && norm(w.text).startsWith(norm(word)));
    if (!ws.length) throw new Error(`parola "${word}" non trovata in ${id}`);
    return (ws[nth] ?? ws[ws.length - 1]).start;
  };
  return {cue, at};
};

// ── caratteri: si aspetta Anton prima di misurare le parole ──
export const useFontReady = () => {
  const [handle] = useState(() => delayRender('font Anton'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    document.fonts
      .load(`64px ${FONT}`)
      .then(() => document.fonts.ready)
      .finally(() => {
        setReady(true);
        continueRender(handle);
      });
  }, [handle]);
  return ready;
};
let ctx: CanvasRenderingContext2D | null = null;
export const textW = (t: string, size: number) => {
  ctx ??= document.createElement('canvas').getContext('2d');
  if (!ctx) return t.length * size * 0.45;
  ctx.font = `${size}px ${FONT}`;
  return ctx.measureText(t).width;
};

// ───────────────────────── sfondo ─────────────────────────

/** sfumatura blu-viola con raggi di luce morbidi dall'alto */
export const Backdrop: React.FC<{g: number}> = ({g}) => (
  <AbsoluteFill style={{background: `linear-gradient(180deg, ${M.bgTop} 0%, ${M.bgMid} 34%, ${M.bgLow} 62%, ${M.bgBottom} 100%)`}}>
    {[0, 1, 2, 3].map((i) => {
      const x = 100 + i * 260 + Math.sin(g * 0.35 + i * 1.7) * 60;
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x - 120,
            top: -200,
            width: 240,
            height: 1300,
            transform: `rotate(${-12 + i * 7}deg)`,
            transformOrigin: '50% 0',
            background: 'linear-gradient(180deg, rgba(150,170,255,0.16) 0%, rgba(150,170,255,0.05) 55%, transparent 100%)',
            filter: 'blur(40px)',
          }}
        />
      );
    })}
    <AbsoluteFill style={{background: 'radial-gradient(110% 60% at 50% 18%, rgba(70,90,220,0.25) 0%, transparent 60%)'}} />
  </AbsoluteFill>
);

/**
 * Segnaposto delle clip: qui vanno i filmati veri (giocatore, squadra, stadio). Finché non ci
 * sono si vede uno stadio di notte sfocato che si avvicina piano, con la scritta "CLIP".
 */
export const ClipSlot: React.FC<{g: number; a: number; seed: string; label?: string; style?: React.CSSProperties}> = ({g, a, seed, label = 'CLIP', style}) => {
  const z = 1.06 + (g - a) * 0.025;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#0B1A14', ...style}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${z})`}}>
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0A0E22 0%, #142038 30%, #1B4A2E 55%, #1F6A3A 100%)'}} />
        {Array.from({length: 26}, (_, i) => {
          const x = random(`${seed}x${i}`) * W;
          const y = 120 + random(`${seed}y${i}`) * 700;
          const s = 40 + random(`${seed}s${i}`) * 120;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x - s / 2,
                top: y - s / 2,
                width: s,
                height: s,
                borderRadius: '50%',
                background: `radial-gradient(circle, rgba(${random(`${seed}c${i}`) > 0.5 ? '255,240,210' : '200,220,255'},0.5) 0%, transparent 70%)`,
              }}
            />
          );
        })}
        {/* figura sfocata in primo piano */}
        <div
          style={{
            position: 'absolute',
            left: W * (0.3 + random(`${seed}p`) * 0.2),
            top: 520,
            width: 520,
            height: 1500,
            borderRadius: '45% 45% 10% 10%',
            background: 'radial-gradient(60% 40% at 50% 20%, rgba(10,14,40,0.9) 0%, rgba(10,14,40,0.6) 60%, transparent 100%)',
            filter: 'blur(30px)',
          }}
        />
      </div>
      <AbsoluteFill style={{background: 'radial-gradient(90% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)'}} />
      <div style={{position: 'absolute', left: 40, bottom: 330, padding: '6px 16px', borderRadius: 8, border: '2px dashed rgba(255,255,255,0.45)', color: 'rgba(255,255,255,0.6)', fontFamily: FONT, fontSize: 30, letterSpacing: 2}}>
        ▶ {label}
      </div>
    </div>
  );
};

// ───────────────────────── barra in alto ─────────────────────────

const Chip: React.FC<{light?: boolean; children: React.ReactNode}> = ({light, children}) => (
  <div style={{position: 'relative', height: 56, padding: '0 26px', display: 'flex', alignItems: 'center', gap: 12}}>
    <div style={{position: 'absolute', inset: 0, transform: 'skewX(-14deg)', background: light ? M.white : M.navy, borderBottom: `4px solid ${M.cyan}`, boxShadow: '0 8px 20px rgba(0,0,0,0.35)'}} />
    <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT, fontSize: 32, color: light ? M.ink : '#fff', letterSpacing: 0.5}}>{children}</div>
  </div>
);

export const FlagIcon: React.FC<{kind: 'bg' | 'is'; h: number}> = ({kind, h}) => (
  <div style={{borderRadius: 3, overflow: 'hidden', boxShadow: '0 0 0 1.5px rgba(0,0,0,0.25)'}}>
    <FlagSvg kind={kind} w={kind === 'bg' ? (h * 5) / 3 : (h * 25) / 18} h={h} />
  </div>
);

export const Hud: React.FC<{g: number; show: number; left: string; home: 'bg' | 'is'; away: 'bg' | 'is'; match: string}> = ({g, show, left, home, away, match}) => {
  const p = easeOut(show);
  if (p <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 236, display: 'flex', justifyContent: 'center', gap: 22, opacity: p, transform: `translateY(${(1 - p) * -30}px)`}}>
      <Chip>
        <svg width="22" height="20" viewBox="0 0 22 20">
          <path d="M11 1 L21 19 L1 19 Z" fill={M.triangle} />
        </svg>
        {left}
      </Chip>
      <Chip light>
        <FlagIcon kind={home} h={26} />
        {match}
        <FlagIcon kind={away} h={26} />
      </Chip>
    </div>
  );
};

/** contatore 1-2-3: grande al centro quando si annunciano i numeri, piccolo in alto a sinistra dopo */
export const Steps: React.FC<{g: number; big: number; lit: number[]; active: number; x?: number; y?: number; size?: number; pulse?: number}> = ({g, big, lit, active, x, y, size, pulse = 0}) => {
  const s = size ?? 70;
  return (
    <div style={{position: 'absolute', left: x ?? 60, top: y ?? 320, display: 'flex', gap: s * 0.14, opacity: big}}>
      {[1, 2, 3].map((n, i) => {
        const on = active === n || lit[i] > 0.5;
        const p = lit[i];
        return (
          <div
            key={n}
            style={{
              width: s,
              height: s * 1.08,
              borderRadius: s * 0.12,
              background: on ? M.yellow : M.navy,
              border: `${Math.max(2, s * 0.04)}px solid ${on ? M.yellow : 'rgba(120,150,255,0.55)'}`,
              boxShadow: `0 ${s * 0.08}px 0 ${M.cyan}, 0 10px 24px rgba(0,0,0,0.4)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT,
              fontSize: s * 0.72,
              color: on ? M.ink : '#fff',
              transform: `scale(${1 + (p > 0 && p < 1 ? 0.12 * Math.sin(p * Math.PI) : 0) + (active === n ? 0.45 * pulse : 0)})`,
              transformOrigin: '0 0',
            }}
          >
            {n}
          </div>
        );
      })}
    </div>
  );
};

// ───────────────────────── scritte a cartellino ─────────────────────────

export type CapWord = {t: string; at: number};
export type CapRow = {words: CapWord[]; tone: 'white' | 'navy'; size?: number};

/**
 * Una o due righe a parallelogramma. Ogni parola compare quando viene detta e il riquadro si
 * allarga per farle posto (come nei video MOTB); all'uscita tutto si sfoca e sparisce.
 */
export const Caption: React.FC<{g: number; rows: CapRow[]; y: number; out: number}> = ({g, rows, y, out}) => {
  const first = rows[0].words[0].at;
  if (g < first - 0.12 || g > out + 0.25) return null;
  const o = easeIn(prog(g, out, out + 0.22));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: 1 - o, filter: o > 0.01 ? `blur(${o * 14}px)` : undefined}}>
      {rows.map((r, ri) => {
        const size = r.size ?? 66;
        const start = r.words[0].at;
        if (g < start - 0.12) return <div key={ri} style={{height: size * 1.18}} />;
        const gap = size * 0.26;
        // larghezza "bersaglio": le parole già dette, con l'ultima che entra
        let w = 0;
        r.words.forEach((wd, i) => {
          const p = easeOut(prog(g, wd.at - 0.08, wd.at + 0.12));
          w += (textW(wd.t, size) + (i ? gap : 0)) * p;
        });
        const boxP = easeOut(prog(g, start - 0.12, start + 0.05));
        const white = r.tone === 'white';
        return (
          <div key={ri} style={{position: 'relative', height: size * 1.18, width: w + size * 0.75, transform: `scaleX(${0.3 + 0.7 * boxP})`, transformOrigin: '0 50%'}}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: 'skewX(-12deg)',
                background: white ? M.white : M.navy,
                borderBottom: white ? `3px solid rgba(70,217,230,0.0)` : 'none',
                boxShadow: white ? '0 10px 26px rgba(0,0,0,0.35)' : `0 6px 0 -1px ${M.cyan}, 0 10px 26px rgba(0,0,0,0.35)`,
              }}
            />
            <div style={{position: 'absolute', left: size * 0.38, top: 0, height: '100%', display: 'flex', alignItems: 'center', gap, whiteSpace: 'nowrap'}}>
              {r.words.map((wd, i) => {
                const p = easeOut(prog(g, wd.at - 0.08, wd.at + 0.12));
                if (p <= 0) return null;
                return (
                  <span key={i} style={{fontFamily: FONT, fontSize: size, lineHeight: 1, color: white ? M.ink : M.yellow, opacity: p, transform: `translateX(${(1 - p) * 26}px)`, display: 'inline-block'}}>
                    {wd.t}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** crea le righe di una scritta da coppie [testo sullo schermo, parola detta] */
export const cap = (tone: 'white' | 'navy', pairs: [string, number][], size?: number): CapRow => ({tone, size, words: pairs.map(([t, at]) => ({t, at}))});

// ───────────────────────── riquadri dei dati ─────────────────────────

type IconKind = 'check' | 'x' | 'ball' | 'square';

const Icon: React.FC<{kind: IconKind; on: number; s: number}> = ({kind, on, s}) => {
  const bg = kind === 'check' || kind === 'ball' ? M.green : kind === 'x' ? M.red : M.yellow;
  const filled = on > 0.5;
  return (
    <div
      style={{
        width: s,
        height: s,
        borderRadius: s * 0.18,
        background: filled ? bg : 'rgba(255,255,255,0.07)',
        border: filled ? 'none' : '2px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${filled ? 1 + 0.25 * Math.max(0, 1 - (on - 0.5) * 4) : 0.92})`,
      }}
    >
      {filled && kind === 'check' && (
        <svg width={s * 0.7} height={s * 0.7} viewBox="0 0 24 24">
          <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {filled && kind === 'x' && (
        <svg width={s * 0.6} height={s * 0.6} viewBox="0 0 24 24">
          <path d="M5 5l14 14M19 5L5 19" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" />
        </svg>
      )}
      {filled && kind === 'ball' && <BallIcon s={s * 0.78} />}
    </div>
  );
};

export const BallIcon: React.FC<{s: number}> = ({s}) => (
  <svg width={s} height={s} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="46" fill="#fff" stroke={M.ink} strokeWidth="5" />
    <polygon points="50,33 66,45 60,64 40,64 34,45" fill={M.ink} />
    {[0, 1, 2, 3, 4].map((i) => {
      const a = (i * 2 * Math.PI) / 5;
      return <circle key={i} cx={50 + 43 * Math.sin(a)} cy={50 - 43 * Math.cos(a)} r="10" fill={M.ink} />;
    })}
  </svg>
);

const panel: React.CSSProperties = {
  position: 'absolute',
  left: (W - 780) / 2,
  width: 780,
  background: `linear-gradient(180deg, ${M.card} 0%, #0D0F36 100%)`,
  borderRadius: 22,
  boxShadow: `0 7px 0 -1px ${M.cyan}, 0 26px 60px rgba(0,0,0,0.45)`,
};

const cardIn = (g: number, a: number, out: number) => {
  const p = easeOut(prog(g, a - 0.15, a + 0.15));
  const o = easeIn(prog(g, out, out + 0.22));
  return {style: {opacity: Math.min(p, 1 - o), transform: `translateY(${(1 - p) * 50}px)`, filter: o > 0.01 ? `blur(${o * 14}px)` : undefined} as React.CSSProperties, visible: g > a - 0.16 && g < out + 0.25};
};

/** numero giallo che conta + griglia di icone che si riempie una alla volta */
export const StatCard: React.FC<{g: number; a: number; out: number; n: number; total?: number; icon: IconKind; caption: string; y: number; suffix?: string; layout?: 'side' | 'top'}> = ({g, a, out, n, total, icon, caption, y, suffix, layout = 'side'}) => {
  const {style, visible} = cardIn(g, a, out);
  if (!visible) return null;
  const tot = total ?? n;
  const cp = easeOut(prog(g, a, a + 0.6));
  const shown = Math.round(n * cp);
  const iconOn = (i: number) => clamp((cp * tot - i) * 1.2 + 0.5);
  const s = tot > 12 ? 44 : tot > 6 ? 54 : 74;
  const perRow = tot > 12 ? Math.ceil(tot / 2) : tot;
  const grid = (
    <div style={{display: 'grid', gridTemplateColumns: `repeat(${perRow}, ${s}px)`, gap: s * 0.16}}>
      {Array.from({length: tot}, (_, i) => (
        <Icon key={i} kind={icon} on={i < n ? iconOn(i) : 0} s={s} />
      ))}
    </div>
  );
  const num = (
    <div style={{fontFamily: FONT, fontSize: layout === 'top' ? 130 : 160, lineHeight: 1, color: M.yellow, textShadow: '0 6px 0 rgba(0,0,0,0.25)'}}>
      {shown}
      {suffix}
    </div>
  );
  return (
    <div style={{...panel, top: y, padding: '30px 36px 26px', ...style}}>
      {layout === 'side' ? (
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 34}}>
          {num}
          {grid}
        </div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
          {grid}
          {num}
        </div>
      )}
      <div style={{textAlign: 'center', fontFamily: FONT, fontSize: 26, color: '#fff', letterSpacing: 1.5, marginTop: 10}}>{caption}</div>
    </div>
  );
};

/** barra dei minuti con i palloni nel momento dei gol (come "3 GOL PRESI tra il 31' e il 45'") */
export const MinuteBar: React.FC<{g: number; a: number; out: number; title: string; goals: number[]; caption: string; y: number}> = ({g, a, out, title, goals, caption, y}) => {
  const {style, visible} = cardIn(g, a, out);
  if (!visible) return null;
  const BW = 640;
  const fill = easeOut(prog(g, a + 0.1, a + 0.9));
  return (
    <div style={{...panel, top: y, padding: '30px 70px 26px', ...style}}>
      <div style={{textAlign: 'center', fontFamily: FONT, fontSize: 92, lineHeight: 1, color: M.yellow}}>{title}</div>
      <div style={{position: 'relative', height: 70, marginTop: 26}}>
        <div style={{position: 'absolute', left: 0, width: BW, top: 26, height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.18)'}} />
        <div style={{position: 'absolute', left: 0, width: BW * fill, top: 26, height: 16, borderRadius: 8, background: `linear-gradient(90deg, rgba(229,38,63,0.2), ${M.red})`}} />
        {goals.map((m, i) => {
          const x = (m / 90) * BW;
          const p = easeBack(prog(g, a + 0.1 + (m / 90) * 0.8 - 0.05, a + 0.1 + (m / 90) * 0.8 + 0.2));
          return (
            <div key={i} style={{position: 'absolute', left: x - 30, top: 4, transform: `scale(${p})`}}>
              <BallIcon s={60} />
            </div>
          );
        })}
      </div>
      <div style={{position: 'relative', height: 40, fontFamily: FONT, fontSize: 30, color: '#fff'}}>
        {[0, ...goals, 90].map((m) => (
          <div key={m} style={{position: 'absolute', left: (m / 90) * BW, transform: 'translateX(-50%)'}}>
            {m}'
          </div>
        ))}
      </div>
      <div style={{textAlign: 'center', fontFamily: FONT, fontSize: 26, color: M.yellow, letterSpacing: 1.5, marginTop: 8}}>{caption}</div>
    </div>
  );
};

/** cerchio bianco col punto di domanda (il "mistero" del gancio) */
export const Mystery: React.FC<{g: number; a: number; out: number; x: number; y: number; s?: number}> = ({g, a, out, x, y, s = 150}) => {
  const p = easeBack(prog(g, a, a + 0.3));
  const o = easeIn(prog(g, out, out + 0.2));
  if (g < a || g > out + 0.22) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - s / 2,
        top: y,
        width: s,
        height: s,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: `0 0 0 ${s * 0.05}px ${M.cyan}, 0 14px 40px rgba(0,0,0,0.4)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT,
        fontSize: s * 0.62,
        color: M.ink,
        transform: `scale(${p * (1 + 0.04 * Math.sin(g * 6))})`,
        opacity: 1 - o,
      }}
    >
      ?
    </div>
  );
};

/** riquadro giallo col numero grande (accanto al "?") */
export const NumberTile: React.FC<{g: number; a: number; out: number; n: string; x: number; y: number; s?: number}> = ({g, a, out, n, x, y, s = 150}) => {
  const p = easeBack(prog(g, a, a + 0.3));
  const o = easeIn(prog(g, out, out + 0.2));
  if (g < a || g > out + 0.22) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - s / 2,
        top: y,
        width: s,
        height: s * 1.05,
        borderRadius: s * 0.12,
        background: M.navy,
        border: `${s * 0.035}px solid #fff`,
        boxShadow: `0 ${s * 0.06}px 0 ${M.cyan}, 0 14px 40px rgba(0,0,0,0.4)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT,
        fontSize: s * 0.66,
        color: M.yellow,
        transform: `scale(${p})`,
        opacity: 1 - o,
      }}
    >
      {n}
    </div>
  );
};

// ───────────────────────── schermata finale ─────────────────────────

export const EndCard: React.FC<{g: number; a: number; home: 'bg' | 'is'; away: 'bg' | 'is'; tWord: number; tKey: number}> = ({g, a, home, away, tWord, tKey}) => {
  if (g < a) return null;
  const p1 = easeBack(prog(g, a, a + 0.3));
  const p2 = easeBack(prog(g, a + 0.08, a + 0.38));
  const pv = easeBack(prog(g, a + 0.15, a + 0.4));
  const box = easeOut(prog(g, tWord - 0.1, tWord + 0.15));
  const key = easeBack(prog(g, tKey - 0.05, tKey + 0.25));
  const crest = (k: 'bg' | 'is', p: number) => (
    <div style={{width: 170, height: 170, borderRadius: 26, background: '#fff', boxShadow: `0 0 0 5px ${M.cyan}55, 0 0 40px ${M.cyan}88`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${p})`}}>
      <FlagIcon kind={k} h={78} />
    </div>
  );
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 420, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 34}}>
        {crest(home, p1)}
        <div style={{width: 110, height: 110, transform: `rotate(45deg) scale(${pv})`, background: M.navy, border: `4px solid ${M.cyan}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{transform: 'rotate(-45deg)', fontFamily: FONT, fontSize: 46, color: '#fff'}}>VS</div>
        </div>
        {crest(away, p2)}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 740, display: 'flex', justifyContent: 'center', opacity: box, transform: `translateY(${(1 - box) * 40}px)`}}>
        <div style={{position: 'relative', padding: '18px 70px 22px', textAlign: 'center'}}>
          <div style={{position: 'absolute', inset: 0, transform: 'skewX(-8deg)', background: `linear-gradient(180deg, ${M.navy} 0%, #151A5E 100%)`, boxShadow: `0 8px 0 -1px ${M.cyan}, 0 20px 50px rgba(0,0,0,0.45)`}} />
          {/* fumetto giallo */}
          <div style={{position: 'absolute', left: -46, top: -54, width: 96, height: 74, borderRadius: 18, background: M.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, transform: `rotate(-10deg) scale(${box})`}}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{width: 12, height: 12, borderRadius: 6, background: M.ink}} />
            ))}
            <div style={{position: 'absolute', left: 14, bottom: -16, width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '14px solid transparent', borderTop: `20px solid ${M.yellow}`}} />
          </div>
          <div style={{position: 'relative', fontFamily: FONT, fontSize: 62, color: '#fff', lineHeight: 1.1}}>COMMENTA</div>
          <div style={{position: 'relative', fontFamily: FONT, fontSize: 110, color: M.yellow, lineHeight: 1.05, transform: `scale(${key})`}}>"ANALISI"</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

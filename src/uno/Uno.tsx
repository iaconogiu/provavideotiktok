import '@fontsource/anton';
import '@fontsource/archivo-black';
import React from 'react';
import {AbsoluteFill, Audio, Img, random, staticFile, useCurrentFrame} from 'remotion';
import data from './words.json';

/**
 * "Uno": edit dei testi ad alta energia. Una o due parole giganti alla volta, a tempo
 * con la voce; sfondi che lampeggiano tra nero, bianco, rosso e copertina; aberrazione
 * RGB, glitch a fasce, ondulazione, scie, zoom sul beat, flash, timbri sugli ad-lib.
 */

export const FPS = 30;
type Word = {text: string; line: number; adlib: boolean; start: number; end: number};
const WORDS = data.words as Word[];
const BEATS = data.beats as number[];
export const DURATION = data.duration;
export const UNO_FRAMES = Math.round(DURATION * FPS);

const DISPLAY = '"Anton", "Impact", sans-serif';
const STAMP = '"Archivo Black", "Impact", sans-serif';
const RED = '#E3141B';
const INK = '#0A0A0A';

const norm = (s: string) => s.toLowerCase().replace(/[^a-zàèéìòù0-9]/g, '');
// parole che "picchiano": ricevono gli effetti più forti
const HOT = new Set(
  'uno due soldi caro bimba vano storie veleno nessuno niente sanremo bolliti cremo gremo peso inquadrato serio famiglie vero lavoro loro cirillo tranquillo cifra mani dissa ferri gratis ventimila contanti cuscino divanidivani fumo filtrato'.split(' '),
);
const MONEY = new Set(['soldi', 'cifre', 'cifra', 'ventimila', 'contanti', 'gratis']);

// ── parole → "colpi" a schermo: le parole corte si attaccano alla successiva ──
type Tok = {words: string[]; at: number; end: number; line: number; hot: boolean; key: string; first: boolean};
const buildTokens = (): Tok[] => {
  const mains = WORDS.filter((w) => !w.adlib);
  const out: Tok[] = [];
  let pend: Word[] = [];
  mains.forEach((w, i) => {
    const n = norm(w.text);
    const next = mains[i + 1];
    pend.push(w);
    const chars = pend.map((p) => norm(p.text)).join('').length;
    if (n.length <= 3 && !HOT.has(n) && next && next.line === w.line && chars < 9) return;
    out.push({
      words: pend.map((p) => p.text.replace(/,$/, '').toUpperCase()),
      at: pend[0].start,
      end: 0,
      line: w.line,
      hot: pend.some((p) => HOT.has(norm(p.text))),
      key: norm(w.text),
      first: false,
    });
    pend = [];
  });
  // colpi troppo brevi (< 0.14 s) si fondono col successivo, se il testo resta corto
  for (let i = 0; i < out.length - 1; i++) {
    const a = out[i];
    const b = out[i + 1];
    if (b.at - a.at < 0.14 && a.line === b.line && [...a.words, ...b.words].join(' ').length <= 14) {
      a.words.push(...b.words);
      a.hot = a.hot || b.hot;
      a.key = b.key;
      out.splice(i + 1, 1);
      i--;
    }
  }
  out.forEach((t, i) => {
    t.end = i + 1 < out.length ? out[i + 1].at : DURATION;
    t.first = i === 0 || out[i - 1].line !== t.line;
  });
  return out;
};
const TOKS = buildTokens();

// ad-lib: timbri sopra al testo (i tempi sono stimati sulla fine del verso)
type Stamp = {text: string; at: number; big?: boolean};
const STAMPS: Stamp[] = WORDS.filter((w) => w.adlib).flatMap((w): Stamp[] => {
  const n = norm(w.text);
  if (n.startsWith('fah')) return [0, 0.17, 0.34].map((d) => ({text: 'FAH!', at: w.start - 0.12 + d}));
  if (n === 'grr') return [{text: 'GRR', at: w.start - 0.25, big: true}];
  if (n === 'ehe' || n === 'eheh') return [];
  return [{text: w.text.toUpperCase() + '!', at: w.start - 0.1}];
});

const beatPulse = (t: number, decay = 9) => {
  let last = -10;
  for (const b of BEATS) {
    if (b <= t + 0.01) last = b;
    else break;
  }
  return Math.exp(-(t - last) * decay);
};

// larghezza approssimata dei glifi di Anton (in em) per riempire la larghezza senza tagli
const textW = (s: string) =>
  [...s].reduce((a, ch) => a + ('MW'.includes(ch) ? 0.62 : "I1'".includes(ch) ? 0.27 : ch === ' ' ? 0.24 : '&'.includes(ch) ? 0.55 : 0.5), 0);

/** divide le parole su 1 o 2 righe bilanciate */
const toLines = (words: string[]) => {
  const all = words.join(' ');
  if (words.length < 2 || all.length <= 8) return [all];
  let best = [all];
  let bestD = Infinity;
  for (let k = 1; k < words.length; k++) {
    const a = words.slice(0, k).join(' ');
    const b = words.slice(k).join(' ');
    const d = Math.abs(a.length - b.length);
    if (d < bestD) {
      bestD = d;
      best = [a, b];
    }
  }
  return best;
};

type Look = 'black' | 'white' | 'red' | 'redtext' | 'cover';
const LOOKS: Record<Look, {bg: string; fg: string; dark: boolean}> = {
  black: {bg: 'radial-gradient(90% 70% at 50% 50%, #1a1a1a 0%, #050505 100%)', fg: '#FFFFFF', dark: true},
  white: {bg: 'radial-gradient(80% 60% at 50% 50%, #FFFFFF 35%, #B5B5B5 100%)', fg: INK, dark: false},
  red: {bg: `radial-gradient(85% 65% at 50% 50%, ${RED} 25%, #5A0306 100%)`, fg: INK, dark: false},
  redtext: {bg: 'radial-gradient(90% 70% at 50% 50%, #1a1a1a 0%, #050505 100%)', fg: RED, dark: true},
  cover: {bg: '#000', fg: '#FFFFFF', dark: true},
};
const lookOf = (i: number, tok: Tok, lf: number): Look => {
  const base: Look = tok.hot ? (['red', 'cover', 'white', 'redtext'] as Look[])[Math.floor(random(`lk${i}`) * 4)] : i % 3 === 2 ? 'white' : 'black';
  // i colpi forti iniziano con uno strobo di 3 scatti
  if (tok.hot && lf < 6) return lf % 4 < 2 ? (base === 'white' ? 'black' : 'white') : base;
  return base;
};

type Enter = 'slam' | 'slideL' | 'slideR' | 'split' | 'letters' | 'drop';
const ENTERS: Enter[] = ['slam', 'slideL', 'split', 'slam', 'slideR', 'letters', 'drop'];

const Words: React.FC<{lines: string[]; color: string; lf: number; enter: Enter; stroke?: boolean}> = ({lines, color, lf, enter, stroke}) => {
  const sizes = lines.map((l) => Math.min(420, (1080 * 0.78) / textW(l)));
  const stretch = 1.38;
  const totalH = sizes.reduce((a, s) => a + s * stretch * 0.92, 0);
  const k = Math.min(1, 1250 / totalH);
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      {lines.map((l, li) => {
        const size = sizes[li] * k;
        const delay = li * 2;
        const e = Math.min(1, Math.max(0, (lf - delay) / 3));
        let tx = 0;
        let ty = 0;
        let sc = 1;
        if (enter === 'slideL' || enter === 'slideR') tx = (1 - e) * (enter === 'slideL' ? -700 : 700) * (li % 2 ? -1 : 1);
        if (enter === 'split') ty = (1 - e) * (li % 2 ? 500 : -500);
        if (enter === 'drop') ty = (1 - e) * -900;
        if (enter === 'slam') sc = 1 + (1 - e) * 0.7;
        return (
          <div
            key={li}
            style={{
              fontFamily: DISPLAY,
              fontSize: size,
              lineHeight: 0.92,
              color: stroke ? 'transparent' : color,
              WebkitTextStroke: stroke ? `4px ${color}` : undefined,
              whiteSpace: 'nowrap',
              transform: `translate(${tx}px, ${ty}px) scale(${sc * (1 + (1 - e) * (enter.startsWith('slide') ? 0.5 : 0))}, ${sc * stretch})`,
              filter: e < 1 ? `blur(${(1 - e) * 10}px)` : undefined,
              opacity: e > 0 ? 1 : 0,
            }}
          >
            {enter === 'letters'
              ? [...l].map((ch, ci) => {
                  const ce = Math.min(1, Math.max(0, (lf - ci) / 2));
                  return (
                    <span key={ci} style={{display: 'inline-block', transform: `translateY(${(1 - ce) * -260}px) rotate(${(1 - ce) * (ci % 2 ? 25 : -25)}deg)`, opacity: ce > 0 ? 1 : 0}}>
                      {ch === ' ' ? ' ' : ch}
                    </span>
                  );
                })
              : l}
          </div>
        );
      })}
    </div>
  );
};

/** banconote che piovono */
const Money: React.FC<{lf: number; seed: string}> = ({lf, seed}) => (
  <>
    {Array.from({length: 16}, (_, i) => {
      const x = random(`${seed}mx${i}`) * 1180 - 50;
      const v = 38 + random(`${seed}mv${i}`) * 30;
      const y = -260 + (lf - random(`${seed}md${i}`) * 8) * v;
      const r = (random(`${seed}mr${i}`) - 0.5) * 80 + lf * (i % 2 ? 6 : -6);
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: 240,
            height: 120,
            background: '#F2F2F2',
            border: `6px solid ${INK}`,
            transform: `rotate(${r}deg) scaleY(${0.6 + 0.4 * Math.abs(Math.sin(lf / 3 + i))})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: STAMP,
            fontSize: 70,
            color: RED,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          €
        </div>
      );
    })}
  </>
);

/** sfondo: righe di testo vuoto che scorrono (texture) */
const Marquee: React.FC<{text: string; color: string; frame: number}> = ({text, color, frame}) => (
  <AbsoluteFill style={{transform: 'rotate(-12deg) scale(1.5)', opacity: 0.16, justifyContent: 'center'}}>
    {Array.from({length: 9}, (_, r) => (
      <div
        key={r}
        style={{
          fontFamily: DISPLAY,
          fontSize: 200,
          lineHeight: 1.05,
          whiteSpace: 'nowrap',
          color: 'transparent',
          WebkitTextStroke: `3px ${color}`,
          transform: `translateX(${((r % 2 ? 1 : -1) * frame * 14) % 900 - 450}px)`,
        }}
      >
        {`${text} `.repeat(8)}
      </div>
    ))}
  </AbsoluteFill>
);

export const Uno: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const i = TOKS.reduce((acc, tk, k) => (t >= tk.at - 0.02 ? k : acc), 0);
  const tok = TOKS[i];
  const local = Math.max(0, t - tok.at);
  const lf = Math.floor(local * FPS);
  const look = lookOf(i, tok, lf);
  const L = LOOKS[look];
  const enter: Enter = tok.words.join('').length > 9 && ENTERS[i % ENTERS.length] === 'letters' ? 'slam' : ENTERS[i % ENTERS.length];
  const lines = toLines(tok.words);
  const isNum = tok.key === 'uno' || tok.key === 'due';

  // energia: beat + colpo d'entrata
  const bp = beatPulse(t);
  const hit = Math.exp(-local * 7);
  const hot = tok.hot ? 1 : 0.35;
  const stamp = STAMPS.filter((s) => t >= s.at && t < s.at + 0.32);
  const stampHit = stamp.length ? Math.exp(-(t - stamp[stamp.length - 1].at) * 12) : 0;
  const shake = (hot * 18 * hit + bp * 6 + stampHit * 30) * (isNum ? 1.5 : 1);
  const sx = (random(`sx${frame}`) - 0.5) * shake;
  const sy = (random(`sy${frame}`) - 0.5) * shake;
  const tilt = (random(`tl${i}`) - 0.5) * (tok.hot ? 7 : 3);
  const zoom = 1 + bp * 0.07 + local * 0.05 + stampHit * 0.08;
  const rgb = 3 + hot * 9 * hit + bp * 6 + stampHit * 10;
  const warp = (tok.hot ? 26 * hit + 6 : 0) + bp * 10 + stampHit * 30;
  const glitch = lf < 5 || (tok.hot && bp > 0.7) || stampHit > 0.4;
  const f2 = Math.floor(frame / 2);

  const textBlock = (color: string) => <Words lines={lines} color={color} lf={lf} enter={enter} />;
  const shadow = `${-rgb}px ${rgb * 0.3}px 0 rgba(255,0,50,0.85), ${rgb}px ${-rgb * 0.3}px 0 rgba(0,235,255,0.8)`;

  // flash bianco all'inizio dei colpi forti e sui timbri
  const flash = (tok.hot && lf < 2 ? (lf === 0 ? 0.85 : 0.35) : 0) + (tok.first && lf === 0 ? 0.5 : 0) + stampHit * 0.7;
  const invert = tok.first && tok.hot && lf === 1;
  const fadeOut = Math.min(1, Math.max(0, (t - (DURATION - 0.35)) / 0.35));

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden', filter: invert ? 'invert(1)' : undefined}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id="warp">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.04" numOctaves={2} seed={f2 % 13} />
          <feDisplacementMap in="SourceGraphic" scale={warp} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) rotate(${tilt}deg) scale(${zoom})`}}>
        {/* sfondo */}
        <AbsoluteFill style={{background: L.bg, transform: 'scale(1.2)'}} />
        {look === 'cover' && (
          <AbsoluteFill style={{transform: `scale(${1.25 + local * 0.15 + bp * 0.06}) rotate(${-tilt * 0.5}deg)`}}>
            <Img
              src={staticFile('uno/cover.jpg')}
              style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.7) brightness(0.55) blur(1px)'}}
            />
            <AbsoluteFill style={{background: RED, mixBlendMode: 'multiply', opacity: 0.85}} />
            <AbsoluteFill style={{background: 'radial-gradient(70% 55% at 50% 50%, transparent 30%, rgba(0,0,0,0.85) 100%)'}} />
          </AbsoluteFill>
        )}
        {tok.hot && look !== 'white' && <Marquee text={tok.words.join(' ')} color={look === 'red' ? INK : '#FFFFFF'} frame={frame} />}

        {/* numeri giganti per UNO e DUE */}
        {isNum && (
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
            <div
              style={{
                fontFamily: DISPLAY,
                fontSize: 1700,
                lineHeight: 1,
                color: 'transparent',
                WebkitTextStroke: `10px ${look === 'white' || look === 'red' ? INK : RED}`,
                transform: `scale(${0.5 + local * 1.4}) rotate(${local * 30}deg)`,
                opacity: Math.max(0, 1 - local * 1.2),
              }}
            >
              {tok.key === 'uno' ? '1' : '2'}
            </div>
          </AbsoluteFill>
        )}

        {MONEY.has(tok.key) && <Money lf={lf} seed={`m${i}`} />}

        {/* scie: copie sempre più grandi e trasparenti (zoom blur) */}
        {tok.hot && (
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
            {[1.5, 1.3, 1.15].map((s, k) => (
              <AbsoluteFill key={k} style={{alignItems: 'center', justifyContent: 'center', transform: `scale(${s + bp * 0.1})`, opacity: [0.08, 0.14, 0.22][k] * (0.5 + hit)}}>
                {textBlock(L.fg)}
              </AbsoluteFill>
            ))}
          </AbsoluteFill>
        )}

        {/* testo principale: a fasce spostate quando c'è glitch */}
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', filter: warp > 1 ? 'url(#warp)' : undefined}}>
          {glitch ? (
            Array.from({length: 8}, (_, k) => {
              const off = (random(`gl${f2}-${k}`) - 0.5) * (tok.hot ? 110 : 60) * Math.min(1, 7 / tok.words.join(' ').length);
              return (
                <AbsoluteFill
                  key={k}
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    clipPath: `inset(${k * 12.5}% 0 ${100 - (k + 1) * 12.5}% 0)`,
                    transform: `translateX(${off}px)`,
                    textShadow: shadow,
                  }}
                >
                  {textBlock(L.fg)}
                </AbsoluteFill>
              );
            })
          ) : (
            <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textShadow: shadow}}>{textBlock(L.fg)}</AbsoluteFill>
          )}
        </AbsoluteFill>

        {/* contatore sui ventimila */}
        {tok.key === 'ventimila' && (
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 380}}>
            <div style={{fontFamily: STAMP, fontSize: 150, color: RED, textShadow: shadow, WebkitTextStroke: '4px #fff'}}>
              € {Math.min(20000, Math.round((local / 0.45) * 20000) - (Math.round((local / 0.45) * 20000) % 137)).toLocaleString('it-IT')}
            </div>
          </AbsoluteFill>
        )}
      </AbsoluteFill>

      {/* timbri degli ad-lib */}
      {stamp.map((s, k) => {
        const age = t - s.at;
        const sc = Math.min(1, age / 0.05);
        const x = (random(`stx${s.at}`) - 0.5) * 520;
        const y = (random(`sty${s.at}`) > 0.5 ? -1 : 1) * (380 + random(`sty2${s.at}`) * 300);
        const rot = (random(`str${s.at}`) - 0.5) * 40;
        return (
          <AbsoluteFill key={k} style={{alignItems: 'center', justifyContent: 'center', transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${(s.big ? 1.5 : 1) * (2 - sc)})`, opacity: sc}}>
            <div
              style={{
                fontFamily: STAMP,
                fontSize: 190,
                color: RED,
                WebkitTextStroke: '6px #fff',
                padding: '0 30px',
                border: `12px solid ${RED}`,
                boxShadow: '0 0 0 6px #fff',
                filter: 'url(#warp)',
                textShadow: shadow,
              }}
            >
              {s.text}
            </div>
          </AbsoluteFill>
        );
      })}

      {/* graffi, grana, scanline, vignetta, flash */}
      <AbsoluteFill
        style={{
          mixBlendMode: L.dark ? 'screen' : 'multiply',
          opacity: tok.hot ? 0.6 : 0.3,
          filter: L.dark ? undefined : 'invert(1)',
          transform: `translate(${(random(`gx${Math.floor(frame / 3)}`) - 0.5) * 80}px, ${(random(`gy${Math.floor(frame / 3)}`) - 0.5) * 80}px) rotate(${Math.floor(frame / 3) % 2 ? 180 : 0}deg) scale(1.2)`,
        }}
      >
        <Img src={staticFile('simba/scratches.png')} style={{width: '100%', height: '100%'}} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('simba/grain.png')})`,
          backgroundPosition: `${Math.floor(random(`g${f2}`) * 512)}px ${Math.floor(random(`h${f2}`) * 512)}px`,
          mixBlendMode: 'overlay',
          opacity: 0.18,
        }}
      />
      <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 2px, transparent 2px, transparent 5px)', opacity: 0.5}} />
      <AbsoluteFill style={{background: 'radial-gradient(110% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.6) 100%)'}} />
      <AbsoluteFill style={{background: '#fff', opacity: Math.min(0.9, flash)}} />
      <AbsoluteFill style={{background: '#000', opacity: fadeOut}} />
      <Audio src={staticFile('uno/audio.m4a')} />
    </AbsoluteFill>
  );
};

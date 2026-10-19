import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import type {Caption} from '@remotion/captions';
import {C, FONT, FPS} from './theme';
import {easeOut, pop, soft} from './anim';

export const KEYWORDS = ['macchie', 'macchia', 'trucco', 'apposta'];

const clean = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^\p{L}\p{N}']/gu, '')
    .trim();

export const isKeyword = (t: string, kws: string[] = KEYWORDS) => kws.some((k) => clean(t).startsWith(k));

type Page = {startMs: number; endMs: number; words: Caption[]};

/** Raggruppa le parole in "pagine" brevi (max 3 parole o ~16 caratteri), spezzando su pause e punteggiatura. */
const toPages = (captions: Caption[], kws: string[]): Page[] => {
  const pages: Page[] = [];
  let cur: Caption[] = [];
  const flush = () => {
    if (!cur.length) return;
    pages.push({startMs: cur[0].startMs, endMs: cur[cur.length - 1].endMs, words: cur});
    cur = [];
  };
  captions.forEach((c, i) => {
    const prev = captions[i - 1];
    const chars = cur.reduce((a, w) => a + w.text.trim().length + 1, 0);
    const gap = prev ? c.startMs - prev.endMs : 0;
    if (cur.length && (cur.length >= 3 || chars + c.text.trim().length > 16 || gap > 350 || isKeyword(c.text, kws))) flush();
    cur.push(c);
    if (/[.,!?;:]$/.test(c.text.trim()) || isKeyword(c.text, kws)) flush();
  });
  flush();
  // ogni pagina resta visibile fino all'inizio della successiva (max +600ms)
  return pages.map((p, i) => ({
    ...p,
    endMs: Math.min(pages[i + 1]?.startMs ?? p.endMs + 600, p.endMs + 600),
  }));
};

const Word: React.FC<{w: Caption; ms: number; frame: number; kws: string[]}> = ({w, ms, frame, kws}) => {
  const startF = (w.startMs / 1000) * FPS;
  const active = ms >= w.startMs && ms < w.endMs + 60;
  const spoken = ms >= w.startMs;
  const key = isKeyword(w.text, kws);
  const enter = soft(frame, startF - 4, 16, 0.6);
  const kp = key ? pop(frame, startF - 2) : 0;

  const y = interpolate(enter, [0, 1], [38, 0]);
  const blur = interpolate(enter, [0, 1], [10, 0]);
  const baseScale = key ? 1.32 : 1;
  const scale = baseScale * interpolate(enter, [0, 1], [0.85, 1]) * (key ? 1 + Math.sin(kp * Math.PI) * 0.18 : 1);
  const rot = key ? Math.sin(kp * Math.PI * 2) * -4 * (1 - kp * 0.6) : 0;
  const color = active || (key && spoken) ? C.accent : C.ink;

  // sottolineatura animata solo per le parole chiave
  const underline = key ? interpolate(frame, [startF + 2, startF + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  }) : 0;

  return (
    <span
      style={{
        display: 'inline-block',
        position: 'relative',
        margin: key ? '0 18px' : '0 10px',
        transform: `translateY(${y}px) scale(${scale}) rotate(${rot}deg)`,
        filter: `blur(${blur}px)`,
        opacity: enter,
        color,
        fontWeight: key ? 900 : 800,
        textShadow: key && spoken ? `0 0 40px ${C.accent}55` : 'none',
      }}
    >
      {w.text.trim()}
      {key && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -6,
            height: 8,
            borderRadius: 4,
            background: C.accent,
            transformOrigin: 'left center',
            transform: `scaleX(${underline})`,
          }}
        />
      )}
    </span>
  );
};

export const Subtitles: React.FC<{captions: Caption[]; keywords?: string[]}> = ({captions, keywords = KEYWORDS}) => {
  const frame = useCurrentFrame();
  const ms = (frame / FPS) * 1000;
  const pages = useMemo(() => toPages(captions, keywords), [captions, keywords]);
  const page = pages.find((p) => ms >= p.startMs - 80 && ms < p.endMs);
  if (!page) return null;

  const pStart = ((page.startMs - 80) / 1000) * FPS;
  const pEnd = (page.endMs / 1000) * FPS;
  const inP = soft(frame, pStart, 20, 0.7);
  const out = interpolate(frame, [pEnd - 8, pEnd], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          top: 1330,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            padding: '30px 44px 36px',
            borderRadius: 44,
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 24px 70px rgba(0,0,0,0.14)',
            fontFamily: FONT,
            fontSize: 82,
            lineHeight: 1.15,
            letterSpacing: -2,
            textAlign: 'center',
            opacity: out,
            transform: `translateY(${(1 - inP) * 30}px) scale(${0.94 + inP * 0.06})`,
          }}
        >
          {page.words.map((w, i) => (
            <Word key={i} w={w} ms={ms} frame={frame} kws={keywords} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

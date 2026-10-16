import type {Caption} from '@remotion/captions';
import transcript from '../transcript.json';
import {FPS} from './theme';

export const captions = transcript as Caption[];

const norm = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^\p{L}\p{N}']/gu, '')
    .trim();

/** Secondo in cui inizia la parola `word` (prima occorrenza dopo `after` secondi). */
export const wordAt = (word: string, after = 0): number => {
  const w = norm(word);
  const c = captions.find((c) => c.startMs / 1000 >= after - 0.05 && norm(c.text) === w);
  if (!c) throw new Error(`Parola non trovata nel transcript: "${word}" dopo ${after}s`);
  return c.startMs / 1000;
};

export const sec = (s: number) => Math.round(s * FPS);

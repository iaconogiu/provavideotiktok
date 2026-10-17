import '@fontsource/anton';
import '@fontsource-variable/inter';
import analysis from './analysis.json';
import lyrics from './lyrics.json';

export const FPS = 60;
export const W = 1080;
export const H = 1920;

export const K = {
  black: '#060606',
  ink: '#0B0B0B',
  paper: '#F1EEE6',
  sun: '#FF5A1F',
  sunSoft: '#FF8A3D',
  gray: '#8A8780',
};

export const DISPLAY = '"Anton", "Impact", sans-serif';
export const UI = '"SF Pro Display", "Inter Variable", -apple-system, sans-serif';

export type Word = {line: string; text: string; startMs: number; endMs: number};
export const LYRICS = lyrics as Word[];
export const BEATS: number[] = analysis.beats;
export const BPM = analysis.tempo;
export const DURATION = analysis.duration;

/** Impulso che decade dopo ogni beat (0..1) */
export const beatPulse = (t: number, decay = 7) => {
  let last = -10;
  for (const b of BEATS) {
    if (b <= t) last = b;
    else break;
  }
  return Math.exp(-(t - last) * decay);
};

/** Indice del beat corrente */
export const beatIndex = (t: number) => BEATS.filter((b) => b <= t).length;

const ENV = analysis.env;
/** Inviluppo energetico (bass/voc/rms/hi) interpolato al tempo t */
export const envAt = (t: number, band: 'bass' | 'voc' | 'rms' | 'hi') => {
  const arr = ENV[band];
  const i = t / (ENV.t[1] - ENV.t[0]);
  const a = Math.floor(i);
  if (a < 0) return arr[0];
  if (a >= arr.length - 1) return arr[arr.length - 1];
  return arr[a] + (arr[a + 1] - arr[a]) * (i - a);
};

export const lineWords = (line: string) => LYRICS.filter((w) => w.line === line);

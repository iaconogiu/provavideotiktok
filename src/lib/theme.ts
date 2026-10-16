import '@fontsource-variable/inter';

// SF Pro non è distribuibile: Inter (variabile, incluso in locale) è il sostituto più fedele
export const FONT = `"SF Pro Display", "Inter Variable", -apple-system, sans-serif`;
export const FPS = 60;
export const W = 1080;
export const H = 1920;

// Palette sobria: bianco/nero + un solo accento
export const C = {
  bg: '#F5F5F7',
  white: '#FFFFFF',
  ink: '#1D1D1F',
  ink2: '#424245',
  gray: '#86868B',
  line: '#D2D2D7',
  accent: '#0A84FF',
};

// Colori della "moquette da pullman" (il soggetto del video, non la UI)
export const FABRIC = {
  base: '#1E1B3A',
  colors: ['#E8368F', '#16B3A8', '#F4C21B', '#7B4BD6', '#FF7A30', '#3AA0FF'],
};

export const SHADOW = '0 30px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)';
export const SHADOW_SOFT = '0 20px 60px rgba(0,0,0,0.10)';

export const msToFrame = (ms: number) => Math.round((ms / 1000) * FPS);

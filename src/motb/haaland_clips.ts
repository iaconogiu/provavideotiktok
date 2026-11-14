import type {Clip} from './kit';

/**
 * Clip vere del video Haaland (Norvegia-Galles). I file vanno in public/motb/haaland/ e si indicano
 * qui. Filmato: {src, from, rate, x}; immagine: {image, x, pan} (zoom e panoramica lenta).
 * src/image = percorso dentro public; x = punto da tenere al centro nel ritaglio verticale (0–1).
 * Se uno spazio è vuoto si vede la bandiera della squadra.
 */
export const HAALAND_CLIPS: Partial<Record<'gancio' | 'uno' | 'casa' | 'splitTop' | 'splitBottom', Clip>> = {
  // gancio: {src: 'motb/haaland/norvegia-danimarca.mp4', from: 42, rate: 0.7, x: 0.5},
};

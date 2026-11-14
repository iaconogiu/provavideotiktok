import type {Clip} from './kit';

/**
 * Clip vere del video Haaland (Norvegia-Galles). I file vanno in public/motb/haaland/ e si indicano
 * qui: src = percorso dentro public, from = secondo di partenza nella registrazione,
 * rate = velocità (0.7 = rallentato), x = punto da tenere al centro nel ritaglio verticale (0–1).
 * Finché uno spazio è vuoto si vede il segnaposto "CLIP".
 */
export const HAALAND_CLIPS: Partial<Record<'gancio' | 'uno' | 'casa' | 'splitTop' | 'splitBottom', Clip>> = {
  // gancio: {src: 'motb/haaland/norvegia-danimarca.mp4', from: 42, rate: 0.7, x: 0.5},
};

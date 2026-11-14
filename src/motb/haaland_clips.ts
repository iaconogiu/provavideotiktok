import type {Clip} from './kit';

/**
 * Clip vere del video Haaland (Norvegia-Galles). I file vanno in public/motb/haaland/ e si indicano
 * qui. Filmato: {src, from, rate, x}; immagine: {image, x, pan} (zoom e panoramica lenta).
 * src/image = percorso dentro public; x = punto da tenere al centro nel ritaglio verticale (0–1).
 * Se uno spazio è vuoto si vede la bandiera della squadra.
 */
export const HAALAND_CLIPS: Partial<Record<'gancio' | 'uno' | 'casa' | 'splitTop' | 'splitBottom', Clip>> = {
  gancio: {image: 'motb/haaland/norvegia-squadra.png', y: 0.55, pan: -1},
  // stessa foto, stretta sul numero 9
  uno: {image: 'motb/haaland/norvegia-squadra.png', x: 0.37, y: 0.47, zoom: 1.7, pan: 1},
  casa: {image: 'motb/haaland/norvegia-stadio.png', y: 0.45, pan: 1},
  splitTop: {image: 'motb/haaland/norvegia-stadio.png', y: 0.35, zoom: 1.25, pan: -1},
  splitBottom: {image: 'motb/haaland/galles-tifosi.png', y: 0.45, zoom: 1.15, pan: 1},
};

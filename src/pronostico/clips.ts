import type {SceneId} from './kit';

/**
 * Clip di sfondo (riprese in campo delle due squadre), scena per scena. Vanno messe in
 * public/pronostico/clip/ e elencate qui: src = percorso dentro public, from = secondo da cui
 * partire nella clip. Se una scena non ha clip si vede lo sfondo animato (campo di notte).
 * Scene: intro, liga, naz, andata, lettura, pron, chiusura.
 */
export type Clip = {src: string; from?: number};

export const CLIPS: Partial<Record<SceneId, Clip[]>> = {
  // intro: [{src: 'pronostico/clip/islanda-bulgaria-andata.mp4', from: 12}],
};

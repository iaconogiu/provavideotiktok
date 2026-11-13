/**
 * Clip di sfondo (riprese in campo delle due squadre). Vanno messe in public/pronostico/clip/
 * e elencate qui: src = percorso dentro public, from = secondo da cui partire nella clip.
 * Finché la lista è vuota il video usa lo sfondo animato (campo di notte sotto i riflettori).
 */
export type Clip = {src: string; from?: number};

export const CLIPS: {intro: Clip[]} = {
  intro: [
    // {src: 'pronostico/clip/islanda-bulgaria-andata.mp4', from: 12},
  ],
};

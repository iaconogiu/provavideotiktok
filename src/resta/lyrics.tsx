import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {DISPLAY, FPS, Riso, S, Txt, W, pop} from './riso';

/**
 * Testo con l'inizio di ogni parola in secondi. Tempi ricavati con Whisper (medium)
 * sulla traccia e corretti a mano dove Whisper attaccava la parola all'inizio della frase.
 */
export const LINES: [string, number][][] = [
  [['E', 0.0], ['ti', 0.1], ['darò', 0.18], ['il', 0.56], ['mio', 0.74], ['tempo,', 1.02]],
  [['insegnami', 1.48], ['il', 1.88], ['tatto', 2.14]],
  [['Starò', 2.6], ['più', 2.74], ['attento,', 2.92]],
  [['ti', 3.24], ['darò', 3.46], ['il', 3.64], ['mio', 3.74], ['impegno', 3.9]],
  [['Non', 4.42], ['ho', 4.66], ['mai', 4.76], ['visto', 4.94], ["l'amore", 5.22], ['che', 5.64], ['avevo', 5.84]],
  [['Avevo', 6.24], ['troppa', 6.48], ['rabbia', 6.84]],
  [['Adesso,', 7.2], ['se', 7.36], ['lo', 7.62], ['voglio,', 7.84], ['lo', 8.02], ['posso', 8.28], ['cantare', 8.48]],
  [['Non', 9.18], ['son', 9.42], ['più', 9.52], ['schiavo,', 9.68], ['non', 10.02], ['lo', 10.18], ['son', 10.34], ['mai', 10.46], ['stato', 10.66]],
  [['Ma', 10.94], ['prima', 11.14], ['cercavo', 11.34], ['perlopiù', 11.86], ['di', 12.28], ['lottare', 12.38]],
  [['Perlopiù', 13.1], ['cercavo', 13.96], ['un', 14.36], ['difetto', 14.52], ['per', 14.8], ['collegarci', 15.04]],
  [['Che', 15.84], ['dalle', 15.96], ['mie', 16.22], ['parti', 16.4], ['non', 16.66], ['credono', 16.86], ['agli', 17.22], ['angeli', 17.64]],
  [['E', 18.4], ['non', 18.62], ['credono', 18.82], ['agli', 19.16], ['altri', 19.5]],
  [['Resta', 19.88], ['con', 20.14], ['me,', 20.34]],
  [['solo', 20.62], ["dell'amore", 20.9], ['non', 21.5], ['so', 21.7], ['sdebitarmi', 21.82]],
  [['Resta', 23.15], ['e', 23.65], ['ti', 24.02], ['darò,', 24.24], ['ti', 24.56], ['darò,', 24.78], ['ti', 25.04], ['darò,', 25.3], ['ti', 25.5], ['darò', 25.74]],
  [['Solo', 27.2], ['per', 27.66], ['sentirmi', 27.92], ['dire', 28.46], ['che', 28.8], ['bastavo', 29.06], ['io', 29.4], ['da', 29.7], ['anni', 29.95]],
];

export const DURATION = 31.4;

let ctx: CanvasRenderingContext2D | null = null;
const measure = (text: string, size: number) => {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  ctx!.font = `${size}px ${DISPLAY}`;
  return ctx!.measureText(text).width;
};

const SIZE = 70;
const MAXW = 860;
const LH = SIZE * 1.16;

/**
 * Riga corrente in basso: le parole compaiono quando vengono cantate,
 * la parola in corso ha sotto una pennellata corallo.
 */
export const Lyrics: React.FC<{y?: number}> = ({y = 1450}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const f = Math.floor(frame / 2) * 2;
  let li = -1;
  for (let i = 0; i < LINES.length; i++) if (t >= LINES[i][0][1] - 0.04) li = i;
  if (li < 0) return null;
  const words = LINES[li];
  // a capo "avido" sulla larghezza misurata
  const space = measure(' ', SIZE);
  const rows: {w: string; at: number; width: number}[][] = [[]];
  let rowW = 0;
  for (const [w, at] of words) {
    const width = measure(w.toUpperCase(), SIZE);
    if (rowW > 0 && rowW + space + width > MAXW) {
      rows.push([]);
      rowW = 0;
    }
    rows[rows.length - 1].push({w: w.toUpperCase(), at, width});
    rowW += (rowW > 0 ? space : 0) + width;
  }
  const current = words.reduce((c, [, at], i) => (t >= at - 0.04 ? i : c), 0);
  let idx = 0;
  return (
    <Riso seed="ly" panel={false}>
      {rows.map((row, ri) => {
        const total = row.reduce((a, r) => a + r.width, 0) + space * (row.length - 1);
        let x = (W - total) / 2;
        const cy = y + ri * LH;
        return row.map((r) => {
          const i = idx++;
          const x0 = x;
          x += r.width + space;
          const atF = Math.round(r.at * FPS);
          const s = pop(f, atF, 4);
          if (!s) return null;
          const rot = (random(`lw${li}-${i}`) - 0.5) * 4;
          return (
            <g key={`${li}-${i}`} transform={`translate(${x0 + r.width / 2} ${cy}) rotate(${rot}) scale(${s})`}>
              {i === current && (
                <S
                  d={`M${-r.width / 2 - 10} 8 C${-r.width / 4} 2 ${r.width / 4} 14 ${r.width / 2 + 10} 6`}
                  st="a"
                  sw={30}
                />
              )}
              <Txt x={0} y={0} text={r.w} size={SIZE} />
            </g>
          );
        });
      })}
    </Riso>
  );
};


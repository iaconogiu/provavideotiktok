import {useCurrentFrame} from 'remotion';
import {FPS} from './theme';

/** Frame locale della scena + conversione da secondi assoluti dell'audio a frame locali */
export const useScene = (startSec: number) => {
  const f = useCurrentFrame();
  const T = (s: number) => (s - startSec) * FPS;
  return {f, T, abs: f + startSec * FPS};
};

import {Easing, interpolate, spring} from 'remotion';
import {FPS} from './theme';

export const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

/** spring morbida senza rimbalzi eccessivi */
export const soft = (frame: number, delay = 0, damping = 18, mass = 0.9) =>
  spring({frame: frame - delay, fps: FPS, config: {damping, mass, stiffness: 110}});

export const pop = (frame: number, delay = 0) =>
  spring({frame: frame - delay, fps: FPS, config: {damping: 11, mass: 0.7, stiffness: 160}});

/** interpolate con clamp + easing di default */
export const tween = (
  frame: number,
  [f0, f1]: [number, number],
  [v0, v1]: [number, number],
  easing = easeInOut,
) =>
  interpolate(frame, [f0, f1], [v0, v1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

/** keyframes multipli con easing morbido tra ognuno */
export const keys = (frame: number, times: number[], values: number[], easing = easeInOut) =>
  interpolate(frame, times, values, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

/** deriva lenta e continua: garantisce che l'inquadratura non sia mai ferma */
export const drift = (frame: number, speed = 1, amp = 1, phase = 0) =>
  Math.sin((frame / FPS) * speed + phase) * amp;

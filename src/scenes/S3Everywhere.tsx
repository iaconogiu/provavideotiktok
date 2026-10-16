import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {Backdrop} from '../lib/Backdrop';
import {FabricPattern} from '../lib/FabricPattern';
import {Glass} from '../lib/Glass';
import {BusIcon, MetroIcon, TrainIcon} from '../lib/Icons';
import {drift, keys, pop, soft, tween} from '../lib/anim';
import {useScene} from '../lib/useScene';
import {wordAt} from '../lib/timing';
import {C, FONT} from '../lib/theme';

const START = 11.85;

// "E lo trovi ovunque. Pullman, treni, metropolitane… in tutto il mondo."
export const S3Everywhere: React.FC = () => {
  const {f, T} = useScene(START);
  const tOvunque = T(wordAt('ovunque.'));
  const tPullman = T(wordAt('Pullman,', 13));
  const tTreni = T(wordAt('treni,'));
  const tMetro = T(wordAt('metropolitane…'));
  const tMondo = T(wordAt('tutto'));

  const items = [
    {t: tPullman, label: 'Pullman', Icon: BusIcon, seed: 'a'},
    {t: tTreni, label: 'Treni', Icon: TrainIcon, seed: 'b'},
    {t: tMetro, label: 'Metro', Icon: MetroIcon, seed: 'c'},
  ];

  // carosello 3D: ruota per portare in primo piano la carta pronunciata
  const ringRot = keys(f, [0, tPullman, tTreni, tMetro, tMondo], [40, 0, -120, -240, -300]) + drift(f, 0.8, 3);
  const globeIn = soft(f, tMondo, 20);
  const ringOut = tween(f, [tMondo - 6, tMondo + 30], [0, 1]);
  const camTilt = 8 + drift(f, 0.6, 3);

  // "ovunque": parola grande che arriva dal fondo
  const ov = soft(f, tOvunque - 10, 18);
  const ovOut = tween(f, [tPullman - 10, tPullman + 14], [0, 1]);

  return (
    <AbsoluteFill>
      <Backdrop />
      <div
        style={{
          position: 'absolute',
          width: '100%',
          top: 520,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 190,
          letterSpacing: -8,
          color: C.ink,
          opacity: ov * (1 - ovOut),
          transform: `perspective(1400px) translateZ(${(1 - ov) * -900 + ovOut * 700}px)`,
          filter: `blur(${ovOut * 20}px)`,
        }}
      >
        ovunque<span style={{color: C.accent}}>.</span>
      </div>

      <AbsoluteFill style={{perspective: 1700, perspectiveOrigin: '50% 35%'}}>
        <div
          style={{
            position: 'absolute',
            left: 540,
            top: 640,
            transformStyle: 'preserve-3d',
            transform: `translateZ(${-560 - ringOut * 1600}px) rotateX(${camTilt}deg) rotateY(${ringRot}deg)`,
            opacity: 1 - ringOut,
          }}
        >
          {items.map(({t, label, Icon, seed}, i) => {
            const p = pop(f, t - 6);
            const active = interpolate(f, [t - 6, t + 4, t + 40, t + 60], [0, 1, 1, 0.4], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: -230,
                  top: -330,
                  width: 460,
                  height: 620,
                  transform: `rotateY(${i * 120}deg) translateZ(520px) scale(${0.7 + p * 0.3})`,
                  opacity: Math.min(1, p * 1.4),
                }}
              >
                <Glass radius={56} style={{width: '100%', height: '100%', overflow: 'hidden', position: 'relative'}}>
                  <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 260, overflow: 'hidden', borderRadius: '0 0 56px 56px'}}>
                    <FabricPattern id={`s3-${seed}`} seed={seed} tile={200} offsetX={f * 0.8} />
                  </div>
                  <div style={{position: 'absolute', top: 70, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
                    <Icon size={170} color={active > 0.5 ? C.accent : C.ink} stroke={5} />
                    <div style={{fontSize: 70, fontWeight: 800, letterSpacing: -2}}>{label}</div>
                  </div>
                </Glass>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* "in tutto il mondo": globo a punti che ruota */}
      {f > tMondo - 10 && <Globe f={f} p={globeIn} t0={tMondo} />}
    </AbsoluteFill>
  );
};

const Globe: React.FC<{f: number; p: number; t0: number}> = ({f, p, t0}) => {
  const R = 360;
  const dots: React.ReactNode[] = [];
  const spin = f * 0.012;
  for (let lat = -80; lat <= 80; lat += 10) {
    const phi = (lat * Math.PI) / 180;
    const ring = Math.cos(phi);
    const n = Math.max(4, Math.round(36 * ring));
    for (let k = 0; k < n; k++) {
      const lon = (k / n) * Math.PI * 2 + spin;
      const z = Math.cos(lon) * ring;
      if (z < -0.05) continue;
      const x = Math.sin(lon) * ring * R;
      const y = -Math.sin(phi) * R;
      // "continenti" approssimati con un rumore deterministico
      const land = Math.sin(lon * 3 + phi * 2) + Math.cos(lon * 2 - phi * 3) > 0.6;
      dots.push(
        <circle key={`${lat}-${k}`} cx={x} cy={y} r={land ? 7 : 4} fill={land ? C.accent : C.line} opacity={0.35 + z * 0.65} />,
      );
    }
  }
  const pins = [0.3, 1.4, 2.6, 3.9, 5.1].map((lon, i) => {
    const pp = pop(f, t0 + 16 + i * 6);
    const l = lon + spin;
    const z = Math.cos(l);
    if (z < 0.1) return null;
    return <circle key={i} cx={Math.sin(l) * R * 0.85} cy={(i % 2 ? -1 : 1) * 90 * (i % 3)} r={16 * pp} fill={C.accent} stroke="white" strokeWidth={6} />;
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 540 - R - 20,
        top: 640 - R - 20,
        opacity: p,
        transform: `perspective(1400px) translateZ(${(1 - p) * -1200}px) rotateZ(${drift(f, 0.5, 4)}deg)`,
      }}
    >
      <svg width={R * 2 + 40} height={R * 2 + 40} viewBox={`${-R - 20} ${-R - 20} ${R * 2 + 40} ${R * 2 + 40}`}>
        <circle r={R + 6} fill="white" opacity={0.6} />
        {dots}
        {pins}
      </svg>
    </div>
  );
};

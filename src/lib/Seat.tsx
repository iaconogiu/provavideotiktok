import React from 'react';
import {FabricPattern} from './FabricPattern';

/**
 * Sedile da pullman costruito in CSS 3D (schienale + seduta + scocca),
 * con il tessuto generato proceduralmente.
 */
export const Seat: React.FC<{
  id: string;
  width?: number;
  height?: number;
  seed?: string;
  reveal?: number;
  plain?: string | null; // se impostato, tessuto in tinta unita al posto della fantasia
  patternOpacity?: number;
  /** 0..1: la fantasia si espande a cerchio dal centro dello schienale */
  patternClip?: number;
  offsetY?: number;
  children?: React.ReactNode; // overlay sullo schienale (es. macchie)
  style?: React.CSSProperties;
}> = ({
  id,
  width = 440,
  height = 600,
  seed = 'bus',
  reveal = 1,
  plain = null,
  patternOpacity = 1,
  patternClip = 1,
  offsetY = 0,
  children,
  style,
}) => {
  const depth = width * 0.7;
  const tile = width * 0.6;

  const fabric = (sub: string) => (
    <>
      {plain && <div style={{position: 'absolute', inset: 0, background: plain}} />}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: patternOpacity,
          clipPath: patternClip >= 1 ? undefined : `circle(${patternClip * 120}% at 50% 45%)`,
        }}
      >
        <FabricPattern id={`${id}-${sub}`} seed={seed} tile={tile} reveal={reveal} offsetY={offsetY} />
      </div>
    </>
  );

  const cushionShade: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(120% 80% at 50% 35%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 55%), linear-gradient(90deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 14%, rgba(0,0,0,0) 86%, rgba(0,0,0,0.35) 100%)',
    pointerEvents: 'none',
  };

  return (
    <div
      style={{
        position: 'relative',
        width,
        height: height + depth * 0.15,
        transformStyle: 'preserve-3d',
        ...style,
      }}
    >
      {/* scocca posteriore in plastica */}
      <div
        style={{
          position: 'absolute',
          left: -14,
          top: -14,
          width: width + 28,
          height: height + 20,
          borderRadius: `${width * 0.2}px ${width * 0.2}px 28px 28px`,
          background: 'linear-gradient(180deg, #3A3A3E 0%, #1F1F22 100%)',
          transform: 'translateZ(-26px)',
          boxShadow: '0 40px 90px rgba(0,0,0,0.35)',
        }}
      />
      {/* maniglia superiore */}
      <div
        style={{
          position: 'absolute',
          left: width * 0.3,
          top: -46,
          width: width * 0.4,
          height: 40,
          borderRadius: 20,
          border: '12px solid #2B2B2F',
          borderBottom: 'none',
          transform: 'translateZ(-20px)',
        }}
      />
      {/* schienale */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width,
          height,
          borderRadius: `${width * 0.18}px ${width * 0.18}px 22px 22px`,
          overflow: 'hidden',
          transform: 'translateZ(0px)',
          boxShadow: 'inset 0 -20px 40px rgba(0,0,0,0.25)',
        }}
      >
        {fabric('back')}
        {children}
        <div style={cushionShade} />
        {/* cuciture */}
        <div
          style={{
            position: 'absolute',
            inset: 18,
            top: height * 0.24,
            borderTop: '3px dashed rgba(255,255,255,0.18)',
            pointerEvents: 'none',
          }}
        />
      </div>
      {/* seduta */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: height - 6,
          width,
          height: depth,
          borderRadius: 26,
          overflow: 'hidden',
          transformOrigin: 'top center',
          transform: 'rotateX(78deg)',
        }}
      >
        {fabric('seat')}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0) 40%, rgba(255,255,255,0.08))',
          }}
        />
      </div>
    </div>
  );
};

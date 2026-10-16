import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Backdrop} from '../lib/Backdrop';
import {Glass} from '../lib/Glass';
import {drift, easeOut, pop, soft, tween} from '../lib/anim';
import {useScene} from '../lib/useScene';
import {wordAt} from '../lib/timing';
import {C, FONT} from '../lib/theme';

const START = 17.35;

const Card: React.FC<{f: number; tIn: number; tStrike: number; y: number; rot: number; children: string}> = ({f, tIn, tStrike, y, rot, children}) => {
  const p = soft(f, tIn - 6, 16);
  const s = tween(f, [tStrike, tStrike + 16], [0, 1], easeOut);
  const x = pop(f, tStrike + 8);
  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity: p,
        transform: `perspective(1500px) rotateX(${(1 - p) * -80}deg) rotateY(${rot + drift(f, 0.7, 4)}deg) translateZ(${(1 - p) * -300}px)`,
      }}
    >
      <Glass radius={44} style={{padding: '34px 60px', position: 'relative', display: 'flex', alignItems: 'center', gap: 30}}>
        <span style={{fontSize: 92, fontWeight: 800, letterSpacing: -3, color: s > 0.5 ? C.gray : C.ink, position: 'relative'}}>
          {children}
          <span
            style={{
              position: 'absolute',
              left: -10,
              right: -10,
              top: '52%',
              height: 10,
              borderRadius: 5,
              background: C.accent,
              transformOrigin: 'left',
              transform: `scaleX(${s})`,
            }}
          />
        </span>
        <span
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            background: C.ink,
            color: C.white,
            fontSize: 52,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${x})`,
          }}
        >
          ✕
        </span>
      </Glass>
    </div>
  );
};

// "Quindi no, non è un caso. E non è nemmeno cattivo gusto."
export const S4NotChance: React.FC = () => {
  const {f, T} = useScene(START);
  const tNo = T(wordAt('no,'));
  const tCaso = T(wordAt('caso.', 18));
  const tNon2 = T(wordAt('nemmeno'));
  const tGusto = T(wordAt('gusto.'));
  const no = pop(f, tNo - 4);
  const noUp = tween(f, [tNo + 30, tNo + 70], [0, 1]);

  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <Backdrop tint={1.4} />
      <div
        style={{
          position: 'absolute',
          width: '100%',
          textAlign: 'center',
          top: 420 - noUp * 250,
          fontSize: 300 - noUp * 120,
          fontWeight: 900,
          letterSpacing: -12,
          color: C.ink,
          transform: `scale(${no}) rotate(${(1 - no) * -12 + drift(f, 0.9, 1.5)}deg)`,
        }}
      >
        No<span style={{color: C.accent}}>.</span>
      </div>
      <Card f={f} tIn={tCaso - 20} tStrike={tCaso + 6} y={640} rot={-6}>
        Un caso
      </Card>
      <Card f={f} tIn={tNon2 - 10} tStrike={tGusto + 4} y={900} rot={6}>
        Cattivo gusto
      </Card>
    </AbsoluteFill>
  );
};

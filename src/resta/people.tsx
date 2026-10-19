import React from 'react';
import {Ink, S, Tube} from './riso';

export type Mouth = 'smile' | 'flat' | 'o' | 'sing' | 'grr' | 'sad';
export type Eyes = 'open' | 'closed' | 'wide' | 'angry' | 'happy';

/** Mano a guantone. Polso nell'origine, dita verso +y. kind: palmo, indice puntato, mignolo */
export const Hand: React.FC<{kind?: 'mitt' | 'point' | 'fist'; s?: number}> = ({kind = 'mitt', s = 1}) => (
  <g transform={`scale(${s})`}>
    {kind === 'point' && <Tube d="M6 50 L6 120" w={22} />}
    <S d="M-26 0 C-36 24 -34 60 -12 68 C6 74 26 66 30 46 C34 26 30 8 22 0 Z" fill="p" />
    {kind === 'mitt' && <S d="M24 20 C42 12 50 28 36 40" sw={8} />}
    {kind === 'fist' && <S d="M-14 30 L18 30 M-14 46 L16 46" sw={6} />}
  </g>
);

/** Braccio che ruota attorno alla spalla (origine). 0° = giù, 180° = su */
export const Arm: React.FC<{angle: number; len?: number; sleeve?: Ink; hand?: 'mitt' | 'point' | 'fist'; stripes?: boolean}> = ({
  angle,
  len = 150,
  sleeve = 'p',
  hand = 'mitt',
}) => (
  <g transform={`rotate(${angle})`}>
    <Tube d={`M0 0 L0 ${len - 20}`} w={36} fill={sleeve} />
    <g transform={`translate(0 ${len - 26})`}>
      <Hand kind={hand} />
    </g>
  </g>
);

const Face: React.FC<{eyes: Eyes; mouth: Mouth; look?: number; ex?: number; ey?: number}> = ({eyes, mouth, look = 0, ex = 36, ey = 14}) => {
  const py = look * -7;
  return (
    <g>
      {eyes === 'open' && (
        <>
          <S el="ellipse" cx={-ex} cy={ey + py} rx={10} ry={13} fill="b" st={false} />
          <S el="ellipse" cx={ex} cy={ey + py} rx={10} ry={13} fill="b" st={false} />
        </>
      )}
      {eyes === 'wide' && (
        <>
          <S el="circle" cx={-ex} cy={ey} r={20} fill="p" sw={6} />
          <S el="circle" cx={ex} cy={ey} r={20} fill="p" sw={6} />
          <S el="circle" cx={-ex} cy={ey + py} r={7} fill="b" st={false} />
          <S el="circle" cx={ex} cy={ey + py} r={7} fill="b" st={false} />
        </>
      )}
      {eyes === 'closed' && <S d={`M${-ex - 16} ${ey} Q${-ex} ${ey + 12} ${-ex + 16} ${ey} M${ex - 16} ${ey} Q${ex} ${ey + 12} ${ex + 16} ${ey}`} sw={7} />}
      {eyes === 'happy' && <S d={`M${-ex - 16} ${ey + 6} Q${-ex} ${ey - 12} ${-ex + 16} ${ey + 6} M${ex - 16} ${ey + 6} Q${ex} ${ey - 12} ${ex + 16} ${ey + 6}`} sw={7} />}
      {eyes === 'angry' && (
        <>
          <S d={`M${-ex - 22} ${ey - 26} L${-ex + 18} ${ey - 10} M${ex + 22} ${ey - 26} L${ex - 18} ${ey - 10}`} sw={9} />
          <S el="circle" cx={-ex} cy={ey + 6} r={8} fill="b" st={false} />
          <S el="circle" cx={ex} cy={ey + 6} r={8} fill="b" st={false} />
        </>
      )}
      {mouth === 'smile' && <S d="M-22 74 Q0 92 22 74" sw={7} />}
      {mouth === 'sad' && <S d="M-20 86 Q0 72 20 86" sw={7} />}
      {mouth === 'flat' && <S d="M-18 80 L18 79" sw={7} />}
      {mouth === 'o' && <S el="ellipse" cx={0} cy={82} rx={12} ry={15} fill="b" st={false} />}
      {mouth === 'sing' && <S d="M-26 66 Q0 62 26 66 Q22 112 0 112 Q-22 112 -26 66 Z" fill="b" sw={6} />}
      {mouth === 'grr' && (
        <>
          <S d="M-30 70 L30 70 L30 94 L-30 94 Z" fill="p" sw={7} />
          <S d="M-30 82 L30 82 M-15 70 L-15 94 M0 70 L0 94 M15 70 L15 94" sw={4} />
        </>
      )}
    </g>
  );
};

type PersonProps = {
  eyes?: Eyes;
  mouth?: Mouth;
  look?: number;
  armL?: number;
  armR?: number;
  handL?: 'mitt' | 'point' | 'fist';
  handR?: 'mitt' | 'point' | 'fist';
  armsFront?: boolean;
  half?: boolean;
  face?: Ink; // colore della faccia (rosso di rabbia → 'dots')
  legPhase?: number; // camminata: 0/1
  halo?: boolean;
};

/**
 * LUI: berretto corallo col pon-pon a retino, naso grosso, lentiggini, maglione a righe.
 * Testa centrata in (0,0), piedi a y≈690.
 */
export const Lui: React.FC<PersonProps> = ({
  eyes = 'open',
  mouth = 'smile',
  look,
  armL = 10,
  armR = -10,
  handL,
  handR,
  armsFront,
  half,
  face = 'p',
}) => {
  const arms = (
    <>
      <g transform="translate(-92 156)">
        <Arm angle={armL} sleeve="a" hand={handL} />
      </g>
      <g transform="translate(92 156)">
        <Arm angle={armR} sleeve="a" hand={handR} />
      </g>
    </>
  );
  return (
    <g>
      {!half && (
        <>
          <S d="M-74 320 L-70 640 L-12 640 L-6 350 L6 350 L12 640 L70 640 L74 320 Z" fill="b" />
          <S d="M-76 640 C-112 640 -118 676 -94 684 L-8 684 C-6 664 -8 650 -12 640 Z" fill="p" />
          <S d="M76 640 C112 640 118 676 94 684 L8 684 C6 664 8 650 12 640 Z" fill="p" />
        </>
      )}
      {!armsFront && arms}
      {/* maglione a righe */}
      <S d="M-96 136 C-60 122 60 122 96 136 L104 336 L-104 336 Z" fill="p" />
      {[186, 236, 286].map((y) => (
        <S key={y} d={`M${-99 - (y - 186) * 0.03} ${y} L${99 + (y - 186) * 0.03} ${y} L${100 + (y - 186) * 0.03} ${y + 22} L${-100 - (y - 186) * 0.03} ${y + 22} Z`} fill="a" st={false} />
      ))}
      <S d="M-96 136 C-60 122 60 122 96 136 L104 336 L-104 336 Z" />
      <S d="M-34 130 Q0 160 34 130" fill="p" />
      <S d="M-20 104 L-20 132 M20 104 L20 132" />
      {/* orecchie e testa */}
      <S d="M-94 -4 C-118 -12 -122 30 -92 30" fill="p" />
      <S d="M94 -4 C118 -12 122 30 92 30" fill="p" />
      <S el="ellipse" cx={0} cy={4} rx={96} ry={112} fill={face} />
      {/* berretto */}
      <S el="circle" cx={0} cy={-146} r={28} fill="dots" />
      <S d="M-98 -40 C-104 -150 104 -150 98 -40 Z" fill="a" />
      <S d="M-104 -54 L104 -54 L100 -18 L-100 -18 Z" fill="a" />
      <S d="M-80 -50 L-80 -22 M-48 -52 L-48 -20 M-16 -52 L-16 -20 M16 -52 L16 -20 M48 -52 L48 -20 M80 -50 L80 -22" sw={5} />
      <Face eyes={eyes} mouth={mouth} look={look} ex={38} ey={18} />
      {/* naso grosso + lentiggini */}
      <S d="M4 16 C2 40 -26 52 -14 64 C-4 70 10 66 14 60" sw={7} fill="p" />
      <S d="M-62 44 L-61 45 M-50 54 L-49 55 M-70 58 L-69 59 M62 44 L63 45 M50 54 L51 55 M70 58 L71 59" sw={8} />
      {armsFront && arms}
    </g>
  );
};

/**
 * LEI: capelli ricci a nuvola, guance corallo, vestito corallo a trapezio.
 * Testa centrata in (0,0), piedi a y≈690.
 */
export const Lei: React.FC<PersonProps> = ({
  eyes = 'open',
  mouth = 'smile',
  look,
  armL = 14,
  armR = -14,
  handL,
  handR,
  armsFront,
  half,
  legPhase = 0,
  halo,
}) => {
  const curls = Array.from({length: 13}, (_, i) => {
    const a = Math.PI * (0.88 + (i / 12) * 1.24);
    return [Math.cos(a) * 112, Math.sin(a) * 110 + 4];
  });
  const arms = (
    <>
      <g transform="translate(-74 160)">
        <Arm angle={armL} sleeve="dots" hand={handL} len={140} />
      </g>
      <g transform="translate(74 160)">
        <Arm angle={armR} sleeve="dots" hand={handR} len={140} />
      </g>
    </>
  );
  const step = legPhase ? 14 : -14;
  return (
    <g>
      {halo && <S el="ellipse" cx={0} cy={-170} rx={70} ry={18} fill="none" st="a" sw={14} />}
      {/* capelli dietro */}
      {curls.map(([x, y], i) => (
        <S key={i} el="circle" cx={x} cy={y} r={48} fill="b" />
      ))}
      <S d="M-150 40 C-160 120 -110 150 -80 120 L80 120 C110 150 160 120 150 40 Z" fill="b" />
      {!half && (
        <>
          <S d={`M-34 400 L${-34 + step} 640 M34 400 L${34 - step} 640`} sw={14} />
          <S el="ellipse" cx={-44 + step} cy={650} rx={34} ry={16} fill="b" />
          <S el="ellipse" cx={44 - step} cy={650} rx={34} ry={16} fill="b" />
        </>
      )}
      {!armsFront && arms}
      {/* vestito */}
      <S d="M-70 134 C-40 124 40 124 70 134 L138 430 L-138 430 Z" fill="a" />
      <S d="M-30 130 Q0 158 30 130" fill="p" />
      <S d="M-18 100 L-18 130 M18 100 L18 130" />
      <S el="circle" cx={0} cy={0} r={100} fill="p" />
      {/* frangia riccia */}
      <S d="M-96 -20 C-100 -80 -60 -110 0 -110 C60 -110 100 -80 96 -20 Q80 -44 62 -30 Q46 -60 24 -36 Q4 -64 -18 -38 Q-38 -62 -56 -34 Q-74 -50 -96 -20 Z" fill="b" />
      <S el="circle" cx={-62} cy={44} r={20} fill="a" st={false} />
      <S el="circle" cx={62} cy={44} r={20} fill="a" st={false} />
      <Face eyes={eyes} mouth={mouth} look={look} ex={34} ey={16} />
      <S d="M2 26 L-6 46 L8 46" sw={6} />
      {armsFront && arms}
    </g>
  );
};

/** Orologio da taschino (ritorna più volte) */
export const Watch: React.FC<{f: number; r?: number}> = ({f, r = 70}) => (
  <g>
    <S el="circle" cx={0} cy={-r - 16} r={14} fill="p" />
    <S el="circle" r={r + 10} fill="a" />
    <S el="circle" r={r - 6} fill="p" />
    {Array.from({length: 12}, (_, i) => {
      const a = (i * Math.PI) / 6;
      return <S key={i} d={`M${Math.cos(a) * (r - 22)} ${Math.sin(a) * (r - 22)} L${Math.cos(a) * (r - 14)} ${Math.sin(a) * (r - 14)}`} sw={5} />;
    })}
    <S d={`M0 0 L0 ${-(r - 26)}`} transform={`rotate(${f * 30})`} sw={7} />
    <S d={`M0 0 L0 ${-(r - 38)}`} transform={`rotate(${f * 4})`} sw={9} />
    <S el="circle" r={6} fill="b" st={false} />
  </g>
);

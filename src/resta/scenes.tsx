import React from 'react';
import {random} from 'remotion';
import {PH, PW, Riso, S, Tube, ease, pop, prog, sec, useStep} from './riso';
import {
  Bands,
  Boat,
  Cat,
  Cloud,
  Flying,
  Lantern,
  LeiBack,
  Lighthouse,
  LuiBack,
  Moon,
  Perched,
  Pole,
  Pt,
  Sea,
  Skyline,
  Sparkles,
  quadD,
  quadPt,
  sparkPath,
} from './world';

/**
 * Una scena per strofa, in coordinate della cornice (PW×PH). Le immagini non illustrano
 * parola per parola: raccontano una piccola storia (città, mare, faro, tetto) che
 * accompagna il senso del testo, con qualche aggancio preciso ai tempi della voce.
 * T(t) converte un istante del brano nel fotogramma locale della scena.
 */
type SceneProps = {start: number};
const useT = (start: number) => (t: number) => sec(t - start);

// ── 1 · "E ti darò il mio tempo…" — la città passa dal tramonto alla notte ──
export const City: React.FC<SceneProps> = ({start}) => {
  const f = useStep(2);
  const T = useT(start);
  const end = T(4.4);
  const pan = ease(prog(f, 0, end)) * 180;
  const night = ease(prog(f, 8, end - 10));
  const nightH = 80 + night * 560;
  const sunY = 560 + ease(prog(f, 0, end - 30)) * 360;
  return (
    <Riso zoom={1 + prog(f, 0, end) * 0.04} seed="city">
      {/* cielo: tramonto corallo, la notte scende dall'alto */}
      <g transform={`translate(${-pan * 0.3} 0)`}>
        <Bands y0={300} y1={760} inks={['c1', 'c2', 'c3']} />
        <S el="circle" cx={640} cy={sunY} r={110} fill="a" st={false} />
        <Bands y1={nightH} inks={['t3', 't2', 't1']} />
        <Sparkles f={f} seed="cs" n={22} area={[0, 20, 1200, 600]} maxY={nightH - 40} from={20} />
        {night > 0.55 && <Moon x={200} y={190 - (night - 0.55) * 100} r={56} />}
      </g>
      {/* skyline con la torre dell'orologio che corre */}
      <g transform={`translate(${-pan} 0)`}>
        <Skyline base={770} width={1200} seed="sky1" lit={night * 0.7} clockAt={420} clockF={f} minH={170} maxH={400} />
      </g>
      {/* fiume con i riflessi delle finestre */}
      <g transform={`translate(${-pan} 0)`}>
        <Sea y={770} f={f} glowX={night < 0.5 ? 640 + pan * 0.7 : undefined} />
      </g>
      {/* primo piano: parapetto e lampione (si muove più veloce: profondità) */}
      <g transform={`translate(${-pan * 1.6} 0)`}>
        <S el="rect" x={-100} y={1060} width={1600} height={140} fill="b" st={false} />
        <S d="M-100 1000 L1500 1000" sw={10} />
        {Array.from({length: 26}, (_, i) => (
          <S key={i} d={`M${-80 + i * 60} 1000 L${-80 + i * 60} 1060`} sw={8} />
        ))}
        <Tube d="M160 1070 L160 520" w={18} fill="b" />
        <S d="M120 520 L200 520 L180 470 L140 470 Z" fill="b" />
        {night > 0.3 && <S el="circle" cx={160} cy={540} r={70} fill="g1" st={false} />}
        <S el="circle" cx={160} cy={530} r={18} fill={night > 0.3 ? 'a' : 'w'} sw={5} />
      </g>
    </Riso>
  );
};

// ── 2 · "Non ho mai visto l'amore che avevo" — il faro illumina tutto, tranne la barca ai suoi piedi ──
export const Lookout: React.FC<SceneProps> = ({start}) => {
  const f = useStep(2);
  const T = useT(start);
  const beam = 262 + Math.sin(f / 7) * 62;
  const bob = Math.sin(f / 5) * 6;
  return (
    <Riso zoom={1.02 + prog(f, 0, T(6.2)) * 0.06} origin={[560, 760]} seed="look">
      <Bands y1={700} inks={['t3', 't2', 't1']} />
      <Sparkles f={f} seed="ls" n={26} area={[0, 20, PW, 640]} />
      <Moon x={180} y={170} r={62} />
      <Sea y={700} f={f} glowX={180} />
      <Lighthouse x={720} base={830} beam={beam} spread={14} strong />
      <g transform={`translate(430 ${812 + bob}) rotate(${Math.sin(f / 6) * 3}) scale(0.75)`}>
        <Boat people={1} />
      </g>
    </Riso>
  );
};

// ── 3 · "Avevo troppa rabbia" — tempesta ──
const wavePath = (y: number, amp: number, len: number) => {
  let d = `M-200 ${y}`;
  for (let x = -200; x <= PW + 600; x += len) d += ` Q${x + len / 4} ${y - amp} ${x + len / 2} ${y} T${x + len} ${y}`;
  return `${d} L${PW + 600} ${PH + 100} L-200 ${PH + 100} Z`;
};
export const Storm: React.FC<SceneProps> = () => {
  const f = useStep(2);
  const flash = f % 8 < 2;
  const ph = f * 10;
  return (
    <Riso shake={16} seed="storm">
      <Bands y1={PH} inks={['c3', 'c3', 'c2']} />
      {flash && <S d="M560 -20 L470 260 L540 260 L430 560 L620 220 L540 220 L620 -20 Z" fill="w" sw={6} />}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${((i * 380 + f * 6) % 1300) - 300} ${70 + i * 60})`}>
          <S d="M-200 60 C-260 60 -250 -20 -180 -20 C-180 -100 -60 -110 -30 -50 C0 -120 140 -110 140 -30 C220 -40 240 60 160 60 Z" fill="b" />
        </g>
      ))}
      <S
        d={Array.from({length: 40}, (_, i) => {
          const x = ((random(`rx${i}`) * 1300 + f * 30) % 1300) - 200;
          const y = ((random(`ry${i}`) * 1300 + f * 70) % 1300) - 100;
          return `M${x} ${y} l-30 70`;
        }).join(' ')}
        sw={6}
      />
      <g transform={`translate(${-(ph % 400)} 0)`}>
        <S d={wavePath(760, 90, 400)} fill="t2" />
      </g>
      <g transform={`translate(480 ${720 + Math.sin(f / 3) * 40}) rotate(${Math.sin(f / 3.5) * 22}) scale(0.7)`}>
        <Boat people={1} />
      </g>
      <g transform={`translate(${-((ph * 1.6) % 300)} 0)`}>
        <S d={wavePath(900, 110, 300)} fill="b" />
      </g>
    </Riso>
  );
};

// ── 4 · "Adesso, se lo voglio, lo posso cantare" — all'alba gli uccelli si posano sui fili come note ──
const WIRES = [380, 430, 480, 530, 580];
const wireY = (y0: number, t: number) => y0 + 150 * t * (1 - t);
const wireX = (t: number) => 90 + t * 780;
export const Wires: React.FC<SceneProps> = ({start}) => {
  const f = useStep(2);
  const T = useT(start);
  const sunY = 940 - ease(prog(f, 0, T(9.16))) * 220;
  const words = [7.2, 7.36, 7.62, 7.84, 8.02, 8.28, 8.48, 8.7];
  const notes: [number, number][] = [
    [2, 0.14],
    [1, 0.24],
    [0, 0.34],
    [1, 0.44],
    [3, 0.53],
    [2, 0.62],
    [4, 0.73],
    [1, 0.84],
  ];
  return (
    <Riso zoom={1.04 - prog(f, 0, T(9.16)) * 0.04} seed="wires">
      <Bands y0={220} y1={960} inks={['c1', 'c2', 'c3']} />
      <g transform={`translate(480 ${sunY})`}>
        {Array.from({length: 12}, (_, i) => (
          <S key={i} d="M0 0 L-60 -900 L60 -900 Z" transform={`rotate(${i * 30 + Math.floor(f / 4) * 2})`} fill="c1" st={false} />
        ))}
        <S el="circle" r={140} fill="a" st={false} />
      </g>
      {/* tetti */}
      <S
        d="M-20 960 L-20 860 L120 860 L120 800 L180 800 L180 860 L300 860 L360 800 L420 860 L560 860 L560 780 L700 780 L700 880 L820 880 L820 830 L980 830 L980 1200 L-20 1200 Z"
        fill="b"
        st={false}
      />
      <S d="M620 780 L620 700 M600 720 L640 720 M590 740 L650 740" sw={6} />
      <Pole x={90} top={330} bottom={1200} />
      <Pole x={870} top={330} bottom={1200} />
      {WIRES.map((y) => (
        <S key={y} d={`M90 ${y} Q480 ${y + 150} 870 ${y}`} sw={5} />
      ))}
      {words.map((t, i) => {
        const t0 = T(t);
        if (f < t0) return null;
        const [wi, tt] = notes[i];
        const px = wireX(tt);
        const py = wireY(WIRES[wi], tt);
        const k = prog(f, t0, t0 + 6);
        const fx = PW + 80 + (px - PW - 80) * ease(k);
        const fy = 120 + (py - 120) * ease(k) - Math.sin(k * Math.PI) * 60;
        return (
          <g key={i} transform={`translate(${fx} ${fy})`}>
            {k < 1 ? <Flying up={Math.floor(f / 2) % 2 === 0} s={0.9} /> : <Perched flip={i % 3 === 0} />}
          </g>
        );
      })}
    </Riso>
  );
};

// ── 5 · "Non son più schiavo, non lo son mai stato" — la gabbia sul davanzale, aperta ──
export const Cage: React.FC<SceneProps> = ({start}) => {
  const f = useStep(2);
  const T = useT(start);
  const open = prog(f, T(9.6), T(9.6) + 4);
  const fly = prog(f, T(9.95), T(10.9));
  const curtain = (side: number) => {
    const w = Math.sin(f / 5) * 20;
    const x0 = side < 0 ? 0 : PW;
    const x1 = side < 0 ? 170 + w : PW - 170 - w;
    return `M${x0} 0 L${x1} 0 C${x1 + side * -30} 300 ${x1 + side * 40} 600 ${x1 + side * -20} 1000 L${x0} 1000 Z`;
  };
  // percorso dell'uccellino: dalla gabbia fuori dalla finestra, sempre più piccolo
  const bx = 480 + ease(fly) * 300 - Math.sin(fly * Math.PI) * 120;
  const by = 760 - ease(fly) * 560;
  const bs = 0.9 - fly * 0.6;
  return (
    <Riso zoom={1 + prog(f, 0, T(10.94)) * 0.05} origin={[480, 700]} seed="cage">
      {/* fuori: mattina sui tetti */}
      <Bands y0={120} y1={760} inks={['c1', 'c1', 'c2']} />
      <S el="circle" cx={700} cy={330} r={80} fill="a" st={false} />
      <Skyline base={780} width={PW} seed="cage" minH={60} maxH={220} ink="t2" />
      <g transform="translate(300 220)">
        <Cloud s={0.6} />
      </g>
      {/* parete interna e finestra */}
      <S d={`M-50 -50 L${PW + 50} -50 L${PW + 50} ${PH + 50} L-50 ${PH + 50} Z M160 120 L160 800 L800 800 L800 120 Z`} fill="t1" fillRule="evenodd" st={false} />
      <S el="rect" x={160} y={120} width={640} height={680} sw={22} />
      <S d="M160 120 L60 60 L60 860 L160 800 Z" fill="w" />
      <S d="M800 120 L900 60 L900 860 L800 800 Z" fill="w" />
      <S d="M70 420 L150 440 M810 440 L890 420" sw={6} />
      <S d={curtain(-1)} fill="c2" />
      <S d={curtain(1)} fill="c2" />
      {/* davanzale */}
      <S el="rect" x={110} y={800} width={740} height={50} fill="p" />
      {/* vaso con fiore */}
      <S d="M660 800 L640 720 L740 720 L720 800 Z" fill="a" />
      <S d="M690 720 L690 640 M690 680 C720 660 740 670 744 680" sw={6} />
      <S el="circle" cx={690} cy={630} r={18} fill="w" sw={5} />
      {/* gabbia */}
      <g transform="translate(420 800)">
        <S el="ellipse" cx={0} cy={-10} rx={130} ry={18} fill="b" />
        {[-110, -70, -30, 10, 50, 90].map((x) => (
          <S key={x} d={`M${x} -12 L${x} -230`} sw={5} />
        ))}
        <S d="M-130 -10 L-130 -230 C-130 -330 130 -330 130 -230 L130 -10" sw={7} />
        <S d="M-130 -230 L130 -230" sw={7} />
        <S d="M0 -312 L0 -350 C0 -380 30 -380 30 -360" sw={6} />
        {/* sportello: si apre ruotando verso l'esterno */}
        <g transform={`translate(50 -40) scale(${1 - open * 0.9} 1)`}>
          <S el="rect" x={0} y={-130} width={70} height={130} fill="none" sw={7} />
          <S d="M23 -130 L23 0 M46 -130 L46 0" sw={4} />
        </g>
      </g>
      {fly <= 0 ? (
        <g transform="translate(400 760) scale(0.9)">
          <Perched />
        </g>
      ) : (
        <g transform={`translate(${bx} ${by})`}>
          <Flying up={Math.floor(f / 2) % 2 === 0} s={bs * 1.3} />
        </g>
      )}
    </Riso>
  );
};

// ── 6 · "Ma prima cercavo perlopiù di lottare" — due aquiloni che si scontrano nel vento ──
const Kite: React.FC<{p: Pt; ink: 'a' | 'c2'; rot: number}> = ({p, ink, rot}) => (
  <g transform={`translate(${p[0]} ${p[1]}) rotate(${rot})`}>
    <S d="M0 90 C-30 160 30 200 0 260 C-30 320 20 360 0 400" sw={5} />
    {[170, 250, 330].map((y) => (
      <S key={y} d={`M-16 ${y - 10} L16 ${y + 10} M16 ${y - 10} L-16 ${y + 10}`} st="a" sw={8} />
    ))}
    <S d="M0 -110 L80 0 L0 90 L-80 0 Z" fill={ink} />
    <S d="M0 -110 L0 90 M-80 0 L80 0" sw={5} />
  </g>
);
export const Kites: React.FC<SceneProps> = ({start}) => {
  const f = useStep(2);
  const T = useT(start);
  const hits = [11.15, 11.65, 12.16, 12.62].map(T);
  let clash = 0;
  for (const h of hits) {
    const k = f - h;
    if (k >= -4 && k < 6) clash = Math.max(clash, 1 - Math.abs(k) / 6);
  }
  const k1: Pt = [290 + clash * 140 + Math.sin(f / 6) * 40, 420 + Math.cos(f / 7) * 40];
  const k2: Pt = [670 - clash * 140 + Math.cos(f / 5) * 40, 450 + Math.sin(f / 6) * 40];
  const hand1: Pt = [190, 900];
  const hand2: Pt = [780, 860];
  return (
    <Riso zoom={1.02} seed="kites">
      <Bands y0={500} y1={900} inks={['c1', 'c1', 'c2']} />
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${((i * 620 + f * 4) % 1300) - 200} ${110 + i * 60})`}>
          <Cloud s={0.5 + i * 0.12} />
        </g>
      ))}
      {/* fili */}
      <S d={`M${hand1[0]} ${hand1[1]} Q${(hand1[0] + k1[0]) / 2 + 60} ${(hand1[1] + k1[1]) / 2 + 80} ${k1[0]} ${k1[1] + 60}`} sw={4} />
      <S d={`M${hand2[0]} ${hand2[1]} Q${(hand2[0] + k2[0]) / 2 - 60} ${(hand2[1] + k2[1]) / 2 + 80} ${k2[0]} ${k2[1] + 60}`} sw={4} />
      <Kite p={k1} ink="a" rot={-12 + clash * 30} />
      <Kite p={k2} ink="c2" rot={12 - clash * 30} />
      {clash > 0.7 && (
        <g transform={`translate(${(k1[0] + k2[0]) / 2} ${(k1[1] + k2[1]) / 2})`}>
          {Array.from({length: 8}, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <S key={i} d={`M${Math.cos(a) * 50} ${Math.sin(a) * 50} L${Math.cos(a) * 90} ${Math.sin(a) * 90}`} st="a" sw={10} />;
          })}
        </g>
      )}
      {/* due colline lontane, una persona per collina */}
      <S d="M-100 1200 L-100 980 C60 880 260 880 420 990 C480 1030 520 1100 540 1200 Z" fill="t2" />
      <S d="M380 1200 C460 1000 620 870 820 880 C940 886 1020 940 1100 1000 L1100 1200 Z" fill="t1" />
      <g transform="translate(170 934) scale(0.32)">
        <S d="M-40 0 L-40 -140 L40 -140 L40 0 Z" fill="b" />
        <S el="circle" cx={0} cy={-190} r={46} fill="p" />
        <S d="M-48 -196 C-50 -260 50 -260 48 -196 Z" fill="a" />
        <S d="M30 -120 L70 -150" sw={16} />
      </g>
      <g transform="translate(800 892) scale(0.32)">
        <S d="M-60 0 L-36 -140 L36 -140 L60 0 Z" fill="a" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <S key={i} el="circle" cx={Math.cos((i / 7) * Math.PI * 2) * 34} cy={-190 + Math.sin((i / 7) * Math.PI * 2) * 34} r={28} fill="b" st={false} />
        ))}
        <S d="M-30 -120 L-70 -150" sw={16} />
      </g>
      {/* vento */}
      {[0, 1, 2].map((i) => {
        const x = ((f * 14 + i * 400) % 1400) - 300;
        return <S key={i} d={`M${x} ${560 + i * 90} q60 -30 120 0 t120 0 q30 -40 0 -50`} sw={5} />;
      })}
    </Riso>
  );
};

// ── 7 · "Perlopiù cercavo un difetto per collegarci" — le stelle si uniscono in un cuore, una è storta ──
const HEART_PTS: Pt[] = Array.from({length: 16}, (_, i) => {
  const t = (i / 16) * Math.PI * 2;
  const x = 16 * Math.sin(t) ** 3;
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
  return [480 + x * 19, 470 + y * 19];
});
export const Stars: React.FC<SceneProps> = ({start}) => {
  const f = useStep(2);
  const T = useT(start);
  const ODD = 10;
  const tLines = [T(13.1), T(14.4)];
  const tFound = T(14.52);
  const tFix = T(15.04);
  const fix = ease(prog(f, tFix, tFix + 6));
  const pts = HEART_PTS.map((p, i) => (i === ODD ? ([p[0] + 110 * (1 - fix), p[1] + 70 * (1 - fix)] as Pt) : p));
  const drawn = prog(f, tLines[0], tLines[1]) * pts.length;
  const shoot = prog(f, T(13.6), T(13.6) + 8);
  return (
    <Riso zoom={1 + prog(f, 0, T(15.84)) * 0.06} origin={[480, 520]} seed="stars">
      <Bands y1={PH} inks={['t3', 't3', 't2', 't2', 't1']} />
      <Sparkles f={f} seed="ss" n={40} area={[0, 20, PW, 900]} />
      {fix >= 1 && <S d={quadD(pts)} fill="c1" st={false} transform={`translate(480 470) scale(${pop(f, tFix + 6, 6)}) translate(-480 -470)`} />}
      {pts.map((p, i) => {
        const q = pts[(i + 1) % pts.length];
        // le linee verso la stella storta si chiudono solo quando torna al suo posto
        const touchesOdd = i === ODD || (i + 1) % pts.length === ODD;
        const amt = Math.min(1, Math.max(0, drawn - i));
        if (amt <= 0 || (touchesOdd && fix < 1)) return null;
        return <S key={i} d={`M${p[0]} ${p[1]} L${p[0] + (q[0] - p[0]) * amt} ${p[1] + (q[1] - p[1]) * amt}`} st="a" sw={6} />;
      })}
      {pts.map((p, i) => {
        const odd = i === ODD;
        const blink = odd && f >= tFound && f < tFix && Math.floor(f / 2) % 2 === 0 ? 1.5 : 1;
        return <S key={`s${i}`} d={sparkPath(odd ? 24 : 16)} transform={`translate(${p[0]} ${p[1]}) scale(${blink})`} fill={odd ? 'a' : 'w'} st={false} />;
      })}
      {shoot > 0 && shoot < 1 && <S d={`M${880 - shoot * 400} ${80 + shoot * 160} l120 -50`} fill="none" st="a" sw={8} />}
      {/* collina con due figure sedute che guardano in su */}
      <S d="M-100 1200 L-100 1000 C200 920 700 920 1100 1010 L1100 1200 Z" fill="b" st={false} />
      <g transform="translate(430 960) scale(0.32)">
        <LuiBack />
      </g>
      <g transform="translate(540 962) scale(0.32)">
        <LeiBack lean={f >= tFix ? 12 : 0} />
      </g>
    </Riso>
  );
};

// ── 8 · "Dalle mie parti non credono agli angeli / né agli altri" — la strada si spegne finestra dopo finestra ──
const LQ: [Pt, Pt, Pt, Pt] = [
  [0, 0],
  [330, 430],
  [330, 720],
  [0, 1060],
];
const RQ: [Pt, Pt, Pt, Pt] = [
  [PW, 0],
  [630, 430],
  [630, 720],
  [PW, 1060],
];
const facadeWins = (q: [Pt, Pt, Pt, Pt]) => {
  const out: Pt[][] = [];
  for (const u of [0.06, 0.32, 0.56, 0.76])
    for (const v of [0.12, 0.34, 0.56]) {
      const du = 0.13 - u * 0.05;
      out.push([quadPt(q, u, v), quadPt(q, u + du, v), quadPt(q, u + du, v + 0.14), quadPt(q, u, v + 0.14)]);
    }
  return out;
};
export const Street: React.FC<SceneProps> = ({start}) => {
  const f = useStep(2);
  const T = useT(start);
  const wins = React.useMemo(() => {
    const all = [...facadeWins(LQ), ...facadeWins(RQ)];
    for (const x of [360, 440, 520])
      for (const y of [470, 560])
        all.push([
          [x, y],
          [x + 50, y],
          [x + 50, y + 60],
          [x, y + 60],
        ]);
    const order = all.map((w, i) => ({w, r: random(`sw${i}`)})).sort((a, b) => a.r - b.r);
    const t0 = sec(16.66 - start);
    const t1 = sec(19.6 - start);
    return order.map((o, i) => ({w: o.w, off: Math.round(t0 + (i / (order.length - 1)) * (t1 - t0))}));
  }, [start]);
  const walk = prog(f, 0, T(19.88));
  const fy = 1150 - walk * 360;
  const fs = 0.55 - walk * 0.3;
  const bob = Math.floor(f / 4) % 2;
  const lamps = [0.22, 0.6];
  const lampsOff = T(18.6);
  const feather = prog(f, 0, T(19.88));
  return (
    <Riso zoom={1 + prog(f, 0, T(19.88)) * 0.08} origin={[480, 640]} seed="street">
      <Bands y1={440} inks={['t3', 't2']} />
      <Sparkles f={f} seed="sts" n={12} area={[340, 20, 620, 360]} />
      <Moon x={500} y={150} r={46} />
      {/* fondo strada */}
      <S el="rect" x={330} y={420} width={300} height={300} fill="p" />
      <S d="M330 420 L380 380 L580 380 L630 420" fill="b" />
      {/* facciate */}
      <S d={quadD(LQ)} fill="p" />
      <S d={quadD(RQ)} fill="p" />
      {/* marciapiedi e strada */}
      <S d="M0 1060 L330 720 L630 720 L960 1060 L960 1200 L0 1200 Z" fill="t1" />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = i / 5;
        const b = a + 0.1;
        const y = (t: number) => 720 + (1200 - 720) * t * t;
        const w = (t: number) => 4 + 20 * t;
        return <S key={i} d={`M${480 - w(a)} ${y(a)} L${480 + w(a)} ${y(a)} L${480 + w(b)} ${y(b)} L${480 - w(b)} ${y(b)} Z`} fill="w" sw={3} />;
      })}
      {wins.map(({w, off}, i) => (
        <S key={i} d={quadD(w)} fill={f >= off ? 'b' : 'a'} sw={4} />
      ))}
      {/* lampioni: si spengono */}
      {lamps.map((u, i) =>
        [LQ, RQ].map((q, side) => {
          const base = quadPt(q, u, 1);
          const s = 1 - u * 0.7;
          const h = 360 * s;
          const on = f < lampsOff + i * 4;
          const lx = base[0] + (side ? -40 : 40) * s;
          return (
            <g key={`${i}${side}`}>
              {on && <S el="circle" cx={lx} cy={base[1] - h} r={70 * s} fill="g2" st={false} />}
              <S d={`M${base[0]} ${base[1]} L${base[0]} ${base[1] - h} L${lx} ${base[1] - h}`} sw={10 * s} />
              <S el="circle" cx={lx} cy={base[1] - h + 8 * s} r={14 * s} fill={on ? 'a' : 'b'} sw={4} />
            </g>
          );
        }),
      )}
      {/* lei che si allontana, con l'aureola */}
      <g transform={`translate(480 ${fy - bob * 4}) scale(${fs})`}>
        <S el="ellipse" cx={0} cy={-370} rx={60} ry={16} fill="none" st="a" sw={16} />
        <S d="M-34 0 L-30 -150 M34 0 L30 -150" sw={22} transform={bob ? 'translate(0 -10)' : undefined} />
        <S d="M-110 -150 L110 -150 L80 -300 L-80 -300 Z" fill="a" />
        {Array.from({length: 9}, (_, i) => {
          const a = (i / 9) * Math.PI * 2;
          return <S key={i} el="circle" cx={Math.cos(a) * 50} cy={-330 + Math.sin(a) * 50} r={34} fill="b" />;
        })}
        <S el="circle" cx={0} cy={-330} r={52} fill="b" st={false} />
      </g>
      {/* una piuma che scende */}
      <g transform={`translate(${300 + Math.sin(feather * 9) * 50} ${-40 + feather * 760}) rotate(${Math.sin(feather * 9) * 30})`}>
        <S d="M0 -40 C24 -20 22 30 0 46 C-22 30 -24 -20 0 -40 Z" fill="w" sw={5} />
        <S d="M0 -36 L0 60" sw={4} />
      </g>
    </Riso>
  );
};

// ── 9 · "Resta con me, solo dell'amore non so sdebitarmi" — sul tetto, di spalle, davanti alla città ──
const Garland: React.FC<{f: number; y0: number; y1: number}> = ({f, y0, y1}) => {
  const sway = Math.sin(f / 8) * 10;
  const n = 14;
  const x0 = 40;
  const x1 = PW + 20;
  const pt = (t: number): Pt => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + 160 * t * (1 - t) + sway * Math.sin(t * Math.PI)];
  return (
    <>
      <S d={Array.from({length: 21}, (_, i) => `${i ? 'L' : 'M'}${pt(i / 20)[0]} ${pt(i / 20)[1]}`).join(' ')} sw={4} />
      {Array.from({length: n}, (_, i) => {
        const [x, y] = pt((i + 0.5) / n);
        return (
          <g key={i}>
            <S d={`M${x} ${y} l0 14`} sw={4} />
            <S el="circle" cx={x} cy={y + 26} r={12} fill={Math.floor((f + i * 2) / 6) % 5 === 0 ? 'c2' : 'a'} st={false} />
          </g>
        );
      })}
    </>
  );
};
export const Rooftop: React.FC<SceneProps> = ({start}) => {
  const f = useStep(2);
  const T = useT(start);
  const lean = ease(prog(f, T(20.3), T(20.3) + 6)) * 16;
  const shoot = prog(f, T(21.8), T(21.8) + 10);
  return (
    <Riso zoom={1.06 - prog(f, 0, T(23.06)) * 0.06} origin={[480, 700]} seed="roof">
      <Bands y1={760} inks={['t3', 't3', 't2', 't1']} />
      <Sparkles f={f} seed="rs" n={28} area={[0, 20, PW, 560]} />
      <Moon x={650} y={300} r={160} />
      {shoot > 0 && shoot < 1 && <S d={`M${900 - shoot * 500} ${60 + shoot * 200} l140 -56`} fill="none" st="a" sw={8} />}
      <Skyline base={900} width={PW} seed="roofsky" minH={120} maxH={300} ink="t2" lit={0.45} />
      <Garland f={f} y0={240} y1={330} />
      <S d="M40 240 L40 820" sw={10} />
      {/* muretto */}
      <S el="rect" x={-40} y={880} width={PW + 80} height={70} fill="p" />
      <S el="rect" x={-40} y={950} width={PW + 80} height={300} fill="t2" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <S key={i} d={`M${i * 160 + 40} 880 L${i * 160 + 40} 950`} sw={5} />
      ))}
      <g transform="translate(380 890) scale(1.05)">
        <LuiBack />
      </g>
      <g transform={`translate(${610 - lean * 1.2} 890) scale(1.05)`}>
        <LeiBack lean={lean} />
      </g>
      <g transform="translate(860 880) scale(0.7)">
        <Cat f={f} />
      </g>
    </Riso>
  );
};

// ── 10 · "Resta e ti darò, ti darò…" — lanterne che salgono, poi la città risponde ──
export const Lanterns: React.FC<SceneProps> = ({start}) => {
  const f = useStep(2);
  const T = useT(start);
  const ours = [23.15, 24.02, 24.56, 25.04, 25.5].map(T);
  const others = Array.from({length: 14}, (_, i) => ({at: T(25.8) + i * 3, x: 60 + random(`lx${i}`) * 840, y: 820 + random(`ly${i}`) * 80}));
  const lit = prog(f, T(25.8), T(27.2));
  const rise = (t0: number, x0: number, y0: number, i: number, s0: number) => {
    const k = f - t0;
    if (k < 0) return null;
    const x = x0 + Math.sin(k / 9 + i) * 30 + k * (i % 2 ? 2.4 : -2.4) * (1 + (i % 3) * 0.4);
    const y = y0 - k * 9;
    const s = s0 * (1 - Math.min(0.6, k / 160));
    return (
      <g key={`${t0}-${i}`} transform={`translate(${x} ${y}) scale(${pop(f, t0, 4)})`}>
        <Lantern f={f} i={i} s={s} />
      </g>
    );
  };
  return (
    <Riso zoom={1.0 + prog(f, 0, T(27.2)) * 0.05} origin={[480, 900]} seed="lan">
      <Bands y1={880} inks={['t3', 't3', 't2', 't1']} />
      <Sparkles f={f} seed="lns" n={30} area={[0, 20, PW, 700]} />
      <Moon x={170} y={200} r={70} />
      <Skyline base={960} width={PW} seed="lansky" minH={140} maxH={360} ink="b" lit={0.15 + lit * 0.8} />
      {others.map((o, i) => rise(o.at, o.x, o.y, i + 5, 0.5))}
      {/* il nostro tetto, in basso */}
      <S el="rect" x={-40} y={1000} width={PW + 80} height={50} fill="p" />
      <S el="rect" x={-40} y={1050} width={PW + 80} height={200} fill="t2" />
      <g transform="translate(440 1004) scale(0.45)">
        <LuiBack />
      </g>
      <g transform="translate(540 1004) scale(0.45)">
        <LeiBack lean={14} />
      </g>
      {ours.map((t0, i) => rise(t0, 490 + (i - 2) * 70, 880, i, 0.9))}
    </Riso>
  );
};

// ── 11 · "Solo per sentirmi dire che bastavo io da anni" — all'alba il faro trova la barca ──
export const Dawn: React.FC<SceneProps> = ({start}) => {
  const f = useStep(2);
  const T = useT(start);
  const sunY = 760 - ease(prog(f, 0, T(30))) * 170;
  const beam = 205 - ease(prog(f, T(27.6), T(29.06))) * 70;
  const strong = f >= T(29.06);
  const boatX = 300 + ease(prog(f, 0, T(31.4))) * 120;
  return (
    <Riso zoom={1.1 - ease(prog(f, 0, T(31.4))) * 0.1} origin={[480, 700]} seed="dawn">
      <Bands y0={160} y1={720} inks={['c1', 'c1', 'c2', 'c3']} />
      <S el="circle" cx={420} cy={sunY} r={140} fill="a" st={false} />
      <Sea y={720} f={f} glowX={420} />
      <Lighthouse x={780} base={860} beam={beam} spread={10} strong={strong} />
      <g transform={`translate(${boatX} ${830 + Math.sin(f / 5) * 5}) rotate(${Math.sin(f / 6) * 2}) scale(0.8)`}>
        <Boat people={2} sail="a" />
      </g>
      {[0, 1, 2].map((i) => {
        const k = f - i * 10;
        if (k < 0) return null;
        return (
          <g key={i} transform={`translate(${-60 + k * 6 + i * 60} ${300 - i * 50 - k * 1.5})`}>
            <Flying up={Math.floor((f + i) / 2) % 2 === 0} s={0.8} />
          </g>
        );
      })}
    </Riso>
  );
};

export const SCENES: [React.FC<SceneProps>, number][] = [
  [City, 0],
  [Lookout, 4.4],
  [Storm, 6.2],
  [Wires, 7.2],
  [Cage, 9.16],
  [Kites, 10.94],
  [Stars, 13.04],
  [Street, 15.84],
  [Rooftop, 19.88],
  [Lanterns, 23.06],
  [Dawn, 27.2],
];

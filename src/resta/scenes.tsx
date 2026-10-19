import React from 'react';
import {random} from 'remotion';
import {Hand, Lei, Lui, Watch} from './people';
import {Riso, S, Stars, TYPE, Tube, Txt, W, heartPath, pop, prog, sec, starPath, useStep} from './riso';

/**
 * Una scena per frase. Ogni scena riceve l'istante d'inizio (secondi del brano)
 * e usa T(t) per convertire un tempo del brano nel suo fotogramma locale.
 */
type SceneProps = {start: number};
const useT = (start: number) => (t: number) => sec(t - start);

const Ground: React.FC<{y: number}> = ({y}) => (
  <>
    <S d={`M40 ${y} L${W - 40} ${y}`} />
    {[120, 190, 860, 930].map((x) => (
      <S key={x} d={`M${x} ${y} l-8 -24 M${x} ${y} l2 -30 M${x} ${y} l10 -22`} sw={5} />
    ))}
  </>
);

/** Fascia di carta in basso: taglia il disegno sopra la zona del testo */
const Cut: React.FC<{y?: number}> = ({y = 1330}) => <S el="rect" x={-100} y={y} width={W + 200} height={900} fill="w" st={false} />;

const Burst: React.FC<{x: number; y: number; r: number; s: number; n?: number}> = ({x, y, r, s, n = 8}) =>
  s ? (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {Array.from({length: n}, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return <S key={i} d={`M${Math.cos(a) * r} ${Math.sin(a) * r} L${Math.cos(a) * r * 1.6} ${Math.sin(a) * r * 1.6}`} st="a" sw={12} />;
      })}
    </g>
  ) : null;

// ── A · "E ti darò il mio tempo, insegnami il tatto" ──
export const A: React.FC<SceneProps> = ({start}) => {
  const f = useStep(2);
  const T = useT(start);
  if (f < T(1.48)) {
    const slide = (1 - prog(f, 0, 8)) * 260;
    const lx = 400 - slide;
    const rx = 690 + slide;
    const swing = Math.sin(f / 4) * 14;
    return (
      <Riso zoom={1 + prog(f, 0, T(1.48)) * 0.05} seed="A">
        <Stars seed="a1" n={10} area={[60, 140, 1020, 420]} />
        <Tube d={`M-60 640 L${lx} 640`} w={64} fill="a" />
        <g transform={`translate(${lx} 640) rotate(-90) scale(1.9)`}>
          <Hand kind="mitt" />
        </g>
        <g transform={`translate(${lx + 70} 680) rotate(${swing})`}>
          <S d="M0 0 L0 200" sw={6} strokeDasharray="10 12" />
          <g transform="translate(0 290)">
            <Watch f={f} r={80} />
          </g>
        </g>
        <Tube d={`M${W + 60} 900 L${rx} 900`} w={64} fill="dots" />
        <g transform={`translate(${rx} 900) rotate(90) scale(-1.9 1.9)`}>
          <Hand kind="mitt" />
        </g>
      </Riso>
    );
  }
  // indici che si avvicinano e si toccano su "tatto"
  const touch = T(2.14);
  const gap = (1 - prog(f, T(1.48), touch)) * 160;
  const s = 2.2;
  const lx = W / 2 - 120 * s - gap / 2;
  const rx = W / 2 + 120 * s + gap / 2;
  return (
    <Riso zoom={1.04} seed="A2">
      <Tube d={`M-60 760 L${lx} 760`} w={70} fill="a" />
      <g transform={`translate(${lx} 760) rotate(-90) scale(${s})`}>
        <Hand kind="point" />
      </g>
      <Tube d={`M${W + 60} 760 L${rx} 760`} w={70} fill="dots" />
      <g transform={`translate(${rx} 760) rotate(90) scale(${-s} ${s})`}>
        <Hand kind="point" />
      </g>
      <Burst x={W / 2} y={736} r={40} s={pop(f, touch, 4)} />
      <S d={heartPath(50)} transform={`translate(${W / 2} 560) scale(${pop(f, touch + 2, 5)})`} fill="a" />
    </Riso>
  );
};

// ── B · "Starò più attento, ti darò il mio impegno" — promessa col mignolo ──
export const B: React.FC<SceneProps> = ({start}) => {
  const f = useStep(2);
  const T = useT(start);
  const rise = (1 - prog(f, 0, 8)) * 500;
  const shake = f >= T(3.24) ? (Math.floor(f / 6) % 2) * 22 : 0;
  const y = rise + shake;
  const Fist: React.FC<{x: number; mirror?: boolean}> = ({x, mirror}) => (
    <g transform={`translate(${x} ${980 + y}) scale(${mirror ? -1 : 1} 1)`}>
      <S el="ellipse" cx={0} cy={0} rx={110} ry={96} fill="p" />
      <S d="M-60 -30 C-40 -50 -10 -50 10 -30 M-70 10 C-50 -6 -20 -6 0 10" sw={7} />
    </g>
  );
  return (
    <Riso zoom={1 + prog(f, 0, 44) * 0.06} origin={[540, 860]} seed="B">
      <S d={heartPath(300)} transform={`translate(540 760) scale(${pop(f, T(3.9), 6)})`} fill="dots" st={false} />
      <Stars seed="b1" n={9} from={T(3.9)} area={[80, 160, 1000, 560]} />
      <Tube d={`M150 1500 L400 ${1000 + y}`} w={110} fill="a" />
      <Tube d={`M930 1500 L680 ${1000 + y}`} w={110} fill="dots" />
      <Fist x={410} />
      <Fist x={670} mirror />
      {/* mignoli agganciati */}
      <g transform={`translate(0 ${y})`}>
        <Tube d="M470 920 C480 800 590 760 600 840" w={40} />
        <Tube d="M610 920 C600 800 490 760 480 840" w={40} />
        <Tube d="M482 850 C490 800 520 790 540 788" w={40} />
      </g>
      {[0, 1, 2].map((i) => (
        <S key={i} d={heartPath(26)} transform={`translate(${380 + i * 160} ${640 - (i % 2) * 60 + y}) scale(${pop(f, T(3.46) + i * 3, 4)})`} fill="a" st={false} />
      ))}
      <Cut />
    </Riso>
  );
};

// ── C · "Non ho mai visto l'amore che avevo" — occhi coperti, il cuore alle spalle ──
export const C: React.FC<SceneProps> = ({start}) => {
  const f = useStep(2);
  const T = useT(start);
  const peek = f >= T(5.84);
  const beat = Math.floor(f / 6) % 2 ? 1.08 : 1;
  return (
    <Riso zoom={1 + prog(f, 0, 44) * 0.05} origin={[540, 760]} seed="C">
      <S d={heartPath(150)} transform={`translate(820 400) scale(${pop(f, T(4.94), 6) * beat}) rotate(12)`} fill="a" />
      <Stars seed="c1" n={8} area={[60, 150, 520, 450]} />
      <g transform="translate(540 820) scale(1.55)">
        <Lui half armsFront eyes={peek ? 'wide' : 'closed'} look={peek ? 1 : 0} mouth={peek ? 'o' : 'flat'} armL={-158} armR={peek ? 130 : 158} />
      </g>
    </Riso>
  );
};

// ── D · "Avevo troppa rabbia" — sfondo corallo, fumo dalle orecchie ──
export const D: React.FC<SceneProps> = () => {
  const f = useStep(2);
  const puff = (side: number, i: number) => {
    const k = (f / 2 + i * 3) % 9;
    const x = side * (220 + k * 34);
    const y = -k * 40;
    const r = 26 + k * 6;
    return (
      <g key={`${side}${i}`} transform={`translate(${x} ${y})`}>
        <S el="circle" cx={0} cy={0} r={r} fill="p" sw={7} />
        <S el="circle" cx={r * 0.8} cy={-r * 0.3} r={r * 0.7} fill="p" sw={7} />
      </g>
    );
  };
  return (
    <Riso shake={18} seed="D">
      <S el="rect" x={-60} y={-60} width={W + 120} height={2100} fill="a" st={false} />
      <g transform="translate(540 700) scale(1.9)">
        {[0, 1, 2].map((i) => puff(-1, i))}
        {[0, 1, 2].map((i) => puff(1, i))}
        <S d="M-120 -240 l40 -40 l30 40 l40 -40 l30 40 l40 -40 l30 40 l40 -40" sw={9} transform={`translate(0 ${(f % 4) * 3})`} />
        <Lui half face="dots" eyes="angry" mouth="grr" armL={30} armR={-30} handL="fist" handR="fist" />
      </g>
    </Riso>
  );
};

// ── E · "Adesso, se lo voglio, lo posso cantare" ──
export const E: React.FC<SceneProps> = ({start}) => {
  const f = useStep(2);
  const T = useT(start);
  const words = [7.2, 7.36, 7.62, 7.84, 8.02, 8.28, 8.48];
  const mouthOpen = Math.floor(f / 4) % 2 === 0;
  return (
    <Riso zoom={1 + prog(f, 0, 48) * 0.05} origin={[540, 760]} seed="E">
      {/* raggi a retino che ruotano a scatti */}
      <g transform={`translate(540 760) rotate(${Math.floor(f / 4) * 4})`}>
        {Array.from({length: 10}, (_, i) => (
          <S key={i} d="M0 0 L-90 -700 L90 -700 Z" transform={`rotate(${i * 36})`} fill="dots" st={false} />
        ))}
      </g>
      <g transform="translate(540 820) scale(1.5)">
        <Lui half armsFront eyes="closed" mouth={mouthOpen ? 'sing' : 'o'} armL={-52} armR={-150} />
      </g>
      {words.map((t, i) => {
        const t0 = T(t);
        if (f < t0) return null;
        const k = f - t0;
        const side = i % 2 ? 1 : -1;
        const x = 540 + side * (80 + k * 9) + Math.sin(k / 3 + i) * 30;
        const y = 900 - k * 22;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${side * 12}) scale(${pop(f, t0, 4)})`}>
            <S el="ellipse" cx={0} cy={0} rx={30} ry={22} fill="a" transform="rotate(-20)" />
            <S d="M26 -6 L26 -110 Q60 -90 56 -60" sw={8} />
          </g>
        );
      })}
      <Cut />
    </Riso>
  );
};

// ── F · "Non son più schiavo, non lo son mai stato" — la catena si spezza ──
export const F: React.FC<SceneProps> = ({start}) => {
  const f = useStep(2);
  const T = useT(start);
  const br = T(9.68);
  const free = prog(f, br, br + 10);
  const lx = 420 - free * 150;
  const rx = 660 + free * 150;
  const y = 1000 - free * 300;
  const links = 7;
  return (
    <Riso zoom={1 + prog(f, 0, 42) * 0.05} seed="F">
      <Stars seed="f1" n={12} from={T(10.46)} area={[60, 140, 1020, 520]} />
      <Tube d={`M300 1500 L${lx} ${y + 60}`} w={100} fill="a" />
      <Tube d={`M780 1500 L${rx} ${y + 60}`} w={100} fill="dots" />
      {[lx, rx].map((x, i) => (
        <g key={i}>
          <S el="rect" x={x - 70} y={y + 30} width={140} height={44} rx={10} fill="p" />
          <S el="ellipse" cx={x} cy={y - 40} rx={84} ry={90} fill="p" />
          <S d={`M${x - 50} ${y - 70} C${x - 30} ${y - 90} ${x} ${y - 90} ${x + 20} ${y - 70} M${x - 56} ${y - 30} C${x - 36} ${y - 46} ${x - 6} ${y - 46} ${x + 14} ${y - 30}`} sw={7} />
        </g>
      ))}
      {Array.from({length: links}, (_, i) => {
        const t = (i + 0.5) / links;
        const mid = Math.abs(i - (links - 1) / 2) < 0.6;
        if (mid && f >= br) return null;
        const left = i < links / 2;
        // prima appesa tra i polsi, dopo la rottura ogni metà vola via con il suo polso e cade
        const baseX = 420 + 70 + t * (660 - 420 - 140);
        const sag = Math.sin(t * Math.PI) * 60;
        const fall = free * (left ? -1 : 1);
        const x = baseX + fall * (150 + (left ? (links / 2 - i) : (i - links / 2)) * 30);
        const yy = 1050 + sag + (f >= br ? (f - br) * (f - br) * 0.8 : 0) * (0.3 + Math.abs(t - 0.5));
        return <S key={i} el="ellipse" cx={x} cy={yy} rx={26} ry={16} transform={`rotate(${i % 2 ? 60 : 0} ${x} ${yy})`} fill="none" sw={10} />;
      })}
      <Burst x={W / 2} y={1050} r={60} s={pop(f, br, 4) * (f < br + 8 ? 1 : 0)} n={10} />
      <Burst x={lx} y={y - 40} r={120} s={pop(f, T(10.46), 4)} />
      <Burst x={rx} y={y - 40} r={120} s={pop(f, T(10.46), 4)} />
      <Cut />
    </Riso>
  );
};

// ── G · "Ma prima cercavo perlopiù di lottare" — guantone e sacco ──
export const G: React.FC<SceneProps> = ({start}) => {
  const f = useStep(2);
  const T = useT(start);
  const hits = [11.15, 11.65, 12.16, 12.62].map(T);
  let ext = 0;
  let ang = 0;
  let hitNow = false;
  for (const h of hits) {
    const k = f - h;
    if (k >= 0 && k < 2) ext = Math.max(ext, 1);
    else if (k >= 2 && k < 8) ext = Math.max(ext, 1 - (k - 2) / 6);
    if (k >= 0) ang += 16 * Math.exp(-k / 9) * Math.sin(k / 3.2 + 0.2);
    if (k >= 0 && k < 4) hitNow = true;
  }
  const gx = 180 + ext * 170;
  return (
    <Riso zoom={1.02} seed="G" shake={hitNow ? 10 : 0}>
      <g transform={`rotate(${ang} 600 80)`}>
        <S d="M600 80 L600 380" sw={8} strokeDasharray="14 10" />
        <S el="rect" x={480} y={380} width={240} height={560} rx={70} fill="a" />
        <S d="M480 520 L720 520 M480 800 L720 800" sw={7} />
        <S el="rect" x={540} y={420} width={40} height={340} rx={20} fill="p" st={false} />
      </g>
      <Tube d={`M-80 760 L${gx - 60} 760`} w={80} fill="dots" />
      <g transform={`translate(${gx} 760)`}>
        <S d="M-70 -90 C40 -130 140 -80 140 0 C140 80 40 120 -70 90 Z" fill="b" />
        <S d="M0 -70 C50 -80 90 -56 100 -28" sw={10} />
        <S el="rect" x={-110} y={-80} width={60} height={160} rx={14} fill="p" />
      </g>
      {hitNow && <S d={starPath(90)} transform={`translate(${gx + 170} 740) rotate(${f * 7})`} fill="a" st={false} />}
    </Riso>
  );
};

// ── H · "Perlopiù cercavo un difetto per collegarci" — lente, crepa, cerotto ──
export const H: React.FC<SceneProps> = ({start}) => {
  const f = useStep(2);
  const T = useT(start);
  const path: [number, number][] = [
    [280, 480],
    [780, 600],
    [380, 920],
    [600, 820],
  ];
  const tFound = T(14.52);
  const tFix = T(15.04);
  const p = prog(f, 4, tFound) * (path.length - 1);
  const seg = Math.min(path.length - 2, Math.floor(p));
  const u = p - seg;
  let mx = path[seg][0] + (path[seg + 1][0] - path[seg][0]) * u;
  let my = path[seg][1] + (path[seg + 1][1] - path[seg][1]) * u;
  const away = prog(f, tFix + 4, tFix + 14);
  mx += away * 520;
  my += away * 600;
  const crack = prog(f, tFound, tFound + 6);
  const CR = 'M560 640 L610 720 L570 790 L630 860 L590 930';
  return (
    <Riso zoom={1 + prog(f, 0, 66) * 0.05} origin={[540, 760]} seed="H">
      <S d={heartPath(300)} transform={`translate(540 800) scale(${f >= tFix ? pop(f, tFix, 6) : 1})`} fill="dots" />
      {crack > 0 && <S d={CR} sw={12} strokeDasharray={420} strokeDashoffset={420 * (1 - crack)} />}
      {f >= tFix && (
        <g transform={`translate(595 790) rotate(-28) scale(${pop(f, tFix, 4)})`}>
          <S el="rect" x={-150} y={-46} width={300} height={92} rx={46} fill="p" />
          <S el="rect" x={-50} y={-34} width={100} height={68} rx={10} fill="dots" />
          <S d="M-110 -12 L-108 -10 M-110 12 L-108 14 M110 -12 L112 -10 M110 12 L112 14" sw={8} />
        </g>
      )}
      {/* lente d'ingrandimento */}
      <g transform={`translate(${mx} ${my})`}>
        <Tube d="M80 80 L210 210" w={34} fill="b" />
        <S el="circle" r={120} fill="none" sw={22} />
        <S d="M-70 -40 A80 80 0 0 1 -30 -78" sw={10} />
      </g>
      {f >= tFound && f < tFix + 4 && (
        <g transform={`translate(${mx + 40} ${my - 220}) scale(${pop(f, tFound, 4)})`}>
          <S d="M0 -70 L0 10" sw={22} />
          <S el="circle" cx={0} cy={50} r={13} fill="b" st={false} />
        </g>
      )}
    </Riso>
  );
};

// ── I · "Che dalle mie parti non credono agli angeli / E non credono agli altri" ──
type Win = {x: number; y: number; at: number; who: boolean};
const buildWindows = (T: (t: number) => number): Win[] => {
  const cols: [number[], number[]][] = [
    [[150, 290], [520, 670, 820, 970]],
    [[465, 600], [400, 550, 700, 850, 1000]],
    [[765, 900], [620, 770, 920]],
  ];
  const all: {x: number; y: number}[] = [];
  for (const [xs, ys] of cols) for (const x of xs) for (const y of ys) all.push({x, y});
  // ordine di chiusura casuale ma fisso, tra "non credono" e la fine della frase dopo
  const order = all.map((w, i) => ({...w, r: random(`win${i}`)})).sort((a, b) => a.r - b.r);
  const t0 = T(16.66);
  const t1 = T(19.6);
  return order.map((w, i) => ({x: w.x, y: w.y, at: Math.round(t0 + (i / (order.length - 1)) * (t1 - t0)), who: i % 3 === 1}));
};

export const I: React.FC<SceneProps> = ({start}) => {
  const f = useStep(2);
  const T = useT(start);
  const wins = React.useMemo(() => buildWindows(T), [start]);
  const walk = prog(f, 0, T(19.88));
  const lx = 140 + walk * 800;
  const bob = Math.floor(f / 4) % 2;
  return (
    <Riso zoom={1 + prog(f, 0, 96) * 0.04} origin={[540, 900]} seed="I">
      <S d="M140 260 C60 300 60 420 150 450 C110 400 110 300 140 260 Z" fill="a" st={false} />
      <Stars seed="i1" n={8} area={[220, 120, 1000, 280]} />
      {/* palazzi */}
      <S d="M80 420 L400 420 L400 1250 L80 1250 Z" fill="p" />
      <S el="rect" x={280} y={350} width={70} height={70} fill="dots" />
      <S d="M400 300 L550 210 L700 300 L700 1250 L400 1250 Z" fill="p" />
      <S d="M700 520 L1000 520 L1000 1250 L700 1250 Z" fill="dots" />
      <S el="rect" x={900} y={440} width={44} height={80} fill="p" />
      {wins.map((w, i) => {
        const k = f - w.at;
        const close = k < 0 ? 0 : k < 2 ? 0.5 : 1;
        const sw = 35;
        const show = w.who && f >= T(18.2) && close < 1;
        return (
          <g key={i}>
            <S el="rect" x={w.x} y={w.y} width={70} height={90} fill="p" sw={7} />
            {show && (
              <>
                <S el="circle" cx={w.x + 35} cy={w.y + 40} r={18} fill="b" st={false} />
                <S d={`M${w.x + 8} ${w.y + 90} Q${w.x + 35} ${w.y + 50} ${w.x + 62} ${w.y + 90} Z`} fill="b" st={false} />
              </>
            )}
            {/* persiane: aperte ai lati, poi si chiudono */}
            <S el="rect" x={w.x - sw + close * sw} y={w.y} width={sw} height={90} fill="a" sw={5} />
            <S el="rect" x={w.x + 70 - close * sw} y={w.y} width={sw} height={90} fill="a" sw={5} />
          </g>
        );
      })}
      <S d="M40 1250 L1040 1250" />
      {/* l'angelo che passa */}
      <g transform={`translate(${lx} ${962 - bob * 6}) scale(0.42)`}>
        <S el="ellipse" cx={-120} cy={160} rx={90} ry={50} fill="p" transform="rotate(-30 -120 160)" />
        <S el="ellipse" cx={120} cy={160} rx={90} ry={50} fill="p" transform="rotate(30 120 160)" />
        <Lei halo legPhase={bob} mouth={f >= T(18.2) ? 'sad' : 'smile'} look={f >= T(16.66) ? 1 : 0} />
      </g>
    </Riso>
  );
};

// ── J · "Resta con me, solo dell'amore non so sdebitarmi" — panchina e scontrino ──
export const J: React.FC<SceneProps> = ({start}) => {
  const f = useStep(2);
  const T = useT(start);
  const lean = f >= T(20.34) ? -9 : 0;
  const hearts = [20.62, 20.9, 21.16, 21.5].map(T);
  const rec = prog(f, T(21.82), T(22.9));
  const recH = 80 + rec * 860;
  return (
    <Riso zoom={1 + prog(f, 0, 76) * 0.04} origin={[620, 900]} seed="J">
      {/* lampione */}
      <S d="M960 380 L700 1240 L1040 1240 L1040 380 Z" fill="dots" st={false} opacity={0.9} />
      <Tube d="M960 1250 L960 360" w={22} fill="b" />
      <S d="M900 360 L1020 360 L990 300 L930 300 Z" fill="b" />
      {/* schienale */}
      <S el="rect" x={300} y={900} width={680} height={36} rx={8} fill="p" />
      <S el="rect" x={300} y={960} width={680} height={36} rx={8} fill="p" />
      <g transform="translate(520 800) scale(0.85)">
        <Lui half eyes="happy" armL={8} armR={-8} />
      </g>
      <g transform={`rotate(${lean} 780 1080)`}>
        <g transform="translate(780 808) scale(0.85)">
          <Lei half eyes={f >= T(20.34) ? 'closed' : 'open'} armL={8} armR={-8} />
        </g>
      </g>
      {/* seduta e gambe */}
      <S d="M450 1090 L450 1220 M590 1090 L590 1220" sw={44} />
      <S d="M740 1090 L740 1220 M820 1090 L820 1220" sw={12} />
      <S el="rect" x={280} y={1060} width={720} height={44} rx={8} fill="b" />
      <S d="M320 1104 L320 1250 M960 1104 L960 1250" sw={14} />
      <Ground y={1250} />
      {hearts.map((t, i) => {
        if (f < t) return null;
        const k = f - t;
        return <S key={i} d={heartPath(28)} transform={`translate(${650 + Math.sin(k / 3 + i) * 30} ${760 - k * 14}) scale(${pop(f, t, 4)})`} fill="a" st={false} />;
      })}
      {/* lo scontrino dell'amore, infinito */}
      {rec > 0 && (
        <g>
          <S
            d={`M70 -20 L330 -20 L330 ${recH} ${Array.from({length: 9}, (_, i) => `L${330 - (i + 0.5) * 28.9} ${recH + (i % 2 ? 0 : 18)}`).join(' ')} L70 ${recH} Z`}
            fill="p"
            sw={6}
          />
          {['GRAZIE', 'tempo .... ♥', 'tatto .... ♥', 'impegno .. ♥', 'amore .... ♥', '- - - - - -', 'TOTALE  ∞'].map((row, i) => {
            const ry = 60 + i * 120;
            if (ry > recH - 30) return null;
            return <Txt key={i} x={200} y={ry} text={row} size={i === 0 || i === 6 ? 40 : 30} font={TYPE} ink={i === 6 ? 'a' : 'b'} />;
          })}
        </g>
      )}
    </Riso>
  );
};

// ── K · "Resta e ti darò, ti darò, ti darò, ti darò" — la torre di regali ──
export const K: React.FC<SceneProps> = ({start}) => {
  const f = useStep(2);
  const T = useT(start);
  const gifts = [24.02, 24.56, 25.04, 25.5].map(T);
  const n = gifts.filter((g) => f >= g).length;
  const wob = f >= T(25.74) ? Math.sin(f / 3) * (3 + prog(f, T(25.74), T(27.2)) * 6) : n ? Math.sin(f / 4) * 2 : 0;
  const scared = f >= T(26.2);
  const items = [
    // regalo
    <g key="g">
      <S el="rect" x={-90} y={-130} width={180} height={130} fill="a" />
      <S d="M0 -130 L0 0 M-90 -70 L90 -70" sw={14} />
      <S d="M0 -130 C-50 -190 -80 -140 0 -130 C80 -140 50 -190 0 -130" fill="p" sw={7} />
    </g>,
    // fiore
    <g key="f">
      <S d="M0 0 L0 -110" sw={10} />
      <S d="M0 -50 C30 -80 70 -70 70 -50 C40 -40 20 -40 0 -50 Z" fill="b" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <S key={i} el="ellipse" cx={0} cy={-150} rx={20} ry={36} transform={`rotate(${i * 60} 0 -120)`} fill="p" sw={7} />
      ))}
      <S el="circle" cx={0} cy={-120} r={20} fill="a" />
    </g>,
    // orologio (ritorna dalla prima scena)
    <g key="w" transform="translate(0 -80) scale(0.85)">
      <Watch f={f} r={70} />
    </g>,
    // cuore
    <S key="h" d={heartPath(80)} transform="translate(0 -84)" fill="a" />,
  ];
  const heights = [140, 160, 170, 150];
  let base = 0;
  return (
    <Riso zoom={1 + prog(f, 0, 100) * 0.05} origin={[540, 900]} seed="K">
      <Stars seed="k1" n={10} area={[60, 120, 1020, 360]} from={T(25.5)} />
      <Ground y={1300} />
      <g transform="translate(470 620) scale(0.94)">
        <Lui eyes={scared ? 'wide' : 'happy'} mouth={scared ? 'o' : 'smile'} armL={-80} armR={-120} look={scared ? 1 : 0} />
      </g>
      <g transform={`translate(620 790) rotate(${wob})`}>
        {items.slice(0, n).map((it, i) => {
          const y = base;
          base -= heights[i];
          return (
            <g key={i} transform={`translate(${(i % 2 ? 1 : -1) * 10} ${y}) scale(${pop(f, gifts[i], 4)})`}>
              {it}
            </g>
          );
        })}
      </g>
      {scared && (
        <g transform="translate(470 620) scale(0.94)">
          <S d="M120 -60 C140 -30 130 0 120 0 C110 0 100 -30 120 -60 Z" fill="p" sw={6} transform={`translate(0 ${(f % 8) * 4})`} />
        </g>
      )}
    </Riso>
  );
};

// ── L · "Solo per sentirmi dire che bastavo io da anni" ──
export const L: React.FC<SceneProps> = ({start}) => {
  const f = useStep(2);
  const T = useT(start);
  const bub = pop(f, T(28.46), 5);
  const big = f >= T(29.06) ? (Math.floor(f / 6) % 2 ? 1.6 : 1.45) : 1;
  return (
    <Riso zoom={1.08 - prog(f, 0, T(31.4)) * 0.08} origin={[540, 800]} seed="L">
      <S el="circle" cx={540} cy={560} r={300} fill="dots" />
      <Stars seed="l1" n={16} area={[60, 120, 1020, 1100]} />
      <Ground y={1290} />
      <g transform="translate(410 700) scale(0.86)">
        <Lui eyes="happy" armL={8} armR={-62} />
      </g>
      <g transform="translate(670 712) scale(0.86)">
        <Lei eyes="happy" armL={62} armR={-10} />
      </g>
      {bub > 0 && (
        <g transform={`translate(850 330) scale(${bub})`}>
          <S d="M-150 0 C-150 -110 150 -110 150 0 C150 90 40 110 -20 100 L-90 170 L-70 92 C-120 76 -150 50 -150 0 Z" fill="p" />
          <S d={heartPath(40)} transform={`translate(0 -4) scale(${big})`} fill="a" st={false} />
        </g>
      )}
    </Riso>
  );
};

export const SCENES: [React.FC<SceneProps>, number][] = [
  [A, 0],
  [B, 2.6],
  [C, 4.4],
  [D, 6.2],
  [E, 7.2],
  [F, 9.16],
  [G, 10.94],
  [H, 13.04],
  [I, 15.84],
  [J, 19.88],
  [K, 23.06],
  [L, 27.2],
];

import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import data from './oskarsson.json';
import {Backdrop, Caption, ClipSlot, EndCard, FPS, H, Hud, MinuteBar, Mystery, NumberTile, StatCard, Steps, W, cap, easeIn, easeOut, hit, makeTiming, prog, useFontReady, type VW} from './kit';

/**
 * Óskarsson (Bulgaria-Islanda) rifatto nello stile MOTB: solo grafica, senza voce.
 * Tempi delle parole stimati da scripts/oskarsson_motb_voce.txt (scripts/motb_align.py);
 * con la voce vera basta rigenerare oskarsson.json passando l'mp3.
 * Le parti "CLIP" sono segnaposto per i filmati veri.
 */

export {FPS};
export const OSK_MOTB_FRAMES = Math.ceil(data.duration * FPS);
const {cue, at} = makeTiming(data.words as VW[]);
const END = data.duration;

// ── scene: clip e grafiche si alternano ──
const S = {
  gancio: cue('gancio').start,
  numeri: cue('ctx').start - 0.1,
  nome: at('ctx', 'il') - 0.1,
  uno: cue('uno').start - 0.1,
  liga: cue('due').start - 0.1,
  gol: at('due', 'ha') - 0.1,
  andata: cue('tre').start - 0.1,
  dom: cue('dom').start - 0.1,
  cta: cue('cta').start - 0.1,
};
const CUTS = [S.numeri, S.nome, S.uno, S.liga, S.gol, S.andata, S.dom, S.cta];

/** un pezzo di montaggio: entra e esce con una dissolvenza sfocata velocissima */
const Seg: React.FC<{g: number; a: number; b: number; children: React.ReactNode}> = ({g, a, b, children}) => {
  if (g < a - 0.1 || g > b + 0.1) return null;
  const i = easeOut(prog(g, a - 0.1, a + 0.1));
  const o = easeIn(prog(g, b - 0.1, b + 0.1));
  const blur = (1 - i) * 18 + o * 18;
  return <AbsoluteFill style={{opacity: Math.min(i, 1 - o), filter: blur > 0.3 ? `blur(${blur}px)` : undefined}}>{children}</AbsoluteFill>;
};

const CLIP_Y = 940; // scritte sopra le clip: a metà schermo
const GFX_Y = 560; // scritte nelle grafiche: in alto

export const OskarssonMotb: React.FC = () => {
  useFontReady();
  const frame = useCurrentFrame();
  const g = frame / FPS;
  const flash = Math.max(...CUTS.map((c) => hit(g, c, 14) * 0.22));
  const step = g >= S.andata ? 3 : g >= S.liga ? 2 : g >= S.uno ? 1 : 0;
  const t3 = at('ctx', 'tre');
  const tSt = at('ctx', 'stasera');
  return (
    <AbsoluteFill style={{background: '#0B0F33', overflow: 'hidden'}}>
      <Backdrop g={g} />

      {/* 1 · gancio, sopra una clip */}
      <Seg g={g} a={0} b={S.numeri}>
        <ClipSlot g={g} a={0} seed="gancio" label="CLIP · ÓSKARSSON ESULTA" />
        <Caption
          g={g}
          y={CLIP_Y - 220}
          out={at('gancio', 'e', 1) - 0.05}
          rows={[
            cap('white', [['3', at('gancio', 'tre')], ['GOL', at('gancio', 'gol')], ['E', at('gancio', 'e')], ['2', at('gancio', 'due')], ['ASSIST', at('gancio', 'assist')]]),
            cap('navy', [['IN', at('gancio', 'in')], ['4', at('gancio', 'quattro')], ['PARTITE', at('gancio', 'partite')]]),
          ]}
        />
        <Caption
          g={g}
          y={CLIP_Y - 220}
          out={S.numeri}
          rows={[cap('white', [['E', at('gancio', 'e', 1)], ['NESSUNO', at('gancio', 'nessuno')]]), cap('navy', [['NE', at('gancio', 'ne')], ['PARLA', at('gancio', 'parla')]])]}
        />
        <NumberTile g={g} a={at('gancio', 'partite')} out={S.numeri} n="5" x={W / 2 - 95} y={CLIP_Y + 20} />
        <Mystery g={g} a={at('gancio', 'partite') + 0.15} out={S.numeri} x={W / 2 + 95} y={CLIP_Y + 25} s={140} />
      </Seg>

      {/* 2 · "tre numeri stasera per Bulgaria-Islanda" */}
      <Seg g={g} a={S.numeri} b={S.nome}>
        <Caption g={g} y={GFX_Y} out={at('ctx', 'per') - 0.05} rows={[cap('white', [['3', t3], ['NUMERI', at('ctx', 'numeri')]]), cap('navy', [['STASERA', tSt]])]} />
        <Caption g={g} y={GFX_Y} out={S.nome} rows={[cap('white', [['BULGARIA', at('ctx', 'bulgaria')], ['–', at('ctx', 'bulgaria') + 0.1], ['ISLANDA', at('ctx', 'bulgaria') + 0.25]])]} />
        <Steps g={g} big={easeOut(prog(g, t3 - 0.1, t3 + 0.2))} lit={[0, 1, 2].map((i) => prog(g, tSt + i * 0.13, tSt + i * 0.13 + 0.2))} active={0} x={(W - 3 * 190 - 2 * 27) / 2} y={980} size={190} />
      </Seg>

      {/* 3 · "il nome è Orri Óskarsson", sopra una clip */}
      <Seg g={g} a={S.nome} b={S.uno}>
        <ClipSlot g={g} a={S.nome} seed="nome" label="CLIP · PRIMO PIANO ÓSKARSSON" />
        <Caption
          g={g}
          y={CLIP_Y}
          out={S.uno}
          rows={[cap('white', [['IL', at('ctx', 'il')], ['NOME', at('ctx', 'nome')], ['È', at('ctx', 'e')]]), cap('navy', [['ORRI', at('ctx', 'orri')], ['ÓSKARSSON', at('ctx', 'oskarsson')]], 76)]}
        />
      </Seg>

      {/* 4 · uno: sempre titolare */}
      <Seg g={g} a={S.uno} b={S.liga}>
        <Caption g={g} y={GFX_Y} out={S.liga} rows={[cap('white', [['IN', at('uno', 'in')], ['NAZIONALE', at('uno', 'nazionale')]]), cap('navy', [['SEMPRE', at('uno', 'sempre')], ['TITOLARE', at('uno', 'titolare')]])]} />
        <StatCard g={g} a={at('uno', 'quattro')} out={S.liga} n={4} total={4} icon="check" suffix=" SU 4" layout="top" caption="PARTITE DI NATIONS LEAGUE DA TITOLARE" y={900} />
      </Seg>

      {/* 5 · due: in Liga con la Real Sociedad, sopra una clip */}
      <Seg g={g} a={S.liga} b={S.gol}>
        <ClipSlot g={g} a={S.liga} seed="liga" label="CLIP · ÓSKARSSON CON LA REAL SOCIEDAD" />
        <Caption
          g={g}
          y={CLIP_Y}
          out={S.gol}
          rows={[
            cap('white', [['IN', at('due', 'in')], ['LIGA', at('due', 'liga')]]),
            cap('navy', [['CON', at('due', 'con')], ['LA', at('due', 'la')], ['REAL', at('due', 'real')], ['SOCIEDAD', at('due', 'sociedad')]]),
          ]}
        />
      </Seg>

      {/* 6 · due: già 3 gol */}
      <Seg g={g} a={S.gol} b={S.andata}>
        <Caption g={g} y={GFX_Y} out={S.andata} rows={[cap('white', [['HA', at('due', 'ha')], ['GIÀ', at('due', 'gia')], ['SEGNATO', at('due', 'segnato')]]), cap('navy', [['3', at('due', 'tre')], ['GOL', at('due', 'gol')]])]} />
        <StatCard g={g} a={at('due', 'tre')} out={S.andata} n={3} total={9} icon="ball" caption="GOL IN 9 PRESENZE DI LIGA" y={900} />
      </Seg>

      {/* 7 · tre: l'andata, doppietta */}
      <Seg g={g} a={S.andata} b={S.dom}>
        <Caption g={g} y={GFX_Y} out={at('tre', 'doppietta') - 0.05} rows={[cap('white', [["ALL'ANDATA", at('tre', "all'andata")]]), cap('navy', [['CONTRO', at('tre', 'contro')], ['LA', at('tre', 'la')], ['BULGARIA', at('tre', 'bulgaria')]])]} />
        <Caption g={g} y={GFX_Y} out={S.dom} rows={[cap('white', [['DOPPIETTA', at('tre', 'doppietta')]]), cap('navy', [['FINÌ', at('tre', 'fini')], ['3-0', at('tre', 'tre', 1)]])]} />
        <MinuteBar g={g} a={at('tre', 'doppietta')} out={S.dom} title="2 GOL" goals={[37, 60]} caption="ISLANDA 3-0 BULGARIA · 3 OTTOBRE" y={900} />
      </Seg>

      {/* 8 · domanda, schermo diviso */}
      <Seg g={g} a={S.dom} b={S.cta}>
        <ClipSlot g={g} a={S.dom} seed="split1" label="CLIP · ISLANDA" style={{bottom: H / 2}} />
        <ClipSlot g={g} a={S.dom} seed="split2" label="CLIP · BULGARIA" style={{top: H / 2}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: H / 2 - 3, height: 6, background: '#0B0F33'}} />
        <Caption g={g} y={H / 2 - 88} out={at('dom', 'magari') - 0.05} rows={[cap('white', [['STASERA', at('dom', 'stasera')], ['COLPISCE', at('dom', 'colpisce')]]), cap('navy', [['ANCORA?', at('dom', 'ancora')]])]} />
        <Caption g={g} y={H / 2 - 88} out={S.cta} rows={[cap('white', [['MAGARI', at('dom', 'magari')], ['GIÀ', at('dom', 'gia')]]), cap('navy', [['NEL', at('dom', 'nel')], ['1°', at('dom', 'primo')], ['TEMPO?', at('dom', 'tempo')]])]} />
      </Seg>

      {/* 9 · commenta ANALISI */}
      <Seg g={g} a={S.cta} b={END + 1}>
        <EndCard g={g} a={S.cta} home="bg" away="is" tWord={at('cta', 'commenta')} tKey={at('cta', 'analisi')} />
      </Seg>

      {/* barra in alto e contatore 1-2-3 (non nella schermata finale) */}
      <Hud g={g} show={1 - prog(g, S.cta - 0.1, S.cta + 0.1)} left="NATIONS LEAGUE · 5ª" home="bg" away="is" match="BULGARIA – ISLANDA" />
      {step > 0 && g < S.dom && <Steps g={g} big={easeOut(prog(g, S.uno, S.uno + 0.25))} lit={[0, 0, 0]} active={step} x={60} y={320} size={70} pulse={hit(g, [S.uno, S.liga, S.andata][step - 1] + 0.1, 5)} />}

      <AbsoluteFill style={{background: '#fff', opacity: flash, mixBlendMode: 'screen'}} />
    </AbsoluteFill>
  );
};

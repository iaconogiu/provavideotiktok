import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import data from './haaland.json';
import {HAALAND_CLIPS as CL} from './haaland_clips';
import {Backdrop, Badge, Caption, ClipSlot, EndCard, FPS, H, Hud, StatCard, Steps, Table, W, cap, easeIn, easeOut, hit, makeTiming, prog, useFontReady, type VW} from './kit';

/**
 * Norvegia-Galles (Nations League, 14/11, ore 18:00): tre numeri su Haaland. Stile MOTB.
 * Testo: scripts/haaland_voce.txt → tempi in haaland.json (scripts/motb_align.py, con l'mp3 usa Whisper).
 * Voce: public/motb/haaland/voce.mp3. Clip: haaland_clips.ts.
 */

export {FPS};
// con la voce vera resta un secondo in più sulla schermata finale
const TAIL = data.audio ? 1.0 : 0;
export const HAALAND_FRAMES = Math.ceil((data.duration + TAIL) * FPS);
const {cue, at} = makeTiming(data.words as VW[]);
const END = data.duration + TAIL;

const S = {
  stadio: cue('gancio').start,
  classifica: at('gancio', 'per') - 0.1,
  numeri: cue('ctx').start - 0.1,
  uno: cue('uno').start - 0.1,
  gol22: at('uno', 'ventidue') - 0.1,
  casa: cue('due').start - 0.1,
  gol3: at('due', 'ha') - 0.1,
  galles: cue('tre').start - 0.1,
  dom: cue('dom').start - 0.1,
  cta: cue('cta').start - 0.1,
};
const CUTS = [S.classifica, S.numeri, S.uno, S.gol22, S.casa, S.gol3, S.galles, S.dom, S.cta];

const Seg: React.FC<{g: number; a: number; b: number; children: React.ReactNode}> = ({g, a, b, children}) => {
  if (g < a - 0.1 || g > b + 0.1) return null;
  const i = easeOut(prog(g, a - 0.1, a + 0.1));
  const o = easeIn(prog(g, b - 0.1, b + 0.1));
  const blur = (1 - i) * 18 + o * 18;
  return <AbsoluteFill style={{opacity: Math.min(i, 1 - o), filter: blur > 0.3 ? `blur(${blur}px)` : undefined}}>{children}</AbsoluteFill>;
};

const CLIP_Y = 940;
const GFX_Y = 560;

export const Haaland: React.FC = () => {
  useFontReady();
  const frame = useCurrentFrame();
  const g = frame / FPS;
  const flash = Math.max(...CUTS.map((c) => hit(g, c, 14) * 0.22));
  const step = g >= S.galles ? 3 : g >= S.casa ? 2 : g >= S.uno ? 1 : 0;
  const tNum = at('ctx', 'tre');
  const tH = at('ctx', 'haaland');
  return (
    <AbsoluteFill style={{background: '#0B0F33', overflow: 'hidden'}}>
      <Backdrop g={g} />

      {/* 1 · gancio: la Norvegia deve vincere (clip) */}
      <Seg g={g} a={S.stadio} b={S.classifica}>
        <ClipSlot g={g} a={S.stadio} seed="h-gancio" label="CLIP · NORVEGIA / HAALAND" clip={CL.gancio} flag="no" />
        <Caption
          g={g}
          y={CLIP_Y}
          out={S.classifica}
          rows={[
            cap('white', [['LA', at('gancio', 'la')], ['NORVEGIA', at('gancio', 'norvegia')], ['DEVE', at('gancio', 'deve')], ['VINCERE', at('gancio', 'vincere')]]),
            cap('navy', [['A', at('gancio', 'a')], ['TUTTI', at('gancio', 'tutti')], ['I', at('gancio', 'i')], ['COSTI', at('gancio', 'costi')]]),
          ]}
        />
      </Seg>

      {/* 1b · …per arrivare viva allo scontro con la Danimarca (classifica) */}
      <Seg g={g} a={S.classifica} b={S.numeri}>
        <Caption
          g={g}
          y={GFX_Y - 40}
          out={S.numeri}
          rows={[cap('white', [['ALLO', at('gancio', 'allo')], ['SCONTRO', at('gancio', 'scontro')]]), cap('navy', [['CON', at('gancio', 'con')], ['LA', at('gancio', 'la', 1)], ['DANIMARCA', at('gancio', 'danimarca')]])]}
        />
        <Table
          g={g}
          a={S.classifica + 0.05}
          out={S.numeri}
          title="GRUPPO A4 · CLASSIFICA"
          y={800}
          rows={[
            {code: 'pt', name: 'PORTOGALLO', pts: 12},
            {code: 'dk', name: 'DANIMARCA', pts: 6},
            {code: 'no', name: 'NORVEGIA', pts: 3, hi: true},
            {code: 'gb-wls', name: 'GALLES', pts: 3},
          ]}
        />
      </Seg>

      {/* 2 · tre numeri su Haaland */}
      <Seg g={g} a={S.numeri} b={S.uno}>
        <Caption g={g} y={GFX_Y} out={S.uno} rows={[cap('white', [['3', tNum], ['NUMERI', at('ctx', 'numeri')]]), cap('navy', [['SU', at('ctx', 'su')], ['HAALAND', tH]])]} />
        <Steps g={g} big={easeOut(prog(g, tNum - 0.1, tNum + 0.2))} lit={[0, 1, 2].map((i) => prog(g, tH + i * 0.13, tH + i * 0.13 + 0.2))} active={0} x={(W - 3 * 190 - 2 * 27) / 2} y={980} size={190} />
      </Seg>

      {/* 3 · uno: in Nations League ha segnato… (clip) */}
      <Seg g={g} a={S.uno} b={S.gol22}>
        <ClipSlot g={g} a={S.uno} seed="h-uno" label="CLIP · GOL DI HAALAND" clip={CL.uno} flag="no" />
        <Caption g={g} y={CLIP_Y} out={S.gol22} rows={[cap('white', [['IN', at('uno', 'in')], ['NATIONS', at('uno', 'nations')], ['LEAGUE', at('uno', 'league')]]), cap('navy', [['HA', at('uno', 'ha')], ['SEGNATO', at('uno', 'segnato')]])]} />
      </Seg>

      {/* 3b · 22 gol in 20 partite, nessuno ne ha fatti di più */}
      <Seg g={g} a={S.gol22} b={S.casa}>
        <Caption g={g} y={GFX_Y} out={at('uno', 'nessuno') - 0.05} rows={[cap('white', [['22', at('uno', 'ventidue')], ['GOL', at('uno', 'gol')]]), cap('navy', [['IN', at('uno', 'in', 1)], ['20', at('uno', 'venti')], ['PARTITE', at('uno', 'partite')]])]} />
        <Caption g={g} y={GFX_Y} out={S.casa} rows={[cap('white', [['NESSUNO', at('uno', 'nessuno')]]), cap('navy', [['NE', at('uno', 'ne', 1)], ['HA', at('uno', 'ha', 1)], ['FATTI', at('uno', 'fatti')], ['DI', at('uno', 'di')], ['PIÙ', at('uno', 'piu')]])]} />
        <StatCard g={g} a={at('uno', 'ventidue')} out={S.casa} n={22} icon="ball" caption="GOL IN 20 PARTITE DI NATIONS LEAGUE" y={880} layout="top" />
        <Badge g={g} a={at('uno', 'nessuno')} out={S.casa} text="MIGLIOR MARCATORE DI SEMPRE" y={1250} />
      </Seg>

      {/* 4 · due: quest'anno in casa (clip) */}
      <Seg g={g} a={S.casa} b={S.gol3}>
        <ClipSlot g={g} a={S.casa} seed="h-casa" label="CLIP · ULLEVAAL / TIFOSI NORVEGIA" clip={CL.casa} flag="no" />
        <Caption g={g} y={CLIP_Y} out={S.gol3} rows={[cap('white', [["QUEST'ANNO", at('due', "quest'anno")]]), cap('navy', [['IN', at('due', 'in')], ['CASA', at('due', 'casa')]])]} />
      </Seg>

      {/* 4b · 3 gol in 2 partite */}
      <Seg g={g} a={S.gol3} b={S.galles}>
        <Caption g={g} y={GFX_Y} out={S.galles} rows={[cap('white', [['HA', at('due', 'ha')], ['GIÀ', at('due', 'gia')], ['FATTO', at('due', 'fatto')]]), cap('navy', [['3', at('due', 'tre')], ['GOL', at('due', 'gol')], ['IN', at('due', 'in', 1)], ['2', at('due', 'due', 1)], ['PARTITE', at('due', 'partite')]])]} />
        <StatCard g={g} a={at('due', 'tre')} out={S.galles} n={3} icon="ball" caption="GOL NELLE 2 PARTITE IN CASA DI QUESTA NATIONS LEAGUE" y={900} />
      </Seg>

      {/* 5 · tre: il Galles segna poco */}
      <Seg g={g} a={S.galles} b={S.dom}>
        <Caption g={g} y={GFX_Y} out={S.dom} rows={[cap('white', [['IL', at('tre', 'il')], ['GALLES', at('tre', 'galles')], ['HA', at('tre', 'ha')], ['SEGNATO', at('tre', 'segnato')]]), cap('navy', [['IN', at('tre', 'in')], ['1', at('tre', 'una')], ['PARTITA', at('tre', 'partita')], ['SU', at('tre', 'su')], ['4', at('tre', 'quattro')]])]} />
        <StatCard g={g} a={at('tre', 'una')} out={S.dom} n={1} marks={['ball', 'x', 'x', 'x']} suffix=" SU 4" icon="ball" caption="PARTITE DI NATIONS LEAGUE IN CUI IL GALLES HA SEGNATO" y={900} layout="top" />
      </Seg>

      {/* 6 · domanda: schermo diviso */}
      <Seg g={g} a={S.dom} b={S.cta}>
        <ClipSlot g={g} a={S.dom} seed="h-s1" label="CLIP · HAALAND" style={{bottom: H / 2}} clip={CL.splitTop} flag="no" />
        <ClipSlot g={g} a={S.dom} seed="h-s2" label="CLIP · GALLES" style={{top: H / 2}} clip={CL.splitBottom} flag="gb-wls" />
        <div style={{position: 'absolute', left: 0, right: 0, top: H / 2 - 3, height: 6, background: '#0B0F33'}} />
        <Caption g={g} y={H / 2 - 88} out={at('dom', 'e') - 0.05} rows={[cap('white', [['HAALAND', at('dom', 'haaland')], ['A', at('dom', 'a')], ['SEGNO', at('dom', 'segno')]]), cap('navy', [['GIÀ', at('dom', 'gia')], ['NEL', at('dom', 'nel')], ['1°', at('dom', 'primo')], ['TEMPO?', at('dom', 'tempo')]])]} />
        <Caption g={g} y={H / 2 - 88} out={S.cta} rows={[cap('white', [['E', at('dom', 'e')], ['OCCHIO:', at('dom', 'occhio')]]), cap('navy', [['PUÒ', at('dom', 'puo')], ['FARNE', at('dom', 'farne')], ['PIÙ', at('dom', 'piu')], ['DI', at('dom', 'di')], ['UNO', at('dom', 'uno')]])]} />
      </Seg>

      {/* 7 · commenta ANALISI */}
      <Seg g={g} a={S.cta} b={END + 1}>
        <EndCard g={g} a={S.cta} home="no" away="gb-wls" tWord={at('cta', 'commenta')} tKey={at('cta', 'analisi')} />
      </Seg>

      <Hud g={g} show={1 - prog(g, S.cta - 0.1, S.cta + 0.1)} left="OGGI · 18:00" home="no" away="gb-wls" match="NORVEGIA – GALLES" />
      {step > 0 && g < S.dom && <Steps g={g} big={easeOut(prog(g, S.uno, S.uno + 0.25))} lit={[0, 0, 0]} active={step} x={60} y={320} size={70} pulse={hit(g, [S.uno, S.casa, S.galles][step - 1] + 0.1, 5)} />}

      <AbsoluteFill style={{background: '#fff', opacity: flash, mixBlendMode: 'screen'}} />
      {data.audio && <Audio src={staticFile('motb/haaland/voce.mp3')} />}
    </AbsoluteFill>
  );
};

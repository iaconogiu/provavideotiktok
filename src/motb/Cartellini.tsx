import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import data from './cartellini.json';
import {Backdrop, Caption, CardRain, ClipSlot, CompareBars, EndCard, FPS, H, Hud, StatCard, Steps, W, cap, easeIn, easeOut, hit, makeTiming, prog, useFontReady, type Clip, type VW} from './kit';

/**
 * Svezia-Bosnia (Nations League, Lega B): tre numeri sui cartellini. Stile MOTB.
 * Testo: scripts/cartellini_voce.txt → cartellini.json (scripts/motb_align.py; con l'mp3 usa Whisper).
 * Voce: public/motb/cartellini/voce.mp3. Immagini: CLIPS qui sotto (vuoto = bandiera).
 */

const CLIPS: Partial<Record<'gancioTop' | 'gancioBottom' | 'arbitro' | 'bosnia' | 'svezia' | 'domTop' | 'domBottom', Clip>> = {
  arbitro: {image: 'motb/cartellini/arbitro.png', x: 0.55, y: 0.3, zoom: 1.08, pan: -1},
};

export {FPS};
const TAIL = data.audio ? 1.0 : 0;
export const CARTELLINI_FRAMES = Math.ceil((data.duration + TAIL) * FPS);
const {cue, at} = makeTiming(data.words as VW[]);
const END = data.duration + TAIL;

const S = {
  gancio: 0,
  numeri: cue('ctx').start - 0.1,
  arbitro: cue('uno').start - 0.1,
  bosnia: cue('due').start - 0.1,
  bosniaDato: at('due', 'della') - 0.1,
  svezia: cue('tre').start - 0.1,
  sveziaDato: at('tre', 'appena') - 0.1,
  dom: cue('dom').start - 0.1,
  cta: cue('cta').start - 0.1,
};
const CUTS = [S.numeri, S.arbitro, S.bosnia, S.bosniaDato, S.svezia, S.sveziaDato, S.dom, S.cta];

const Seg: React.FC<{g: number; a: number; b: number; children: React.ReactNode}> = ({g, a, b, children}) => {
  if (g < a - 0.1 || g > b + 0.1) return null;
  const i = easeOut(prog(g, a - 0.1, a + 0.1));
  const o = easeIn(prog(g, b - 0.1, b + 0.1));
  const blur = (1 - i) * 18 + o * 18;
  return <AbsoluteFill style={{opacity: Math.min(i, 1 - o), filter: blur > 0.3 ? `blur(${blur}px)` : undefined}}>{children}</AbsoluteFill>;
};

const Split: React.FC<{g: number; a: number; top: Clip | undefined; bottom: Clip | undefined}> = ({g, a, top, bottom}) => (
  <>
    <ClipSlot g={g} a={a} seed="top" clip={top} flag="se" style={{bottom: H / 2}} />
    <ClipSlot g={g} a={a} seed="bot" clip={bottom} flag="ba" style={{top: H / 2}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: H / 2 - 3, height: 6, background: '#0B0F33'}} />
  </>
);

const CLIP_Y = 940;
const GFX_Y = 560;
const SEAM_Y = H / 2 - 88;

export const Cartellini: React.FC = () => {
  useFontReady();
  const frame = useCurrentFrame();
  const g = frame / FPS;
  const flash = Math.max(...CUTS.map((c) => hit(g, c, 14) * 0.22));
  const step = g >= S.svezia ? 3 : g >= S.bosnia ? 2 : g >= S.arbitro ? 1 : 0;
  const tNum = at('ctx', 'tre');
  const tCart = at('ctx', 'cartellini');
  return (
    <AbsoluteFill style={{background: '#0B0F33', overflow: 'hidden'}}>
      <Backdrop g={g} />

      {/* 1 · gancio: cartellini da una parte sola (Svezia sopra, Bosnia sotto) */}
      <Seg g={g} a={S.gancio} b={S.numeri}>
        <Split g={g} a={0} top={CLIPS.gancioTop} bottom={CLIPS.gancioBottom} />
        <CardRain g={g} a={at('gancio', 'piovere')} seed="g" top={H / 2} height={H / 2} />
        <Caption g={g} y={SEAM_Y} out={at('gancio', 'da') - 0.05} rows={[cap('white', [['I', at('gancio', 'i', 1)], ['CARTELLINI', at('gancio', 'cartellini')]]), cap('navy', [['POTREBBERO', at('gancio', 'potrebbero')], ['PIOVERE', at('gancio', 'piovere')]])]} />
        <Caption g={g} y={SEAM_Y} out={S.numeri} rows={[cap('white', [['DA', at('gancio', 'da')], ['UNA', at('gancio', 'una', 1)]]), cap('navy', [['PARTE', at('gancio', 'parte')], ['SOLA', at('gancio', 'sola')]])]} />
      </Seg>

      {/* 2 · tre numeri sui cartellini */}
      <Seg g={g} a={S.numeri} b={S.arbitro}>
        <Caption g={g} y={GFX_Y} out={S.arbitro} rows={[cap('white', [['3', tNum], ['NUMERI', at('ctx', 'numeri')]]), cap('navy', [['SUI', at('ctx', 'sui')], ['CARTELLINI', tCart]])]} />
        <Steps g={g} big={easeOut(prog(g, tNum - 0.1, tNum + 0.2))} lit={[0, 1, 2].map((i) => prog(g, tCart + i * 0.13, tCart + i * 0.13 + 0.2))} active={0} x={(W - 3 * 190 - 2 * 27) / 2} y={980} size={190} />
      </Seg>

      {/* 3 · uno: l'arbitro, 4,5 cartellini a partita */}
      <Seg g={g} a={S.arbitro} b={S.bosnia}>
        {CLIPS.arbitro && (
          <>
            <ClipSlot g={g} a={S.arbitro} seed="arb" clip={CLIPS.arbitro} />
            <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(11,15,51,0.15) 0%, rgba(11,15,51,0.55) 40%, rgba(11,15,51,0.8) 100%)'}} />
          </>
        )}
        <Caption g={g} y={GFX_Y} out={at('uno', 'quattro') - 0.05} rows={[cap('white', [["L'ARBITRO", at('uno', "l'arbitro")], ['DI', at('uno', 'di')], ['STASERA', at('uno', 'stasera')]]), cap('navy', [['HA', at('uno', 'ha')], ['UNA', at('uno', 'una')], ['MEDIA', at('uno', 'media')], ['DI', at('uno', 'di', 1)]])]} />
        <Caption g={g} y={GFX_Y} out={S.bosnia} rows={[cap('white', [['4,5', at('uno', 'quattro')], ['CARTELLINI', at('uno', 'cartellini')]]), cap('navy', [['A', at('uno', 'a')], ['PARTITA', at('uno', 'partita')]])]} />
        <StatCard g={g} a={at('uno', 'quattro')} out={S.bosnia} n={4.5} total={5} decimals={1} icon="card" caption="CARTELLINI DI MEDIA A PARTITA DELL'ARBITRO" y={900} />
      </Seg>

      {/* 4 · due: la Bosnia (immagine) */}
      <Seg g={g} a={S.bosnia} b={S.bosniaDato}>
        <ClipSlot g={g} a={S.bosnia} seed="bos" clip={CLIPS.bosnia} flag="ba" />
        <Caption g={g} y={CLIP_Y} out={S.bosniaDato} rows={[cap('white', [['LA', at('due', 'la')], ['BOSNIA', at('due', 'bosnia')]]), cap('navy', [['TRA', at('due', 'tra')], ['LE', at('due', 'le')], ['PIÙ', at('due', 'piu')], ['AMMONITE', at('due', 'ammonite')]])]} />
      </Seg>

      {/* 4b · 2,7 a partita */}
      <Seg g={g} a={S.bosniaDato} b={S.svezia}>
        <Caption g={g} y={GFX_Y} out={S.svezia} rows={[cap('white', [['IN', at('due', 'della')], ['NATIONS', at('due', 'nations')], ['LEAGUE', at('due', 'league')]]), cap('navy', [['2,7', at('due', 'due', 1)], ['A', at('due', 'a', 1)], ['PARTITA', at('due', 'partita')]])]} />
        <StatCard g={g} a={at('due', 'due', 1)} out={S.svezia} n={2.7} total={3} decimals={1} icon="card" caption="CARTELLINI A PARTITA DELLA BOSNIA" y={900} />
      </Seg>

      {/* 5 · tre: la Svezia (immagine) */}
      <Seg g={g} a={S.svezia} b={S.sveziaDato}>
        <ClipSlot g={g} a={S.svezia} seed="sve" clip={CLIPS.svezia} flag="se" />
        <Caption g={g} y={CLIP_Y} out={S.sveziaDato} rows={[cap('white', [['LA', at('tre', 'la')], ['SVEZIA', at('tre', 'svezia')], ['INVECE', at('tre', 'invece')]]), cap('navy', [['TRA', at('tre', 'tra')], ['LE', at('tre', 'le')], ['PIÙ', at('tre', 'piu')], ['CORRETTE', at('tre', 'corrette')]])]} />
      </Seg>

      {/* 5b · appena 0,7 e confronto */}
      <Seg g={g} a={S.sveziaDato} b={S.dom}>
        <Caption g={g} y={GFX_Y} out={S.dom} rows={[cap('white', [['APPENA', at('tre', 'appena')]]), cap('navy', [['0,7', at('tre', 'zero')], ['A', at('tre', 'virgola')], ['PARTITA', at('tre', 'sette')]])]} />
        <CompareBars
          g={g}
          a={at('tre', 'zero')}
          out={S.dom}
          title="CARTELLINI A PARTITA · NATIONS LEAGUE"
          y={900}
          rows={[
            {code: 'ba', name: 'BOSNIA', v: 2.7, hi: true},
            {code: 'se', name: 'SVEZIA', v: 0.7},
          ]}
        />
      </Seg>

      {/* 6 · domanda: chi prende più cartellini? */}
      <Seg g={g} a={S.dom} b={S.cta}>
        <Split g={g} a={S.dom} top={CLIPS.domTop} bottom={CLIPS.domBottom} />
        <CardRain g={g} a={at('dom', 'bosnia')} seed="d" top={H / 2} height={H / 2} n={18} />
        <Caption g={g} y={SEAM_Y} out={at('dom', 'io') - 0.05} rows={[cap('white', [['CHI', at('dom', 'chi')], ['PRENDE', at('dom', 'prende')], ['PIÙ', at('dom', 'piu')]]), cap('navy', [['CARTELLINI', at('dom', 'cartellini')], ['STASERA?', at('dom', 'stasera')]])]} />
        <Caption g={g} y={SEAM_Y} out={S.cta} rows={[cap('white', [['IO', at('dom', 'io')], ['DICO', at('dom', 'dico')]]), cap('navy', [['LA', at('dom', 'la')], ['BOSNIA', at('dom', 'bosnia')]], 84)]} />
      </Seg>

      {/* 7 · commenta ANALISI */}
      <Seg g={g} a={S.cta} b={END + 1}>
        <EndCard g={g} a={S.cta} home="se" away="ba" tWord={at('cta', 'commenta')} tKey={at('cta', 'analisi')} />
      </Seg>

      <Hud g={g} show={1 - prog(g, S.cta - 0.1, S.cta + 0.1)} left="NATIONS LEAGUE · 5ª" home="se" away="ba" match="SVEZIA – BOSNIA" />
      {step > 0 && g < S.dom && <Steps g={g} big={easeOut(prog(g, S.arbitro, S.arbitro + 0.25))} lit={[0, 0, 0]} active={step} x={60} y={320} size={70} pulse={hit(g, [S.arbitro, S.bosnia, S.svezia][step - 1] + 0.1, 5)} />}

      <AbsoluteFill style={{background: '#fff', opacity: flash, mixBlendMode: 'screen'}} />
      {data.audio && <Audio src={staticFile('motb/cartellini/voce.mp3')} />}
    </AbsoluteFill>
  );
};

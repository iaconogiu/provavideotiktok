import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Ball, C, Check, DISPLAY, FlagIS, Kicker, SceneBox, Shirt, UI, WavingFlag, at, atEnd, clamp, cue, easeBack, easeIn, easeInOut, easeOut, glass, pop, prog} from './kit';

/** le scene dopo l'intro: numeri col club, numeri in nazionale, l'andata, la lettura, il pronostico, la chiusura */

const LEFT = 70;
const COL = 940;

const countUp = (g: number, t: number, n: number, dur = 0.45) => Math.round(n * easeOut(prog(g, t, t + dur)));

// ───────────── 1. in Liga con la Real Sociedad ─────────────

const StatRow: React.FC<{g: number; t: number; n: number; label: string; top: number; accent?: boolean; extra?: React.ReactNode}> = ({g, t, n, label, top, accent, extra}) => {
  const p = easeOut(prog(g, t - 0.05, t + 0.35));
  return (
    <div
      style={{
        ...glass,
        position: 'absolute',
        left: LEFT,
        top,
        width: COL,
        height: 250,
        display: 'flex',
        alignItems: 'center',
        padding: '0 46px',
        gap: 40,
        opacity: clamp(p * 2),
        transform: `translateX(${(1 - p) * 260}px)`,
        borderLeft: `10px solid ${accent ? C.cyan : C.rsBlue}`,
      }}
    >
      <div style={{fontFamily: DISPLAY, fontSize: 210, lineHeight: 1, width: 170, textAlign: 'center', color: accent ? C.cyan : '#fff', textShadow: accent ? `0 0 40px ${C.cyan}88` : undefined}}>{countUp(g, t, n)}</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
        <div style={{fontFamily: DISPLAY, fontSize: 92, lineHeight: 1, color: '#fff'}}>{label}</div>
        {extra}
      </div>
    </div>
  );
};

export const Liga: React.FC<{g: number}> = ({g}) => {
  const t0 = cue('liga').start;
  const tN = at('liga', 'nove');
  const tC = at('liga', 'cinque');
  const tT = at('liga', 'tre');
  const head = pop(g, t0 - 0.1, 40);
  return (
    <SceneBox g={g} id="liga">
      <div style={{position: 'absolute', left: LEFT, top: 280, display: 'flex', alignItems: 'center', gap: 30, ...head}}>
        {/* stemma ufficiale della Real Sociedad (public/pronostico/logo/realsociedad.svg) */}
        <Img src={staticFile('pronostico/logo/realsociedad.svg')} style={{height: 170, filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.55)) drop-shadow(0 0 30px rgba(255,255,255,0.25))'}} />
        <div>
          <Kicker style={{fontSize: 30}}>IN LIGA · QUEST'ANNO</Kicker>
          <div style={{fontFamily: DISPLAY, fontSize: 100, lineHeight: 1.02, color: '#fff'}}>REAL SOCIEDAD</div>
        </div>
      </div>
      <StatRow g={g} t={tN} n={9} label="PRESENZE" top={530} />
      <StatRow
        g={g}
        t={tC}
        n={5}
        label="DA TITOLARE"
        top={810}
        extra={
          <div style={{display: 'flex', gap: 10}}>
            {Array.from({length: 9}, (_, i) => {
              const on = i < 5 && g > tC + 0.15 + i * 0.07;
              return <div key={i} style={{width: 46, height: 18, borderRadius: 5, background: on ? C.cyan : 'rgba(255,255,255,0.18)', boxShadow: on ? `0 0 14px ${C.cyan}` : undefined}} />;
            })}
          </div>
        }
      />
      <StatRow
        g={g}
        t={tT}
        n={3}
        label="GOL"
        top={1090}
        accent
        extra={
          <div style={{display: 'flex', gap: 14}}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={pop(g, tT + 0.2 + i * 0.12, 30)}>
                <Ball size={62} />
              </div>
            ))}
          </div>
        }
      />
    </SceneBox>
  );
};

// ───────────── 2. in nazionale ─────────────

export const Nazionale: React.FC<{g: number}> = ({g}) => {
  const n1 = cue('naz');
  const n2 = cue('naz2');
  const n3 = cue('naz3');
  // frase d'apertura, poi lascia il posto ai numeri
  const stOut = easeIn(prog(g, n2.start - 0.35, n2.start));
  const tQ = at('naz2', 'quattro');
  const tTit = at('naz2', 'titolare');
  const tGol = at('naz2', 'tre');
  const tAss = at('naz2', 'due');
  const tTot = at('naz3', 'cinque');
  const tPart = at('naz3', 'quattro');
  const merge = easeInOut(prog(g, n3.start - 0.1, n3.start + 0.35));
  return (
    <SceneBox g={g} id="naz">
      {/* "Ma è con la nazionale che fa la differenza" */}
      {stOut < 1 && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: 1 - stOut, transform: `scale(${1 - stOut * 0.15})`}}>
          <div style={{textAlign: 'center', transform: 'translateY(-80px)'}}>
            <div style={{fontFamily: DISPLAY, fontSize: 110, color: '#fff', ...pop(g, n1.start, 40)}}>MA È CON LA</div>
            <div
              style={{
                display: 'inline-block',
                fontFamily: DISPLAY,
                fontSize: 230,
                lineHeight: 1.05,
                color: '#fff',
                background: C.isBlue,
                padding: '0 34px',
                boxShadow: `inset 0 -22px 0 ${C.isRed}, 0 20px 60px rgba(0,0,0,0.5)`,
                margin: '14px 0',
                ...pop(g, at('naz', 'nazionale'), 70),
              }}
            >
              NAZIONALE
            </div>
            <div style={{fontFamily: DISPLAY, fontSize: 110, color: '#fff', ...pop(g, at('naz', 'che'), 40)}}>
              CHE FA LA <span style={{color: C.cyan}}>DIFFERENZA</span>
            </div>
          </div>
        </AbsoluteFill>
      )}
      {g > n2.start - 0.2 && (
        <>
          <div style={{position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, ...pop(g, n2.start - 0.1, 40)}}>
            <FlagIS w={78} />
            <Kicker style={{fontSize: 36}}>NATIONS LEAGUE · {countUp(g, tQ, 4, 0.3) || 4} PARTITE</Kicker>
          </div>
          {/* quattro partite, sempre titolare */}
          <div style={{position: 'absolute', left: LEFT, width: COL, top: 400, display: 'flex', justifyContent: 'space-between'}}>
            {[0, 1, 2, 3].map((i) => {
              const ti = tQ + i * 0.12;
              const ck = prog(g, tTit - 0.1 + i * 0.08, tTit + 0.2 + i * 0.08);
              return (
                <div key={i} style={{width: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, ...pop(g, ti, 50)}}>
                  <div
                    style={{
                      width: 170,
                      height: 170,
                      borderRadius: '50%',
                      background: `radial-gradient(circle at 35% 30%, #13306E 0%, ${C.navy} 70%)`,
                      border: `5px solid ${ck > 0.5 ? C.cyan : '#fff'}`,
                      boxShadow: ck > 0.5 ? `0 0 34px ${C.cyan}99` : '0 10px 30px rgba(0,0,0,0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      fontFamily: DISPLAY,
                      fontSize: 110,
                      color: '#fff',
                    }}
                  >
                    <Shirt size={128} kind="is" num="9" />
                    <div style={{position: 'absolute', right: -6, bottom: -6, width: 62, height: 62, borderRadius: '50%', background: C.navy, border: `3px solid ${C.cyan}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${easeBack(ck)})`}}>
                      <Check size={40} />
                    </div>
                  </div>
                  <div style={{fontFamily: UI, fontWeight: 800, fontSize: 26, letterSpacing: 3, color: ck > 0.5 ? C.cyan : C.silver, opacity: 0.4 + ck * 0.6}}>TITOLARE</div>
                </div>
              );
            })}
          </div>
          {/* 3 gol + 2 assist */}
          <div style={{position: 'absolute', left: LEFT, width: COL, top: 720, display: 'flex', gap: 30, alignItems: 'center', transform: `translateY(${-merge * 30}px) scale(${1 - merge * 0.12})`}}>
            {[
              {t: tGol, n: 3, l: 'GOL', acc: true},
              {t: tAss, n: 2, l: 'ASSIST', acc: false},
            ].map((s, i) => (
              <React.Fragment key={s.l}>
                {i === 1 && <div style={{fontFamily: DISPLAY, fontSize: 130, color: C.silver, ...pop(g, s.t - 0.05, 30)}}>+</div>}
                <div style={{...glass, flex: 1, height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderTop: `10px solid ${s.acc ? C.cyan : '#fff'}`, ...pop(g, s.t - 0.05, 70)}}>
                  <div style={{fontFamily: DISPLAY, fontSize: 190, lineHeight: 1, color: s.acc ? C.cyan : '#fff'}}>{countUp(g, s.t, s.n, 0.35)}</div>
                  <div style={{fontFamily: DISPLAY, fontSize: 70, color: '#fff'}}>{s.l}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
          {/* = coinvolto in 5 gol in 4 partite */}
          {g > n3.start - 0.15 && (
            <div style={{position: 'absolute', left: 0, right: 0, top: 1060, textAlign: 'center'}}>
              <div style={{fontFamily: UI, fontWeight: 800, fontSize: 36, letterSpacing: 8, color: C.silver, ...pop(g, n3.start - 0.1, 30)}}>= COINVOLTO IN</div>
              <div style={{display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 26, ...pop(g, tTot - 0.05, 80)}}>
                <span style={{fontFamily: DISPLAY, fontSize: 260, lineHeight: 1, color: C.cyan, textShadow: `0 0 60px ${C.cyan}99`}}>5</span>
                <span style={{fontFamily: DISPLAY, fontSize: 150, lineHeight: 1, color: '#fff'}}>GOL</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'center', gap: 16, marginTop: 14}}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} style={pop(g, tTot + 0.1 + i * 0.09, 40)}>
                    <Ball size={70} />
                  </div>
                ))}
              </div>
              <div style={{fontFamily: DISPLAY, fontSize: 84, color: '#fff', marginTop: 18, ...pop(g, tPart - 0.15, 30)}}>
                IN <span style={{color: C.cyan}}>4</span> PARTITE
              </div>
            </div>
          )}
        </>
      )}
    </SceneBox>
  );
};

// ───────────── 3. l'andata: Islanda 3-0 Bulgaria, doppietta ─────────────

export const Andata: React.FC<{g: number}> = ({g}) => {
  const c = cue('andata');
  const tD = at('andata', 'doppietta');
  const t3 = at('andata', 'tre');
  const t0 = at('andata', 'zero');
  const digit = (t: number, v: string) => {
    const p = prog(g, t - 0.05, t + 0.25);
    return (
      <div style={{position: 'relative', width: 120, height: 170, borderRadius: 14, background: p > 0 ? '#fff' : 'rgba(255,255,255,0.12)', border: p > 0 ? 'none' : `3px solid ${C.cyan}66`, color: C.navy, fontFamily: DISPLAY, fontSize: 140, lineHeight: '170px', textAlign: 'center', overflow: 'hidden', boxShadow: 'inset 0 -6px 0 rgba(0,0,0,0.12)'}}>
        {p <= 0 && <div style={{position: 'absolute', inset: 0, color: C.cyan, fontSize: 110, lineHeight: '164px', opacity: 0.6 + 0.4 * Math.sin(g * 8)}}>?</div>}
        <div style={{transform: `translateY(${(1 - easeOut(p)) * 100}%)`, opacity: p > 0 ? 1 : 0}}>{v}</div>
      </div>
    );
  };
  const stamp = prog(g, tD - 0.02, tD + 0.25);
  return (
    <SceneBox g={g} id="andata">
      <div style={{position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', ...pop(g, c.start - 0.1, 40)}}>
        <Kicker>L'ANDATA · 3 OTTOBRE</Kicker>
      </div>
      {/* tabellone */}
      <div style={{...glass, position: 'absolute', left: LEFT, top: 410, width: COL, height: 290, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 36px', ...pop(g, c.start, 70)}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: 230}}>
          <WavingFlag kind="is" g={g} fw={140} amp={4} strips={20} style={{boxShadow: '0 6px 18px rgba(0,0,0,0.5)'}} />
          <div style={{fontFamily: DISPLAY, fontSize: 64, color: '#fff'}}>ISLANDA</div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          {digit(t3, '3')}
          <div style={{fontFamily: DISPLAY, fontSize: 90, color: C.silver}}>–</div>
          {digit(t0, '0')}
        </div>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: 230}}>
          <WavingFlag kind="bg" g={g + 0.5} fw={140} amp={4} strips={20} style={{boxShadow: '0 6px 18px rgba(0,0,0,0.5)'}} />
          <div style={{fontFamily: DISPLAY, fontSize: 64, color: '#fff'}}>BULGARIA</div>
        </div>
      </div>
      {/* marcatori */}
      <div style={{position: 'absolute', left: LEFT, width: COL, top: 760, display: 'flex', flexDirection: 'column', gap: 18}}>
        {["37'", "60'"].map((m, i) => (
          <div key={m} style={{...glass, height: 120, display: 'flex', alignItems: 'center', gap: 28, padding: '0 34px', borderLeft: `10px solid ${C.isRed}`, ...pop(g, tD + 0.05 + i * 0.25, 40)}}>
            <Ball size={70} />
            <div style={{fontFamily: DISPLAY, fontSize: 76, color: '#fff', flex: 1}}>ÓSKARSSON</div>
            <div style={{fontFamily: DISPLAY, fontSize: 76, color: C.cyan}}>{m}</div>
          </div>
        ))}
      </div>
      {/* timbro */}
      {stamp > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1080, display: 'flex', justifyContent: 'center'}}>
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: 200,
              lineHeight: 1,
              color: '#fff',
              padding: '18px 46px',
              background: C.isRed,
              border: '8px solid #fff',
              borderRadius: 18,
              boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 80px ${C.isRed}88`,
              transform: `rotate(-6deg) scale(${2.2 - 1.2 * easeBack(stamp)})`,
              opacity: clamp(stamp * 3),
            }}
          >
            DOPPIETTA
          </div>
        </div>
      )}
    </SceneBox>
  );
};

// ───────────── 4. la lettura: è lui il riferimento ─────────────

/** lavagna tattica: l'Islanda attacca verso l'alto, tutte le linee portano al 9 */
const Board: React.FC<{g: number; t: number}> = ({g, t}) => {
  const BW = COL;
  const BH = 700;
  const dots = [
    // 4-4-2: portiere, difesa, centrocampo, l'altra punta
    {x: 0.5, y: 0.93},
    {x: 0.15, y: 0.76}, {x: 0.38, y: 0.79}, {x: 0.62, y: 0.79}, {x: 0.85, y: 0.76},
    {x: 0.14, y: 0.5}, {x: 0.38, y: 0.54}, {x: 0.62, y: 0.54}, {x: 0.86, y: 0.5},
    {x: 0.36, y: 0.3},
  ];
  const nine = {x: 0.6, y: 0.2};
  const passers = [5, 7, 8, 9];
  const lineC = 'rgba(230,245,255,0.45)';
  const pulse = (g * 1.4) % 1;
  return (
    <div style={{...glass, position: 'absolute', left: LEFT, top: 360, width: BW, height: BH, overflow: 'hidden', background: 'repeating-linear-gradient(0deg, #13532F 0 70px, #176038 70px 140px)', ...pop(g, t - 0.1, 70)}}>
      <svg width={BW} height={BH} style={{position: 'absolute', inset: 0}}>
        <rect x="30" y="30" width={BW - 60} height={BH - 60} fill="none" stroke={lineC} strokeWidth="4" />
        <rect x={BW / 2 - 220} y="30" width="440" height="150" fill="none" stroke={lineC} strokeWidth="4" />
        <rect x={BW / 2 - 100} y="30" width="200" height="60" fill="none" stroke={lineC} strokeWidth="4" />
        <rect x={BW / 2 - 70} y="12" width="140" height="18" fill="#fff" opacity="0.8" />
        <line x1="30" y1={BH - 30} x2={BW - 30} y2={BH - 30} stroke={lineC} strokeWidth="4" />
        <path d={`M ${BW / 2 - 110} ${BH - 30} A 110 110 0 0 1 ${BW / 2 + 110} ${BH - 30}`} fill="none" stroke={lineC} strokeWidth="4" />
        {/* passaggi verso il 9 */}
        {passers.map((k, i) => {
          const d = dots[k];
          const p = easeOut(prog(g, t + 0.3 + i * 0.18, t + 0.8 + i * 0.18));
          const x1 = d.x * BW;
          const y1 = d.y * BH;
          const x2 = x1 + (nine.x * BW - x1) * p;
          const y2 = y1 + (nine.y * BH - y1) * p;
          return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.cyan} strokeWidth="6" strokeDasharray="14 12" strokeDashoffset={-g * 60} opacity="0.9" />;
        })}
      </svg>
      {dots.map((d, i) => (
        <div key={i} style={{position: 'absolute', left: d.x * BW - 26, top: d.y * BH - 26, width: 52, height: 52, borderRadius: '50%', background: C.isBlue, border: '4px solid #fff', boxShadow: '0 6px 14px rgba(0,0,0,0.4)', ...pop(g, t + i * 0.03, 20)}} />
      ))}
      {/* il 9 */}
      <div style={{position: 'absolute', left: nine.x * BW - 60, top: nine.y * BH - 60, width: 120, height: 120, ...pop(g, t + 0.15, 30)}}>
        <div style={{position: 'absolute', inset: -40 * pulse, borderRadius: '50%', border: `4px solid ${C.cyan}`, opacity: 1 - pulse}} />
        <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: C.isRed, border: '6px solid #fff', boxShadow: `0 0 40px ${C.cyan}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontSize: 76, color: '#fff'}}>9</div>
      </div>
    </div>
  );
};

export const Lettura: React.FC<{g: number}> = ({g}) => {
  const c = cue('lettura');
  const chips = [
    {t: at('lettura', 'riferimento'), text: "RIFERIMENTO DELL'ATTACCO"},
    {t: at('lettura', 'competizione'), text: 'GIÀ DECISIVO IN NATIONS LEAGUE'},
    {t: at('lettura', 'numeri'), text: 'ARRIVA CON NUMERI PESANTI'},
  ];
  return (
    <SceneBox g={g} id="lettura">
      <div style={{position: 'absolute', left: 0, right: 0, top: 285, textAlign: 'center', ...pop(g, c.start - 0.1, 30)}}>
        <Kicker>LA MIA LETTURA</Kicker>
      </div>
      <Board g={g} t={c.start} />
      <div style={{position: 'absolute', left: LEFT, width: COL, top: 1100, display: 'flex', flexDirection: 'column', gap: 16}}>
        {chips.map((ch) => {
          const p = easeOut(prog(g, ch.t - 0.1, ch.t + 0.3));
          return (
            <div key={ch.text} style={{...glass, height: 100, display: 'flex', alignItems: 'center', gap: 22, padding: '0 28px', borderLeft: `10px solid ${C.cyan}`, opacity: clamp(p * 2), transform: `translateX(${(1 - p) * -200}px)`}}>
              <Check size={54} />
              <div style={{fontFamily: DISPLAY, fontSize: 62, color: '#fff', whiteSpace: 'nowrap'}}>{ch.text}</div>
            </div>
          );
        })}
      </div>
    </SceneBox>
  );
};

// ───────────── 5. il pronostico ─────────────

const Clock: React.FC<{g: number; t: number; t2: number}> = ({g, t, t2}) => {
  const R = 110;
  const L = 2 * Math.PI * R;
  const p = easeInOut(prog(g, t, t2));
  return (
    <div style={{position: 'relative', width: 260, height: 260}}>
      <svg width="260" height="260" viewBox="0 0 260 260" style={{position: 'absolute', inset: 0, transform: 'rotate(-90deg)'}}>
        <circle cx="130" cy="130" r={R} fill="rgba(6,10,34,0.75)" stroke="rgba(255,255,255,0.18)" strokeWidth="22" />
        {/* il primo tempo è metà giro */}
        <circle cx="130" cy="130" r={R} fill="none" stroke={C.cyan} strokeWidth="22" strokeLinecap="round" strokeDasharray={`${(L / 2) * p} ${L}`} style={{filter: `drop-shadow(0 0 10px ${C.cyan})`}} />
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontSize: 96, color: '#fff'}}>{Math.round(45 * p)}'</div>
    </div>
  );
};

export const Pronostico5: React.FC<{g: number}> = ({g}) => {
  const c = cue('pron');
  const tPr = at('pron', 'pronostico');
  const tName = at('pron', 'oskarsson');
  const tSeg = at('pron', 'segno');
  const pt = cue('pt');
  const tDop = at('dop', 'doppietta');
  const tEsc = at('dop', 'escludo');
  const slam = prog(g, tSeg - 0.02, tSeg + 0.25);
  return (
    <SceneBox g={g} id="pron">
      <div style={{position: 'absolute', left: 0, right: 0, top: 290, textAlign: 'center', ...pop(g, c.start - 0.05, 40)}}>
        <div style={{display: 'inline-block', fontFamily: DISPLAY, fontSize: 92, color: '#fff', borderBottom: `8px solid ${C.cyan}`, paddingBottom: 6}}>
          IL MIO <span style={{color: C.cyan, ...pop(g, tPr, 20)}}>PRONOSTICO</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 470, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{fontFamily: DISPLAY, fontSize: 190, lineHeight: 1, color: '#fff', textShadow: '0 14px 50px rgba(0,0,0,0.55)', ...pop(g, tName - 0.05, 80)}}>ÓSKARSSON</div>
        {slam > 0 && (
          <div
            style={{
              marginTop: 18,
              fontFamily: DISPLAY,
              fontSize: 170,
              lineHeight: 1,
              color: '#fff',
              background: C.isRed,
              padding: '14px 50px',
              borderRadius: 14,
              boxShadow: `0 24px 70px rgba(0,0,0,0.5), 0 0 70px ${C.isRed}99`,
              transform: `rotate(-3deg) scale(${2 - easeBack(slam)})`,
              opacity: clamp(slam * 3),
            }}
          >
            A SEGNO
          </div>
        )}
      </div>
      {/* occhio al primo tempo */}
      {g > pt.start - 0.2 && (
        <div style={{...glass, position: 'absolute', left: LEFT, width: COL, top: 900, height: 320, display: 'flex', alignItems: 'center', gap: 40, padding: '0 40px', ...pop(g, pt.start - 0.1, 60)}}>
          <Clock g={g} t={at('pt', 'primo')} t2={pt.end + 0.5} />
          <div>
            <div style={{fontFamily: DISPLAY, fontSize: 80, lineHeight: 1.05, color: C.silver}}>OCCHIO AL</div>
            <div style={{fontFamily: DISPLAY, fontSize: 150, lineHeight: 1, color: '#fff'}}>
              1° <span style={{color: C.cyan}}>TEMPO</span>
            </div>
          </div>
        </div>
      )}
      {/* e la doppietta */}
      {g > tEsc - 0.3 && (
        <div style={{position: 'absolute', left: LEFT, width: COL, top: 1260, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26}}>
          <div style={{textAlign: 'right', ...pop(g, tEsc - 0.2, 30)}}>
            <div style={{fontFamily: UI, fontWeight: 800, fontSize: 32, letterSpacing: 5, color: C.silver}}>E NON ESCLUDO</div>
            <div style={{fontFamily: DISPLAY, fontSize: 104, lineHeight: 1, color: '#fff'}}>LA DOPPIETTA</div>
          </div>
          {[0, 1].map((i) => (
            <div key={i} style={pop(g, tDop + i * 0.15, 50)}>
              <Ball size={100} />
            </div>
          ))}
        </div>
      )}
    </SceneBox>
  );
};

// ───────────── 6. chiusura: scrivilo nei commenti ─────────────

export const Chiusura: React.FC<{g: number}> = ({g}) => {
  const c = cue('chiusura');
  const tScr = at('chiusura', 'scrivilo');
  const bounce = Math.abs(Math.sin(g * 6));
  const rows: {t: number; el: React.ReactNode}[] = [
    {t: at('chiusura', 'tu'), el: <span>TU CHI VEDI</span>},
    {
      t: at('chiusura', 'a'),
      el: <span style={{display: 'inline-block', background: C.cyan, color: C.navy, padding: '0 28px', boxShadow: `0 0 60px ${C.cyan}88`}}>A SEGNO</span>,
    },
    {t: atEnd('chiusura', 'segno') - 0.05, el: <span>STASERA?</span>},
  ];
  return (
    <SceneBox g={g} id="chiusura">
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{textAlign: 'center', transform: 'translateY(-180px)'}}>
          {rows.map((r, i) => (
            <div key={i} style={{fontFamily: DISPLAY, fontSize: 180, lineHeight: 1.12, color: '#fff', textShadow: '0 12px 40px rgba(0,0,0,0.55)', ...pop(g, Math.max(c.start - 0.1, r.t - 0.05), 60)}}>
              {r.el}
            </div>
          ))}
        </div>
      </AbsoluteFill>
      {/* invito ai commenti, con freccia verso l'icona dei commenti di TikTok (lato destro) */}
      <div style={{position: 'absolute', left: LEFT, top: 1170, display: 'flex', alignItems: 'center', gap: 24, ...pop(g, tScr - 0.1, 40)}}>
        <div style={{...glass, display: 'flex', alignItems: 'center', gap: 20, padding: '24px 36px', borderRadius: 999, background: 'rgba(255,255,255,0.95)'}}>
          <svg width="58" height="58" viewBox="0 0 24 24">
            <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" fill={C.navy} />
            <circle cx="8.5" cy="11" r="1.4" fill="#fff" />
            <circle cx="12" cy="11" r="1.4" fill="#fff" />
            <circle cx="15.5" cy="11" r="1.4" fill="#fff" />
          </svg>
          <div style={{fontFamily: DISPLAY, fontSize: 64, color: C.navy}}>SCRIVILO NEI COMMENTI</div>
        </div>
        <svg width="90" height="60" viewBox="0 0 90 60" style={{transform: `translateX(${bounce * 18}px)`}}>
          <path d="M5 30h66M52 10l22 20-22 20" fill="none" stroke={C.cyan} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </SceneBox>
  );
};

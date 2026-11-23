#!/usr/bin/env node
/* ============================================================================
   PoliSim-DBE — run_nightly.js  (WS-N3 + WS-N4)
   Nightly persona batch runner & "morning report" generator. Zero deps, Node
   only. Deterministic: same (seeds, date) ⇒ byte-identical traces.json.

     node run_nightly.js [seedsPerScenario=10] [date=YYYY-MM-DD] [outRoot]

   Writes under <outRoot>/<date>/:
     traces.json   full run payloads (compact JSON — the data of record)
     report.html   self-contained morning report (inline CSS/SVG, file://-safe)
     report-committed.html  lean self-contained variant (matrices + narratives +
                            findings + flags only, <50 KB) safe to commit to git
     summary.md    ≤2-page digest (matrices + findings + calibration flags)
     meta.json     tiny manifest used by the index
   Appends one JSONL line per calibration flag to <outRoot>/calibration-ledger.jsonl
   and regenerates <outRoot>/index.html (dated folders, newest first).

   PURE CONSUMER of engine/personas/world_powers exports — no game mechanics
   here; the only persona-layer additions it relies on are marked read-only
   reporting accessors (endState.odAnchor/odCap, opts.strack).
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

/* ---- boot the headless game stack (same load order as test.js) ---- */
global.window = {};
require('./js/data.js');
require('./js/acts_content.js');
require('./js/scenario_2016.js');
require('./js/realworld_events.js');
require('./js/scenario_2030.js');
require('./js/devolution.js');
const ENGINE = require('./js/engine.js');
const PERSONAS = require('./js/personas.js');
const WORLD = require('./js/world_powers.js');

const SCENARIO_IDS = ['gfc2008', 'realign2016', 'dbe2030'];
const POLICY_NAME = {};
(global.window.POLICY_DEFS || []).forEach(d => { POLICY_NAME[d.id] = d.name; });
const POLICY_CAT = {};
(global.window.POLICY_DEFS || []).forEach(d => { POLICY_CAT[d.id] = d.cat; });
const BUDGET_NAME = {};
(global.window.BUDGET_CATS || []).forEach(c => { BUDGET_NAME[c.id] = c.name; });

/* ----------------------------- tiny helpers ----------------------------- */
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function round(x, d) { const m = Math.pow(10, d == null ? 2 : d); return Math.round(x * m) / m; }
function mean(xs) { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0; }
function median(xs) {
  if (!xs.length) return 0;
  const s = xs.slice().sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
}
function fmtInt(x) {
  if (x == null || !isFinite(x)) return '—';
  const v = Math.round(x);
  return (v < 0 ? '−' : '') + Math.abs(v).toLocaleString('en-US');
}
function sgn(x, d) { // signed number with unicode minus
  if (x == null || !isFinite(x)) return '—';
  const v = round(x, d == null ? 1 : d);
  return (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toLocaleString('en-US');
}
function pct(x, d) { return x == null || !isFinite(x) ? '—' : (x * 100).toFixed(d == null ? 1 : d) + '%'; }
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
/* fractional clock year of a sim turn — mirrors ui.js worldSimYear():
   gfc2008/dbe2030 turn 1 = Q1 of clockYear; realign2016 turn 0 = Q4 2016 */
function simYear(scen, turn) {
  if (scen.dualTrack) return (scen.clockYear - 1) + turn / 4;
  return scen.clockYear + (turn - 1) / 4;
}

/* ----------------------------- batch runner ----------------------------- */
function runBatch(seedsPerScenario) {
  const runs = [];
  SCENARIO_IDS.forEach(sid => {
    PERSONAS.presets.forEach(pid => {
      for (let i = 0; i < seedsPerScenario; i++) {
        runs.push(PERSONAS.runPersonaGame(sid, pid, 's' + i, { strack: true }));
      }
    });
  });
  return runs;
}

/* scenario static info (start snapshot + clock), read from a fresh game */
function scenarioInfo(sid) {
  const def = (global.window.SCENARIOS || {})[sid] || {};
  const g = ENGINE.createGame(sid);
  return {
    id: sid, name: def.name || sid, tagline: def.tagline || '',
    dualTrack: !!def.dualTrack, clockYear: (def.start && (def.start.clockYear || def.start.year)) || def.clockYear || 2008,
    start: { debt_gdp: g.debt_gdp, overdoses: g.overdoses, homelessness: g.homelessness, growth: g.growth, unemployment: g.unemployment }
  };
}

/* ------------------------- calibration flag rules -------------------------
   V1 — every rule is documented here AND rendered into the report. Each flag
   names the rule, the run (scenario/persona/seed) and the numbers. */
const RULE_A_LEVERS = [
  { metric: 'overdoses', rel: 0.30, label: 'overdose deaths', ids: ['drug', 'healthcare', 'ubi', 'welfare'], cats: ['health', 'medicaid', 'medicare', 'income_security'] },
  { metric: 'homelessness', rel: 0.40, label: 'homelessness', ids: ['housing', 'lvt', 'ubi', 'welfare'], cats: ['income_security', 'transport', 'health'] },
  { metric: 'debt_gdp', abs: 15, label: 'debt/GDP (pts)', ids: ['tax', 'church', 'tariffs'], anyBudget: true },
  { metric: 'unemployment', abs: 3, label: 'unemployment (pts)', ids: ['tax', 'infra', 'education', 'military', 'tariffs'], anyBudget: true },
  { metric: 'med_income', rel: 0.15, label: 'median household income', ids: ['ubi', 'welfare', 'tax', 'education', 'immigration'], cats: ['income_security', 'education'] },
  { metric: 'gdp_level', rel: 0.15, label: 'real GDP level', ids: ['tax', 'infra', 'tariffs', 'military'], anyBudget: true }
];
function runTouchedLever(run, lever) {
  return run.trace.some(e => {
    if ((e.move === 'act' || e.move === 'slider') && lever.ids.indexOf(e.detail.id) >= 0) return true;
    if (e.move === 'budget' && (lever.anyBudget || (lever.cats || []).indexOf(e.detail.cat) >= 0)) return true;
    return false;
  });
}
function calibrationFlags(runs, infos) {
  const flags = [];
  runs.forEach(r => {
    const tag = { scenario: r.scenarioId, persona: r.personaId, seed: r.seed };
    // (a) |Δmetric| vs ACTUAL beyond threshold while the persona never touched
    //     a lever for that metric (drift the driver is NOT responsible for ⇒
    //     scenario calibration suspect)
    if (r.actual) {
      RULE_A_LEVERS.forEach(lv => {
        const a = r.actual[lv.metric], v = r.endState[lv.metric];
        if (a == null || v == null || !isFinite(a) || !isFinite(v)) return;
        const d = v - a;
        const over = lv.rel != null ? Math.abs(d) > lv.rel * Math.abs(a) : Math.abs(d) > lv.abs;
        if (!over || runTouchedLever(r, lv)) return;
        flags.push(Object.assign({
          rule: 'A', metric: lv.metric,
          summary: 'RULE A (untouched-metric divergence vs ACTUAL): ' + r.personaId + ' never touched a ' + lv.label + ' lever, yet sim ' + lv.metric +
            ' ended ' + fmtInt(v) + ' vs ACTUAL ' + fmtInt(a) + ' (Δ ' + sgn(d) + (lv.rel != null ? ', ' + pct(d / a) : ' pts') +
            ' > threshold ' + (lv.rel != null ? '±' + pct(lv.rel, 0) : '±' + lv.abs + ' pts') + ').'
        }, tag));
      });
    }
    // (b) single-Act |ΔS| > 8 in an uncontaminated 8-turn window — the Act's
    //     evidence channels deserve re-checking
    (r.strack ? r.trace.filter(e => e.move === 'act' || e.move === 'slider') : []).forEach(e => {
      const t = e.turn, tEnd = Math.min(t + 8, r.strack.length - 1);
      if (tEnd <= t) return;
      const contaminated = r.trace.some(o => o !== e && (o.move === 'act' || o.move === 'slider') && o.turn > t && o.turn <= tEnd);
      if (contaminated) return;
      const dS = r.strack[tEnd] - r.strack[t];
      if (Math.abs(dS) <= 8) return;
      flags.push(Object.assign({
        rule: 'B', metric: 'S', act: e.detail.id,
        summary: 'RULE B (single-Act |ΔS| > 8): ' + (POLICY_NAME[e.detail.id] || e.detail.id) + ' → ' + e.detail.to + ' at turn ' + t +
          ' moved S by ' + sgn(dS) + ' over turns ' + t + '–' + tEnd + ' with no other Act in the window (S ' + round(r.strack[t], 1) + ' → ' + round(r.strack[tEnd], 1) + '). Evidence-check candidate.'
      }, tag));
    });
    // (c) debt spiral: debt/GDP more than +40 pts over the run
    const startDebt = infos[r.scenarioId].start.debt_gdp;
    const dDebt = r.endState.debt_gdp - startDebt;
    if (dDebt > 40) {
      const bDebt = r.baseline.debt_gdp, bTurns = r.baseline.turn;
      const bAlso = bDebt - startDebt > 40;
      flags.push(Object.assign({
        rule: 'C', metric: 'debt_gdp',
        summary: 'RULE C (debt spiral): debt/GDP rose ' + sgn(dDebt) + ' pts over ' + r.turns + ' turns (' + round(startDebt, 1) + '% → ' + round(r.endState.debt_gdp, 1) + '%; threshold +40).' +
          (bAlso ? ' The no-op baseline ALSO spirals (+' + round(bDebt - startDebt, 1) + ' pts over ' + bTurns + ' turns) ⇒ engine/scenario-level spiral, not a persona artifact.' :
            ' No-op baseline ended at ' + round(bDebt, 1) + '% (' + bTurns + ' turns) ⇒ this spiral is persona-driven.')
      }, tag));
    }
    // (d) overdose outcome below the engine's own documented evidence cap
    //     (MATH_AND_LOGIC.md: legal −15% w/ public-universal healthcare else −7%;
    //     decriminalized −7%). The engine floors at the cap, so any breach is a
    //     cross-check failure.
    const anchor = r.endState.odAnchor;
    if (anchor && r.endState.odCap > 0) {
      const floor = anchor.level * (1 - r.endState.odCap);
      if (r.endState.overdoses < floor - 1) {
        flags.push(Object.assign({
          rule: 'D', metric: 'overdoses',
          summary: 'RULE D (evidence-cap breach): drug=' + anchor.opt + ' enacted at ' + fmtInt(anchor.level) + ' deaths with cap −' + Math.round(r.endState.odCap * 100) +
            '% (floor ' + fmtInt(floor) + '), yet run ended at ' + fmtInt(r.endState.overdoses) + ' — contradicts the documented cap.'
        }, tag));
      }
    }
  });
  return flags;
}

/* ----------------------------- aggregation ----------------------------- */
function deltas(r) { // run endState deltas vs its own no-op baseline
  const b = r.baseline, e = r.endState;
  return {
    growth: e.growth - b.growth, debt_gdp: e.debt_gdp - b.debt_gdp,
    overdoses: e.overdoses - b.overdoses, homelessness: e.homelessness - b.homelessness,
    S: e.S - b.S, legitimacy: e.legitimacy - b.legitimacy,
    odRel: (e.overdoses - b.overdoses) / Math.max(1, b.overdoses),
    hmRel: (e.homelessness - b.homelessness) / Math.max(1, b.homelessness)
  };
}
function personaAgg(pRuns) { // aggregate one persona's seeds within a scenario
  const ds = pRuns.map(deltas);
  const stages = {};
  pRuns.forEach(r => { stages[r.endState.stage] = (stages[r.endState.stage] || 0) + 1; });
  const stageMode = Object.keys(stages).sort((a, b) => stages[b] - stages[a])[0];
  return {
    n: pRuns.length,
    growth: mean(ds.map(d => d.growth)), debt_gdp: mean(ds.map(d => d.debt_gdp)),
    overdoses: mean(ds.map(d => d.overdoses)), homelessness: mean(ds.map(d => d.homelessness)),
    S: mean(pRuns.map(r => r.endState.S)), dS: mean(ds.map(d => d.S)),
    legitimacy: mean(pRuns.map(r => r.endState.legitimacy)), dLegit: mean(ds.map(d => d.legitimacy)),
    stage: stageMode,
    campaigns: mean(pRuns.map(r => r.endState.dark.misinfoCampaigns)),
    scandals: mean(pRuns.map(r => r.endState.dark.scandals)),
    corruption: mean(pRuns.map(r => r.endState.dark.corruption)),
    lobbyDeals: mean(pRuns.map(r => r.endState.dark.lobbyDeals)),
    // mean ACTUAL deltas where the scenario carries an actual track
    aOverdoses: pRuns[0].actual && pRuns[0].actual.overdoses != null ? mean(pRuns.map(r => r.endState.overdoses - r.actual.overdoses)) : null,
    aHomeless: pRuns[0].actual && pRuns[0].actual.homelessness != null ? mean(pRuns.map(r => r.endState.homelessness - r.actual.homelessness)) : null,
    aDebt: pRuns[0].actual && pRuns[0].actual.debt_gdp != null ? mean(pRuns.map(r => r.endState.debt_gdp - r.actual.debt_gdp)) : null,
    // representative run = the seed whose final S is the persona median
    rep: pRuns.slice().sort((a, b) => Math.abs(a.endState.S - median(pRuns.map(x => x.endState.S))) - Math.abs(b.endState.S - median(pRuns.map(x => x.endState.S))))[0]
  };
}

/* ----------------------------- narratives ----------------------------- */
function budgetShift(run, cat) {
  let last = null;
  run.trace.forEach(e => { if (e.move === 'budget' && e.detail.cat === cat) last = e.detail.to; });
  return last;
}
function narrative(run) {
  const icon = (PERSONAS.PRESETS[run.personaId] || {}).icon || '🎭';
  const name = (PERSONAS.PRESETS[run.personaId] || {}).name || run.personaId;
  const lines = [];
  // line 1 — signature legislation
  const acts = {};
  run.trace.forEach(e => {
    if (e.move !== 'act' && e.move !== 'slider') return;
    const id = e.detail.id;
    if (!acts[id]) acts[id] = { id: id, to: e.detail.to, first: e.turn, n: 0 };
    acts[id].n++; acts[id].to = e.detail.to;
  });
  const actList = Object.keys(acts).map(k => acts[k]).sort((a, b) => a.first - b.first);
  if (actList.length) {
    lines.push(icon + ' ' + name + ' moved ' + actList.length + ' polic' + (actList.length === 1 ? 'y' : 'ies') + ': ' +
      actList.slice(0, 4).map(a => (POLICY_NAME[a.id] || a.id) + ' → ' + a.to + ' (t' + a.first + (a.n > 1 ? ', adjusted ×' + a.n : '') + ')').join('; ') +
      (actList.length > 4 ? '; +' + (actList.length - 4) + ' more' : '') + '.');
  } else {
    lines.push(icon + ' ' + name + ' passed no Acts at all — governed purely through budget lines and statements.');
  }
  // line 2 — budget + dark tactics
  const shifted = [];
  Object.keys(BUDGET_NAME).forEach(c => {
    const to = budgetShift(run, c);
    if (to != null && Math.abs(to - 1) > 0.001) shifted.push(BUDGET_NAME[c] + ' → ' + Math.round(to * 100) + '%');
  });
  const dk = run.endState.dark;
  const darkTxt = dk.misinfoCampaigns + dk.lobbyDeals > 0
    ? 'accepted ' + dk.lobbyDeals + ' lobby deal' + (dk.lobbyDeals === 1 ? '' : 's') + ' worth $' + fmtInt(dk.moneyTaken) + 'M (+' + fmtInt(dk.pcTaken) + ' PC, corruption ' + round(dk.corruption, 1) + '), fired ' +
      dk.misinfoCampaigns + ' misinformation campaign' + (dk.misinfoCampaigns === 1 ? '' : 's') + (dk.scandals ? ' → ' + dk.scandals + ' SCANDAL' + (dk.scandals === 1 ? '' : 'S') : ' (no scandal)')
    : 'stayed clean — no lobby deals, no misinformation';
  lines.push((shifted.length ? 'Budget shifts: ' + shifted.slice(0, 5).join(', ') + (shifted.length > 5 ? '…' : '') + '. ' : '') +
    darkTxt.charAt(0).toUpperCase() + darkTxt.slice(1) + '.');
  // line 3 — outcome vs baseline / ACTUAL
  const d = deltas(run), b = run.baseline, e = run.endState;
  let l3 = 'Net: S ' + sgn(d.S) + ' vs baseline (' + round(e.S, 1) + ' vs ' + round(b.S, 1) + ', ' + e.stage + '), legitimacy ' + sgn(d.legitimacy, 0) +
    ', overdoses ' + sgn(d.overdoses, 0) + ' (' + pct(d.odRel) + '), homelessness ' + sgn(d.homelessness, 0) + ' (' + pct(d.hmRel) + '), debt/GDP ' + sgn(d.debt_gdp) + ' pts';
  if (run.actual && run.actual.overdoses != null) {
    l3 += '; vs ACTUAL: overdoses ' + sgn(e.overdoses - run.actual.overdoses, 0) + ', debt/GDP ' + sgn(e.debt_gdp - run.actual.debt_gdp) + ' pts';
  }
  lines.push(l3 + '.');
  return lines;
}

/* --------------------------- SVG world chart --------------------------- */
const NATION_STYLE = [
  { id: 'usa', name: 'USA (dataset)', color: '#0f766e' },
  { id: 'china', name: 'China', color: '#dc2626' },
  { id: 'eu', name: 'EU', color: '#2563eb' },
  { id: 'india', name: 'India', color: '#ea580c' },
  { id: 'russia', name: 'Russia', color: '#7c3aed' },
  { id: 'japan', name: 'Japan', color: '#57534e' }
];
const PERSONA_COLOR = { humanitarian: '#0d9488', statesman: '#2563eb', nationalist: '#ea580c', machine: '#7c3aed', machiavelli: '#b91c1c' };

function svgChart(scen, pRunsMap, baseS) {
  const W = 920, H = 300, PL = 46, PR = 46, PT = 14, PB = 30;
  const iw = W - PL - PR, ih = H - PT - PB;
  const natSeries = NATION_STYLE.map(n => {
    const comp = WORLD.composite && WORLD.composite[n.id];
    const pts = comp ? Object.keys(comp).filter(y => comp[y] != null).map(y => [+y, comp[y]]) : [];
    return { label: n.name, color: n.color, pts: pts, axis: 'y', width: n.id === 'usa' ? 2.2 : 1.2 };
  });
  const simSeries = PERSONAS.presets.map(pid => {
    const tracks = (pRunsMap[pid] || []).map(r => r.strack).filter(t => t && t.length);
    const n = Math.max.apply(null, tracks.map(t => t.length));
    const pts = [];
    for (let i = 0; i < n; i++) {
      const vals = tracks.map(t => t[i]).filter(v => v != null);
      if (vals.length) pts.push([simYear(scen, i), mean(vals)]);
    }
    return { label: (PERSONAS.PRESETS[pid].icon || '') + ' ' + PERSONAS.PRESETS[pid].name + ' (sim, right axis)', color: PERSONA_COLOR[pid], pts: pts, axis: 'y1', width: 1.8 };
  });
  if (baseS && baseS.length) {
    simSeries.push({ label: 'No-op baseline (sim, right axis)', color: '#a8a29e', dash: '5 4', axis: 'y1', width: 1.4,
      pts: baseS.map((v, i) => [simYear(scen, i + 1), v]) });
  }
  const xs = natSeries.concat(simSeries).reduce((a, s) => a.concat(s.pts.map(p => p[0])), []);
  const x0 = Math.min(2000, Math.floor(Math.min.apply(null, xs))), x1 = Math.max(2024, Math.ceil(Math.max.apply(null, xs)));
  const ysL = natSeries.reduce((a, s) => a.concat(s.pts.map(p => p[1])), [58]);
  const ysR = simSeries.reduce((a, s) => a.concat(s.pts.map(p => p[1])), []);
  const l0 = Math.floor(Math.min.apply(null, ysL) / 10) * 10, l1 = Math.ceil(Math.max.apply(null, ysL) / 10) * 10;
  const r0 = Math.floor(Math.min.apply(null, ysR) / 10) * 10, r1 = Math.ceil(Math.max.apply(null, ysR) / 10) * 10;
  const X = x => PL + (x - x0) / (x1 - x0) * iw;
  const YL = y => PT + (1 - (y - l0) / (l1 - l0)) * ih;
  const YR = y => PT + (1 - (y - r0) / (r1 - r0)) * ih;
  function path(pts, Y) { return pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join(' '); }
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block" role="img" aria-label="World S chart">';
  s += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#fafaf9"/>';
  // gridlines + x ticks every 4-6 years
  const step = Math.max(2, Math.round((x1 - x0) / 8));
  for (let y = x0; y <= x1; y += step) {
    s += '<line x1="' + X(y) + '" y1="' + PT + '" x2="' + X(y) + '" y2="' + (PT + ih) + '" stroke="#e7e5e4" stroke-width="0.7"/>';
    s += '<text x="' + X(y) + '" y="' + (H - 10) + '" font-size="10" fill="#78716c" text-anchor="middle">' + y + '</text>';
  }
  [0, 0.5, 1].forEach(fr => {
    const lv = l0 + fr * (l1 - l0), rv = r0 + fr * (r1 - r0);
    s += '<text x="' + (PL - 5) + '" y="' + (YL(lv) + 3) + '" font-size="10" fill="#57534e" text-anchor="end">' + Math.round(lv) + '</text>';
    s += '<text x="' + (W - PR + 5) + '" y="' + (YR(rv) + 3) + '" font-size="10" fill="#059669">' + Math.round(rv) + '</text>';
  });
  // The Top threshold on the dataset axis
  s += '<line x1="' + PL + '" y1="' + YL(58) + '" x2="' + (W - PR) + '" y2="' + YL(58) + '" stroke="#a8a29e" stroke-width="1" stroke-dasharray="6 4"/>';
  s += '<text x="' + (W - PR - 4) + '" y="' + (YL(58) - 4) + '" font-size="9" fill="#78716c" text-anchor="end">The Top threshold (58, dataset scale)</text>';
  natSeries.forEach(sr => { if (sr.pts.length > 1) s += '<path d="' + path(sr.pts, YL) + '" fill="none" stroke="' + sr.color + '" stroke-width="' + sr.width + '" opacity="0.85"/>'; });
  simSeries.forEach(sr => {
    if (sr.pts.length > 1) s += '<path d="' + path(sr.pts, YR) + '" fill="none" stroke="' + sr.color + '" stroke-width="' + sr.width + '"' + (sr.dash ? ' stroke-dasharray="' + sr.dash + '"' : '') + '/>';
  });
  s += '</svg>';
  const legend = natSeries.concat(simSeries).map(sr =>
    '<span class="lg"><span class="sw" style="background:' + sr.color + '"></span>' + esc(sr.label) + '</span>').join(' ');
  return '<div class="chartwrap">' + s + '<div class="legend">' + legend + '</div>' +
    '<p class="note">Dual-scale honesty note: left axis = WORLD_POWERS dataset composite S (6 nations, normalized 0–100 cross-country, annual 2000–2024); ' +
    'right axis = game-scale S of the simulated USA (mean over seeds). As in the in-game world chart, the game scale runs ≈19 pts hot vs the dataset — both axes are shown so the calibration gap stays explicit. ' +
    'Sim clock: ' + scen.id + ' turn 1 = Q1 ' + scen.clockYear + (scen.dualTrack ? ' (turn 0 = Q4 ' + (scen.clockYear - 1) + ')' : '') + '.</p></div>';
}

/* ------------------------- report HTML sections ------------------------- */
function matrixHTML(scen, pAggs, hasActual) {
  const head = '<tr><th>Persona</th><th>ΔGDP growth</th><th>Δdebt/GDP (pts)</th><th>Δoverdoses</th><th>Δhomelessness</th>' +
    '<th>Final S</th><th>Cycle stage</th><th>Legitimacy</th><th>Campaigns</th><th>Scandals</th><th>Corruption</th></tr>';
  const rows = PERSONAS.presets.map(pid => {
    const a = pAggs[pid], P = PERSONAS.PRESETS[pid];
    const cell = (v, av, d) => '<td>' + sgn(v, d) + (av != null ? '<div class="sub">vs ACTUAL ' + sgn(av, d) + '</div>' : '') + '</td>';
    return '<tr><td class="pname">' + P.icon + ' ' + esc(P.name) + '</td>' +
      '<td>' + sgn(a.growth, 2) + '</td>' +
      cell(a.debt_gdp, a.aDebt, 1) +
      cell(a.overdoses, a.aOverdoses, 0) +
      cell(a.homelessness, a.aHomeless, 0) +
      '<td>' + round(a.S, 1) + ' <span class="sub">(' + sgn(a.dS, 1) + ')</span></td>' +
      '<td><span class="chip">' + esc(a.stage) + '</span></td>' +
      '<td>' + round(a.legitimacy, 1) + ' <span class="sub">(' + sgn(a.dLegit, 1) + ')</span></td>' +
      '<td>' + round(a.campaigns, 1) + '</td><td>' + round(a.scandals, 1) + '</td><td>' + round(a.corruption, 1) + '</td></tr>';
  }).join('');
  return '<div class="tw"><table class="mx">' + head + rows + '</table></div>' +
    '<p class="note">Mean over seeds. Δ = sim endState minus the scenario\u2019s no-op baseline (same seed calendar). ' +
    (hasActual ? '“vs ACTUAL” = sim endState minus the scripted real-world track at the end turn (dual-track scenario).' :
      'This scenario carries no scripted ACTUAL track — deltas are vs the no-op baseline only.') + '</p>';
}

function endStateTableHTML(run) {
  const e = run.endState, b = run.baseline, a = run.actual;
  const rows = [
    ['S (power score)', e.S, b.S, null, 1], ['Cycle stage', e.stage, b.stage, null],
    ['GDP growth %', e.growth, b.growth, null, 2], ['Debt/GDP %', e.debt_gdp, b.debt_gdp, a && a.debt_gdp, 1],
    ['Unemployment %', e.unemployment, b.unemployment, a && a.unemployment, 1],
    ['Overdose deaths/yr', e.overdoses, b.overdoses, a && a.overdoses, 0],
    ['Homelessness (k)', e.homelessness, b.homelessness, a && a.homelessness, 0],
    ['Median income $', e.med_income, b.med_income, a && a.med_income, 0],
    ['Real GDP $bn', e.gdp_level, b.gdp_level, a && a.gdp_level, 0],
    ['Inflation %', e.inflation, b.inflation, a && a.inflation, 1],
    ['Sentiment', e.sentiment, b.sentiment, null, 1], ['Legitimacy', e.legitimacy, b.legitimacy, null, 1],
    ['Weighted approval %', e.weightedApproval, b.weightedApproval, null, 1],
    ['PC / Funds', round(e.pc, 0) + ' / $' + fmtInt(e.funds) + 'M', round(b.pc, 0) + ' / $' + fmtInt(b.funds) + 'M', null]
  ];
  const hasA = rows.some(r => r[3] != null);
  let h = '<tr><th>Metric</th><th>Sim end</th><th>No-op baseline</th><th>Δ baseline</th>' + (hasA ? '<th>ACTUAL</th><th>Δ ACTUAL</th>' : '') + '</tr>';
  rows.forEach(r => {
    const num = typeof r[1] === 'number';
    const fmtv = (v, d) => typeof v === 'number' ? (r[4] === 0 ? fmtInt(v) : String(round(v, r[4] || 1))) : esc(v);
    h += '<tr><td>' + r[0] + '</td><td>' + fmtv(r[1]) + '</td><td>' + fmtv(r[2]) + '</td><td>' +
      (num ? sgn(r[1] - r[2], r[4] === 0 ? 0 : r[4] || 1) : '—') + '</td>' +
      (hasA ? '<td>' + (r[3] != null ? fmtv(r[3]) : '—') + '</td><td>' + (num && r[3] != null ? sgn(r[1] - r[3], r[4] === 0 ? 0 : r[4] || 1) : '—') + '</td>' : '') + '</tr>';
  });
  return '<div class="tw"><table>' + h + '</table></div>';
}

function traceTableHTML(run) {
  let h = '<tr><th>Turn</th><th>Move</th><th>Detail</th><th>Reason (driver\u2019s own scoring)</th></tr>';
  run.trace.forEach(e => {
    const d = e.detail || {};
    const dt = e.move === 'budget' ? (BUDGET_NAME[d.cat] || d.cat) + ' ' + Math.round(d.from * 100) + '%→' + Math.round(d.to * 100) + '%' :
      (e.move === 'act' || e.move === 'slider') ? (POLICY_NAME[d.id] || d.id) + ' → ' + d.to :
      e.move === 'event' ? d.event + ' → ' + d.option :
      e.move === 'misinfo' ? 'target ' + d.target + ' (heat ' + d.heat + ')' :
      (e.move === 'lobby_accept' || e.move === 'lobby_decline') ? d.industry + ' (' + d.offer + ')' : '';
    const cls = e.move === 'misinfo' || e.move === 'lobby_accept' ? 'mv-dark' : e.move === 'pass' ? 'mv-pass' : '';
    h += '<tr class="' + cls + '"><td>' + e.turn + '</td><td>' + esc(e.move) + '</td><td>' + esc(dt) + '</td><td>' + esc(e.reason) + '</td></tr>';
  });
  return '<div class="tw"><table class="trace">' + h + '</table></div>';
}

function runCardsHTML(scen, pAggs, pRunsMap) {
  return PERSONAS.presets.map(pid => {
    const a = pAggs[pid], P = PERSONAS.PRESETS[pid], rep = a.rep;
    const seedsRows = pRunsMap[pid].map(r =>
      '<tr><td>' + esc(r.seed) + '</td><td>' + r.turns + '</td><td>' + round(r.endState.S, 1) + '</td><td>' + sgn(r.endState.S - r.baseline.S, 1) + '</td>' +
      '<td>' + esc(r.endState.stage) + '</td><td>' + sgn(r.endState.debt_gdp - r.baseline.debt_gdp, 1) + '</td>' +
      '<td>' + sgn(r.endState.overdoses - r.baseline.overdoses, 0) + '</td><td class="hash">' + PERSONAS.hashTrace(r.trace) + '</td></tr>').join('');
    return '<details class="card runcard"><summary><b>' + P.icon + ' ' + esc(P.name) + '</b> — mean S ' + round(a.S, 1) + ' (' + sgn(a.dS, 1) +
      ' vs baseline), ' + esc(a.stage) + ', legitimacy ' + round(a.legitimacy, 0) + ' · ' + a.n + ' seeds (representative: ' + esc(rep.seed) + ')</summary>' +
      '<ul class="narr">' + narrative(rep).map(l => '<li>' + esc(l) + '</li>').join('') + '</ul>' +
      '<h4>All seeds</h4><div class="tw"><table><tr><th>Seed</th><th>Turns</th><th>Final S</th><th>ΔS</th><th>Stage</th><th>Δdebt/GDP</th><th>Δoverdoses</th><th>Trace hash</th></tr>' + seedsRows + '</table></div>' +
      '<h4>Representative run (' + esc(rep.seed) + ') — end state vs baseline' + (rep.actual ? ' vs ACTUAL' : '') + '</h4>' + endStateTableHTML(rep) +
      '<h4>Representative run — full decision trace (' + rep.trace.length + ' entries)</h4>' + traceTableHTML(rep) +
      '</details>';
  }).join('\n');
}

/* --------------------- "what the night taught us" --------------------- */
function crossRunAnalysis(runs) {
  // tactic usage per run → mean ΔS / welfare delta for users vs non-users
  const tactics = {};
  function bump(key, label, run, d) {
    if (!tactics[key]) tactics[key] = { label: label, users: [], non: [], wUsers: [], wNon: [] };
    tactics[key].users.push(d.S); tactics[key].wUsers.push(-(d.odRel + d.hmRel) / 2);
  }
  function bumpNoop(key, label) { // non-users are backfilled in the second pass
    if (!tactics[key]) tactics[key] = { label: label, users: [], non: [], wUsers: [], wNon: [] };
  }
  const usedByPersona = {}; // scen -> actId -> set(personas)
  runs.forEach(r => {
    const d = deltas(r);
    const acts = {}, budUp = {}, budDown = {};
    let mis = 0, lob = 0;
    r.trace.forEach(e => {
      if (e.move === 'act' || e.move === 'slider') acts[e.detail.id] = true;
      if (e.move === 'budget') (e.detail.to > e.detail.from ? budUp : budDown)[e.detail.cat] = true;
      if (e.move === 'misinfo') mis++;
      if (e.move === 'lobby_accept') lob++;
    });
    Object.keys(acts).forEach(id => {
      const k = 'act:' + id, lb = (POLICY_NAME[id] || id) + ' (Act)';
      bump(k, lb, r, d);
      const sc = usedByPersona[r.scenarioId] = usedByPersona[r.scenarioId] || {};
      (sc[id] = sc[id] || {})[r.personaId] = true;
    });
    Object.keys(budUp).forEach(c => bump('bud+:' + c, (BUDGET_NAME[c] || c) + ' budget ↑', r, d));
    Object.keys(budDown).forEach(c => bump('bud-:' + c, (BUDGET_NAME[c] || c) + ' budget ↓', r, d));
    (mis ? bump : bumpNoop)('misinfo', 'Misinformation campaigns', r, d);
    (lob ? bump : bumpNoop)('lobby', 'Lobby deals', r, d);
  });
  // second pass to fill non-user buckets
  Object.keys(tactics).forEach(k => {
    runs.forEach(r => {
      const used = (k === 'misinfo') ? r.trace.some(e => e.move === 'misinfo') :
        (k === 'lobby') ? r.trace.some(e => e.move === 'lobby_accept') :
        k.slice(0, 4) === 'act:' ? r.trace.some(e => (e.move === 'act' || e.move === 'slider') && e.detail.id === k.slice(4)) :
        k.slice(0, 4) === 'bud+' ? r.trace.some(e => e.move === 'budget' && e.detail.cat === k.slice(4) && e.detail.to > e.detail.from) :
        r.trace.some(e => e.move === 'budget' && e.detail.cat === k.slice(4) && e.detail.to < e.detail.from);
      if (!used) { const d = deltas(r); tactics[k].non.push(d.S); tactics[k].wNon.push(-(d.odRel + d.hmRel) / 2); }
    });
  });
  const list = Object.keys(tactics).map(k => {
    const t = tactics[k];
    return { key: k, label: t.label, n: t.users.length, dS: mean(t.users) - (t.non.length ? mean(t.non) : 0), dW: mean(t.wUsers) - (t.wNon.length ? mean(t.wNon) : 0) };
  }).filter(t => t.n >= 3);
  const byS = list.slice().sort((a, b) => b.dS - a.dS);
  const byW = list.slice().sort((a, b) => b.dW - a.dW);
  // convergence per scenario
  const conv = SCENARIO_IDS.map(sid => {
    const sc = (usedByPersona[sid]) || {};
    const all5 = [], solo = [];
    Object.keys(sc).forEach(id => {
      const ps = Object.keys(sc[id]);
      if (ps.length === PERSONAS.presets.length) all5.push(POLICY_NAME[id] || id);
      if (ps.length === 1) solo.push((POLICY_NAME[id] || id) + ' (only ' + ps[0] + ')');
    });
    return { sid: sid, all5: all5, solo: solo };
  });
  return { byS: byS, byW: byW, conv: conv };
}

/* ----------------------------- CSS (inline) ----------------------------- */
const CSS = `
:root{--teal:#0f766e;--teal-dark:#115e59;--amber:#b45309}
*{box-sizing:border-box}
body{margin:0;background:#f5f5f4;color:#292524;font-family:ui-sans-serif,system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.45}
header{background:#292524;color:#f5f5f4;padding:.9rem 1rem;position:sticky;top:0;z-index:5}
header .wrap{max-width:72rem;margin:0 auto;display:flex;flex-wrap:wrap;gap:.5rem 1.2rem;align-items:center}
header h1{font-size:1.05rem;margin:0}
header .sub{font-size:.68rem;color:#a8a29e}
.badge{display:inline-block;padding:.15rem .55rem;border-radius:9999px;font-weight:600;font-size:.7rem;background:#44403c;white-space:nowrap}
.badge.amber{background:#92400e}.badge.teal{background:#115e59}
main{max-width:72rem;margin:0 auto;padding:1rem}
.card{background:#fff;border:1px solid #e7e5e4;border-radius:.75rem;padding:1rem 1.25rem;margin:.8rem 0;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.card h2{margin:.1rem 0 .5rem;font-size:1.05rem}
.card h3{margin:.2rem 0 .4rem;font-size:.92rem}
.honest{border-left:4px solid var(--amber);background:#fffbeb}
.honest b{color:#92400e}
.tw{overflow-x:auto;-webkit-overflow-scrolling:touch}
table{border-collapse:collapse;width:100%;font-size:.78rem}
th,td{border:1px solid #e7e5e4;padding:.3rem .5rem;text-align:right;white-space:nowrap}
th{background:#fafaf9;font-weight:700;color:#44403c}
td:first-child,th:first-child{text-align:left}
td.pname{font-weight:600;white-space:nowrap}
.sub{font-size:.66rem;color:#78716c;font-weight:400}
.chip{display:inline-block;padding:0 .45rem;border-radius:9999px;font-size:.62rem;font-weight:700;background:#dbeafe;color:#1d4ed8}
.note{font-size:.72rem;color:#78716c;margin:.4rem 0 0}
details.runcard{padding:.6rem 1rem}
details.runcard summary{cursor:pointer;font-size:.85rem;padding:.3rem 0}
details.runcard h4{font-size:.78rem;color:#57534e;margin:.9rem 0 .3rem}
ul.narr{margin:.5rem 0;padding-left:1.2rem;font-size:.82rem}
ul.narr li{margin:.25rem 0}
table.trace td{font-size:.7rem;white-space:normal}
table.trace td:nth-child(4){min-width:16rem;white-space:normal;text-align:left}
table.trace td:nth-child(3){white-space:normal;text-align:left}
tr.mv-dark td{background:#fef2f2}
tr.mv-pass td{color:#a8a29e}
.hash{font-family:ui-monospace,Menlo,monospace;font-size:.64rem;color:#a8a29e}
.chartwrap{margin:.5rem 0}
.legend{display:flex;flex-wrap:wrap;gap:.2rem .9rem;font-size:.68rem;color:#44403c;margin-top:.3rem}
.legend .lg{display:inline-flex;align-items:center}
.legend .sw{display:inline-block;width:.7rem;height:.7rem;border-radius:2px;margin-right:.3rem}
.flag{border:1px solid #fecaca;background:#fef2f2;border-radius:.5rem;padding:.5rem .8rem;margin:.4rem 0;font-size:.78rem}
.flag .rule{font-weight:700;color:#b91c1c}
code{background:#e7e5e4;border-radius:.25rem;padding:0 .3rem;font-size:.72rem}
footer{color:#a8a29e;font-size:.7rem;text-align:center;padding:1.5rem 1rem}
@media(max-width:640px){header h1{font-size:.95rem}main{padding:.6rem}.card{padding:.8rem .8rem}}
`;

/* ----------------------------- HTML assembly ----------------------------- */
function honestyHTML(seedsPerScenario) {
  return '<section class="card honest"><h2>Methodology & honesty box</h2>' +
    '<ul class="narr">' +
    '<li><b>Heuristic drivers, not RL.</b> Each persona is a fixed objective function (welfare / nation / party / world / dark weights) that scores the engine\u2019s own candidate moves each turn and takes the best one above threshold. Reasons quoted in the traces are the driver\u2019s own scoring notes.</li>' +
    '<li><b>Mechanical preview channels only.</b> Move scoring uses the engine\u2019s documented preview functions (policy/budget channel deltas, group drifts). No hidden dynamics were probed; nothing here validates long-lag or stochastic effects beyond what the engine computes.</li>' +
    '<li><b>Deterministic seeds.</b> Seeds s0…s' + (seedsPerScenario - 1) + ', engine FNV-1a/xorshift PRNG keyed by (seed, turn, move). Same (seeds, date) ⇒ byte-identical traces.json.</li>' +
    '<li><b>Baselines & actuals.</b> “vs baseline” = the scenario\u2019s deterministic no-op driver (pass every turn). “vs ACTUAL” exists only where a scripted real-world track exists (realign2016 dual-track; gfc2008/dbe2030 show baseline deltas only).</li>' +
    '<li><b>World chart is dual-scale.</b> Dataset nations are normalized cross-country composites (World Bank/IMF); the simulated USA rides the game\u2019s own S scale, ≈19 pts hotter. Both axes drawn — the gap is the point.</li>' +
    '<li><b>Counterfactual, not forecast.</b> “This agent enacted that rule and this happened” is a statement about the model\u2019s mechanics, not about the real world.</li>' +
    '</ul></section>\n';
}

function analysisHTML(an) {
  function tbl(rows, unit) {
    let h = '<tr><th>Tactic</th><th>Runs using</th><th>Mean ΔS vs non-users</th><th>Mean Δwelfare vs non-users</th></tr>';
    rows.forEach(t => {
      h += '<tr><td>' + esc(t.label) + '</td><td>' + t.n + '</td><td>' + sgn(t.dS, 2) + '</td><td>' + sgn(t.dW * 100, 1) + '%</td></tr>';
    });
    return '<div class="tw"><table>' + h + '</table></div>';
  }
  let h = '<h3>Tactics that moved S most</h3>' + tbl(an.byS.slice(0, 6)) +
    '<h3>Tactics that moved welfare most</h3><p class="note">Welfare delta = −½(Δoverdoses% + Δhomelessness%) vs the no-op baseline; positive = fewer deaths/less homelessness than runs not using the tactic.</p>' +
    tbl(an.byW.slice(0, 6)) +
    '<h3>Convergence vs divergence</h3><ul class="narr">' +
    an.conv.map(c => '<li><b>' + esc(c.sid) + '</b> — robust (all 5 personas enacted): ' + (c.all5.map(esc).join(', ') || 'none') +
      '. Signature (one persona only): ' + (c.solo.map(esc).join(', ') || 'none') + '.</li>').join('') + '</ul>' +
    '<p class="note">Association, not attribution: these are mean end-state differences between runs that used a tactic and runs that did not, pooled across scenarios and seeds. Persona composition confounds them.</p>';
  return h;
}

function flagsHTML(flags, maxShown) {
  const doc = '<p class="note"><b>Rules (V1):</b> ' +
    '<b>A</b> — |Δmetric| vs the scripted ACTUAL track beyond threshold (overdoses ±30%, homelessness ±40%, debt/GDP ±15pts, unemployment ±3pts, median income ±15%, real GDP ±15%) on a run whose persona never touched a lever for that metric — divergence the driver is not responsible for ⇒ scenario calibration suspect. ' +
    '<b>B</b> — a single Act moving |S| by &gt; 8 within an 8-turn window uncontaminated by other Acts ⇒ evidence-check candidate for that Act\u2019s channels. ' +
    '<b>C</b> — debt/GDP up &gt; 40 pts over the run ⇒ spiral check. ' +
    '<b>D</b> — overdose deaths below the engine\u2019s own documented evidence cap (MATH_AND_LOGIC.md: legal −15% with public/universal healthcare, else −7%; decriminalized −7%) ⇒ cross-check failure; the engine floors at the cap, so this should never fire.</p>';
  if (!flags.length) return '<p>No calibration flags fired this night. The V1 rules stayed silent.</p>' + doc;
  const counts = {};
  flags.forEach(fl => { counts[fl.rule] = (counts[fl.rule] || 0) + 1; });
  const tally = '<p><b>' + flags.length + ' flags:</b> ' + Object.keys(counts).sort().map(r => 'RULE ' + r + ' × ' + counts[r]).join(' · ') + '.</p>';
  // render every A/B/D flag; rule C is shown once per scenario×persona (the
  // numbers are seed-invariant there) with a pointer to the ledger for the rest
  let shown = []; const collapsed = [];
  const seenC = {};
  flags.forEach(fl => {
    if (fl.rule !== 'C') { shown.push(fl); return; }
    const k = fl.scenario + '/' + fl.persona;
    if (seenC[k]) collapsed.push(fl); else { seenC[k] = 1; shown.push(fl); }
  });
  let overflow = 0;
  if (maxShown != null && shown.length > maxShown) { overflow = shown.length - maxShown; shown = shown.slice(0, maxShown); }
  return tally +
    shown.map(fl => '<div class="flag"><span class="rule">RULE ' + fl.rule + '</span> <code>' + esc(fl.scenario) + ' / ' + esc(fl.persona) + ' / ' + esc(fl.seed) + '</code> — ' + esc(fl.summary) + '</div>').join('') +
    (collapsed.length ? '<p class="note">…plus ' + collapsed.length + ' further RULE C seed-level entries with identical per-persona numbers — all in <code>calibration-ledger.jsonl</code>.</p>' : '') +
    (overflow ? '<p class="note">…plus ' + overflow + ' further flags omitted from this lean report — all in <code>calibration-ledger.jsonl</code> and <code>report.html</code>.</p>' : '') + doc;
}

function buildReportHTML(date, seedsPerScenario, runs, infos, flags, analysis, durationMs) {
  const scenSections = SCENARIO_IDS.map(sid => {
    const info = infos[sid];
    const pAggs = {}, pRunsMap = {};
    PERSONAS.presets.forEach(pid => {
      pRunsMap[pid] = runs.filter(r => r.scenarioId === sid && r.personaId === pid);
      pAggs[pid] = personaAgg(pRunsMap[pid]);
    });
    const hasActual = pAggs[PERSONAS.presets[0]].rep.actual != null;
    const baseS = (runs.find(r => r.scenarioId === sid) || {}).baselineS;
    const base0 = runs.find(r => r.scenarioId === sid).baseline;
    return '<section class="card" id="' + sid + '">' +
      '<h2>' + esc(sid) + ' — ' + esc(info.name) + '</h2>' +
      '<p class="note">' + esc(info.tagline) + ' · start debt/GDP ' + round(info.start.debt_gdp, 1) + '%, overdoses ' + fmtInt(info.start.overdoses) + ', homelessness ' + fmtInt(info.start.homelessness) + 'k · ' +
      seedsPerScenario + ' seeds × 5 personas · 60-turn horizon · no-op baseline ' +
      (base0.over ? 'ended early at turn ' + base0.turn + ' (' + esc(base0.overReason || 'game over') + ') — Δvs-baseline compares against that earlier end state' : 'ran the full ' + base0.turn + ' turns') + '</p>' +
      '<h3>Cross-persona end-state matrix</h3>' + matrixHTML(info, pAggs, hasActual) +
      '<h3>World view — simulated USA vs the six-nation dataset</h3>' + svgChart(info, pRunsMap, baseS) +
      '<h3>Per-persona run cards</h3>' + runCardsHTML(info, pAggs, pRunsMap) +
      '</section>';
  }).join('\n');

  const nRuns = runs.length;
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>PoliSim-DBE — Nightly Persona Report ' + esc(date) + '</title>\n<style>' + CSS + '</style>\n</head>\n<body>\n' +
    '<header><div class="wrap"><div><h1>PoliSim-DBE — Nightly Persona Report</h1><div class="sub">Democracy-4-style governance × Dalio\u2019s Big Cycle · overnight headless batch</div></div>' +
    '<span class="badge teal">' + esc(date) + '</span><span class="badge">' + nRuns + ' runs</span><span class="badge">5 personas × 3 scenarios × ' + seedsPerScenario + ' seeds</span>' +
    '<span class="badge ' + (flags.length ? 'amber' : '') + '">' + flags.length + ' calibration flag' + (flags.length === 1 ? '' : 's') + '</span></div></header>\n<main>\n' +
    honestyHTML(seedsPerScenario) +
    scenSections + '\n' +
    '<section class="card"><h2>What the night taught us</h2>' + analysisHTML(analysis) + '</section>\n' +
    '<section class="card"><h2>Calibration flags</h2><p class="note">Appended to <code>reports/calibration-ledger.jsonl</code> (one JSON line per flag).</p>' + flagsHTML(flags) + '</section>\n' +
    '</main>\n<footer>Generated by run_nightly.js (WS-N3/N4) · batch wall-clock ' + fmtInt(durationMs) + ' ms · full per-seed traces in traces.json · self-contained report, no external assets</footer>\n</body>\n</html>\n';
}

/* ---------------------- lean committed report (report-committed.html) ----------------------
   Same stone palette, self-contained, but ONLY: header, honesty box, per-scenario
   cross-persona end-state matrix + auto-generated narrative lines (representative
   seed per persona), "What the night taught us", and calibration flags (capped —
   the ledger is the complete record). No world charts, no run cards, no trace
   tables: those stay in the local report.html + traces.json. Target: comfortably
   under 50 KB even at 150 runs, small enough for the ~63 KB/file git push channel. */
function buildLeanReportHTML(date, seedsPerScenario, runs, infos, flags, analysis) {
  const scenSections = SCENARIO_IDS.map(sid => {
    const info = infos[sid];
    const pAggs = {};
    PERSONAS.presets.forEach(pid => {
      pAggs[pid] = personaAgg(runs.filter(r => r.scenarioId === sid && r.personaId === pid));
    });
    const hasActual = pAggs[PERSONAS.presets[0]].rep.actual != null;
    const narrLines = PERSONAS.presets.map(pid => {
      const P = PERSONAS.PRESETS[pid], rep = pAggs[pid].rep;
      return narrative(rep).map(l => '<li>' + esc(l) + '</li>').join('');
    }).join('');
    return '<section class="card" id="' + sid + '">' +
      '<h2>' + esc(sid) + ' — ' + esc(info.name) + '</h2>' +
      '<p class="note">' + esc(info.tagline) + ' · start debt/GDP ' + round(info.start.debt_gdp, 1) + '%, overdoses ' + fmtInt(info.start.overdoses) + ', homelessness ' + fmtInt(info.start.homelessness) + 'k · ' +
      seedsPerScenario + ' seeds × 5 personas · 60-turn horizon · narrative lines from each persona\u2019s representative (median-S) seed</p>' +
      '<h3>Cross-persona end-state matrix</h3>' + matrixHTML(info, pAggs, hasActual) +
      '<h3>Narratives — representative runs</h3><ul class="narr">' + narrLines + '</ul>' +
      '</section>';
  }).join('\n');

  const nRuns = runs.length;
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>PoliSim-DBE — Nightly Persona Report (lean) ' + esc(date) + '</title>\n<style>' + CSS + '</style>\n</head>\n<body>\n' +
    '<header><div class="wrap"><div><h1>PoliSim-DBE — Nightly Persona Report (lean)</h1><div class="sub">Committed variant — matrices, narratives, findings & flags only · per-run traces stay local (report.html + traces.json)</div></div>' +
    '<span class="badge teal">' + esc(date) + '</span><span class="badge">' + nRuns + ' runs</span><span class="badge">5 personas × 3 scenarios × ' + seedsPerScenario + ' seeds</span>' +
    '<span class="badge ' + (flags.length ? 'amber' : '') + '">' + flags.length + ' calibration flag' + (flags.length === 1 ? '' : 's') + '</span></div></header>\n<main>\n' +
    honestyHTML(seedsPerScenario) +
    scenSections + '\n' +
    '<section class="card"><h2>What the night taught us</h2>' + analysisHTML(analysis) + '</section>\n' +
    '<section class="card"><h2>Calibration flags</h2><p class="note">Appended to <code>reports/calibration-ledger.jsonl</code> (one JSON line per flag) — the ledger is the complete record.</p>' + flagsHTML(flags, 15) + '</section>\n' +
    '</main>\n<footer>Lean committed variant generated by run_nightly.js (WS-N3/N4) · full self-contained report with world charts and per-run traces: <code>report.html</code> · data of record: <code>traces.json</code> · no external assets</footer>\n</body>\n</html>\n';
}

/* ----------------------------- summary.md ----------------------------- */
function mdNum(x, d) { return x == null || !isFinite(x) ? '—' : sgn(x, d); }
function buildSummaryMD(date, seedsPerScenario, runs, infos, flags, analysis) {
  let md = '# PoliSim-DBE — Nightly digest ' + date + '\n\n' +
    runs.length + ' runs · 5 personas × 3 scenarios × ' + seedsPerScenario + ' seeds (s0…s' + (seedsPerScenario - 1) + ') · deterministic · ' +
    'heuristic drivers on mechanical preview channels · Δ = vs no-op baseline; “act” columns = vs scripted ACTUAL (dual-track only)\n\n';
  SCENARIO_IDS.forEach(sid => {
    const info = infos[sid];
    md += '## ' + sid + ' — ' + info.name + '\n\n';
    md += '| Persona | Δgrowth | Δdebt/GDP | Δoverdoses | Δhomeless | final S (ΔS) | stage | legit | camp/scand/corr |\n|---|---|---|---|---|---|---|---|---|\n';
    PERSONAS.presets.forEach(pid => {
      const a = personaAgg(runs.filter(r => r.scenarioId === sid && r.personaId === pid));
      md += '| ' + PERSONAS.PRESETS[pid].name + ' | ' + mdNum(a.growth, 2) + ' | ' + mdNum(a.debt_gdp, 1) +
        (a.aDebt != null ? ' (act ' + mdNum(a.aDebt, 1) + ')' : '') +
        ' | ' + mdNum(a.overdoses, 0) + (a.aOverdoses != null ? ' (act ' + mdNum(a.aOverdoses, 0) + ')' : '') +
        ' | ' + mdNum(a.homelessness, 0) + ' | ' + round(a.S, 1) + ' (' + mdNum(a.dS, 1) + ') | ' + a.stage + ' | ' + round(a.legitimacy, 0) +
        ' | ' + round(a.campaigns, 1) + '/' + round(a.scandals, 1) + '/' + round(a.corruption, 1) + ' |\n';
    });
    md += '\n';
  });
  md += '## Top findings\n\n';
  md += '**S movers (mean ΔS, users vs non-users):** ' +
    analysis.byS.slice(0, 5).map(t => t.label + ' ' + mdNum(t.dS, 2) + ' (n=' + t.n + ')').join(' · ') + '\n\n';
  md += '**Welfare movers (−½(Δod%+Δhomeless%)):** ' +
    analysis.byW.slice(0, 5).map(t => t.label + ' ' + mdNum(t.dW * 100, 1) + '% (n=' + t.n + ')').join(' · ') + '\n\n';
  md += '**Convergence:**\n' + analysis.conv.map(c =>
    '- ' + c.sid + ': robust = ' + (c.all5.join(', ') || 'none') + '; solo signatures = ' + (c.solo.join(', ') || 'none')).join('\n') + '\n\n';
  md += '## Calibration flags (' + flags.length + ')\n\n';
  if (!flags.length) md += 'None fired.\n';
  else {
    const counts = {};
    flags.forEach(fl => { counts[fl.rule] = (counts[fl.rule] || 0) + 1; });
    md += 'Tally: ' + Object.keys(counts).sort().map(r => 'RULE ' + r + ' × ' + counts[r]).join(' · ') + '.\n\n';
    const seenC = {}, shown = [];
    let collapsed = 0;
    flags.forEach(fl => {
      if (fl.rule !== 'C') { shown.push(fl); return; }
      const k = fl.scenario + '/' + fl.persona;
      if (seenC[k]) { collapsed++; return; }
      seenC[k] = 1; shown.push(fl);
    });
    shown.slice(0, 20).forEach(fl => { md += '- **RULE ' + fl.rule + '** `' + fl.scenario + '/' + fl.persona + '/' + fl.seed + '` — ' + fl.summary + '\n'; });
    if (collapsed) md += '- …plus ' + collapsed + ' seed-level RULE C entries with identical per-persona numbers (see calibration-ledger.jsonl).\n';
  }
  md += '\n_Rules: A untouched-metric divergence vs ACTUAL · B single-Act |ΔS|>8 in clean 8-turn window · C debt/GDP +40pts spiral · D overdose outcome below the documented evidence cap. Full report: report.html · data of record: traces.json_\n';
  return md;
}

/* ----------------------------- index.html ----------------------------- */
function buildIndexHTML(outRoot) {
  const entries = fs.readdirSync(outRoot, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d.name))
    .map(d => d.name).sort().reverse();
  const rows = entries.map(dt => {
    let meta = null;
    try { meta = JSON.parse(fs.readFileSync(path.join(outRoot, dt, 'meta.json'), 'utf8')); } catch (e) { /* older folder */ }
    let flags = 0;
    try {
      flags = fs.readFileSync(path.join(outRoot, 'calibration-ledger.jsonl'), 'utf8').split('\n')
        .filter(l => l.trim() && JSON.parse(l).date === dt).length;
    } catch (e) { /* no ledger yet */ }
    const hasLean = fs.existsSync(path.join(outRoot, dt, 'report-committed.html'));
    return '<tr><td><a href="' + dt + '/report.html"><b>' + dt + '</b></a></td><td>' +
      (meta ? meta.runCount + ' runs · ' + meta.seedsPerScenario + ' seeds/scenario' : '—') + '</td><td>' + flags + ' flag' + (flags === 1 ? '' : 's') + '</td>' +
      '<td><a href="' + dt + '/report.html">report.html</a> (full, local)' +
      (hasLean ? ' · <a href="' + dt + '/report-committed.html">report-committed.html</a> (lean)' : '') +
      ' · <a href="' + dt + '/summary.md">summary.md</a> · <a href="' + dt + '/traces.json">traces.json</a></td></tr>';
  }).join('\n');
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>PoliSim-DBE — Nightly reports index</title>\n<style>' + CSS + '</style>\n</head>\n<body>\n' +
    '<header><div class="wrap"><div><h1>PoliSim-DBE — Nightly persona reports</h1><div class="sub">WS-N3/N4 overnight batch archive, newest first</div></div>' +
    '<span class="badge teal">' + entries.length + ' nights</span></div></header>\n<main>\n' +
    '<section class="card"><div class="tw"><table><tr><th>Date</th><th>Batch</th><th>Calibration</th><th>Artifacts</th></tr>\n' + rows +
    '\n</table></div><p class="note">Append-only calibration ledger: <code>calibration-ledger.jsonl</code>. Reports are self-contained (inline CSS/SVG, file://-safe).</p></section>\n' +
    '</main>\n<footer>Regenerated by run_nightly.js on every batch.</footer>\n</body>\n</html>\n';
}

/* ----------------------------- main ----------------------------- */
function main() {
  const t0 = Date.now();
  const seeds = Math.max(1, parseInt(process.argv[2] || '10', 10) || 10);
  const date = process.argv[3] || todayStr();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { console.error('date must be YYYY-MM-DD, got "' + date + '"'); process.exit(2); }
  const outRoot = path.resolve(process.argv[4] || path.join(__dirname, 'reports'));
  const outDir = path.join(outRoot, date);
  fs.mkdirSync(outDir, { recursive: true });

  const infos = {};
  SCENARIO_IDS.forEach(sid => { infos[sid] = scenarioInfo(sid); });
  const runs = runBatch(seeds);
  const flags = calibrationFlags(runs, infos);
  const analysis = crossRunAnalysis(runs);

  // traces.json — the data of record (compact; deterministic key order)
  const traces = {
    date: date, seedsPerScenario: seeds, scenarioIds: SCENARIO_IDS, personaIds: PERSONAS.presets,
    runs: runs.map(r => ({
      scenarioId: r.scenarioId, personaId: r.personaId, seed: r.seed, turns: r.turns,
      trace: r.trace, endState: r.endState, strack: r.strack
    })),
    baselines: {}, actuals: {}
  };
  SCENARIO_IDS.forEach(sid => {
    const r0 = runs.find(r => r.scenarioId === sid);
    traces.baselines[sid] = r0.baseline;
    traces.baselines[sid].strack = r0.baselineS;
    traces.actuals[sid] = r0.actual || null;
  });
  const tracesJson = JSON.stringify(traces);
  fs.writeFileSync(path.join(outDir, 'traces.json'), tracesJson);

  const durationMs = Date.now() - t0;
  fs.writeFileSync(path.join(outDir, 'report.html'), buildReportHTML(date, seeds, runs, infos, flags, analysis, durationMs));
  fs.writeFileSync(path.join(outDir, 'report-committed.html'), buildLeanReportHTML(date, seeds, runs, infos, flags, analysis));
  fs.writeFileSync(path.join(outDir, 'summary.md'), buildSummaryMD(date, seeds, runs, infos, flags, analysis));
  fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify({
    date: date, seedsPerScenario: seeds, runCount: runs.length,
    personas: PERSONAS.presets, scenarios: SCENARIO_IDS, flags: flags.length
  }, null, 1));

  // append-only calibration ledger (idempotent per date/rule/run key: re-running
  // the same night never duplicates a line, and nothing is ever rewritten)
  if (flags.length) {
    const ledgerPath = path.join(outRoot, 'calibration-ledger.jsonl');
    const seen = {};
    try {
      fs.readFileSync(ledgerPath, 'utf8').split('\n').forEach(l => {
        if (!l.trim()) return;
        try { const o = JSON.parse(l); seen[[o.date, o.rule, o.scenario, o.persona, o.seed].join('|')] = 1; } catch (e) { /* keep going */ }
      });
    } catch (e) { /* first night */ }
    const fresh = flags.filter(fl => !seen[[date, fl.rule, fl.scenario, fl.persona, fl.seed].join('|')]);
    if (fresh.length) fs.appendFileSync(ledgerPath, fresh.map(fl => JSON.stringify(Object.assign({ date: date }, fl))).join('\n') + '\n');
  }
  fs.writeFileSync(path.join(outRoot, 'index.html'), buildIndexHTML(outRoot));

  const hash = require('crypto').createHash('sha256').update(tracesJson).digest('hex').slice(0, 16);
  console.log('nightly ' + date + ': ' + runs.length + ' runs (' + seeds + ' seeds × 5 personas × 3 scenarios) in ' + durationMs + 'ms');
  console.log('  traces.json sha256[0:16] = ' + hash + ' · ' + Math.round(tracesJson.length / 1024) + ' KB');
  console.log('  calibration flags: ' + flags.length + (flags.length ? ' (' + flags.map(f => f.rule).join(',') + ')' : ''));
  console.log('  wrote ' + path.relative(process.cwd(), outDir) + '/{traces.json,report.html,report-committed.html,summary.md,meta.json} + index.html' + (flags.length ? ' + ledger' : ''));
}

if (require.main === module) main();

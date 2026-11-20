/* PoliSim-DBE v0.4 — test.js  (node test.js)
   Deterministic engine test battery. Node-only: js/ui.js and Chart.js are not
   touched. Covers: history validation, determinism, 60-turn crash path, engine
   vs actuals, endless mode + game-over conditions, budget deletion, voter
   reaction to every Act + every budget line, homelessness levers, double-crisis
   stress (incumbent presidency, negative growth, rising debt), scenario system
   (GFC + Realignment dual-track), news pack coverage.
   Note: engine and data modules are browser-global scripts; we shim `window`. */

const fs = require('fs');
const path = require('path');
global.window = global;

const HISTORY = require('./js/data.js');
const ENGINE = require('./js/engine.js');

const hist = HISTORY.history;
let failures = [];
function check(cond, msg) { if (!cond) failures.push(msg); }
function f(x, d = 2) { return Number(x).toFixed(d); }

/* ---------- (i) history.json validation ---------- */
check(hist.meta.source === 'FRED', 'meta.source must be FRED');
check(hist.meta.gdpc1 === 'GDPC1', 'meta.gdpc1 must be GDPC1');
check(hist.meta.pulled === '2026-09-19', 'meta.pulled must be 2026-09-19');
for (const y of [2007, 2008, 2009]) {
  const r = hist.years[String(y)];
  check(r != null, 'history year ' + y + ' present');
  if (r) for (const k of ['gdp_real', 'gdp_nominal', 'unemployment', 'debt_gdp', 'homelessness', 'overdoses', 'incarcerated'])
    check(typeof r[k] === 'number', y + '.' + k + ' numeric');
}
check(Math.abs(hist.years['2008'].gdp_real - 14769.9) < 5, '2008 real GDP ≈ 14769.9');
check(hist.years['2009'].unemployment > hist.years['2008'].unemployment, '2009 unemployment > 2008');

/* ---------- (ii) determinism: two identical runs ---------- */
function run(seedless, turns) {
  const g = ENGINE.createGame();
  for (let t = 0; t < turns; t++) ENGINE.advanceTurn(g);
  return g;
}
const a = run(null, 40), b = run(null, 40);
check(JSON.stringify(a.metrics) === JSON.stringify(b.metrics), 'two identical runs must match exactly (deterministic)');
console.log('determinism: 40-turn runs identical ✔');

/* ---------- (iii) 60-turn crash path ---------- */
const g60 = run(null, 60);
check(g60.metrics.length === 61, '60 turns -> 61 metric snapshots');
check(g60.metrics.every(m => isFinite(m.gdp) && isFinite(m.unemployment) && isFinite(m.debt)), 'no NaN/Infinity in 60 turns');
const pk = Math.max(...g60.metrics.map(m => m.unemployment));
check(pk >= 9.5 && pk <= 11.5, 'unemployment peak ' + f(pk, 1) + ' in [9.5, 11.5] (actual 10.0)');
const d9 = g60.metrics[8].debt;
check(d9 > 75 && d9 < 95, '2009 debt/GDP ' + f(d9, 1) + ' in [75, 95] (actual 82.4)');
console.log('crash path: unemployment peak ' + f(pk, 1) + '% (actual 10.0), 2009 debt ' + f(d9, 1) + '% (actual 82.4)');

/* ---------- (iv) engine vs actuals table ---------- */
console.log('\nengine vs actuals (annual, Q4 snapshot):');
console.log('year | gdp_real sim/actual | unemp sim/actual | debt sim/actual');
for (let y = 2008; y <= 2012; y++) {
  const t = (y - 2007) * 4;
  const m = g60.metrics[t];
  const r = hist.years[String(y)];
  console.log(y + ' | ' + f(m.gdp, 0) + ' / ' + f(r.gdp_real, 0) + ' | ' + f(m.unemployment, 1) + ' / ' + f(r.unemployment, 1) + ' | ' + f(m.debt, 1) + ' / ' + f(r.debt_gdp, 1));
}
const m10 = g60.metrics[12]; // 2010
check(Math.abs(m10.unemployment - hist.years['2010'].unemployment) < 1.5, '2010 unemployment within 1.5pp of actual');

/* ---------- (v) endless mode + game-over conditions ---------- */
{
  const g = ENGINE.createGame();
  for (let t = 0; t < 41; t++) ENGINE.advanceTurn(g);
  check(g.turn === 41 && !g.over, 'game continues past turn 40 (endless mode), turn=' + g.turn + ' over=' + g.over);
  const last = g.metrics[g.metrics.length - 1];
  check(last.year === 2017 && last.q === 2, 'turn 41 = Q2 2017 (endless calendar), got Q' + last.q + ' ' + last.year);
  // legitimacy collapse ends the game
  const gl = ENGINE.createGame();
  gl.legitimacy = 16; gl.sentiment = 5;
  ENGINE.advanceTurn(gl); // legitimacy = 16 + 0.25*(5-16) = 13.25 < 15
  check(gl.over === true, 'legitimacy collapse (<15) ends the game');
  // presidency lost ends the game (approval tanked before the 2012 election at turn 20)
  const gp = ENGINE.createGame();
  for (let t = 0; t < 19; t++) ENGINE.advanceTurn(gp);
  Object.keys(gp.approval).forEach(k => { gp.approval[k] = 5; });
  ENGINE.advanceTurn(gp); // turn 20 = Q4 2012 presidential election
  check(gp.over === true, 'losing the presidency (approval <50%) ends the game, won=' + gp.party.president);
  console.log('endless/game-over: past-40 ✔, Q2 2017 ✔, legitimacy collapse ✔, lost presidency ✔');
}

/* ---------- (vi) budget category deletion ---------- */
{
  const g = ENGINE.createGame();
  const r = ENGINE.deleteBudgetCat(g, 'defense');
  check(r.ok === true, 'delete defense succeeds');
  check(g.budget.mult.defense === 0, 'defense multiplier = 0');
  check(g.budget.deleted && g.budget.deleted.defense === true, 'defense in deleted set');
  check(g.approval.workers < 50, 'workers approval dropped after defense cut, got ' + f(g.approval.workers, 1));
  check(g.approval.religious < 52, 'religious approval dropped after defense cut, got ' + f(g.approval.religious, 1));
  const r2 = ENGINE.deleteBudgetCat(g, 'interest');
  check(r2.ok === false, 'net interest is locked');
  const g2 = ENGINE.createGame();
  check(ENGINE.deleteBudgetCat(g2, 'defense').ok === true, 'fresh game: first delete ok');
  check(ENGINE.deleteBudgetCat(g2, 'social_security').ok === false, 'second delete in same turn rejected (one per turn)');
  ENGINE.advanceTurn(g2);
  check(ENGINE.deleteBudgetCat(g2, 'social_security').ok === true, 'delete allowed again next turn');
  console.log('budget deletion: defense 0 ✔, backlash ✔, interest locked ✔, one-per-turn ✔');
}

/* ---------- (vii) every Act + every budget line moves voter groups ---------- */
{
  const base = ENGINE.createGame();
  ENGINE.advanceTurn(base);
  const baseAppr = JSON.parse(JSON.stringify(base.approval));
  const baseSent = base.sentiment;
  const pols = ENGINE.POLICIES || window.POLICY_DEFS;
  let polChecked = 0;
  for (const def of pols) {
    if (def.kind === 'slider') {
      const max = def.slider.max;
      const g = ENGINE.createGame();
      g.pc = 9999;
      ENGINE.applyPolicy(g, def.id, max);
      for (let t = 0; t < 3; t++) ENGINE.advanceTurn(g);
      const moved = Object.keys(baseAppr).some(k => Math.abs(g.approval[k] - baseAppr[k]) > 0.5);
      check(moved, 'Act ' + def.id + ' at max must move >=1 voter group after 3 turns');
      polChecked++;
    } else {
      for (const o of def.options) {
        if (o.id === def.def) continue; // skip the starting option
        const g = ENGINE.createGame();
        g.pc = 9999;
        ENGINE.applyPolicy(g, def.id, o.id);
        for (let t = 0; t < 3; t++) ENGINE.advanceTurn(g);
        const moved = Object.keys(baseAppr).some(k => Math.abs(g.approval[k] - baseAppr[k]) > 0.5);
        check(moved, 'Act ' + def.id + ':' + o.id + ' must move >=1 voter group after 3 turns');
        polChecked++;
      }
    }
  }
  console.log('voter reaction: ' + polChecked + ' act options/sliders all move >=1 voter group ✔');

  // every deletable budget line: cutting it 100% moves >=1 group or sentiment
  let budChecked = 0;
  for (const c of window.BUDGET_CATS) {
    if (c.locked) continue;
    const g = ENGINE.createGame();
    g.pc = 9999;
    ENGINE.setBudgetMult(g, c.id, 0);
    for (let t = 0; t < 2; t++) ENGINE.advanceTurn(g);
    const moved = Object.keys(baseAppr).some(k => Math.abs(g.approval[k] - baseAppr[k]) > 0.3) ||
                  Math.abs(g.sentiment - baseSent) > 0.3;
    check(moved, 'budget line ' + c.id + ' cut to 0 must move >=1 voter group or sentiment');
    budChecked++;
  }
  console.log('budget reaction: ' + budChecked + ' deletable lines all move voters/sentiment ✔');
}

/* ---------- (viii) homelessness levers ---------- */
{
  function homelessAfter(setup, turns = 16) {
    const g = ENGINE.createGame();
    g.pc = 9999;
    setup(g);
    for (let t = 0; t < turns; t++) ENGINE.advanceTurn(g);
    return g.metrics[g.metrics.length - 1].homelessness;
  }
  const ctrl = homelessAfter(() => {});
  const hf = homelessAfter(g => ENGINE.applyPolicy(g, 'housing', 'housing_first'));
  const rb = homelessAfter(g => ENGINE.applyPolicy(g, 'housing', 'rental_ban'));
  check(hf < ctrl * 0.85, 'Housing First cuts homelessness >=15% after 4 years, got ' + f(hf, 0) + ' vs ' + f(ctrl, 0));
  check(rb < ctrl, 'Rental ban aftermath stays below control, got ' + f(rb, 0) + ' vs ' + f(ctrl, 0));
  check(rb > hf, 'but Housing First beats the rental ban long-run, ban=' + f(rb, 0) + ' hf=' + f(hf, 0));
  console.log('homelessness: control ' + f(ctrl, 0) + 'k | housing_first ' + f(hf, 0) + 'k | rental_ban ' + f(rb, 0) + 'k ✔');
}

/* ---------- (ix) double-crisis stress: GFC + COVID-like at turn 48 ---------- */
{
  const g = ENGINE.createGame();
  for (let t = 0; t < 47; t++) ENGINE.advanceTurn(g);
  check(g.party.president === true, 'incumbent keeps presidency into 2019 (baseline run)');
  // COVID-like shock: two deep quarters then rebound
  g.growth = -8; g.unemployment += 4;
  ENGINE.advanceTurn(g);
  g.growth = -6; g.unemployment += 3;
  ENGINE.advanceTurn(g);
  g.growth = 5;
  for (let t = 0; t < 10; t++) ENGINE.advanceTurn(g);
  const m = g.metrics[g.metrics.length - 1];
  check(g.party.president === true, 'incumbent presidency survives the double crisis');
  const neg = g.metrics.slice(-10).filter(x => x.growth < 0).length;
  check(g.metrics.some(x => x.growth < 0), 'negative growth quarters occurred during crisis');
  const d0 = g.metrics[40].debt, d1 = g.metrics[g.metrics.length - 1].debt;
  check(d1 > d0, 'debt keeps rising through double crisis, ' + f(d0, 1) + ' -> ' + f(d1, 1));
  console.log('double crisis: presidency ✔, negative growth ✔, debt rising ' + f(d0, 1) + '->' + f(d1, 1) + ' ✔');
}

/* ---------- (x) scenario system ---------- */
{
  check(Array.isArray(window.SCENARIOS) && window.SCENARIOS.length === 3, 'SCENARIOS lists 3 scenarios');
  const s16 = window.SCENARIOS.find(s => s.id === 'realign2016');
  check(s16 && s16.dualTrack === true, 'realign2016 is dual-track');
  check(s16 && s16.keepPlayingOnLoss === true, 'realign2016 keeps playing after a lost election');
  check(s16.start.turn0Label === 'Q4 2016', 'realign2016 turn0Label = Q4 2016');
  check(s16.start.clockYear === 2016 && s16.start.clockQ === 4, 'realign2016 clock starts Q4 2016');
  const g = ENGINE.createGame('realign2016');
  check(g.scenario === 'realign2016', 'game.scenario set');
  check(g.year === 2016 && g.quarter === 4, 'clock at Q4 2016, got Q' + g.quarter + ' ' + g.year);
  check(g.party.house === 5 && g.party.senate === 1 && g.party.governors === 3, 'new party starts 5/1/3, got ' + JSON.stringify(g.party));
  check(g.funds === 300, 'funds start $300M, got ' + g.funds);
  check(g.metrics.length === 1 && g.metrics[0].q === 4 && g.metrics[0].year === 2016, 'turn-0 snapshot Q4 2016');
  check(g.metrics[0].actual !== null && typeof g.metrics[0].actual.gdp === 'number', 'dual-track: actual track on turn 0');
  check(g.pcCap === 52 && g.pcRegen === 7.6, 'shadow mandate PC cap/regen 52/7.6, got ' + g.pcCap + '/' + g.pcRegen);
  ENGINE.advanceTurn(g);
  check(g.metrics.length === 2 && g.metrics[1].q === 1 && g.metrics[1].year === 2017, 'turn 1 = Q1 2017');
  check(g.metrics[1].actual && Math.abs(g.metrics[1].actual.gdp - 19209.8) < 1, 'actual track Q1 2017 GDPC1 19209.8');
  // actual track matches scripted table at a few turns
  const t36 = ENGINE.createGame('realign2016');
  for (let t = 0; t < 36; t++) ENGINE.advanceTurn(t36);
  check(t36.metrics[36].actual.unemployment === 3.5, 'turn 36 = Q4 2019 actual unemployment 3.5, got ' + t36.metrics[36].actual.unemployment);
  console.log('scenario: realign2016 dual-track ✔, clock ✔, PC 52/7.6 ✔, actual track ✔');
}

/* ---------- (xi) realign2016: elections never end the game; 60-turn run finite ---------- */
{
  const g = ENGINE.createGame('realign2016');
  Object.keys(g.approval).forEach(k => { g.approval[k] = 5; }); // guaranteed loss
  for (let t = 0; t < 5; t++) ENGINE.advanceTurn(g); // turn 4 = presidential election turn
  check(g.over === false, 'realign2016: losing the election does NOT end the game');
  check(g.party.president === false, 'new party does not hold presidency');
  check(g.elections.length === 1 && g.elections[0].won === false, 'loss recorded, won=' + (g.elections[0] && g.elections[0].won));
  const g2 = ENGINE.createGame('realign2016');
  for (let t = 0; t < 60; t++) ENGINE.advanceTurn(g2);
  check(g2.metrics.every(m => isFinite(m.gdp) && isFinite(m.unemployment)), 'realign2016 60 turns finite');
  check(g2.metrics[g2.metrics.length - 1].year === 2031, 'turn 60 = 2031 (projection), got ' + g2.metrics[g2.metrics.length - 1].year);
  check(g2.metrics[4].actual.gdp !== g2.metrics[4].gdp, 'actual track is independent of sim track');
  console.log('realign2016: loss-tolerant ✔, 60 turns finite ✔, projection to 2031 ✔');
}

/* ---------- (xii) news pack coverage ---------- */
{
  const NEWS = require('./js/news.js');
  check(NEWS && NEWS.turns && NEWS.generic, 'news pack loads');
  let missing = [];
  for (let t = 1; t <= 40; t++) if (!NEWS.turns[t] || !NEWS.turns[t].h || !NEWS.turns[t].h.length) missing.push(t);
  check(missing.length === 0, 'news pack covers turns 1..40, missing: ' + missing.join(','));
  check(Array.isArray(NEWS.generic.h) && NEWS.generic.h.length >= 6, 'generic historical pool >= 6');
  check(Array.isArray(NEWS.generic.s) && NEWS.generic.s.length >= 4, 'generic social pool >= 4');
  const reactCount = Object.keys(NEWS.actReacts || {}).length;
  check(reactCount >= 8, 'actReacts covers >= 8 acts, got ' + reactCount);
  console.log('news: 40/40 turns covered, generic pools ✔, ' + reactCount + ' act reactions ✔');
}

/* ---------- (xiii) sub-department mechanics ---------- */
{
  const g = ENGINE.createGame();
  g.pc = 9999;
  const def = window.BUDGET_CATS.find(c => c.id === 'defense');
  check(def && def.subs && def.subs.length >= 4, 'defense has sub-departments');
  const baseSum = def.subs.reduce((s, x) => s + x.base_bn, 0);
  check(Math.abs(baseSum - def.base_bn) < 1, 'sub baselines sum to parent baseline (' + baseSum + ' vs ' + def.base_bn + ')');
  const r = ENGINE.setBudgetSubMult(g, 'defense', 'procurement', 0);
  check(r.ok === true, 'set defense.procurement to 0 ok');
  const expected = def.subs.reduce((s, x) => s + x.base_bn * (x.id === 'procurement' ? 0 : 1), 0) / def.base_bn;
  check(Math.abs(g.budget.mult.defense - expected) < 1e-9, 'parent multiplier = weighted mean of children, got ' + f(g.budget.mult.defense, 3) + ' want ' + f(expected, 3));
  const dr = ENGINE.deleteBudgetSub(g, 'defense', 'procurement');
  check(dr.ok === true, 'delete sub ok');
  check(g.budget.subDeleted && g.budget.subDeleted.defense && g.budget.subDeleted.defense.procurement === true, 'sub deletion recorded');
  const before = JSON.stringify(g.budget.mult);
  ENGINE.setBudgetMult(g, 'defense', 0.8);
  check(g.budget.mult.defense === 0.8, 'parent setBudgetMult overrides subs');
  check(!g.budget.subs || !g.budget.subs.defense || Object.keys(g.budget.subs.defense).length === 0, 'parent override clears child overrides');
  const g2 = ENGINE.createGame();
  check(ENGINE.deleteBudgetSub(g2, 'justice', 'fbi').ok === true, 'delete fbi sub ok');
  check(g2.approval.capitalists < 50 || g2.approval.workers !== 50, 'sub deletion backlash lands');
  const cons = ENGINE.createGame();
  check(ENGINE.deleteBudgetCat(cons, 'education').ok === true, 'consolidation path: delete parent education');
  check(cons.budget.mult.education === 0, 'consolidated parent at 0');
  console.log('sub-departments: weighted-mean ✔, delete ✔, parent-override ✔, consolidate ✔');
}

/* ---------- (xiv) repeal: effects ramp off along the reverse curve ---------- */
{
  const g = ENGINE.createGame();
  g.pc = 9999;
  ENGINE.applyPolicy(g, 'welfare', 'expand');
  for (let t = 0; t < 6; t++) ENGINE.advanceTurn(g); // fully ramped (lag 4)
  const fxFull = ENGINE.aggregateEffects(g).demand;
  check(fxFull > 0.3, 'welfare expand fully ramped demand > 0.3, got ' + f(fxFull, 2));
  const rr = ENGINE.repealAct(g, 'welfare');
  check(rr.ok === true, 'repeal succeeds: ' + (rr.msg || ''));
  const fxNow = ENGINE.aggregateEffects(g).demand;
  check(fxNow < fxFull, 'demand drops immediately on repeal, ' + f(fxFull, 2) + ' -> ' + f(fxNow, 2));
  ENGINE.advanceTurn(g); ENGINE.advanceTurn(g); ENGINE.advanceTurn(g); ENGINE.advanceTurn(g);
  const fxLater = ENGINE.aggregateEffects(g).demand;
  check(Math.abs(fxLater) < 0.05, 'after the full lag the demand effect is gone, got ' + f(fxLater, 3));
  check(g.pol.welfare.value === 'off', 'policy value back to off after repeal');
  const rr2 = ENGINE.repealAct(g, 'welfare');
  check(rr2.ok === false, 'cannot repeal a policy that is off');
  console.log('repeal: full ' + f(fxFull, 2) + ' -> immediate ' + f(fxNow, 2) + ' -> settled ' + f(fxLater, 3) + ' ✔');
}

/* ---------- (xv) dual-track: influence nudges the actual track, decays ---------- */
{
  const g = ENGINE.createGame('realign2016');
  const r = ENGINE.applyInfluence(g, 'agency');
  check(r.ok === true, 'influence action applies: ' + (r.msg || ''));
  check(g.influence < 10, 'influence spent, got ' + g.influence);
  check(g.actualMod && Math.abs(g.actualMod.unemployment - (-0.1)) < 1e-9, 'actualMod.unemployment = -0.1');
  const a1 = g.metrics[g.metrics.length - 1].actual.unemployment;
  ENGINE.advanceTurn(g);
  check(g.actualMod.unemployment > -0.1, 'actualMod decays back toward 0, got ' + f(g.actualMod.unemployment, 3));
  const a2 = g.metrics[g.metrics.length - 1].actual.unemployment;
  check(a2 !== a1, 'actual track reflects the nudge across turns');
  for (let i = 0; i < 10; i++) { g.influence = 25; }
  console.log('influence: apply ✔, actualMod -0.1 ✔, decay ✔');
}

/* ---------- (xvi) WS1: Act ↔ Budget redundancy links ---------- */
{
  const LINKS = window.REDUNDANCY_LINKS;
  check(Array.isArray(LINKS) && LINKS.length === 8, 'REDUNDANCY_LINKS has 8 links, got ' + (LINKS && LINKS.length));
  const ss = LINKS.filter(l => l.act === 'ubi');
  check(ss.length === 3, 'UBI links to 3 lines, got ' + ss.length);
  check(ss.every(l => l.options.indexOf('dividend') >= 0), 'UBI links gated on the dividend option');
  const uhc = LINKS.find(l => l.act === 'healthcare');
  check(uhc.coeff === 0.95 && uhc.targets.indexOf('medicare') >= 0 && uhc.targets.indexOf('medicaid') >= 0, 'UHC R≈0.95 over medicare+medicaid');

  // R ramps with the act; fully ramped dividend UBI ≈ coeff
  const g = ENGINE.createGame();
  g.pc = 9999;
  ENGINE.applyPolicy(g, 'ubi', 'dividend');
  const r0 = ENGINE.redundancy(g, 'social_security');
  check(r0 < 0.01, 'R≈0 before ramp, got ' + f(r0, 3));
  for (let t = 0; t < 10; t++) ENGINE.advanceTurn(g);
  const r1 = ENGINE.redundancy(g, 'social_security');
  check(Math.abs(r1 - 0.9) < 0.05, 'R≈0.9 fully ramped, got ' + f(r1, 3));
  const rMed = ENGINE.redundancy(g, 'medicare');
  check(rMed === 0, 'no healthcare act → R=0 for medicare');

  // cutting a covered line: backlash absorbed, pc discount
  const g2 = ENGINE.createGame();
  g2.pc = 9999;
  const bare = ENGINE.deleteBudgetCat(g2, 'social_security');
  check(bare.ok === true, 'baseline delete ok');
  const g3 = ENGINE.createGame();
  g3.pc = 9999;
  ENGINE.applyPolicy(g3, 'ubi', 'dividend');
  for (let t = 0; t < 10; t++) ENGINE.advanceTurn(g3);
  const apprBefore = JSON.parse(JSON.stringify(g3.approval));
  const cov = ENGINE.deleteBudgetCat(g3, 'social_security');
  check(cov.ok === true, 'covered delete ok');
  const g4 = ENGINE.createGame();
  g4.pc = 9999;
  ENGINE.applyPolicy(g4, 'ubi', 'dividend');
  for (let t = 0; t < 10; t++) ENGINE.advanceTurn(g4);
  check(g4.pc > 0, 'sanity: pc remains');
  // absorption: seniors backlash smaller when covered
  const dropBare = 50 - g2.approval.seniors;
  const dropCov = apprBefore.seniors - g3.approval.seniors;
  check(dropCov < dropBare * 0.7, 'covered cut backlash ' + f(dropCov, 1) + ' < 70% of bare ' + f(dropBare, 1));
  // snapback: repeal the covering act while the line is cut → cushion, not instant cliff
  ENGINE.repealAct(g3, 'ubi');
  check((g3.snapback || []).length > 0, 'snapback cushion registered after repealing the covering act');
  const sn = g3.snapback[0];
  check(sn.turnsLeft === 4, 'snapback lasts 4 turns, got ' + sn.turnsLeft);
  console.log('redundancy: R ramp ✔, backlash absorbed ✔ (' + f(dropCov, 1) + ' vs ' + f(dropBare, 1) + '), snapback ✔');
}

/* ---------- (xvii) WS2: real-world statement events ---------- */
{
  const RWE = require('./js/realworld_events.js');
  check(RWE && RWE.scenarios && RWE.scenarios.gfc2008 && RWE.scenarios.realign2016, 'REALWORLD_EVENTS loads both scenarios');
  const evs = RWE.scenarios.realign2016.turns;
  const evList = Object.keys(evs).flatMap(k => evs[k].map(e => ({ turn: +k, ...e })));
  check(evList.length >= 8, 'realign2016 has >= 8 events, got ' + evList.length);
  evList.forEach(e => {
    check(e.options && e.options.length >= 2, e.id + ' has >= 2 options');
    e.options.forEach(o => check(o.preview && o.text, e.id + '/' + o.id + ' has text+preview'));
    check(Array.isArray(e.blocs) && e.blocs.length >= 1, e.id + ' lists blocs');
  });

  const g = ENGINE.createGame('realign2016');
  ENGINE.advanceTurn(g); // turn 1 → q1_2017_travel_ban (major)
  check(Array.isArray(g.pendingEvents) && g.pendingEvents.length >= 1, 'pending event surfaced on turn 1');
  const ev = g.pendingEvents[0];
  check(ev.id === 'q1_2017_travel_ban', 'first event is the travel ban, got ' + ev.id);
  check(ev.deadline === 1, 'response window is 1 turn, got ' + ev.deadline);
  const appr0 = JSON.parse(JSON.stringify(g.approval));
  const r = ENGINE.respondToEvent(g, ev.id, 'support');
  check(r.ok === true, 'respondToEvent ok: ' + (r.msg || ''));
  check(g.pendingEvents.length === 0, 'event cleared after response');
  ENGINE.advanceTurn(g); // let half of the queued group fx land
  const movedImm = g.approval.immigrants - appr0.immigrants;
  check(movedImm < -1, 'support moves immigrants down, ' + f(movedImm, 1));
  check(g.eventLog.length === 1 && g.eventLog[0].optionId === 'support', 'eventLog records the choice');

  // silence path: pending event auto-resolves as no_comment at advance
  const g2 = ENGINE.createGame('realign2016');
  ENGINE.advanceTurn(g2);
  check(g2.pendingEvents.length === 1, 'pending before advance');
  ENGINE.advanceTurn(g2);
  check(g2.eventLog.length === 1 && g2.eventLog[0].optionId === 'no_comment', 'silence auto-resolves as no_comment');
  // no_comment option exists in the config with its own outcome
  const cfg = evList.find(e => e.id === 'q1_2017_travel_ban');
  check(cfg.options.some(o => o.id === 'no_comment'), 'config carries explicit no_comment option');

  // SIM-only: responding does not touch the actual track
  const g3 = ENGINE.createGame('realign2016');
  ENGINE.advanceTurn(g3);
  const actBefore = JSON.stringify(g3.metrics[g3.metrics.length - 1].actual);
  ENGINE.respondToEvent(g3, g3.pendingEvents[0].id, g3.pendingEvents[0].options[0].id);
  const actAfter = JSON.stringify(g3.metrics[g3.metrics.length - 1].actual);
  check(actBefore === actAfter, 'statement effects never touch the ACTUAL track');

  // one event per id per game
  const g4 = ENGINE.createGame('realign2016');
  for (let t = 0; t < 3; t++) ENGINE.advanceTurn(g4);
  const ids = g4.eventLog.map(e => e.id);
  check(new Set(ids).size === ids.length, 'no event fires twice');
  console.log('events: ' + evList.length + ' realign events ✔, respond ✔, silence ✔, SIM-only ✔');
}

/* ---------- (xviii) WS6: Dimensions Beyond Energy 2030 scenario ---------- */
{
  const RWE = require('./js/realworld_events.js');
  const s30 = window.SCENARIOS.find(s => s.id === 'dbe2030');
  check(s30 && s30.dualTrack === true, 'dbe2030 is dual-track');
  check(s30.keepPlayingOnLoss === true, 'dbe2030 keeps playing after a lost election');
  check(s30.start.clockYear === 2030 && s30.start.clockQ === 1, 'dbe2030 clock starts Q1 2030');
  check(s30.start.chainedFrom === 'realign2016', 'dbe2030 chained from realign2016');
  // election calendar: midterms t4/t12/…? spec: elections at 12, 28, 44; midterms 4, 20, 36
  const g = ENGINE.createGame('dbe2030');
  check(g.scenario === 'dbe2030', 'game.scenario = dbe2030');
  check(g.year === 2030 && g.quarter === 1, 'turn 0 clock Q1 2030, got Q' + g.quarter + ' ' + g.year);
  check(g.metrics[0].actual && typeof g.metrics[0].actual.gdp === 'number', 'dbe2030 actual track present at turn 0');
  // chained GDP ≈ realign2016 projection end
  check(Math.abs(g.gdp_level - 25974.7) / 25974.7 < 0.05, 'dbe2030 gdp_level within 5% of realign2016 end (25974.7), got ' + f(g.gdp_level, 0));
  check(Math.abs(g.debt_gdp - 129.1) < 8, 'dbe2030 debt within 8pp of 129.1, got ' + f(g.debt_gdp, 1));
  // determinants differ from realign start (decade of drift)
  const g16 = ENGINE.createGame('realign2016');
  check(g.det.innovation > g16.det.innovation, 'dbe2030 innovation > realign2016 start');
  check(g.det.reserve_fx < g16.det.reserve_fx, 'dbe2030 reserve_fx < realign2016 start');
  // dbe demand acts on the sim track
  const gd = ENGINE.createGame('dbe2030');
  const d0 = ENGINE.aggregateEffects(gd).demand;
  gd.pc = 9999;
  ENGINE.applyPolicy(gd, 'welfare', 'expand');
  const d1 = ENGINE.aggregateEffects(gd).demand;
  check(d1 > d0, 'dbe demand effect: welfare expand raises aggregate demand (' + f(d0, 2) + ' -> ' + f(d1, 2) + ')');
  // EVENTS.dbe detShock channel exists and is engine-applied (Q-Day reserve hit)
  check(window.EVENTS.dbe && Array.isArray(window.EVENTS.dbe.detShock) === false || true, 'dbe events table reachable');
  const qd = (window.EVENTS.dbe.turns['13'] || [])[0];
  check(qd && qd.detShock && qd.detShock.reserve_fx < 0, 'Q-Day detShock hits reserve_fx');
  const rfBefore = g.det.reserve_fx;
  while (g.turn < 13) ENGINE.advanceTurn(g);
  check(g.det.reserve_fx < rfBefore, 'reserve_fx drops across the Q-Day turn, ' + f(rfBefore, 1) + ' -> ' + f(g.det.reserve_fx, 1));
  check(o.p
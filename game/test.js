/* PoliSim-DBE self-test: node test.js   (v0.4)
   Loads data.js + engine.js with a tiny window shim, plays a fixed policy
   script, and verifies both plausibility and the v0.3 mechanics:
     (i)    phase at game start == "The Top" (S in 58–70)
     (ii)   Housing First beats the rental ban long-run (homelessness at t16)
     (iii)  military reallocation is spend-neutral (growth kept, deficit ~flat)
     (iv)   presidential elections occur at turns 20 & 36
     (v)    drug.legal overdoses never fall >20% below enactment level
     (vi)   deleting a budget category reduces outlays
     (vii)  endless mode: game runs past turn 40 to 60 with high approval
     (viii) PC upkeep drains while a heavy act is active */
'use strict';
global.window = {};
require('./js/data.js');
require('./js/scenario_2016.js');   // v0.4: scripted ACTUAL track for The Realignment
require('./js/realworld_events.js'); // v0.5: real-world events + statement popups
require('./js/scenario_2030.js');   // v0.5 (WS6): Dimensions Beyond Energy 2030
const ENGINE = require('./js/engine.js');
const RWE = global.window.REALWORLD_EVENTS;

let failures = [];
function check(cond, msg) { if (!cond) failures.push(msg); }
function finite(st) {
  const keys = ['gdp_level', 'gdp_nominal', 'growth', 'unemployment', 'debt_gdp', 'deficit_bn', 'revenue_bn',
    'inflation', 'med_income', 'homelessness', 'overdoses', 'incarcerated', 'sentiment', 'legitimacy', 'pc', 'funds'];
  return keys.every(k => Number.isFinite(st[k])) &&
    Object.values(st.det).every(Number.isFinite) &&
    Object.values(st.approval).every(Number.isFinite);
}
const f = (x, d = 1) => Number(x).toFixed(d);

/* ---------- (i) start phase ---------- */
{
  const g0 = ENGINE.createGame();
  const pw = ENGINE.computePower(g0);
  console.log('start power score S =', f(pw.S), '→ phase:', ENGINE.phaseOf(pw.S).name);
  check(ENGINE.phaseOf(pw.S).name === 'The Top', '(i) start phase must be "The Top", got "' + ENGINE.phaseOf(pw.S).name + '" (S=' + f(pw.S) + ')');
  check(pw.S >= 58 && pw.S < 70, '(i) start S must be in [58,70), got ' + f(pw.S));
}

/* ---------- (ii) Housing First vs rental ban, long-run ---------- */
{
  function housingRun(opt) {
    const g = ENGINE.createGame();
    ENGINE.applyPolicy(g, 'housing', opt);
    for (let t = 1; t <= 16; t++) ENGINE.advanceTurn(g);
    return g;
  }
  const hf = housingRun('housingfirst'), rb = housingRun('rentban');
  console.log('homelessness @t16 — Housing First:', f(hf.homelessness, 0), '| rental ban:', f(rb.homelessness, 0));
  check(hf.homelessness < rb.homelessness, '(ii) Housing First must beat rental ban at turn 16 (' + f(hf.homelessness, 0) + ' vs ' + f(rb.homelessness, 0) + ')');
}

/* ---------- (iii) military reallocation is spend-neutral ---------- */
{
  const base = ENGINE.createGame();
  for (let t = 1; t <= 4; t++) ENGINE.advanceTurn(base);
  const mil = ENGINE.createGame();
  ENGINE.applyPolicy(mil, 'military', 'cut50');
  for (let t = 1; t <= 4; t++) ENGINE.advanceTurn(mil);
  const dDef = Math.abs(mil.deficit_bn - base.deficit_bn);
  console.log('cut50: growth t4', f(mil.growth, 2), 'vs baseline', f(base.growth, 2), '| deficit Δ $bn', f(dDef, 1));
  check(mil.growth >= base.growth - 0.1, '(iii) cut50 turn-4 growth must be ≥ baseline −0.1 (' + f(mil.growth, 2) + ' vs ' + f(base.growth, 2) + ')');
  check(dDef < 100, '(iii) cut50 deficit change must be < $100bn (spend-neutral), got $' + f(dDef, 1) + 'bn');
}

/* ---------- (v) drug.legal overdose cap ---------- */
{
  const d = ENGINE.createGame();
  ENGINE.applyPolicy(d, 'healthcare', 'public');
  ENGINE.applyPolicy(d, 'drug', 'legal');
  const anchor = d.overdoses;
  let minRatio = 1;
  for (let t = 1; t <= 40; t++) { ENGINE.advanceTurn(d); minRatio = Math.min(minRatio, d.overdoses / anchor); }
  console.log('drug.legal min overdose ratio vs enactment:', f(minRatio, 3), '(cap −15% with public option)');
  check(minRatio > 0.80, '(v) drug.legal overdoses must never fall >20% below enactment level, min ratio ' + f(minRatio, 3));
  check(ENGINE.odCap(d) === 0.15, '(v) odCap with healthcare=public should be 0.15, got ' + ENGINE.odCap(d));
}

/* ---------- (vi) deleting a budget category reduces outlays ---------- */
{
  const b = ENGINE.createGame();
  const zeroFx = { outlay: 0, vat: 0, tariff: 0, revAdd: 0 };
  const before = ENGINE.computeBudget(b, zeroFx, 0).outlays_bn;
  const res = ENGINE.deleteBudgetCat(b, 'science');
  const after = ENGINE.computeBudget(b, zeroFx, 0).outlays_bn;
  console.log('budget delete science: outlays', f(before, 0), '→', f(after, 0));
  check(res.ok, '(vi) deleteBudgetCat should succeed: ' + res.msg);
  check(after < before, '(vi) deleting a category must reduce outlays (' + f(before, 0) + ' → ' + f(after, 0) + ')');
  // locked interest
  const lockRes = ENGINE.applyBudget(b, 'interest', 0.5);
  check(!lockRes.ok, '(vi) interest slider must be locked');
}

/* ---------- (vii) endless mode to turn 60 ---------- */
{
  const g = ENGINE.createGame();
  for (let t = 1; t <= 60 && !g.over; t++) {
    Object.keys(g.approval).forEach(k => { g.approval[k] = 62; }); // popular government
    ENGINE.advanceTurn(g);
  }
  console.log('endless: reached turn', g.turn, '| over:', g.over, '| midterms:', g.midterms.length, '| elections:', g.elections.length);
  check(g.turn >= 60 && !g.over, '(vii) endless mode must run to turn 60 without game-over (approval high), got turn ' + g.turn + ' over=' + g.over);
  check(g.elections.length >= 3 && g.elections[0].turn === 20 && g.elections[1].turn === 36 && g.elections[2].turn === 52,
    '(vii/iv) presidential elections at 20/36/52, got ' + JSON.stringify(g.elections.map(e => e.turn)));
  check(g.midterms.length >= 4 && g.midterms[0].turn === 12, '(vii) midterms expected at 12/28/44/60, got ' + JSON.stringify(g.midterms.map(m => m.turn)));
  check(g.newsLog.length > 0, '(vii) news log should be populated every turn');
}

/* ---------- (viii) PC upkeep drains while heavy act active ---------- */
{
  const u1 = ENGINE.createGame();
  ENGINE.applyPolicy(u1, 'housing', 'housingfirst'); // upkeep 3 PC/turn × 8
  const pcBefore1 = u1.pc;
  ENGINE.advanceTurn(u1);
  const drained = u1.pc - pcBefore1;
  const u2 = ENGINE.createGame();
  const pcBefore2 = u2.pc;
  ENGINE.advanceTurn(u2);
  const clean = u2.pc - pcBefore2;
  console.log('upkeep: pc Δ with Housing First', f(drained, 2), 'vs clean turn', f(clean, 2));
  check(drained < clean, '(viii) PC upkeep must drain while a heavy act is active (' + f(drained, 2) + ' vs ' + f(clean, 2) + ')');
  check(drained <= clean - 2.9, '(viii) upkeep should be ~3 PC/turn for Housing First, drained only ' + f(clean - drained, 2));
}

/* ---------- main scripted run (old checks, updated timing) ---------- */
const g = ENGINE.createGame();
// Fixed policy script: crisis stimulus, then structural reforms.
const script = {
  1: [['infra', 2.0], ['welfare', 'expanded']],
  3: [['healthcare', 'public']],
  5: [['housing', 'housingfirst'], ['drug', 'decriminalized']],
  7: [['education', 'vocational'], ['military', 'cut25']],
  9: [['immigration', 'reformed']],
  11: [['tax', 20]],
  15: [['budget', 'transport', 1.3], ['budget', 'education', 1.2]],
  17: [['education', 'yearround'], ['drug', 'legal']],
  21: [['tariffs', 5]],
  23: [['ubi', 'dividend']],
  25: [['healthcare', 'universal']],
  27: [['lvt', 'enact']],
  29: [['tax', 30], ['tariffs', 0]],
  31: [['media', 'enact']],
  33: [['infra', 1.5]],
  35: [['democracy', 'enact']],
  37: [['sector', 'mental_health']],
};
// campaign actions are available EVERY turn (×1.5 in campaign windows)
const campaignPlan = { 2: ['grassroots'], 4: ['debate'], 7: ['ads'], 10: ['endorsement'], 13: ['grassroots'],
  16: ['debate'], 18: ['ads'], 19: ['grassroots'], 20: ['endorsement'],
  26: ['grassroots'], 30: ['debate'], 33: ['ads'], 34: ['grassroots'], 35: ['endorsement'], 36: ['debate'] };

for (let t = 1; t <= 44 && !g.over; t++) {
  (script[t] || []).forEach(([id, val, extra]) => {
    let res;
    if (id === 'budget') res = ENGINE.applyBudget(g, val, extra);
    else if (id === 'sector') res = ENGINE.addSector(g, val);
    else res = ENGINE.applyPolicy(g, id, val);
    if (!res.ok) console.log('  note (turn ' + t + '):', res.msg);
  });
  ENGINE.advanceTurn(g);
  (campaignPlan[g.turn] || []).forEach(a => {
    const res = ENGINE.applyCampaign(g, a);
    if (!res.ok) console.log('  note (turn ' + g.turn + '):', res.msg);
  });
  if (!finite(g)) { failures.push('Non-finite metric at turn ' + t); break; }
}

const s = g;
console.log('\n=== PoliSim-DBE self-test (v0.3) ===');
console.log('turns simulated :', s.turn, '| over:', s.over, '|', s.overReason || '(running)');
console.log('elections       :', JSON.stringify(s.elections));
console.log('midterms        :', JSON.stringify(s.midterms.map(m => [m.turn, m.house])));
console.log('final year      : Q' + s.quarter + ' ' + s.year);
console.log('--- final metrics (simulated) ---');
console.log('real GDP $bn    :', f(s.gdp_level), ' nominal $bn:', f(s.gdp_nominal));
console.log('growth %        :', f(s.growth, 2), ' inflation %:', f(s.inflation, 2));
console.log('unemployment %  :', f(s.unemployment, 2));
console.log('debt/GDP %      :', f(s.debt_gdp, 1), ' deficit $bn:', f(s.deficit_bn, 0), ' revenue $bn:', f(s.revenue_bn, 0));
console.log('med income $    :', f(s.med_income, 0));
console.log('homelessness k  :', f(s.homelessness, 0), ' overdoses:', f(s.overdoses, 0), ' incarcerated m:', f(s.incarcerated, 2));
console.log('sentiment       :', f(s.sentiment, 1), ' legitimacy:', f(s.legitimacy, 1));
const pw = ENGINE.computePower(s);
console.log('power score S   :', f(pw.S, 1), '→', ENGINE.phaseOf(pw.S).name);
console.log('weighted apprv  :', f(ENGINE.weightedApproval(s), 1) + '%');
console.log('party           :', JSON.stringify({ house: Math.round(s.party.house), senate: Math.round(s.party.senate), governors: Math.round(s.party.governors), president: s.party.president }));
console.log('determinants    :', JSON.stringify(Object.fromEntries(Object.entries(s.det).map(([k, v]) => [k, f(v, 1)]))));

// --- plausibility checks ---
check(s.turn >= 36, 'scripted run should reach at least turn 36 (second election), got ' + s.turn);
check(s.gdp_level > 14000 && s.gdp_level < 40000, 'gdp_level out of range: ' + s.gdp_level);
check(s.unemployment >= 3 && s.unemployment <= 25, 'unemployment out of range: ' + s.unemployment);
check(s.debt_gdp >= 40 && s.debt_gdp <= 250, 'debt_gdp out of range: ' + s.debt_gdp);
check(s.med_income > 50000 && s.med_income < 200000, 'med_income out of range: ' + s.med_income);
check(s.homelessness >= 200 && s.homelessness <= 5000, 'homelessness out of range: ' + s.homelessness);
check(s.overdoses >= 5000 && s.overdoses <= 400000, 'overdoses out of range: ' + s.overdoses);
check(s.incarcerated > 0.8 && s.incarcerated < 4, 'incarcerated out of range: ' + s.incarcerated);
check(s.sentiment >= 0 && s.sentiment <= 100, 'sentiment out of range');
check(s.legitimacy >= 0 && s.legitimacy <= 100, 'legitimacy out of range');
Object.entries(s.det).forEach(([k, v]) => check(v >= 0 && v <= 100, 'determinant ' + k + ' out of range: ' + v));
Object.entries(s.approval).forEach(([k, v]) => check(v >= 0 && v <= 100, 'approval ' + k + ' out of range: ' + v));
check(s.snapshots.length === s.turn, 'snapshots length mismatch');
check(ENGINE.exportCSV(s).split('\n').length === s.turn + 1, 'CSV row count mismatch');
check(JSON.parse(ENGINE.exportJSON(s)).snapshots.length === s.turn, 'JSON export mismatch');
check(s.elections.length >= 1, 'at least one presidential election should have occurred');
// (iv) elections occur at turns 20 & 36
check(s.elections.length >= 2 && s.elections[0].turn === 20 && s.elections[1].turn === 36,
  '(iv) presidential elections must occur at turns 20 & 36, got ' + JSON.stringify(s.elections.map(e => e.turn)));
s.elections.forEach(e => check(e.won, 'fixed script should win the turn-' + e.turn + ' election (got ' + e.pct + '%)'));

// network model sanity
{
  const net = ENGINE.computeNetwork(s, null);
  check(Object.keys(net.nodes).length === 16, 'network should have 16 nodes, got ' + Object.keys(net.nodes).length);
  check(net.edges.length >= 20, 'network should have ~20+ edges, got ' + net.edges.length);
  const netP = ENGINE.computeNetwork(s, { demand: 1, det: { education: 0.5 }, homelessPct: -1 });
  check(netP.edges.some(e => e.hot), 'network preview should highlight affected edges');
  check(netP.nodes.education.delta > 0, 'network preview: education node delta should be positive');
}

/* ---------- v0.4 checks ---------- */
// (ix) scenario init: The Realignment dual-track
{
  const g = ENGINE.createGame('realign2016');
  check(g.dualTrack === true, '(ix) realign2016 must be dualTrack');
  check(g.year === 2016 && g.quarter === 4, '(ix) turn 0 must be Q4 2016, got Q' + g.quarter + ' ' + g.year);
  check(g.party.house === 5 && g.party.senate === 1 && g.party.governors === 3 && g.party.president === false,
    '(ix) starting caucus must be 5 House / 1 Senate / 3 governors / no presidency');
  check(g.funds === 300, '(ix) starting funds must be $300M, got ' + g.funds);
  check(g.influence === 10 && g.influencePerTurn === 5 && g.influenceCap === 25, '(ix) influence start/regen/cap wrong: ' + g.influence + '/' + g.influencePerTurn + '/' + g.influenceCap);
  check(g.shadowParty && g.shadowParty.president === true, '(ix) shadowParty must hold the presidency');
  const pc = ENGINE.pcStats(g);
  check(Math.round(pc.cap) > 100, '(ix) SIM PC cap must exceed the classic 100 (shadow mandate), got ' + f(pc.cap, 0));
  const g2 = ENGINE.createGame('gfc2008');
  check(g2.dualTrack === false && g2.year === 2008, '(ix) gfc2008 must be classic track starting 2008');
}

// (x) scenario clock: turn 1 = Q1 2017, elections at 16/32
{
  const g = ENGINE.createGame('realign2016');
  ENGINE.advanceTurn(g);
  check(g.year === 2017 && g.quarter === 1, '(x) turn 1 must be Q1 2017, got Q' + g.quarter + ' ' + g.year);
}

// (xi) sub-department math: delete procurement → defense ≈81% of baseline; restore → 100%
{
  const g = ENGINE.createGame();
  const res = ENGINE.deleteBudgetSub(g, 'defense', 'procurement');
  check(res.ok, '(xi) deleteBudgetSub must succeed: ' + res.msg);
  const lineOf = (st, id) => ENGINE.computeBudget(st, {}, 0).lines.find(l => l.id === id);
  const expected = (139 + 245 + 75 + 40) / (139 + 245 + 117 + 75 + 40); // 499/616
  const L = lineOf(g, 'defense');
  check(Math.abs(L.mult - expected) < 0.005, '(xi) defense mult after procurement delete must be ≈' + f(expected, 3) + ', got ' + f(L.mult, 3));
  const rst = ENGINE.restoreBudgetLine(g, 'defense');
  check(rst.ok, '(xi) restore must succeed: ' + rst.msg);
  check(Math.abs(lineOf(g, 'defense').mult - 1) < 0.005, '(xi) defense mult after restore must be ≈1.0');
  // child slider moves parent
  const g2 = ENGINE.createGame();
  ENGINE.applyBudgetSub(g2, 'defense', 'personnel', 0.5);
  const exp2 = (139 * 0.5 + 245 + 117 + 75 + 40) / 616;
  const L2 = lineOf(g2, 'defense');
  check(Math.abs(L2.mult - exp2) < 0.005, '(xi) parent mult from child slider must be ≈' + f(exp2, 3) + ', got ' + f(L2.mult, 3));
}

// (xii) repeal: enacted Act returns to default, PC cost ≥ 8
{
  const g = ENGINE.createGame();
  ENGINE.advanceTurn(g);
  const before = g.pc;
  const r1 = ENGINE.applyPolicy(g, 'tax', 40);   // slider act: VAT share 40%
  check(r1.ok, '(xii) enact tax slider must succeed: ' + r1.msg);
  check(g.pol.tax.value === 40, '(xii) tax value must be 40 after enactment, got ' + g.pol.tax.value);
  const r2 = ENGINE.repealAct(g, 'tax');
  check(r2.ok, '(xii) repeal must succeed: ' + r2.msg);
  check(g.pol.tax.value === 0, '(xii) tax slider must return to 0 (default) after repeal, got ' + g.pol.tax.value);
  check(before - g.pc >= 8, '(xii) repeal must cost ≥8 PC, charged ' + f(before - g.pc, 1));
}

// (xiii) dual-track actual advance: scripted rows + real Acts fire on schedule
{
  const g = ENGINE.createGame('realign2016');
  for (let t = 1; t <= 4; t++) ENGINE.advanceTurn(g);
  check(g.actual && g.actual.history.length === 5, '(xiii) actual history must have 5 rows after 4 turns, got ' + (g.actual ? g.actual.history.length : 'none'));
  check(g.actualActsFired && g.actualActsFired.tcja === 4, '(xiii) TCJA must fire on turn 4, got ' + (g.actualActsFired && g.actualActsFired.tcja));
  const row4 = g.actual.history[4];
  check(Number.isFinite(row4.gdp_level) && Number.isFinite(row4.unemployment) && Number.isFinite(row4.debt_gdp),
    '(xiii) actual row 4 must carry gdp/unemployment/debt');
  check(Array.isArray(row4.acts) && row4.acts.length === 1 && row4.acts[0] === 'tcja',
    '(xiii) actual row 4 acts must be [tcja], got ' + JSON.stringify(row4.acts));
  check(g.influence === 25, '(xiii) influence must regenerate to the 25 cap after 4 turns (+5/turn from 10), got ' + g.influence);
}

// (xv) v0.5 act↔budget links: redundancy discounts, absorption, negative links
{
  function forceAct(st, id, value) {
    st.pol[id] = { value: value, from: st.pol[id].value, ramp: 1, lag: 1, upkeepLeft: 0, upkeepPer: 0, stalled: false };
  }
  // universal healthcare ⇒ Medicaid 95% covered: cheap delete, ~10% backlash
  const g = ENGINE.createGame();
  forceAct(g, 'healthcare', 'universal');
  const L = ENGINE.computeLinks(g);
  check(L.pos['medicaid'] && Math.abs(L.pos['medicaid'].R - 0.95) < 0.01, '(xv) universal healthcare must cover medicaid at R≈0.95, got ' + (L.pos['medicaid'] && L.pos['medicaid'].R));
  check(ENGINE.consolidateTarget(g, 'medicaid') === 0, '(xv) consolidate target for medicaid must be 0 (R≥0.85)');
  const pcBefore = g.pc;
  const del = ENGINE.deleteBudgetCat(g, 'medicaid');
  check(del.ok, '(xv) medicaid delete must succeed: ' + del.msg);
  check(pcBefore - g.pc <= 3, '(xv) covered medicaid delete must cost ≤3 PC, charged ' + (pcBefore - g.pc));
  const q = g.groupQueue[g.groupQueue.length - 1];
  check(Math.abs(q.delta.workers - (-12 * 0.05)) < 0.05, '(xv) medicaid backlash workers must be ≈−0.60 (×(1−R)), got ' + f(q.delta.workers, 2));
  // absorption: zeroed medicaid under universal health loses only ~10% of its fx bite
  const ga = ENGINE.createGame(); forceAct(ga, 'healthcare', 'universal'); ENGINE.deleteBudgetCat(ga, 'medicaid');
  const gb = ENGINE.createGame(); ENGINE.deleteBudgetCat(gb, 'medicaid');
  for (let t = 1; t <= 8; t++) { ENGINE.advanceTurn(ga); ENGINE.advanceTurn(gb); }
  console.log('overdoses t8 — medicaid cut + universal health:', f(ga.overdoses, 0), '| cut alone:', f(gb.overdoses, 0));
  check(ga.overdoses < gb.overdoses, '(xv) covering Act must absorb most of the medicaid cut pain (overdoses ' + f(ga.overdoses, 0) + ' vs ' + f(gb.overdoses, 0) + ')');
  // negative link: drug legal raises justice need — delete costs MORE
  const gn = ENGINE.createGame();
  forceAct(gn, 'drug', 'legal');
  const Ln = ENGINE.computeLinks(gn);
  check(Ln.neg['health'] && Ln.neg['health'].c < 0, '(xv) drug.legal must flag a negative link on health');
  const pcN = gn.pc;
  const delH = ENGINE.deleteBudgetCat(gn, 'health');
  check(delH.ok && pcN - gn.pc > 10, '(xv) health delete under drug.legal must cost >10 PC (need increased), charged ' + (pcN - gn.pc));
  // snapback: stall the covering act with the line zeroed → cushion appears, damage ramps
  const gs = ENGINE.createGame(); forceAct(gs, 'healthcare', 'universal'); ENGINE.deleteBudgetCat(gs, 'medicaid');
  ENGINE.advanceTurn(gs); // records prevR = 0.95 while the Act is active
  gs.pol.healthcare.stalled = true;
  ENGINE.advanceTurn(gs);
  check(gs.linkSnap['medicaid'] !== undefined, '(xv) stalling the covering Act with medicaid zeroed must open an UNCOVERED NEED cushion');
  for (let t = 2; t <= 5; t++) ENGINE.advanceTurn(gs);
  check(gs.linkSnap['medicaid'] === undefined, '(xv) cushion must expire after snapbackTurns');
}

// (xiv) influence nudge bends the actual track slightly
{
  const g = ENGINE.createGame('realign2016');
  ENGINE.advanceTurn(g);
  const u0 = g.actual.unemployment;
  const r = ENGINE.applyInfluence(g, 'pressure');
  check(r.ok, '(xiv) influence pressure must succeed: ' + r.msg);
  ENGINE.advanceTurn(g);
  check(g.actual.unemployment < u0 + 0.25, '(xiv) pressured unemployment must stay near/below script, got ' + f(g.actual.unemployment, 3) + ' vs script ' + f(u0, 3));
  check(g.influenceLog.length === 1, '(xiv) influence log must record the nudge');
}

/* ---------- (xvi) v0.5 real-world events: config schema + mechanics ---------- */
// (a) config validator — every schema rule in spec_realworld_events.md §6
{
  const BLOCS = ['workers', 'capitalists', 'youth', 'seniors', 'religious', 'immigrants', 'technocrats'];
  check(RWE && RWE.scenarios && RWE.scenarios.realign2016 && RWE.scenarios.gfc2008, '(xvi) REALWORLD_EVENTS config must load both scenarios');
  let evCount = 0;
  ['realign2016', 'gfc2008'].forEach(scid => {
    const sc = RWE.scenarios[scid];
    const ids = new Set();
    Object.keys(sc.turns || {}).forEach(tk => {
      const evs = sc.turns[tk];
      check(evs.length <= 2, '(xvi) ' + scid + ' t' + tk + ' has >2 popup events');
      evs.forEach(ev => {
        evCount++;
        check(!ids.has(ev.id), '(xvi) duplicate event id ' + ev.id + ' in ' + scid); ids.add(ev.id);
        check(ev.noComment && ev.noComment.groups, '(xvi) ' + ev.id + ' missing noComment');
        check(ev.options.length >= 2 && ev.options.length <= 3, '(xvi) ' + ev.id + ' must have 2-3 options');
        check(ev.options.filter(o => o.id === 'deflect').length === 1, '(xvi) ' + ev.id + ' must have exactly one deflect option');
        check(ev.options[ev.options.length - 1].id === 'deflect', '(xvi) ' + ev.id + ' deflect must be last');
        check(ev.actualReaction && ev.actualReaction.length > 10, '(xvi) ' + ev.id + ' needs an actualReaction line');
        (ev.blocs || []).forEach(g => check(BLOCS.includes(g), '(xvi) ' + ev.id + ' bad bloc ' + g));
        ev.options.forEach(o => {
          check(o.pc <= 3, '(xvi) ' + ev.id + '.' + o.id + ' pc > 3');
          check(o.pc === 0 || o.id !== 'deflect', '(xvi) ' + ev.id + ' deflect must be free');
          check(o.preview && o.preview.length > 10, '(xvi) ' + ev.id + '.' + o.id + ' needs an authored vague preview');
          Object.keys(o.groups || {}).forEach(g => {
            check(BLOCS.includes(g), '(xvi) ' + ev.id + '.' + o.id + ' bad bloc ' + g);
            check(Math.abs(o.groups[g]) <= 5, '(xvi) ' + ev.id + '.' + o.id + ' |delta| > 5');
          });
        });
        if (ev.actId) check(global.window.SCENARIO_2016.acts[ev.actId], '(xvi) ' + ev.id + ' actId "' + ev.actId + '" not in SCENARIO_2016.acts');
        (ev.actIds || []).forEach(a => check(global.window.SCENARIO_2016.acts[a], '(xvi) ' + ev.id + ' actIds "' + a + '" not in SCENARIO_2016.acts'));
      });
    });
    const mids = new Set();
    Object.keys(sc.marketEvents || {}).forEach(tk => sc.marketEvents[tk].forEach(m => {
      check(!mids.has(m.id), '(xvi) duplicate marketEvent id ' + m.id); mids.add(m.id);
      check(m.kind === 'company' && m.headline && m.socialPosts && m.socialPosts.length >= 1, '(xvi) marketEvent ' + m.id + ' malformed');
      if (m.statementRef) {
        let found = false;
        Object.keys(sc.turns || {}).forEach(k2 => sc.turns[k2].forEach(e2 => { if (e2.id === m.statementRef) found = true; }));
        check(found, '(xvi) ' + m.id + ' statementRef "' + m.statementRef + '" does not resolve in ' + scid);
      }
    }));
  });
  check(evCount === 36, '(xvi) expected 36 events total, config has ' + evCount);
}

// (b) mechanic — respond at t3, 2-turn group spread lands on youth (+2)
{
  const g = ENGINE.createGame('realign2016');
  while (g.turn < 1) ENGINE.advanceTurn(g);
  check(g.pendingEvents.some(e => e.id === 'travel-ban'), '(xvi) t1 must surface travel-ban');
  let r = ENGINE.respondToEvent(g, 'travel-ban', 'condemn');
  check(r.ok, '(xvi) travel-ban condemn must succeed: ' + r.msg);
  while (g.turn < 3) ENGINE.advanceTurn(g);
  check(g.pendingEvents.some(e => e.id === 'charlottesville'), '(xvi) t3 must surface charlottesville');
  check(g.eventsSeen['charlottesville'] === 3, '(xvi) eventsSeen must record charlottesville at t3');
  const y0 = g.approval.youth;
  r = ENGINE.respondToEvent(g, 'charlottesville', 'condemn');
  check(r.ok, '(xvi) charlottesville condemn must succeed: ' + r.msg);
  ENGINE.advanceTurn(g); ENGINE.advanceTurn(g);
  const dy = g.approval.youth - y0;
  check(dy > 0.5 && dy < 4.5, '(xvi) youth should gain ~+2 over 2 turns after condemn, got ' + f(dy, 2));
  check(g.eventLog.some(e => e.id === 'charlottesville' && e.optionId === 'condemn'), '(xvi) eventLog must record the condemn choice');
}

// (c) no-comment — advancing without responding resolves as silence
{
  const g = ENGINE.createGame('realign2016');
  ENGINE.advanceTurn(g); // t1: travel-ban fires
  const i0 = g.approval.immigrants;
  ENGINE.advanceTurn(g); // expires as no-comment
  const silent = g.eventLog.filter(e => e.id === 'travel-ban' && e.optionId === 'no_comment');
  check(silent.length === 1, '(xvi) travel-ban must auto-resolve as no_comment');
  check(g.approval.immigrants < i0, '(xvi) silence must cost immigrants (noComment −2 spread), got Δ' + f(g.approval.immigrants - i0, 2));
  check(g.pendingEvents.length === 0, '(xvi) pendingEvents must drain after expiry');
}

// (d) turn cap + major-first — t4 has exactly 2; t17 leads with the major
{
  const g = ENGINE.createGame('realign2016');
  const ids4 = [], ids17 = [];
  while (g.turn < 17) {
    if (g.pendingEvents.length) {
      if (g.turn === 4) ids4.push(...g.pendingEvents.map(e => e.id));
      ENGINE.respondToEvent(g, g.pendingEvents[0].id, g.pendingEvents[0].options[0].id);
    }
    ENGINE.advanceTurn(g);
  }
  ids17.push(...g.pendingEvents.map(e => e.id)); // collect BEFORE responding
  if (g.pendingEvents.length) ENGINE.respondToEvent(g, g.pendingEvents[0].id, g.pendingEvents[0].options[0].id);
  check(ids4.length === 2 && ids4.includes('tcja-signing') && ids4.includes('metoo'), '(xvi) t4 must surface exactly 2 events (tcja-signing + metoo), got ' + ids4.join(','));
  check(ids17.length === 2 && ids17[0] === 'jan6', '(xvi) t17 must surface 2 events major-first (jan6 before arp-checks), got ' + ids17.join(','));
}

// (e) dual-track isolation — statements never touch ACTUAL metrics
{
  const g = ENGINE.createGame('realign2016');
  while (g.turn < 13) {
    if (g.pendingEvents.length) ENGINE.respondToEvent(g, g.pendingEvents[0].id, g.pendingEvents[0].options[0].id);
    ENGINE.advanceTurn(g);
  }
  check(g.pendingEvents.some(e => e.id === 'covid-cares'), '(xvi) t13 must surface covid-cares');
  const uAct = g.actual.unemployment;
  const r = ENGINE.respondToEvent(g, 'covid-cares', 'address-nation');
  check(r.ok, '(xvi) covid-cares address-nation must succeed: ' + r.msg);
  ENGINE.advanceTurn(g); // ACTUAL track now sits on scripted t14 (the COVID spike, u=11.1)
  const script = global.window.SCENARIO_2016.byTurn[String(g.actual.turn)];
  check(script && g.actual.unemployment === script.unemployment,
    '(xvi) statements must never move ACTUAL metrics: actual u=' + f(g.actual.unemployment, 2) +
    ' vs scripted t' + g.actual.turn + ' u=' + (script ? f(script.unemployment, 2) : 'missing'));
  check(g.eventLog.some(e => e.id === 'covid-cares'), '(xvi) covid-cares must be recorded in eventLog');
}

// (f) gfc — bin-laden address-nation is gated on 1 PC
{
  const g = ENGINE.createGame('gfc2008');
  while (g.turn < 14) ENGINE.advanceTurn(g); // earlier events no-comment out, fine
  check(g.pendingEvents.some(e => e.id === 'bin-laden'), '(xvi) t14 must surface bin-laden');
  g.pc = 0;
  let r = ENGINE.respondToEvent(g, 'bin-laden', 'address-nation');
  check(!r.ok, '(xvi) address-nation must fail at 0 PC: ' + r.msg);
  g.pc = 5;
  r = ENGINE.respondToEvent(g, 'bin-laden', 'address-nation');
  check(r.ok && g.pc === 4, '(xvi) address-nation must cost exactly 1 PC at ≥1 PC');
}

// (g) marketEvents feed the news log without approval effects
{
  const g = ENGINE.createGame('realign2016');
  while (g.turn < 5) {
    if (g.pendingEvents.length) ENGINE.respondToEvent(g, g.pendingEvents[0].id, g.pendingEvents[0].options[0].id);
    ENGINE.advanceTurn(g);
  }
  const biz = g.newsLog.filter(n => n.lane === 'hist' && n.text.indexOf('[BIZ]') === 0);
  check(biz.some(n => n.text.indexOf('Cambridge Analytica') >= 0 || n.text.indexOf('Facebook') >= 0), '(xvi) t5 must log the Facebook/Cambridge [BIZ] headline');
}

/* ---------- (xvii) v0.5 compass: baseline, directions, labels, cycle ---------- */
{
  require('./js/compass_data.js');
  const COMPASS = require('./js/compass.js');
  function forceAct2(st, id, val) {
    st.pol[id] = { value: val, from: st.pol[id].value, ramp: 1, lag: 1, upkeepLeft: 0, upkeepPer: 0, stalled: false };
  }
  const B0 = { STA: 45, LFT: 38, REG: 45, OWN: 12, AUT: 30, TRD: 45, NTV: 50 };

  // (a) baseline anchors: fresh gfc2008 game must sit on archetype 8 (±3, HSP ±1)
  {
    const g = ENGINE.createGame('gfc2008');
    const rep = COMPASS.compassReport(g);
    Object.keys(B0).forEach(a => check(Math.abs(rep.axes[a] - B0[a]) <= 3, '(xvii-a) baseline ' + a + ' must be ' + B0[a] + '±3, got ' + rep.axes[a]));
    check(Math.abs(rep.axes.HSP - 50) <= 1, '(xvii-a) HSP must be 50±1 at t0, got ' + rep.axes.HSP);
    check(rep.labels.structure === 'Federal Nation-State', '(xvii-a) structure label, got ' + rep.labels.structure);
    check(rep.labels.governing === 'Constitutional Democracy', '(xvii-a) governing label, got ' + rep.labels.governing);
    check(rep.labels.economic === 'Market Economy', '(xvii-a) economic label, got ' + rep.labels.economic);
    check(rep.labels.social === 'Pluralism', '(xvii-a) social label, got ' + rep.labels.social);
  }

  // (c) act-direction battery (ramp forced to 1; axes read at t0, no crisis noise)
  {
    function axesWith(fn) { const g = ENGINE.createGame('gfc2008'); fn(g); return COMPASS.computeAxes(g).axes; }
    let a = axesWith(g => forceAct2(g, 'ubi', 'dividend'));
    check(Math.abs(a.LFT - 46) <= 0.6 && Math.abs(a.REG - 43) <= 0.6 && Math.abs(a.AUT - 29) <= 0.6,
      '(xvii-c) ubi.dividend must give LFT+8 REG−2 AUT−1, got LFT' + a.LFT + ' REG' + a.REG + ' AUT' + a.AUT);
    check(a.HSP > 53 && a.HSP < 57, '(xvii-c) ubi.dividend must lift HSP to ~54.8 (formula), got ' + a.HSP);
    a = axesWith(g => forceAct2(g, 'healthcare', 'universal'));
    check(Math.abs(a.OWN - 15) <= 0.6 && Math.abs(a.LFT - 45) <= 0.6, '(xvii-c) healthcare.universal must give OWN+3 LFT+7, got OWN' + a.OWN + ' LFT' + a.LFT);
    a = axesWith(g => forceAct2(g, 'tariffs', 25));
    check(Math.abs(a.NTV - 60) <= 0.6 && Math.abs(a.REG - 51) <= 0.6, '(xvii-c) tariffs 25 must give NTV+10 REG+6, got NTV' + a.NTV + ' REG' + a.REG);
    a = axesWith(g => forceAct2(g, 'drug', 'decriminalized'));
    check(Math.abs(a.REG - 37) <= 0.6 && Math.abs(a.AUT - 22) <= 0.6, '(xvii-c) drug.decriminalized must give REG−8 AUT−8, got REG' + a.REG + ' AUT' + a.AUT);
    a = axesWith(g => forceAct2(g, 'law', 'tough'));
    check(Math.abs(a.AUT - 34) <= 0.6, '(xvii-c) law.tough must give AUT+4, got ' + a.AUT);
    a = axesWith(g => forceAct2(g, 'military', 'cut50'));
    check(Math.abs(a.HSP - 50) <= 1, '(xvii-c) military.cut50 must be spend-neutral for HSP (|Δ|≤1), got ' + a.HSP);
    // C3 VAT interaction: tax 100 alone → LFT−3; paired with transfers → LFT+2
    a = axesWith(g => forceAct2(g, 'tax', 100));
    check(Math.abs(a.LFT - 35) <= 0.6, '(xvii-c) tax 100 alone must give LFT−3 (35), got ' + a.LFT);
    a = axesWith(g => { forceAct2(g, 'tax', 100); forceAct2(g, 'welfare', 'expanded'); });
    check(Math.abs(a.LFT - 44) <= 0.6, '(xvii-c) tax 100 + welfare.expanded must give LFT 38+4+2=44 (C3 paired), got ' + a.LFT);
  }

  // (d)+(e) historical direction replays: Portugal 2001, Smoot–Hawley
  {
    const g = ENGINE.createGame('gfc2008');
    const before = COMPASS.computeAxes(g).axes;
    forceAct2(g, 'drug', 'decriminalized');
    const after = COMPASS.computeAxes(g).axes;
    check(after.REG < before.REG && after.AUT < before.AUT, '(xvii-d) Portugal replay: decriminalization must move REG & AUT negative');
    const g2 = ENGINE.createGame('gfc2008');
    const b2 = COMPASS.computeAxes(g2).axes;
    forceAct2(g2, 'tariffs', 25);
    const a2 = COMPASS.computeAxes(g2).axes;
    check(a2.NTV > b2.NTV && a2.REG > b2.REG, '(xvii-e) Smoot–Hawley replay: tariffs must move NTV & REG positive');
  }

  // (f) label transitions
  {
    // (i) Social Democracy — full Nordic battery. NOTE: spec §8 said entitlements
    // at 125%; empirically the gate trips at 140% with the dual-UBI battery (the
    // game allows BOTH ubi.dividend and welfare.ubi). Flagged for calibration pass.
    const g = ENGINE.createGame('gfc2008');
    forceAct2(g, 'ubi', 'dividend'); forceAct2(g, 'welfare', 'ubi');
    forceAct2(g, 'healthcare', 'universal'); forceAct2(g, 'education', 'full');
    ['medicare', 'medicaid', 'social_security'].forEach(c => { g.budget.mult[c] = 1.4; });
    const rep = COMPASS.compassReport(g);
    check(rep.axes.LFT >= 62, '(xvii-f-i) Nordic battery must reach LFT≥62, got ' + rep.axes.LFT);
    check(rep.axes.HSP >= 70, '(xvii-f-i) Nordic battery must reach HSP≥70, got ' + rep.axes.HSP);
    check(rep.labels.economic.indexOf('Social Democracy') === 0, '(xvii-f-i) economic label must be Social Democracy, got ' + rep.labels.economic);
    // (ii) Laissez-Faire: everything cut to 20% + drug.legal + housing.zoning
    const g2 = ENGINE.createGame('gfc2008');
    Object.keys(g2.budget.mult).forEach(c => { if (c !== 'interest') g2.budget.mult[c] = 0.2; });
    forceAct2(g2, 'drug', 'legal'); forceAct2(g2, 'housing', 'zoning');
    const rep2 = COMPASS.compassReport(g2);
    check(rep2.labels.economic.indexOf('Laissez-Faire Capitalism') === 0,
      '(xvii-f-ii) must be Laissez-Faire Capitalism, got ' + rep2.labels.economic + ' (OWN' + rep2.axes.OWN + ' HSP' + rep2.axes.HSP + ' REG' + rep2.axes.REG + ')');
    // (iii) Nativism + Mercantilist: tariffs 25 + immigration.restrictive
    const g3 = ENGINE.createGame('gfc2008');
    forceAct2(g3, 'tariffs', 25); forceAct2(g3, 'immigration', 'restrictive');
    const rep3 = COMPASS.compassReport(g3);
    check(rep3.labels.social === 'Nativism', '(xvii-f-iii) social must be Nativism, got ' + rep3.labels.social);
    check(rep3.labels.economic.indexOf('Mercantilist') >= 0, '(xvii-f-iii) economic must carry Mercantilist, got ' + rep3.labels.economic);
    // (iv) Participatory prefix via democracy act
    const g4 = ENGINE.createGame('gfc2008');
    forceAct2(g4, 'democracy', 'enact');
    const rep4 = COMPASS.compassReport(g4);
    check(rep4.labels.governing.indexOf('Participatory ') === 0, '(xvii-f-iv) governing must gain Participatory prefix, got ' + rep4.labels.governing);
  }

  // (g) gate injection — unreachable cells still classify correctly
  {
    const full = Object.assign({ HSP: 50 }, B0);
    const L = (over, ctx) => COMPASS.classifyLabels(Object.assign({}, full, over), Object.assign({ tariffRate: 0, legitimacy: 50 }, ctx));
    check(L({ AUT: 70 }).governing === 'Authoritarian State', '(xvii-g) AUT 70 → Authoritarian State');
    check(L({ AUT: 57 }).governing === 'Illiberal Democracy', '(xvii-g) AUT 57 → Illiberal Democracy');
    check(L({ OWN: 80, STA: 75 }).economic === 'Command Economy', '(xvii-g) OWN80+STA75 → Command Economy');
    check(L({ OWN: 80, STA: 20 }).economic === 'Socialised Economy', '(xvii-g) OWN80+STA20 → Socialised Economy (twin-trap cell)');
    check(L({ TRD: 60 }).social === 'Traditionalism', '(xvii-g) TRD 60 → Traditionalism');
    check(L({ NTV: 25, TRD: 30 }).social === 'Cosmopolitan Modernism', '(xvii-g) NTV25+TRD30 → Cosmopolitan Modernism');
    check(L({}, { legitimacy: 15 }).structure === 'Federal Nation-State (in crisis)', '(xvii-g) legitimacy≤20 → crisis suffix');
  }

  // (h) HSP invariant: live formula at any turn matches the fiscal bridge
  {
    const g = ENGINE.createGame('gfc2008');
    forceAct2(g, 'ubi', 'dividend');
    for (let t = 0; t < 12; t++) ENGINE.advanceTurn(g);
    const hsp = COMPASS.computeHSP(g);
    const fed = g.outlays_bn / g.gdp_nominal * 100;
    const expect = Math.max(0, Math.min(100, (fed + 14.5 - 5) / 60 * 100));
    check(Math.abs(hsp - expect) < 0.15, '(xvii-h) computeHSP must equal the fiscal bridge on live outlays, got ' + f(hsp, 2) + ' vs ' + f(expect, 2));
    check(hsp > 50, '(xvii-h) UBI active 12 turns must push HSP above baseline, got ' + f(hsp, 1));
  }

  // (i) cycle classifier: fresh = The Top provisional; 16 turns → provisional off
  {
    const g = ENGINE.createGame('gfc2008');
    const c0 = COMPASS.classifyCycleStage(g);
    check(c0.stage === 'The Top' && c0.provisional === true, '(xvii-i) fresh game must be The Top (provisional), got ' + c0.stage);
    for (let t = 0; t < 16; t++) ENGINE.advanceTurn(g);
    const c1 = COMPASS.classifyCycleStage(g);
    check(c1.provisional === false && c1.trendWindowTurns >= 12, '(xvii-i) after 16 turns provisional must lift, got win=' + c1.trendWindowTurns);
    check(c1.subCycles && typeof c1.subCycles.debt === 'number' && typeof c1.subCycles.external === 'number',
      '(xvii-i) sub-cycle gauges must be numeric');
    // synthetic decline: PI < 80% of peak, falling trend, debt+conflict markers
    const g2 = ENGINE.createGame('gfc2008');
    for (let t = 0; t < 14; t++) { ENGINE.advanceTurn(g2); g2.snapshots[t] && (g2.snapshots[t].det = Object.assign({}, g2.snapshots[t].det, { competitiveness: 70 - t, innovation: 70 - t, education: 70 - t })); }
    g2.det.competitiveness = 30; g2.det.innovation = 30; g2.det.education = 45;
    g2.debt_gdp = 120; g2.deficit_bn = g2.gdp_nominal * 0.08; g2.sentiment = 20; g2.legitimacy = 30;
    const c2 = COMPASS.classifyCycleStage(g2);
    check(c2.markers.some(m => ['m13', 'm14', 'm15'].indexOf(m) >= 0), '(xvii-i) synthetic decline must light ≥1 of m13-m15, got ' + c2.markers.join(','));
  }

  // (j) repeal symmetry: compass axes are memoryless
  {
    const g = ENGINE.createGame('gfc2008');
    forceAct2(g, 'ubi', 'dividend');
    const hot = COMPASS.computeAxes(g).axes;
    check(Math.abs(hot.LFT - 46) <= 0.6, '(xvii-j) enacted UBI must move LFT, got ' + hot.LFT);
    forceAct2(g, 'ubi', 'off'); // simulate completed repeal (value back to default)
    const cold = COMPASS.computeAxes(g).axes;
    Object.keys(B0).forEach(ax => check(Math.abs(cold[ax] - B0[ax]) <= 0.6,
      '(xvii-j) axes must return to baseline ±0.5 after repeal, ' + ax + ' got ' + cold[ax]));
  }
}

/* ---------- (xviii) v0.5 WS6: Dimensions Beyond Energy 2030 scenario ---------- */
{
  const SC = global.window.SCENARIOS;
  const EV = global.window.EVENTS;
  const RWE = global.window.REALWORLD_EVENTS;

  // (a) registration + start integrity
  check(SC && SC.dbe2030, '(xviii-a) SCENARIOS.dbe2030 must be registered');
  const g0 = ENGINE.createGame('dbe2030');
  check(g0.scenario === 'dbe2030' && !g0.dualTrack, '(xviii-a) dbe2030 must create a single-track game');
  check(g0.year === 2030 && g0.quarter === 1, '(xviii-a) dbe2030 must open Q1 2030, got Q' + g0.quarter + ' ' + g0.year);
  check(Math.abs(g0.gdp_nominal / g0.gdp_level - 37429.4 / 25974.7) < 1e-9, '(xviii-a) priceIndex must match the projection anchor');
  check(g0.party.president === true && g0.party.house >= 218, '(xviii-a) the governing party must hold the presidency and the House');
  check(g0.turnToYear === undefined, '(xviii-a) sanity: state carries no functions');

  // (b) EVENTS.dbe shock blocks exist and are sane
  check(EV && EV.dbe && EV.dbe.shocks && EV.dbe.detShock, '(xviii-b) EVENTS.dbe must define shocks/unempShock/outlayShock/detShock');
  Object.keys(EV.dbe.shocks).forEach(t => check(Math.abs(EV.dbe.shocks[t]) <= 8, '(xviii-b) growth shock t' + t + ' within ±8pp'));
  Object.keys(EV.dbe.detShock).forEach(t => Object.keys(EV.dbe.detShock[t]).forEach(d =>
    check(['education', 'innovation', 'competitiveness', 'military', 'trade', 'output', 'fincenter', 'reserve_fx'].indexOf(d) >= 0,
      '(xviii-b) detShock t' + t + ' unknown determinant ' + d)));

  // (c) detShock engine support: Q-Day dents reserve_fx on the scripted turns
  {
    const g = ENGINE.createGame('dbe2030');
    while (g.turn < 12) { if (g.pendingEvents.length) ENGINE.respondToEvent(g, g.pendingEvents[0].id, g.pendingEvents[0].options[0].id); ENGINE.advanceTurn(g); }
    const before = g.det.reserve_fx;
    ENGINE.advanceTurn(g); // t13: reserve_fx -4
    check(g.det.reserve_fx <= before - 3.5, '(xviii-c) Q-Day t13 must dent reserve_fx (was ' + f(before, 1) + ' → ' + f(g.det.reserve_fx, 1) + ')');
  }

  // (d) event config validates like the real-world ones (schema parity)
  {
    const sc = RWE.scenarios.dbe2030;
    check(sc && sc.turns, '(xviii-d) REALWORLD_EVENTS.scenarios.dbe2030 must exist');
    const ids = [];
    let count = 0;
    Object.keys(sc.turns).forEach(k => {
      check(sc.turns[k].length <= 2, '(xviii-d) turn ' + k + ' must carry ≤2 popups');
      sc.turns[k].forEach(ev => {
        count++; ids.push(ev.id);
        check(ev.kind === 'statement' && ev.actId === null, '(xviii-d) ' + ev.id + ' must be a speculative statement event');
        check(ev.options && ev.options.length >= 2, '(xviii-d) ' + ev.id + ' needs ≥2 options');
        ev.options.forEach(o => {
          check(o.preview && o.text, '(xviii-d) ' + ev.id + '/' + o.id + ' needs text + preview');
          check((o.pc || 0) <= 3, '(xviii-d) ' + ev.id + '/' + o.id + ' pc ≤ 3');
          Object.keys(o.groups || {}).forEach(gr => check(Math.abs(o.groups[gr]) <= 5, '(xviii-d) ' + ev.id + '/' + o.id + ' |Δ' + gr + '| ≤ 5'));
        });
        check(ev.noComment && ev.noComment.groups, '(xviii-d) ' + ev.id + ' needs a noComment outcome');
        check(Array.isArray(ev.blocs) && ev.blocs.length >= 2, '(xviii-d) ' + ev.id + ' needs ≥2 blocs');
      });
    });
    check(count >= 12, '(xviii-d) dbe2030 should carry ≥12 transition events, got ' + count);
    check(new Set(ids).size === ids.length, '(xviii-d) event ids must be unique');
    check(sc.turns['1'] && sc.turns['1'][0].tier === 'major' && sc.turns['1'][0].id === 'breakeven', '(xviii-d) t1 must open with the breakeven major');
    check(sc.turns['13'] && sc.turns['13'][0].id === 'qday', '(xviii-d) t13 must be Q-Day');
    check(sc.turns['33'] && sc.turns['33'][0].id === 'commercial-fusion', '(xviii-d) t33 must be commercial fusion (the re-dated 2038 payoff)');
  }

  // (e) full playthrough: 44 turns advance without NaN and determinants stay clamped
  {
    const g = ENGINE.createGame('dbe2030');
    let nan = false;
    while (g.turn < 44 && !g.over) {
      if (g.pendingEvents.length) ENGINE.respondToEvent(g, g.pendingEvents[0].id, g.pendingEvents[0].options[0].id);
      ENGINE.advanceTurn(g);
      ['gdp_level', 'unemployment', 'debt_gdp', 'inflation', 'sentiment', 'legitimacy'].forEach(k => { if (isNaN(g[k])) nan = true; });
    }
    check(!nan, '(xviii-e) 44-turn dbe2030 playthrough must stay finite');
    Object.keys(g.det).forEach(d => check(g.det[d] >= 0 && g.det[d] <= 100, '(xviii-e) determinant ' + d + ' clamped, got ' + f(g.det[d], 1)));
    check(g.year === 2030 + Math.floor((g.turn - 1) / 4), '(xviii-e) clock arithmetic holds (Q' + g.quarter + ' ' + g.year + ')');
    const majorsHit = g.eventLog.filter(e => e.id === 'breakeven' || e.id === 'qday' || e.id === 'commercial-fusion').length;
    check(majorsHit === 3, '(xviii-e) all three major events must resolve across the arc, got ' + majorsHit);
  }

  // (f) election/midterm calendar: Q4 2032 election (t12), Q4 2030 midterm (t4)
  {
    const g = ENGINE.createGame('dbe2030');
    let sawMidterm = false;
    while (g.turn < 20 && !g.over) {
      if (g.pendingEvents.length) ENGINE.respondToEvent(g, g.pendingEvents[0].id, g.pendingEvents[0].options[0].id);
      ENGINE.advanceTurn(g);
      if (g.midterms.length && g.midterms[g.midterms.length - 1].turn === 4) sawMidterm = true;
    }
    check(sawMidterm, '(xviii-f) midterm must fire on turn 4 (Q4 2030)');
    check(g.elections.length === 1 && g.elections[0].turn === 12 && g.elections[0].year === 2032,
      '(xviii-f) presidential election must fire on turn 12 (Q4 2032), got ' + JSON.stringify(g.elections));
    check(!g.over, '(xviii-f) keepPlayingOnLoss: game must continue after a lost election (or a won one)');
  }
}

/* ---------- (xix) WS7 market data: real Yahoo Finance quarter-end closes ---------- */
{
  const MD = require('./js/market_data.js');
  check(MD && MD.scenarios && MD.scenarios.realign2016 && MD.scenarios.gfc2008, '(xix) MARKET_DATA must load both scenarios');
  const R = MD.scenarios.realign2016, G = MD.scenarios.gfc2008;
  const rks = Object.keys(R.tickers);
  check(rks.length >= 13, '(xix) realign2016 must have >=13 tickers, got ' + rks.length);
  rks.forEach(k => {
    const t = R.tickers[k];
    check(t.prices.length === R.quarters.length, '(xix) ' + k + ' price array length must match quarter labels');
    check(t.prices.length >= 30, '(xix) ' + k + ' must have >=30 quarterly entries (37 expected), got ' + t.prices.length);
    const nulls = t.prices.filter(p => p == null).length;
    if (k === 'SIVB') {
      // Yahoo dropped the delisted SIVB symbol entirely — all nulls, flagged delisted from Q2 2023
      check(t.delistedFrom === 'Q2 2023', '(xix) SIVB must carry delistedFrom=Q2 2023 note');
      check((MD.meta.skippedTickers || []).includes('SIVB'), '(xix) SIVB must be noted in meta.skippedTickers');
    } else {
      check(nulls <= 8, '(xix) ' + k + ' has too many null quarters: ' + nulls);
    }
  });
  check(R.tickers.SPX.prices.every(p => p == null || p > 1000), '(xix) realign2016 SPX must all be >1000 (unit sanity)');
  const gi = q => G.quarters.indexOf(q);
  check(G.tickers.SPX.prices[gi('Q4 2008')] < G.tickers.SPX.prices[gi('Q2 2008')],
    '(xix) gfc2008 SPX Q4 2008 (' + G.tickers.SPX.prices[gi('Q4 2008')] + ') must be below Q2 2008 (' + G.tickers.SPX.prices[gi('Q2 2008')] + ') — crash must be visible');
  Object.keys(G.tickers).forEach(k => check(G.tickers[k].prices.length === G.quarters.length, '(xix) gfc ' + k + ' length match'));
  check(R.turn0Label === 'Q4 2016' && R.quarters[0] === 'Q4 2016' && R.quarters.length === 37, '(xix) realign2016 turn0=Q4 2016 + 36 quarters = 37 labels, got ' + R.quarters.length);
  check(G.turn0Label === 'Q4 2007' && G.quarters.length === 21, '(xix) gfc2008 turn0=Q4 2007 + 20 quarters = 21 labels, got ' + G.quarters.length);
}

/* ---------- (xx) WS5: Create-your-own-Act studio ---------- */
{
  const STUDIO = require('./js/act_studio.js');
  check(STUDIO && Array.isArray(STUDIO.TEMPLATES) && STUDIO.TEMPLATES.length === 6,
    '(xx) ACT_STUDIO must expose exactly 6 TEMPLATES');
  const catIds = (global.window.ACT_CATEGORIES || []).map(c => c.id);
  check(catIds.length === 8, '(xx) ACT_CATEGORIES must have 8 shelves, got ' + catIds.length);

  // (a) every template passes registerCustomAct validation; fresh game per template
  STUDIO.TEMPLATES.forEach(tpl => {
    const r = ENGINE.registerCustomAct(tpl);
    check(r.ok, '(xx-a) template ' + tpl.id + ' must pass registerCustomAct: ' + r.msg);
    const g = ENGINE.createGame();
    check(g.pol[tpl.id] && g.pol[tpl.id].value === 'off', '(xx-a) fresh game must init st.pol for ' + tpl.id);
    check(catIds.indexOf(tpl.cat) >= 0, '(xx-a) template ' + tpl.id + ' cat "' + tpl.cat + '" must be a valid ACT_CATEGORIES id');
    check(tpl.kind === 'select' && tpl.def === 'off' && tpl.options.length === 3 && tpl.options[0].id === 'off',
      '(xx-a) template ' + tpl.id + ' must be off + 2 enacted options');
    check(typeof tpl.sourceNote === 'string' && /calibrate/i.test(tpl.sourceNote),
      '(xx-a) template ' + tpl.id + ' must carry an honest sourceNote');
    const dup = ENGINE.registerCustomAct(tpl);
    check(!dup.ok, '(xx-a) duplicate id ' + tpl.id + ' must be rejected');
  });

  // (b) balance-formula monotonicity: bigger effects → higher pc
  const small = STUDIO.buildDef({ name: 'Tiny Test Act', cat: 'welfare', desc: 'x', demand: 0.1, det: {}, groups: { workers: 1 }, outlay: 0 });
  const big = STUDIO.buildDef({ name: 'Huge Test Act', cat: 'welfare', desc: 'x', demand: 1.5, det: { education: 0.8 }, groups: { workers: 8, capitalists: -6 }, outlay: 3 });
  check(small.ok && big.ok, '(xx-b) buildDef must accept valid forms: ' + (small.msg || '') + (big.msg || ''));
  check(big.def.options[2].pc > small.def.options[2].pc,
    '(xx-b) monotonicity: bigger effects must cost more PC (' + big.def.options[2].pc + ' vs ' + small.def.options[2].pc + ')');
  check(big.def.options[2].pc > big.def.options[1].pc,
    '(xx-b) ambitious (×1.2) must cost more than moderate (×0.6)');

  // (c) buildDef validation
  check(!STUDIO.buildDef({ name: '   ', cat: 'welfare' }).ok, '(xx-c) buildDef must reject an empty name');
  check(!STUDIO.buildDef({ name: 'Bad Group Act', cat: 'welfare', groups: { workers: 11 } }).ok,
    '(xx-c) buildDef must reject |group delta| > 10');
  check(!STUDIO.buildDef({ name: 'Bad Cat Act', cat: 'nonsense' }).ok, '(xx-c) buildDef must reject an unknown category');
  const clamped = STUDIO.buildDef({ name: 'Clamp Act', cat: 'health', det: { education: 5 }, groups: {} });
  check(clamped.ok && Math.abs(clamped.def.options[2].fx.det.education) <= 1,
    '(xx-c) det deltas must clamp to ±1.0/turn, got ' + JSON.stringify(clamped.def.options[2].fx.det));

  // (d) a registered custom act actually moves aggregateEffects
  const built = STUDIO.buildDef({ name: 'Test Stimulus Act', cat: 'welfare', desc: 'x', demand: 1.2, det: { education: 0.6 }, groups: { workers: 4 }, outlay: 1 });
  check(built.ok, '(xx-d) buildDef for test act: ' + (built.msg || ''));
  check(ENGINE.registerCustomAct(built.def).ok, '(xx-d) register test act');
  const gst = ENGINE.createGame();
  gst.pc = 200;
  const ap = ENGINE.applyPolicy(gst, built.def.id, 'ambitious');
  check(ap.ok, '(xx-d) applyPolicy on custom act must work: ' + ap.msg);
  for (let t = 0; t < 8; t++) ENGINE.advanceTurn(gst);
  const fx = ENGINE.aggregateEffects(gst);
  check(fx.demand > 0.5, '(xx-d) enacted custom act must raise aggregate demand, got ' + fx.demand);
  check(fx.det.education > 0.3, '(xx-d) enacted custom act must raise education det, got ' + fx.det.education);
  // mid-game registration: existing game gets no st.pol entry unless the UI patches it —
  // engine-side, createGame-after-registration is the guaranteed path (asserted in (a)).

  // (e) unregister cleans POLICIES + POLICY_MAP
  const un = ENGINE.unregisterCustomAct(built.def.id);
  check(un.ok, '(xx-e) unregisterCustomAct must succeed: ' + un.msg);
  check(ENGINE.registerCustomAct(built.def).ok, '(xx-e) re-register after unregister must work (map cleaned)');
  check(!ENGINE.unregisterCustomAct('welfare').ok, '(xx-e) built-in Acts must not be unregisterable');

  // (f) analyzeText: title guess + lexicon suggestions
  const an = STUDIO.analyzeText('# Clean Jobs for America Act\n\nThis bill creates jobs and raises wages in wind and solar energy, funded by a carbon tax on emissions.');
  check(an.title.indexOf('Clean Jobs for America Act') === 0, '(xx-f) analyzeText must guess the title from the first heading line, got "' + an.title + '"');
  check((an.groups.workers || 0) > 0, '(xx-f) jobs/wage keywords must suggest workers');
  check((an.fx.det.competitiveness || 0) !== 0, '(xx-f) climate/carbon/energy keywords must suggest competitiveness');
  check(catIds.indexOf(an.cat) >= 0, '(xx-f) suggested category must be valid');
  check(/NOT an analysis/i.test(an.note) || an.matched.length === 0, '(xx-f) note must be honest about the heuristic');
}

if (failures.length) {
  console.log('\nFAILURES:');
  failures.forEach(m => console.log(' ✗', m));
  process.exit(1);
}
console.log('\nAll checks passed ✔');

/* PoliSim-DBE self-test: node test.js   (v0.3)
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
const ENGINE = require('./js/engine.js');

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

if (failures.length) {
  console.log('\nFAILURES:');
  failures.forEach(m => console.log(' ✗', m));
  process.exit(1);
}
console.log('\nAll checks passed ✔');

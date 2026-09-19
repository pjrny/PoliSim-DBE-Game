/* PoliSim-DBE self-test: node test.js
   Loads data.js + engine.js with a tiny window shim, plays a fixed 40-turn
   policy script, and verifies metrics stay finite and plausible. */
'use strict';
global.window = {};
require('./js/data.js');
const ENGINE = require('./js/engine.js');

const g = ENGINE.createGame();

// Fixed policy script: crisis stimulus, then structural reforms.
const script = {
  1: [['infra', 2.0], ['welfare', 'expanded']],
  3: [['healthcare', 'public']],
  5: [['housing', 'housingfirst'], ['drug', 'decriminalized']],
  7: [['education', 'vocational'], ['military', 'cut25']],
  9: [['immigration', 'reformed']],
  13: [['tax', 20]],
  17: [['education', 'yearround'], ['drug', 'legal']],
  21: [['tariffs', 5]],
  25: [['healthcare', 'universal']],
  29: [['tax', 30], ['tariffs', 0]],
  33: [['infra', 1.5]],
};
// campaign actions are applied AFTER advancing into a campaign window turn,
// mirroring the UI (player reaches turn 13/29, then campaigns).
const campaignPlan = { 13: ['grassroots', 'debate'], 14: ['ads'], 15: ['endorsement'], 16: ['grassroots'],
                       29: ['grassroots', 'ads'], 30: ['debate'], 31: ['endorsement'], 32: ['grassroots'] };

let failures = [];
function check(cond, msg) { if (!cond) failures.push(msg); }
function finite(st) {
  const keys = ['gdp_level', 'gdp_nominal', 'growth', 'unemployment', 'debt_gdp', 'deficit_bn', 'revenue_bn',
    'inflation', 'med_income', 'homelessness', 'overdoses', 'incarcerated', 'sentiment', 'legitimacy', 'pc', 'funds'];
  return keys.every(k => Number.isFinite(st[k])) &&
    Object.values(st.det).every(Number.isFinite) &&
    Object.values(st.approval).every(Number.isFinite);
}

for (let t = 1; t <= 40 && !g.over; t++) {
  (script[t] || []).forEach(([id, val]) => {
    const res = ENGINE.applyPolicy(g, id, val);
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
console.log('\n=== PoliSim-DBE self-test ===');
console.log('turns simulated :', s.turn, '| over:', s.over, '|', s.overReason || '(running)');
console.log('elections       :', JSON.stringify(s.elections));
console.log('final year      : Q' + s.quarter + ' ' + s.year);
const f = (x, d = 1) => Number(x).toFixed(d);
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
console.log('determinants    :', JSON.stringify(Object.fromEntries(Object.entries(s.det).map(([k, v]) => [k, f(v, 1)]))));

// --- plausibility checks ---
check(s.turn >= 32, 'should reach at least turn 32 (second election), got ' + s.turn);
check(s.gdp_level > 14000 && s.gdp_level < 30000, 'gdp_level out of range: ' + s.gdp_level);
check(s.unemployment >= 3 && s.unemployment <= 25, 'unemployment out of range: ' + s.unemployment);
check(s.debt_gdp >= 40 && s.debt_gdp <= 250, 'debt_gdp out of range: ' + s.debt_gdp);
check(s.med_income > 50000 && s.med_income < 150000, 'med_income out of range: ' + s.med_income);
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
check(s.elections.length >= 1, 'at least one election should have occurred');
s.elections.forEach(e => check(e.won, 'fixed script should win the turn-' + e.turn + ' election (got ' + e.pct + '%)'));

if (failures.length) {
  console.log('\nFAILURES:');
  failures.forEach(m => console.log(' ✗', m));
  process.exit(1);
}
console.log('\nAll checks passed ✔');

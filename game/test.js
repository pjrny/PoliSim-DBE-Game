/* PoliSim-DBE — test.js
 * Node self-test harness for engine.js (+ data.js when present).
 * Run: node test.js
 *
 * Deterministic: seeds the RNG so results are reproducible.
 */
'use strict';

var path = require('path');
var Engine = require(path.join(__dirname, 'js', 'engine.js'));
var DATA = null;
try { DATA = require(path.join(__dirname, 'js', 'data.js')); } catch (e) { /* optional */ }

// Deterministic RNG (mulberry32)
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

var failures = [];
var checks = 0;
function check(cond, label) {
  checks++;
  if (!cond) failures.push(label);
  if (!cond) console.log('  FAIL: ' + label);
}
function near(a, b, tol, label) { check(Math.abs(a - b) <= (tol || 1e-6), label + ' (got ' + a + ', want ~' + b + ')'); }

if (typeof Engine.createGame !== 'function') {
  console.error('engine.js must export createGame');
  process.exit(1);
}

// ---------- engine-only state machine tests ----------
console.log('\n=== PoliSim-DBE self-test (v0.3) ===');

Math.random = mulberry32(42);
var s = Engine.createGame();

// T1: initial state sane
check(s && s.gdp_level > 0, 'T1: initial gdp_level positive');
check(s.debt_gdp > 0 && s.debt_gdp < 300, 'T1: initial debt_gdp sane');
check(typeof Engine.tick === 'function', 'T1: Engine.tick exported');

// T2: advance a turn, determinism (same seed → same result)
Math.random = mulberry32(7);
var s1 = Engine.tick(Engine.createGame());
Math.random = mulberry32(7);
var s2 = Engine.tick(Engine.createGame());
near(s1.gdp_level, s2.gdp_level, 1e-9, 'T2: deterministic tick');

// T3: spending raises deficit; taxes raise revenue
Math.random = mulberry32(1);
var a = Engine.createGame();
a.budgets = { defense: 900, infrastructure: 900, health: 900, education: 900, welfare: 900, justice: 900, environment: 900, science: 900, housing: 900, admin: 900 };
var a1 = Engine.tick(a);
Math.random = mulberry32(1);
var b = Engine.createGame();
b.budgets = { defense: 0, infrastructure: 0, health: 0, education: 0, welfare: 0, justice: 0, environment: 0, science: 0, housing: 0, admin: 0 };
var b1 = Engine.tick(b);
check(a1.deficit > b1.deficit, 'T3: max budgets => larger deficit');

// T4: funded share => money supply grows faster
Math.random = mulberry32(1);
var c = Engine.createGame(); c.fundedShare = 100;
var c1 = Engine.tick(c);
Math.random = mulberry32(1);
var d = Engine.createGame(); d.fundedShare = 0;
var d1 = Engine.tick(d);
check(c1.money_supply > d1.money_supply, 'T4: funded share grows money supply');

// T5: CSV export shape
check(typeof Engine.exportCSV === 'function', 'T5: exportCSV exported');
if (typeof Engine.exportCSV === 'function') {
  Math.random = mulberry32(3);
  var s = Engine.createGame();
  Engine.tick(s); Engine.tick(s);
  var csv = Engine.exportCSV(s);
  var lines = csv.trim().split(/\r?\n/);
  check(lines.length >= 3, 'T5: CSV has header + 2+ rows');
  check(/turn/.test(lines[0]) && /gdp/.test(lines[0]), 'T5: CSV header mentions turn/gdp');
  check(ENGINE.exportCSV(s).split('\n').length === s.turn + 1, 'CSV row count mismatch');
}

// ---------- data.js consistency (if present) ----------
if (DATA && DATA.POLICY_DEFS) {
  console.log('\n[policies]');
  var ids = {};
  DATA.POLICY_DEFS.forEach(function (p) {
    check(p.id && !ids[p.id], 'P: unique id ' + p.id);
    ids[p.id] = true;
    check(typeof p.label === 'string' && p.label.length > 0, 'P: label for ' + p.id);
    check(typeof p.type === 'string', 'P: type for ' + p.id);
  });
  check(DATA.POLICY_DEFS.length >= 10, 'P: at least 10 policy levers');
}

if (DATA && DATA.SCENARIOS) {
  console.log('\n[scenarios]');
  Object.keys(DATA.SCENARIOS).forEach(function (k) {
    var sc = DATA.SCENARIOS[k];
    check(sc.name && sc.startYear, 'S: ' + k + ' has name/startYear');
    check(sc.startState && sc.startState.gdp_level > 0, 'S: ' + k + ' startState sane');
  });
  // scenario tick smoke test
  var first = DATA.SCENARIOS[Object.keys(DATA.SCENARIOS)[0]];
  if (first) {
    Math.random = mulberry32(11);
    var sg = Engine.createGame(Object.keys(DATA.SCENARIOS)[0]);
    for (var i = 0; i < 3; i++) sg = Engine.tick(sg);
    check(sg.gdp_level > 0, 'S: scenario survives 3 ticks');
    check(sg.turn === 3, 'S: turn counter advances');
  }
}

if (DATA && DATA.ACT_DEFS) {
  console.log('\n[acts]');
  check(DATA.ACT_DEFS.length >= 3, 'A: at least 3 acts defined');
  DATA.ACT_DEFS.forEach(function (a) {
    check(a.id && a.label, 'A: id/label for ' + a.id);
  });
  // apply an act if engine supports it
  if (typeof Engine.passAct === 'function') {
    Math.random = mulberry32(5);
    var g = Engine.createGame();
    var before = g.approval;
    g = Engine.passAct(g, DATA.ACT_DEFS[0].id);
    check(g.acts && g.acts.length === 1, 'A: passAct records the act');
  }
}

console.log('\n[' + checks + ' checks, ' + failures.length + ' failures]');
if (failures.length) {
  console.log('\nFAILURES:');
  failures.forEach(function (f) { console.log(' - ' + f); });
  process.exit(1);
}
console.log('\nAll checks passed ✔');

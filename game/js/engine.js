/* ============================================================================
   PoliSim-DBE — engine.js
   Pure simulation logic. No DOM access. Works in browser (window.ENGINE)
   and in Node (module.exports) for testing.
   ========================================================================== */
(function (root, factory) {
  var E = factory(root);
  root.ENGINE = E;
  if (typeof module !== 'undefined' && module.exports) module.exports = E;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';

  var H = root.HISTORY;
  var POLICIES = root.POLICY_DEFS;
  var VG = root.VOTER_GROUPS;
  var EV = root.EVENTS;

  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function round(x, d) { var m = Math.pow(10, d || 2); return Math.round(x * m) / m; }

  var POLICY_MAP = {};
  POLICIES.forEach(function (p) { POLICY_MAP[p.id] = p; });
  var GROUP_IDS = Object.keys(VG.weights);
  var DET_IDS = ['education', 'innovation', 'competitiveness', 'military', 'trade', 'output', 'fincenter', 'reserve_fx'];

  function getOption(def, val) {
    for (var i = 0; i < def.options.length; i++) if (def.options[i].id === val) return def.options[i];
    return def.options[0];
  }

  /* ---- group deltas for slider policies (per-unit-of-value, from config) ---- */
  function sliderGroupDelta(def, value) {
    // value normalized 0..1 across slider range
    var n = (value - def.min) / (def.max - def.min);
    var out = {};
    if (def.id === 'tax' && n > 0.3) { out.workers = -8 * n; out.seniors = -4 * n; out.capitalists = 4 * n; out.technocrats = 2 * n; }
    if (def.id === 'tariffs') { out.workers = 6 * n; out.capitalists = -6 * n; out.technocrats = -4 * n; }
    if (def.id === 'infra') { out.workers = 5 * n; out.technocrats = 3 * n; out.capitalists = -2 * n; }
    return out;
  }

  function optionGroups(def, value) {
    if (def.kind === 'slider') return sliderGroupDelta(def, value);
    return (getOption(def, value).groups) || {};
  }

  /* ---- political capital cost of a change ---- */
  function changeCost(def, from, to) {
    if (from === to) return 0;
    if (def.kind === 'slider') {
      var steps = Math.abs(to - from) / def.step;
      return clamp(Math.round(steps * def.pcPerStep), def.minPc, def.maxPc);
    }
    return getOption(def, to).pc;
  }

  /* ---- initial state ---- */
  function createGame() {
    var s = EV.start;
    var pol = {};
    POLICIES.forEach(function (p) {
      pol[p.id] = { value: p.def, from: p.def, ramp: 1, lag: p.lag }; // ramp 1 = settled
    });
    return {
      turn: 0, year: s.year, quarter: s.quarter,
      gdp_level: s.gdp_level, priceIndex: s.priceIndex, gdp_nominal: s.gdp_level * s.priceIndex,
      growth: 0, unemployment: s.unemployment, debt_gdp: s.debt_gdp,
      deficit_bn: 0, revenue_bn: 0, inflation: s.inflation, med_income: s.med_income,
      homelessness: s.homelessness, overdoses: s.overdoses, incarcerated: s.incarcerated,
      sentiment: s.sentiment, legitimacy: s.legitimacy,
      pc: s.pc, funds: s.funds,
      det: Object.assign({}, s.determinants),
      approval: Object.assign({}, VG.initial),
      pol: pol,
      groupQueue: [],        // [{delta:{}, remaining, total}]
      rentban: null,         // {t: n} while rental ban active
      campaignUsed: {},      // action -> count (diminishing returns)
      elections: [],         // results
      over: false, overReason: null, won: false,
      log: [],               // [{turn,label,items:[]}]
      snapshots: [],         // per-turn metric history
      pollHistory: [{ turn: 0, pct: weightedApprovalFrom(VG.initial) }],
      pendingLog: []         // policy-change messages for the next turn entry
    };
  }

  function weightedApprovalFrom(appr) {
    var sum = 0, w = 0;
    GROUP_IDS.forEach(function (g) { sum += appr[g] * VG.weights[g]; w += VG.weights[g]; });
    return sum / w;
  }
  function weightedApproval(st) { return weightedApprovalFrom(st.approval); }

  /* ---- apply a policy change (player action). Returns {ok, msg} ---- */
  function applyPolicy(st, id, newValue) {
    if (st.over) return { ok: false, msg: 'Game is over.' };
    var def = POLICY_MAP[id];
    if (!def) return { ok: false, msg: 'Unknown policy.' };
    if (def.kind === 'slider') {
      newValue = clamp(Number(newValue), def.min, def.max);
      newValue = Math.round(newValue / def.step) * def.step;
      newValue = round(newValue, 2);
    } else {
      var okOpt = def.options.some(function (o) { return o.id === newValue; });
      if (!okOpt) return { ok: false, msg: 'Unknown option.' };
    }
    var ps = st.pol[id];
    var cur = ps.value;
    if (cur === newValue) return { ok: false, msg: 'No change.' };
    var cost = changeCost(def, cur, newValue);
    if (st.pc < cost) return { ok: false, msg: 'Not enough Political Capital (need ' + cost + ', have ' + Math.floor(st.pc) + ').' };
    st.pc -= cost;

    // queue one-time group approval delta (new minus old), applied over the lag
    var og = optionGroups(def, cur), ng = optionGroups(def, newValue);
    var delta = {};
    GROUP_IDS.forEach(function (g) { delta[g] = (ng[g] || 0) - (og[g] || 0); });
    var lag = def.lag;
    st.groupQueue.push({ delta: delta, remaining: lag, total: lag });

    ps.from = cur; ps.value = newValue; ps.ramp = 0; ps.lag = lag;

    // rental-ban special regime toggling
    if (id === 'housing') {
      if (newValue === 'rentban') st.rentban = { t: 0 };
      else st.rentban = null;
    }
    var label = def.kind === 'slider' ? (newValue + def.unit) : getOption(def, newValue).label;
    st.pendingLog.push('Policy changed: ' + def.name + ' → ' + label + ' (−' + cost + ' PC, full effect in ' + lag + ' turn' + (lag > 1 ? 's' : '') + ').');
    return { ok: true, msg: def.name + ' → ' + label + ' (−' + cost + ' PC)' };
  }

  /* ---- campaign actions ---- */
  var CAMPAIGN = {
    ads:        { name: 'Ad Blitz $',    cost: 25, fx: { workers: 1.5, capitalists: 1.5, youth: 1.5, seniors: 1.5, religious: 1.5, immigrants: 1.5, technocrats: 1.5 } },
    debate:     { name: 'Debate',        cost: 15, fx: { technocrats: 2.5, youth: 2, workers: 1 } },
    grassroots: { name: 'Grassroots',    cost: 20, fx: { workers: 3, immigrants: 3, youth: 2 } },
    endorsement:{ name: 'Endorsement',   cost: 15, fx: { religious: 4, seniors: 3 } }
  };

  function campaignOpen(st) {
    return EV.campaignWindows.some(function (w) { return st.turn >= w[0] && st.turn <= w[1]; });
  }

  function applyCampaign(st, actionId) {
    if (st.over) return { ok: false, msg: 'Game is over.' };
    if (!campaignOpen(st)) return { ok: false, msg: 'Campaign actions unlock near elections (turns 13–16 and 29–32).' };
    var a = CAMPAIGN[actionId];
    if (!a) return { ok: false, msg: 'Unknown action.' };
    if (st.funds < a.cost) return { ok: false, msg: 'Not enough campaign funds (need $' + a.cost + 'M, have $' + Math.floor(st.funds) + 'M).' };
    st.funds -= a.cost;
    var n = st.campaignUsed[actionId] || 0;
    var mult = Math.pow(0.85, n); // diminishing returns
    st.campaignUsed[actionId] = n + 1;
    var parts = [];
    GROUP_IDS.forEach(function (g) {
      var d = (a.fx[g] || 0) * mult;
      if (d) { st.approval[g] = clamp(st.approval[g] + d, 0, 100); parts.push(VG.labels[g] + ' +' + round(d, 1)); }
    });
    st.pendingLog.push('Campaign: ' + a.name + ' (−$' + a.cost + 'M' + (n > 0 ? ', diminishing ×' + round(mult, 2) : '') + ') → ' + parts.join(', ') + '.');
    return { ok: true, msg: a.name + ': ' + parts.join(', ') };
  }

  /* ---- aggregate effective policy effects (ramps applied) ---- */
  function aggregateEffects(st) {
    var fx = {
      demand: 0, outlay: 0, revAdd: 0, tariff: 0, vat: 0, infraGDP: 0,
      homelessPct: 0, odPct: 0, incarcPct: 0, rentPressure: 0,
      workersBonus: 0, det: {}, groupDrift: {}
    };
    DET_IDS.forEach(function (d) { fx.det[d] = 0; });
    GROUP_IDS.forEach(function (g) { fx.groupDrift[g] = 0; });

    POLICIES.forEach(function (def) {
      var ps = st.pol[def.id];
      var r = ps.ramp;
      if (def.kind === 'slider') {
        var val = (typeof ps.from === 'number' ? ps.from : 0) + ((ps.value - (typeof ps.from === 'number' ? ps.from : 0)) * r);
        if (def.id === 'tax') { fx.vat = val / 100; fx.det.competitiveness += 0.03 * (val / 25); }
        if (def.id === 'tariffs') {
          fx.tariff = val;
          if (def.groupDriftPerPt) GROUP_IDS.forEach(function (g) { fx.groupDrift[g] += (def.groupDriftPerPt[g] || 0) * val; });
        }
        if (def.id === 'infra') {
          fx.infraGDP = val;
          fx.demand += 0.25 * val;                 // +0.25pp growth per 1% GDP
          fx.outlay += val;                        // costs what it says
          if (val >= 1.5) fx.det.innovation += 0.25;
          fx.det.output += 0.1 * val;
          if (def.groupDriftPerPt) GROUP_IDS.forEach(function (g) { fx.groupDrift[g] += (def.groupDriftPerPt[g] || 0) * val; });
        }
        return;
      }
      var opt = getOption(def, ps.value);
      var f = opt.fx || {};
      var m = r; // linear ramp
      fx.demand += (f.demand || 0) * m;
      fx.outlay += (f.outlay || 0) * m;
      fx.revAdd += (f.revAdd || 0) * m;
      fx.homelessPct += (f.homelessPct || 0) * m;
      fx.odPct += (f.odPct || 0) * m;
      fx.incarcPct += (f.incarcPct || 0) * m;
      fx.rentPressure += (f.rentPressure || 0) * m;
      fx.workersBonus += (f.workersBonus || 0) * m;
      if (f.det) DET_IDS.forEach(function (d) { fx.det[d] += (f.det[d] || 0) * m; });
      if (f.groupDrift) GROUP_IDS.forEach(function (g) { fx.groupDrift[g] += (f.groupDrift[g] || 0) * m; });
    });
    return fx;
  }

  function gfcShock(turn) { return EV.gfc.shocks[turn] || 0; }

  /* ---- Big Cycle composite & phase ---- */
  function computePower(st) {
    var mean = 0;
    DET_IDS.forEach(function (d) { mean += st.det[d]; });
    mean /= DET_IDS.length;
    var spread = 0, mn = 100, mx = 0;
    GROUP_IDS.forEach(function (g) { mn = Math.min(mn, st.approval[g]); mx = Math.max(mx, st.approval[g]); });
    spread = mx - mn;
    var polarization = 0.3 * spread;
    var debtBurden = clamp(st.debt_gdp - 60, 0, 100);
    var conflict = clamp(60 - st.sentiment + polarization, 0, 100);
    var S = mean - 0.25 * debtBurden - 0.25 * conflict;
    return { S: S, mean: mean, debtBurden: debtBurden, conflict: conflict, polarization: polarization };
  }

  function phaseOf(S) {
    if (S >= 70) return { name: 'The Rise', desc: 'Productive, cohesive, competitive: a virtuous cycle of investment and rising living standards.' };
    if (S >= 58) return { name: 'The Top', desc: 'Peak power, but strengths are priced in and complacency sets in. Watch debt and internal conflict.' };
    if (S >= 46) return { name: 'Early Decline', desc: 'Debt burdens grow, competitiveness erodes, and the society spends past strength on consumption.' };
    if (S >= 36) return { name: 'Late Decline', desc: 'High debt, weak productivity growth, internal polarization; the reserve currency privilege is at risk.' };
    return { name: 'Reset / New Order', desc: 'The old order breaks down: debt restructuring, political realignment, and a new domestic/world order emerge.' };
  }

  /* ---- main turn advance ---- */
  function advanceTurn(st) {
    if (st.over) return st;
    st.turn += 1;
    st.year = 2008 + Math.floor((st.turn - 1) / 4);
    st.quarter = ((st.turn - 1) % 4) + 1;
    var items = [];
    if (st.pendingLog.length) { items = items.concat(st.pendingLog); st.pendingLog = []; }

    st.pc = Math.min(100, st.pc + 8);
    st.funds = Math.min(100, st.funds + 5);

    // advance ramps
    POLICIES.forEach(function (def) {
      var ps = st.pol[def.id];
      if (ps.ramp < 1) {
        ps.ramp = Math.min(1, ps.ramp + 1 / ps.lag);
        if (ps.ramp === 1) items.push(def.name + ': policy now at full effect (lag complete).');
      }
    });

    // apply queued one-time group shifts
    st.groupQueue = st.groupQueue.filter(function (q) {
      GROUP_IDS.forEach(function (g) {
        st.approval[g] = clamp(st.approval[g] + (q.delta[g] || 0) / q.total, 0, 100);
      });
      q.remaining -= 1;
      return q.remaining > 0;
    });

    var fx = aggregateEffects(st);
    var det = st.det;

    // --- growth block ---
    var gstar = 2.0 + 0.03 * (det.innovation - 60) + 0.02 * (det.education - 60) + 0.02 * (det.competitiveness - 60);
    var shock = gfcShock(st.turn);
    var tariffDrag = 0.08 * fx.tariff;
    var debtDrag = Math.max(0, st.debt_gdp - 90) * 0.012;
    // output-gap closure: slack labor market supports above-trend catch-up growth
    var gapBoost = clamp(0.4 * (st.unemployment - 5.5), 0, 2.5);
    var growth = clamp(gstar + fx.demand - tariffDrag - debtDrag + shock + gapBoost, -12, 12);
    st.growth = growth;
    var gwhy = 'Growth ' + round(growth, 2) + '% = potential ' + round(gstar, 2) +
      (fx.demand ? ' + stimulus ' + round(fx.demand, 2) : '') +
      (fx.tariff ? ' − tariff drag ' + round(tariffDrag, 2) : '') +
      (debtDrag > 0.005 ? ' − debt drag ' + round(debtDrag, 2) : '') +
      (gapBoost > 0.005 ? ' + recovery gap ' + round(gapBoost, 2) : '') +
      (shock ? ' + crisis shock ' + shock : '') + '.';
    items.push(gwhy);

    // --- inflation ---
    var infTarget = 2 + 0.25 * (growth - gstar) + 0.04 * fx.tariff + (st.turn <= 5 ? -1.2 : 0);
    st.inflation = clamp(st.inflation + 0.25 * (infTarget - st.inflation), -2, 12);

    // --- GDP ---
    st.gdp_level *= (1 + growth / 400);
    st.priceIndex *= (1 + st.inflation / 400);
    st.gdp_nominal = st.gdp_level * st.priceIndex;

    // --- Okun (+ crisis labor-market scarring) ---
    var dUnemp = -0.4 * (growth - gstar) / 4;
    var uShock = (EV.gfc.unempShock || {})[st.turn] || 0;
    st.unemployment = clamp(st.unemployment + dUnemp + uShock, 3, 25);

    // --- median income ---
    var miGrowth = (growth - 0.5) / 4 + fx.workersBonus / 4; // % per quarter
    st.med_income *= (1 + miGrowth / 100);

    // --- budget ---
    var crisisOutlay = (EV.gfc.outlayShock || {})[st.turn] || 0; // automatic stabilizers + rescue
    var revShare = 17.5 + fx.vat * 4.5 + 0.35 * fx.tariff + fx.revAdd;
    var outShare = 20.5 + fx.outlay + crisisOutlay;
    st.revenue_bn = revShare / 100 * st.gdp_nominal;
    var outlays = outShare / 100 * st.gdp_nominal;
    st.deficit_bn = outlays - st.revenue_bn;
    if (crisisOutlay) items.push('Crisis automatic stabilizers & rescue programs add ' + crisisOutlay.toFixed(1) + '% of GDP to outlays.');
    st.revenue_bn = revShare / 100 * st.gdp_nominal;
    var outlays = outShare / 100 * st.gdp_nominal;
    st.deficit_bn = outlays - st.revenue_bn;

    // --- debt dynamics (r − g) ---
    var r = 2 + Math.max(0, st.debt_gdp - 90) * 0.05;
    var gNom = growth + st.inflation;
    st.debt_gdp = clamp(st.debt_gdp + (st.deficit_bn / st.gdp_nominal * 100) / 4 + (r - gNom) * st.debt_gdp / 400, 20, 250);

    // --- homelessness ---
    var hPct;
    if (st.rentban) {
      st.rentban.t += 1;
      var shockPct = st.rentban.t <= 4 ? 6 : -4;
      hPct = 0.8 * dUnemp + shockPct;
      items.push('Rental-market ban: ' + (st.rentban.t <= 4 ? 'market shock' : 'supply collapse aftermath') + ' drives homelessness ' + (shockPct > 0 ? '+' : '') + shockPct + '%/qtr.');
    } else {
      var rentP = (st.year <= 2012 ? 1.0 : 2.0) + fx.rentPressure;
      hPct = 0.8 * dUnemp + 1.2 * rentP + fx.homelessPct;
    }
    st.homelessness = clamp(st.homelessness * (1 + hPct / 100), 200, 5000);

    // --- overdoses ---
    var odBase = st.year <= 2012 ? 2.0 : (st.year <= 2015 ? 3.5 : 2.0);
    st.overdoses = clamp(st.overdoses * (1 + (odBase + fx.odPct) / 100), 5000, 400000);

    // --- incarcerated ---
    st.incarcerated = clamp(st.incarcerated * (1 + (-0.2 + fx.incarcPct) / 100), 0.8, 4);

    // --- determinants drift ---
    det.education += fx.det.education;
    det.innovation += fx.det.innovation + 0.1;                  // baseline tech leadership
    det.competitiveness += fx.det.competitiveness + 0.05 - 0.05 * fx.tariff;
    det.military += fx.det.military;
    det.trade += fx.det.trade - 0.1 * fx.tariff;
    var outTarget = clamp(88 + 60 * (st.gdp_level / EV.start.gdp_level - 1), 0, 100);
    det.output += 0.3 * (outTarget - det.output);
    det.fincenter += (st.debt_gdp > 110 ? -0.15 : 0.02);
    det.reserve_fx += (st.debt_gdp > 120 ? -0.1 : 0.005) + (st.inflation > 5 ? -0.05 : 0);
    DET_IDS.forEach(function (d) { det[d] = clamp(det[d], 0, 100); });

    // --- voter group outcome drift ---
    var ap = st.approval;
    GROUP_IDS.forEach(function (g) { ap[g] = clamp(ap[g] + fx.groupDrift[g], 0, 100); });
    ap.workers = clamp(ap.workers + clamp(-dUnemp, -1, 1) * 1.5, 0, 100);
    ap.capitalists = clamp(ap.capitalists - 0.25 * Math.max(0, (st.debt_gdp - (st._prevDebt || st.debt_gdp))), 0, 100);
    var odPctNow = (odBase + fx.odPct);
    ap.seniors = clamp(ap.seniors + clamp(-odPctNow, -1, 1) * 0.8 + 0.05, 0, 100);
    ap.youth = clamp(ap.youth + clamp(miGrowth, -2, 2) * 0.8, 0, 100);
    ap.immigrants = clamp(ap.immigrants + clamp(-hPct, -1, 1) * 0.5, 0, 100);
    var pw = computePower(st);
    ap.technocrats = clamp(ap.technocrats + (pw.S > (st._prevS || pw.S) ? 0.3 : -0.2), 0, 100);
    ap.religious = clamp(ap.religious + 0.05 * (52 - ap.religious) / 4, 0, 100); // gentle mean reversion
    st._prevDebt = st.debt_gdp; st._prevS = pw.S;

    // --- sentiment & legitimacy ---
    var meanAppr = 0; GROUP_IDS.forEach(function (g) { meanAppr += ap[g]; }); meanAppr /= GROUP_IDS.length;
    var goodwill = clamp((meanAppr - 50) / 5, -6, 6);
    st.sentiment = clamp(
      30 + 0.3 * (50 - st.unemployment * 5) + 0.5 * (miGrowth * 4) - 0.3 * hPct + goodwill,
      0, 100);
    st.legitimacy = clamp(st.legitimacy + 0.25 * (st.sentiment - st.legitimacy), 0, 100);

    // --- power score / phase ---
    var power = computePower(st);
    var phase = phaseOf(power.S);

    // --- snapshot ---
    st.snapshots.push({
      turn: st.turn, year: st.year, quarter: st.quarter,
      gdp_level: round(st.gdp_level, 1), gdp_nominal: round(st.gdp_nominal, 1),
      growth: round(growth, 2), unemployment: round(st.unemployment, 2),
      debt_gdp: round(st.debt_gdp, 2), deficit_bn: round(st.deficit_bn, 1),
      revenue_bn: round(st.revenue_bn, 1), inflation: round(st.inflation, 2),
      med_income: round(st.med_income, 0), homelessness: round(st.homelessness, 1),
      overdoses: round(st.overdoses, 0), incarcerated: round(st.incarcerated, 3),
      sentiment: round(st.sentiment, 1), legitimacy: round(st.legitimacy, 1),
      S: round(power.S, 1), phase: phase.name,
      det: DET_IDS.reduce(function (o, d) { o[d] = round(det[d], 1); return o; }, {})
    });
    st.pollHistory.push({ turn: st.turn, pct: round(weightedApproval(st), 1) });

    // --- elections / endings ---
    if (EV.elections.indexOf(st.turn) >= 0) {
      var pct = weightedApproval(st);
      var res = { turn: st.turn, year: st.year, pct: round(pct, 1), won: pct >= 50 };
      st.elections.push(res);
      if (res.won) {
        st.legitimacy = clamp(st.legitimacy + 12, 0, 100);
        items.push('🗳️ ELECTION WON — weighted approval ' + res.pct + '% ≥ 50%. Mandate renewed: legitimacy +12.');
      } else {
        st.over = true; st.won = false;
        st.overReason = 'Lost the ' + st.year + ' election — weighted approval ' + res.pct + '% < 50%. Your administration ends.';
        items.push('🗳️ ELECTION LOST — weighted approval ' + res.pct + '% < 50%. Your administration ends.');
      }
    }
    if (!st.over && st.legitimacy <= 15) {
      st.over = true; st.won = false;
      st.overReason = 'Legitimacy collapsed (≤15). Mass unrest and institutional crisis force you from office.';
      items.push('💥 COLLAPSE — legitimacy hit ' + round(st.legitimacy, 0) + '. The government falls.');
    }
    if (!st.over && st.turn >= EV.maxTurns) {
      st.over = true; st.won = true;
      st.overReason = 'Full term served (2008–2017). Final phase: ' + phase.name + ' (power score ' + round(power.S, 1) + '). ';
      items.push('🏁 End of simulation — 10 years in office complete.');
    }

    st.log.push({ turn: st.turn, label: 'Q' + st.quarter + ' ' + st.year, items: items });
    return st;
  }

  /* ---- exports / reporting ---- */
  function exportJSON(st) {
    return JSON.stringify({ game: 'PoliSim-DBE v0.2', elections: st.elections, over: st.over, overReason: st.overReason, log: st.log, snapshots: st.snapshots }, null, 1);
  }

  function exportCSV(st) {
    var cols = ['turn', 'year', 'quarter', 'gdp_level', 'gdp_nominal', 'growth', 'unemployment', 'debt_gdp', 'deficit_bn', 'revenue_bn', 'inflation', 'med_income', 'homelessness', 'overdoses', 'incarcerated', 'sentiment', 'legitimacy', 'S', 'phase', 'education', 'innovation', 'competitiveness', 'military', 'trade', 'output', 'fincenter', 'reserve_fx'];
    var lines = [cols.join(',')];
    st.snapshots.forEach(function (s) {
      lines.push(cols.map(function (c) {
        if (DET_IDS.indexOf(c) >= 0) return s.det[c];
        return s[c];
      }).join(','));
    });
    return lines.join('\n');
  }

  return {
    createGame: createGame,
    applyPolicy: applyPolicy,
    applyCampaign: applyCampaign,
    advanceTurn: advanceTurn,
    weightedApproval: weightedApproval,
    computePower: computePower,
    phaseOf: phaseOf,
    campaignOpen: campaignOpen,
    changeCost: changeCost,
    exportJSON: exportJSON,
    exportCSV: exportCSV,
    CAMPAIGN: CAMPAIGN,
    DET_IDS: DET_IDS,
    GROUP_IDS: GROUP_IDS
  };
});

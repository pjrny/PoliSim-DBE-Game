/* ============================================================================
   PoliSim-DBE — engine.js  (v0.3)
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
  var BUDGET = root.BUDGET_CATS || [];
  var SECTORS = root.NEW_SECTORS || [];
  var NETDEF = root.NETWORK_DEF || [];

  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function round(x, d) { var m = Math.pow(10, d || 2); return Math.round(x * m) / m; }

  var POLICY_MAP = {};
  POLICIES.forEach(function (p) { POLICY_MAP[p.id] = p; });
  var GROUP_IDS = Object.keys(VG.weights);
  var DET_IDS = ['education', 'innovation', 'competitiveness', 'military', 'trade', 'output', 'fincenter', 'reserve_fx'];
  var NOM_GDP_2008 = 14608.209; // FRED GDP 2008 — budget baselines are $bn of this year

  function getOption(def, val) {
    for (var i = 0; i < def.options.length; i++) if (def.options[i].id === val) return def.options[i];
    return def.options[0];
  }
  function optionLag(def, val) {
    if (def.kind === 'slider') return def.lag;
    var o = getOption(def, val);
    return o.lag || def.lag;
  }

  /* ---- election timing (v0.3: presidentials 20/36/52..., midterms 12/28/44...) ---- */
  var E0 = EV.electionStart || 20, ECYC = EV.electionCycle || 16, M0 = EV.midtermStart || 12;
  function isPresElection(t) { return t >= E0 && (t - E0) % ECYC === 0; }
  function isMidterm(t) { return t >= M0 && (t - M0) % ECYC === 0; }
  function nextPresElection(t) { var e = E0; while (e <= t) e += ECYC; return e; }
  function campaignOpen(st) {
    // campaign window = turns (e−3)..e around each presidential election
    var t = st.turn;
    if (t < E0 - 3) return false;
    var m = (t - E0) % ECYC; if (m < 0) m += ECYC;
    return m >= ECYC - 3 || m === 0;
  }

  /* ---- news source (window.NEWS injected by js/news.js; defensive fallback) ---- */
  var NEWS_BUILTIN = {
    turns: {},
    generic: {
      h: [
        'Fed officials signal patience as lawmakers debate the federal budget outlook.',
        'Economists remain split on the durability of the recovery, citing housing and credit conditions.',
        'Statehouses advance a patchwork of zoning, health and sentencing bills across the country.',
        'Pollsters report a restless electorate ahead of the next federal election cycle.',
        'Treasury yields steady as investors weigh deficit trajectories and growth data.'
      ],
      s: [
        '"another quarter, another promise. wake me when wages move 🙃 #MainStreet"',
        '"my rent went up AGAIN. do something about housing!! #HousingCrisis"',
        '"GDP line go up, my paycheck line go sideways. make it make sense."',
        '"just paid $9 for a latte but apparently inflation is \'contained\' lol"',
        '"can we get ONE infrastructure bill that actually builds something? #DoSomething"'
      ]
    },
    actReacts: {}
  };
  function newsSrc() {
    return (typeof root.NEWS !== 'undefined' && root.NEWS) ? root.NEWS : NEWS_BUILTIN;
  }
  function histNews(turn) {
    var N = newsSrc(), out = [];
    var tn = (N.turns && N.turns[String(turn)]) || null;
    var hs = (tn && tn.h && tn.h.length) ? tn.h : ((N.generic && N.generic.h && N.generic.h.length) ? N.generic.h : NEWS_BUILTIN.generic.h);
    var ss = (tn && tn.s && tn.s.length) ? tn.s : ((N.generic && N.generic.s && N.generic.s.length) ? N.generic.s : NEWS_BUILTIN.generic.s);
    // 1–2 historical items + 1 social post per turn (deterministic rotation)
    out.push({ lane: 'hist', text: hs[turn % hs.length] });
    if (hs.length > 1 && turn % 3 === 0) out.push({ lane: 'hist', text: hs[(turn + 1) % hs.length] });
    out.push({ lane: 'social', text: ss[turn % ss.length] });
    return out;
  }

  /* ---- group deltas for slider policies (per-unit-of-value, from config) ---- */
  function sliderGroupDelta(def, value) {
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

  /* ---- party → political capital capacity ---- */
  function pcStats(st) {
    var p = st.party;
    return {
      cap: 60 + 0.4 * (p.house + p.senate),
      regen: 4 + p.house / 435 * 4 + p.senate / 100 * 3 + p.governors / 50 * 2 + (p.president ? 2 : 0)
    };
  }

  /* ---- budget categories ---- */
  var BUDGET_MAP = {};
  BUDGET.forEach(function (c) { BUDGET_MAP[c.id] = c; });
  var SECTOR_MAP = {};
  SECTORS.forEach(function (s) { SECTOR_MAP[s.id] = s; });

  function catSharePct(cat) { return cat.base_bn / NOM_GDP_2008 * 100; } // % of GDP at mult 1

  function interestShare(st) {
    // effective average interest rate on the debt stock (auto, non-editable)
    var rEff = 2.7 + Math.max(0, st.debt_gdp - 90) * 0.05;
    return st.debt_gdp * rEff / 100; // % of GDP
  }

  /* budget-driven effects: category deviations from baseline + added sectors */
  function budgetEffects(st) {
    var fx = { demand: 0, homelessPct: 0, odPct: 0, incarcPct: 0, det: {}, groupDrift: {} };
    DET_IDS.forEach(function (d) { fx.det[d] = 0; });
    GROUP_IDS.forEach(function (g) { fx.groupDrift[g] = 0; });
    function acc(f, scale) {
      if (!f) return;
      fx.demand += (f.demand || 0) * scale;
      fx.homelessPct += (f.homelessPct || 0) * scale;
      fx.odPct += (f.odPct || 0) * scale;
      fx.incarcPct += (f.incarcPct || 0) * scale;
      if (f.det) DET_IDS.forEach(function (d) { fx.det[d] += (f.det[d] || 0) * scale; });
      if (f.groups) GROUP_IDS.forEach(function (g) { fx.groupDrift[g] += (f.groups[g] || 0) * scale; });
    }
    BUDGET.forEach(function (c) {
      if (c.locked) return;
      var dev = ((st.budget.mult[c.id] !== undefined ? st.budget.mult[c.id] : 1) - 1) * 10; // units of +10%
      if (dev !== 0) acc(c.fx, dev);
    });
    st.sectors.forEach(function (s) {
      var def = SECTOR_MAP[s.id];
      if (def) acc(def.fx100, s.mult);
    });
    return fx;
  }

  /* full budget computation: lines, totals (all $bn), shares (% of GDP) */
  function computeBudget(st, fxActs, crisisOutlay) {
    var g = st.gdp_nominal;
    var lines = [];
    var outBn = 0;
    BUDGET.forEach(function (c) {
      var share, mult, locked = !!c.locked;
      if (locked) {
        share = interestShare(st);
        mult = share / catSharePct(c);
      } else {
        mult = st.budget.mult[c.id] !== undefined ? st.budget.mult[c.id] : 1;
        share = catSharePct(c) * mult;
      }
      var bn = share / 100 * g;
      outBn += bn;
      lines.push({ id: c.id, name: c.name, bn: bn, share: share, mult: mult, locked: locked, deleted: !!st.budget.deleted[c.id] });
    });
    st.sectors.forEach(function (s) {
      var def = SECTOR_MAP[s.id];
      if (!def) return;
      var share = def.gdpPct * s.mult;
      var bn = share / 100 * g;
      outBn += bn;
      lines.push({ id: s.id, name: def.name, bn: bn, share: share, mult: s.mult, locked: false, sector: true });
    });
    var actOutlayBn = (fxActs ? fxActs.outlay : 0) / 100 * g;
    var crisisBn = (crisisOutlay || 0) / 100 * g;
    outBn += actOutlayBn + crisisBn;
    var tariffRevPerPt = 0.35 * 10 / Math.max(10, fxActs ? fxActs.tariff : 0); // Laffer saturation above 10%
    var revShare = 17.5 + (fxActs ? fxActs.vat * 4.5 : 0) + (fxActs ? tariffRevPerPt * fxActs.tariff : 0) + (fxActs ? fxActs.revAdd : 0);
    var revBn = revShare / 100 * g;
    return {
      lines: lines,
      outlays_bn: outBn, revenue_bn: revBn, deficit_bn: outBn - revBn,
      outlay_share: outBn / g * 100, revenue_share: revShare,
      interest_bn: interestShare(st) / 100 * g,
      act_outlays_bn: actOutlayBn, crisis_bn: crisisBn
    };
  }

  function applyBudget(st, catId, newMult) {
    if (st.over) return { ok: false, msg: 'Game is over.' };
    var cat = BUDGET_MAP[catId];
    if (!cat) return { ok: false, msg: 'Unknown budget category.' };
    if (cat.locked) return { ok: false, msg: 'Interest is automatic (debt-driven) and cannot be edited.' };
    newMult = clamp(Math.round(Number(newMult) * 10) / 10, 0, 2);
    var old = st.budget.mult[catId] !== undefined ? st.budget.mult[catId] : 1;
    if (newMult === old) return { ok: false, msg: 'No change.' };
    var cost = 2 * Math.round(Math.abs(newMult - old) * 10); // 2 PC per 10% change
    if (st.pc < cost) return { ok: false, msg: 'Not enough Political Capital (need ' + cost + ', have ' + Math.floor(st.pc) + ').' };
    st.pc -= cost;
    st.budget.mult[catId] = newMult;
    if (newMult > 0) st.budget.deleted[catId] = false;
    st.pendingLog.push('Budget: ' + cat.name + ' → ' + Math.round(newMult * 100) + '% of baseline (−' + cost + ' PC).');
    return { ok: true, msg: cat.name + ' → ' + Math.round(newMult * 100) + '% of baseline (−' + cost + ' PC)' };
  }

  function deleteBudgetCat(st, catId) {
    if (st.over) return { ok: false, msg: 'Game is over.' };
    var cat = BUDGET_MAP[catId];
    if (!cat) return { ok: false, msg: 'Unknown budget category.' };
    if (cat.locked) return { ok: false, msg: 'Interest is automatic (debt-driven) and cannot be deleted.' };
    if (st.budget.deleted[catId]) return { ok: false, msg: cat.name + ' is already zeroed out.' };
    var cost = 10;
    if (st.pc < cost) return { ok: false, msg: 'Not enough Political Capital (need ' + cost + ', have ' + Math.floor(st.pc) + ').' };
    st.pc -= cost;
    st.budget.mult[catId] = 0;
    st.budget.deleted[catId] = true;
    if (cat.backlash) {
      var delta = {};
      GROUP_IDS.forEach(function (g) { delta[g] = cat.backlash[g] || 0; });
      st.groupQueue.push({ delta: delta, remaining: 2, total: 2 });
    }
    st.pendingLog.push('Budget: ' + cat.name + ' DELETED (−' + cost + ' PC) — affected constituencies are furious.');
    return { ok: true, msg: cat.name + ' deleted (−' + cost + ' PC, backlash incoming)' };
  }

  function addSector(st, sectorId) {
    if (st.over) return { ok: false, msg: 'Game is over.' };
    var def = SECTOR_MAP[sectorId];
    if (!def) return { ok: false, msg: 'Unknown sector.' };
    for (var i = 0; i < st.sectors.length; i++) if (st.sectors[i].id === sectorId) return { ok: false, msg: def.name + ' already created.' };
    var cost = 8;
    if (st.pc < cost) return { ok: false, msg: 'Not enough Political Capital (need ' + cost + ', have ' + Math.floor(st.pc) + ').' };
    st.pc -= cost;
    st.sectors.push({ id: sectorId, mult: 1 });
    st.pendingLog.push('New federal sector created: ' + def.name + ' (' + def.gdpPct + '% of GDP baseline, −' + cost + ' PC).');
    return { ok: true, msg: def.name + ' sector created (−' + cost + ' PC)' };
  }

  /* ---- initial state ---- */
  function createGame() {
    var s = EV.start;
    var pol = {};
    POLICIES.forEach(function (p) {
      pol[p.id] = { value: p.def, from: p.def, ramp: 1, lag: p.lag, upkeepLeft: 0, upkeepPer: 0, stalled: false };
    });
    var mult = {};
    BUDGET.forEach(function (c) { mult[c.id] = 1; });
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
      budget: { mult: mult, deleted: {} },
      sectors: [],
      party: Object.assign({}, s.party),
      groupQueue: [],
      rentban: null,
      odAnchor: null,        // {level, opt} — cumulative overdose-reduction cap anchor
      homelessAnchor: null,  // {level, cap} — UBI homelessness-reduction cap anchor
      campaignUsed: {},
      elections: [],         // presidential results
      midterms: [],          // midterm seat reports
      over: false, overReason: null, won: false,
      log: [],
      newsLog: [],           // [{turn, lane, text}]
      snapshots: [],
      pollHistory: [{ turn: 0, pct: weightedApprovalFrom(VG.initial) }],
      pendingLog: [],
      pendingNews: []
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

    var og = optionGroups(def, cur), ng = optionGroups(def, newValue);
    var delta = {};
    GROUP_IDS.forEach(function (g) { delta[g] = (ng[g] || 0) - (og[g] || 0); });
    var lag = optionLag(def, newValue);
    st.groupQueue.push({ delta: delta, remaining: lag, total: lag });

    ps.from = cur; ps.value = newValue; ps.ramp = 0; ps.lag = lag; ps.stalled = false;
    var up = def.kind === 'slider' ? null : (getOption(def, newValue).upkeep || null);
    ps.upkeepPer = up ? up.perTurn : 0;
    ps.upkeepLeft = up ? up.turns : 0;

    if (id === 'housing') {
      if (newValue === 'rentban') st.rentban = { t: 0 };
      else st.rentban = null;
    }
    if (id === 'drug') {
      if (newValue === 'legal' || newValue === 'decriminalized') st.odAnchor = { level: st.overdoses, opt: newValue };
      else st.odAnchor = null;
    }
    if (id === 'ubi') {
      if (newValue === 'dividend') st.homelessAnchor = { level: st.homelessness, cap: 0.25 };
      else st.homelessAnchor = null;
    }
    var N = newsSrc();
    if (N.actReacts && N.actReacts[id] && N.actReacts[id].length) {
      st.pendingNews.push({ lane: 'react', text: N.actReacts[id][0] });
    }
    var label = def.kind === 'slider' ? (newValue + def.unit) : getOption(def, newValue).label;
    st.pendingLog.push('Act passed: ' + def.name + ' → ' + label + ' (−' + cost + ' PC' + (up ? ', upkeep ' + up.perTurn + ' PC/turn × ' + up.turns : '') + ', full effect in ' + lag + ' turn' + (lag > 1 ? 's' : '') + ').');
    return { ok: true, msg: def.name + ' → ' + label + ' (−' + cost + ' PC)' };
  }

  /* ---- campaign actions (available every turn; ×1.5 inside campaign windows) ---- */
  var CAMPAIGN = {
    ads:        { name: 'Ad Blitz $',    cost: 25, fx: { workers: 1.5, capitalists: 1.5, youth: 1.5, seniors: 1.5, religious: 1.5, immigrants: 1.5, technocrats: 1.5 } },
    debate:     { name: 'Debate',        cost: 15, fx: { technocrats: 2.5, youth: 2, workers: 1 } },
    grassroots: { name: 'Grassroots',    cost: 20, fx: { workers: 3, immigrants: 3, youth: 2 } },
    endorsement:{ name: 'Endorsement',   cost: 15, fx: { religious: 4, seniors: 3 } }
  };

  function applyCampaign(st, actionId) {
    if (st.over) return { ok: false, msg: 'Game is over.' };
    var a = CAMPAIGN[actionId];
    if (!a) return { ok: false, msg: 'Unknown action.' };
    if (st.funds < a.cost) return { ok: false, msg: 'Not enough campaign funds (need $' + a.cost + 'M, have $' + Math.floor(st.funds) + 'M).' };
    st.funds -= a.cost;
    var n = st.campaignUsed[actionId] || 0;
    var mult = Math.pow(0.85, n) * (campaignOpen(st) ? 1.5 : 1); // stronger in campaign windows
    st.campaignUsed[actionId] = n + 1;
    var parts = [];
    GROUP_IDS.forEach(function (g) {
      var d = (a.fx[g] || 0) * mult;
      if (d) { st.approval[g] = clamp(st.approval[g] + d, 0, 100); parts.push(VG.labels[g] + ' +' + round(d, 1)); }
    });
    st.pendingLog.push('Campaign: ' + a.name + ' (−$' + a.cost + 'M' + (n > 0 ? ', diminishing ×' + round(mult, 2) : '') + (campaignOpen(st) ? ', campaign-window ×1.5' : '') + ') → ' + parts.join(', ') + '.');
    return { ok: true, msg: a.name + ': ' + parts.join(', ') };
  }

  /* ---- aggregate effective policy effects (ramps + stall applied) ---- */
  function aggregateEffects(st) {
    var fx = {
      demand: 0, outlay: 0, revAdd: 0, tariff: 0, vat: 0, infraGDP: 0,
      homelessPct: 0, odPct: 0, incarcPct: 0, rentPressure: 0,
      workersBonus: 0, legitAdd: 0, sentAdd: 0, pcRegen: 0, fundsMult: 1,
      det: {}, groupDrift: {}
    };
    DET_IDS.forEach(function (d) { fx.det[d] = 0; });
    GROUP_IDS.forEach(function (g) { fx.groupDrift[g] = 0; });

    POLICIES.forEach(function (def) {
      var ps = st.pol[def.id];
      if (ps.stalled) return; // upkeep unpaid → effects paused
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
          fx.demand += 0.25 * val;
          fx.outlay += val;
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
      fx.legitAdd += (f.legitAdd || 0) * m;
      fx.sentAdd += (f.sentAdd || 0) * m;
      fx.pcRegen += (f.pcRegen || 0) * m;
      if (f.fundsMult) fx.fundsMult *= Math.pow(f.fundsMult, m);
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
    var conflict = clamp(70 - st.sentiment + polarization, 0, 100);
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

  /* ---- overdose reduction cap (treatment-capacity gate) ---- */
  function odCap(st) {
    if (!st.odAnchor) return 0;
    if (st.odAnchor.opt === 'legal') {
      var hc = st.pol.healthcare.value;
      return (hc === 'public' || hc === 'universal') ? 0.15 : 0.07;
    }
    if (st.odAnchor.opt === 'decriminalized') return 0.07;
    return 0;
  }

  /* ---- news: alerts from the player's own Acts/budget ledger ---- */
  function playerAlerts(st, fx, bud) {
    var g = st.gdp_nominal;
    var out = [];
    POLICIES.forEach(function (def) {
      var ps = st.pol[def.id];
      if (ps.stalled) {
        out.push({ mag: 500, lane: 'alert', text: '⚠ ' + def.name + ' is STALLED — upkeep unpaid, effects paused.' });
        return;
      }
      if (def.kind === 'slider') {
        var v = ps.value;
        if (v === def.def) return;
        if (def.id === 'tax' && v > 0) out.push({ mag: v * 4.5 / 100 * g / 100, lane: 'alert', text: 'Your VAT (' + v + '% of income tax) is raising ~$' + Math.round(v / 10 * 0.45 / 100 * g) + 'bn/yr of revenue.' });
        if (def.id === 'tariffs' && v > 0) out.push({ mag: v * 10, lane: 'alert', text: 'Your ' + v + '% tariff drags growth −' + round(0.08 * v, 2) + ' pp while raising diminishing revenue.' });
        if (def.id === 'infra' && v > 0) out.push({ mag: v * 100, lane: 'alert', text: 'Your Infrastructure & R&D program (' + v + '% of GDP) adds +' + round(0.25 * v, 2) + ' pp to growth.' });
        return;
      }
      if (ps.value === def.def) return;
      var f = getOption(def, ps.value).fx || {};
      var bn = ((f.outlay || 0) - (f.revAdd || 0)) / 100 * g;
      var mag = Math.abs(bn) + Math.abs(f.demand || 0) * 100;
      if (mag < 1) mag = 1;
      var bits = [];
      if (f.revAdd) bits.push('raising ~$' + Math.round(f.revAdd / 100 * g) + 'bn/yr');
      if (f.outlay) bits.push((f.outlay > 0 ? 'adding $' + Math.round(f.outlay / 100 * g) + 'bn/yr of outlays' : 'saving $' + Math.round(-f.outlay / 100 * g) + 'bn/yr'));
      if (f.demand) bits.push((f.demand > 0 ? '+' : '') + round(f.demand, 2) + ' pp demand');
      if (f.homelessPct) bits.push('homelessness ' + round(f.homelessPct, 1) + '%/qtr');
      if (f.odPct) bits.push('overdoses ' + round(f.odPct, 1) + '%/qtr');
      if (!bits.length) bits.push('reshaping incentives');
      out.push({ mag: mag, lane: 'alert', text: 'Your ' + def.name.replace(/ Act$/, '') + ' Act is ' + bits.join(', ') + '.' });
    });
    BUDGET.forEach(function (c) {
      if (c.locked) return;
      var m = st.budget.mult[c.id] !== undefined ? st.budget.mult[c.id] : 1;
      if (m === 1) return;
      var dBn = catSharePct(c) * (m - 1) / 100 * g;
      out.push({ mag: Math.abs(dBn), lane: 'alert', text: 'Your budget ' + (m < 1 ? 'cut to' : 'boost of') + ' ' + c.name + ' (' + Math.round(m * 100) + '%) ' + (dBn < 0 ? 'saves $' + Math.round(-dBn) + 'bn/yr.' : 'adds $' + Math.round(dBn) + 'bn/yr.') });
    });
    out.sort(function (a, b) { return b.mag - a.mag; });
    return out.slice(0, 2).map(function (o) { return { lane: o.lane, text: o.text }; });
  }

  /* ---- main turn advance ---- */
  function advanceTurn(st) {
    if (st.over) return st;
    st.turn += 1;
    st.year = 2008 + Math.floor((st.turn - 1) / 4);
    st.quarter = ((st.turn - 1) % 4) + 1;
    var items = [];
    if (st.pendingLog.length) { items = items.concat(st.pendingLog); st.pendingLog = []; }

    // --- political capital & funds (party-scaled) ---
    var fxPre = aggregateEffects(st); // for pcRegen / fundsMult of settled acts
    var pcs = pcStats(st);
    st.pcCap = pcs.cap; st.pcRegen = pcs.regen + fxPre.pcRegen;
    st.pc = Math.min(pcs.cap, st.pc + st.pcRegen);
    st.funds = Math.min(100, st.funds + 5 * fxPre.fundsMult);

    // --- act upkeep: unpaid upkeep stalls the act (effects pause) ---
    POLICIES.forEach(function (def) {
      var ps = st.pol[def.id];
      if (ps.upkeepLeft > 0 && ps.upkeepPer > 0) {
        if (st.pc >= ps.upkeepPer) {
          st.pc -= ps.upkeepPer;
          ps.upkeepLeft -= 1;
          ps.stalled = false;
        } else {
          ps.stalled = true;
          items.push('⚠ ' + def.name + ' STALLED — upkeep ' + ps.upkeepPer + ' PC unpaid; its effects pause this quarter.');
        }
      } else {
        ps.stalled = false;
      }
    });

    // advance ramps (stalled acts freeze)
    POLICIES.forEach(function (def) {
      var ps = st.pol[def.id];
      if (!ps.stalled && ps.ramp < 1) {
        ps.ramp = Math.min(1, ps.ramp + 1 / ps.lag);
        if (ps.ramp === 1) items.push(def.name + ': act now at full effect (lag complete).');
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
    var bfx = budgetEffects(st);
    fx.demand += bfx.demand;
    fx.homelessPct += bfx.homelessPct;
    fx.odPct += bfx.odPct;
    fx.incarcPct += bfx.incarcPct;
    DET_IDS.forEach(function (d) { fx.det[d] += bfx.det[d]; });
    GROUP_IDS.forEach(function (g) { fx.groupDrift[g] += bfx.groupDrift[g]; });
    var det = st.det;

    // --- growth block ---
    var gstar = 2.0 + 0.03 * (det.innovation - 60) + 0.02 * (det.education - 60) + 0.02 * (det.competitiveness - 60);
    var shock = gfcShock(st.turn);
    var tariffDrag = 0.08 * fx.tariff;
    var debtDrag = Math.max(0, st.debt_gdp - 90) * 0.012;
    // output-gap closure (0.25: calibrated so the 2009–2017 recovery runs ~2.5%/yr, not 4.5%)
    var gapBoost = clamp(0.25 * (st.unemployment - 5.5), 0, 2.5);
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
    var crisisOutlay = (EV.gfc.outlayShock || {})[st.turn] || 0;
    var bud = computeBudget(st, fx, crisisOutlay);
    st.revenue_bn = bud.revenue_bn;
    st.deficit_bn = bud.deficit_bn;
    st.outlays_bn = bud.outlays_bn;
    if (crisisOutlay) items.push('Crisis automatic stabilizers & rescue programs add ' + crisisOutlay.toFixed(1) + '% of GDP to outlays.');

    // --- debt dynamics (r − g) ---
    var r = 2 + Math.max(0, st.debt_gdp - 90) * 0.05;
    var gNom = growth + st.inflation;
    st.debt_gdp = clamp(st.debt_gdp + (st.deficit_bn / st.gdp_nominal * 100) / 4 + (r - gNom) * st.debt_gdp / 400, 20, 250);

    // --- homelessness ---
    var hPct;
    var rentP = (st.year <= 2012 ? 1.0 : 2.0) + fx.rentPressure;
    if (st.rentban) {
      st.rentban.t += 1;
      // shock phase +6%/qtr for 4 turns; aftermath: supply collapse persists —
      // sustained rent pressure +1.5 keeps homelessness pressure ABOVE baseline drift
      var shockPct = st.rentban.t <= 4 ? 6 : 0;
      rentP += 1.5;
      hPct = 0.8 * dUnemp + 1.2 * rentP + fx.homelessPct + shockPct;
      items.push('Rental-market ban: ' + (st.rentban.t <= 4 ? 'market shock (+6%/qtr)' : 'supply collapse aftermath — rent pressure +1.5 sustained') + '.');
    } else {
      hPct = 0.8 * dUnemp + 1.2 * rentP + fx.homelessPct;
    }
    st.homelessness = clamp(st.homelessness * (1 + hPct / 100), 200, 5000);
    if (st.homelessAnchor) {
      var hFloor = st.homelessAnchor.level * (1 - st.homelessAnchor.cap);
      if (st.homelessness < hFloor) st.homelessness = hFloor;
    }

    // --- overdoses (cumulative reduction cap vs enactment level) ---
    var odBase = st.year <= 2012 ? 2.0 : (st.year <= 2015 ? 3.5 : 2.0);
    st.overdoses = clamp(st.overdoses * (1 + (odBase + fx.odPct) / 100), 5000, 400000);
    var cap = odCap(st);
    if (cap > 0) {
      var odFloor = st.odAnchor.level * (1 - cap);
      if (st.overdoses < odFloor) {
        st.overdoses = odFloor;
        items.push('Overdose reduction hits its policy cap (−' + Math.round(cap * 100) + '% vs enactment)' + (st.odAnchor.opt === 'legal' && cap < 0.15 ? ' — expand Healthcare to public/universal for full treatment capacity' : '') + '.');
      }
    }

    // --- incarcerated ---
    st.incarcerated = clamp(st.incarcerated * (1 + (-0.2 + fx.incarcPct) / 100), 0.8, 4);

    // --- determinants drift ---
    det.education += fx.det.education;
    det.innovation += fx.det.innovation + 0.1;
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
    ap.religious = clamp(ap.religious + 0.05 * (52 - ap.religious) / 4, 0, 100);
    st._prevDebt = st.debt_gdp; st._prevS = pw.S;

    // --- sentiment & legitimacy ---
    var meanAppr = 0; GROUP_IDS.forEach(function (g) { meanAppr += ap[g]; }); meanAppr /= GROUP_IDS.length;
    var goodwill = clamp((meanAppr - 50) / 5, -6, 6);
    st.sentiment = clamp(
      30 + 0.3 * (50 - st.unemployment * 5) + 0.5 * (miGrowth * 4) - 0.3 * hPct + goodwill + fx.sentAdd,
      0, 100);
    st.legitimacy = clamp(st.legitimacy + 0.25 * (st.sentiment - st.legitimacy) + fx.legitAdd, 0, 100);

    // --- party: seats drift toward approval-implied share ---
    var appr = weightedApproval(st);
    var p = st.party;
    var sizes = { house: 435, senate: 100, governors: 50 };
    Object.keys(sizes).forEach(function (k) {
      var target = appr / 100 * sizes[k];
      p[k] += 0.03 * (target - p[k]);
    });

    // --- midterms (turns 12, 28, 44, ...): seat adjustment vs approval, −5 penalty ---
    if (isMidterm(st.turn)) {
      var eff = clamp(appr - (p.president ? (EV.midtermPenalty || 5) : 0), 0, 100);
      var adj = { house: 0.5, governors: 0.5, senate: 0.25 };
      var before = { house: p.house, senate: p.senate, governors: p.governors };
      Object.keys(adj).forEach(function (k) {
        var target = eff / 100 * sizes[k];
        p[k] = clamp(p[k] + adj[k] * (target - p[k]), 0, sizes[k]);
      });
      var rep = {
        turn: st.turn, year: st.year, pct: round(appr, 1),
        house: Math.round(p.house), senate: Math.round(p.senate), governors: Math.round(p.governors),
        dHouse: Math.round(p.house - before.house), dSenate: Math.round(p.senate - before.senate), dGov: Math.round(p.governors - before.governors)
      };
      st.midterms.push(rep);
      items.push('🗳️ MIDTERMS ' + st.year + ' — approval ' + rep.pct + '% (midterm penalty −' + (EV.midtermPenalty || 5) + ' for holding the presidency): House ' +
        (rep.dHouse >= 0 ? '+' : '') + rep.dHouse + ' → ' + rep.house + '/435, Senate ' + (rep.dSenate >= 0 ? '+' : '') + rep.dSenate + ' → ' + rep.senate + '/100, Governors ' +
        (rep.dGov >= 0 ? '+' : '') + rep.dGov + ' → ' + rep.governors + '/50.');
      st.newsLog.push({ turn: st.turn, lane: 'alert', text: 'Midterms: your party ' + (rep.dHouse >= 0 ? 'gains ' + rep.dHouse : 'loses ' + (-rep.dHouse)) + ' House seats (approval ' + rep.pct + '%, presidency penalty applied).' });
    }

    // --- power score / phase ---
    var power = computePower(st);
    var phase = phaseOf(power.S);

    // --- snapshot ---
    st.snapshots.push({
      turn: st.turn, year: st.year, quarter: st.quarter,
      gdp_level: round(st.gdp_level, 1), gdp_nominal: round(st.gdp_nominal, 1),
      growth: round(growth, 2), unemployment: round(st.unemployment, 2),
      debt_gdp: round(st.debt_gdp, 2), deficit_bn: round(st.deficit_bn, 1),
      revenue_bn: round(st.revenue_bn, 1), outlays_bn: round(st.outlays_bn, 1),
      inflation: round(st.inflation, 2),
      med_income: round(st.med_income, 0), homelessness: round(st.homelessness, 1),
      overdoses: round(st.overdoses, 0), incarcerated: round(st.incarcerated, 3),
      sentiment: round(st.sentiment, 1), legitimacy: round(st.legitimacy, 1),
      pc: round(st.pc, 1), house: Math.round(p.house), senate: Math.round(p.senate), governors: Math.round(p.governors),
      S: round(power.S, 1), phase: phase.name,
      det: DET_IDS.reduce(function (o, d) { o[d] = round(det[d], 1); return o; }, {})
    });
    st.pollHistory.push({ turn: st.turn, pct: round(appr, 1) });

    // --- presidential elections (turns 20, 36, 52, ...) ---
    if (isPresElection(st.turn)) {
      var res = { turn: st.turn, year: st.year, pct: round(appr, 1), won: appr >= 50 };
      st.elections.push(res);
      if (res.won) {
        st.legitimacy = clamp(st.legitimacy + 12, 0, 100);
        st.pc = Math.min(pcStats(st).cap, st.pc + 30);
        items.push('🗳️ ELECTION WON — weighted approval ' + res.pct + '% ≥ 50%. Mandate renewed: legitimacy +12, +30 PC.');
        st.newsLog.push({ turn: st.turn, lane: 'alert', text: 'Your party KEEPS the White House (' + res.pct + '% approval). Mandate +30 PC.' });
      } else {
        st.over = true; st.won = false;
        st.overReason = 'Your party loses the White House — weighted approval ' + res.pct + '% < 50% in the ' + st.year + ' presidential election.';
        items.push('🗳️ ELECTION LOST — weighted approval ' + res.pct + '% < 50%. Your party loses the White House.');
      }
    }
    if (!st.over && st.legitimacy <= 15) {
      st.over = true; st.won = false;
      st.overReason = 'Legitimacy collapsed (≤15). Mass unrest and institutional crisis force your party from office.';
      items.push('💥 COLLAPSE — legitimacy hit ' + round(st.legitimacy, 0) + '. The government falls.');
    }
    // v0.3: endless mode — no turn cap; the game runs on until an election is lost or legitimacy collapses.

    // --- news strip assembly ---
    var news = [];
    if (st.pendingNews.length) { news = news.concat(st.pendingNews); st.pendingNews = []; }
    // (a) player alerts from own Acts/budget effects + BLUNT detection
    var alerts = playerAlerts(st, fx, bud);
    if (shock < 0 && fx.demand > 0.5) {
      alerts.unshift({ lane: 'alert', text: 'Your stimulus (+' + round(fx.demand, 1) + ' pp) blunted the recession shock (' + shock + ' pp).' });
    }
    news = news.concat(alerts.slice(0, 2));
    // (b/c) historical + social
    news = news.concat(histNews(st.turn));
    news.forEach(function (n) { st.newsLog.push({ turn: st.turn, lane: n.lane, text: n.text }); });
    if (st.newsLog.length > 600) st.newsLog = st.newsLog.slice(st.newsLog.length - 600);

    st.log.push({ turn: st.turn, label: 'Q' + st.quarter + ' ' + st.year, items: items });
    return st;
  }

  /* ---- network model: node sizes + edge deltas (deterministic; UI renders) ---- */
  var METRIC_NODES = ['gdp', 'unemployment', 'debt', 'homelessness', 'overdoses', 'incarcerated', 'med_income', 'sentiment'];
  function metricNorm(st, id) {
    switch (id) {
      case 'gdp': return clamp(st.gdp_level / 24000 * 100, 5, 100);
      case 'unemployment': return clamp(st.unemployment * 8, 5, 100);
      case 'debt': return clamp(st.debt_gdp, 5, 130);       // the debt bubble can grow
      case 'homelessness': return clamp(st.homelessness / 771 * 50, 5, 100);
      case 'overdoses': return clamp(st.overdoses / 107000 * 60, 5, 100);
      case 'incarcerated': return clamp(st.incarcerated / 2.3 * 50, 5, 100);
      case 'med_income': return clamp(st.med_income / 85000 * 60, 5, 100);
      case 'sentiment': return clamp(st.sentiment, 5, 100);
    }
    return 50;
  }

  function computeNetwork(st, previewFx) {
    var nodes = {};
    DET_IDS.forEach(function (d) {
      nodes[d] = { id: d, kind: 'det', value: round(st.det[d], 1), r: round(13 + st.det[d] * 0.22, 1), delta: 0 };
    });
    METRIC_NODES.forEach(function (m) {
      var n = metricNorm(st, m);
      nodes[m] = { id: m, kind: 'metric', value: round(n, 1), r: round(12 + n * 0.2, 1), delta: 0 };
    });
    var edges = NETDEF.map(function (e) {
      return { from: e.from, to: e.to, sign: e.sign, strength: e.strength, delta: 0, hot: false };
    });
    if (previewFx) {
      var nd = {};
      function bump(id, v) { if (nodes[id]) nd[id] = (nd[id] || 0) + v; }
      if (previewFx.det) Object.keys(previewFx.det).forEach(function (d) { bump(d, previewFx.det[d] * 6); });
      if (previewFx.demand) { bump('gdp', previewFx.demand * 3); bump('output', previewFx.demand * 3); bump('unemployment', -previewFx.demand * 2); }
      if (previewFx.outlay) bump('debt', previewFx.outlay * 4);
      if (previewFx.revAdd) bump('debt', -previewFx.revAdd * 4);
      if (previewFx.homelessPct) bump('homelessness', previewFx.homelessPct * 4);
      if (previewFx.odPct) bump('overdoses', previewFx.odPct * 3);
      if (previewFx.incarcPct) bump('incarcerated', previewFx.incarcPct * 3);
      if (previewFx.workersBonus) bump('med_income', previewFx.workersBonus * 4);
      if (previewFx.rentPressure) bump('homelessness', previewFx.rentPressure * 2);
      if (previewFx.legitAdd || previewFx.sentAdd) bump('sentiment', ((previewFx.legitAdd || 0) + (previewFx.sentAdd || 0)) * 2);
      if (previewFx.tariff) { bump('trade', -previewFx.tariff * 0.4); bump('competitiveness', -previewFx.tariff * 0.2); bump('debt', -previewFx.tariff * 0.2); }
      if (previewFx.groups) { bump('sentiment', 0); }
      Object.keys(nd).forEach(function (id) { nodes[id].delta = round(nd[id], 1); });
      edges.forEach(function (e) {
        var d = (nd[e.from] || 0);
        if (d !== 0) { e.hot = true; e.delta = round(d * e.sign, 1); }
        else if (nd[e.to]) { e.hot = true; e.delta = round(nd[e.to], 1); }
      });
    }
    return { nodes: nodes, edges: edges };
  }

  /* ---- preview fx builders (for hover/what-if before confirming) ---- */
  function previewPolicyFx(id, value) {
    var def = POLICY_MAP[id];
    if (!def) return null;
    if (def.kind === 'slider') {
      var fx = {};
      if (id === 'tax') { fx.revAdd = value / 10 * 0.45; fx.det = { competitiveness: 0.03 * (value / 25) }; }
      if (id === 'tariffs') { fx.tariff = value; fx.demand = -0.08 * value; }
      if (id === 'infra') { fx.demand = 0.25 * value; fx.outlay = value; fx.det = { output: 0.1 * value, innovation: value >= 1.5 ? 0.25 : 0 }; }
      return fx;
    }
    var opt = getOption(def, value);
    var f = Object.assign({}, opt.fx || {});
    if (f.rentban) { f.homelessPct = 6; f.rentPressure = 1.5; delete f.rentban; }
    return f;
  }
  function previewBudgetFx(catId, newMult) {
    var cat = BUDGET_MAP[catId];
    if (!cat || cat.locked) return null;
    var dev = (newMult - 1) * 10;
    var fx = { outlay: catSharePct(cat) * (newMult - 1) };
    if (cat.fx) {
      if (cat.fx.demand) fx.demand = cat.fx.demand * dev;
      if (cat.fx.homelessPct) fx.homelessPct = cat.fx.homelessPct * dev;
      if (cat.fx.odPct) fx.odPct = cat.fx.odPct * dev;
      if (cat.fx.incarcPct) fx.incarcPct = cat.fx.incarcPct * dev;
      if (cat.fx.det) { fx.det = {}; Object.keys(cat.fx.det).forEach(function (d) { fx.det[d] = cat.fx.det[d] * dev; }); }
    }
    return fx;
  }

  /* ---- exports / reporting ---- */
  function exportJSON(st) {
    return JSON.stringify({ game: 'PoliSim-DBE v0.3', elections: st.elections, midterms: st.midterms, over: st.over, overReason: st.overReason, log: st.log, news: st.newsLog, snapshots: st.snapshots }, null, 1);
  }

  function exportCSV(st) {
    var cols = ['turn', 'year', 'quarter', 'gdp_level', 'gdp_nominal', 'growth', 'unemployment', 'debt_gdp', 'deficit_bn', 'revenue_bn', 'outlays_bn', 'inflation', 'med_income', 'homelessness', 'overdoses', 'incarcerated', 'sentiment', 'legitimacy', 'pc', 'house', 'senate', 'governors', 'S', 'phase', 'education', 'innovation', 'competitiveness', 'military', 'trade', 'output', 'fincenter', 'reserve_fx'];
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
    applyBudget: applyBudget,
    deleteBudgetCat: deleteBudgetCat,
    addSector: addSector,
    advanceTurn: advanceTurn,
    weightedApproval: weightedApproval,
    computePower: computePower,
    computeBudget: computeBudget,
    computeNetwork: computeNetwork,
    previewPolicyFx: previewPolicyFx,
    previewBudgetFx: previewBudgetFx,
    budgetEffects: budgetEffects,
    phaseOf: phaseOf,
    campaignOpen: campaignOpen,
    isPresElection: isPresElection,
    isMidterm: isMidterm,
    nextPresElection: nextPresElection,
    pcStats: pcStats,
    odCap: odCap,
    changeCost: changeCost,
    exportJSON: exportJSON,
    exportCSV: exportCSV,
    CAMPAIGN: CAMPAIGN,
    DET_IDS: DET_IDS,
    METRIC_NODES: METRIC_NODES,
    GROUP_IDS: GROUP_IDS
  };
});

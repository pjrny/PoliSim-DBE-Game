/* ============================================================================
   PoliSim-DBE v0.5 — compass.js
   Reverse-engineered Filteries Political Simulator Compass engine, mapped to
   the game's Big-Cycle determinants (spec_compass_integration.md).
   UMD like engine.js: window.COMPASS in browser, module.exports in Node.
   DERIVED-ONLY: no state-schema change; everything is computed on demand
   from st + the COMPASS_* constants in js/compass_data.js.
   ========================================================================== */
(function (root, factory) {
  var C = factory(root);
  root.COMPASS = C;
  if (typeof module !== 'undefined' && module.exports) module.exports = C;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';

  var E = root.ENGINE;
  var META = root.COMPASS_META;
  var BASE = root.COMPASS_USA_BASELINE;
  var OFFSETS = root.COMPASS_SCENARIO_OFFSET;
  var FISCAL = root.COMPASS_FISCAL;
  var ACT_D = root.COMPASS_ACT_DELTAS;
  var BUD_D = root.COMPASS_BUDGET_DELTAS;
  var BUD_CAP = root.COMPASS_BUDGET_CAP || 8;
  var SEC_D = root.COMPASS_SECTOR_DELTAS;
  var GATES = root.COMPASS_LABEL_GATES;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function r1(v) { return Math.round(v * 10) / 10; }
  function meanDet(d) {
    if (!d) return 0;
    var ids = E.DET_IDS, s = 0, n = 0;
    ids.forEach(function (k) { if (typeof d[k] === 'number') { s += d[k]; n++; } });
    return n ? s / n : 0;
  }
  function addMap(acc, d, scale) {
    if (!d) return;
    Object.keys(d).forEach(function (k) { acc[k] = (acc[k] || 0) + d[k] * scale; });
  }
  function scaleMap(d, v) {
    var o = {};
    Object.keys(d || {}).forEach(function (k) { o[k] = d[k] * v; });
    return o;
  }

  /* C3 v1.1 interaction: VAT-shift LFT −3 standalone, +2 if paired with
     transfers (welfare ∈ {expanded,cash,ubi} OR ubi.dividend active). */
  function transfersPaired(st) {
    var w = st.pol && st.pol.welfare ? st.pol.welfare.value : 'statusquo';
    if (w === 'expanded' || w === 'cash' || w === 'ubi') return true;
    return !!(st.pol && st.pol.ubi && st.pol.ubi.value === 'dividend');
  }

  /* ---- HSP fiscal bridge (spec §4): federal outlay share + constant S&L
     offset, linear map 5%→0, 65%→100. Fresh 2008 game: 20.5+14.5=35 → HSP 50. */
  function computeHSP(st) {
    var fedPct;
    if (st.turn >= 1 && st.outlays_bn > 0 && st.gdp_nominal > 0) {
      fedPct = st.outlays_bn / st.gdp_nominal * 100; // actuals incl. crisis outlays
    } else {
      var fx = E.aggregateEffects(st);
      var evId = (st.scenario && root.SCENARIOS && root.SCENARIOS[st.scenario] && root.SCENARIOS[st.scenario].event) || 'gfc';
      var crisis = (((root.EVENTS || {})[evId] || {}).outlayShock || {})[st.turn] || 0;
      var b = E.computeBudget(st, fx, crisis);
      fedPct = b.outlay_share;
    }
    var govShare = fedPct + FISCAL.STATE_LOCAL_OFFSET_PCT;
    return clamp((govShare - FISCAL.FLOOR_PCT) / (FISCAL.CEIL_PCT - FISCAL.FLOOR_PCT) * 100, 0, 100);
  }

  /* ---- axes ---- */
  function computeAxes(st) {
    var off = (st.scenario && OFFSETS[st.scenario]) || {};
    var acc = {}, contributions = [];
    META.axes.forEach(function (a) { acc[a] = 0; });

    // Acts channel: deltas scale with ps.ramp; stalled acts contribute 0
    Object.keys(ACT_D).forEach(function (actId) {
      var cfg = ACT_D[actId];
      var ps = st.pol ? st.pol[actId] : null;
      if (!ps) return;
      var ramp = ps.stalled ? 0 : (ps.ramp !== undefined ? ps.ramp : 1);
      if (ramp <= 0) return;
      var deltas = null, src = null;
      if (cfg.slider) {
        var v = typeof ps.value === 'number' ? ps.value : 0;
        if (!v) return;
        deltas = scaleMap(cfg.perUnit, v);
        if (cfg.condLFT) deltas.LFT = (transfersPaired(st) ? cfg.condLFT.paired : cfg.condLFT.alone) * v;
        src = 'slider:' + actId;
      } else {
        deltas = cfg.options[ps.value];
        if (!deltas || !Object.keys(deltas).length) return;
        src = 'act:' + actId + '.' + ps.value;
      }
      addMap(acc, deltas, ramp);
      contributions.push({ source: src, deltas: deltas, ramp: ramp });
    });

    // Budget channel: per +10% deviation of the EFFECTIVE multiplier from 1.0
    // (catMult flows sub-line edits and deletions through automatically).
    // Per-axis sum clamped to ±BUD_CAP so the slider can't drown the Acts.
    var bAcc = {};
    (root.BUDGET_CATS || []).forEach(function (c) {
      if (c.locked) return;
      var mult = E.catMult(st, c);
      var dev = (mult - 1) * 10;
      if (!dev) return;
      var d = BUD_D[c.id];
      if (!d) return;
      addMap(bAcc, d, dev);
    });
    Object.keys(bAcc).forEach(function (k) { bAcc[k] = clamp(bAcc[k], -BUD_CAP, BUD_CAP); });
    addMap(acc, bAcc, 1);
    if (Object.keys(bAcc).length) contributions.push({ source: 'budget', deltas: bAcc, ramp: 1 });

    // Add-on sectors: deltas while added, scaled by sector multiplier
    (st.sectors || []).forEach(function (sec) {
      var d = SEC_D[sec.id];
      if (!d || !Object.keys(d).length) return;
      var m = sec.mult !== undefined ? sec.mult : 1;
      addMap(acc, d, m);
      contributions.push({ source: 'sector:' + sec.id, deltas: d, ramp: m });
    });

    var axes = {};
    META.axes.forEach(function (a) {
      if (a === 'HSP') return; // formula-only
      var v = (BASE[a] !== undefined ? BASE[a] : 50) + (off[a] || 0) + (acc[a] || 0);
      axes[a] = r1(clamp(v, 0, 100));
    });
    axes.HSP = r1(computeHSP(st));
    return { axes: axes, baseline: BASE, contributions: contributions, offset: off };
  }

  /* ---- labels (spec §5): gates in order, first match wins ---- */
  function classifyLabels(axes, ctx) {
    ctx = ctx || {};
    var econ = GATES.economic(axes, ctx);
    return {
      structure: GATES.structure(axes, ctx),
      governing: GATES.governing(axes, ctx),
      economic: econ,
      social: GATES.social(axes, ctx),
      modifiers: econ.indexOf('Mercantilist') >= 0 ? ['Mercantilist'] : []
    };
  }

  /* ---- Big-Cycle stage classifier (spec §6) ----
     Feasibility adaptation: the spec's 25-year trend gate cannot run (scenarios
     span ≤18 playable years), so trend = annualized ΔPI over min(turn,40);
     with <12 turns the trend gate is inert and the classifier is level-driven
     (provisional). phaseOf(S) stays the fallback (keeps test (i) green). */
  function classifyCycleStage(st) {
    var pw = E.computePower(st);
    var pi = pw.mean;
    var snaps = st.snapshots || [];
    var n = snaps.length;
    var win = Math.min(Math.max(st.turn, 1), 40);

    var past = n ? snaps[Math.max(0, n - win)] : null;
    var trend = null;
    if (st.turn >= 8 && past && st.turn > past.turn) {
      var yrs = (st.turn - past.turn) / 4;
      trend = (pi - meanDet(past.det)) / yrs;
    }
    function detTrend(id) {
      if (!past || typeof past.det[id] !== 'number') return 0;
      return (st.det[id] - past.det[id]) / win * 4; // per year
    }

    // running peaks (power index, reserve_fx) from snapshots
    var peak = pi, peakRes = st.det.reserve_fx || 0;
    snaps.forEach(function (s) {
      peak = Math.max(peak, meanDet(s.det));
      if (typeof s.det.reserve_fx === 'number') peakRes = Math.max(peakRes, s.det.reserve_fx);
    });

    var growthMA = null;
    if (n >= 4) {
      var g4 = 0;
      for (var i = n - 4; i < n; i++) g4 += snaps[i].growth || 0;
      growthMA = g4 / 4;
    }
    var medG = null;
    if (n >= 5 && snaps[n - 5].med_income > 0) {
      var yrs5 = (snaps[n - 1].turn - snaps[n - 5].turn) / 4;
      if (yrs5 > 0) medG = (Math.pow(snaps[n - 1].med_income / snaps[n - 5].med_income, 1 / yrs5) - 1) * 100;
    }
    var gapGrowth = null; // m12: gdp growth minus med-income growth, pp/yr over window
    if (past && n && past.turn < st.turn) {
      var yrsW = (st.turn - past.turn) / 4;
      if (yrsW > 0 && past.gdp_level > 0) {
        var gG = (Math.pow(st.gdp_level / past.gdp_level, 1 / yrsW) - 1) * 100;
        var mG = (Math.pow(st.med_income / past.med_income, 1 / yrsW) - 1) * 100;
        gapGrowth = gG - mG;
      }
    }
    var deficitPct = st.gdp_nominal > 0 ? (st.deficit_bn / st.gdp_nominal) * 100 : 0;

    var m = {
      m1: st.legitimacy >= 65,
      m2: detTrend('innovation') > 0,
      m3: st.det.education >= 55 && detTrend('education') > 0,
      m4: st.sentiment >= 55,
      m6: st.det.competitiveness >= 60,
      m7: medG !== null && medG > 1,
      m8: st.det.fincenter >= 80,
      m9: growthMA !== null && growthMA < 1.5 && detTrend('education') <= 0,
      m10: st.det.military >= 85 && st.debt_gdp >= 90,
      m11: detTrend('competitiveness') < 0,
      m12: gapGrowth !== null && gapGrowth > 0.5,
      m13: st.debt_gdp >= 90,
      m14: deficitPct >= 5 && st.debt_gdp >= 90,
      m15: pw.conflict >= 35,
      m16: (st.det.reserve_fx || 0) <= peakRes - 8,
      m17: st.legitimacy <= 35,
      m18: st.legitimacy <= 15
    };
    // m5 needs the compass REG axis: computed lazily when COMPASS is fully loaded
    try {
      var ax = computeAxes(st).axes;
      m.m5 = ax.REG <= 55 && st.det.competitiveness >= 60;
    } catch (e) { m.m5 = st.det.competitiveness >= 60; }

    var lit = Object.keys(m).filter(function (k) { return m[k]; });

    // New Order: conflict peaked ≥55 in history and fallen ≥20 AND debt fell
    // ≥15 from peak. Conflict history approximation from snapshot sentiment
    // (snapshots don't store group spread — polarization omitted, documented).
    var conflictNow = pw.conflict;
    var conflictPeak = conflictNow, debtPeak = st.debt_gdp;
    snaps.forEach(function (s) {
      var cApprox = clamp(70 - (s.sentiment || 50), 0, 100);
      conflictPeak = Math.max(conflictPeak, cApprox);
      debtPeak = Math.max(debtPeak, s.debt_gdp || 0);
    });
    var newOrder = conflictPeak >= 55 && (conflictPeak - conflictNow) >= 20 && (debtPeak - st.debt_gdp) >= 15;

    function countLit(ids) { return ids.filter(function (k) { return m[k]; }).length; }

    var stage;
    if (newOrder) stage = 'New Order';
    else if (pi < 0.8 * peak && trend !== null && trend < -0.2 && countLit(['m13', 'm14', 'm15', 'm16']) >= 2) stage = 'The Decline';
    else if (pi >= 0.8 * peak && countLit(['m9', 'm10', 'm11', 'm12']) >= 2) stage = 'The Top';
    else if (trend !== null && trend > 0.3 && pw.debtBurden < 25 && pw.conflict < 30) stage = 'The Rise';
    else {
      var ph = E.phaseOf(pw.S).name;
      stage = ph === 'Early Decline' || ph === 'Late Decline' ? 'The Decline'
        : ph === 'Reset / New Order' ? 'New Order' : ph;
    }

    var tariffRate = st.pol && typeof st.pol.tariffs.value === 'number' ? st.pol.tariffs.value : 0;
    return {
      powerIndex: r1(pi),
      trend: trend === null ? null : r1(trend),
      trendWindowTurns: win,
      markers: lit,
      stage: stage,
      provisional: st.turn < 12,
      subCycles: {
        debt: r1(clamp(clamp(st.debt_gdp - 50, 0, 50) + (deficitPct >= 5 ? 25 : 0) + (m.m14 ? 25 : 0), 0, 100)),
        internal: r1(pw.conflict),
        external: r1(clamp(50 + 2 * tariffRate +
          (st.pol && st.pol.immigration && st.pol.immigration.value === 'restrictive' ? 10 : 0) -
          (st.det.trade - 65), 0, 100)),
        externalNote: 'trade-conflict proxy (no war/alliance mechanics in v1)'
      }
    };
  }

  /* ---- one-call convenience for UI / export ---- */
  function compassReport(st) {
    var axes = computeAxes(st);
    var ctx = {
      tariffRate: st.pol && typeof st.pol.tariffs.value === 'number' ? st.pol.tariffs.value : 0,
      democracyAct: !!(st.pol && st.pol.democracy && st.pol.democracy.value === 'enact'),
      legitimacy: st.legitimacy,
      over: st.over
    };
    return { axes: axes.axes, labels: classifyLabels(axes.axes, ctx), cycle: classifyCycleStage(st) };
  }

  return {
    computeAxes: computeAxes,
    computeHSP: computeHSP,
    classifyLabels: classifyLabels,
    classifyCycleStage: classifyCycleStage,
    compassReport: compassReport
  };
});

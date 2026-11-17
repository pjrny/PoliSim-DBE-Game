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
  var SCENARIOS = root.SCENARIOS || null;
  var REALWORLD_EVENTS = root.REALWORLD_EVENTS || null;

  /* ---- scenario helpers (v0.4) ---- */
  function scenarioOf(st) {
    if (st && st.scenario && SCENARIOS && SCENARIOS[st.scenario]) return SCENARIOS[st.scenario];
    return null;
  }
  function scenarioStart(sc) {
    if (sc.start) return sc.start;
    return (EV.start && EV.start.turn !== undefined) ? EV.start : null;
  }
  function scenarioEvent(sc) {
    var evId = (sc && sc.event) || 'gfc';
    return (EV[evId] && EV[evId].shocks) ? EV[evId] : (EV.gfc || { shocks: {}, unempShock: {}, outlayShock: {} });
  }
  // clock: turn t≥1 → clockYear + floor((t−1)/4); scenario start may open on a
  // display quarter (e.g. Q4 2016) before the running clock begins at Q1 2017.
  function clockYearOf(st) {
    var sc = scenarioOf(st), s = sc ? scenarioStart(sc) : EV.start;
    return (s && (s.clockYear || s.year)) || 2008;
  }
  function turnToYear(st, t) { return clockYearOf(st) + Math.floor((t - 1) / 4); }
  function turnToQuarter(t) { return ((t - 1) % 4) + 1; }

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

  /* ---- election timing (per-scenario; defaults = gfc2008: presidentials 20/36/52..., midterms 12/28/44...) ---- */
  function electConsts(st) {
    var sc = scenarioOf(st);
    return {
      E0: (sc && sc.electionStart) || EV.electionStart || 20,
      ECYC: (sc && sc.electionCycle) || EV.electionCycle || 16,
      M0: (sc && sc.midtermStart) || EV.midtermStart || 12
    };
  }
  function isPresElectionT(st, t) { var c = electConsts(st); return t >= c.E0 && (t - c.E0) % c.ECYC === 0; }
  function isMidtermT(st, t) { var c = electConsts(st); return t >= c.M0 && (t - c.M0) % c.ECYC === 0; }
  function nextPresElectionT(st, t) { var c = electConsts(st), e = c.E0; while (e <= t) e += c.ECYC; return e; }
  function isPresElection(t) { return isPresElectionT(null, t); }
  function isMidterm(t) { return isMidtermT(null, t); }
  function nextPresElection(t) { return nextPresElectionT(null, t); }
  function campaignOpen(st) {
    // campaign window = turns (e−3)..e around each presidential election
    var c = electConsts(st), t = st.turn;
    if (t < c.E0 - 3) return false;
    var m = (t - c.E0) % c.ECYC; if (m < 0) m += c.ECYC;
    return m >= c.ECYC - 3 || m === 0;
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
  function histNews(st) {
    var turn = st.turn;
    var N = newsSrc(), out = [];
    // v0.4: scenario-scoped news feed (The Realignment has its own 2017+ era feed)
    var sc = scenarioOf(st);
    var scn = (sc && sc.id && N.scenarios && N.scenarios[sc.id]) ? N.scenarios[sc.id] : null;
    var tn = scn ? ((scn.turns && scn.turns[String(turn)]) || null)
                 : ((N.turns && N.turns[String(turn)]) || null);
    var hs = (tn && tn.h && tn.h.length) ? tn.h
           : ((scn && scn.generic && scn.generic.h && scn.generic.h.length) ? scn.generic.h
           : ((N.generic && N.generic.h && N.generic.h.length) ? N.generic.h : NEWS_BUILTIN.generic.h));
    var ss = (tn && tn.s && tn.s.length) ? tn.s
           : ((scn && scn.generic && scn.generic.s && scn.generic.s.length) ? scn.generic.s
           : ((N.generic && N.generic.s && N.generic.s.length) ? N.generic.s : NEWS_BUILTIN.generic.s));
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

  /* ---- party → political capital capacity ----
     Dual-track scenarios (v0.4): SIM-track PC is sized to the shadow caucus
     (what a governing mandate would look like), never to the tiny real party. */
  function pcStats(st) {
    var sc = scenarioOf(st);
    var p = (sc && sc.dualTrack && st.shadowParty) ? st.shadowParty : st.party;
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
    // effective average interest rate on the debt stock (auto, non-editable);
    // scenarios may carry an era-calibrated interest model (v0.4: 2016)
    var ic = (scenarioOf(st) && scenarioStart(scenarioOf(st)).interest) || { base: 2.7, knee: 90, slope: 0.05 };
    var rEff = ic.base + Math.max(0, st.debt_gdp - ic.knee) * ic.slope;
    return st.debt_gdp * rEff / 100; // % of GDP
  }

  /* budget-driven effects: category deviations from baseline + added sectors */
  function budgetEffects(st) {
    var fx = { demand: 0, homelessPct: 0, odPct: 0, incarcPct: 0, det: {}, groupDrift: {} };
    DET_IDS.forEach(function (d) { fx.det[d] = 0; });
    GROUP_IDS.forEach(function (g) { fx.groupDrift[g] = 0; });
    function acc(f, scale, groupScale) {
      if (!f) return;
      var gs = groupScale !== undefined ? groupScale : scale;
      fx.demand += (f.demand || 0) * scale;
      fx.homelessPct += (f.homelessPct || 0) * scale;
      fx.odPct += (f.odPct || 0) * scale;
      fx.incarcPct += (f.incarcPct || 0) * scale;
      if (f.det) DET_IDS.forEach(function (d) { fx.det[d] += (f.det[d] || 0) * scale; });
      if (f.groups) GROUP_IDS.forEach(function (g) { fx.groupDrift[g] += (f.groups[g] || 0) * gs; });
    }
    var L = computeLinks(st);
    BUDGET.forEach(function (c) {
      if (c.locked) return;
      var m = catMult(st, c);
      var dev = (m - 1) * 10; // units of +10%
      if (dev < 0) {
        // v0.5: a covering Act absorbs the cut's fx at R×eff (groups at half strength)
        var keep = absorbKeep(st, c, L);
        acc(c.fx, dev * keep.metric * subFxScale(st, c), dev * keep.group * subFxScale(st, c));
      } else if (dev > 0) {
        // v0.5 overlap: over-funding a redundant line double-pays — demand fx of the
        // overlapping share is trimmed (deliberate political choice, mild waste signal)
        var ll = lineLink(st, c.id, L);
        var trim = (ll.R >= linkConsts().badgeFull && m > 1)
          ? 1 - linkConsts().overlapDemandPenalty * ll.R : 1;
        if (trim >= 1) acc(c.fx, dev * subFxScale(st, c));
        else {
          acc(c.fx, dev * subFxScale(st, c), dev * subFxScale(st, c));
          fx.demand -= (c.fx.demand || 0) * dev * subFxScale(st, c) * (1 - trim);
        }
      }
      var own = subOwnFx(st, c); // child-only effects, additive on top
      if (own) acc(own, 1);
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
        mult = catMult(st, c);
        share = catSharePct(c) * mult;
      }
      var bn = share / 100 * g;
      outBn += bn;
      var line = { id: c.id, name: c.name, bn: bn, share: share, mult: mult, locked: locked, deleted: !!st.budget.deleted[c.id] };
      var subs = catSubs(c);
      if (subs) {
        var saved = st.budget.subs[c.id] || {};
        var dels = (st.budget.subDeleted && st.budget.subDeleted[c.id]) || {};
        var subBaseSum = subs.reduce(function (a, x) { return a + x.base_bn; }, 0);
        line.subs = subs.map(function (sd) {
          var m = dels[sd.id] ? 0 : (saved[sd.id] !== undefined ? saved[sd.id] : 1);
          return {
            id: sd.id, name: sd.name, mult: m, deleted: !!dels[sd.id],
            bn: catSharePct(c) * (sd.base_bn / subBaseSum) * m * mult / 100 * g,
            fxShare: sd.fxShare || 0, fx: sd.fx || null, last: false
          };
        });
        if (line.subs.length) line.subs[line.subs.length - 1].last = true;
      }
      lines.push(line);
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
    var base = 2 * Math.round(Math.abs(newMult - old) * 10); // 2 PC per 10% change
    var cost = base;
    if (newMult < old) {
      // v0.5: cutting a line covered by an Act is discounted (never below 1 PC)
      var d = cutDiscount(st, catId, old - newMult);
      cost = Math.max(1, Math.round(base * d.pc));
    }
    if (st.pc < cost) return { ok: false, msg: 'Not enough Political Capital (need ' + cost + ', have ' + Math.floor(st.pc) + ').' };
    st.pc -= cost;
    st.budget.mult[catId] = newMult;
    if (newMult > 0) st.budget.deleted[catId] = false;
    // v0.4: parent slider scales sub-departments in lockstep; child overrides
    // from before this move are stale and cleared.
    var subs = catSubs(cat);
    if (subs) {
      st.budget.subs[catId] = {};
      st.budget.subDeleted[catId] = {};
    }
    st.pendingLog.push('Budget: ' + cat.name + ' → ' + Math.round(newMult * 100) + '% of baseline (−' + cost + ' PC).');
    return { ok: true, msg: cat.name + ' → ' + Math.round(newMult * 100) + '% of baseline (−' + cost + ' PC)' };
  }

  function deleteBudgetCat(st, catId) {
    if (st.over) return { ok: false, msg: 'Game is over.' };
    var cat = BUDGET_MAP[catId];
    if (!cat) return { ok: false, msg: 'Unknown budget category.' };
    if (cat.locked) return { ok: false, msg: 'Interest is automatic (debt-driven) and cannot be deleted.' };
    if (st.budget.deleted[catId]) return { ok: false, msg: cat.name + ' is already zeroed out.' };
    var depth = st.budget.mult[catId] !== undefined ? st.budget.mult[catId] : 1;
    var dCut = cutDiscount(st, catId, depth);
    var cost = Math.max(1, Math.round(linkConsts().deletePcBase * dCut.pc));
    var coveredBy = dCut.R > 0 ? ' — ' + Math.round(dCut.R * 100) + '% of its function is carried by an Act, so the cut is cheap' : '';
    if (st.pc < cost) return { ok: false, msg: 'Not enough Political Capital (need ' + cost + ', have ' + Math.floor(st.pc) + ').' };
    st.pc -= cost;
    st.budget.mult[catId] = 0;
    st.budget.deleted[catId] = true;
    st.budget.subs[catId] = {};       // parent deletion zeroes the whole accordion
    st.budget.subDeleted[catId] = {};
    if (cat.backlash) {
      var delta = {};
      GROUP_IDS.forEach(function (g) { delta[g] = (cat.backlash[g] || 0) * dCut.bl; });
      st.groupQueue.push({ delta: delta, remaining: 2, total: 2 });
    }
    st.pendingLog.push('Budget: ' + cat.name + ' DELETED (−' + cost + ' PC' + coveredBy + ').');
    return { ok: true, msg: cat.name + ' deleted (−' + cost + ' PC, backlash incoming)' };
  }

  /* ---- v0.4 sub-departments: editable child lines under a budget category ----
     st.budget.subs[catId] = { subId: mult }   (mult 0–2 of the child's own base;
     absent entry = 1.0. Deletions live in st.budget.subDeleted[catId][subId].)
     Parent multiplier = base-weighted mean of surviving children, so child edits
     flow into the parent total and the whole budget. Deleting a child costs 5 PC,
     shrinks the parent fx by the child's fxShare, and backlash × fxShare. */
  function catSubs(cat) { return (cat && cat.sub) ? cat.sub : null; }
  function catMult(st, cat) {
    var mult = st.budget.mult[cat.id];
    if (mult !== undefined) return mult;
    return parentMultFromSubs(st, cat);
  }
  function parentMultFromSubs(st, cat) {
    var subs = catSubs(cat);
    if (!subs) return 1;
    var num = 0, den = 0;
    var saved = st.budget.subs[cat.id] || {};
    var dels = (st.budget.subDeleted && st.budget.subDeleted[cat.id]) || {};
    subs.forEach(function (sd) {
      den += sd.base_bn;           // the parent's full baseline is the denominator
      if (dels[sd.id]) return;     // deleted children contribute nothing to the top line
      var m = saved[sd.id] !== undefined ? saved[sd.id] : 1;
      num += sd.base_bn * m;
    });
    return den > 0 ? num / den : 0;
  }
  function applyBudgetSub(st, catId, subId, newMult) {
    if (st.over) return { ok: false, msg: 'Game is over.' };
    var cat = BUDGET_MAP[catId];
    var subs = catSubs(cat);
    if (!subs) return { ok: false, msg: cat ? cat.name + ' has no sub-departments.' : 'Unknown budget category.' };
    var sd = null;
    subs.forEach(function (x) { if (x.id === subId) sd = x; });
    if (!sd) return { ok: false, msg: 'Unknown sub-department.' };
    var dels = st.budget.subDeleted[catId] || {};
    if (dels[subId]) return { ok: false, msg: sd.name + ' is deleted; restore the parent line first.' };
    newMult = clamp(Math.round(Number(newMult) * 10) / 10, 0, 2);
    var saved = st.budget.subs[catId] || {};
    var old = saved[subId] !== undefined ? saved[subId] : 1;
    if (newMult === old) return { ok: false, msg: 'No change.' };
    var cost = Math.max(2, Math.round(Math.abs(newMult - old) * 10)); // 1 PC per 10%, min 2
    if (st.pc < cost) return { ok: false, msg: 'Not enough Political Capital (need ' + cost + ', have ' + Math.floor(st.pc) + ').' };
    st.pc -= cost;
    if (!st.budget.subs[catId]) st.budget.subs[catId] = {};
    st.budget.subs[catId][subId] = newMult;
    st.budget.mult[catId] = parentMultFromSubs(st, cat);
    if (newMult > 0) st.budget.deleted[catId] = false;
    st.pendingLog.push('Budget: ' + cat.name + ' → ' + sd.name + ' at ' + Math.round(newMult * 100) + '% of its baseline (parent now ' + Math.round(st.budget.mult[catId] * 100) + '%) (−' + cost + ' PC).');
    return { ok: true, msg: sd.name + ' → ' + Math.round(newMult * 100) + '% (−' + cost + ' PC)' };
  }
  function deleteBudgetSub(st, catId, subId) {
    if (st.over) return { ok: false, msg: 'Game is over.' };
    var cat = BUDGET_MAP[catId];
    var subs = catSubs(cat);
    if (!subs) return { ok: false, msg: cat ? cat.name + ' has no sub-departments.' : 'Unknown budget category.' };
    var sd = null, alive = 0;
    subs.forEach(function (x) { if (x.id === subId) sd = x; });
    var dels = st.budget.subDeleted[catId] || {};
    subs.forEach(function (x) { if (!dels[x.id]) alive++; });
    if (!sd) return { ok: false, msg: 'Unknown sub-department.' };
    if (dels[subId]) return { ok: false, msg: sd.name + ' is already deleted.' };
    if (alive <= 1) return { ok: false, msg: 'Cannot delete the last sub-department of ' + cat.name + ' — delete the parent line instead.' };
    var saved0 = st.budget.subs[catId] || {};
    var subDepth = saved0[subId] !== undefined ? saved0[subId] : 1;
    var dSub = cutDiscount(st, catId, subDepth, subId);
    var cost = Math.max(1, Math.round(5 * dSub.pc));
    var coveredNote = dSub.R > 0 ? ' (' + Math.round(dSub.R * 100) + '% covered by an Act)' : '';
    if (st.pc < cost) return { ok: false, msg: 'Not enough Political Capital (need ' + cost + ', have ' + Math.floor(st.pc) + ').' };
    st.pc -= cost;
    if (!st.budget.subDeleted[catId]) st.budget.subDeleted[catId] = {};
    st.budget.subDeleted[catId][subId] = true;
    if (st.budget.subs[catId]) delete st.budget.subs[catId][subId];
    st.budget.mult[catId] = parentMultFromSubs(st, cat);
    if (cat.backlash && sd.fxShare) {
      var delta = {};
      GROUP_IDS.forEach(function (g) { delta[g] = (cat.backlash[g] || 0) * sd.fxShare * dSub.bl; });
      st.groupQueue.push({ delta: delta, remaining: 2, total: 2 });
    }
    st.pendingLog.push('Budget: ' + cat.name + ' → ' + sd.name + ' ELIMINATED (−' + cost + ' PC) — ' + cat.name + ' runs at ' + Math.round(st.budget.mult[catId] * 100) + '% and its effects are weakened.');
    return { ok: true, msg: sd.name + ' eliminated (−' + cost + ' PC, ' + cat.name + ' weakened)' };
  }
  /* parent fx scale after child deletions: Σ fxShare of surviving children */
  function subFxScale(st, cat) {
    var subs = catSubs(cat);
    if (!subs) return 1;
    var dels = (st.budget.subDeleted && st.budget.subDeleted[cat.id]) || {};
    var s = 0;
    subs.forEach(function (sd) { if (!dels[sd.id]) s += sd.fxShare || 0; });
    return s;
  }
  /* ============================================================================
     v0.5 ACT ↔ BUDGET LINKS — when an Act absorbs a line's function
     (spec: spec_act_budget_links.md). Redundant lines cut cheap; the Act carries
     the burden; repeal/stall snaps the need back over `snapbackTurns` turns.
     ==========================================================================*/
  var ACT_BUDGET_LINKS = root.ACT_BUDGET_LINKS || null;
  function linkConsts() {
    var c = (ACT_BUDGET_LINKS && ACT_BUDGET_LINKS.constants) || {};
    return {
      deletePcBase: c.deletePcBase || 10,
      deletePcDiscount: c.deletePcDiscount !== undefined ? c.deletePcDiscount : 0.8,
      groupFxAbsorptionMult: c.groupFxAbsorptionMult !== undefined ? c.groupFxAbsorptionMult : 0.5,
      snapbackTurns: c.snapbackTurns || 4,
      badgeFull: c.badgeFull || 0.5,
      badgePartial: c.badgePartial !== undefined ? c.badgePartial : 0.15,
      consolidateFullR: c.consolidateFullR || 0.85,
      overlapDemandPenalty: c.overlapDemandPenalty !== undefined ? c.overlapDemandPenalty : 0.5,
      uncoveredBelow: c.uncoveredBelow !== undefined ? c.uncoveredBelow : 0.15
    };
  }
  function linkActiveStrength(st, actId, link) {
    var ps = st.pol[actId];
    var def = POLICY_MAP[actId];
    if (!ps || !def) return 0;
    if (ps.stalled) return 0;                       // stalled acts carry nothing
    if (link.option !== null && link.option !== undefined) {
      if (ps.value !== link.option) return 0;
    } else if (ps.value === def.def) return 0;      // null option = any non-default setting
    if ((ps.ramp || 0) < (link.minRamp || 0.01)) return 0;
    if (def.kind === 'slider' && link.minStrength !== undefined) {
      if (!(Number(ps.value) >= link.minStrength)) return 0;
    }
    return (link.coeff || 0) * (ps.ramp !== undefined ? ps.ramp : 1);
  }
  /* per-target best links: pos[target] = {R, eff, mode, actId, actName, rationale}
     neg[target] = {c, actName} for need-INCREASING acts (cuts cost MORE) */
  function computeLinks(st) {
    var pos = {}, neg = {};
    if (!ACT_BUDGET_LINKS || !ACT_BUDGET_LINKS.acts) return { pos: pos, neg: neg };
    Object.keys(ACT_BUDGET_LINKS.acts).forEach(function (actId) {
      var entry = ACT_BUDGET_LINKS.acts[actId];
      var def = POLICY_MAP[actId];
      if (!def || !entry || !entry.links) return;
      entry.links.forEach(function (link) {
        var s = linkActiveStrength(st, actId, link);
        if (s > 0) {
          var rec = pos[link.target];
          if (!rec || s > rec.R) pos[link.target] = { R: s, eff: link.eff || 0, mode: link.mode || 'substitute', actId: actId, actName: def.name, rationale: link.rationale || '' };
        } else if (s < 0) {
          var nr = neg[link.target];
          if (!nr || s < nr.c) neg[link.target] = { c: s, actId: actId, actName: def.name, rationale: link.rationale || '' };
        }
      });
    });
    return { pos: pos, neg: neg };
  }
  function cushionMult(st, key) {
    var sb = st.linkSnap && st.linkSnap[key];
    if (!sb) return 1;
    return clamp(sb.left / linkConsts().snapbackTurns, 0, 1);
  }
  /* parent R = fxShare-weighted mean of child Rs (children w/o links inherit the
     parent link); returns {R, eff, rec} where rec is the dominant link record. */
  function lineLink(st, catId, L) {
    L = L || computeLinks(st);
    var cat = BUDGET_MAP[catId];
    var pr = L.pos[catId];
    var subs = catSubs(cat);
    if (!subs || !subs.length) return { R: pr ? pr.R : 0, eff: pr ? pr.eff : 0, rec: pr || null, neg: L.neg[catId] || null };
    var num = 0, den = 0, best = null;
    subs.forEach(function (sd) {
      var cr = L.pos[catId + '/' + sd.id];
      var r = cr ? cr.R : (pr ? pr.R : 0);
      var w = sd.fxShare || 0;
      num += w * r; den += w;
      if (!best || r > best.R) best = cr || pr || null;
    });
    return { R: den ? num / den : (pr ? pr.R : 0), eff: best ? best.eff : 0, rec: best, neg: L.neg[catId] || null };
  }
  /* absorption: share of a CUT's fx that STILL bites (1 = full hit; 0.14 = mostly
     carried by the covering Act). Group fx absorbed at half-strength (voters notice
     a deleted line more than a missing decimal of GDP). */
  function absorbKeep(st, cat, L) {
    var catRec = L.pos[cat.id];
    var subs = catSubs(cat);
    var g = linkConsts().groupFxAbsorptionMult;
    if (!subs || !subs.length) {
      var R = catRec ? catRec.R : 0;
      var eff = catRec ? catRec.eff : 0;
      var cush = cushionMult(st, cat.id);
      return { metric: 1 - R * eff * cush, group: 1 - R * eff * g * cush };
    }
    var mn = 0, gn = 0, den = 0;
    subs.forEach(function (sd) {
      var cr = L.pos[cat.id + '/' + sd.id];
      var R = cr ? cr.R : (catRec ? catRec.R : 0);
      var eff = cr ? cr.eff : (catRec ? catRec.eff : 0);
      var cush = cushionMult(st, cat.id + '/' + sd.id);
      var w = sd.fxShare || 0;
      mn += w * R * eff * cush; gn += w * R * eff * g * cush; den += w;
    });
    var mScale = den ? mn / den : 0;
    var gScale = den ? gn / den : 0;
    return { metric: 1 - mScale, group: 1 - gScale };
  }
  /* PC/backlash discount for cutting `cutDepth` (mult units) off a line.
     Stacking guard (military enable links): discount applies only within the
     share the Act already reallocated. Negative links make cuts cost MORE. */
  function cutDiscount(st, catId, cutDepth, subId, L) {
    L = L || computeLinks(st);
    var key = subId ? catId + '/' + subId : catId;
    var rec = L.pos[key];
    var catRec = L.pos[catId];
    var R = rec ? rec.R : (catRec ? catRec.R : 0);
    var K = linkConsts();
    var pc = 1, bl = 1;
    if (R > 0 && cutDepth > 0) {
      // full-line deletion discounts the whole cut (spec §2.1); partial slider
      // moves discount only within the share the Act already covers (stacking guard)
      var covered = cutDepth >= 0.99 ? 1 : Math.min(cutDepth, R) / cutDepth;
      pc = 1 - K.deletePcDiscount * R * covered;
      bl = 1 - R * covered;
    }
    var neg = L.neg[key] || L.neg[catId];
    if (neg) { pc *= 1 + Math.abs(neg.c); bl *= 1 + Math.abs(neg.c); }
    return { pc: pc, bl: bl, R: R };
  }
  /* suggested multiplier for the "Consolidate into {Act}" button */
  function consolidateTarget(st, catId) {
    var ll = lineLink(st, catId);
    var K = linkConsts();
    if (ll.R < K.badgeFull) return null;
    return ll.R >= K.consolidateFullR ? 0 : Math.max(0, Math.round((1 - ll.R) * 10) / 10);
  }
  /* snapback bookkeeping: called once per advanceTurn, after links are computed */
  function tickLinkSnap(st, L) {
    var K = linkConsts();
    st.linkSnap = st.linkSnap || {};
    // decay existing cushions
    Object.keys(st.linkSnap).forEach(function (k) {
      st.linkSnap[k].left -= 1;
      if (st.linkSnap[k].left <= 0) delete st.linkSnap[k];
    });
    st.linkPrevR = st.linkPrevR || {};
    var prev = st.linkPrevR;
    var now = {};
    BUDGET.forEach(function (c) {
      if (c.locked) return;
      var m = catMult(st, c);
      var ll = lineLink(st, c.id, L);
      now[c.id] = ll.R;
      var cutLine = m < 0.99;
      // per-child tracking
      var subs = catSubs(c);
      if (subs) {
        var saved = st.budget.subs[c.id] || {};
        var dels = st.budget.subDeleted[c.id] || {};
        subs.forEach(function (sd) {
          var sm = dels[sd.id] ? 0 : (saved[sd.id] !== undefined ? saved[sd.id] : 1);
          var cr = L.pos[c.id + '/' + sd.id];
          var childR = cr ? cr.R : ll.R;
          now[c.id + '/' + sd.id] = childR;
          var key = c.id + '/' + sd.id;
          var cut = sm < 0.99;
          var wasCov = (prev[key] !== undefined ? prev[key] : childR) >= K.uncoveredBelow;
          if (cut && wasCov && childR < K.uncoveredBelow) st.linkSnap[key] = { left: K.snapbackTurns, actName: ll.rec ? ll.rec.actName : '' };
          if (!cut || childR >= K.uncoveredBelow) delete st.linkSnap[key];
        });
      }
      var wasCov = (prev[c.id] !== undefined ? prev[c.id] : ll.R) >= K.uncoveredBelow;
      if (cutLine && wasCov && ll.R < K.uncoveredBelow) st.linkSnap[c.id] = { left: K.snapbackTurns, actName: ll.rec ? ll.rec.actName : '' };
      if (!cutLine || ll.R >= K.uncoveredBelow) delete st.linkSnap[c.id];
    });
    st.linkPrevR = now;
  }

  /* ============================================================================
     v0.5 REAL-WORLD EVENTS — statement popups tied to the scripted timeline.
     Config: js/realworld_events.js (window.REALWORLD_EVENTS). Effects are
     SIM-track only (statements never touch ACTUAL metrics or scripted polling)
     and never touch demand/outlays/growth — voters only, per the taxonomy rule.
     ========================================================================== */
  function eventConsts() {
    var m = (REALWORLD_EVENTS && REALWORLD_EVENTS.meta && REALWORLD_EVENTS.meta.mechanics) || {};
    return {
      maxPopupsPerTurn: m.maxPopupsPerTurn || 2,
      groupSpreadTurns: m.groupSpreadTurns || 2,
      stmtFxTurns: m.stmtFxTurns || 2
    };
  }
  function findEventConfig(st, eventId) {
    if (!REALWORLD_EVENTS || !st.scenario) return null;
    var sc = REALWORLD_EVENTS.scenarios[st.scenario];
    if (!sc || !sc.turns) return null;
    var found = null;
    Object.keys(sc.turns).forEach(function (k) {
      (sc.turns[k] || []).forEach(function (ev) { if (ev.id === eventId) found = ev; });
    });
    return found;
  }
  function describeEventGroups(groups) {
    var parts = [];
    Object.keys(groups || {}).forEach(function (g) {
      var name = (VG.labels && VG.labels[g]) || g;
      var v = groups[g];
      if (v) parts.push(name + ' ' + (v > 0 ? '+' : '') + v);
    });
    return parts.join(', ');
  }
  // shared effect applier for player responses AND no-comment expiry
  function applyEventOutcome(st, cfg, outcome, optionId) {
    var K = eventConsts();
    var groups = outcome.groups || {};
    if (Object.keys(groups).length) {
      st.groupQueue.push({ delta: groups, remaining: K.groupSpreadTurns, total: K.groupSpreadTurns });
    }
    var sent = outcome.sentiment || 0, legit = outcome.legitimacy || 0;
    if (sent || legit) st.stmtFx.push({ sent: sent, legit: legit, left: K.stmtFxTurns });
    var parts = describeEventGroups(groups);
    var line;
    if (optionId === 'no_comment') line = 'No comment on ' + cfg.title + '. The silence is noted.';
    else line = '📣 ' + cfg.title + ' — you chose "' + (outcome.label || optionId) + '".';
    if (parts) line += ' (' + parts + ')';
    if (sent) line += ' Sentiment ' + (sent > 0 ? '+' : '') + sent + ' for ' + K.stmtFxTurns + ' turns.';
    if (legit) line += ' Legitimacy ' + (legit > 0 ? '+' : '') + legit + '.';
    st.newsLog.push({ turn: st.turn, lane: 'event', text: line });
    st.pendingLog.push('Statement: ' + cfg.title + ' → "' + (outcome.label || optionId) + '".' + (parts ? ' (' + parts + ')' : ''));
    st.eventLog.push({
      turn: st.turn, id: cfg.id, optionId: optionId,
      label: outcome.label || optionId,
      groups: groups, sentiment: sent, legitimacy: legit
    });
  }
  function respondToEvent(st, eventId, optionId) {
    if (!REALWORLD_EVENTS) return { ok: false, msg: 'Real-world events are not configured in this build.' };
    var idx = -1, ev = null;
    (st.pendingEvents || []).forEach(function (e, i) { if (e.id === eventId) { idx = i; ev = e; } });
    if (!ev) return { ok: false, msg: 'No pending event "' + eventId + '".' };
    var cfg = findEventConfig(st, ev.id);
    if (!cfg) return { ok: false, msg: 'Event config for "' + ev.id + '" is missing.' };
    var opt = null;
    (cfg.options || []).forEach(function (o) { if (o.id === optionId) opt = o; });
    if (!opt) return { ok: false, msg: 'Unknown option "' + optionId + '" for ' + cfg.title + '.' };
    if (opt.pc && st.pc < opt.pc) return { ok: false, msg: 'Not enough Political Capital (need ' + opt.pc + ', have ' + Math.round(st.pc) + ').' };
    if (opt.pc) st.pc -= opt.pc;
    applyEventOutcome(st, cfg, opt, optionId);
    st.pendingEvents.splice(idx, 1);
    return { ok: true, msg: '📣 ' + cfg.title + ': "' + opt.label + '"' + (opt.pc ? ' (−' + opt.pc + ' PC)' : '') + '.' };
  }
  function expireEvents(st) {
    if (!st.pendingEvents || !st.pendingEvents.length) return;
    var expired = st.pendingEvents.slice();
    st.pendingEvents = [];
    expired.forEach(function (e) {
      var cfg = findEventConfig(st, e.id);
      if (!cfg) return;
      applyEventOutcome(st, cfg, cfg.noComment || { groups: {} }, 'no_comment');
    });
  }
  function collectRealworldEvents(st) {
    if (!REALWORLD_EVENTS || st.over || !st.scenario) return;
    var sc = REALWORLD_EVENTS.scenarios[st.scenario];
    if (!sc) return;
    var K = eventConsts();
    var key = String(st.turn);
    if (sc.turns && sc.turns[key]) {
      // major events surface first when a turn carries two
      var list = sc.turns[key].slice().sort(function (a, b) {
        return (a.tier === 'major' ? 0 : 1) - (b.tier === 'major' ? 0 : 1);
      }).slice(0, K.maxPopupsPerTurn);
      list.forEach(function (ev) {
        if (st.eventsSeen[ev.id]) return; // each event fires exactly once
        st.eventsSeen[ev.id] = st.turn;
        st.pendingEvents.push(Object.assign({}, ev));
        st.newsLog.push({ turn: st.turn, lane: 'event', text: '📣 WORLD EVENT — your response is awaited: ' + ev.title });
      });
    }
    // company / market texture: headline + one social post, no approval effects
    if (sc.marketEvents && sc.marketEvents[key]) {
      sc.marketEvents[key].forEach(function (m) {
        st.newsLog.push({ turn: st.turn, lane: 'hist', text: '[BIZ] ' + m.headline + (m.marketNote ? ' — ' + m.marketNote : '') });
        if (m.socialPosts && m.socialPosts.length) {
          st.newsLog.push({ turn: st.turn, lane: 'social', text: m.socialPosts[st.turn % m.socialPosts.length] });
        }
      });
    }
  }

  /* child-only additive fx, per +10% deviation of the child from its own base */
  function subOwnFx(st, cat) {
    var out = { demand: 0, homelessPct: 0, odPct: 0, incarcPct: 0, det: {}, groups: {} };
    var subs = catSubs(cat);
    if (!subs) return out;
    var saved = st.budget.subs[cat.id] || {};
    var dels = (st.budget.subDeleted && st.budget.subDeleted[cat.id]) || {};
    subs.forEach(function (sd) {
      if (!sd.fx || dels[sd.id]) return;
      var m = saved[sd.id] !== undefined ? saved[sd.id] : 1;
      var dev = (m - 1) * 10;
      if (dev === 0) return;
      var f = sd.fx;
      out.demand += (f.demand || 0) * dev;
      out.homelessPct += (f.homelessPct || 0) * dev;
      out.odPct += (f.odPct || 0) * dev;
      out.incarcPct += (f.incarcPct || 0) * dev;
      if (f.det) Object.keys(f.det).forEach(function (d) { out.det[d] = (out.det[d] || 0) + f.det[d] * dev; });
      if (f.groups) Object.keys(f.groups).forEach(function (g) { out.groups[g] = (out.groups[g] || 0) + f.groups[g] * dev; });
    });
    return out;
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

  /* ---- initial state ----
     v0.4: createGame(scenarioId?) — 'gfc2008' (default, original crisis) or
     'realign2016' (dual-track: SIM counterfactual + scripted ACTUAL history). */
  function createGame(scenarioId) {
    var sc = null;
    if (scenarioId && SCENARIOS && SCENARIOS[scenarioId]) sc = SCENARIOS[scenarioId];
    var s = sc ? scenarioStart(sc) : EV.start;
    var pol = {};
    POLICIES.forEach(function (p) {
      pol[p.id] = { value: p.def, from: p.def, ramp: 1, lag: p.lag, upkeepLeft: 0, upkeepPer: 0, stalled: false };
    });
    var mult = {}, subs = {}, subDeleted = {};
    BUDGET.forEach(function (c) { mult[c.id] = 1; subs[c.id] = {}; subDeleted[c.id] = {}; });
    var st = {
      turn: 0, year: s.year, quarter: s.quarter,
      gdp_level: s.gdp_level, priceIndex: s.priceIndex, gdp_nominal: s.gdp_level * s.priceIndex,
      growth: 0, unemployment: s.unemployment, debt_gdp: s.debt_gdp,
      deficit_bn: 0, revenue_bn: 0, inflation: s.inflation, med_income: s.med_income,
      homelessness: s.homelessness, overdoses: s.overdoses, incarcerated: s.incarcerated,
      sentiment: s.sentiment, legitimacy: s.legitimacy,
      pc: s.pc, funds: s.funds,
      det: Object.assign({}, s.determinants),
      approval: Object.assign({}, VG.initial, s.approval || {}),
      pol: pol,
      budget: { mult: mult, deleted: {}, subs: subs, subDeleted: subDeleted },
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
      pendingNews: [],
      linkSnap: {},     // v0.5: uncovering cushions (target key → {left turns})
      linkPrevR: {},    // v0.5: last turn's per-line redundancy (snapback detector)
      pendingEvents: [], // v0.5: real-world events awaiting a public statement
      eventLog: [],      // v0.5: resolved statements (report tab + export)
      eventsSeen: {},    // v0.5: event id → turn fired (fires exactly once)
      stmtFx: []         // v0.5: decaying sentiment/legitimacy queue from statements
    };
    if (sc) {
      st.scenario = sc.id;
      st.clockYear = s.clockYear || s.year;
      st.dualTrack = !!sc.dualTrack;
      st.startGdpLevel = s.gdp_level; // metric-norm anchor for this scenario
      if (sc.dualTrack) {
        st.shadowParty = Object.assign({}, s.shadowParty || s.party);
        st.influence = s.influence || 0;
        st.influencePerTurn = s.influencePerTurn || 0;
        st.influenceCap = s.influenceCap || 25;
        st.influenceLog = [];
        st.actual = {
          turn: 0,
          gdp_level: s.gdp_level, gdp_nominal: s.gdp_nominal,
          unemployment: s.unemployment, debt_gdp: s.debt_gdp,
          med_income: s.med_income, homelessness: s.homelessness,
          overdoses: s.overdoses, incarcerated: s.incarcerated,
          inflation: s.inflation,
          det: Object.assign({}, s.determinants),
          history: [{ turn: 0 }]  // filled per-turn by advanceTurnActual()
        };
      }
    } else {
      st.startGdpLevel = EV.start.gdp_level;
    }
    return st;
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
      var m = catMult(st, c);
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
    // v0.5: the statement window is exactly the turn an event fired in —
    // anything still pending when the player advances is auto-resolved as
    // "no comment" BEFORE the turn rolls over
    expireEvents(st);
    st.turn += 1;
    st.year = turnToYear(st, st.turn);
    st.quarter = turnToQuarter(st.turn);
    var ev = scenarioEvent(scenarioOf(st));
    var items = [];
    if (st.pendingLog.length) { items = items.concat(st.pendingLog); st.pendingLog = []; }

    // --- political capital & funds (party-scaled) ---
    var fxPre = aggregateEffects(st); // for pcRegen / fundsMult of settled acts
    var pcs = pcStats(st);
    st.pcCap = pcs.cap; st.pcRegen = pcs.regen + fxPre.pcRegen;
    st.pc = Math.min(pcs.cap, st.pc + st.pcRegen);
    // war-chest cap scales with the starting funds of the scenario (v0.4:
    // the 2016 realignment starts with $300M, so the cap is 300)
    var fundsCap = (scenarioOf(st) ? (scenarioStart(scenarioOf(st)).funds) : 100) || 100;
    st.funds = Math.min(fundsCap, st.funds + 5 * fxPre.fundsMult);
    // dual-track: Influence (ACTUAL-track nudge points) regenerates slowly
    if (st.dualTrack) {
      st.influence = Math.min(st.influenceCap, st.influence + st.influencePerTurn);
    }
    // v0.5: act↔budget link snapback bookkeeping (cushion decay + uncover detection)
    tickLinkSnap(st, computeLinks(st));

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
    var shock = (ev.shocks || {})[st.turn] || 0;
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
    var uShock = (ev.unempShock || {})[st.turn] || 0;
    st.unemployment = clamp(st.unemployment + dUnemp + uShock, 3, 25);

    // --- median income ---
    var miGrowth = (growth - 0.5) / 4 + fx.workersBonus / 4; // % per quarter
    st.med_income *= (1 + miGrowth / 100);

    // --- budget ---
    var crisisOutlay = (ev.outlayShock || {})[st.turn] || 0;
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
    var outTarget = clamp(88 + 60 * (st.gdp_level / (st.startGdpLevel || EV.start.gdp_level) - 1), 0, 100);
    det.output += 0.3 * (outTarget - det.output);
    det.fincenter += (st.debt_gdp > 110 ? -0.15 : 0.02);
    det.reserve_fx += (st.debt_gdp > 120 ? -0.1 : 0.005) + (st.inflation > 5 ? -0.05 : 0);
    // v0.5 (WS6): per-turn scripted determinant shocks (EVENTS block detShock),
    // used by the dbe2030 transition crisis — e.g. Q-Day dents reserve_fx
    var dShock = (ev.detShock || {})[st.turn];
    if (dShock) {
      var dParts = [];
      DET_IDS.forEach(function (d) {
        if (dShock[d]) { det[d] += dShock[d]; dParts.push(d + ' ' + (dShock[d] > 0 ? '+' : '') + dShock[d]); }
      });
      if (dParts.length) items.push('⚡ Transition shock: ' + dParts.join(', ') + ' (determinant hit).');
    }
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
    // v0.5: statement mood effects ride the fx.sentAdd/fx.legitAdd channel
    // through a 2-turn decaying queue (sentiment is recomputed from fundamentals
    // every turn, so statement bumps cannot be one-time writes)
    var stmtSent = 0, stmtLegit = 0;
    st.stmtFx = st.stmtFx.filter(function (e) {
      stmtSent += e.sent || 0; stmtLegit += e.legit || 0;
      e.left -= 1; return e.left > 0;
    });
    fx.sentAdd += stmtSent; fx.legitAdd += stmtLegit;
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

    // --- midterms: seat adjustment vs approval, −5 penalty ---
    if (isMidtermT(st, st.turn)) {
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

    // --- dual-track: advance the scripted ACTUAL history underneath the sim ---
    if (st.dualTrack && !st.over) advanceTurnActual(st, items);

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

    // --- presidential elections ---
    if (isPresElectionT(st, st.turn)) {
      var res = { turn: st.turn, year: st.year, pct: round(appr, 1), won: appr >= 50 };
      st.elections.push(res);
      if (res.won) {
        st.legitimacy = clamp(st.legitimacy + 12, 0, 100);
        st.party.president = true;
        st.pc = Math.min(pcStats(st).cap, st.pc + 30);
        items.push('🗳️ ELECTION WON — weighted approval ' + res.pct + '% ≥ 50%. Your party takes the White House: legitimacy +12, +30 PC.');
        st.newsLog.push({ turn: st.turn, lane: 'alert', text: 'BREAKTHROUGH: your new party WINS the White House (' + res.pct + '%). Mandate +30 PC.' });
      } else if (st.dualTrack) {
        // a brand-new party losing a presidential race is not game over —
        // it keeps organizing while the scripted administration continues
        st.legitimacy = clamp(st.legitimacy - 3, 0, 100);
        items.push('🗳️ PRESIDENTIAL ' + st.year + ' — your party polls ' + res.pct + '%; the scripted administration continues. The movement endures (legitimacy −3).');
      } else if (scenarioOf(st) && scenarioOf(st).keepPlayingOnLoss) {
        // v0.5 (WS6, dbe2030): the transition outlives any one administration —
        // losing the White House is a heavy blow, not the end of the arc
        st.legitimacy = clamp(st.legitimacy - 8, 0, 100);
        st.party.president = false;
        items.push('🗳️ ELECTION LOST — weighted approval ' + res.pct + '% < 50%. The White House changes hands, but the transition outlives any one administration. Your party regroups in opposition (legitimacy −8).');
        st.newsLog.push({ turn: st.turn, lane: 'alert', text: 'Election lost (' + res.pct + '%) — you keep governing the transition from opposition. Win back the mandate in ' + (st.year + 4) + '.' });
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
    news = news.concat(histNews(st));
    news.forEach(function (n) { st.newsLog.push({ turn: st.turn, lane: n.lane, text: n.text }); });
    if (st.newsLog.length > 600) st.newsLog = st.newsLog.slice(st.newsLog.length - 600);

    // v0.5: real-world events for this scripted turn fire AFTER the ACTUAL-track
    // advance (so the 🏛️ act log line precedes the popup teaser) and only if
    // the game is still running
    if (!st.over) collectRealworldEvents(st);

    st.log.push({ turn: st.turn, label: 'Q' + st.quarter + ' ' + st.year, items: items });
    return st;
  }

  /* ============================================================================
     v0.4 DUAL-TRACK — The Realignment (2016)
     SIM track  = counterfactual engine state (full shadow-party PC).
     ACTUAL track = scripted real history (js/scenario_2016.js) advanced one
     scripted row per turn, then nudged by the player's Influence spends.
     ========================================================================== */
  function actualScript() {
    return (typeof root.SCENARIO_2016 !== 'undefined' && root.SCENARIO_2016) ? root.SCENARIO_2016 : null;
  }

  function advanceTurnActual(st, items) {
    var A = st.actual, scr = actualScript();
    if (!A || !scr) return;
    A.turn = st.turn;
    var rec = (scr.byTurn && scr.byTurn[String(st.turn)]) || null;
    if (!rec) return; // beyond the script (2026+ without projection rows)
    // base scripted values (undefined fields keep the previous level)
    ['gdp_level', 'gdp_nominal', 'unemployment', 'debt_gdp', 'med_income',
     'homelessness', 'overdoses', 'incarcerated', 'inflation'].forEach(function (k) {
      if (rec[k] !== undefined) A[k] = rec[k];
    });
    if (rec.det) DET_IDS.forEach(function (d) { if (rec.det[d] !== undefined) A.det[d] = rec.det[d]; });
    // nudge persistence: ±0.25%/qtr decay back toward the script
    var nz = A.nudges || {};
    ['unemployment', 'debt_gdp', 'homelessness', 'overdoses', 'sentiment'].forEach(function (k) {
      if (!nz[k]) return;
      var base = rec[k] !== undefined ? rec[k] : A[k];
      A[k] = base + nz[k];
      nz[k] *= 0.9975;
      if (Math.abs(nz[k]) < 0.01) delete nz[k];
    });
    if (nz.det) {
      DET_IDS.forEach(function (d) {
        if (!nz.det[d]) return;
        var base = (rec.det && rec.det[d] !== undefined) ? rec.det[d] : A.det[d];
        A.det[d] = clamp(base + nz.det[d], 0, 100);
        nz.det[d] *= 0.9975;
        if (Math.abs(nz.det[d]) < 0.01) delete nz.det[d];
      });
    }
    // actual-party acts fire as they did in real history
    applyActualActs(st, rec, items);
    A.history.push({
      turn: st.turn,
      gdp_level: round(A.gdp_level, 1), gdp_nominal: round(A.gdp_nominal, 1),
      unemployment: round(A.unemployment, 2), debt_gdp: round(A.debt_gdp, 1),
      med_income: round(A.med_income, 0), homelessness: round(A.homelessness, 1),
      overdoses: round(A.overdoses, 0), incarcerated: round(A.incarcerated, 3),
      inflation: round(A.inflation, 2),
      det: DET_IDS.reduce(function (o, d) { o[d] = round(A.det[d], 1); return o; }, {}),
      acts: rec.acts || []
    });
  }

  function applyActualActs(st, rec, items) {
    if (!rec.acts || !rec.acts.length) return;
    var scr = actualScript();
    rec.acts.forEach(function (actId) {
      var a = (scr.acts && scr.acts[actId]) || null;
      if (!a) return;
      st.actualActsFired = st.actualActsFired || {};
      if (st.actualActsFired[actId]) return; // each actual act fires once
      st.actualActsFired[actId] = st.turn;
      var label = 'Q' + st.quarter + ' ' + st.year;
      items.push('🏛️ ACTUAL — ' + a.name + ' (' + label + '): ' + a.summary);
      st.newsLog.push({ turn: st.turn, lane: 'hist', text: '🏛️ ' + a.name + ' enacted in Washington (' + label + '). ' + a.summary });
      // legitimacy bleed: a hyper-active actual state crowds out a small party
      st.legitimacy = clamp(st.legitimacy - 1, 0, 100);
    });
  }

  /* ACTUAL-track nudge points: a tiny caucus can push, not steer. */
  var INFLUENCE = {
    pressure:  { name: 'Lobby & Pressure',    cost: 4, nudge: { unemployment: -0.1, sentiment: 0.5 },  blurb: 'jobs-town halls move the needle a hair' },
    narrative: { name: 'Media Narrative',     cost: 4, nudge: { det: { legitimacy: 0.4 } },            blurb: 'a sympathetic storyline shifts the mood' },
    local:     { name: 'Local Ground Game',   cost: 3, nudge: { homelessness: -0.3 },                 blurb: 'shelters & services in your districts' },
    watchdog:  { name: 'Watchdog Oversight',  cost: 3, nudge: { debt_gdp: -0.1, det: { legitimacy: 0.2 } }, blurb: 'exposing waste trims the actual deficit a notch' }
  };
  function applyInfluence(st, key) {
    if (st.over) return { ok: false, msg: 'Game is over.' };
    if (!st.dualTrack) return { ok: false, msg: 'Influence is only used in dual-track scenarios.' };
    var a = INFLUENCE[key];
    if (!a) return { ok: false, msg: 'Unknown influence action.' };
    if (st.influence < a.cost) return { ok: false, msg: 'Not enough Influence (need ' + a.cost + ', have ' + Math.floor(st.influence) + ').' };
    st.influence -= a.cost;
    nudgeActual(st, a.nudge, a.name);
    st.influenceLog.push({ turn: st.turn, action: a.name });
    st.pendingLog.push('ACTUAL: ' + a.name + ' (−' + a.cost + ' Influence) — ' + a.blurb + '.');
    return { ok: true, msg: a.name + ': ' + a.blurb };
  }
  function nudgeActual(st, nudge, label) {
    var A = st.actual;
    if (!A) return;
    if (!A.nudges) A.nudges = { det: {} };
    if (!A.nudges.det) A.nudges.det = {};
    ['unemployment', 'debt_gdp', 'homelessness', 'overdoses', 'sentiment'].forEach(function (k) {
      if (nudge[k] !== undefined) A.nudges[k] = (A.nudges[k] || 0) + nudge[k];
    });
    if (nudge.det) Object.keys(nudge.det).forEach(function (d) {
      A.nudges.det[d] = (A.nudges.det[d] || 0) + nudge.det[d];
    });
    st.newsLog.push({ turn: st.turn, lane: 'social', text: 'Your caucus\'s "' + label + '" makes a small real-world dent — barely a rounding error in Washington, but your people feel it.' });
  }

  /* ---- v0.4 repeal: strip an enacted Act and simulate the aftermath ----
     The Act's contribution ramps OFF along the reverse of its build-up curve
     (same lag), group effects unwind linearly over the same horizon, and
     upkeep stops. Repeal itself costs the full PC price of the current level. */
  function repealAct(st, id) {
    if (st.over) return { ok: false, msg: 'Game is over.' };
    var def = POLICY_MAP[id];
    if (!def) return { ok: false, msg: 'Unknown Act.' };
    var ps = st.pol[id];
    var cur = ps.value;
    var base = def.kind === 'slider' ? def.def : getOption(def, def.def).id;
    var isOff = false;
    if (def.options && def.options.length && def.options[0].id === 'off') isOff = (cur === 'off'); // v0.3 "off = not enacted" acts
    if (cur === def.def || (def.options && def.options[0].id === 'off' && cur === 'off')) {
      return { ok: false, msg: def.name + ' is not in force — nothing to repeal.' };
    }
    var backTo = (def.options && def.options[0].id === 'off') ? 'off' : def.def;
    var cost = def.kind === 'slider' ? changeCost(def, cur, def.def) : getOption(def, cur).pc;
    cost = Math.max(cost, 8); // repeal fights an entrenched status quo
    if (st.pc < cost) return { ok: false, msg: 'Not enough Political Capital (need ' + cost + ', have ' + Math.floor(st.pc) + ').' };
    st.pc -= cost;
    var og = optionGroups(def, cur), ng = optionGroups(def, backTo);
    var delta = {};
    GROUP_IDS.forEach(function (g) { delta[g] = (ng[g] || 0) - (og[g] || 0); });
    var lag = Math.max(1, optionLag(def, cur));
    st.groupQueue.push({ delta: delta, remaining: lag, total: lag });
    ps.from = cur; ps.value = backTo; ps.ramp = 0; ps.lag = lag;
    ps.upkeepPer = 0; ps.upkeepLeft = 0; ps.stalled = false;
    if (id === 'housing' && cur === 'rentban') st.rentban = null;
    if (id === 'drug') st.odAnchor = null;
    if (id === 'ubi') st.homelessAnchor = null;
    var label = def.kind === 'slider' ? (def.def + def.unit) : getOption(def, backTo).label;
    st.pendingLog.push('REPEALED: ' + def.name + ' → ' + label + ' (−' + cost + ' PC, effects unwind over ' + lag + ' turn' + (lag > 1 ? 's' : '') + ').');
    st.newsLog.push({ turn: st.turn, lane: 'alert', text: '🧨 ' + def.name + ' REPEALED. The effects unwind along the reverse of their build-up curve.' });
    return { ok: true, msg: def.name + ' repealed (−' + cost + ' PC)' };
  }

  /* restore a deleted budget line (parent or category) */
  function restoreBudgetLine(st, catId) {
    if (st.over) return { ok: false, msg: 'Game is over.' };
    var cat = BUDGET_MAP[catId];
    if (!cat) return { ok: false, msg: 'Unknown budget category.' };
    if (cat.locked) return { ok: false, msg: 'Interest is automatic and cannot be edited.' };
    var isDeleted = !!st.budget.deleted[catId];
    var subsDeleted = st.budget.subDeleted[catId] && Object.keys(st.budget.subDeleted[catId]).some(function (k) { return st.budget.subDeleted[catId][k]; });
    if (!isDeleted && !subsDeleted) return { ok: false, msg: cat.name + ' has no deleted lines.' };
    var cost = 5;
    if (st.pc < cost) return { ok: false, msg: 'Not enough Political Capital (need ' + cost + ', have ' + Math.floor(st.pc) + ').' };
    st.pc -= cost;
    st.budget.deleted[catId] = false;
    st.budget.subDeleted[catId] = {};
    if (!isDeleted) {
      // only a sub was deleted: keep surviving child mults, recompute parent
      st.budget.mult[catId] = parentMultFromSubs(st, cat);
    } else {
      st.budget.mult[catId] = 1;
      st.budget.subs[catId] = {};
    }
    // v0.5: restoring re-covers any snapback gap (no backlash on restore by design)
    if (st.linkSnap) {
      delete st.linkSnap[catId];
      var snapSubs = catSubs(cat);
      if (snapSubs) snapSubs.forEach(function (sd) { delete st.linkSnap[catId + '/' + sd.id]; });
    }
    st.pendingLog.push('Budget: ' + cat.name + ' lines restored (−' + cost + ' PC).');
    return { ok: true, msg: cat.name + ' restored (−' + cost + ' PC)' };
  }

  /* ---- network model: node sizes + edge deltas (deterministic; UI renders) ---- */
  var METRIC_NODES = ['gdp', 'unemployment', 'debt', 'homelessness', 'overdoses', 'incarcerated', 'med_income', 'sentiment'];
  function metricNorm(st, id) {
    switch (id) {
      case 'gdp': return clamp(st.gdp_level / ((st.startGdpLevel || 16915.191) * 1.42) * 100, 5, 100);
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
    return JSON.stringify({ game: 'PoliSim-DBE v0.5', elections: st.elections, midterms: st.midterms, over: st.over, overReason: st.overReason, log: st.log, news: st.newsLog, events: st.eventLog || [], snapshots: st.snapshots }, null, 1);
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

  /* ---- v0.5 (WS5): custom Acts registered from the Act Studio ----
     POLICIES === root.POLICY_DEFS (same array), so pushing here makes the Act
     appear in createGame's pol-init, aggregateEffects and the UI rail at once. */
  function validateCustomAct(def) {
    if (!def || typeof def !== 'object') return { ok: false, msg: 'Act definition missing.' };
    if (typeof def.id !== 'string' || !/^custom_[a-z0-9_]+$/.test(def.id)) return { ok: false, msg: 'Custom Act id must match custom_[a-z0-9_]+.' };
    if (typeof def.name !== 'string' || !def.name.trim()) return { ok: false, msg: 'Custom Act needs a name.' };
    if (def.kind !== 'select') return { ok: false, msg: 'Custom Acts must be kind "select".' };
    var cats = root.ACT_CATEGORIES || [];
    if (cats.length && !cats.some(function (c) { return c.id === def.cat; })) return { ok: false, msg: 'Unknown Act category "' + def.cat + '".' };
    if (!Array.isArray(def.options) || def.options.length < 2) return { ok: false, msg: 'Custom Act needs at least two options.' };
    var seen = {}, hasDef = false;
    for (var i = 0; i < def.options.length; i++) {
      var o = def.options[i];
      if (!o || typeof o.id !== 'string' || typeof o.label !== 'string') return { ok: false, msg: 'Every option needs an id and a label.' };
      if (seen[o.id]) return { ok: false, msg: 'Duplicate option id "' + o.id + '".' };
      seen[o.id] = true;
      if (o.id === def.def) hasDef = true;
      if (!Number.isFinite(o.pc) || o.pc < 0) return { ok: false, msg: 'Option "' + o.id + '" needs a non-negative pc.' };
      if (o.upkeep && (!Number.isFinite(o.upkeep.perTurn) || !Number.isFinite(o.upkeep.turns))) return { ok: false, msg: 'Option "' + o.id + '" upkeep malformed.' };
      var det = (o.fx && o.fx.det) || {};
      for (var d in det) {
        if (DET_IDS.indexOf(d) < 0) return { ok: false, msg: 'Unknown determinant "' + d + '".' };
        if (Math.abs(det[d]) > 1) return { ok: false, msg: 'Determinant effect ' + d + ' exceeds the ±1.0/turn cap.' };
      }
      var gr = o.groups || {};
      for (var g in gr) {
        if (GROUP_IDS.indexOf(g) < 0) return { ok: false, msg: 'Unknown voter group "' + g + '".' };
        if (Math.abs(gr[g]) > 10) return { ok: false, msg: 'Group effect ' + g + ' exceeds the ±10 cap.' };
      }
    }
    if (!hasDef) return { ok: false, msg: 'def.def must match an option id (e.g. "off").' };
    return { ok: true, msg: 'ok' };
  }
  function registerCustomAct(def) {
    var v = validateCustomAct(def);
    if (!v.ok) return v;
    if (POLICY_MAP[def.id]) return { ok: false, msg: 'An Act with id "' + def.id + '" already exists.' };
    POLICIES.push(def);
    POLICY_MAP[def.id] = def;
    return { ok: true, msg: def.name + ' registered — it now appears in the Acts rail.' };
  }
  function unregisterCustomAct(id) {
    if (typeof id !== 'string' || id.indexOf('custom_') !== 0 || !POLICY_MAP[id]) return { ok: false, msg: 'Not a registered custom Act.' };
    for (var i = 0; i < POLICIES.length; i++) if (POLICIES[i].id === id) { POLICIES.splice(i, 1); break; }
    delete POLICY_MAP[id];
    return { ok: true, msg: 'Custom Act removed.' };
  }

  return {
    createGame: createGame,
    applyPolicy: applyPolicy,
    applyCampaign: applyCampaign,
    applyBudget: applyBudget,
    deleteBudgetCat: deleteBudgetCat,
    applyBudgetSub: applyBudgetSub,
    deleteBudgetSub: deleteBudgetSub,
    restoreBudgetLine: restoreBudgetLine,
    repealAct: repealAct,
    applyInfluence: applyInfluence,
    nudgeActual: nudgeActual,
    INFLUENCE: INFLUENCE,
    computeLinks: computeLinks,
    lineLink: lineLink,
    cushionMult: cushionMult,
    linkConsts: linkConsts,
    consolidateTarget: consolidateTarget,
    aggregateEffects: aggregateEffects,
    registerCustomAct: registerCustomAct,
    unregisterCustomAct: unregisterCustomAct,
    catMult: catMult,
    respondToEvent: respondToEvent,
    expireEvents: expireEvents,
    collectRealworldEvents: collectRealworldEvents,
    findEventConfig: findEventConfig,
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

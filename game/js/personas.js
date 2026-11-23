/* ============================================================================
   PoliSim-DBE — personas.js  (WS-N1)
   Player-agent layer for overnight simulations. A persona is an objective
   function over the engine state; the driver plays a full game headlessly,
   choosing a feasible move each turn.

   PURE CONSUMER of ENGINE exports — no engine mechanics are modified here.
   All randomness routes through ENGINE.detRand (same FNV-1a/xorshift hash PRNG
   the engine uses), keyed by (seed, turn, move-key): same inputs ⇒ same trace.

   No DOM. UMD: window.PERSONAS in the browser, module.exports in Node.
   ========================================================================== */
(function (root, factory) {
  var P = factory(root);
  root.PERSONAS = P;
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';

  // ENGINE is loaded before us in the browser; in Node require it lazily so
  // this file also works standalone after data.js/engine.js are required.
  function ENGINE() {
    if (root.ENGINE) return root.ENGINE;
    if (typeof require === 'function') return require('./engine.js');
    return null;
  }
  function MODES() {
    if (root.MODES) return root.MODES;
    if (typeof require === 'function') { try { return require('./modes.js'); } catch (e) { return null; } }
    return null;
  }
  function policies() { return root.POLICY_DEFS || []; }   // live read: includes custom-registered Acts
  function VG() { return root.VOTER_GROUPS || { weights: {}, labels: {}, initial: {} }; }
  function BUDGET() { return root.BUDGET_CATS || []; }
  function SCENARIOS() { return root.SCENARIOS || {}; }
  function EVENTS() { return root.EVENTS || {}; }

  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function clamp01(x) { return clamp(Number(x) || 0, 0, 1); }
  function round(x, d) { var m = Math.pow(10, d || 2); return Math.round(x * m) / m; }

  /* deterministic PRNG proxy: prefer the engine's own detRand (identical
     function), so persona randomness follows engine conventions exactly */
  function detRand(str) {
    var E = ENGINE();
    if (E && typeof E.detRand === 'function') return E.detRand(str);
    // fallback: byte-identical copy of engine.js detRand (FNV-1a → xorshift)
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    h >>>= 0;
    h ^= h << 13; h >>>= 0; h ^= h >> 17; h ^= h << 5; h >>>= 0;
    return h / 4294967296;
  }

  /* ============================================================================
     1) SLIDER MODEL — {risk, ethics, win} → objective weights.
     ethics: 0 = humanity … 1 = party/unethical. win: hunger for power.
     ========================================================================== */
  function makePersona(o) {
    o = o || {};
    var risk = clamp01(o.risk), ethics = clamp01(o.ethics), win = clamp01(o.win);
    var humanity = 1 - ethics;
    var weights = {
      welfare: round(0.2 + 2.2 * humanity, 4),                          // overdoses↓, homelessness↓, med income↑, education↑
      nation: round(0.4 + 1.4 * (1 - Math.abs(ethics - 0.5) * 2), 4),   // growth↑, debt/GDP↓, determinants↑, S↑
      party: round(0.2 + 2.0 * win, 4),                                 // approval, seats, PC, funds
      world: round(0.1 + 1.5 * win * (0.5 + 0.5 * ethics), 4),          // S vs incumbent / baseline
      dark: round(ethics * win, 4)                                      // propensity for misinfo/lobbying
    };
    return {
      id: o.id || 'custom',
      icon: o.icon || '🎭',
      name: o.name || 'Custom',
      risk: risk, ethics: ethics, win: win,
      weights: weights,
      flavor: o.flavor || {}
    };
  }

  var PRESETS = {
    humanitarian: makePersona({
      id: 'humanitarian', icon: '🕊', name: 'Humanitarian', risk: 0.2, ethics: 0.1, win: 0.3,
      flavor: {
        budget: { health: 1, medicaid: 1, medicare: 0.8, income_security: 1, education: 0.9, social_security: 0.6, environment: 0.5, defense: -1, justice: -0.3 },
        det: { education: 0.6 }, tariff: -0.5, groupFocus: 1.0
      }
    }),
    statesman: makePersona({
      id: 'statesman', icon: '🏛', name: 'Statesman', risk: 0.5, ethics: 0.5, win: 0.5,
      flavor: { budget: { transport: 0.4, education: 0.4, science: 0.4, health: 0.3 }, det: {}, tariff: 0, groupFocus: 1.0 }
    }),
    nationalist: makePersona({
      id: 'nationalist', icon: '🦅', name: 'Nationalist', risk: 0.3, ethics: 0.6, win: 0.8,
      flavor: {
        budget: { defense: 1, transport: 0.7, veterans: 0.6, justice: 0.4, international: -0.4, medicaid: -0.5, income_security: -0.4, environment: -0.6 },
        det: { military: 0.8, trade: 0.3 }, tariff: 1.2, groupFocus: 1.0
      }
    }),
    machine: makePersona({
      id: 'machine', icon: '🐘', name: 'Machine', risk: 0.4, ethics: 0.8, win: 0.7,
      flavor: {
        budget: { social_security: 0.5, medicare: 0.5, veterans: 0.4, defense: 0.3, environment: -0.3 },
        det: {}, tariff: 0, groupFocus: 1.6   // approval groups are the whole game
      }
    }),
    machiavelli: makePersona({
      id: 'machiavelli', icon: '🐍', name: 'Machiavelli', risk: 0.85, ethics: 0.95, win: 0.95,
      flavor: {
        budget: { income_security: -3, medicaid: -3, medicare: -3, social_security: -2.5, defense: 1.5, justice: 1, veterans: 0.8 },
        det: { military: 0.3 }, tariff: 0.3, groupFocus: 0.9
      }
    })
  };

  function resolvePersona(p) {
    if (typeof p === 'string') {
      var base = PRESETS[p];
      if (!base) throw new Error('Unknown persona preset "' + p + '".');
      return base;
    }
    if (p && p.weights) return p;
    return makePersona(p);
  }

  /* ---- channel values: persona's marginal value per unit of each fx channel ---- */
  function channelValues(p) {
    var w = p.weights;
    return {
      demand: 2.5 * w.nation + 0.7 * w.party,
      outlay: -(1.4 * w.nation + 0.3 * w.world),
      revAdd: 1.4 * w.nation + 0.3 * w.world,
      homelessPct: -1.6 * w.welfare,
      odPct: -1.6 * w.welfare,
      incarcPct: -0.5 * w.welfare,
      rentPressure: -0.8 * w.welfare,
      workersBonus: 1.4 * w.welfare + 0.4 * w.party,
      legitAdd: 0.7 * w.party + 0.4 * w.nation,
      sentAdd: 0.45 * w.party + 0.15 * w.welfare,
      pcRegen: 0.8 * w.party,
      inflation: -(0.6 * w.nation + 0.3 * w.welfare)
    };
  }
  function detVal(p, d) {
    var w = p.weights;
    return (0.7 * w.nation + 0.35 * w.world) * (1 + ((p.flavor.det || {})[d] || 0));
  }
  function pcValue(p) { return 0.35 * p.weights.party; }

  /* scenario-aware turns until the next presidential election */
  function turnsToElection(g) {
    var sc = SCENARIOS()[g.scenario] || {};
    var EV = EVENTS();
    var E0 = sc.electionStart || EV.electionStart || 20;
    var ECYC = sc.electionCycle || EV.electionCycle || 16;
    var e = E0;
    while (e <= g.turn) e += ECYC;
    return e - g.turn;
  }
  /* the bar approval must clear: MODES incumbent in challenge mode, else 50%
     (and, in govern mode, the world term additionally tracks S vs the scenario's
     no-op baseline — see worldFactor) */
  function approvalBar(g) {
    var M = MODES();
    if (g.mode === 'challenge' && g.incumbent && M && typeof M.incumbentAt === 'function') {
      return M.incumbentAt(g, g.turn);
    }
    return 50;
  }
  /* world term: >0 when ahead of the reference (incumbent in challenge mode,
     the scenario's deterministic no-op baseline S-track otherwise) */
  function worldGap(g, p, ctx) {
    var M = MODES();
    if (g.mode === 'challenge' && g.incumbent && M && typeof M.incumbentAt === 'function') {
      return (ENGINE().weightedApproval(g) - M.incumbentAt(g, g.turn)) / 10;
    }
    var bS = ctx && ctx.baselineS;
    if (bS && bS.length) {
      var ref = bS[Math.min(g.turn, bS.length - 1)];
      return (ENGINE().computePower(g).S - ref) / 5;
    }
    return 0;
  }
  function worldFactor(g, p, ctx) {
    return 1 + clamp(-worldGap(g, p, ctx), -1, 1) * 0.3 * p.weights.world;
  }

  /* value of +1 approval point on group g right now */
  function groupVal(g, grp, p) {
    var w = p.weights;
    var prox = clamp((6 - turnsToElection(g)) / 6, 0, 1);
    var urgency = 1 + 1.2 * p.win * prox;
    var wt = (VG().weights || {})[grp] || 10;
    return w.party * (0.45 + wt / 22) * (p.flavor.groupFocus || 1) * urgency;
  }

  /* ---- score a flat fx object (Act option / budget preview channel deltas) ----
     Returns { total, fxPart, groupPart, top:[strings] }. One-time group shifts
     are discounted (they land once and then mean-revert); per-turn drifts get
     a horizon multiplier. Uncertain terms (long-lag, radical or custom Acts)
     are returned separately so the caller can apply the risk discount. */
  var GROUP_DRIFT_HORIZON = 5;   // turns a per-turn group drift is valued over
  var ONE_TIME_GROUP_DISCOUNT = 0.6;

  function scoreFxDelta(p, g, fxNew, fxOld, groupsNew, groupsOld, driftNew, driftOld) {
    var cv = channelValues(p);
    var wf = worldFactor(g, p, scoreFxDelta._ctx);
    var fxPart = 0, groupPart = 0, top = [];
    function add(label, v, bucket) {
      if (!v) return;
      if (bucket === 'g') groupPart += v; else fxPart += v;
      top.push({ label: label, v: v });
    }
    var CH = ['demand', 'outlay', 'revAdd', 'homelessPct', 'odPct', 'incarcPct', 'rentPressure', 'workersBonus', 'legitAdd', 'sentAdd', 'pcRegen', 'inflation'];
    CH.forEach(function (ch) {
      var d = (fxNew && fxNew[ch] || 0) - (fxOld && fxOld[ch] || 0);
      if (d) add(ch + ' ' + (d > 0 ? '+' : '') + round(d, 2), cv[ch] * d * (ch === 'demand' || ch === 'revAdd' || ch === 'outlay' ? wf : 1));
    });
    var dets = {};
    if (fxNew && fxNew.det) Object.keys(fxNew.det).forEach(function (d) { dets[d] = true; });
    if (fxOld && fxOld.det) Object.keys(fxOld.det).forEach(function (d) { dets[d] = true; });
    Object.keys(dets).forEach(function (d) {
      var dd = (fxNew.det && fxNew.det[d] || 0) - (fxOld.det && fxOld.det[d] || 0);
      if (dd) add('det.' + d + ' ' + (dd > 0 ? '+' : '') + round(dd, 2) + '/qtr', detVal(p, d) * dd * wf);
    });
    var grps = {};
    if (groupsNew) Object.keys(groupsNew).forEach(function (k) { grps[k] = true; });
    if (groupsOld) Object.keys(groupsOld).forEach(function (k) { grps[k] = true; });
    Object.keys(grps).forEach(function (grp) {
      var d1 = (groupsNew && groupsNew[grp] || 0) - (groupsOld && groupsOld[grp] || 0);
      if (d1) add(grp + ' ' + (d1 > 0 ? '+' : '') + d1, groupVal(g, grp, p) * d1 * ONE_TIME_GROUP_DISCOUNT, 'g');
    });
    var drifts = {};
    if (driftNew) Object.keys(driftNew).forEach(function (k) { drifts[k] = true; });
    if (driftOld) Object.keys(driftOld).forEach(function (k) { drifts[k] = true; });
    Object.keys(drifts).forEach(function (grp) {
      var d2 = (driftNew && driftNew[grp] || 0) - (driftOld && driftOld[grp] || 0);
      if (d2) add(grp + ' drift ' + (d2 > 0 ? '+' : '') + round(d2, 2) + '/qtr', groupVal(g, grp, p) * d2 * GROUP_DRIFT_HORIZON, 'g');
    });
    top.sort(function (a, b) { return Math.abs(b.v) - Math.abs(a.v); });
    return { fxPart: fxPart, groupPart: groupPart, top: top.slice(0, 3) };
  }

  function describeScore(verb, name, scored, score) {
    var bits = scored.top.map(function (t) { return t.label + ' (' + (t.v >= 0 ? '+' : '') + round(t.v, 1) + ')'; });
    return verb + ' ' + name + ': ' + (bits.join(', ') || 'no material effect') + ' → score ' + round(score, 2);
  }

  /* ---- upkeep reserve (requirement 2e) ----
     The ENGINE auto-pays upkeep at advanceTurn when PC covers it; the persona's
     lever is whether to keep enough PC in reserve so valued Acts never stall.
     Every persona reserves the upkeep of Acts it values positively, EXCEPT the
     Machiavelli-style stall calculus: with dark aptitude high, it reserves only
     (1 − darkApt) of upkeep — a stalled welfare Act quietly stops costing PC
     and its service effects pause, which a power-maximiser is happy to let
     happen (documented stall calculus: upkeep of low-value Acts is not worth
     PC that could fund campaigns/misinfo). */
  function upkeepReserve(g, p) {
    var E = ENGINE();
    var reserve = 0;
    policies().forEach(function (def) {
      var ps = g.pol[def.id];
      if (!ps || !ps.upkeepLeft || !ps.upkeepPer) return;
      // value the Act's settled fx; only reserve for Acts the persona still wants
      var scored = scoreFxDelta(p, g, E.previewPolicyFx(def.id, ps.value), {}, def.kind === 'select' ? optionGroupsOf(def, ps.value) : null, null, null, null);
      if (scored.fxPart + scored.groupPart > 0) reserve += ps.upkeepPer;
    });
    return reserve * (1 - p.weights.dark);
  }
  function optionGroupsOf(def, val) {
    for (var i = 0; i < (def.options || []).length; i++) if (def.options[i].id === val) return def.options[i].groups || {};
    return {};
  }

  /* ============================================================================
     2) CANDIDATE MOVE GENERATION (feasible only)
     ========================================================================== */
  var ACT_THRESHOLD = 0.4;       // minimum score to spend political capital
  var JITTER_BASE = 0.5;         // seed jitter amplitude scales with risk

  function jitter(p, seed, turn, key) {
    return (detRand('persona|' + seed + '|' + turn + '|' + key) - 0.5) * JITTER_BASE * (0.2 + 0.8 * p.risk);
  }

  function policyById(id) {
    var ps = policies();
    for (var i = 0; i < ps.length; i++) if (ps[i].id === id) return ps[i];
    return null;
  }

  /* a) Acts & sliders */
  function actCandidates(g, p, seed, reserve) {
    var E = ENGINE();
    var out = [];
    policies().forEach(function (def) {
      var ps = g.pol[def.id];
      if (!ps) return;
      var cur = ps.value;
      if (def.kind === 'slider') {
        [cur - def.step, cur + def.step].forEach(function (nv) {
          nv = round(clamp(nv, def.min, def.max), 2);
          if (nv === cur) return;
          var cost = E.changeCost(def, cur, nv);
          if (g.pc - reserve < cost) return;
          // engine preview covers the mechanical channels; the slider's small
          // one-time group shifts are engine-internal (sliderGroupDelta is not
          // exported) and are intentionally ignored here (documented).
          var fxN = E.previewPolicyFx(def.id, nv), fxC = E.previewPolicyFx(def.id, cur);
          var scored = scoreFxDelta(p, g, fxN, fxC, null, null, null, null);
          var score = scored.fxPart + scored.groupPart;
          if (def.id === 'tariffs') score += (p.flavor.tariff || 0) * (nv - cur);
          score += jitter(p, seed, g.turn, 'slider:' + def.id + ':' + nv);
          out.push({
            kind: 'slider', id: def.id, from: cur, to: nv, cost: cost, score: score,
            reason: describeScore((nv > cur ? 'raise' : 'cut') + ' slider', def.name + ' → ' + nv + (def.unit || ''), scored, score)
          });
        });
        return;
      }
      (def.options || []).forEach(function (opt) {
        if (opt.id === cur) return;
        var cost = E.changeCost(def, cur, opt.id);
        if (g.pc - reserve < cost) return;
        var fxN = E.previewPolicyFx(def.id, opt.id), fxC = E.previewPolicyFx(def.id, cur);
        var scored = scoreFxDelta(p, g, fxN, fxC, opt.groups || {}, optionGroupsOf(def, cur), (opt.fx || {}).groupDrift, null);
        // upkeep liability: perTurn × turns (capped horizon) priced in PC.
        // Dark-apt personas hoard PC for campaigns/misinfo, so upkeep drains
        // count (1 + 2.2×darkApt) against an Act — Machiavelli effectively
        // refuses long upkeep tails (part of the documented stall calculus).
        var up = opt.upkeep || null;
        var upkeepCost = up ? up.perTurn * Math.min(up.turns, 8) * pcValue(p) * 0.6 * (1 + 2.2 * p.weights.dark) : 0;
        // risk discount: uncertain terms (radical flags like rentban, long lags
        // > 4 turns, unvetted custom Acts) are charged (1 − risk) × |fxPart|
        var lag = opt.lag || def.lag || 1;
        var uncertain = !!((opt.fx || {}).rentban) || lag > 4 || def.id.indexOf('custom_') === 0;
        var fxVal = scored.fxPart - (uncertain ? (1 - p.risk) * Math.abs(scored.fxPart) : 0);
        var score = scored.groupPart + fxVal - upkeepCost + jitter(p, seed, g.turn, 'act:' + def.id + ':' + opt.id);
        var label = def.name + ' → ' + opt.label;
        out.push({
          kind: 'act', id: def.id, from: cur, to: opt.id, cost: cost, score: score,
          reason: describeScore('enact', label, scored, score) +
            (up ? ' · upkeep ' + up.perTurn + ' PC×' + up.turns + ' (−' + round(upkeepCost, 1) + ')' : '') +
            (uncertain ? ' · risky: fx ×' + round(1 - (1 - p.risk), 2) + ' confidence' : '')
        });
      });
    });
    return out;
  }

  /* b) budget moves: ±10% steps, persona-flavoured line affinities */
  function budgetCandidates(g, p, seed, reserve, excludeCat) {
    var E = ENGINE();
    var out = [];
    var bias = p.flavor.budget || {};
    BUDGET().forEach(function (c) {
      if (c.locked || c.id === excludeCat) return;
      var old = E.catMult(g, c);
      [-0.1, 0.1].forEach(function (d) {
        var nv = round(old + d, 1);
        if (nv < 0.1 || nv > 2 || nv === old) return;
        var cost = 2; // engine: 2 PC per 10% step (cut discounts only make it cheaper)
        if (g.pc - reserve < cost) return;
        var fxN = E.previewBudgetFx(c.id, nv), fxO = E.previewBudgetFx(c.id, old);
        var dev = (nv - old) * 10; // +10% units, for the line's group drift
        var scored = scoreFxDelta(p, g, fxN, fxO, null, null, c.fx && c.fx.groups ? scaleObj(c.fx.groups, dev) : null, null);
        var score = scored.fxPart + scored.groupPart + (bias[c.id] || 0) * (d > 0 ? 1 : -1) * 1.0;
        score += jitter(p, seed, g.turn, 'budget:' + c.id + ':' + nv);
        out.push({
          kind: 'budget', cat: c.id, from: old, to: nv, cost: cost, score: score,
          reason: describeScore(d > 0 ? 'raise budget' : 'cut budget', c.name + ' → ' + Math.round(nv * 100) + '%', scored, score) +
            (bias[c.id] ? ' · persona line bias ' + (bias[c.id] * (d > 0 ? 1 : -1) > 0 ? '+' : '') + round(bias[c.id] * (d > 0 ? 1 : -1), 1) : '')
        });
      });
    });
    return out;
  }
  function scaleObj(o, k) { var r = {}; Object.keys(o).forEach(function (x) { r[x] = o[x] * k; }); return r; }

  /* c) dark tactics */
  function lobbyDecision(g, p, offer) {
    // accept when ethics × (need for PC/funds) exceeds the declining cost.
    var w = p.weights;
    var E = ENGINE();
    var cap = E.pcStats(g).cap;
    var fundsCap = 100;
    var sc = SCENARIOS()[g.scenario];
    if (sc && sc.start && sc.start.funds) fundsCap = sc.start.funds;
    var pcNeed = 1 - clamp(g.pc / Math.max(1, cap), 0, 1);
    var fundsNeed = 1 - clamp(g.funds / fundsCap, 0, 1);
    var gain = w.party * ((offer.funds / 25) * (0.5 + fundsNeed) + (offer.pc / 15) * (0.5 + pcNeed));
    var harm = 0, parts = [];
    Object.keys(offer.groups || {}).forEach(function (grp) {
      var v = groupVal(g, grp, p) * offer.groups[grp] * ONE_TIME_GROUP_DISCOUNT;
      harm += v; if (v) parts.push(grp + ' ' + offer.groups[grp]);
    });
    Object.keys(offer.det || {}).forEach(function (d) {
      harm += detVal(p, d) * offer.det[d] * offer.turns;
    });
    harm += channelValues(p).inflation * (offer.inflation || 0) * offer.turns;
    harm -= (1 - p.ethics) * 1.5; // corruption aversion, per deal (+0.3 ledger)
    // harm is ≤ 0 mostly; an unethical persona shrugs off political fallout
    var gate = 0.25 + w.dark;
    var score = gain * gate + harm * (1 - 0.6 * w.dark);
    return { accept: score > 0, score: score, gain: gain, harm: harm,
      reason: (score > 0 ? 'accepted' : 'declined') + ' ' + offer.industry + ' offer: gain $' + offer.funds + 'M/+' + offer.pc + ' PC ×darkGate ' + round(gate, 2) +
        ' (+' + round(gain * gate, 1) + ') vs fallout ' + (parts.join(', ') || 'none') + ' + ' + (offer.terms || '') + ' (' + round(harm * (1 - 0.6 * w.dark), 1) + ') → ' + round(score, 2) };
  }
  function misinfoDecision(g, p) {
    // run when win is high AND (election within 6 turns OR approval sagging);
    // target the weighted-pivotal bloc (heaviest weight × furthest below par).
    var E = ENGINE();
    var w = p.weights;
    var darkish = p.win * (0.5 + 0.5 * p.ethics) >= 0.5;
    if (!darkish) return null;
    if (g.pc < E.MISINFO.pc || g.funds < E.MISINFO.funds) return null;
    var t2e = turnsToElection(g);
    var wAppr = E.weightedApproval(g);
    var bar = approvalBar(g);
    var sagging = wAppr < bar - 1;
    var electionNear = t2e <= 6;
    if (!electionNear && !sagging) return null;
    var heat = E.misinfoHeat(g);
    var desperate = electionNear && t2e <= 2 && sagging && p.risk > 0.8;
    if (heat.level === 'high' && !desperate) return null; // scandal too close — unless desperate
    var target = 'national', best = 0;
    E.GROUP_IDS.forEach(function (grp) {
      var pivot = (VG().weights[grp] || 10) * clamp(52 - g.approval[grp], 0, 30);
      if (pivot > best) { best = pivot; target = grp; }
    });
    return { target: target, heat: heat.level,
      reason: 'ran misinfo on ' + (target === 'national' ? 'a national blast' : 'the ' + ((VG().labels || {})[target] || target) + ' bloc') +
        ': win ' + p.win + ' × ethics ' + p.ethics + ', ' + (electionNear ? 'election in ' + t2e + ' turn' + (t2e === 1 ? '' : 's') : 'approval ' + round(wAppr, 1) + '% < bar ' + round(bar, 1) + '%') +
        ' · heat ' + heat.level + (desperate ? ' (desperate push — scandal risk accepted)' : '') };
  }

  /* d) event responses */
  function eventDecision(g, p, ev) {
    var E = ENGINE();
    var cfg = E.findEventConfig(g, ev.id);
    if (!cfg) return null;
    function outcomeVal(o) {
      var v = 0;
      Object.keys((o && o.groups) || {}).forEach(function (grp) { v += groupVal(g, grp, p) * o.groups[grp] * ONE_TIME_GROUP_DISCOUNT; });
      v += (o && o.sentiment || 0) * (0.45 * p.weights.party + 0.15 * p.weights.welfare);
      v += (o && o.legitimacy || 0) * (0.7 * p.weights.party + 0.4 * p.weights.nation);
      return v;
    }
    var ncV = outcomeVal(cfg.noComment || { groups: {} });
    var best = null, bestV = -Infinity;
    (cfg.options || []).forEach(function (o) {
      if (o.pc && g.pc < o.pc) return;
      var v = outcomeVal(o) - (o.pc ? o.pc * pcValue(p) : 0);
      if (v > bestV) { bestV = v; best = o; }
    });
    if (best && bestV > ncV && bestV > 0) {
      return { option: best, value: bestV,
        reason: 'responded to ' + cfg.title + ' with "' + best.label + '" (score ' + round(bestV, 1) + ' vs silence ' + round(ncV, 1) + ')' };
    }
    return { option: null, value: ncV,
      reason: 'no comment on ' + cfg.title + ': every option scored ≤ silence (best ' + round(bestV, 1) + ' vs ' + round(ncV, 1) + ')' };
  }

  /* full scored candidate list for a turn (exported for tests/UI) */
  function candidateMoves(g, persona, seed, ctx) {
    var p = resolvePersona(persona);
    scoreFxDelta._ctx = ctx || null;
    var reserve = upkeepReserve(g, p);
    var acts = actCandidates(g, p, seed || '0', reserve);
    var budget = budgetCandidates(g, p, seed || '0', reserve, null);
    var list = acts.concat(budget).sort(function (a, b) { return b.score - a.score; });
    return { list: list, acts: acts, budget: budget, reserve: reserve };
  }

  /* ============================================================================
     3) DRIVER
     ========================================================================== */
  var METRIC_KEYS = ['gdp_level', 'gdp_nominal', 'growth', 'unemployment', 'debt_gdp', 'deficit_bn',
    'revenue_bn', 'outlays_bn', 'inflation', 'med_income', 'homelessness', 'overdoses',
    'incarcerated', 'sentiment', 'legitimacy', 'pc', 'funds'];

  function snapshot(g) {
    var E = ENGINE();
    var pw = E.computePower(g);
    var out = { turn: g.turn, over: g.over, overReason: g.overReason, won: g.won };
    METRIC_KEYS.forEach(function (k) { out[k] = g[k]; });
    out.S = pw.S;
    out.stage = E.phaseOf(pw.S).name;
    out.weightedApproval = E.weightedApproval(g);
    out.approval = Object.assign({}, g.approval);
    out.det = Object.assign({}, g.det);
    out.party = { house: g.party.house, senate: g.party.senate, governors: g.party.governors, president: g.party.president };
    out.elections = g.elections.map(function (e) { return Object.assign({}, e); });
    out.dark = {
      misinfoCampaigns: g.misinfo.count, scandals: g.misinfo.scandals.length, exposure: g.misinfo.exposure,
      lobbyDeals: g.lobby.deals.length, lobbyDeclined: g.lobby.declined, corruption: g.lobby.corruption,
      moneyTaken: g.lobby.moneyTaken, pcTaken: g.lobby.pcTaken
    };
    // READ-ONLY reporting fields (WS-N3/N4 nightly calibration): expose the
    // engine's own overdose-cap anchor so reports can cross-check rule (d)
    // against MATH_AND_LOGIC.md without re-deriving engine state. No mechanics.
    out.odAnchor = g.odAnchor ? { level: g.odAnchor.level, opt: g.odAnchor.opt } : null;
    out.odCap = typeof E.odCap === 'function' ? E.odCap(g) : 0;
    return out;
  }

  /* the no-op baseline driver: passes every turn, declines every lobby offer,
     ignores events (the engine auto-resolves them as "no comment" on advance).
     With scenarioId falsy this reproduces test.js's baseline regression
     bit-for-bit (createGame() + advanceTurn × N). */
  function runBaseline(scenarioId, turns, mode) {
    var E = ENGINE();
    var g = E.createGame(scenarioId || undefined, mode);
    var strack = [];
    while (!g.over && g.turn < turns) {
      (g.lobby.offers || []).slice().forEach(function (o) { E.declineLobby(g, o.id); });
      E.advanceTurn(g);
      strack.push(E.computePower(g).S);
    }
    return { endState: snapshot(g), S: strack };
  }

  function applyCandidate(g, c) {
    var E = ENGINE();
    if (c.kind === 'budget') return E.applyBudget(g, c.cat, c.to);
    return E.applyPolicy(g, c.id, c.to);
  }

  function takeTurn(g, p, seed, ctx, trace) {
    var E = ENGINE();
    scoreFxDelta._ctx = ctx;

    // (d) events first — the statement window closes when the turn advances
    (g.pendingEvents || []).slice().forEach(function (ev) {
      var dec = eventDecision(g, p, ev);
      if (!dec) return;
      if (dec.option) {
        var r = E.respondToEvent(g, ev.id, dec.option.id);
        if (r.ok) trace.push({ turn: g.turn, move: 'event', detail: { event: ev.id, option: dec.option.id }, reason: dec.reason });
      } else {
        // leaving it pending makes the engine auto-resolve "no_comment" on advance
        trace.push({ turn: g.turn, move: 'event', detail: { event: ev.id, option: 'no_comment' }, reason: dec.reason });
      }
    });

    // (c1) lobbying: judge every offer on the table
    E.lobbyStatus(g).offers.forEach(function (offer) {
      var dec = lobbyDecision(g, p, offer);
      var r = dec.accept ? E.acceptLobby(g, offer.id) : E.declineLobby(g, offer.id);
      if (r.ok) trace.push({ turn: g.turn, move: dec.accept ? 'lobby_accept' : 'lobby_decline', detail: { offer: offer.id, industry: offer.industry }, reason: dec.reason });
    });

    // (c2) misinformation
    var mis = misinfoDecision(g, p);
    if (mis) {
      var rm = E.runMisinfo(g, mis.target);
      if (rm.ok) trace.push({ turn: g.turn, move: 'misinfo', detail: { target: mis.target, heat: mis.heat }, reason: mis.reason });
    }

    // (a/b) one primary move (best Act/slider/budget); a budget move may be
    // followed by a second ±10% step on a DIFFERENT line (requirement 2b)
    var cands = candidateMoves(g, p, seed, ctx);
    var best = cands.list[0];
    if (best && best.score > ACT_THRESHOLD) {
      var res = applyCandidate(g, best);
      if (res.ok) {
        trace.push({ turn: g.turn, move: best.kind, detail: detailOf(best), reason: best.reason });
        if (best.kind === 'budget') {
          var reserve2 = upkeepReserve(g, p);
          var second = budgetCandidates(g, p, seed, reserve2, best.cat)
            .sort(function (a, b) { return b.score - a.score; })[0];
          if (second && second.score > ACT_THRESHOLD) {
            var res2 = applyCandidate(g, second);
            if (res2.ok) trace.push({ turn: g.turn, move: 'budget', detail: detailOf(second), reason: second.reason + ' · second line of the turn' });
          }
        }
      }
    } else {
      trace.push({
        turn: g.turn, move: 'pass', detail: {},
        reason: 'passed: best available move scored ' + (best ? round(best.score, 2) : 'n/a') + ' ≤ ' + ACT_THRESHOLD +
          (cands.reserve > 0 ? ' (holding ' + round(cands.reserve, 1) + ' PC upkeep reserve)' : '')
      });
    }
  }
  function detailOf(c) {
    if (c.kind === 'budget') return { cat: c.cat, from: c.from, to: c.to, cost: c.cost };
    return { id: c.id, from: c.from, to: c.to, cost: c.cost };
  }

  function actualAt(g) {
    if (g.dualTrack && g.actual) {
      var A = g.actual;
      var out = { turn: A.turn };
      ['gdp_level', 'gdp_nominal', 'unemployment', 'debt_gdp', 'med_income', 'homelessness', 'overdoses', 'incarcerated', 'inflation'].forEach(function (k) { out[k] = A[k]; });
      out.det = Object.assign({}, A.det);
      return out;
    }
    var M = MODES();
    if (g.mode === 'challenge' && g.incumbent && M && typeof M.incumbentAt === 'function') {
      return { turn: g.turn, incumbentApproval: M.incumbentAt(g, g.turn), incumbentLabel: g.incumbent.label };
    }
    return null;
  }

  /* runPersonaGame(scenarioId, persona, seed[, opts]) — plays until scenario
     end (g.over) or 60 turns (opts.turns overrides), fully deterministic. */
  function runPersonaGame(scenarioId, persona, seed, opts) {
    var E = ENGINE();
    opts = opts || {};
    var turns = opts.turns || 60;
    var mode = opts.mode || 'govern';
    var p = resolvePersona(persona);
    seed = String(seed == null ? '0' : seed);
    // the no-op baseline runs FIRST: its S-track is the govern-mode world reference
    var base = runBaseline(scenarioId, turns, mode);
    var ctx = { baselineS: base.S, seed: seed };
    var g = E.createGame(scenarioId || undefined, mode);
    var trace = [];
    // READ-ONLY reporting hook (WS-N3/N4): opts.strack === true records the
    // per-turn power-score track (index = turn, incl. turn 0) plus the no-op
    // baseline track. Pure observation — no effect on mechanics/determinism.
    var strack = opts.strack ? [E.computePower(g).S] : null;
    while (!g.over && g.turn < turns) {
      takeTurn(g, p, seed, ctx, trace);
      E.advanceTurn(g);
      if (strack) strack.push(E.computePower(g).S);
    }
    var result = {
      scenarioId: scenarioId || 'gfc2008',
      personaId: p.id,
      seed: seed,
      turns: g.turn,
      trace: trace,
      endState: snapshot(g),
      baseline: base.endState,
      actual: actualAt(g)
    };
    if (strack) { result.strack = strack; result.baselineS = base.S; }
    return result;
  }

  /* ---- legality re-simulation (used by test xxvii): replay a trace on a
     fresh game; every recorded move must be accepted by the engine at its
     recorded turn, i.e. it was feasible when chosen. ---- */
  function replayTrace(scenarioId, trace, opts) {
    var E = ENGINE();
    opts = opts || {};
    var g = E.createGame(scenarioId || undefined, opts.mode);
    var failures = [];
    trace.forEach(function (e, i) {
      while (!g.over && g.turn < e.turn) E.advanceTurn(g);
      if (g.over) { failures.push('#' + i + ' turn ' + e.turn + ': game already over'); return; }
      var d = e.detail || {}, r = null;
      switch (e.move) {
        case 'pass': return;
        case 'event':
          if (d.option === 'no_comment') {
            var pend = (g.pendingEvents || []).some(function (ev) { return ev.id === d.event; });
            if (!pend) failures.push('#' + i + ' turn ' + e.turn + ': event "' + d.event + '" was not pending for no_comment');
            return;
          }
          r = E.respondToEvent(g, d.event, d.option); break;
        case 'act': case 'slider': r = E.applyPolicy(g, d.id, d.to); break;
        case 'budget': r = E.applyBudget(g, d.cat, d.to); break;
        case 'misinfo': r = E.runMisinfo(g, d.target); break;
        case 'lobby_accept': r = E.acceptLobby(g, d.offer); break;
        case 'lobby_decline': r = E.declineLobby(g, d.offer); break;
        default: failures.push('#' + i + ': unknown move "' + e.move + '"'); return;
      }
      if (r && !r.ok) failures.push('#' + i + ' turn ' + e.turn + ' ' + e.move + ' ' + JSON.stringify(d) + ' ILLEGAL: ' + r.msg);
    });
    return { ok: !failures.length, failures: failures, endState: snapshot(g) };
  }

  /* stable trace hash (FNV-1a hex) for determinism checks */
  function hashTrace(trace) {
    var s = JSON.stringify(trace);
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16);
  }

  /* objective decomposition of an end state (reporting / sanity checks) */
  function scoreState(g, persona, ctx) {
    var E = ENGINE();
    var p = resolvePersona(persona);
    var pw = E.computePower(g);
    var detMean = 0;
    E.DET_IDS.forEach(function (d) { detMean += g.det[d]; });
    detMean /= E.DET_IDS.length;
    var seats = g.party.house / 435 + g.party.senate / 100 + g.party.governors / 50;
    var terms = {
      welfare: -(g.overdoses / 50000) - (g.homelessness / 800) + (g.med_income / 80000) + (g.det.education / 60),
      nation: pw.mean / 60 + g.growth / 3 - (g.debt_gdp - 60) / 60 + pw.S / 60,
      party: E.weightedApproval(g) / 50 + seats + g.pc / 100 + g.funds / 100,
      world: worldGap(g, p, ctx || null)
    };
    var total = 0;
    Object.keys(terms).forEach(function (k) { total += terms[k] * (p.weights[k] || 0); });
    return { terms: terms, weights: p.weights, total: total };
  }

  return {
    version: 1,
    PRESETS: PRESETS,
    presets: Object.keys(PRESETS),
    makePersona: makePersona,
    resolvePersona: resolvePersona,
    channelValues: channelValues,
    candidateMoves: candidateMoves,
    lobbyDecision: lobbyDecision,
    misinfoDecision: misinfoDecision,
    eventDecision: eventDecision,
    upkeepReserve: upkeepReserve,
    runPersonaGame: runPersonaGame,
    runBaseline: runBaseline,
    replayTrace: replayTrace,
    hashTrace: hashTrace,
    snapshot: snapshot,
    scoreState: scoreState,
    ACT_THRESHOLD: ACT_THRESHOLD
  };
});

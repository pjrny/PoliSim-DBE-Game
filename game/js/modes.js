/* ============================================================================
   PoliSim-DBE — modes.js  (v0.6, WS-C)
   Game-mode layer: Govern (single-track, the classic game), Challenge
   (dual-track opposition race against the incumbent party's ACTUAL record),
   Multiplayer (Phase 3 placeholder).

   The Challenge incumbent track is derived ONCE at game start, deterministically,
   by replaying the engine's own per-turn voter-group drift rules
   (engine.js advanceTurn: workers↔unemployment, capitalists↔debt growth,
   seniors↔overdoses, youth↔median income, immigrants↔homelessness,
   technocrats↔power proxy, religious→52 mean reversion) over the scenario's
   ACTUAL metric timeline instead of the player's simulated one:
     gfc2008     — data/history.json annual actuals, linearly interpolated to
                   quarters (turn 4 = Q4 2008 = the 2008 annual value, etc.).
     realign2016 — the scripted ACTUAL/projection rows in js/scenario_2016.js
                   (quarterly, carry-forward for missing fields).
   realign2016 blend choice (documented per the task spec): where the scenario's
   scripted polling exists (SCENARIO_2016.polling — Gallup quarterly approval of
   the party HOLDING THE WHITE HOUSE that quarter: R 2017–2020, D 2021–2024,
   R 2025+), the incumbent track is a 50/50 blend of the model-derived approval
   and that polling number. The model replay alone smooths over real scandals and
   rallies (it only sees macro metrics); the raw polling alone would not extend
   into the 2026+ projection. Averaging keeps both anchors honest.

   Election rules in challenge mode (engine.js consumes these):
     presidential  — win the White House iff your weighted approval ≥ the
                     incumbent track that turn (instead of the 50% bar);
                     winning flips st.mode back to 'govern'.
     midterms      — scored against incumbent − midtermPenalty (stylized −5).
     losing        — never ends the game; only legitimacy collapse (≤15) does.

   No DOM access. Works in browser (window.MODES) and in Node (module.exports).
   ========================================================================== */
(function (root, factory) {
  var M = factory(root);
  root.MODES = M;
  if (typeof module !== 'undefined' && module.exports) module.exports = M;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';

  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function round(x, d) { var m = Math.pow(10, d || 2); return Math.round(x * m) / m; }

  var DET_IDS = ['education', 'innovation', 'competitiveness', 'military', 'trade', 'output', 'fincenter', 'reserve_fx'];

  function VG() { return root.VOTER_GROUPS; }
  function SCENARIOS() { return root.SCENARIOS || {}; }
  var GROUP_IDS = null;
  function groupIds() {
    if (!GROUP_IDS) GROUP_IDS = Object.keys(VG().weights);
    return GROUP_IDS;
  }
  function weightedFrom(appr) {
    var w = VG().weights, sum = 0, ws = 0;
    groupIds().forEach(function (g) { sum += appr[g] * w[g]; ws += w[g]; });
    return sum / ws;
  }

  /* ---- mode catalogue (drives the mode-select cards in ui.js) ---- */
  var LIST = [
    {
      id: 'govern', name: 'Govern', badge: 'SINGLE-TRACK',
      blurb: 'The classic game: you hold office from turn one. Pass Acts, steer the budget, survive the election calendar — weighted approval ≥ 50% keeps the White House.'
    },
    {
      id: 'challenge', name: 'Challenge', badge: 'DUAL-TRACK',
      blurb: 'Play the opposition against the incumbent party\'s ACTUAL record. Outpoll the real timeline turn by turn; beat it at the presidential election to take the White House (then you govern — and own the record).'
    },
    {
      id: 'multiplayer', name: 'Multiplayer', badge: 'COMING SOON', disabled: true,
      reason: 'Coming soon — needs the backend (Phase 3)',
      blurb: 'Two players, one republic: incumbent vs challenger on the same live timeline.'
    }
  ];

  /* Challenge needs an ACTUAL record to derive the incumbent track from.
     gfc2008 + realign2016 have one; dbe2030 is a chained projection — no actuals. */
  function challengeAvailable(scenarioId) {
    if (scenarioId === 'gfc2008' || scenarioId === 'realign2016') return { ok: true };
    return { ok: false, reason: 'No actual record to challenge — this is a projection scenario' };
  }

  /* ---- ACTUAL metric timelines (index = turn) ----
     Row shape: {unemployment, debt_gdp, med_income, homelessness, overdoses, det} */

  // gfc2008: annual HISTORY actuals interpolated to the quarterly clock.
  // Turn t (1..72) → year y = 2008 + floor((t−1)/4), frac = quarter/4 between
  // year y−1 and year y (so turn 4 lands exactly on the 2008 annual value).
  function actualSeriesGFC() {
    var H = root.HISTORY;
    var KEYMAP = {
      unemployment: 'unemployment_pct', debt_gdp: 'debt_to_gdp_pct',
      med_income: 'real_median_hh_income_usd', homelessness: 'homelessness_pit',
      overdoses: 'overdose_deaths'
    };
    function yv(key, y) { return H[KEYMAP[key]][String(y)]; }
    function rowAt(y, frac) {
      var row = {};
      Object.keys(KEYMAP).forEach(function (k) {
        var a = yv(k, y - 1), b = yv(k, y);
        row[k] = a + (b - a) * frac;
      });
      return row;
    }
    var out = [rowAt(2008, 0)]; // turn 0 = 2007 year-end levels (frac 0 of 2007→2008)
    for (var t = 1; t <= 72; t++) {
      var y = 2008 + Math.floor((t - 1) / 4);
      var frac = (((t - 1) % 4) + 1) / 4;
      out.push(rowAt(y, frac));
    }
    // determinants: no actual series exists pre-2016 in the pack — hold the
    // scenario start determinants constant (they only feed the technocrat
    // power-proxy comparison below)
    var det0 = (root.EVENTS && root.EVENTS.start && root.EVENTS.start.determinants) || {};
    out.forEach(function (r) { r.det = det0; });
    return out;
  }

  // realign2016: scripted quarterly ACTUAL/projection rows (turns 1..56),
  // carry-forward for any missing field, turn 0 = scenario start values.
  function actualSeriesRealign() {
    var scr = root.SCENARIO_2016;
    var sc = SCENARIOS().realign2016;
    var s = sc.start;
    var cur = {
      unemployment: s.unemployment, debt_gdp: s.debt_gdp, med_income: s.med_income,
      homelessness: s.homelessness, overdoses: s.overdoses, det: Object.assign({}, s.determinants)
    };
    var out = [Object.assign({}, cur, { det: Object.assign({}, cur.det) })];
    var keys = Object.keys(scr.byTurn).map(Number).sort(function (a, b) { return a - b; });
    keys.forEach(function (t) {
      var rec = scr.byTurn[String(t)];
      ['unemployment', 'debt_gdp', 'med_income', 'homelessness', 'overdoses'].forEach(function (k) {
        if (rec[k] !== undefined) cur[k] = rec[k];
      });
      if (rec.det) DET_IDS.forEach(function (d) { if (rec.det[d] !== undefined) cur.det[d] = rec.det[d]; });
      out[t] = {
        unemployment: cur.unemployment, debt_gdp: cur.debt_gdp, med_income: cur.med_income,
        homelessness: cur.homelessness, overdoses: cur.overdoses, det: Object.assign({}, cur.det)
      };
    });
    return out;
  }

  // which party holds the White House on the real timeline (for the polling blend)
  function incumbentPolling16(t) {
    var P = root.SCENARIO_2016.polling;
    var v = t <= 16 ? P.republican[t] : (t <= 32 ? P.democrat[t] : P.republican[t]);
    return (typeof v === 'number') ? v : null;
  }

  /* ---- the replay: engine approval drift rules over ACTUAL metrics ----
     Mirrors engine.js advanceTurn's voter-group block term-for-term; the only
     stand-in is the technocrat power proxy, computed from actual debt +
     actual/constant determinants + the sentiment the engine formula would
     produce from actual fundamentals. */
  function replayApproval(series, startAppr, pollBlendFn) {
    var appr = Object.assign({}, startAppr);
    var out = [round(weightedFrom(appr), 2)];
    var prevS = null;
    for (var t = 1; t < series.length; t++) {
      var cur = series[t], prev = series[t - 1];
      var dUnemp = cur.unemployment - prev.unemployment;
      var odPct = prev.overdoses > 0 ? (cur.overdoses / prev.overdoses - 1) * 100 : 0;
      var miGrowth = prev.med_income > 0 ? (cur.med_income / prev.med_income - 1) * 100 : 0;
      var hPct = prev.homelessness > 0 ? (cur.homelessness / prev.homelessness - 1) * 100 : 0;
      appr.workers = clamp(appr.workers + clamp(-dUnemp, -1, 1) * 1.5, 0, 100);
      appr.capitalists = clamp(appr.capitalists - 0.25 * Math.max(0, cur.debt_gdp - prev.debt_gdp), 0, 100);
      appr.seniors = clamp(appr.seniors + clamp(-odPct, -1, 1) * 0.8 + 0.05, 0, 100);
      appr.youth = clamp(appr.youth + clamp(miGrowth, -2, 2) * 0.8, 0, 100);
      appr.immigrants = clamp(appr.immigrants + clamp(-hPct, -1, 1) * 0.5, 0, 100);
      // technocrats: Big-Cycle power proxy of the actual track
      var meanAppr = 0;
      groupIds().forEach(function (g) { meanAppr += appr[g]; });
      meanAppr /= groupIds().length;
      var goodwill = clamp((meanAppr - 50) / 5, -6, 6);
      var sent = clamp(30 + 0.3 * (50 - cur.unemployment * 5) + 0.5 * (miGrowth * 4) - 0.3 * hPct + goodwill, 0, 100);
      var det = cur.det, dMean = 0;
      DET_IDS.forEach(function (d) { dMean += (det[d] !== undefined ? det[d] : 60); });
      dMean /= DET_IDS.length;
      var spread = 0, mn = 100, mx = 0;
      groupIds().forEach(function (g) { mn = Math.min(mn, appr[g]); mx = Math.max(mx, appr[g]); });
      spread = mx - mn;
      var conflict = clamp(70 - sent + 0.3 * spread, 0, 100);
      var S = dMean - 0.25 * clamp(cur.debt_gdp - 60, 0, 100) - 0.25 * conflict;
      appr.technocrats = clamp(appr.technocrats + (prevS !== null && S > prevS ? 0.3 : -0.2), 0, 100);
      prevS = S;
      appr.religious = clamp(appr.religious + 0.05 * (52 - appr.religious) / 4, 0, 100);
      var a = weightedFrom(appr);
      // 50/50 blend with scripted incumbent-party polling where it exists
      // (see file header for the rationale)
      var p = pollBlendFn ? pollBlendFn(t) : null;
      if (typeof p === 'number') a = 0.5 * a + 0.5 * p;
      out.push(round(a, 2));
    }
    return out;
  }

  function startApproval(scenarioId) {
    var sc = SCENARIOS()[scenarioId];
    var base = Object.assign({}, VG().initial);
    if (sc && sc.start && sc.start.approval) Object.assign(base, sc.start.approval);
    return base;
  }

  /* compute the incumbent track for a scenario. Returns
     { approvalByTurn: [...] (index = turn), label, source } or null. */
  function computeIncumbent(scenarioId) {
    if (!challengeAvailable(scenarioId).ok) return null;
    if (scenarioId === 'gfc2008') {
      return {
        approvalByTurn: replayApproval(actualSeriesGFC(), startApproval(scenarioId), null),
        label: 'Bush→Obama record',
        source: 'engine approval model replayed over FRED/HUD/CDC actuals (data/history.json, annual → quarterly interpolation)'
      };
    }
    if (scenarioId === 'realign2016') {
      return {
        approvalByTurn: replayApproval(actualSeriesRealign(), startApproval(scenarioId), incumbentPolling16),
        label: 'Trump→Biden record',
        source: 'engine approval model replayed over the scripted ACTUAL track (js/scenario_2016.js), blended 50/50 with scripted Gallup/generic-ballot polling of the party in power'
      };
    }
    return null;
  }

  /* attach challenge state to a fresh game (called by ENGINE.createGame) */
  function startChallenge(st) {
    st.incumbent = computeIncumbent(st.scenario || 'gfc2008');
    st.race = { history: [], overtakes: [], above: null };
    // you start as the opposition: the White House is held by the party of
    // the actual record (your caucus keeps its seats; shadow-party sizing for
    // PC, a dualTrack concept, is untouched)
    if (st.party) st.party.president = false;
    return st;
  }

  function incumbentAt(st, t) {
    var arr = st.incumbent && st.incumbent.approvalByTurn;
    if (!arr || !arr.length) return 50;
    // endless mode: past the actual record, hold the final derived value
    return arr[Math.min(Math.max(0, t), arr.length - 1)];
  }
  function challengeMidtermBar(st, t) {
    var pen = (root.EVENTS && root.EVENTS.midtermPenalty) || 5;
    return incumbentAt(st, t) - pen;
  }

  /* per-turn race bookkeeping (called from engine advanceTurn in challenge
     mode, after the weighted approval for the turn is known) */
  function updateRace(st, appr, items) {
    if (!st.race) st.race = { history: [], overtakes: [], above: null };
    var inc = incumbentAt(st, st.turn);
    var gap = round(appr - inc, 1);
    st.race.history.push({ turn: st.turn, you: round(appr, 1), incumbent: round(inc, 1), gap: gap });
    var above = gap >= 0;
    if (st.race.above === false && above) {
      // once per cross: below → at-or-above
      st.race.overtakes.push(st.turn);
      var msg = '🏁 OVERTAKE — your approval ' + round(appr, 1) + '% passes the ' + st.incumbent.label + ' (' + round(inc, 1) + '%).';
      if (items) items.push(msg);
      st.newsLog.push({ turn: st.turn, lane: 'alert', text: msg });
    }
    st.race.above = above;
  }

  return {
    LIST: LIST,
    challengeAvailable: challengeAvailable,
    computeIncumbent: computeIncumbent,
    startChallenge: startChallenge,
    incumbentAt: incumbentAt,
    challengeMidtermBar: challengeMidtermBar,
    updateRace: updateRace
  };
});

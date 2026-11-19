/* ============================================================================
   PoliSim-DBE — event_queue.js  (WS-D: Event Center)
   Pure presentation model for the non-blocking event queue. No DOM access:
   ui.js turns the model into cards, test.js verifies the contract in node.
   window.EVENT_QUEUE = { model, pruneParked, tierOf, hookOf }
   ========================================================================== */
(function (root) {
  'use strict';

  function tierOf(ev) { return ev && ev.tier === 'major' ? 'major' : 'standard'; }

  /* one-line hook: first sentence of context/headline, hard-capped */
  function hookOf(ev, maxLen) {
    var max = maxLen || 120;
    var src = (ev && (ev.context || ev.headline)) || '';
    var m = src.match(/^[\s\S]*?[.!?](?=\s|$)/);
    var hook = m ? m[0] : src;
    if (hook.length > max) hook = hook.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
    return hook.trim();
  }

  /* pending: array of engine event objects (st.pendingEvents).
     parked: array of event ids the player parked (UI-only state).
     Returns a NEW array, sorted major-first (stable within a tier — the
     engine already orders same-tier events by schedule), each entry:
       { id, title, tier, hook, parked }                                  */
  function model(pending, parked) {
    var parkedIds = parked || [];
    return (pending || []).slice().sort(function (a, b) {
      return (tierOf(a) === 'major' ? 0 : 1) - (tierOf(b) === 'major' ? 0 : 1);
    }).map(function (ev) {
      return {
        id: ev.id,
        title: ev.title || ev.id,
        tier: tierOf(ev),
        hook: hookOf(ev),
        parked: parkedIds.indexOf(ev.id) >= 0
      };
    });
  }

  /* drop parked ids that are no longer pending (resolved or expired) */
  function pruneParked(parked, pending) {
    var alive = {};
    (pending || []).forEach(function (ev) { alive[ev.id] = true; });
    return (parked || []).filter(function (id) { return !!alive[id]; });
  }

  root.EVENT_QUEUE = { model: model, pruneParked: pruneParked, tierOf: tierOf, hookOf: hookOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.EVENT_QUEUE; // test.js block (xxiii)
})(typeof window !== 'undefined' ? window : this);

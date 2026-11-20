/* ============================================================================
   PoliSim-DBE — profiles.js  (v0.6, WS-B)
   Player profiles: a lightweight LOCAL login + per-profile settings. This is
   the foundation that becomes real accounts when the multiplayer backend
   lands. Until then everything lives in localStorage under "polisim_profiles".

   SECURITY NOTE: the password "hash" is a plain FNV-1a checksum kept in
   localStorage — a convenience gate, NOT security. This repo is public, the
   hashes are readable by anyone with DevTools, and the gate protects nothing
   sensitive. Do not reuse a real password here.

   ADMIN PROFILE: an "admin" profile is seeded on first load with the password
   "XXX" (yes, publicly visible right here — intentionally; it is a convenience
   gate until backend auth exists). Admin unlocks ALL settings options and gets
   full settings on load (every setting at its most permissive/enabled value).

   No engine/balance changes: settings only gate UI affordances and the world-
   event popup cap. UMD like act_studio.js: window.PROFILES in the browser,
   module.exports in Node for test.js block (xxii).
   ========================================================================== */
(function (root, factory) {
  var P = factory(root);
  root.PROFILES = P;
  if (typeof module !== 'undefined' && module.exports) module.exports = root.PROFILES;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';

  var STORAGE_KEY = 'polisim_profiles';       // { <name>: { passHash, created, settings, lastGame? } }
  var SESSION_KEY = 'polisim_current_profile'; // last active profile name (auto-detected at boot)

  /* ---- per-profile settings schema ---- */
  var SETTING_DEFS = [
    { key: 'gameSpeed', label: 'Game speed (turn pacing flavor)', opts: [['relaxed', 'Relaxed'], ['standard', 'Standard']] },
    { key: 'complexity', label: 'UI complexity', opts: [['casual', 'Casual'], ['standard', 'Standard'], ['full', 'Full']], adminOpt: 'full' },
    { key: 'defaultScenario', label: 'Default scenario (highlighted at boot)', opts: [['gfc2008', 'Global Financial Crisis 2008'], ['realign2016', 'The Realignment 2016'], ['dbe2030', 'Dimensions Beyond Energy 2030']] },
    { key: 'eventsFreq', label: 'World-event frequency', opts: [['calm', 'Calm (max 1/turn)'], ['normal', 'Normal (all)'], ['frequent', 'Frequent (up to 2 majors)']] },
    { key: 'worldChart', label: 'World Big-Cycle chart (Network tab)', opts: [['on', 'On'], ['off', 'Off']] },
    { key: 'reduceMotion', label: 'Reduce motion (no pulse / marquee)', type: 'bool' }
  ];
  var DEFAULTS = { gameSpeed: 'standard', complexity: 'standard', defaultScenario: 'gfc2008', eventsFreq: 'normal', worldChart: 'on', reduceMotion: false };
  // Admin: "full settings on load" — every setting at its most permissive/enabled value.
  var ADMIN_DEFAULTS = { gameSpeed: 'relaxed', complexity: 'full', defaultScenario: 'gfc2008', eventsFreq: 'frequent', worldChart: 'on', reduceMotion: false };

  var currentName = null;          // null = Guest
  var guestSettings = clone(DEFAULTS); // Guest: standard everything, in-memory only (never persisted)

  function clone(o) { var c = {}; Object.keys(o).forEach(function (k) { c[k] = o[k]; }); return c; }

  /* ---- storage (localStorage; no-op outside the browser / file:// fallback) ---- */
  function store() {
    try {
      if (root.localStorage) return root.localStorage;
      if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
    } catch (e) { /* file:// or privacy mode */ }
    return null;
  }
  function loadAll() {
    var ls = store();
    if (!ls) return {};
    try {
      var m = JSON.parse(ls.getItem(STORAGE_KEY) || '{}');
      return (m && typeof m === 'object' && !Array.isArray(m)) ? m : {};
    } catch (e) { return {}; }
  }
  function saveAll(map) {
    var ls = store();
    if (!ls) return false;
    try { ls.setItem(STORAGE_KEY, JSON.stringify(map)); return true; } catch (e) { return false; }
  }

  /* ---- FNV-1a 32-bit hash (convenience gate, NOT security — see header) ---- */
  function fnv1a(str) {
    str = String(str == null ? '' : str);
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0; // ×16777619 mod 2^32
    }
    return ('0000000' + h.toString(16)).slice(-8);
  }

  /* Seed the admin profile on first load. Password "XXX" is deliberately
     visible here: a convenience gate until backend auth lands. */
  function ensureAdmin() {
    var map = loadAll();
    if (!map.admin) {
      map.admin = { passHash: fnv1a('XXX'), created: Date.now(), settings: clone(ADMIN_DEFAULTS) };
      saveAll(map);
    } else if (!map.admin.settings) {
      map.admin.settings = clone(ADMIN_DEFAULTS);
      saveAll(map);
    }
  }

  function validName(name) {
    return typeof name === 'string' && /^[\w][\w .-]{0,19}$/.test(name.trim());
  }
  function settingDef(key) {
    for (var i = 0; i < SETTING_DEFS.length; i++) if (SETTING_DEFS[i].key === key) return SETTING_DEFS[i];
    return null;
  }

  /* ---------------- public API ---------------- */
  function list() { ensureAdmin(); return Object.keys(loadAll()).sort(); }
  function current() { return currentName || 'Guest'; }
  function isAdmin() { return currentName === 'admin'; }

  function settings() {
    if (!currentName) return clone(guestSettings);
    var base = (currentName === 'admin') ? clone(ADMIN_DEFAULTS) : clone(DEFAULTS);
    var p = loadAll()[currentName];
    if (p && p.settings) Object.keys(p.settings).forEach(function (k) { if (k in base) base[k] = p.settings[k]; });
    return base;
  }

  /* Set one setting, apply it live, persist (named profiles only). Returns
     true when the value was accepted. Non-admins cannot pick admin-only
     options (e.g. complexity "full"). */
  function set(key, val) {
    var def = settingDef(key);
    if (!def) return false;
    if (def.type === 'bool') val = !!val;
    else {
      var ok = false;
      def.opts.forEach(function (o) { if (o[0] === val) ok = true; });
      if (!ok) return false;
      if (def.adminOpt === val && !isAdmin()) return false; // admin-only option
    }
    if (!currentName) { guestSettings[key] = val; } // session-only
    else {
      var map = loadAll();
      if (!map[currentName]) return false;
      if (!map[currentName].settings) map[currentName].settings = clone(currentName === 'admin' ? ADMIN_DEFAULTS : DEFAULTS);
      map[currentName].settings[key] = val;
      saveAll(map);
    }
    applyVisualPrefs();
    refreshBar();
    if (root.POLISIM && typeof root.POLISIM.render === 'function') root.POLISIM.render(); // live re-render
    return true;
  }

  function create(name, pass) {
    name = String(name || '').trim();
    if (!validName(name)) return { ok: false, msg: 'Name must be 1–20 chars: letters, digits, space, . _ -' };
    var map = loadAll();
    if (map[name]) return { ok: false, msg: 'A profile named "' + name + '" already exists — use Switch / log in.' };
    map[name] = { passHash: pass ? fnv1a(pass) : '', created: Date.now(), settings: clone(DEFAULTS) };
    if (!saveAll(map)) return { ok: false, msg: 'Could not write localStorage (private mode?).' };
    login(name, pass);
    return { ok: true, msg: 'Profile "' + name + '" created.' + (pass ? '' : ' (no password — open profile)') };
  }

  function login(name, pass) {
    name = String(name || '').trim();
    ensureAdmin();
    var p = loadAll()[name];
    if (!p) return { ok: false, msg: 'No profile named "' + name + '".' };
    if (p.passHash && p.passHash !== fnv1a(pass || '')) return { ok: false, msg: 'Wrong password for "' + name + '".' };
    currentName = name;
    var ls = store();
    if (ls) { try { ls.setItem(SESSION_KEY, name); } catch (e) {} }
    applyVisualPrefs();
    refreshBar();
    if (root.POLISIM && typeof root.POLISIM.render === 'function') root.POLISIM.render();
    return { ok: true, msg: 'Signed in as ' + name + '.' };
  }

  function logout() { // "Continue as Guest"
    currentName = null;
    var ls = store();
    if (ls) { try { ls.removeItem(SESSION_KEY); } catch (e) {} }
    applyVisualPrefs();
    refreshBar();
    if (root.POLISIM && typeof root.POLISIM.render === 'function') root.POLISIM.render();
    return { ok: true, msg: 'Continuing as Guest — settings last for this session only.' };
  }

  /* eventsFreq → world-event popup cap per eligible turn (consumed by
     engine.collectRealworldEvents): calm = 1 · frequent = 2 · normal = all. */
  function eventCap() {
    var f = settings().eventsFreq;
    if (f === 'calm') return 1;
    if (f === 'frequent') return 2;
    return Infinity;
  }

  /* Body classes that drive the settings-related CSS in style.css. */
  function applyVisualPrefs() {
    if (typeof document === 'undefined' || !document.body || !document.body.classList) return;
    var s = settings(), cl = document.body.classList;
    cl.toggle('complexity-casual', s.complexity === 'casual');
    cl.toggle('complexity-full', s.complexity === 'full');
    cl.toggle('worldchart-off', s.worldChart === 'off');
    cl.toggle('reduce-motion', !!s.reduceMotion);
  }

  /* Persistence bonus: remember the last in-game turn + scenario per profile
     (throttled — only writes when the turn actually changes). Full game-state
     save/resume is a separate workstream; the modal shows this read-only. */
  function noteGame(scenario, turn) {
    if (!currentName || !scenario) return;
    var map = loadAll(), p = map[currentName];
    if (!p) return;
    if (p.lastGame && p.lastGame.scenario === scenario && p.lastGame.turn === turn) return; // throttle
    p.lastGame = { scenario: scenario, turn: turn, at: Date.now() };
    saveAll(map);
  }
  function lastGame() {
    if (!currentName) return null;
    var p = loadAll()[currentName];
    return (p && p.lastGame) ? p.lastGame : null;
  }

  /* ============================================================================
     BROWSER UI — profile bar in the header + #profile-modal. Skipped in Node.
     ========================================================================== */
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(msg, bad) { // same pattern as ui.js, but profiles.js loads first so we drive #toast directly
    var t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.background = bad ? '#b91c1c' : '#1c1917';
    t.classList.remove('hidden');
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.add('hidden'); }, 3200);
  }

  function refreshBar() {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
    var lab = $('profile-name-label');
    if (lab) {
      lab.textContent = (isAdmin() ? '👑 admin' : '👤 ' + current());
      lab.title = isAdmin() ? 'Admin profile — all settings unlocked' : 'Active profile (settings are per-profile)';
    }
  }

  function buildBar() {
    var slot = $('profile-slot');
    if (!slot || $('profile-bar')) return;
    var bar = document.createElement('span');
    bar.id = 'profile-bar';
    bar.innerHTML =
      '<span id="profile-name-label" class="badge bg-stone-700">👤 Guest</span>' +
      '<button id="profile-settings-btn" title="Profile settings">⚙</button>' +
      '<button id="profile-switch-btn">Switch / create</button>';
    slot.appendChild(bar);
    $('profile-settings-btn').addEventListener('click', function () { openModal(true); });
    $('profile-switch-btn').addEventListener('click', function () { openModal(false); });
  }

  function settingsHtml() {
    var s = settings(), html = '';
    SETTING_DEFS.forEach(function (d) {
      html += '<label class="profile-set-row"><span>' + d.label + '</span>';
      if (d.type === 'bool') {
        html += '<input type="checkbox" id="set-' + d.key + '"' + (s[d.key] ? ' checked' : '') + '>';
      } else {
        html += '<select id="set-' + d.key + '" class="text-xs border border-stone-300 rounded px-2 py-1 bg-stone-50">';
        d.opts.forEach(function (o) {
          var dis = (d.adminOpt === o[0] && !isAdmin()) ? ' disabled' : '';
          var lock = (d.adminOpt === o[0] && !isAdmin()) ? ' 🔒 admin' : '';
          html += '<option value="' + o[0] + '"' + (s[d.key] === o[0] ? ' selected' : '') + dis + '>' + esc(o[1]) + lock + '</option>';
        });
        html += '</select>';
      }
      html += '</label>';
    });
    return html;
  }

  function buildModal() {
    if ($('profile-modal')) return;
    var host = document.querySelector('main') || document.body; // inside <main> so btn-ghost gets the light-modal styling
    var m = document.createElement('div');
    m.id = 'profile-modal';
    m.className = 'hidden fixed inset-0 z-50 bg-stone-900/70 flex items-center justify-center p-4';
    m.innerHTML =
      '<div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true">' +
      '  <div class="flex items-start justify-between mb-1">' +
      '    <span class="text-[11px] font-bold uppercase tracking-widest text-teal-700">👤 Player profile</span>' +
      '    <button id="profile-close" class="text-stone-400 hover:text-stone-700 text-lg leading-none">✕</button>' +
      '  </div>' +
      '  <h2 class="text-xl font-bold mb-1">Profiles &amp; settings</h2>' +
      '  <p class="text-[11px] text-stone-500 mb-3">Local-only profiles (stored in this browser). The password is a convenience gate, <b>not</b> security — this becomes a real account when the multiplayer backend lands.</p>' +
      '  <p id="profile-resume" class="hidden text-[11px] bg-teal-50 border border-teal-200 rounded px-2 py-1 mb-3 text-teal-900"></p>' +
      '  <div id="profile-chips" class="flex flex-wrap gap-1 mb-2"></div>' +
      '  <div class="grid grid-cols-2 gap-2 mb-1">' +
      '    <input id="profile-name" type="text" maxlength="20" class="text-xs border border-stone-300 rounded px-2 py-1.5" placeholder="profile name">' +
      '    <input id="profile-pass" type="password" class="text-xs border border-stone-300 rounded px-2 py-1.5" placeholder="password (optional)">' +
      '  </div>' +
      '  <p id="profile-err" class="hidden text-[11px] text-red-700 mb-1"></p>' +
      '  <div class="flex flex-wrap gap-2 mb-4 mt-2">' +
      '    <button id="profile-create" class="btn-primary !text-xs">Create profile</button>' +
      '    <button id="profile-switch" class="btn-ghost border border-stone-300 !text-xs">Switch / log in</button>' +
      '    <button id="profile-guest" class="btn-ghost border border-stone-300 !text-xs">Continue as Guest</button>' +
      '  </div>' +
      '  <h3 class="card-title-sm">Settings <span id="profile-admin-note" class="text-[10px] font-normal text-amber-700"></span></h3>' +
      '  <div id="profile-settings" class="space-y-2"></div>' +
      '  <p class="text-[10px] text-stone-400 mt-3">Guest: standard settings, kept for this session only. Named profiles persist settings in localStorage.</p>' +
      '</div>';
    host.appendChild(m);

    $('profile-close').addEventListener('click', closeModal);
    m.addEventListener('click', function (ev) { if (ev.target === m) closeModal(); });

    function err(msg) {
      var e = $('profile-err');
      if (msg) { e.textContent = msg; e.classList.remove('hidden'); }
      else e.classList.add('hidden');
    }
    function finish(res) {
      if (!res.ok) { err(res.msg); return; }
      err('');
      toast(res.msg);
      closeModal();
    }
    $('profile-create').addEventListener('click', function () { finish(create($('profile-name').value, $('profile-pass').value)); });
    $('profile-switch').addEventListener('click', function () { finish(login($('profile-name').value, $('profile-pass').value)); });
    $('profile-guest').addEventListener('click', function () { finish(logout()); });

    // settings apply live on change
    SETTING_DEFS.forEach(function (d) {
      var inp = $('set-' + d.key);
      if (!inp) return;
      inp.addEventListener('change', function () {
        var v = (d.type === 'bool') ? inp.checked : inp.value;
        if (!set(d.key, v)) { toast('That option needs the admin profile.', true); refreshSettings(); }
      });
    });
  }

  function refreshSettings() {
    var box = $('profile-settings');
    if (!box) return;
    box.innerHTML = settingsHtml();
    // re-wire after innerHTML rebuild
    SETTING_DEFS.forEach(function (d) {
      var inp = $('set-' + d.key);
      if (!inp) return;
      inp.addEventListener('change', function () {
        var v = (d.type === 'bool') ? inp.checked : inp.value;
        if (!set(d.key, v)) { toast('That option needs the admin profile.', true); refreshSettings(); }
      });
    });
    var an = $('profile-admin-note');
    if (an) an.textContent = isAdmin() ? '— admin: all options unlocked' : (currentName ? '' : '(Guest — session only)');
  }

  function openModal(focusSettings) {
    ensureAdmin();
    buildModal();
    refreshSettings();
    // existing profiles as quick-pick chips
    var chips = $('profile-chips');
    chips.innerHTML = '';
    list().forEach(function (n) {
      var b = document.createElement('button');
      b.className = 'profile-chip' + (n === currentName ? ' on' : '');
      b.textContent = (n === 'admin' ? '👑 ' : '') + n;
      b.title = 'Click to fill the login form';
      b.addEventListener('click', function () { $('profile-name').value = n; $('profile-pass').value = ''; $('profile-pass').focus(); });
      chips.appendChild(b);
    });
    // persistence bonus: read-only resume note
    var lg = lastGame(), rn = $('profile-resume');
    if (lg) {
      var scName = (root.SCENARIOS && root.SCENARIOS[lg.scenario]) ? root.SCENARIOS[lg.scenario].name : lg.scenario;
      rn.textContent = '▶ Resume: ' + scName + ' — turn ' + lg.turn + ' (full save/resume is a separate workstream; start a New Game to play).';
      rn.classList.remove('hidden');
    } else rn.classList.add('hidden');
    err('');
    $('profile-modal').classList.remove('hidden');
    if (focusSettings && $('set-gameSpeed')) $('set-gameSpeed').focus();
  }
  function err(msg) {
    var e = $('profile-err');
    if (!e) return;
    if (msg) { e.textContent = msg; e.classList.remove('hidden'); }
    else e.classList.add('hidden');
  }
  function closeModal() { var m = $('profile-modal'); if (m) m.classList.add('hidden'); }

  /* ---- boot: auto-detect the last active profile, mount the bar, apply prefs ---- */
  function boot() {
    // real browser only — in Node tests a minimal document mock may exist
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function' || typeof document.createElement !== 'function') return;
    ensureAdmin();
    var ls = store();
    var last = null;
    try { last = ls && ls.getItem(SESSION_KEY); } catch (e) {}
    if (last && loadAll()[last]) currentName = last; // auto-detect; convenience gate, no re-prompt
    buildBar();
    buildModal();
    refreshBar();
    applyVisualPrefs();
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }

  return {
    hash: fnv1a,
    current: current,
    settings: settings,
    set: set,
    isAdmin: isAdmin,
    eventCap: eventCap,
    applyVisualPrefs: applyVisualPrefs,
    list: list,
    create: create,
    login: login,
    logout: logout,
    noteGame: noteGame,
    lastGame: lastGame,
    openModal: openModal,
    SETTING_DEFS: SETTING_DEFS
  };
});

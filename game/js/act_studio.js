/* ============================================================================
   PoliSim-DBE — act_studio.js  (v0.5, WS5)
   "Create your own Act" studio: 6 pre-analyzed templates, a keyword-heuristic
   text pre-fill (NOT an AI analysis — the player calibrates every number), and
   the shared balance formula that prices every custom Act (PC / upkeep / lag).
   No DOM access here; ui.js drives the wizard. Works in Node for tests.
   ========================================================================== */
(function (root, factory) {
  var A = factory(root);
  root.ACT_STUDIO = A;
  if (typeof module !== 'undefined' && module.exports) module.exports = root.ACT_STUDIO;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';

  var POLICIES = root.POLICY_DEFS || [];
  var ACT_CATEGORIES = root.ACT_CATEGORIES || [];

  /* ---- balance formula (documented in MATH_AND_LOGIC.md, "Custom Act studio") ----
     weight  = |demand| + Σ|det|/2 + Σ|groups|/4 + |odPct|/2 + |homelessPct|/2
               + |incarcPct|/2 + |outlay|×0.5
     pc      = clamp(round(6 + 3×weight), 8, 40)
     upkeep  = { perTurn: clamp(round(pc/5), 1, 8), turns: clamp(round(4+weight), 4, 16) }
     lag     = clamp(round(2 + weight/3), 2, 8)                       */
  var CAPS = { demand: 2, det: 1, group: 10, outlay: 4, pct: 2 }; // hard caps on FINAL option values
  var SCALE_MOD = 0.6, SCALE_AMB = 1.2; // Moderate / Ambitious presets scale the base values

  var DET_IDS = ['education', 'innovation', 'competitiveness', 'military', 'trade', 'output', 'fincenter', 'reserve_fx'];
  var GROUP_IDS = ['workers', 'capitalists', 'youth', 'seniors', 'religious', 'immigrants', 'technocrats'];
  var CAT_FALLBACK = ['tax', 'welfare', 'housing', 'education', 'health', 'defense', 'justice', 'democracy'];
  var STORAGE_KEY = 'polisim_custom_acts';

  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function r2(x) { return Math.round(x * 100) / 100; }
  function catIds() { return ACT_CATEGORIES.length ? ACT_CATEGORIES.map(function (c) { return c.id; }) : CAT_FALLBACK; }

  function balanceOf(fx, groups) {
    fx = fx || {}; groups = groups || {};
    var w = Math.abs(fx.demand || 0);
    var det = fx.det || {};
    Object.keys(det).forEach(function (d) { w += Math.abs(det[d] || 0) / 2; });
    Object.keys(groups).forEach(function (g) { w += Math.abs(groups[g] || 0) / 4; });
    w += Math.abs(fx.odPct || 0) / 2 + Math.abs(fx.homelessPct || 0) / 2 + Math.abs(fx.incarcPct || 0) / 2;
    w += Math.abs(fx.outlay || 0) * 0.5;
    var pc = clamp(Math.round(6 + 3 * w), 8, 40);
    return {
      weight: r2(w),
      pc: pc,
      upkeep: { perTurn: clamp(Math.round(pc / 5), 1, 8), turns: clamp(Math.round(4 + w), 4, 16) },
      lag: clamp(Math.round(2 + w / 3), 2, 8)
    };
  }

  /* Scale a base spec ({demand, outlay, odPct, homelessPct, incarcPct, det{}, groups{}})
     by 0.6/1.2, clamp to the hard caps, price it. Zero fields are omitted. */
  function scaleSpec(base, scale) {
    base = base || {};
    var fx = {}, groups = {};
    function putFx(k, v, cap, lo) {
      v = clamp(r2(v), lo === undefined ? -cap : lo, cap);
      if (v) fx[k] = v;
    }
    putFx('demand', (base.demand || 0) * scale, CAPS.demand);
    putFx('outlay', (base.outlay || 0) * scale, CAPS.outlay, 0);
    putFx('odPct', (base.odPct || 0) * scale, CAPS.pct);
    putFx('homelessPct', (base.homelessPct || 0) * scale, CAPS.pct);
    putFx('incarcPct', (base.incarcPct || 0) * scale, CAPS.pct);
    var det = {};
    Object.keys(base.det || {}).forEach(function (d) {
      if (DET_IDS.indexOf(d) < 0) return;
      var v = clamp(r2(base.det[d] * scale), -CAPS.det, CAPS.det);
      if (v) det[d] = v;
    });
    if (Object.keys(det).length) fx.det = det;
    Object.keys(base.groups || {}).forEach(function (g) {
      if (GROUP_IDS.indexOf(g) < 0) return;
      var v = clamp(Math.round(base.groups[g] * scale), -CAPS.group, CAPS.group);
      if (v) groups[g] = v;
    });
    var bal = balanceOf(fx, groups);
    return { fx: fx, groups: groups, pc: bal.pc, upkeep: bal.upkeep, weight: bal.weight, lag: bal.lag };
  }

  function slugify(name) {
    var s = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return (s || 'act').slice(0, 32);
  }
  function idTaken(id) {
    for (var i = 0; i < POLICIES.length; i++) if (POLICIES[i].id === id) return true;
    return false;
  }
  function uniqueId(name) {
    var base = 'custom_' + slugify(name), id = base, n = 2;
    while (idTaken(id)) { id = base + '_' + n; n++; }
    return id;
  }

  /* Assemble a full select-def from a base spec. id is fixed (templates) or
     slug-derived (buildDef). labels: [moderateLabel, ambitiousLabel]. */
  function assembleDef(id, name, cat, desc, cost, expected, sourceNote, base, labels) {
    var mod = scaleSpec(base, SCALE_MOD);
    var amb = scaleSpec(base, SCALE_AMB);
    var lag = clamp(Math.round(2 + amb.weight / 3), 2, 8);
    var def = {
      id: id, name: name, kind: 'select', def: 'off', lag: lag, cat: cat,
      desc: desc, cost: cost, expected: expected,
      custom: true,
      studioBase: JSON.parse(JSON.stringify(base || {})),
      options: [
        { id: 'off', label: 'Not enacted', pc: 0, fx: {}, groups: {} },
        { id: 'moderate', label: labels[0], pc: mod.pc, upkeep: mod.upkeep, fx: mod.fx, groups: mod.groups },
        { id: 'ambitious', label: labels[1], pc: amb.pc, upkeep: amb.upkeep, fx: amb.fx, groups: amb.groups }
      ]
    };
    if (sourceNote) def.sourceNote = sourceNote;
    return def;
  }

  function autoCost(base) {
    var mod = scaleSpec(base, SCALE_MOD), amb = scaleSpec(base, SCALE_AMB);
    return 'Custom Act — priced by the studio balance formula: Moderate ' + mod.pc + ' PC (upkeep ' + mod.upkeep.perTurn +
      '/turn × ' + mod.upkeep.turns + '), Ambitious ' + amb.pc + ' PC (upkeep ' + amb.upkeep.perTurn + '/turn × ' + amb.upkeep.turns +
      '); outlays ' + r2((base.outlay || 0) * SCALE_MOD) + '–' + r2((base.outlay || 0) * SCALE_AMB) + '% of GDP.';
  }
  function autoExpected(base) {
    var bits = [];
    if (base.demand) bits.push('demand ' + (base.demand > 0 ? '+' : '') + r2(base.demand * SCALE_MOD) + '…' + (base.demand > 0 ? '+' : '') + r2(base.demand * SCALE_AMB) + ' pp');
    Object.keys(base.det || {}).forEach(function (d) { bits.push(d + ' ' + (base.det[d] > 0 ? '+' : '') + r2(base.det[d] * SCALE_AMB) + '/turn (ambitious)'); });
    if (base.odPct) bits.push('overdoses ' + r2(base.odPct * SCALE_AMB) + '%/turn');
    if (base.homelessPct) bits.push('homelessness ' + r2(base.homelessPct * SCALE_AMB) + '%/turn');
    if (base.incarcPct) bits.push('incarceration ' + r2(base.incarcPct * SCALE_AMB) + '%/turn');
    return 'Primary: ' + (bits.join('; ') || 'no direct effect channels set') + '. Secondary: voter-group shifts as configured. Effects ramp linearly over the lag.';
  }

  /* ---- buildDef: validate a studio form and produce a registrable def ----
     formData: { name, cat, desc, sourceNote?, demand, outlay, odPct, homelessPct,
                 incarcPct, det:{}, groups:{}, labels? }                       */
  function buildDef(formData) {
    formData = formData || {};
    var name = String(formData.name || '').trim();
    if (!name) return { ok: false, msg: 'Give your Act a name first.' };
    var cat = String(formData.cat || '');
    if (catIds().indexOf(cat) < 0) return { ok: false, msg: 'Pick one of the 8 Act categories.' };
    var groups = formData.groups || {};
    var gk = Object.keys(groups);
    for (var j = 0; j < gk.length; j++) {
      var gv = Number(groups[gk[j]]) || 0;
      if (Math.abs(gv) > CAPS.group) return { ok: false, msg: 'Group effect ' + gk[j] + ' is ' + gv + ' — the cap is ±' + CAPS.group + '.' };
    }
    var base = {
      demand: clamp(Number(formData.demand) || 0, -CAPS.demand, CAPS.demand),
      outlay: clamp(Number(formData.outlay) || 0, 0, CAPS.outlay),
      odPct: clamp(Number(formData.odPct) || 0, -CAPS.pct, CAPS.pct),
      homelessPct: clamp(Number(formData.homelessPct) || 0, -CAPS.pct, CAPS.pct),
      incarcPct: clamp(Number(formData.incarcPct) || 0, -CAPS.pct, CAPS.pct),
      det: {}, groups: {}
    };
    Object.keys(formData.det || {}).forEach(function (d) {
      if (DET_IDS.indexOf(d) < 0) return;
      var v = clamp(r2(Number(formData.det[d]) || 0), -CAPS.det, CAPS.det); // det cap: clamped
      if (v) base.det[d] = v;
    });
    gk.forEach(function (g) {
      if (GROUP_IDS.indexOf(g) < 0) return;
      var v = Math.round(Number(groups[g]) || 0);
      if (v) base.groups[g] = v;
    });
    var desc = String(formData.desc || '').trim() || ('A player-authored Act created in the Act Studio.');
    var cost = String(formData.cost || '').trim() || autoCost(base);
    var expected = String(formData.expected || '').trim() || autoExpected(base);
    var labels = (formData.labels && formData.labels.length === 2) ? formData.labels : ['Moderate version', 'Ambitious version'];
    var def = assembleDef(uniqueId(name), name, cat, desc, cost, expected, formData.sourceNote, base, labels);
    return { ok: true, def: def };
  }

  /* ============================================================================
     TEMPLATES — 6 pre-analyzed Acts ("Kimi-analyzed"). Every option is built by
     the same balance formula the player-facing calibrator uses (scaleSpec).
     ========================================================================== */
  var TEMPLATE_SPECS = [
    {
      id: 'custom_data_dividend', name: 'Data Dividend Act', cat: 'tax',
      labels: ['Pilot: top-20 platforms, ~$500/yr dividend', 'Full: all large platforms, ~$1,200/yr dividend'],
      base: { demand: 0.4, outlay: 0.8, det: { innovation: -0.05 }, groups: { workers: 5, capitalists: -6, technocrats: -3, youth: 3, seniors: 2 } },
      desc: 'An excise on large-scale extraction of user data by platforms above 50M users, rebated as an equal quarterly "data dividend" to every adult citizen.',
      cost: 'Dividend outlay up to +0.96% of GDP (ambitious), largely offset by the data excise; PC priced by the balance formula (see MATH_AND_LOGIC.md).',
      expected: 'Primary: demand +0.24…+0.48 pp from the rebate. Secondary: capitalists & technocrats approval down, workers/youth up; small innovation drag from compliance load. Lag ~4 turns.',
      sourceNote: 'Analyzed from an uploaded research report on data labor and platform rents — effect estimates modeled from the report\'s themes; calibrate before relying on them.'
    },
    {
      id: 'custom_housing_accelerator', name: 'Housing Supply Accelerator', cat: 'housing',
      labels: ['Incentive grants for by-right zoning', 'Federal preemption of exclusionary zoning near transit'],
      base: { demand: 0.3, outlay: 0.3, homelessPct: -0.8, det: { output: 0.15 }, groups: { youth: 5, workers: 3, capitalists: 2, seniors: -3, religious: -1 } },
      desc: 'A federal zoning package: preemption of exclusionary single-family rules near transit, by-right permitting, and grants tied to permitted units.',
      cost: 'Outlays up to +0.36% of GDP (ambitious) for incentive grants; the supply response does the rest.',
      expected: 'Primary: homelessness −0.48…−0.96%/turn while ramping; construction demand +0.18…+0.36 pp. Secondary: output +0.09…+0.18/turn; youth & workers up, incumbent homeowners (seniors) down. Lag ~3 turns.',
      sourceNote: 'Analyzed from a housing-policy white paper on zoning reform and supply elasticities — effect estimates modeled from the paper\'s themes; calibrate before relying on them.'
    },
    {
      id: 'custom_national_service', name: 'National Service Act', cat: 'education',
      labels: ['Voluntary corps with education credits', 'Universal 18-month civilian/military service'],
      base: { demand: 0.1, outlay: 0.6, det: { education: 0.2, military: 0.1 }, groups: { youth: -4, seniors: 3, religious: 2, workers: 2, capitalists: 1, technocrats: 1 } },
      desc: 'An 18-month national service track (civilian or military) for young adults, paid at stipend level and convertible into education credits.',
      cost: 'Outlays up to +0.72% of GDP (ambitious) for stipends, placements and credits.',
      expected: 'Primary: education +0.12…+0.24/turn and military +0.06…+0.12/turn as cohorts cycle through. Secondary: youth resent conscription (−), seniors & religious approve (+). Lag ~3 turns.',
      sourceNote: 'Analyzed from a policy journal article on national-service programs (AmeriCorps, Israeli/Singaporean models) — effect estimates modeled from the article\'s themes; calibrate before relying on them.'
    },
    {
      id: 'custom_carbon_border', name: 'Carbon Border Adjustment', cat: 'tax',
      labels: ['Fee on steel, cement & aluminum only', 'Full WTO-style embedded-carbon schedule'],
      base: { demand: -0.1, det: { competitiveness: 0.1, trade: -0.15 }, groups: { workers: 3, capitalists: -2, technocrats: 3, immigrants: -1 } },
      desc: 'An import fee scaled to embedded carbon, rebated on exports, designed to WTO non-discrimination norms to survive challenge.',
      cost: 'Fee revenue roughly offsets administration (outlay 0); the demand drag is the real price.',
      expected: 'Primary: competitiveness +0.06…+0.12/turn (level playing field for domestic clean industry); trade −0.09…−0.18/turn and demand −0.06…−0.12 pp from frictions. Secondary: workers & technocrats up, capitalists split. Lag ~2 turns.',
      sourceNote: 'Analyzed from a trade-law & climate policy brief on CBAM-style border mechanisms — effect estimates modeled from the brief\'s themes; calibrate before relying on them.'
    },
    {
      id: 'custom_ai_compute_trust', name: 'Sovereign AI Compute Trust', cat: 'defense',
      labels: ['Public research cloud for universities', 'National compute utility + licensing revenue'],
      base: { demand: 0.1, outlay: 0.9, det: { innovation: 0.35, fincenter: 0.05 }, groups: { technocrats: 6, youth: 3, workers: -2, capitalists: 1 } },
      desc: 'A public trust that builds and operates frontier AI compute, rents access to researchers and firms, and reinvests licensing revenue.',
      cost: 'Outlays up to +1.08% of GDP (ambitious) for build-out, partly recouped by licensing over time.',
      expected: 'Primary: innovation +0.21…+0.42/turn as compute access widens. Secondary: technocrats & youth strongly up; workers wary of automation (−). Lag ~3 turns.',
      sourceNote: 'Analyzed from an uploaded AI-governance report on public compute and licensing models — effect estimates modeled from the report\'s themes; calibrate before relying on them.'
    },
    {
      id: 'custom_rural_broadband', name: 'Rural Broadband & Grid Co-op Act', cat: 'defense',
      labels: ['Matching grants to co-ops', 'Full rural build-out + grid hardening'],
      base: { demand: 0.3, outlay: 0.7, det: { output: 0.1, competitiveness: 0.1, education: 0.05 }, groups: { workers: 4, religious: 2, seniors: 2, youth: 1, technocrats: 1 } },
      desc: 'Federal financing for member-owned rural broadband and grid co-ops: last-mile fiber, transmission hardening and distributed storage.',
      cost: 'Outlays up to +0.84% of GDP (ambitious) as low-interest co-op loans and grants.',
      expected: 'Primary: output & competitiveness +0.06…+0.12/turn; demand +0.18…+0.36 pp from construction. Secondary: broad rural bloc approval (+). Lag ~3 turns.',
      sourceNote: 'Analyzed from a USDA-style rural-development study on broadband co-ops — effect estimates modeled from the study\'s themes; calibrate before relying on them.'
    }
  ];
  var TEMPLATES = TEMPLATE_SPECS.map(function (s) {
    return assembleDef(s.id, s.name, s.cat, s.desc, s.cost, s.expected, s.sourceNote, s.base, s.labels);
  });

  /* ============================================================================
     analyzeText — HONEST keyword heuristic. It counts terms against a small
     hand-authored lexicon and PRE-FILLS the studio form. It is not an analysis,
     not an estimate, and not AI: every number is a starting guess the player
     must calibrate.                                                            */
  var LEXICON = [
    { terms: ['job', 'jobs', 'wage', 'wages', 'labor', 'labour', 'employment', 'unemployment', 'worker', 'workers'], cat: 'welfare', demand: 0.15, groups: { workers: 2 } },
    { terms: ['climate', 'carbon', 'energy', 'emission', 'emissions', 'solar', 'wind', 'fossil', 'renewable'], cat: 'tax', det: { competitiveness: 0.1 }, groups: { technocrats: 2 } },
    { terms: ['health', 'healthcare', 'care', 'drug', 'drugs', 'overdose', 'opioid', 'hospital', 'medicaid', 'medicare'], cat: 'health', odPct: -0.3, groups: { seniors: 2 } },
    { terms: ['tax', 'taxes', 'revenue', 'deficit', 'loophole', 'irs'], cat: 'tax', demand: -0.05, groups: { capitalists: -2 } },
    { terms: ['housing', 'rent', 'rents', 'zoning', 'eviction', 'mortgage', 'homeless', 'homelessness'], cat: 'housing', homelessPct: -0.3, groups: { youth: 1 } },
    { terms: ['school', 'schools', 'education', 'student', 'students', 'college', 'tuition', 'teacher', 'apprenticeship'], cat: 'education', det: { education: 0.1 }, groups: { youth: 2 } },
    { terms: ['military', 'defense', 'defence', 'pentagon', 'veteran', 'veterans', 'army', 'navy', 'security'], cat: 'defense', det: { military: 0.1 }, groups: { religious: 1 } },
    { terms: ['police', 'crime', 'prison', 'prisons', 'incarceration', 'sentencing', 'justice', 'court', 'courts'], cat: 'justice', incarcPct: -0.3, groups: { immigrants: 1 } },
    { terms: ['election', 'elections', 'voting', 'vote', 'votes', 'democracy', 'media', 'journalism', 'misinformation', 'gerrymander'], cat: 'democracy', groups: { technocrats: 1, youth: 1 } },
    { terms: ['immigration', 'immigrant', 'immigrants', 'border', 'asylum', 'visa', 'visas'], cat: 'education', groups: { immigrants: 3 } },
    { terms: ['ai', 'artificial intelligence', 'algorithm', 'algorithms', 'compute', 'semiconductor', 'semiconductors', 'tech', 'internet', 'data'], cat: 'defense', det: { innovation: 0.1 }, groups: { technocrats: 2 } },
    { terms: ['trade', 'tariff', 'tariffs', 'import', 'imports', 'export', 'exports', 'wto'], cat: 'tax', det: { trade: -0.05, competitiveness: 0.05 } },
    { terms: ['infrastructure', 'grid', 'broadband', 'rural', 'bridge', 'bridges', 'transit', 'rail'], cat: 'defense', det: { output: 0.1 }, outlay: 0.3, groups: { workers: 1 } },
    { terms: ['poverty', 'welfare', 'snap', 'ubi', 'basic income', 'food stamps'], cat: 'welfare', demand: 0.2, outlay: 0.4, groups: { workers: 2 } },
    { terms: ['social security', 'retirement', 'pension', 'pensions', 'seniors', 'elderly'], cat: 'welfare', outlay: 0.3, groups: { seniors: 3 } }
  ];

  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function analyzeText(text) {
    text = String(text || '');
    var lines = text.split(/\r?\n/), title = '';
    for (var i = 0; i < lines.length && i < 40; i++) {
      var ln = lines[i].trim();
      if (ln.length < 4) continue;
      ln = ln.replace(/^#+\s*/, '').replace(/^(title|act|bill|proposal)\s*[:\-–]\s*/i, '').replace(/\[|\]/g, '').trim();
      if (ln.length >= 4) { title = ln; break; }
    }
    if (title.length > 70) {
      title = title.slice(0, 70);
      var sp = title.lastIndexOf(' ');
      if (sp > 30) title = title.slice(0, sp);
    }
    var lower = ' ' + text.toLowerCase() + ' ';
    var catVotes = {}, matched = [];
    var fx = { demand: 0, outlay: 0, odPct: 0, homelessPct: 0, incarcPct: 0, det: {} };
    var groups = {};
    LEXICON.forEach(function (entry) {
      var hits = 0;
      entry.terms.forEach(function (t) {
        var m = lower.match(new RegExp('\\b' + escRe(t) + '\\b', 'g'));
        if (m) hits += m.length;
      });
      if (!hits) return;
      var k = Math.min(3, hits); // diminishing returns past 3 mentions of a theme
      catVotes[entry.cat] = (catVotes[entry.cat] || 0) + hits;
      if (entry.demand) fx.demand += entry.demand * k;
      if (entry.outlay) fx.outlay += entry.outlay * k;
      ['odPct', 'homelessPct', 'incarcPct'].forEach(function (key) { if (entry[key]) fx[key] += entry[key] * k; });
      if (entry.det) Object.keys(entry.det).forEach(function (d) { fx.det[d] = (fx.det[d] || 0) + entry.det[d] * k; });
      if (entry.groups) Object.keys(entry.groups).forEach(function (g) { groups[g] = (groups[g] || 0) + entry.groups[g] * k; });
      matched.push(entry.terms[1] || entry.terms[0]);
    });
    // pre-fill stays modest: suggestions clamped well inside the slider caps
    fx.demand = clamp(r2(fx.demand), -1, 1);
    fx.outlay = clamp(r2(fx.outlay), 0, 2);
    fx.odPct = clamp(r2(fx.odPct), -0.9, 0.9);
    fx.homelessPct = clamp(r2(fx.homelessPct), -0.9, 0.9);
    fx.incarcPct = clamp(r2(fx.incarcPct), -0.9, 0.9);
    Object.keys(fx.det).forEach(function (d) { fx.det[d] = clamp(r2(fx.det[d]), -0.6, 0.6); if (!fx.det[d]) delete fx.det[d]; });
    Object.keys(groups).forEach(function (g) { groups[g] = clamp(Math.round(groups[g]), -6, 6); if (!groups[g]) delete groups[g]; });
    var cat = 'democracy', best = -1;
    Object.keys(catVotes).forEach(function (c) { if (catVotes[c] > best) { best = catVotes[c]; cat = c; } });
    return {
      title: title || 'My Custom Act',
      cat: cat,
      fx: fx,
      groups: groups,
      matched: matched,
      note: matched.length
        ? 'Keyword heuristic matched ' + matched.length + ' theme(s): ' + matched.slice(0, 6).join(', ') + (matched.length > 6 ? '…' : '') + '. This is NOT an analysis — every number below is a guess for you to calibrate.'
        : 'No lexicon themes matched. The form is at neutral — set every value yourself.'
    };
  }

  /* ---- persistence (localStorage; no-op outside the browser) ---- */
  function store() {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
    } catch (e) { /* file:// or privacy mode */ }
    return null;
  }
  function savedList() {
    var ls = store();
    if (!ls) return [];
    try {
      var arr = JSON.parse(ls.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function saveDef(def) {
    var ls = store();
    if (!ls || !def || !def.id) return false;
    var arr = savedList().filter(function (d) { return d && d.id !== def.id; });
    arr.push(def);
    try { ls.setItem(STORAGE_KEY, JSON.stringify(arr)); return true; } catch (e) { return false; }
  }
  function removeSaved(id) {
    var ls = store();
    if (!ls) return false;
    var arr = savedList().filter(function (d) { return d && d.id !== id; });
    try { ls.setItem(STORAGE_KEY, JSON.stringify(arr)); return true; } catch (e) { return false; }
  }
  /* Re-register every saved def into the engine (page load). Returns the defs
     that are now live, so the UI can patch the current game's st.pol. */
  function restoreSaved() {
    var live = [];
    if (!root.ENGINE || typeof root.ENGINE.registerCustomAct !== 'function') return live;
    savedList().forEach(function (def) {
      if (!def || typeof def.id !== 'string') return;
      var r = root.ENGINE.registerCustomAct(def);
      if (r.ok || /already exists/.test(r.msg || '')) live.push(def);
    });
    return live;
  }

  return {
    TEMPLATES: TEMPLATES,
    LEXICON: LEXICON,
    CAPS: CAPS,
    SCALE_MOD: SCALE_MOD,
    SCALE_AMB: SCALE_AMB,
    STORAGE_KEY: STORAGE_KEY,
    balanceOf: balanceOf,
    scaleSpec: scaleSpec,
    analyzeText: analyzeText,
    buildDef: buildDef,
    uniqueId: uniqueId,
    savedList: savedList,
    saveDef: saveDef,
    removeSaved: removeSaved,
    restoreSaved: restoreSaved
  };
});

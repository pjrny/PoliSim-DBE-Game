/* ============================================================================
   PoliSim-DBE — ui.js  (v0.4)
   Rendering, tab navigation, Chart.js wiring, event handlers.
   v0.4: scenario picker (GFC 2008 / The Realignment 2016 dual-track),
   grouped Acts rail, budget sub-departments, influence actions, researched
   Act-effect timelines, scenario-clocked charts.
   ========================================================================== */
(function () {
  'use strict';

  var H = window.HISTORY, POLICIES = window.POLICY_DEFS, VG = window.VOTER_GROUPS, EV = window.EVENTS;
  var BUDGET = window.BUDGET_CATS || [], SECTORS = window.NEW_SECTORS || [];
  var SCENARIOS = window.SCENARIOS || null;
  var ACT_CATEGORIES = window.ACT_CATEGORIES || [];
  var E = window.ENGINE;
  var st = E.createGame();
  var charts = {};   // Chart.js instances
  var hasCharts = typeof Chart !== 'undefined';
  var previewFx = null; // live network preview (hover act option / budget slider)

  /* Defensive content globals (written by the content agent; game works without them) */
  var ACT_CONTENT = (typeof window.ACT_CONTENT !== 'undefined' && window.ACT_CONTENT) || { policies: {}, preloaded: [], budgetHelp: {} };
  if (!ACT_CONTENT.policies) ACT_CONTENT.policies = {};
  if (!ACT_CONTENT.preloaded) ACT_CONTENT.preloaded = [];
  if (!ACT_CONTENT.budgetHelp) ACT_CONTENT.budgetHelp = {};
  var GLOSSARY = (typeof window.GLOSSARY !== 'undefined' && window.GLOSSARY) || {};
  var SCENARIO_2016 = (typeof window.SCENARIO_2016 !== 'undefined' && window.SCENARIO_2016) || null;
  var ACT_TIMELINES = (typeof window.ACT_TIMELINES !== 'undefined' && window.ACT_TIMELINES) || null;

  /* ---- scenario helpers ---- */
  function scenarioDef() {
    if (st.scenario && SCENARIOS && SCENARIOS[st.scenario]) return SCENARIOS[st.scenario];
    return null;
  }
  function scenarioStartState() {
    var sc = scenarioDef();
    if (sc && sc.start) return sc.start;
    return EV.start;
  }
  function clockYear() { return st.clockYear || scenarioStartState().clockYear || scenarioStartState().year || 2008; }
  function histLastTurn() { var sc = scenarioDef(); return (sc && sc.histLastTurn) || EV.histLastTurn || 72; }

  /* ---------------- helpers ---------------- */
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function f1(x) { return Number(x).toFixed(1); }
  function f2(x) { return Number(x).toFixed(2); }
  function money(bn) { return Math.abs(bn) >= 10000 ? '$' + f1(bn / 1000) + 'T' : '$' + Math.round(bn).toLocaleString() + 'bn'; }
  function kfmt(x) { return Math.round(x).toLocaleString(); }
  function pct(x) { return f1(x) + '%'; }
  function toast(msg, bad) {
    var t = $('toast');
    t.textContent = msg;
    t.style.background = bad ? '#b91c1c' : '#1c1917';
    t.classList.remove('hidden');
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.add('hidden'); }, 3200);
  }
  function histAt(series, year) {
    var v = H[series];
    if (!v) return null;
    if (year > 2025) return null; // actuals end in 2025 (turn 72 on the gfc clock)
    var y = String(Math.min(2025, Math.max(2004, year)));
    return v[y] !== undefined ? v[y] : null;
  }
  // actual value for the metrics table: scripted ACTUAL track in dual-track, else HISTORY
  function actualAt(rowDef) {
    if (st.dualTrack && st.actual && st.actual.history.length) {
      var h = st.actual.history[st.actual.history.length - 1];
      var map = { 'Real GDP ($bn chained-2017)': 'gdp_level', 'Unemployment (%)': 'unemployment', 'Debt / GDP (%)': 'debt_gdp', 'Median household income ($)': 'med_income', 'Homelessness (thousands)': 'homelessness', 'Overdose deaths / yr': 'overdoses', 'Incarcerated (millions)': 'incarcerated' };
      var k = map[rowDef.name];
      if (k && h[k] !== undefined) return h[k];
      return null;
    }
    return rowDef.anum(st.year);
  }

  /* ---------------- tabs ---------------- */
  $('tabs').addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-tab]');
    if (!b) return;
    document.querySelectorAll('.tab-btn').forEach(function (x) { x.classList.remove('tab-active'); });
    b.classList.add('tab-active');
    document.querySelectorAll('.tab-pane').forEach(function (p) { p.classList.add('hidden'); });
    $('tab-' + b.dataset.tab).classList.remove('hidden');
    render();
  });

  /* ---------------- glossary modal (education layer) ---------------- */
  var TIP_LABELS = ['What is it', 'What it means', 'Why it matters'];
  var tipState = { key: null, slide: 0 };
  function tipContent(key) {
    var g = GLOSSARY[key] || GLOSSARY['metric_' + key];
    if (g && g.slides && g.slides.length) {
      var slides = g.slides.slice(0, 3);
      while (slides.length < 3) slides.push('See MATH_AND_LOGIC.md for details.');
      return { title: g.title || key, slides: slides };
    }
    var pretty = key.replace(/^budget_/, 'Budget: ').replace(/^det_/, '').replace(/_/g, ' ');
    pretty = pretty.charAt(0).toUpperCase() + pretty.slice(1);
    return {
      title: pretty,
      slides: [
        'A tracked quantity in the PoliSim-DBE model of the US economy and political system.',
        'It responds to your Acts, budget lines and the scripted shocks of the scenario, following the formulas documented in MATH_AND_LOGIC.md.',
        'Watch how it moves against the grey actual-history line — the divergence between your run and reality is the lesson.'
      ]
    };
  }
  function renderTip() {
    var c = tipContent(tipState.key);
    $('tip-title').textContent = c.title;
    $('tip-slide-label').textContent = TIP_LABELS[tipState.slide] || '';
    $('tip-body').textContent = c.slides[tipState.slide];
    var dots = $('tip-dots');
    dots.innerHTML = '';
    c.slides.forEach(function (_, i) {
      var d = el('span', 'tip-dot' + (i === tipState.slide ? ' on' : ''));
      dots.appendChild(d);
    });
    $('tip-prev').disabled = tipState.slide === 0;
    $('tip-next').disabled = tipState.slide === c.slides.length - 1;
  }
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-tip]');
    if (!t) return;
    if (t.tagName === 'A') ev.preventDefault();
    tipState = { key: t.getAttribute('data-tip'), slide: 0 };
    renderTip();
    $('tip-modal').classList.remove('hidden');
  });
  $('tip-close').addEventListener('click', function () { $('tip-modal').classList.add('hidden'); });
  $('tip-modal').addEventListener('click', function (ev) { if (ev.target === $('tip-modal')) $('tip-modal').classList.add('hidden'); });
  $('tip-prev').addEventListener('click', function () { if (tipState.slide > 0) { tipState.slide--; renderTip(); } });
  $('tip-next').addEventListener('click', function () { if (tipState.slide < 2) { tipState.slide++; renderTip(); } });

  /* ---------------- header ---------------- */
  function renderHeader() {
    $('hd-clock').textContent = 'Q' + st.quarter + ' ' + st.year + ' · Turn ' + st.turn;
    var pw = E.computePower(st), ph = E.phaseOf(pw.S);
    var phaseBadge = $('hd-phase');
    phaseBadge.textContent = '⛭ ' + ph.name;
    phaseBadge.title = ph.desc + '  (S = ' + f1(pw.S) + ' = mean det ' + f1(pw.mean) + ' − 0.25×debt burden ' + f1(pw.debtBurden) + ' − 0.25×conflict ' + f1(pw.conflict) + ')';
    $('hd-legit').textContent = 'Legitimacy ' + f1(st.legitimacy);
    $('hd-legit').style.background = st.legitimacy <= 25 ? '#b91c1c' : (st.legitimacy <= 40 ? '#b45309' : '');
    $('hd-sent').textContent = 'Sentiment ' + f1(st.sentiment);
    var pcs = E.pcStats(st);
    $('hd-pc').textContent = 'PC ' + Math.floor(st.pc) + '/' + Math.round(pcs.cap);
    $('hd-pc').title = 'Political Capital — spent on Acts (upfront + upkeep) and budget moves. Regen +' + f1(st.pcRegen || pcs.regen) + '/turn from party strength.';
    $('hd-funds').textContent = '$' + Math.floor(st.funds) + 'M';
    // v0.4: dual-track badges
    var inf = $('hd-influ'), scb = $('hd-scenario');
    if (st.dualTrack) {
      inf.classList.remove('hidden');
      inf.textContent = 'Influence ' + Math.floor(st.influence) + '/' + st.influenceCap;
      inf.title = 'Influence — ACTUAL-track nudge points. Small, real effects on the scripted timeline. +' + st.influencePerTurn + '/turn.';
      scb.classList.remove('hidden');
      scb.textContent = scenarioDef() ? scenarioDef().name : '';
    } else { inf.classList.add('hidden'); scb.classList.add('hidden'); }
    var ban = $('event-banner');
    var evDef = (st.scenario && EV[st.scenario === 'realign2016' ? 'realign' : 'gfc']) || EV.gfc;
    if (st.turn >= 1 && st.turn <= 5 && !st.over && evDef && evDef.banner) { ban.textContent = evDef.banner; ban.classList.remove('hidden'); }
    else if (st.dualTrack && st.turn === 0 && evDef && evDef.banner) { ban.textContent = evDef.banner; ban.classList.remove('hidden'); }
    else ban.classList.add('hidden');
    $('btn-next').disabled = st.over;
  }

  /* ---------------- dashboard ---------------- */
  var STAT_DEFS = [
    { label: 'Real GDP', tip: 'gdp', get: function () { return money(st.gdp_level); }, sub: function () { return f2(st.growth) + '% ann. growth'; } },
    { label: 'Unemployment', tip: 'unemployment', get: function () { return pct(st.unemployment); }, sub: function () { return 'median income $' + kfmt(st.med_income); } },
    { label: 'Debt / GDP', tip: 'debt', get: function () { return pct(st.debt_gdp); }, sub: function () { return 'deficit ' + money(st.deficit_bn) + '/yr'; } },
    { label: 'Homelessness', tip: 'homelessness', get: function () { return kfmt(st.homelessness) + 'k'; }, sub: function () { return 'overdoses ' + kfmt(st.overdoses) + '/yr'; } }
  ];
  function renderStatCards() {
    var c = $('stat-cards'); c.innerHTML = '';
    STAT_DEFS.forEach(function (d) {
      var card = el('div', 'card !p-3');
      card.setAttribute('data-tip', d.tip);
      card.appendChild(el('div', 'text-[11px] uppercase tracking-wide text-stone-400', d.label));
      card.appendChild(el('div', 'text-xl font-bold text-stone-800', d.get()));
      card.appendChild(el('div', 'text-[11px] text-stone-500', d.sub()));
      c.appendChild(card);
    });
  }

  var METRIC_ROWS = [
    { name: 'Real GDP ($bn chained-2017)', tip: 'gdp', sim: function () { return kfmt(st.gdp_level); }, act: function (y) { var v = histAt('real_gdp_bn_chained2017', y); return v ? kfmt(v) : '—'; }, num: function () { return st.gdp_level; }, anum: function (y) { return histAt('real_gdp_bn_chained2017', y); } },
    { name: 'Unemployment (%)', tip: 'unemployment', sim: function () { return f2(st.unemployment); }, act: function (y) { var v = histAt('unemployment_pct', y); return v ? f2(v) : '—'; }, num: function () { return st.unemployment; }, anum: function (y) { return histAt('unemployment_pct', y); }, inv: true },
    { name: 'Debt / GDP (%)', tip: 'debt', sim: function () { return f1(st.debt_gdp); }, act: function (y) { var v = histAt('debt_to_gdp_pct', y); return v ? f1(v) : '—'; }, num: function () { return st.debt_gdp; }, anum: function (y) { return histAt('debt_to_gdp_pct', y); }, inv: true },
    { name: 'Median household income ($)', tip: 'med_income', sim: function () { return kfmt(st.med_income); }, act: function (y) { var v = histAt('real_median_hh_income_usd', y); return v ? kfmt(v) : '—'; }, num: function () { return st.med_income; }, anum: function (y) { return histAt('real_median_hh_income_usd', y); } },
    { name: 'Homelessness (thousands)', tip: 'homelessness', sim: function () { return kfmt(st.homelessness); }, act: function (y) { var v = histAt('homelessness_pit', y); return v ? kfmt(v) : '—'; }, num: function () { return st.homelessness; }, anum: function (y) { return histAt('homelessness_pit', y); }, inv: true },
    { name: 'Overdose deaths / yr', tip: 'overdoses', sim: function () { return kfmt(st.overdoses); }, act: function (y) { var v = histAt('overdose_deaths', y); return v ? kfmt(v) : '—'; }, num: function () { return st.overdoses; }, anum: function (y) { return histAt('overdose_deaths', y); }, inv: true },
    { name: 'Incarcerated (millions)', tip: 'incarcerated', sim: function () { return f2(st.incarcerated); }, act: function (y) { var v = histAt('incarcerated_millions', y); return v ? f2(v) : '—'; }, num: function () { return st.incarcerated; }, anum: function (y) { return histAt('incarcerated_millions', y); }, inv: true }
  ];
  function renderMetricsTable() {
    var tb = document.querySelector('#metrics-table tbody');
    tb.innerHTML = '';
    METRIC_ROWS.forEach(function (r) {
      var tr = el('tr', 'border-b border-stone-100');
      var nameTd = el('td', 'font-medium text-stone-600', r.name);
      nameTd.setAttribute('data-tip', r.tip);
      tr.appendChild(nameTd);
      tr.appendChild(el('td', '', r.sim()));
      var avRaw = actualAt(r);
      var avTxt;
      if (avRaw === null || avRaw === undefined) avTxt = st.dualTrack ? '—' : r.act(st.year);
      else if (r.name.indexOf('Unemployment') === 0 || r.name.indexOf('Incarcerated') === 0) avTxt = f2(avRaw);
      else if (r.name.indexOf('Debt') === 0) avTxt = f1(avRaw);
      else avTxt = kfmt(avRaw);
      tr.appendChild(el('td', 'text-stone-400', avTxt));
      var av = avRaw !== null ? avRaw : r.anum(st.year), dcell = el('td', '', '—');
      if (av !== null && av !== undefined) {
        var d = r.num() - av;
        var good = r.inv ? d < 0 : d > 0;
        var pctD = av ? (d / Math.abs(av)) * 100 : 0;
        dcell.textContent = (d >= 0 ? '+' : '') + f1(pctD) + '%';
        dcell.className = good ? 'delta-pos' : 'delta-neg';
      }
      tr.appendChild(dcell);
      tb.appendChild(tr);
    });
  }

  var DET_LABELS = { education: 'Education', innovation: 'Innovation & Tech', competitiveness: 'Competitiveness', military: 'Military', trade: 'Trade', output: 'Economic Output', fincenter: 'Financial Center', reserve_fx: 'Reserve Currency' };
  function renderGauges() {
    var c = $('det-gauges'); c.innerHTML = '';
    E.DET_IDS.forEach(function (d) {
      var v = st.det[d];
      var row = el('div', 'gauge-row');
      var lab = el('span', 'text-stone-600', DET_LABELS[d]);
      lab.setAttribute('data-tip', 'det_' + d);
      row.appendChild(lab);
      var track = el('div', 'gauge-track');
      var fill = el('div', 'gauge-fill' + (v < 40 ? ' crit' : v < 60 ? ' low' : ''));
      fill.style.width = v + '%';
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el('span', 'text-right font-semibold', f1(v)));
      c.appendChild(row);
    });
    var pw = E.computePower(st), ph = E.phaseOf(pw.S);
    $('power-score').textContent = f1(pw.S) + ' / 100';
    var pp = $('power-phase');
    pp.textContent = ph.name;
    pp.title = ph.desc;
  }

  /* ---------------- acts tab (formerly policies) ---------------- */
  function optionLabel(def, val) {
    if (def.kind === 'slider') return val + def.unit;
    for (var i = 0; i < def.options.length; i++) if (def.options[i].id === val) return def.options[i].label;
    return val;
  }
  function optionDef(def, val) {
    if (def.kind === 'slider') return null;
    for (var i = 0; i < def.options.length; i++) if (def.options[i].id === val) return def.options[i];
    return null;
  }

  function evidenceBlock(def, optId) {
    var box = el('details', 'evidence');
    var sum = el('summary', null, 'Evidence &amp; effects');
    box.appendChild(sum);
    var grid = el('div', 'ev-grid');
    var ac = ACT_CONTENT.policies[def.id];
    var opt = ac && ac.options ? ac.options[optId] : null;
    if (ac && ac.summary) grid.appendChild(el('p', null, '<span class="ev-label">Summary:</span> ' + esc(ac.summary)));
    if (opt) {
      if (opt.does) grid.appendChild(el('p', null, '<span class="ev-label">What it does:</span> ' + esc(opt.does)));
      if (opt.doesnt) grid.appendChild(el('p', null, '<span class="ev-label">What it does NOT do:</span> ' + esc(opt.doesnt)));
      if (opt.budget) grid.appendChild(el('p', null, '<span class="ev-label">Budget adds &amp; cuts:</span> ' + esc(opt.budget)));
      if (opt.results) grid.appendChild(el('p', null, '<span class="ev-label">Predicted results:</span> ' + esc(opt.results)));
      if (opt.cites && opt.cites.length) {
        var ul = el('ul');
        opt.cites.forEach(function (c) { ul.appendChild(el('li', null, esc(c))); });
        var w = el('div');
        w.appendChild(el('span', 'ev-label', 'Cited articles:'));
        w.appendChild(ul);
        grid.appendChild(w);
      }
    } else {
      grid.appendChild(el('p', null, '<span class="ev-label">Cost:</span> ' + esc(def.cost || '')));
      grid.appendChild(el('p', null, '<span class="ev-label">Expected:</span> ' + esc(def.expected || '')));
    }
    box.appendChild(grid);
    return box;
  }

  function buildPolicyCards() {
    var grid = $('policy-grid');
    grid.innerHTML = '';
    // v0.4: group Acts into category shelves (ported from the old build's POLICY_CATEGORIES)
    var byId = {};
    POLICIES.forEach(function (d) { byId[d.id] = d; });
    var groups = (ACT_CATEGORIES && ACT_CATEGORIES.length) ? ACT_CATEGORIES : [{ id: 'all', name: 'Acts', color: '#0f766e', acts: POLICIES.map(function (d) { return d.id; }) }];
    groups.forEach(function (cat) {
      var section = el('div', 'polcat mb-5');
      section.id = 'polcat-' + cat.id;
      var head = el('div', 'polcat-head');
      head.innerHTML = '<span class="polcat-bar" style="background:' + esc(cat.color) + '"></span>' +
        '<span class="polcat-name">' + esc(cat.name) + '</span>' +
        '<span class="polcat-count">' + cat.acts.length + ' Act' + (cat.acts.length > 1 ? 's' : '') + '</span>';
      section.appendChild(head);
      var inner = el('div', 'grid md:grid-cols-2 xl:grid-cols-3 gap-4');
      cat.acts.forEach(function (aid) {
        var def = byId[aid];
        if (def) inner.appendChild(buildPolicyCard(def, cat.color));
      });
      section.appendChild(inner);
      grid.appendChild(section);
    });
  }

  function buildPolicyCard(def, color) {
    {
      var card = el('div', 'policy-card');
      card.id = 'polcard-' + def.id;
      card.style.borderLeft = '3px solid ' + (color || '#0f766e');
      card.appendChild(el('h3', null, esc(def.name)));
      var ac = ACT_CONTENT.policies[def.id];
      card.appendChild(el('p', 'desc', esc((ac && ac.summary) || def.desc)));

      var ctrlRow = el('div', 'flex items-center gap-2');
      if (def.kind === 'slider') {
        var range = el('input');
        range.type = 'range'; range.min = def.min; range.max = def.max; range.step = def.step;
        range.value = st.pol[def.id].value;
        range.id = 'pol-' + def.id;
        var valSpan = el('span', 'text-xs font-bold text-teal-800 whitespace-nowrap', optionLabel(def, st.pol[def.id].value));
        valSpan.id = 'polval-' + def.id;
        range.addEventListener('input', function () {
          valSpan.textContent = range.value + def.unit;
          previewFx = E.previewPolicyFx(def.id, parseFloat(range.value));
          renderNetwork();
        });
        range.addEventListener('change', function () {
          previewFx = null;
          var res = E.applyPolicy(st, def.id, parseFloat(range.value));
          toast(res.msg, !res.ok);
          render();
        });
        range.addEventListener('mouseleave', function () { if (previewFx) { previewFx = null; renderNetwork(); } });
        ctrlRow.appendChild(range);
        ctrlRow.appendChild(valSpan);
        card.appendChild(ctrlRow);
        card.appendChild(el('p', 'meta', '💰 ' + esc(def.cost)));
        card.appendChild(el('p', 'meta', '📈 ' + esc(def.expected)));
      } else {
        var sel = el('select');
        sel.id = 'pol-' + def.id;
        def.options.forEach(function (o) {
          var up = o.upkeep ? ' + upkeep ' + o.upkeep.perTurn + '/turn×' + o.upkeep.turns : '';
          var opt = el('option', null, esc(o.label) + '  (−' + o.pc + ' PC' + up + ')');
          opt.value = o.id;
          sel.appendChild(opt);
        });
        sel.value = st.pol[def.id].value;
        sel.addEventListener('change', function () {
          var res = E.applyPolicy(st, def.id, sel.value);
          toast(res.msg, !res.ok);
          previewFx = null;
          render();
        });
        sel.addEventListener('mouseenter', function () {
          previewFx = E.previewPolicyFx(def.id, sel.value);
          renderNetwork();
        });
        sel.addEventListener('mouseleave', function () { previewFx = null; renderNetwork(); });
        ctrlRow.appendChild(sel);
        card.appendChild(ctrlRow);
        var evWrap = el('div');
        evWrap.id = 'polev-' + def.id;
        evWrap.appendChild(evidenceBlock(def, st.pol[def.id].value));
        card.appendChild(evWrap);
      }

      var rampInfo = el('p', 'meta');
      rampInfo.id = 'polramp-' + def.id;
      card.appendChild(rampInfo);
      // v0.4: repeal control — strips an in-force Act, effects unwind in reverse
      var rep = el('div', 'mt-1');
      rep.id = 'polrepeal-' + def.id;
      card.appendChild(rep);
      return card;
    }
  }

  function renderPolicies() {
    var pcs = E.pcStats(st);
    $('pol-pc').textContent = 'Political Capital (SIM): ' + Math.floor(st.pc) + ' / ' + Math.round(pcs.cap) + '  (+' + f1(st.pcRegen || pcs.regen) + '/turn)' + (st.dualTrack ? '  ·  sized to your shadow governing mandate, not your 6-seat caucus' : '');
    POLICIES.forEach(function (def) {
      var ps = st.pol[def.id];
      var ctl = $('pol-' + def.id);
      if (ctl) {
        if (def.kind === 'slider') {
          if (document.activeElement !== ctl) ctl.value = ps.value;
          var vs = $('polval-' + def.id);
          if (vs && document.activeElement !== ctl) vs.textContent = optionLabel(def, ps.value);
        } else if (ctl.value !== ps.value) ctl.value = ps.value;
        ctl.disabled = st.over;
      }
      var card = $('polcard-' + def.id);
      if (card) card.classList.toggle('stalled', !!ps.stalled);
      var ri = $('polramp-' + def.id);
      if (ri) {
        var bits = [];
        if (ps.stalled) bits.push('<span class="stalled-tag">⚠ STALLED — upkeep unpaid, effects paused</span>');
        else if (ps.ramp < 1) bits.push('⏳ Phasing in: ' + Math.round(ps.ramp * 100) + '% of full effect');
        else bits.push('Current: ' + esc(optionLabel(def, ps.value)) + ' · full effect');
        if (ps.upkeepLeft > 0) bits.push('<span class="upkeep-tag">upkeep ' + ps.upkeepPer + ' PC/turn, ' + ps.upkeepLeft + ' turns left</span>');
        ri.innerHTML = bits.join(' · ');
      }
      var evWrap = $('polev-' + def.id);
      if (evWrap && evWrap._for !== ps.value) {
        evWrap.innerHTML = '';
        evWrap.appendChild(evidenceBlock(def, ps.value));
        evWrap._for = ps.value;
      }
      // repeal button: visible only when the Act is in force
      var rw = $('polrepeal-' + def.id);
      if (rw) {
        var inForce = ps.value !== def.def && !(def.options && def.options.length && def.options[0].id === 'off' && ps.value === 'off');
        if (inForce && !rw._built) {
          rw._built = true;
          var b = el('button', 'btn-ghost border border-red-300 text-red-700 !text-[11px] !py-1 !px-2', '🧨 Repeal — strip this Act, effects unwind in reverse');
          b.addEventListener('click', function () {
            var res = E.repealAct(st, def.id);
            toast(res.msg, !res.ok);
            render();
          });
          rw.appendChild(b);
        }
        if (rw._built) rw.style.display = (inForce && !st.over) ? '' : 'none';
      }
    });
  }

  function renderPreloaded() {
    var c = $('preloaded-acts');
    c.innerHTML = '';
    if (!ACT_CONTENT.preloaded.length) {
      c.appendChild(el('p', 'text-xs text-stone-400', 'Acts already woven into the national fabric (Social Security, Medicare, the Federal Reserve, the income tax…) are modeled as the baseline your budget lines and Acts build on.'));
      return;
    }
    ACT_CONTENT.preloaded.forEach(function (a) {
      var box = el('div', 'border border-stone-200 rounded-lg p-3 bg-stone-50');
      box.appendChild(el('div', 'text-xs font-bold text-stone-700', esc(a.name) + ' <span class="font-normal text-stone-400">(' + esc(String(a.year)) + ' · ' + esc(a.status || 'in force') + ')</span>'));
      if (a.does) box.appendChild(el('p', 'text-[11px] text-stone-500 mt-1', esc(a.does)));
      if (a.ongoing) box.appendChild(el('p', 'text-[11px] text-stone-500', '<b>Today:</b> ' + esc(a.ongoing)));
      if (a.cites && a.cites.length) box.appendChild(el('p', 'text-[10px] text-stone-400 mt-1', 'Sources: ' + esc(a.cites.join('; '))));
      c.appendChild(box);
    });
  }

  /* ---------------- v0.4: researched Act-effect timelines ---------------- */
  function buildActTimelines() {
    var c = $('act-timelines');
    if (!c) return;
    c.innerHTML = '';
    if (!ACT_TIMELINES || !ACT_TIMELINES.acts) { if (c.parentNode) c.parentNode.style.display = 'none'; return; }
    if (c.parentNode) c.parentNode.style.display = '';
    Object.keys(ACT_TIMELINES.acts).forEach(function (key) {
      var T = ACT_TIMELINES.acts[key];
      var box = el('details', 'border border-stone-200 rounded-lg bg-white');
      var arc = T.budgetArc || [];
      var arcTxt = arc.map(function (p) { return (p.year >= 2000 ? String(p.year) : String(p.year).slice(2) + '…') + ' $' + (p.bn >= 1000 ? f1(p.bn / 1000) + 'T' : Math.round(p.bn) + 'B'); }).join(' → ');
      var sum = el('summary', 'cursor-pointer px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50',
        esc(T.name) + ' <span class="font-normal text-stone-400">(' + esc(T.enacted) + ' · budget: ' + esc(arcTxt) + ')</span>');
      box.appendChild(sum);
      var body = el('div', 'px-3 pb-3 text-[11px] text-stone-600 space-y-1.5');
      (T.metricEffects || []).forEach(function (m) {
        body.appendChild(el('p', null, '<b>' + esc(m.metric) + ':</b> ' + esc(m.effect) + ' <span class="text-stone-400">[' + esc(m.cite) + ']</span>'));
      });
      if (T.detContribution && T.detContribution.length) {
        var dets = T.detContribution.map(function (d) { return esc(d.det) + ' ' + (d.delta === '+' ? '▲' : d.delta === '-' ? '▼' : '◆'); }).join(' · ');
        body.appendChild(el('p', null, '<b>Determinants:</b> ' + dets));
      }
      if (T.stripStakeholders && T.stripStakeholders.length) {
        var strip = T.stripStakeholders.map(function (s) { return esc(s.group) + ' (' + esc(s.impact) + ')'; }).join(' · ');
        body.appendChild(el('p', 'text-red-800', '<b>If stripped:</b> ' + strip));
      }
      if (T.budgetCat && T.budgetCat.length) body.appendChild(el('p', 'text-stone-400', 'Maps to budget line(s): ' + T.budgetCat.join(', ')));
      if (T.sources && T.sources.length) body.appendChild(el('p', 'text-stone-400', 'Sources: ' + esc(T.sources.join('; '))));
      box.appendChild(body);
      c.appendChild(box);
    });
  }

  /* ---------------- budget tab ---------------- */
  function buildBudgetRows() {
    var c = $('budget-rows');
    c.innerHTML = '';
    BUDGET.forEach(function (cat) {
      var row = el('div', 'budget-row' + (cat.locked ? ' locked' : ''));
      row.id = 'brow-' + cat.id;
      var name = el('span', 'bname', esc(cat.name));
      name.setAttribute('data-tip', 'budget_' + cat.id);
      name.title = ACT_CONTENT.budgetHelp['budget_' + cat.id] || '';
      row.appendChild(name);
      var range = el('input');
      range.type = 'range'; range.min = 0; range.max = 200; range.step = 10;
      range.value = 100;
      range.id = 'bslider-' + cat.id;
      if (cat.locked) range.disabled = true;
      (function (cat, range) {
        range.addEventListener('input', function () {
          var lab = $('bval-' + cat.id);
          if (lab) lab.textContent = range.value + '%';
          previewFx = E.previewBudgetFx(cat.id, parseFloat(range.value) / 100);
          renderNetwork();
        });
        range.addEventListener('change', function () {
          previewFx = null;
          var res = E.applyBudget(st, cat.id, parseFloat(range.value) / 100);
          toast(res.msg, !res.ok);
          render();
        });
        range.addEventListener('mouseleave', function () { if (previewFx) { previewFx = null; renderNetwork(); } });
      })(cat, range);
      row.appendChild(range);
      row.appendChild(el('span', 'text-center font-semibold text-teal-800', '100%')).id = 'bvalwrap-' + cat.id;
      row.lastChild.id = 'bval-' + cat.id;
      row.appendChild(el('span', 'text-right text-stone-500', '')).id = 'bbnwrap-' + cat.id;
      row.lastChild.id = 'bbn-' + cat.id;
      row.appendChild(el('span', 'text-right text-stone-400', '')).id = 'bshwrap-' + cat.id;
      row.lastChild.id = 'bshare-' + cat.id;
      var del = el('button', 'bdel', '✕');
      del.title = 'Delete this category (set to 0%): one-time 10 PC, big group backlash';
      del.disabled = !!cat.locked;
      (function (cat) {
        del.addEventListener('click', function () {
          var res = E.deleteBudgetCat(st, cat.id);
          toast(res.msg, !res.ok);
          render();
        });
      })(cat);
      row.appendChild(del);
      // v0.4: restore control (appears when the line or a sub-line is deleted)
      var rst = el('button', 'brestore hidden', '⟲');
      rst.title = 'Restore deleted line(s) in this category (5 PC)';
      rst.id = 'brestore-' + cat.id;
      (function (cat, rst) {
        rst.addEventListener('click', function () {
          var res = E.restoreBudgetLine(st, cat.id);
          toast(res.msg, !res.ok);
          render();
        });
      })(cat, rst);
      row.appendChild(rst);
      c.appendChild(row);
      // v0.4: sub-department child rows
      if (cat.sub && cat.sub.length) {
        var subs = el('div', 'bsubs');
        subs.id = 'bsubs-' + cat.id;
        cat.sub.forEach(function (sd) {
          var srow = el('div', 'budget-row');
          srow.id = 'bsubrow-' + cat.id + '-' + sd.id;
          var sname = el('span', 'bname', esc(sd.name));
          sname.setAttribute('data-tip', 'budget_sub');
          srow.appendChild(sname);
          var sr = el('input');
          sr.type = 'range'; sr.min = 0; sr.max = 200; sr.step = 10;
          sr.value = 100;
          sr.id = 'bsub-' + cat.id + '-' + sd.id;
          (function (cat, sd, sr) {
            sr.addEventListener('input', function () {
              var lab = $('bsubval-' + cat.id + '-' + sd.id);
              if (lab) lab.textContent = sr.value + '%';
              previewFx = null;
            });
            sr.addEventListener('change', function () {
              var res = E.applyBudgetSub(st, cat.id, sd.id, parseFloat(sr.value) / 100);
              toast(res.msg, !res.ok);
              render();
            });
          })(cat, sd, sr);
          srow.appendChild(sr);
          srow.appendChild(el('span', 'text-center font-semibold text-teal-800', '100%')).id = 'bsubval-' + cat.id + '-' + sd.id;
          srow.appendChild(el('span', 'text-right text-stone-500', '')).id = 'bsubbn-' + cat.id + '-' + sd.id;
          srow.appendChild(el('span', 'text-right text-stone-400', '')).id = 'bsubshare-' + cat.id + '-' + sd.id;
          var sdel = el('button', 'bdel', '✕');
          sdel.title = 'Eliminate this sub-department: one-time 5 PC, parent effects weaken by its share';
          (function (cat, sd) {
            sdel.addEventListener('click', function () {
              var res = E.deleteBudgetSub(st, cat.id, sd.id);
              toast(res.msg, !res.ok);
              render();
            });
          })(cat, sd);
          srow.appendChild(sdel);
          subs.appendChild(srow);
        });
        c.appendChild(subs);
      }
    });
    var sel = $('sector-select');
    sel.innerHTML = '';
    SECTORS.forEach(function (s) {
      sel.appendChild(el('option', null, esc(s.name) + ' — ' + s.gdpPct + '% of GDP'));
      sel.lastChild.value = s.id;
    });
  }
  $('sector-add').addEventListener('click', function () {
    var res = E.addSector(st, $('sector-select').value);
    toast(res.msg, !res.ok);
    render();
  });

  function renderBudget() {
    var bud = E.computeBudget(st, currentActFx(), 0);
    bud.lines.forEach(function (L) {
      var slider = $('bslider-' + L.id);
      var row = $('brow-' + L.id);
      if (!slider) return; // sector lines rendered separately below
      if (document.activeElement !== slider && !L.locked) slider.value = Math.round(L.mult * 100);
      if (L.locked) slider.value = Math.round(L.mult * 100);
      $('bval-' + L.id).textContent = Math.round(L.mult * 100) + '%';
      $('bbn-' + L.id).textContent = money(L.bn);
      $('bshare-' + L.id).textContent = f2(L.share) + '%';
      if (row) row.classList.toggle('deleted', !!L.deleted);
      if (!L.locked) slider.disabled = st.over;
      // v0.4: sub-department lines + restore control
      var rst = $('brestore-' + L.id);
      if (rst) {
        var anySubDeleted = L.subs ? L.subs.some(function (s) { return s.deleted; }) : false;
        rst.classList.toggle('hidden', !(L.deleted || anySubDeleted));
        rst.disabled = st.over;
      }
      if (L.subs) {
        L.subs.forEach(function (S) {
          var ssr = $('bsub-' + L.id + '-' + S.id);
          if (!ssr) return;
          if (document.activeElement !== ssr) ssr.value = Math.round(S.mult * 100);
          ssr.disabled = st.over || !!L.deleted || S.deleted;
          var sv = $('bsubval-' + L.id + '-' + S.id);
          if (sv) sv.textContent = Math.round(S.mult * 100) + '%';
          var sb = $('bsubbn-' + L.id + '-' + S.id);
          if (sb) sb.textContent = S.deleted ? '—' : money(S.bn);
          var ssh = $('bsubshare-' + L.id + '-' + S.id);
          if (ssh) ssh.textContent = S.deleted ? '' : f2(S.bn / st.gdp_nominal * 100) + '%';
          var srow = $('bsubrow-' + L.id + '-' + S.id);
          if (srow) srow.classList.toggle('deleted', !!S.deleted);
        });
      }
    });
    // sector lines (created at runtime)
    var sc = $('sector-rows');
    if (sc) sc.remove();
    if (st.sectors.length) {
      var holder = el('div');
      holder.id = 'sector-rows';
      st.sectors.forEach(function (s) {
        var def = null;
        SECTORS.forEach(function (x) { if (x.id === s.id) def = x; });
        if (!def) return;
        var share = def.gdpPct * s.mult;
        var bn = share / 100 * st.gdp_nominal;
        var row = el('div', 'budget-row');
        var name = el('span', 'bname', esc(def.name) + ' ★');
        name.setAttribute('data-tip', 'budget_' + s.id);
        row.appendChild(name);
        row.appendChild(el('span', 'text-[11px] text-stone-400', 'new sector'));
        row.appendChild(el('span', 'text-center font-semibold text-teal-800', '100%'));
        row.appendChild(el('span', 'text-right text-stone-500', money(bn)));
        row.appendChild(el('span', 'text-right text-stone-400', f2(share) + '%'));
        row.appendChild(el('span'));
        holder.appendChild(row);
      });
      $('budget-rows').appendChild(holder);
    }
    // refresh add-sector dropdown (hide already-added)
    var sel = $('sector-select');
    sel.innerHTML = '';
    var remaining = 0;
    SECTORS.forEach(function (s) {
      var added = st.sectors.some(function (x) { return x.id === s.id; });
      if (!added) {
        var o = el('option', null, esc(s.name) + ' — ' + s.gdpPct + '% of GDP');
        o.value = s.id;
        sel.appendChild(o);
        remaining++;
      }
    });
    $('sector-add').disabled = st.over || !remaining;
    // totals
    var t = $('budget-totals');
    t.innerHTML = '';
    function trow(label, val, tip, cls) {
      var r = el('div', 'flex justify-between ' + (cls || ''));
      var l = el('span', 'text-stone-500', label);
      if (tip) l.setAttribute('data-tip', tip);
      r.appendChild(l);
      r.appendChild(el('span', 'font-semibold', val));
      t.appendChild(r);
    }
    trow('Outlays (incl. Acts & interest)', money(bud.outlays_bn) + ' · ' + f1(bud.outlay_share) + '% GDP', 'budget_outlays');
    trow('  of which Net Interest (auto)', money(bud.interest_bn), 'budget_interest');
    trow('  of which Acts', money(bud.act_outlays_bn), 'budget_acts');
    trow('Receipts (tax Acts driven)', money(bud.revenue_bn) + ' · ' + f1(bud.revenue_share) + '% GDP', 'budget_receipts');
    trow('Deficit', money(bud.deficit_bn) + '/yr', 'budget_deficit', bud.deficit_bn > 0 ? 'text-red-700' : 'text-teal-800');
  }
  // current aggregate act fx (settled+ramps) for budget totals display
  function currentActFx() {
    var fx = { outlay: 0, revAdd: 0, vat: 0, tariff: 0 };
    POLICIES.forEach(function (def) {
      var ps = st.pol[def.id];
      if (ps.stalled) return;
      if (def.kind === 'slider') {
        var v = (typeof ps.from === 'number' ? ps.from : 0) + (ps.value - (typeof ps.from === 'number' ? ps.from : 0)) * ps.ramp;
        if (def.id === 'tax') fx.vat = v / 100;
        if (def.id === 'tariffs') fx.tariff = v;
        if (def.id === 'infra') fx.outlay += v;
        return;
      }
      var o = optionDef(def, ps.value);
      var f = (o && o.fx) || {};
      fx.outlay += (f.outlay || 0) * ps.ramp;
      fx.revAdd += (f.revAdd || 0) * ps.ramp;
    });
    return fx;
  }

  /* ---------------- network tab ---------------- */
  var SVGNS = 'http://www.w3.org/2000/svg';
  var NET_POS = null;
  function netPositions() {
    if (NET_POS) return NET_POS;
    var cx = 430, cy = 320, rIn = 150, rOut = 260;
    NET_POS = {};
    E.DET_IDS.forEach(function (d, i) {
      var a = -Math.PI / 2 + i * (2 * Math.PI / 8);
      NET_POS[d] = { x: cx + rIn * Math.cos(a), y: cy + rIn * Math.sin(a) };
    });
    E.METRIC_NODES.forEach(function (m, i) {
      var a = -Math.PI / 2 + Math.PI / 8 + i * (2 * Math.PI / 8);
      NET_POS[m] = { x: cx + rOut * Math.cos(a), y: cy + rOut * Math.sin(a) };
    });
    return NET_POS;
  }
  var METRIC_LABELS = { gdp: 'GDP', unemployment: 'Unemployment', debt: 'Debt', homelessness: 'Homelessness', overdoses: 'Overdoses', incarcerated: 'Incarcerated', med_income: 'Med. income', sentiment: 'Sentiment' };
  function svgEl(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }
  function renderNetwork() {
    var svg = $('network-svg');
    if (!svg) return;
    var net = E.computeNetwork(st, previewFx);
    var pos = netPositions();
    svg.innerHTML = '';
    // edges
    net.edges.forEach(function (e) {
      var a = pos[e.from], b = pos[e.to];
      if (!a || !b) return;
      var na = net.nodes[e.from], nb = net.nodes[e.to];
      var dx = b.x - a.x, dy = b.y - a.y;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var x1 = a.x + dx / len * na.r, y1 = a.y + dy / len * na.r;
      var x2 = b.x - dx / len * nb.r, y2 = b.y - dy / len * nb.r;
      var cls = 'net-edge s' + e.strength + (e.sign < 0 ? ' neg' : '');
      var stroke = e.sign > 0 ? '#0f766e' : '#b91c1c';
      var w = 0.8 + e.strength * 0.9;
      if (previewFx) {
        if (e.hot) { cls += ' hot'; w += 1.6; }
        else cls += ' dim';
      } else {
        stroke = e.sign > 0 ? '#14b8a6' : '#f87171';
      }
      svg.appendChild(svgEl('line', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: stroke, 'stroke-width': w, 'class': cls, opacity: previewFx ? (e.hot ? 1 : 0.12) : 0.55 }));
    });
    // nodes
    Object.keys(net.nodes).forEach(function (id) {
      var n = net.nodes[id], p = pos[id];
      var g = svgEl('g', {});
      var fill = n.kind === 'det' ? '#0f766e' : '#b45309';
      g.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: n.r, fill: fill, 'fill-opacity': 0.18, stroke: fill, 'stroke-width': 2 }));
      var label = svgEl('text', { x: p.x, y: p.y - 2, 'text-anchor': 'middle', 'class': 'net-node-label' });
      label.textContent = n.kind === 'det' ? DET_LABELS[id] : METRIC_LABELS[id];
      g.appendChild(label);
      var val = svgEl('text', { x: p.x, y: p.y + 10, 'text-anchor': 'middle', 'class': 'net-node-val' });
      val.textContent = n.kind === 'det' ? f1(n.value) : nodeValueText(id);
      g.appendChild(val);
      if (previewFx && n.delta) {
        var up = n.delta > 0;
        var chip = svgEl('text', { x: p.x + n.r + 4, y: p.y - n.r - 2, 'class': 'net-chip', fill: up ? '#0f766e' : '#b91c1c' });
        chip.textContent = up ? '▲' : '▼';
        g.appendChild(chip);
      }
      svg.appendChild(g);
    });
    var lg = $('network-legend');
    if (lg && !lg._done) {
      lg._done = true;
      lg.innerHTML = '<span>● inner ring: 8 Big Cycle determinants</span><span>● outer ring: live metrics</span><span class="text-teal-700">— positive edge</span><span class="text-red-700">— negative edge</span><span>▲/▼ predicted direction under hovered change</span>';
    }
  }
  function nodeValueText(id) {
    switch (id) {
      case 'gdp': return money(st.gdp_level);
      case 'unemployment': return pct(st.unemployment);
      case 'debt': return pct(st.debt_gdp);
      case 'homelessness': return kfmt(st.homelessness) + 'k';
      case 'overdoses': return kfmt(st.overdoses);
      case 'incarcerated': return f2(st.incarcerated) + 'M';
      case 'med_income': return '$' + kfmt(st.med_income);
      case 'sentiment': return f1(st.sentiment);
    }
    return '';
  }

  /* ---------------- party tab ---------------- */
  var SEAT_DEFS = [
    { key: 'house', label: 'House', size: 435, tip: 'party_house' },
    { key: 'senate', label: 'Senate', size: 100, tip: 'party_senate' },
    { key: 'governors', label: 'Governors', size: 50, tip: 'party_governors' }
  ];
  function renderParty() {
    var p = st.party;
    var sc = $('party-seats');
    sc.innerHTML = '';
    SEAT_DEFS.forEach(function (d) {
      var row = el('div', 'seat-row');
      var lab = el('span', 'text-stone-600', d.label);
      lab.setAttribute('data-tip', d.tip);
      row.appendChild(lab);
      var track = el('div', 'voter-track');
      var fill = el('div', 'voter-fill' + (p[d.key] / d.size < 0.45 ? ' low' : p[d.key] / d.size < 0.5 ? ' mid' : ''));
      fill.style.width = (p[d.key] / d.size * 100) + '%';
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el('span', 'text-right font-semibold', Math.round(p[d.key]) + ' / ' + d.size));
      sc.appendChild(row);
    });
    var pres = el('div', 'mt-2 text-xs');
    pres.innerHTML = 'White House: ' + (p.president ? '<span class="badge bg-teal-700 text-white" data-tip="party_president">held by your party</span>' : '<span class="badge bg-red-700 text-white">lost</span>');
    sc.appendChild(pres);
    var pcs = E.pcStats(st);
    var pcBasis = st.dualTrack ? 'shadow governing mandate' : 'party';
    $('party-pc-info').innerHTML = 'PC regen (sized to your ' + pcBasis + ') = 4 + House ' + f1((st.dualTrack ? st.shadowParty : p).house / 435 * 4) + ' + Senate ' + f1((st.dualTrack ? st.shadowParty : p).senate / 100 * 3) + ' + Govs ' + f1((st.dualTrack ? st.shadowParty : p).governors / 50 * 2) + ((st.dualTrack ? st.shadowParty : p).president ? ' + presidency 2' : '') +
      ' = <b>+' + f1(st.pcRegen || pcs.regen) + '/turn</b> · cap = 60 + 0.4×(House+Senate) = <b>' + Math.round(pcs.cap) + '</b>. Your real caucus: House ' + Math.round(p.house) + ', Senate ' + Math.round(p.senate) + ', Govs ' + Math.round(p.governors) + ' — it drifts toward your approval-implied share each quarter.';
    $('party-nextel').textContent = 'Next presidential: turn ' + E.nextPresElection(st.turn) + ' · next midterm: turn ' + nextMidterm(st.turn);

    var c = $('voter-table'); c.innerHTML = '';
    E.GROUP_IDS.forEach(function (g) {
      var v = st.approval[g];
      var row = el('div', 'voter-row');
      var lab = el('span', 'text-stone-600', VG.labels[g] + ' <span class="text-stone-400">(' + VG.weights[g] + ')</span>');
      lab.setAttribute('data-tip', 'group_' + g);
      row.appendChild(lab);
      var track = el('div', 'voter-track');
      var fill = el('div', 'voter-fill' + (v < 40 ? ' low' : v < 50 ? ' mid' : ''));
      fill.style.width = v + '%';
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el('span', 'text-right font-semibold', f1(v) + '%'));
      c.appendChild(row);
    });
    var poll = E.weightedApproval(st);
    $('el-poll').textContent = 'Weighted poll: ' + f1(poll) + '% ' + (poll >= 50 ? '✓' : '✗');
    $('el-poll').className = 'float-right ' + (poll >= 50 ? 'text-teal-800' : 'text-red-700');

    var eh = $('election-history');
    var hist = [];
    st.elections.forEach(function (e) {
      hist.push('<div class="' + (e.won ? 'text-teal-700' : 'text-red-700') + ' font-semibold">' +
        (e.won ? '✓ Kept' : '✗ Lost') + ' the White House, ' + e.year + ' — ' + f1(e.pct) + '% weighted approval</div>');
    });
    st.midterms.forEach(function (m) {
      hist.push('<div class="text-stone-600">Midterms ' + m.year + ' (approval ' + f1(m.pct) + '%): House ' +
        (m.dHouse >= 0 ? '+' : '') + m.dHouse + ' → ' + m.house + ', Senate ' + (m.dSenate >= 0 ? '+' : '') + m.dSenate + ' → ' + m.senate + ', Govs ' + (m.dGov >= 0 ? '+' : '') + m.dGov + ' → ' + m.governors + '</div>');
    });
    hist.sort(function () { return 0; });
    var noElect = st.dualTrack
      ? '<span class="text-stone-400">No elections held yet. Your new party first faces the voters at the ' + (clockYear() + 1) + ' midterms (turn ' + ((scenarioDef() && scenarioDef().midtermStart) || 8) + ') and the ' + (clockYear() + 3) + ' presidential (turn ' + ((scenarioDef() && scenarioDef().electionStart) || 16) + '). Losing the presidency does not end a new party — it keeps organizing.</span>'
      : '<span class="text-stone-400">No elections held yet. First midterm at turn 12 (Q4 2010), first presidential at turn 20 (Q4 2012).</span>';
    eh.innerHTML = hist.length ? hist.join('') : noElect;

    // campaign actions — available EVERY turn; ×1.5 in campaign windows
    var open = E.campaignOpen(st);
    $('camp-funds').textContent = '$' + Math.floor(st.funds) + 'M funds';
    $('camp-status').textContent = open
      ? 'CAMPAIGN WINDOW OPEN (turns ' + (E.nextPresElection(st.turn) - 3) + '–' + E.nextPresElection(st.turn) + '): effects ×1.5. Diminishing returns ×0.85ⁿ per repeat.'
      : 'Bloc courting is available every turn (×0.85ⁿ diminishing returns); effects ×1.5 in campaign windows.';
    var ca = $('campaign-actions');
    ca.innerHTML = '';
    Object.keys(E.CAMPAIGN).forEach(function (id) {
      var a = E.CAMPAIGN[id];
      var used = st.campaignUsed[id] || 0;
      var b = el('button', 'btn-primary !text-xs !py-2',
        esc(a.name) + '<br><span class="font-normal opacity-80">$' + a.cost + 'M' + (used ? ' · used ×' + used : '') + '</span>');
      b.disabled = st.over || st.funds < a.cost;
      b.addEventListener('click', function () {
        var res = E.applyCampaign(st, id);
        toast(res.msg, !res.ok);
        render();
      });
      ca.appendChild(b);
    });
  }
  function nextMidterm(t) {
    var sc = scenarioDef();
    var m = (sc && sc.midtermStart) || 12;
    var cyc = (sc && sc.electionCycle) || 16;
    while (m <= t) m += cyc;
    return m;
  }

  /* ---------------- v0.4: ACTUAL-track influence actions ---------------- */
  function renderInfluence() {
    var card = $('influence-card');
    if (!card) return;
    card.style.display = st.dualTrack ? '' : 'none';
    if (!st.dualTrack) return;
    $('influ-pts').textContent = 'Influence: ' + Math.floor(st.influence) + ' (+' + st.influencePerTurn + '/turn, cap ' + st.influenceCap + ')';
    var box = $('influence-actions');
    box.innerHTML = '';
    Object.keys(E.INFLUENCE).forEach(function (id) {
      var a = E.INFLUENCE[id];
      var used = (st.influenceLog || []).filter(function (x) { return x.action === a.name; }).length;
      var b = el('button', 'btn-primary !text-xs !py-2 !bg-indigo-700 hover:!bg-indigo-800',
        esc(a.name) + '<br><span class="font-normal opacity-80">' + a.cost + ' Influence' + (used ? ' · used ×' + used : '') + '</span>');
      b.disabled = st.over || st.influence < a.cost;
      b.title = a.blurb;
      b.addEventListener('click', function () {
        var res = E.applyInfluence(st, id);
        toast(res.msg, !res.ok);
        render();
      });
      box.appendChild(b);
    });
  }

  /* ---------------- report tab ---------------- */
  function renderReport() {
    var tb = document.querySelector('#det-compare tbody');
    tb.innerHTML = '';
    var s0d = scenarioStartState().determinants;
    E.DET_IDS.forEach(function (d) {
      var s0 = s0d[d], now = st.det[d], delta = now - s0;
      var tr = el('tr', 'border-b border-stone-100');
      tr.appendChild(el('td', 'font-medium text-stone-600', DET_LABELS[d]));
      tr.appendChild(el('td', '', f1(s0)));
      tr.appendChild(el('td', '', f1(now)));
      tr.appendChild(el('td', delta >= 0 ? 'delta-pos' : 'delta-neg', (delta >= 0 ? '+' : '') + f1(delta)));
      tb.appendChild(tr);
    });

    var log = $('turn-log');
    log.innerHTML = '';
    if (!st.log.length) {
      log.appendChild(el('p', 'text-xs text-stone-400', 'No turns played yet. Advance quarters to build the cause→effect log.'));
    }
    st.log.slice().reverse().forEach(function (entry) {
      var box = el('div', 'log-turn');
      box.appendChild(el('h4', null, 'Turn ' + entry.turn + ' — ' + entry.label));
      var ul = el('ul');
      entry.items.forEach(function (it) { ul.appendChild(el('li', null, esc(it))); });
      box.appendChild(ul);
      log.appendChild(box);
    });

    var nl = $('news-log');
    nl.innerHTML = '';
    if (!st.newsLog.length) {
      nl.appendChild(el('p', 'text-xs text-stone-400', 'No news yet. The strip above the footer fires every turn.'));
    }
    st.newsLog.slice().reverse().forEach(function (n) {
      nl.appendChild(el('div', 'news-log-item',
        '<span class="lane lane-' + n.lane + '">' + n.lane + '</span><span class="text-stone-400">T' + n.turn + '</span> ' + esc(n.text)));
    });
  }

  function download(filename, text, mime) {
    try {
      var blob = new Blob([text], { type: mime });
      var url = URL.createObjectURL(blob);
      var a = el('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
    } catch (e) {
      window.open('data:' + mime + ',' + encodeURIComponent(text), '_blank');
    }
  }
  $('dl-csv').addEventListener('click', function () { download('polisim_turn_history.csv', E.exportCSV(st), 'text/csv'); });
  $('dl-json').addEventListener('click', function () { download('polisim_report.json', E.exportJSON(st), 'application/json'); });

  /* ---------------- news strip ---------------- */
  var newsIdx = 0, newsTimer = null;
  function tickNews() {
    var items = st.newsLog.slice(-24);
    var box = $('news-item');
    if (!items.length) {
      box.innerHTML = '<span class="lane lane-hist">info</span>Welcome to PoliSim-DBE. Advance the quarter to generate headlines.';
      return;
    }
    var n = items[newsIdx % items.length];
    newsIdx++;
    box.innerHTML = '<span class="lane lane-' + n.lane + '">' + n.lane + '</span><span class="text-stone-400">T' + n.turn + '</span> ' + esc(n.text);
  }
  function startTicker() {
    if (newsTimer) clearInterval(newsTimer);
    newsTimer = setInterval(tickNews, 4000);
    tickNews();
  }
  $('news-strip').addEventListener('mouseenter', function () { if (newsTimer) { clearInterval(newsTimer); newsTimer = null; } });
  $('news-strip').addEventListener('mouseleave', function () { startTicker(); });

  /* ---------------- charts ---------------- */
  var SIM_COLOR = '#0f766e', ACT_COLOR = '#a8a29e', REP_COLOR = '#b91c1c', DEM_COLOR = '#1d4ed8';
  function chartLen() { return Math.max(41, st.turn + 1, histLastTurn() + 1); }
  function labelsN(n) {
    var L = [];
    var cy = clockYear();
    for (var t = 0; t < n; t++) {
      if (t === 0) { L.push("Q4 '" + String(cy - 1).slice(2)); continue; }
      var y = cy + Math.floor((t - 1) / 4), q = ((t - 1) % 4) + 1;
      L.push('Q' + q + " '" + String(y).slice(2));
    }
    return L;
  }
  /* actual series: annual HISTORY placed at Q4 positions (turn 4 = clockYear …).
     In dual-track scenarios the scripted per-turn ACTUAL track is used instead. */
  var ACTUAL_KEYMAP = { gdp_level: 'real_gdp_bn_chained2017', debt_gdp: 'debt_to_gdp_pct', unemployment: 'unemployment_pct', homelessness: 'homelessness_pit' };
  function actualSeries(metricKey) {
    var arr = new Array(chartLen()).fill(null);
    if (st.dualTrack && st.actual && ACTUAL_KEYMAP[metricKey]) {
      arr[0] = scenarioStartState()[metricKey];
      st.actual.history.forEach(function (h) { arr[h.turn] = h[ACTUAL_KEYMAP[metricKey]] !== undefined ? h[ACTUAL_KEYMAP[metricKey]] : null; });
      return arr;
    }
    var key = ACTUAL_KEYMAP[metricKey] || metricKey;
    if (!H[key]) return arr;
    var cy = clockYear();
    arr[0] = H[key][String(cy - 1)] !== undefined ? H[key][String(cy - 1)] : null;
    for (var y = cy; y <= cy + 17; y++) {
      var t = (y - cy + 1) * 4;
      if (t >= arr.length) break;
      arr[t] = H[key][String(y)] !== undefined ? H[key][String(y)] : null;
    }
    return arr;
  }
  function simSeries(fn, startVal) {
    var arr = new Array(chartLen()).fill(null);
    arr[0] = startVal;
    st.snapshots.forEach(function (s, i) { arr[i + 1] = fn(s, i); });
    return arr;
  }

  function makeChart(id, simData, actData, label) {
    if (!hasCharts) return;
    var ctx = $(id);
    if (!ctx) return;
    charts[id] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labelsN(chartLen()),
        datasets: [
          { label: 'Simulated', data: simData, borderColor: SIM_COLOR, backgroundColor: SIM_COLOR, borderWidth: 2, pointRadius: 0, tension: 0.25, spanGaps: true },
          { label: label || 'Actual (US history)', data: actData, borderColor: ACT_COLOR, backgroundColor: ACT_COLOR, borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0, tension: 0.25, spanGaps: true }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        interaction: { intersect: false, mode: 'index' },
        scales: {
          x: { ticks: { maxTicksLimit: 10, font: { size: 9 } }, grid: { display: false } },
          y: { ticks: { font: { size: 9 } }, grid: { color: '#f5f5f4' } }
        },
        plugins: { legend: { labels: { boxWidth: 10, font: { size: 9 } } } }
      }
    });
  }
  function updateChart(id, simData, actData) {
    var ch = charts[id];
    if (!ch) return;
    var want = chartLen();
    if (ch.data.labels.length !== want) ch.data.labels = labelsN(want);
    ch.data.datasets[0].data = simData;
    if (actData) ch.data.datasets[1].data = actData;
    ch.update('none');
  }

  function buildCharts() {
    var s0 = scenarioStartState();
    makeChart('ch-gdp', simSeries(function (s) { return s.gdp_level; }, s0.gdp_level), actualSeries('gdp_level'));
    makeChart('ch-debt', simSeries(function (s) { return s.debt_gdp; }, s0.debt_gdp), actualSeries('debt_gdp'));
    makeChart('ch-unemp', simSeries(function (s) { return s.unemployment; }, s0.unemployment), actualSeries('unemployment'));
    makeChart('ch-homeless', simSeries(function (s) { return s.homelessness; }, s0.homelessness), actualSeries('homelessness'));
    makePollChart();
  }
  function makePollChart() {
    var player = simSeries(function (s, i) { return st.pollHistory[i + 1] ? st.pollHistory[i + 1].pct : null; }, st.pollHistory[0].pct);
    if (!st.dualTrack || !SCENARIO_2016) {
      makeChart('ch-poll', player, null, '');
      if (charts['ch-poll']) {
        charts['ch-poll'].data.datasets[1].hidden = true;
        charts['ch-poll'].options.scales.y.min = 0;
        charts['ch-poll'].options.scales.y.max = 100;
        charts['ch-poll'].update('none');
      }
      return;
    }
    // dual-track: three-line polling — Republican & Democrat actuals + yours
    var n = chartLen();
    function pollArr(vals) {
      var a = new Array(n).fill(null);
      for (var t = 0; t < n && t < vals.length; t++) a[t] = vals[t];
      return a;
    }
    if (!hasCharts) return;
    var ctx = $('ch-poll');
    if (!ctx) return;
    charts['ch-poll'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labelsN(n),
        datasets: [
          { label: 'Your party (SIM)', data: player, borderColor: SIM_COLOR, backgroundColor: SIM_COLOR, borderWidth: 2.5, pointRadius: 0, tension: 0.25, spanGaps: true },
          { label: 'Republican (actual)', data: pollArr(SCENARIO_2016.polling.republican), borderColor: REP_COLOR, backgroundColor: REP_COLOR, borderWidth: 1.5, pointRadius: 0, tension: 0.25, spanGaps: true },
          { label: 'Democrat (actual)', data: pollArr(SCENARIO_2016.polling.democrat), borderColor: DEM_COLOR, backgroundColor: DEM_COLOR, borderWidth: 1.5, pointRadius: 0, tension: 0.25, spanGaps: true }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        interaction: { intersect: false, mode: 'index' },
        scales: {
          x: { ticks: { maxTicksLimit: 10, font: { size: 9 } }, grid: { display: false } },
          y: { min: 0, max: 100, ticks: { font: { size: 9 } }, grid: { color: '#f5f5f4' } }
        },
        plugins: { legend: { labels: { boxWidth: 10, font: { size: 9 } } } }
      }
    });
  }
  function updateCharts() {
    var s0 = scenarioStartState();
    updateChart('ch-gdp', simSeries(function (s) { return s.gdp_level; }, s0.gdp_level), actualSeries('gdp_level'));
    updateChart('ch-debt', simSeries(function (s) { return s.debt_gdp; }, s0.debt_gdp), actualSeries('debt_gdp'));
    updateChart('ch-unemp', simSeries(function (s) { return s.unemployment; }, s0.unemployment), actualSeries('unemployment'));
    updateChart('ch-homeless', simSeries(function (s) { return s.homelessness; }, s0.homelessness), actualSeries('homelessness'));
    if (charts['ch-poll']) {
      var want = chartLen();
      if (charts['ch-poll'].data.labels.length !== want) charts['ch-poll'].data.labels = labelsN(want);
      var arr = new Array(want).fill(null);
      st.pollHistory.forEach(function (p, i) { arr[i] = p.pct; });
      charts['ch-poll'].data.datasets[0].data = arr;
      // rebuild if the track mode changed (dualTrack toggles dataset count)
      if (st.dualTrack && charts['ch-poll'].data.datasets.length === 2) { makePollChart(); return; }
      if (!st.dualTrack && charts['ch-poll'].data.datasets.length === 3) { makePollChart(); return; }
      if (st.dualTrack && SCENARIO_2016) {
        charts['ch-poll'].data.datasets[1].data = SCENARIO_2016.polling.republican.slice(0, want);
        charts['ch-poll'].data.datasets[2].data = SCENARIO_2016.polling.democrat.slice(0, want);
      }
      charts['ch-poll'].update('none');
    }
  }

  /* ---------------- overlay (game over) ---------------- */
  function showOverlay() {
    var pw = E.computePower(st), ph = E.phaseOf(pw.S);
    $('ov-title').textContent = '🏛️ Game Over';
    $('ov-body').textContent = st.overReason || '';
    $('ov-stats').textContent =
      'Turns served : ' + st.turn + ' (' + st.year + ')\n' +
      'Real GDP     : ' + money(st.gdp_level) + ' (growth ' + f2(st.growth) + '%)\n' +
      'Unemployment : ' + pct(st.unemployment) + '\n' +
      'Debt / GDP   : ' + pct(st.debt_gdp) + '\n' +
      'Power score  : ' + f1(pw.S) + ' → ' + ph.name + '\n' +
      'Seats        : House ' + Math.round(st.party.house) + '/435 · Senate ' + Math.round(st.party.senate) + '/100 · Govs ' + Math.round(st.party.governors) + '/50\n' +
      'Elections    : ' + (st.elections.map(function (e) { return e.year + ' ' + (e.won ? 'won' : 'lost') + ' (' + f1(e.pct) + '%)'; }).join(', ') || 'none');
    $('overlay').classList.remove('hidden');
  }
  $('ov-new').addEventListener('click', function () { newGame(); });
  $('ov-report').addEventListener('click', function () {
    $('overlay').classList.add('hidden');
    document.querySelector('button[data-tab="report"]').click();
  });

  /* ---------------- game flow ---------------- */
  function render() {
    renderHeader();
    renderStatCards();
    renderMetricsTable();
    renderGauges();
    renderPolicies();
    renderBudget();
    renderNetwork();
    renderParty();
    renderInfluence();
    renderReport();
    updateCharts();
  }

  /* ---- scenario picker (v0.4) ---- */
  var scenarioPickInited = false;
  function buildScenarioPicker() {
    var box = $('scenario-cards');
    box.innerHTML = '';
    if (!SCENARIOS) return;
    Object.keys(SCENARIOS).forEach(function (id) {
      var sc = SCENARIOS[id];
      var card = el('button', 'text-left border border-stone-300 rounded-lg p-4 hover:border-teal-600 hover:bg-teal-50 transition-colors');
      var badge = sc.dualTrack ? '<span class="badge bg-indigo-700 text-white !text-[10px]">DUAL-TRACK</span>' : '<span class="badge bg-stone-500 text-white !text-[10px]">CLASSIC</span>';
      card.innerHTML = '<div class="flex items-center justify-between mb-1"><span class="font-bold text-stone-800">' + esc(sc.name) + '</span>' + badge + '</div>' +
        '<p class="text-[11px] text-stone-500 leading-snug">' + esc(sc.tagline) + '</p>';
      card.addEventListener('click', function () {
        $('scenario-modal').classList.add('hidden');
        newGame(id);
      });
      box.appendChild(card);
    });
  }
  function openScenarioPicker(cancellable) {
    buildScenarioPicker();
    $('scenario-cancel').classList.toggle('hidden', !cancellable);
    $('scenario-modal').classList.remove('hidden');
  }
  $('scenario-cancel').addEventListener('click', function () { $('scenario-modal').classList.add('hidden'); });

  function newGame(scenarioId) {
    st = E.createGame(scenarioId);
    previewFx = null;
    $('overlay').classList.add('hidden');
    buildPolicyCards();
    buildBudgetRows();
    renderPreloaded();
    buildActTimelines();
    buildCharts();
    render();
    if (scenarioId === 'realign2016') {
      toast('The Realignment — Q4 2016. A new party with 5 House seats, 1 Senate seat, 3 governors and $300M. SIM shows what a mandate would do; ACTUAL nudges run underneath.');
    } else {
      toast('New game — your party takes office in Q1 2008, amid the Global Financial Crisis.');
    }
  }

  $('btn-next').addEventListener('click', function () {
    if (st.over) return;
    E.advanceTurn(st);
    render();
    if (st.over) showOverlay();
    else if (st.elections.length && st.elections[st.elections.length - 1].turn === st.turn) {
      var e = st.elections[st.elections.length - 1];
      toast('🗳️ ' + e.year + ' presidential election WON with ' + f1(e.pct) + '% weighted approval! +30 PC mandate.');
    } else if (st.midterms.length && st.midterms[st.midterms.length - 1].turn === st.turn) {
      var m = st.midterms[st.midterms.length - 1];
      toast('🗳️ Midterms ' + m.year + ': House ' + (m.dHouse >= 0 ? '+' : '') + m.dHouse + ', Senate ' + (m.dSenate >= 0 ? '+' : '') + m.dSenate + '.');
    }
  });
  $('btn-new').addEventListener('click', function () { openScenarioPicker(true); });

  /* ---------------- init ---------------- */
  buildPolicyCards();
  buildBudgetRows();
  renderPreloaded();
  buildActTimelines();
  buildCharts();
  render();
  startTicker();
  openScenarioPicker(false);
})();

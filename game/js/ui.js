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
  var ACT_BUDGET_LINKS = window.ACT_BUDGET_LINKS || { acts: {} };
  var ACT_STUDIO = window.ACT_STUDIO || null;   // v0.5 (WS5): Create-your-own-Act studio
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
  var WORLD = (typeof window.WORLD_POWERS !== 'undefined' && window.WORLD_POWERS) || null; // WS3: World Big Cycle dataset

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
  var currentTab = 'dashboard';   // v0.5.1: tracked so the event modal only auto-opens at home
  function activeTabName() {
    var b = document.querySelector('.tab-btn.tab-active');
    return b ? b.dataset.tab : currentTab;
  }
  $('tabs').addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-tab]');
    if (!b) return;
    currentTab = b.dataset.tab;
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
    updateEventBadge(); // v0.5: 📣 N events awaiting response
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
      // v0.5 (WS5): custom Acts join the shelf of their chosen category
      var actIds = cat.acts.slice();
      POLICIES.forEach(function (d) { if (d.cat === cat.id && actIds.indexOf(d.id) < 0) actIds.push(d.id); });
      var section = el('div', 'polcat mb-5');
      section.id = 'polcat-' + cat.id;
      var head = el('div', 'polcat-head');
      head.innerHTML = '<span class="polcat-bar" style="background:' + esc(cat.color) + '"></span>' +
        '<span class="polcat-name">' + esc(cat.name) + '</span>' +
        '<span class="polcat-count">' + actIds.length + ' Act' + (actIds.length > 1 ? 's' : '') + '</span>';
      section.appendChild(head);
      var inner = el('div', 'grid md:grid-cols-2 xl:grid-cols-3 gap-4');
      actIds.forEach(function (aid) {
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
      // v0.5: budget-impact strip (from ACT_BUDGET_LINKS config)
      var impact = el('p', 'text-[10px] mt-1 hidden');
      impact.id = 'polimpact-' + def.id;
      impact.setAttribute('data-tip', 'mech_links');
      card.appendChild(impact);
      // v0.4: repeal control — strips an in-force Act, effects unwind in reverse
      var rep = el('div', 'mt-1');
      rep.id = 'polrepeal-' + def.id;
      card.appendChild(rep);
      // v0.5 (WS5): custom Acts carry a delete control
      if (def.id.indexOf('custom_') === 0) {
        var delBtn = el('button', 'btn-ghost border border-stone-300 text-stone-500 !text-[11px] !py-1 !px-2 mt-1', '🗑 Delete custom Act');
        delBtn.id = 'poldel-' + def.id;
        delBtn.addEventListener('click', function () { deleteCustomAct(def.id); });
        card.appendChild(delBtn);
      }
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
          b.setAttribute('data-tip', 'mech_repeal');
          b.addEventListener('click', function () {
            var res = E.repealAct(st, def.id);
            toast(res.msg, !res.ok);
            render();
          });
          rw.appendChild(b);
          // v0.5: carrying/uncover warning under the repeal button
          var warn = el('p', 'text-[10px] text-red-600 mt-1 hidden', '');
          warn.id = 'polwarn-' + def.id;
          rw.appendChild(warn);
        }
        if (rw._built) rw.style.display = (inForce && !st.over) ? '' : 'none';
        // v0.5: dynamic warning — covered lines below baseline snap back on repeal
        var warn = $('polwarn-' + def.id);
        if (warn) {
          var carrying = [];
          if (ACT_BUDGET_LINKS.acts[def.id]) {
            ACT_BUDGET_LINKS.acts[def.id].links.forEach(function (lk) {
              if (lk.coeff <= 0 || (lk.option && ps.value !== lk.option)) return;
              var catId = lk.target.split('/')[0];
              var line = st.budget;
              var mult = line.mult[catId] !== undefined ? line.mult[catId] : 1;
              if (mult < 0.99 && !(line.deleted && line.deleted[catId])) carrying.push(catId);
              if (line.deleted && line.deleted[catId]) carrying.push(catId);
            });
          }
          carrying = carrying.filter(function (v, i, a) { return a.indexOf(v) === i; });
          if (inForce && carrying.length && (ps.ramp > 0.5 || ps.stalled)) {
            var cnames = carrying.map(function (id) {
              var c0 = BUDGET_CATS.find(function (x) { return x.id === id; });
              var m0 = st.budget.mult[id] !== undefined ? st.budget.mult[id] : 1;
              return (c0 ? c0.name : id) + ' (' + Math.round(m0 * 100) + '%)';
            });
            warn.textContent = '⚠ Carrying: ' + cnames.join(', ') + ' — repealing uncovers this need over ' + E.linkConsts().snapbackTurns + ' turns.';
            warn.classList.remove('hidden');
          } else warn.classList.add('hidden');
        }
      }
      // v0.5: "Budget impact" strip from the links config; rebuild each render
      // so option-gated chips dim/brighten with the player's current selection
      var bi = $('polimpact-' + def.id);
      if (bi) {
        var cfg = ACT_BUDGET_LINKS.acts[def.id];
        if (cfg && cfg.links.length) {
          var sel = (st.policies && st.policies[def.id] !== undefined) ? st.policies[def.id] : (def.def || null);
          var chips = cfg.links.map(function (lk) {
            var tgt = lk.target.replace('newsector:', '');
            var pct = Math.round(lk.coeff * 100);
            var gatedOff = lk.option && lk.option !== sel;
            var cls = 'bchip' + (lk.coeff < 0 ? ' neg' : '') + (gatedOff ? ' dim' : '');
            var opt = lk.option ? '<i>' + esc(lk.option) + ':</i> ' : '';
            return '<span class="' + cls + '" title="' + esc(lk.rationale || '') + '">' + opt + esc(tgt) + (lk.coeff < 0 ? ' ▲need' : ' ' + pct + '%') + '</span>';
          });
          bi.innerHTML = '<span class="text-stone-400">Budget impact:</span> ' + chips.join(' ');
          bi.classList.remove('hidden');
        } else bi.classList.add('hidden');
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
      // v0.5: redundancy badge + consolidate button (act↔budget links)
      var linkWrap = el('div', 'blink hidden');
      linkWrap.id = 'blinkwrap-' + cat.id;
      var linkBadge = el('span', 'blink-badge', '');
      linkBadge.id = 'blink-' + cat.id;
      linkBadge.setAttribute('data-tip', 'mech_links');
      var consBtn = el('button', 'bcons hidden', 'Consolidate');
      consBtn.id = 'bcons-' + cat.id;
      consBtn.title = 'Cut this line to the level your in-force Act actually covers (discounted PC, reduced backlash)';
      (function (cat, consBtn) {
        consBtn.addEventListener('click', function () {
          var target = E.consolidateTarget(st, cat.id);
          if (target === null) return;
          var res = target === 0 ? E.deleteBudgetCat(st, cat.id) : E.applyBudget(st, cat.id, target);
          toast(res.msg, !res.ok);
          render();
        });
      })(cat, consBtn);
      linkWrap.appendChild(linkBadge);
      linkWrap.appendChild(consBtn);
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
      // v0.5: badge strip sits directly under its category row (not above,
      // where it could be misread as belonging to the previous category)
      c.appendChild(linkWrap);
      // v0.4: sub-department child rows
      if (cat.sub && cat.sub.length) {
        var subs = el('div', 'bsubs');
        subs.id = 'bsubs-' + cat.id;
        cat.sub.forEach(function (sd) {
          var srow = el('div', 'budget-row');
          srow.id = 'bsubrow-' + cat.id + '-' + sd.id;
          var sname = el('span', 'bname', esc(sd.name));
          sname.setAttribute('data-tip', 'budget_sub');
          var sbadge = el('span', 'blink-badge hidden', '');
          sbadge.id = 'bsublink-' + cat.id + '-' + sd.id;
          sname.appendChild(sbadge);
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
    // v0.5: act↔budget link badges + consolidate + uncovered-need banner
    var LK = E.computeLinks(st);
    var KC = E.linkConsts();
    function badgeText(rec, R, negRec) {
      if (negRec) return { cls: 'neg', txt: '▲ need raised by ' + negRec.actName };
      if (!rec || R < KC.badgePartial) return null;
      var pct = Math.round(R * 100);
      if (R >= KC.badgeFull) return { cls: 'full', txt: '◈ covered by ' + rec.actName + ' (' + pct + '%)' };
      return { cls: 'part', txt: '◈ partly covered (' + pct + '%)' };
    }
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
      // v0.5: parent link badge + consolidate button
      var ll = E.lineLink(st, L.id, LK);
      var b = badgeText(ll.rec, ll.R, ll.neg);
      var bwrap = $('blinkwrap-' + L.id);
      if (bwrap) {
        var bb = $('blink-' + L.id);
        bwrap.classList.toggle('hidden', !b);
        if (b) {
          bb.textContent = b.txt;
          bb.className = 'blink-badge ' + b.cls;
          bb.title = ll.rec && ll.rec.rationale ? ll.rec.rationale : '';
        }
        var cons = $('bcons-' + L.id);
        if (cons) {
          var target = E.consolidateTarget(st, L.id);
          cons.classList.toggle('hidden', target === null || L.deleted || L.mult < 0.99 || st.over);
          if (target !== null) cons.textContent = target === 0 ? 'Consolidate: zero it' : 'Consolidate: ' + Math.round(target * 100) + '%';
        }
      }
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
          // v0.5: child link badge
          var sbg = $('bsublink-' + L.id + '-' + S.id);
          if (sbg) {
            var crec = LK.pos[L.id + '/' + S.id];
            var cneg = LK.neg[L.id + '/' + S.id] || LK.neg[L.id];
            var cb = badgeText(crec, crec ? crec.R : 0, cneg);
            sbg.classList.toggle('hidden', !cb);
            if (cb) {
              sbg.textContent = ' ' + cb.txt;
              sbg.className = 'blink-badge ' + cb.cls;
              sbg.title = crec && crec.rationale ? crec.rationale : '';
            }
          }
        });
      }
    });
    // v0.5: UNCOVERED NEED banner (covering act stalled/repealed while line is cut)
    var ub = $('uncovered-banner');
    if (ub) {
      var snaps = Object.keys(st.linkSnap || {});
      if (snaps.length && !st.over) {
        var names = snaps.map(function (k) {
          var catId = k.split('/')[0];
          var cat = BUDGET_CATS.find(function (c) { return c.id === catId; });
          var lbl = cat ? cat.name : k;
          var sb = st.linkSnap[k];
          return '<b>' + esc(lbl) + '</b> uncovered (' + sb.left + ' turn' + (sb.left > 1 ? 's' : '') + ' of cushion left)';
        });
        ub.innerHTML = '⚠ <b>UNCOVERED NEED</b> — ' + names.join('; ') +
          '. The covering Act is no longer in force and these lines are below baseline; full impact lands when the cushion expires. Emergency restore: ⟲ on the line (5 PC, no backlash).';
        ub.classList.remove('hidden');
      } else ub.classList.add('hidden');
    }
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

    // v0.5: Public Statements — the reviewable record of the player's voice
    var scard = $('stmt-card'), sl = $('stmt-log');
    if (scard && sl) {
      if (st.eventLog && st.eventLog.length) {
        scard.classList.remove('hidden');
        sl.innerHTML = '';
        st.eventLog.slice().reverse().forEach(function (e) {
          var gparts = Object.keys(e.groups || {}).map(function (g) {
            var v = e.groups[g];
            return ((VG.labels && VG.labels[g]) || g) + ' ' + (v > 0 ? '+' : '') + v;
          });
          var extra = [];
          if (e.sentiment) extra.push('sentiment ' + (e.sentiment > 0 ? '+' : '') + e.sentiment);
          if (e.legitimacy) extra.push('legitimacy ' + (e.legitimacy > 0 ? '+' : '') + e.legitimacy);
          if (extra.length) gparts.push(extra.join(', '));
          sl.appendChild(el('div', 'news-log-item',
            '<span class="lane lane-event">' + (e.optionId === 'no_comment' ? 'silent' : 'stmt') + '</span>' +
            '<span class="text-stone-400">T' + e.turn + '</span> <b>' + esc(e.label) + '</b> — ' +
            esc(gparts.join(', ') || 'no measurable bloc movement')));
        });
      } else scard.classList.add('hidden');
    }
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

  /* ---------------- World Big Cycle (WS3) ---------------- */
  var WORLD_NATIONS = [
    { id: 'usa', name: 'USA', color: '#0f766e', width: 3 },
    { id: 'china', name: 'China', color: '#dc2626', width: 1.5 },
    { id: 'eu', name: 'EU', color: '#2563eb', width: 1.5 },
    { id: 'india', name: 'India', color: '#ea580c', width: 1.5 },
    { id: 'russia', name: 'Russia', color: '#7c3aed', width: 1.5 },
    { id: 'japan', name: 'Japan', color: '#57534e', width: 1.5 }
  ];
  var WORLD_SIM_COLOR = '#059669', WORLD_ACT_COLOR = '#9ca3af', WORLD_TOP_S = 58;
  /* Fractional clock year of a sim turn. engine.turnToYear is not exported, so
     mirror the scenario clock: gfc2008 turn 1 = Q1 2008 → 2008 + (t−1)/4;
     realign2016 turn 0 = Q4 2016 → 2016 + t/4. */
  function worldSimYear(turn) {
    if (st.dualTrack) return 2016 + turn / 4;
    return clockYear() + (turn - 1) / 4;
  }
  function detMean8(det) {
    if (!det) return null;
    var sum = 0, n = 0;
    E.DET_IDS.forEach(function (d) {
      var v = det[d];
      if (v === null || v === undefined) return;
      sum += v; n++;
    });
    return n ? Math.round(sum / n * 10) / 10 : null;
  }
  function worldNationSeries(nid) {
    var pts = [];
    var comp = WORLD && WORLD.composite && WORLD.composite[nid];
    if (!comp) return pts;
    Object.keys(comp).sort().forEach(function (y) {
      if (comp[y] !== null && comp[y] !== undefined) pts.push({ x: +y, y: comp[y] });
    });
    return pts;
  }
  function worldSimSeries() {
    var pts = [];
    if (!st.snapshots || !st.snapshots.length) return pts;
    st.snapshots.forEach(function (s) {
      var S = detMean8(s.det);
      if (S === null) return;
      pts.push({ x: worldSimYear(s.turn), y: S });
    });
    return pts;
  }
  function worldActualSeries() {
    // dual-track only: scripted ACTUAL USA from SCENARIO_2016.byTurn, turns 0-36
    var pts = [];
    if (!st.dualTrack || !SCENARIO_2016 || !SCENARIO_2016.byTurn) return pts;
    for (var t = 0; t <= 36; t++) {
      var rec = SCENARIO_2016.byTurn[String(t)];
      var S = rec ? detMean8(rec.det) : null;
      if (S === null) continue;
      pts.push({ x: 2016 + t / 4, y: S });
    }
    return pts;
  }
  function worldXMax() {
    var mx = Math.max(2024, Math.ceil(worldSimYear(Math.max(st.turn, 1))));
    if (st.dualTrack) mx = Math.max(mx, 2025); // scripted ACTUAL runs turns 0-36 → 2025
    return mx;
  }

  function makeWorldLine() {
    if (!hasCharts || !WORLD || !WORLD.composite) return;
    var ctx = $('ch-world');
    if (!ctx) return;
    var xMax = worldXMax();
    // v0.5.1 dual axes: the dataset nations are normalized cross-country
    // (USA 2008 S=58.8); the game-scale overlays run ~19 pts hot. Showing both
    // axes makes the calibration gap explicit instead of hiding it.
    var datasets = WORLD_NATIONS.map(function (n) {
      return { label: n.name, data: worldNationSeries(n.id), borderColor: n.color, backgroundColor: n.color, borderWidth: n.width, pointRadius: 0, tension: 0.25, fill: false, spanGaps: true, yAxisID: 'y' };
    });
    datasets.push({ label: 'The Top threshold (58)', data: [{ x: 2000, y: WORLD_TOP_S }, { x: xMax, y: WORLD_TOP_S }], borderColor: '#a8a29e', backgroundColor: '#a8a29e', borderWidth: 1.5, borderDash: [6, 4], pointRadius: 0, tension: 0, fill: false, yAxisID: 'y' });
    datasets.push({ label: 'USA — your simulation (game scale)', data: worldSimSeries(), borderColor: WORLD_SIM_COLOR, backgroundColor: WORLD_SIM_COLOR, borderWidth: 3, pointRadius: 2, tension: 0.25, fill: false, spanGaps: true, yAxisID: 'y1' });
    if (st.dualTrack) datasets.push({ label: 'USA — ACTUAL scripted (game scale)', data: worldActualSeries(), borderColor: WORLD_ACT_COLOR, backgroundColor: WORLD_ACT_COLOR, borderWidth: 2, borderDash: [6, 4], pointRadius: 0, tension: 0.25, fill: false, spanGaps: true, yAxisID: 'y1' });
    charts['ch-world'] = new Chart(ctx, {
      type: 'line',
      data: { datasets: datasets },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        interaction: { intersect: false, mode: 'nearest' },
        scales: {
          x: {
            type: 'linear', min: 2000, max: xMax,
            ticks: { stepSize: 4, font: { size: 9 }, callback: function (v) { return String(v); } },
            grid: { color: '#f5f5f4' }
          },
          y: {
            min: 0, max: 100,
            title: { display: true, text: 'Dataset S (cross-country)', font: { size: 9 } },
            ticks: { font: { size: 9 } }, grid: { color: '#f5f5f4' }
          },
          y1: {
            min: 0, max: 100, position: 'right',
            title: { display: true, text: 'Game power S (sim/act)', font: { size: 9 }, color: '#0f766e' },
            ticks: { font: { size: 9 }, color: '#0f766e' },
            grid: { drawOnChartArea: false }
          }
        },
        plugins: { legend: { labels: { boxWidth: 10, font: { size: 9 } } } }
      }
    });
  }
  function updateWorldLine() {
    var note = $('world-sim-note');
    var simPts = worldSimSeries();
    // before the first turn there is no simulation trace — show the placeholder
    if (note) note.classList.toggle('hidden', simPts.length > 0);
    var ch = charts['ch-world'];
    if (!ch) return;
    // rebuild if the track mode changed (dualTrack toggles the scripted dataset)
    var wantN = WORLD_NATIONS.length + 2 + (st.dualTrack ? 1 : 0);
    if (ch.data.datasets.length !== wantN) { ch.destroy(); delete charts['ch-world']; makeWorldLine(); return; }
    var xMax = worldXMax();
    ch.options.scales.x.max = xMax;
    WORLD_NATIONS.forEach(function (n, i) { ch.data.datasets[i].data = worldNationSeries(n.id); });
    ch.data.datasets[WORLD_NATIONS.length].data = [{ x: 2000, y: WORLD_TOP_S }, { x: xMax, y: WORLD_TOP_S }];
    ch.data.datasets[WORLD_NATIONS.length + 1].data = simPts;
    if (st.dualTrack) ch.data.datasets[WORLD_NATIONS.length + 2].data = worldActualSeries();
    ch.update('none');
  }

  function worldRadarNation() {
    var sel = $('world-radar-nation');
    var nid = sel ? sel.value : 'usa';
    var years = (WORLD && WORLD.det && WORLD.det[nid]) ? Object.keys(WORLD.det[nid]).sort() : [];
    if (!years.length) return null;
    var y = String(st.year);
    if (!WORLD.det[nid][y]) y = years[years.length - 1]; // year missing -> latest available
    var name = nid;
    WORLD_NATIONS.forEach(function (n) { if (n.id === nid) name = n.name; });
    return { id: nid, name: name, year: +y, det: WORLD.det[nid][y] };
  }
  function makeWorldRadar() {
    if (!hasCharts || !WORLD || !WORLD.det) return;
    var ctx = $('ch-world-radar');
    if (!ctx) return;
    charts['ch-world-radar'] = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: E.DET_IDS.map(function (d) { return DET_LABELS[d]; }),
        datasets: [
          { label: 'Your America (now)', data: [], borderColor: SIM_COLOR, backgroundColor: 'rgba(15,118,110,0.15)', borderWidth: 2, pointRadius: 2 },
          { label: '—', data: [], borderColor: WORLD_ACT_COLOR, backgroundColor: 'rgba(156,163,175,0.15)', borderWidth: 1.5, pointRadius: 2 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        scales: { r: { min: 0, max: 100, ticks: { display: false }, pointLabels: { font: { size: 9 } } } },
        plugins: { legend: { labels: { boxWidth: 10, font: { size: 9 } } } }
      }
    });
    updateWorldRadar();
  }
  function updateWorldRadar() {
    var ch = charts['ch-world-radar'];
    if (!ch) return;
    var nat = worldRadarNation();
    ch.data.datasets[0].data = E.DET_IDS.map(function (d) { return st.det[d]; });
    ch.data.datasets[1].data = E.DET_IDS.map(function (d) { return nat && nat.det ? nat.det[d] : null; });
    ch.data.datasets[1].label = nat ? (nat.name + ' (' + nat.year + ')') : '—';
    ch.update('none');
  }

  /* phase chips use the engine's phaseOf() thresholds:
     The Rise ≥70, The Top ≥58, Early Decline ≥46, Late Decline ≥36, Reset <36 */
  function phaseChipClass(name) {
    if (name === 'The Rise') return 'phase-rise';
    if (name === 'The Top') return 'phase-top';
    if (name === 'Early Decline') return 'phase-early';
    if (name === 'Late Decline') return 'phase-late';
    return 'phase-reset';
  }
  function worldStandingHTML(name, color, S) {
    var ph = E.phaseOf(S);
    return '<span class="world-standing">' +
      '<span class="world-dot" style="background:' + color + '"></span>' +
      '<b>' + esc(name) + '</b>&nbsp;S=' + f1(S) + '&nbsp;—&nbsp;' +
      '<span class="phase-chip ' + phaseChipClass(ph.name) + '">' + ph.name + '</span></span>';
  }
  function renderWorldStandings() {
    var box = $('world-standings');
    if (!box) return;
    if (!WORLD || !WORLD.S_latest) { box.innerHTML = ''; return; }
    var html = WORLD_NATIONS.map(function (n) {
      var S = WORLD.S_latest[n.id];
      return (S === null || S === undefined) ? '' : worldStandingHTML(n.name, n.color, S);
    }).join('');
    var simS = detMean8(st.det);
    if (simS !== null) html += worldStandingHTML('Your America:', WORLD_SIM_COLOR, simS);
    box.innerHTML = html;
  }

  function makeWorldCharts() { makeWorldLine(); makeWorldRadar(); }
  function updateWorldCharts() {
    if (!WORLD) return;
    updateWorldLine();
    updateWorldRadar();
    renderWorldStandings();
  }
  var radarSel = $('world-radar-nation');
  if (radarSel) radarSel.addEventListener('change', function () { updateWorldRadar(); });

  function buildCharts() {
    // v0.5: destroy existing Chart instances before rebinding canvases
    // (newGame re-runs buildCharts; Chart.js throws if a canvas is re-used)
    Object.keys(charts).forEach(function (id) {
      if (charts[id]) { charts[id].destroy(); delete charts[id]; }
    });
    var s0 = scenarioStartState();
    makeChart('ch-gdp', simSeries(function (s) { return s.gdp_level; }, s0.gdp_level), actualSeries('gdp_level'));
    makeChart('ch-debt', simSeries(function (s) { return s.debt_gdp; }, s0.debt_gdp), actualSeries('debt_gdp'));
    makeChart('ch-unemp', simSeries(function (s) { return s.unemployment; }, s0.unemployment), actualSeries('unemployment'));
    makeChart('ch-homeless', simSeries(function (s) { return s.homelessness; }, s0.homelessness), actualSeries('homelessness'));
    makePollChart();
    makeWorldCharts();
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
    updateWorldCharts();
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
    renderCompass();      // v0.5: 8-axis compass + labels
    renderCycleStage();   // v0.5: Big-Cycle stage + sub-cycle gauges
    renderParty();
    renderInfluence();
    renderReport();
    renderMarket();       // v0.5 (WS7): GLO-BUS-style real market panel
    updateCharts();
  }

  /* ---------------- market panel (v0.5, WS7) ---------------- */
  var MD = window.MARKET_DATA || null;
  var MKT_ALIAS = { FB: 'META' };   // realworld_events uses the pre-2022 ticker
  function mktEvents() {
    var RWE = window.REALWORLD_EVENTS || null;
    if (!RWE || !RWE.scenarios || !RWE.scenarios[st.scenario]) return {};
    return RWE.scenarios[st.scenario].marketEvents || {};
  }
  function mktLatestEvent(tk) {
    // most recent marketEvent (numeric turn key <= st.turn) matching ticker (alias-aware)
    var evs = mktEvents(), best = null, bestT = -1;
    Object.keys(evs).forEach(function (k) {
      var t = +k;
      if (isNaN(t) || t > st.turn || t <= bestT) return;
      (evs[k] || []).forEach(function (ev) {
        var et = MKT_ALIAS[ev.ticker] || ev.ticker;
        if (et === tk) { best = ev; bestT = t; }
      });
    });
    return best;
  }
  function mktLastPrice(prices, idx) {
    for (var i = Math.min(idx, prices.length - 1); i >= 0; i--) {
      if (prices[i] != null) return { p: prices[i], i: i };
    }
    return null;
  }
  function mktSpark(prices, idx) {
    var from = Math.max(0, idx - 11), pts = [];
    for (var i = from; i <= idx && i < prices.length; i++) if (prices[i] != null) pts.push({ i: i, p: prices[i] });
    if (pts.length < 2) return '';
    var lo = Infinity, hi = -Infinity;
    pts.forEach(function (q) { if (q.p < lo) lo = q.p; if (q.p > hi) hi = q.p; });
    var span = (hi - lo) || 1, n = idx - from || 1;
    var s = pts.map(function (q) {
      var x = ((q.i - from) / n * 100).toFixed(1);
      var y = (22 - (q.p - lo) / span * 20).toFixed(1);
      return x + ',' + y;
    }).join(' ');
    var col = pts[pts.length - 1].p >= pts[0].p ? '#0f766e' : '#dc2626';
    return '<svg viewBox="0 0 100 24" preserveAspectRatio="none"><polyline fill="none" stroke="' + col + '" stroke-width="1.5" points="' + s + '"/></svg>';
  }
  function mktChg(prices, idx) {
    if (idx <= 0 || prices[idx] == null || prices[idx - 1] == null) return null;
    return (prices[idx] - prices[idx - 1]) / prices[idx - 1] * 100;
  }
  function renderMarket() {
    var rowsEl = $('market-rows'), stripEl = $('market-strip');
    if (!rowsEl || !stripEl) return;
    rowsEl.innerHTML = ''; stripEl.innerHTML = '';
    var scn = MD && MD.scenarios && MD.scenarios[st.scenario];
    if (!scn) {
      rowsEl.appendChild(el('div', 'mkt-row mkt-empty',
        '<span class="mkt-note">Speculative branch — no real market data. Watch the [BIZ] wire in the news feed.</span>'));
      return;
    }
    var quarters = scn.quarters || [];
    var idx = Math.max(0, Math.min(st.turn, quarters.length - 1));
    var chips = [];
    // headline-only names (no price data in this scenario: BSC, LEH, old GM, FTT…)
    var seen = {};
    Object.keys(scn.tickers).forEach(function (k) { seen[k] = true; });
    var extra = [];
    var evs = mktEvents();
    Object.keys(evs).forEach(function (k) {
      if (isNaN(+k) || +k > st.turn) return;
      (evs[k] || []).forEach(function (ev) {
        var et = MKT_ALIAS[ev.ticker] || ev.ticker;
        if (!seen[et] && extra.indexOf(et) === -1) extra.push(et);
      });
    });
    var keys = Object.keys(scn.tickers).concat(extra);
    keys.forEach(function (tk) {
      var info = scn.tickers[tk] || null;
      var prices = info ? info.prices : [];
      var ev = mktLatestEvent(tk);
      var lp = prices.length ? mktLastPrice(prices, idx) : null;
      if (!lp && !ev) return;   // no prices and no headline: skip entirely
      var delistedFrom = info ? info.delistedFrom : null;
      var dlIdx = delistedFrom ? quarters.indexOf(delistedFrom) : -1;
      var delisted = dlIdx >= 0 && idx >= dlIdx;
      var chg = delisted ? 0 : (lp ? mktChg(prices, idx) : null);
      var name = info ? info.name : (ev.company || tk);
      var sector = info ? info.sector : (ev.sector || '');
      var priceTxt = lp ? '$' + esc(lp.p.toFixed(2)) : '—';
      var badge = delisted ? ' <span class="mkt-dl">DELISTED</span>' : '';
      var chgTxt = chg == null ? '—' : ((chg >= 0 ? '+' : '') + chg.toFixed(1) + '%');
      var chgCls = chg == null ? '' : (chg > 0.005 ? 'mkt-up' : (chg < -0.005 ? 'mkt-dn' : ''));
      var head = ev ? (esc(ev.headline.length > 90 ? ev.headline.slice(0, 89) + '…' : ev.headline) +
        (ev.marketNote ? '<span class="mkt-note">' + esc(ev.marketNote) + '</span>' : '')) : '<span class="mkt-note">—</span>';
      var row = el('div', 'mkt-row' + (delisted ? ' mkt-delisted' : ''));
      row.innerHTML =
        '<span class="mkt-name"><b>' + esc(tk) + '</b> ' + esc(name) + badge +
          '<small>' + esc(sector) + '</small></span>' +
        '<span class="mkt-px">' + priceTxt + '</span>' +
        '<span class="mkt-chg ' + chgCls + '">' + chgTxt + '</span>' +
        '<span class="mkt-spark">' + (prices.length ? mktSpark(prices, idx) : '') + '</span>' +
        '<span class="mkt-head">' + head + '</span>';
      rowsEl.appendChild(row);
      if (lp && !delisted) chips.push('<span class="mkt-chip">' + esc(tk) + ' <b>' + priceTxt + '</b> <i class="' + chgCls + '">' + chgTxt + '</i></span>');
    });
    if (chips.length) {
      var line = chips.join('');
      stripEl.innerHTML = '<div class="mkt-strip-track">' + line + line + '</div>';
    }
  }

  /* ---------------- political compass suite (v0.5) ---------------- */
  var CMP_COLORS = { STA: '#0e7490', LFT: '#dc2626', REG: '#d97706', OWN: '#7c3aed', HSP: '#65a30d', AUT: '#be123c', TRD: '#a16207', NTV: '#b91c1c' };
  var CMP = function () { return window.COMPASS; };
  function cmpAxesSafe() {
    if (!CMP()) return null;
    try { return CMP().compassReport(st); } catch (e) { return null; }
  }
  function renderCompass() {
    var rep = cmpAxesSafe();
    if (!rep) return;
    var axes = rep.axes, labels = rep.labels, META = window.COMPASS_META;
    // 4 label chips
    var lc = $('compass-labels');
    lc.innerHTML = '';
    [['structure', '🏛️ Structure'], ['governing', '⚖️ Governing'], ['economic', '💰 Economic'], ['social', '🌐 Social']].forEach(function (pair) {
      var chip = el('div', 'cmp-chip');
      chip.style.borderColor = '#99f6e4'; chip.style.background = '#f0fdfa'; chip.style.color = '#115e59';
      chip.innerHTML = esc(pair[1]) + '<small>' + esc(labels[pair[0]]) + '</small>';
      chip.setAttribute('data-tip', 'mech_compass');
      lc.appendChild(chip);
    });
    // 8 axis bars with baseline marker (grid: poles header spans all 3 cols)
    var bars = $('compass-bars');
    bars.innerHTML = '';
    META.axes.forEach(function (a) {
      var poles = META.poles[a];
      var v = axes[a];
      var base = (window.COMPASS_USA_BASELINE[a] !== undefined) ? window.COMPASS_USA_BASELINE[a] : 50;
      var dv = Math.round((v - base) * 10) / 10;
      var track = el('div', 'cmp-track');
      track.appendChild(el('div', 'cmp-mid'));
      var fill = el('div', 'cmp-fill');
      fill.style.left = '0'; fill.style.width = v + '%';
      fill.style.background = CMP_COLORS[a] || '#0f766e';
      fill.style.opacity = '0.75';
      track.appendChild(fill);
      var marker = el('div', 'cmp-marker');
      marker.style.left = base + '%';
      marker.style.borderColor = '#a8a29e';
      marker.title = 'USA baseline ' + base;
      track.appendChild(marker);
      var wrap = el('div', 'cmp-bar-row');
      var head = el('div', 'cmp-bar-poles cmp-span3',
        '<span>' + esc(poles[0]) + '</span><span class="font-bold">' + a + '</span><span>' + esc(poles[1]) + '</span>');
      wrap.appendChild(head);
      wrap.appendChild(el('div', 'text-[9px] font-bold text-stone-500 pt-0.5', a));
      wrap.appendChild(track);
      wrap.appendChild(el('div', 'cmp-val', f1(v) + (a !== 'HSP' && Math.abs(dv) >= 0.05 ?
        ' <span class="' + (dv > 0 ? 'delta-pos' : 'delta-neg') + ' text-[9px]">' + (dv > 0 ? '+' : '') + f1(dv) + '</span>' : '')));
      bars.appendChild(wrap);
    });
    // 2D plot: x = 100−LFT (Left↔Right), y = AUT (Authoritarian↑↔Libertarian↓)
    var plot = $('compass-plot');
    if (plot) {
      var s = '';
      var px = function (lft) { return 20 + (100 - lft) / 100 * 260; };
      var py = function (aut) { return 280 - aut / 100 * 260; };
      s += '<rect x="20" y="20" width="260" height="260" fill="#fafaf9" stroke="#d6d3d1"/>';
      s += '<line x1="150" y1="20" x2="150" y2="280" stroke="#d6d3d1"/><line x1="20" y1="150" x2="280" y2="150" stroke="#d6d3d1"/>';
      s += '<text x="272" y="146" font-size="8" fill="#a8a29e" text-anchor="end">Right</text>';
      s += '<text x="28" y="146" font-size="8" fill="#a8a29e">Left</text>';
      s += '<text x="154" y="30" font-size="8" fill="#a8a29e">Authoritarian</text>';
      s += '<text x="154" y="274" font-size="8" fill="#a8a29e">Libertarian</text>';
      // trail: last 12 quarters (axes are memoryless → recompute per snapshot)
      var trailPts = [];
      if (CMP()) {
        st.snapshots.slice(-12).forEach(function (snap) {
          try {
            var fake = { pol: st.pol, budget: st.budget, sectors: st.sectors, scenario: st.scenario,
              turn: snap.turn, outlays_bn: snap.outlays_bn, gdp_nominal: snap.gdp_nominal };
            var a2 = CMP().computeAxes(fake).axes;
            trailPts.push(px(a2.LFT) + ',' + py(a2.AUT));
          } catch (e) { /* snapshot lacks outlays before first advance */ }
        });
      }
      if (trailPts.length > 1) s += '<polyline points="' + trailPts.join(' ') + '" fill="none" stroke="#99f6e4" stroke-width="1.5"/>';
      var cx = px(axes.LFT), cy = py(axes.AUT);
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="6" fill="#0f766e" stroke="#fff" stroke-width="2"><title>LFT ' + f1(axes.LFT) + ' · AUT ' + f1(axes.AUT) + '</title></circle>';
      // baseline dot (USA archetype 8)
      s += '<circle cx="' + px(38) + '" cy="' + py(30) + '" r="3.5" fill="none" stroke="#a8a29e" stroke-width="1.5"/>';
      s += '<text x="' + (px(38) + 6) + '" y="' + (py(30) + 3) + '" font-size="7" fill="#a8a29e">USA baseline</text>';
      plot.innerHTML = s;
    }
    var cap = $('compass-caption');
    if (cap) cap.textContent = st.dualTrack ? 'Dual-track: the compass reads your SIM America; the scripted ACTUAL timeline has no policy levers.' : '';
    renderCompassFlow(rep);
  }
  function renderCompassFlow(rep) {
    var flow = $('compass-flow');
    if (!flow) return;
    function box(x, w, title, sub, color) {
      return '<rect x="' + x + '" y="26" width="' + w + '" height="52" rx="8" fill="#fff" stroke="' + color + '" stroke-width="1.5"/>' +
        '<text x="' + (x + w / 2) + '" y="46" font-size="10" font-weight="700" fill="' + color + '" text-anchor="middle">' + esc(title) + '</text>' +
        '<text x="' + (x + w / 2) + '" y="62" font-size="8" fill="#78716c" text-anchor="middle">' + esc(sub) + '</text>';
    }
    function arrow(x1, x2, y) {
      return '<line x1="' + x1 + '" y1="' + y + '" x2="' + (x2 - 7) + '" y2="' + y + '" stroke="#a8a29e" stroke-width="1.5"/>' +
        '<polygon points="' + x2 + ',' + y + ' ' + (x2 - 7) + ',' + (y - 4) + ' ' + (x2 - 7) + ',' + (y + 4) + '" fill="#a8a29e"/>';
    }
    var s = '<rect x="0" y="0" width="760" height="132" fill="none"/>';
    s += box(4, 150, 'Your inputs', '16 Acts · budget · sectors', '#0f766e');
    s += arrow(158, 196, 52);
    s += box(200, 130, '8 Compass axes', 'STA LFT REG OWN HSP AUT TRD NTV', '#0e7490');
    s += arrow(334, 372, 52);
    s += box(376, 190, '4 Government labels', (rep ? rep.labels.governing : '—') + ' · ' + (rep ? rep.labels.economic : '—'), '#7c3aed');
    // second row: determinants → cycle stage
    s += box(200, 130, '8 Determinants', 'education → reserve_fx', '#b45309');
    s += arrow(334, 372, 112);
    s += box(376, 190, 'Cycle stage', rep && rep.cycle ? rep.cycle.stage + (rep.cycle.provisional ? ' (provisional)' : '') : '—', '#b45309');
    // bridges
    s += '<line x1="265" y1="82" x2="265" y2="102" stroke="#d6d3d1" stroke-width="1.5" stroke-dasharray="3 3"/>' +
      '<polygon points="265,106 261,99 269,99" fill="#d6d3d1"/>' +
      '<line x1="76" y1="82" x2="76" y2="112" stroke="#d6d3d1" stroke-width="1.5" stroke-dasharray="3 3"/>' +
      '<line x1="76" y1="112" x2="196" y2="112" stroke="#d6d3d1" stroke-width="1.5" stroke-dasharray="3 3"/>' +
      '<polygon points="198,112 191,108 191,116" fill="#d6d3d1"/>' +
      '<text x="82" y="96" font-size="7" fill="#a8a29e">REG/AUT → governance → resource allocation</text>';
    flow.innerHTML = s;
  }
  function renderCycleStage() {
    if (!CMP()) return;
    var c;
    try { c = CMP().classifyCycleStage(st); } catch (e) { return; }
    var box = $('cycle-stage');
    if (!box) return;
    var colors = { 'New Order': '#7c3aed', 'The Rise': '#059669', 'The Top': '#0f766e', 'The Decline': '#b45309' };
    var trendTxt = c.trend === null ? 'trend n/a (<8 turns)' :
      'trend ' + (c.trend > 0 ? '+' : '') + f2(c.trend) + '/yr over ' + c.trendWindowTurns + 'q';
    var html = '<div class="flex flex-wrap items-center gap-2 mb-2">' +
      '<span class="stage-chip" style="background:' + (colors[c.stage] || '#57534e') + '22;color:' + (colors[c.stage] || '#57534e') + ';border:1px solid ' + (colors[c.stage] || '#57534e') + '55">Big-Cycle stage: ' + esc(c.stage) + '</span>' +
      (c.provisional ? '<span class="text-[10px] text-stone-400">provisional (level-only, &lt;12 turns)</span>' : '') +
      '<span class="text-[10px] text-stone-500">power index ' + f1(c.powerIndex) + ' · ' + esc(trendTxt) + '</span></div>';
    html += '<div class="grid grid-cols-3 gap-3 mb-2">';
    [['Debt cycle', c.subCycles.debt, 'Healthy → Unhealthy'],
     ['Internal order', c.subCycles.internal, 'Order → Disorder'],
     ['External order', c.subCycles.external, 'Peace → War*']].forEach(function (g) {
      var pct = Math.max(0, Math.min(100, g[1]));
      var col = pct >= 60 ? '#dc2626' : pct >= 35 ? '#d97706' : '#059669';
      html += '<div><div class="flex justify-between text-[10px] text-stone-500"><span>' + g[0] + '</span><span class="font-bold" style="color:' + col + '">' + f1(g[1]) + '</span></div>' +
        '<div class="gauge-track"><div class="gauge-fill" style="width:' + pct + '%;background:' + col + '"></div></div>' +
        '<div class="text-[8px] text-stone-400">' + g[2] + '</div></div>';
    });
    html += '</div>';
    if (c.markers.length) {
      html += '<div class="flex flex-wrap gap-1 items-center"><span class="text-[10px] text-stone-400 mr-1">Dalio markers lit:</span>' +
        c.markers.map(function (m) { return '<span class="marker-chip">' + m + '</span>'; }).join('') + '</div>';
    }
    box.innerHTML = html;
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
    eventModalOpen = false;              // v0.5: reset event popup state
    $('event-modal').classList.add('hidden');
    buildPolicyCards();
    buildBudgetRows();
    renderPreloaded();
    buildActTimelines();
    buildCharts();
    render();
    if (scenarioId === 'realign2016') {
      toast('The Realignment — Q4 2016. A new party with 5 House seats, 1 Senate seat, 3 governors and $300M. SIM shows what a mandate would do; ACTUAL nudges run underneath.');
    } else if (scenarioId === 'dbe2030') {
      toast('Dimensions Beyond Energy — Q1 2030. Net-electric fusion has been announced. Your party holds the presidency: manage the transition from scarcity to abundance.');
    } else {
      toast('New game — your party takes office in Q1 2008, amid the Global Financial Crisis.');
    }
  }

  $('btn-next').addEventListener('click', function () {
    if (st.over) return;
    var hadPending = (st.pendingEvents || []).length;
    E.advanceTurn(st);
    render();
    if (st.over) { showOverlay(); return; }
    // v0.5: events the player let lapse resolve as "no comment" inside advanceTurn
    if (hadPending && !(st.pendingEvents || []).length) toast('📣 No comment — the silence is noted.', true);
    else if (st.elections.length && st.elections[st.elections.length - 1].turn === st.turn) {
      var e = st.elections[st.elections.length - 1];
      toast('🗳️ ' + e.year + ' presidential election WON with ' + f1(e.pct) + '% weighted approval! +30 PC mandate.');
    } else if (st.midterms.length && st.midterms[st.midterms.length - 1].turn === st.turn) {
      var m = st.midterms[st.midterms.length - 1];
      toast('🗳️ Midterms ' + m.year + ': House ' + (m.dHouse >= 0 ? '+' : '') + m.dHouse + ', Senate ' + (m.dSenate >= 0 ? '+' : '') + m.dSenate + '.');
    }
    // v0.5: world-event popups open after election/midterm toasts (§3.6 ordering)
    maybeOpenEvent();
  });
  $('btn-new').addEventListener('click', function () { openScenarioPicker(true); });

  /* ---------------- world-event popup (v0.5) ---------------- */
  var eventModalOpen = false;
  function updateEventBadge() {
    var b = $('ev-pending-badge');
    if (!b) return;
    var n = (st.pendingEvents || []).length;
    if (n > 0 && !st.over && !eventModalOpen) {
      b.textContent = '📣 ' + n + ' event' + (n > 1 ? 's' : '') + ' awaiting response';
      b.classList.remove('hidden');
    } else b.classList.add('hidden');
  }
  function openEventModal() {
    if (!st.pendingEvents || !st.pendingEvents.length || st.over) return;
    var ev = st.pendingEvents[0];
    var cfg = E.findEventConfig(st, ev.id);
    if (!cfg) { st.pendingEvents.shift(); updateEventBadge(); return; }
    var kick = '🌎 World event — ' + (cfg.quarterLabel || ('Q' + st.quarter + ' ' + st.year));
    if (cfg.kind === 'act_link') {
      var actName = null;
      if (cfg.actId) {
        var a1 = (window.SCENARIO_2016 && SCENARIO_2016.acts && SCENARIO_2016.acts[cfg.actId]) ? SCENARIO_2016.acts[cfg.actId].name : null;
        if (Array.isArray(cfg.actId)) a1 = null; // multi-act events: generic line
        actName = a1;
      }
      kick += actName ? ' · 🏛️ alongside the ' + actName : ' · 🏛️ alongside an era-defining law';
    }
    $('event-kicker').textContent = kick;
    var urg = $('event-urgency');
    if (cfg.tier === 'major') {
      urg.textContent = '‼ Major';
      urg.className = 'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ev-major';
    } else {
      urg.textContent = 'Statement';
      urg.className = 'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ev-std';
    }
    $('event-title').textContent = cfg.title;
    $('event-context').textContent = cfg.context || cfg.headline || '';
    var blocs = $('event-blocs');
    blocs.innerHTML = '';
    (cfg.blocs || []).forEach(function (g) {
      blocs.appendChild(el('span', 'ev-bloc', (VG.labels && VG.labels[g]) || g));
    });
    var box = $('event-options');
    box.innerHTML = '';
    cfg.options.forEach(function (opt) {
      var btn = el('button', 'ev-opt w-full text-left p-2.5 transition-colors');
      var pcTag = opt.pc ? ' <span class="text-[10px] font-bold text-violet-700">(' + opt.pc + ' PC)</span>' : '';
      var q = opt.text || '';
      var quoted = /^["“‘\']/.test(q) ? esc(q) : '&ldquo;' + esc(q) + '&rdquo;'; // config text may already carry quotes
      btn.innerHTML = '<div class="text-[13px] font-semibold text-stone-800">' + esc(opt.label) + pcTag + '</div>' +
        (opt.text ? '<div class="text-[12px] text-stone-500 italic mt-0.5">' + quoted + '</div>' : '') +
        (opt.preview ? '<div class="text-[11px] text-violet-700/80 mt-0.5">' + esc(opt.preview) + '</div>' : '');
      btn.addEventListener('click', function () {
        var res = E.respondToEvent(st, ev.id, opt.id);
        toast(res.msg, !res.ok);
        if (res.ok) {
          eventModalOpen = false;
          $('event-modal').classList.add('hidden');
          render();
          maybeOpenEvent(); // a 2-event turn opens the second immediately
        }
      });
      box.appendChild(btn);
    });
    var act = $('event-actual');
    if (cfg.actualReaction) { act.textContent = cfg.actualReaction; act.classList.remove('hidden'); }
    else act.classList.add('hidden');
    $('event-queue').textContent = st.pendingEvents.length > 1 ? ('1 of ' + st.pendingEvents.length) : '';
    $('event-modal').classList.remove('hidden');
    eventModalOpen = true;
    updateEventBadge();
  }
  function maybeOpenEvent() {
    updateEventBadge();
    if (eventModalOpen) return;
    if (!(st.pendingEvents && st.pendingEvents.length && !st.over)) return;
    // v0.5.1 freeze fix: only auto-open at home (Dashboard). On any other tab the
    // full-screen modal made the game feel frozen — the badge pulses instead and
    // the player responds when ready (still within the 1-turn window).
    if (activeTabName() !== 'dashboard') return;
    openEventModal();
  }
  $('event-later').addEventListener('click', function () {
    eventModalOpen = false;
    $('event-modal').classList.add('hidden');
    updateEventBadge();
    toast('📣 Event parked — respond before you advance, or it resolves as silence.');
  });
  $('ev-pending-badge').addEventListener('click', function (e) {
    // v0.5.1 freeze fix: swallow the click ONLY when the modal can actually open
    // (dashboard tab). On other tabs maybeOpenEvent() is gated off, so blocking
    // the click here made Next Quarter do nothing — the turn never advanced and
    // the pulsing badge made the game feel frozen.
    if (activeTabName() !== 'dashboard') return; // let it bubble to btn-next
    e.stopPropagation(); // badge reopens the modal; the button itself advances the turn
    maybeOpenEvent();
  });

  /* ---------------- v0.5 (WS5): Create-your-own-Act studio ---------------- */
  var STUDIO = ACT_STUDIO;
  var studioBuilt = false, studioStep = 1, studioSourceNote = '';
  var studioVals = { demand: 0, outlay: 0, odPct: 0, homelessPct: 0, incarcPct: 0, det: {}, groups: {} };
  var STUDIO_BASE_DIMS = [
    { key: 'demand', label: 'Demand stimulus (pp growth/turn)', min: -2, max: 2, step: 0.1 },
    { key: 'outlay', label: 'Outlays (% of GDP)', min: 0, max: 4, step: 0.1 },
    { key: 'odPct', label: 'Overdose deaths (%/turn)', min: -2, max: 2, step: 0.1 },
    { key: 'homelessPct', label: 'Homelessness (%/turn)', min: -2, max: 2, step: 0.1 },
    { key: 'incarcPct', label: 'Incarceration (%/turn)', min: -2, max: 2, step: 0.1 }
  ];

  /* mirror createGame's pol-init shape so a mid-game registration is live immediately */
  function customPolInit(def) {
    return { value: def.def, from: def.def, ramp: 1, lag: def.lag, upkeepLeft: 0, upkeepPer: 0, stalled: false };
  }
  function restoreCustomActs() {
    if (!STUDIO) return;
    STUDIO.restoreSaved().forEach(function (def) {
      if (!st.pol[def.id]) st.pol[def.id] = customPolInit(def);
    });
  }
  function catLabel(id) {
    for (var i = 0; i < ACT_CATEGORIES.length; i++) if (ACT_CATEGORIES[i].id === id) return ACT_CATEGORIES[i].name;
    return id;
  }
  function clampNum(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

  function collectBase() {
    return {
      demand: studioVals.demand, outlay: studioVals.outlay, odPct: studioVals.odPct,
      homelessPct: studioVals.homelessPct, incarcPct: studioVals.incarcPct,
      det: Object.assign({}, studioVals.det), groups: Object.assign({}, studioVals.groups)
    };
  }
  function collectForm() {
    return {
      name: $('studio-name').value,
      cat: $('studio-cat').value,
      desc: $('studio-desc').value,
      sourceNote: studioSourceNote || undefined,
      demand: studioVals.demand, outlay: studioVals.outlay,
      odPct: studioVals.odPct, homelessPct: studioVals.homelessPct, incarcPct: studioVals.incarcPct,
      det: Object.assign({}, studioVals.det), groups: Object.assign({}, studioVals.groups)
    };
  }
  function updateStudioReadout() {
    if (!STUDIO) return;
    var mod = STUDIO.scaleSpec(collectBase(), STUDIO.SCALE_MOD);
    var amb = STUDIO.scaleSpec(collectBase(), STUDIO.SCALE_AMB);
    var lag = clampNum(Math.round(2 + amb.weight / 3), 2, 8);
    var bn = (amb.fx.outlay || 0) / 100 * st.gdp_nominal;
    $('studio-readout').innerHTML =
      '⚖️ <b>Balance (live)</b> — Moderate: <b>' + mod.pc + ' PC</b> + upkeep ' + mod.upkeep.perTurn + '/turn × ' + mod.upkeep.turns +
      ' · Ambitious: <b>' + amb.pc + ' PC</b> + upkeep ' + amb.upkeep.perTurn + '/turn × ' + amb.upkeep.turns +
      ' · phase-in lag <b>' + lag + ' turns</b><br>💰 Budget cost: up to +' + (amb.fx.outlay || 0) +
      '% of GDP ≈ ' + money(bn) + '/yr outlays (ambitious) · formula in MATH_AND_LOGIC.md → Custom Act studio';
  }

  function syncOneSlider(id, v) {
    var inp = $(id);
    if (!inp) return;
    inp.value = v;
    var lab = inp.nextElementSibling;
    if (lab) lab.textContent = (Number(inp.step) >= 1 ? String(Math.round(v)) : String(Math.round(v * 100) / 100));
  }
  function syncSliders() {
    STUDIO_BASE_DIMS.forEach(function (d) { syncOneSlider('studio-sl-' + d.key, studioVals[d.key]); });
    E.DET_IDS.forEach(function (d) { syncOneSlider('studio-sl-det-' + d, studioVals.det[d] || 0); });
    E.GROUP_IDS.forEach(function (g) { syncOneSlider('studio-sl-grp-' + g, studioVals.groups[g] || 0); });
  }
  function setStudioVals(base) {
    studioVals = { demand: 0, outlay: 0, odPct: 0, homelessPct: 0, incarcPct: 0, det: {}, groups: {} };
    ['demand', 'outlay', 'odPct', 'homelessPct', 'incarcPct'].forEach(function (k) { studioVals[k] = Number(base[k]) || 0; });
    Object.keys(base.det || {}).forEach(function (d) { studioVals.det[d] = Number(base.det[d]) || 0; });
    Object.keys(base.groups || {}).forEach(function (g) { studioVals.groups[g] = Math.round(Number(base.groups[g]) || 0); });
    syncSliders();
    updateStudioReadout();
  }
  function scaleStudioVals(s) {
    var caps = STUDIO.CAPS;
    studioVals.demand = clampNum(studioVals.demand * s, -caps.demand, caps.demand);
    studioVals.outlay = clampNum(studioVals.outlay * s, 0, caps.outlay);
    ['odPct', 'homelessPct', 'incarcPct'].forEach(function (k) { studioVals[k] = clampNum(studioVals[k] * s, -caps.pct, caps.pct); });
    E.DET_IDS.forEach(function (d) { if (studioVals.det[d]) studioVals.det[d] = clampNum(studioVals.det[d] * s, -caps.det, caps.det); });
    E.GROUP_IDS.forEach(function (g) { if (studioVals.groups[g]) studioVals.groups[g] = clampNum(Math.round(studioVals.groups[g] * s), -caps.group, caps.group); });
    syncSliders();
    updateStudioReadout();
  }
  function studioNote(txt) {
    studioSourceNote = txt || '';
    var n = $('studio-note');
    if (txt) { n.textContent = '⚠ ' + txt; n.classList.remove('hidden'); }
    else n.classList.add('hidden');
  }
  function fillFromTemplate(tpl) {
    $('studio-name').value = tpl.name;
    $('studio-cat').value = tpl.cat;
    $('studio-desc').value = tpl.desc;
    studioNote(tpl.sourceNote || '');
    setStudioVals(tpl.studioBase || {});
  }
  function fillFromAnalysis(a) {
    $('studio-name').value = a.title;
    $('studio-cat').value = a.cat;
    if (!$('studio-desc').value.trim()) $('studio-desc').value = 'A player-authored Act drafted from source material in the Act Studio.';
    studioNote(a.note);
    setStudioVals({ demand: a.fx.demand, outlay: a.fx.outlay, odPct: a.fx.odPct, homelessPct: a.fx.homelessPct, incarcPct: a.fx.incarcPct, det: a.fx.det, groups: a.groups });
  }

  function studioGoto(n) {
    studioStep = n;
    [1, 2, 3].forEach(function (i) { $('studio-step-' + i).classList.toggle('hidden', i !== n); });
    $('studio-step-label').textContent = 'Step ' + n + ' of 3 — ' + ['Source', 'Calibrate', 'Enact'][n - 1];
    $('studio-back').classList.toggle('hidden', n === 1);
    $('studio-next').classList.toggle('hidden', n === 3);
    $('studio-register').classList.toggle('hidden', n !== 3);
    if (n === 2) updateStudioReadout();
    if (n === 3) buildStudioSummary();
  }
  function openStudio() {
    if (!STUDIO) { toast('Act Studio failed to load.', true); return; }
    studioGoto(1);
    $('studio-modal').classList.remove('hidden');
  }
  function buildStudioSummary() {
    var box = $('studio-summary');
    box.innerHTML = '';
    var res = STUDIO.buildDef(collectForm());
    if (!res.ok) { box.appendChild(el('p', 'text-red-700', esc(res.msg))); return; }
    var def = res.def;
    box.appendChild(el('p', null, '<b>' + esc(def.name) + '</b> · shelf: ' + esc(catLabel(def.cat)) + ' · id <code>' + esc(def.id) + '</code> · phase-in lag ' + def.lag + ' turns'));
    box.appendChild(el('p', 'text-stone-500', esc(def.desc)));
    def.options.forEach(function (o) {
      if (o.id === 'off') return;
      var f = o.fx || {}, bits = [];
      if (f.demand) bits.push('demand ' + (f.demand > 0 ? '+' : '') + f.demand);
      if (f.outlay) bits.push('outlay +' + f.outlay + '% GDP');
      if (f.det) Object.keys(f.det).forEach(function (d) { bits.push(d + ' ' + (f.det[d] > 0 ? '+' : '') + f.det[d]); });
      ['odPct', 'homelessPct', 'incarcPct'].forEach(function (k) { if (f[k]) bits.push(k + ' ' + (f[k] > 0 ? '+' : '') + f[k]); });
      Object.keys(o.groups || {}).forEach(function (g) { bits.push(((VG.labels && VG.labels[g]) || g) + ' ' + (o.groups[g] > 0 ? '+' : '') + o.groups[g]); });
      box.appendChild(el('p', null, '<b>' + esc(o.label) + '</b> — ' + o.pc + ' PC, upkeep ' + o.upkeep.perTurn + '/turn × ' + o.upkeep.turns +
        (bits.length ? '<br><span class="text-stone-500">' + esc(bits.join(' · ')) + '</span>' : '')));
    });
    if (def.sourceNote) box.appendChild(el('p', 'text-amber-700 italic', '⚠ ' + esc(def.sourceNote)));
    box.appendChild(el('p', 'text-stone-400', 'Registering adds the Act to the Acts rail immediately (and to every future New Game) and saves it in this browser.'));
  }

  function studioRegister() {
    if (!STUDIO) return;
    if (!st || st.over) { toast('No active game — start a New Game before registering an Act.', true); return; }
    var res = STUDIO.buildDef(collectForm());
    if (!res.ok) { toast(res.msg, true); return; }
    var er = E.registerCustomAct(res.def);
    if (!er.ok) { toast(er.msg, true); return; }
    st.pol[res.def.id] = customPolInit(res.def);   // live in the CURRENT game too
    STUDIO.saveDef(res.def);
    buildPolicyCards();
    render();
    $('studio-modal').classList.add('hidden');
    toast('🏛️ ' + res.def.name + ' registered — see the ' + catLabel(res.def.cat) + ' shelf below.');
  }
  function studioDownload() {
    var res = STUDIO.buildDef(collectForm());
    if (!res.ok) { toast(res.msg, true); return; }
    download(res.def.id + '.act.json', JSON.stringify(res.def, null, 1), 'application/json');
  }
  function loadDefIntoForm(obj) {
    if (!obj || typeof obj !== 'object') throw new Error('not an Act JSON object');
    var base = obj.studioBase || null;
    if (!base && obj.options && obj.options.length) {
      var o = obj.options[obj.options.length - 1]; // ambitious option
      var f = o.fx || {}, s = 1 / STUDIO.SCALE_AMB;
      base = { demand: 0, outlay: 0, odPct: 0, homelessPct: 0, incarcPct: 0, det: {}, groups: {} };
      ['demand', 'outlay', 'odPct', 'homelessPct', 'incarcPct'].forEach(function (k) { if (f[k]) base[k] = f[k] * s; });
      if (f.det) Object.keys(f.det).forEach(function (d) { base.det[d] = f.det[d] * s; });
      if (o.groups) Object.keys(o.groups).forEach(function (g) { base.groups[g] = o.groups[g] * s; });
    }
    if (!base && (obj.fx || obj.groups || obj.det)) {
      base = Object.assign({ demand: 0, outlay: 0, odPct: 0, homelessPct: 0, incarcPct: 0 }, obj.fx || obj);
      base.det = Object.assign({}, (obj.fx && obj.fx.det) || obj.det || {});
      base.groups = Object.assign({}, obj.groups || {});
    }
    if (!base) throw new Error('no effect data found in this JSON');
    $('studio-name').value = String(obj.name || '');
    if (obj.cat) $('studio-cat').value = obj.cat;
    $('studio-desc').value = String(obj.desc || '');
    studioNote(obj.sourceNote || 'Loaded from a shared def JSON — verify every number before registering.');
    setStudioVals(base);
    studioGoto(2);
  }

  function deleteCustomAct(id) {
    var def = null;
    POLICIES.forEach(function (d) { if (d.id === id) def = d; });
    if (!def) return;
    var ps = st.pol[id];
    if (ps && ps.value !== def.def) { toast('Cannot delete mid-game: ' + def.name + ' is in force. Repeal it first (or delete after a New Game).', true); return; }
    if (!window.confirm('Delete "' + def.name + '"? It leaves the Acts rail and this browser\'s saved custom Acts.')) return;
    E.unregisterCustomAct(id);
    if (STUDIO) STUDIO.removeSaved(id);
    delete st.pol[id];
    buildPolicyCards();
    render();
    toast('🗑 ' + def.name + ' deleted.');
  }

  function buildStudio() {
    if (studioBuilt || !$('studio-modal')) return;
    studioBuilt = true;
    if (!STUDIO) { var bs = $('btn-studio'); if (bs) bs.disabled = true; return; }
    var catSel = $('studio-cat');
    ACT_CATEGORIES.forEach(function (c) {
      var o = el('option', null, esc(c.name));
      o.value = c.id;
      catSel.appendChild(o);
    });
    var tc = $('studio-templates');
    STUDIO.TEMPLATES.forEach(function (tpl) {
      var b = el('button', 'text-left border border-stone-200 rounded-lg p-2.5 hover:border-teal-600 hover:bg-teal-50 transition-colors');
      b.innerHTML = '<div class="text-xs font-bold text-stone-800">' + esc(tpl.name) + '</div>' +
        '<div class="text-[10px] text-stone-400 mb-1">' + esc(catLabel(tpl.cat)) + ' · Moderate ' + tpl.options[1].pc + ' PC / Ambitious ' + tpl.options[2].pc + ' PC</div>' +
        '<p class="text-[11px] text-stone-500 leading-snug">' + esc(tpl.desc) + '</p>' +
        '<p class="text-[10px] text-amber-700 italic mt-1">' + esc(tpl.sourceNote) + '</p>';
      b.addEventListener('click', function () { fillFromTemplate(tpl); studioGoto(2); });
      tc.appendChild(b);
    });
    var sl = $('studio-sliders');
    function sliderRow(label, min, max, step, key, bucket) {
      var row = el('div', 'flex items-center gap-2');
      row.appendChild(el('span', 'w-44 shrink-0 text-[11px] text-stone-500', esc(label)));
      var inp = el('input');
      inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = 0;
      inp.className = 'flex-1';
      inp.id = 'studio-sl-' + (bucket ? bucket + '-' : '') + key;
      var val = el('span', 'w-12 text-right text-[11px] font-semibold text-teal-800', '0');
      inp.addEventListener('input', function () {
        var v = parseFloat(inp.value);
        if (bucket) studioVals[bucket][key] = v; else studioVals[key] = v;
        val.textContent = (step >= 1 ? String(Math.round(v)) : String(v));
        updateStudioReadout();
      });
      row.appendChild(inp);
      row.appendChild(val);
      sl.appendChild(row);
    }
    STUDIO_BASE_DIMS.forEach(function (d) { sliderRow(d.label, d.min, d.max, d.step, d.key, null); });
    sl.appendChild(el('p', 'text-[10px] font-bold uppercase tracking-wide text-stone-400 pt-1', 'Big-Cycle determinants (per turn, ±1.0 cap)'));
    E.DET_IDS.forEach(function (d) { sliderRow(DET_LABELS[d], -1, 1, 0.05, d, 'det'); });
    sl.appendChild(el('p', 'text-[10px] font-bold uppercase tracking-wide text-stone-400 pt-1', 'Voter groups (one-time approval shift, ±10 cap)'));
    E.GROUP_IDS.forEach(function (g) { sliderRow((VG.labels && VG.labels[g]) || g, -10, 10, 1, g, 'grp'); });

    $('btn-studio').addEventListener('click', openStudio);
    $('studio-close').addEventListener('click', function () { $('studio-modal').classList.add('hidden'); });
    $('studio-modal').addEventListener('click', function (ev) { if (ev.target === $('studio-modal')) $('studio-modal').classList.add('hidden'); });
    $('studio-back').addEventListener('click', function () { studioGoto(Math.max(1, studioStep - 1)); });
    $('studio-next').addEventListener('click', function () {
      if (studioStep === 2 && !$('studio-name').value.trim()) { toast('Give your Act a name first.', true); return; }
      studioGoto(Math.min(3, studioStep + 1));
    });
    $('studio-register').addEventListener('click', studioRegister);
    $('studio-download').addEventListener('click', studioDownload);
    $('studio-preset-mod').addEventListener('click', function () { scaleStudioVals(STUDIO.SCALE_MOD); });
    $('studio-preset-amb').addEventListener('click', function () { scaleStudioVals(STUDIO.SCALE_AMB); });
    $('studio-analyze').addEventListener('click', analyzeStudioText);
    var drop = $('studio-drop'), fileIn = $('studio-file');
    drop.addEventListener('click', function () { fileIn.click(); });
    drop.addEventListener('dragover', function (ev) { ev.preventDefault(); drop.classList.add('border-teal-600'); });
    drop.addEventListener('dragleave', function () { drop.classList.remove('border-teal-600'); });
    drop.addEventListener('drop', function (ev) {
      ev.preventDefault();
      drop.classList.remove('border-teal-600');
      var f = ev.dataTransfer.files && ev.dataTransfer.files[0];
      if (f) readStudioFile(f);
    });
    fileIn.addEventListener('change', function () { if (fileIn.files[0]) readStudioFile(fileIn.files[0]); });
    $('studio-load').addEventListener('click', function () { $('studio-load-file').click(); });
    $('studio-load-file').addEventListener('change', function () {
      var f = $('studio-load-file').files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try { loadDefIntoForm(JSON.parse(String(rd.result || ''))); }
        catch (e) { toast('Could not load that def JSON: ' + e.message, true); }
      };
      rd.readAsText(f);
    });
  }
  function readStudioFile(f) {
    if (!/\.(txt|md|csv)$/i.test(f.name)) { toast('Only .txt, .md or .csv files.', true); return; }
    var rd = new FileReader();
    rd.onload = function () {
      $('studio-paste').value = String(rd.result || '').slice(0, 20000);
      analyzeStudioText();
    };
    rd.readAsText(f);
  }
  function analyzeStudioText() {
    var txt = $('studio-paste').value;
    if (!txt.trim()) { toast('Paste or drop some source text first.', true); return; }
    fillFromAnalysis(STUDIO.analyzeText(txt));
    studioGoto(2);
  }

  /* ---------------- init ---------------- */
  restoreCustomActs();   // v0.5 (WS5): re-register saved custom Acts, patch current st.pol
  buildStudio();         // v0.5 (WS5): wire the Create-your-own-Act wizard
  buildPolicyCards();
  buildBudgetRows();
  renderPreloaded();
  buildActTimelines();
  buildCharts();
  render();
  startTicker();
  openScenarioPicker(false);

  /* ---- debug / test handle ---- */
  window.POLISIM = {
    E: E,
    get state() { return st; },
    set state(s) { st = s; },
    render: render
  };
})();

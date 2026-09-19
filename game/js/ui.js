/* ============================================================================
   PoliSim-DBE — ui.js
   Rendering, tab navigation, Chart.js wiring, event handlers.
   Requires js/data.js and js/engine.js loaded first.
   ========================================================================== */
(function () {
  'use strict';

  var H = window.HISTORY, POLICIES = window.POLICY_DEFS, VG = window.VOTER_GROUPS, EV = window.EVENTS;
  var E = window.ENGINE;
  var st = E.createGame();
  var charts = {};   // Chart.js instances
  var hasCharts = typeof Chart !== 'undefined';

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
  function money(bn) { return bn >= 10000 ? '$' + f1(bn / 1000) + 'T' : '$' + Math.round(bn).toLocaleString() + 'bn'; }
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
    var y = String(Math.min(2024, Math.max(2004, year)));
    return v[y] !== undefined ? v[y] : null;
  }

  /* ---------------- tabs ---------------- */
  $('tabs').addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-tab]');
    if (!b) return;
    document.querySelectorAll('.tab-btn').forEach(function (x) { x.classList.remove('tab-active'); });
    b.classList.add('tab-active');
    document.querySelectorAll('.tab-pane').forEach(function (p) { p.classList.add('hidden'); });
    $('tab-' + b.dataset.tab).classList.remove('hidden');
    render(); // refresh charts in newly-visible pane
  });

  /* ---------------- header ---------------- */
  function renderHeader() {
    $('hd-clock').textContent = 'Q' + st.quarter + ' ' + st.year + ' · Turn ' + st.turn + '/' + EV.maxTurns;
    var pw = E.computePower(st), ph = E.phaseOf(pw.S);
    var phaseBadge = $('hd-phase');
    phaseBadge.textContent = '⛭ ' + ph.name;
    phaseBadge.title = ph.desc + '  (S = ' + f1(pw.S) + ' = mean det ' + f1(pw.mean) + ' − 0.25×debt burden ' + f1(pw.debtBurden) + ' − 0.25×conflict ' + f1(pw.conflict) + ')';
    $('hd-legit').textContent = 'Legitimacy ' + f1(st.legitimacy);
    $('hd-legit').style.background = st.legitimacy <= 25 ? '#b91c1c' : (st.legitimacy <= 40 ? '#b45309' : '');
    $('hd-sent').textContent = 'Sentiment ' + f1(st.sentiment);
    $('hd-pc').textContent = 'PC ' + Math.floor(st.pc);
    $('hd-funds').textContent = '$' + Math.floor(st.funds) + 'M';
    var ban = $('event-banner');
    if (st.turn >= 1 && st.turn <= 5 && !st.over) { ban.textContent = EV.gfc.banner; ban.classList.remove('hidden'); }
    else ban.classList.add('hidden');
    $('btn-next').disabled = st.over;
  }

  /* ---------------- dashboard ---------------- */
  var STAT_DEFS = [
    { label: 'Real GDP', get: function () { return money(st.gdp_level); }, sub: function () { return f2(st.growth) + '% ann. growth'; } },
    { label: 'Unemployment', get: function () { return pct(st.unemployment); }, sub: function () { return 'median income $' + kfmt(st.med_income); } },
    { label: 'Debt / GDP', get: function () { return pct(st.debt_gdp); }, sub: function () { return 'deficit ' + money(st.deficit_bn) + '/yr'; } },
    { label: 'Homelessness', get: function () { return kfmt(st.homelessness) + 'k'; }, sub: function () { return 'overdoses ' + kfmt(st.overdoses) + '/yr'; } }
  ];
  function renderStatCards() {
    var c = $('stat-cards'); c.innerHTML = '';
    STAT_DEFS.forEach(function (d) {
      var card = el('div', 'card !p-3');
      card.appendChild(el('div', 'text-[11px] uppercase tracking-wide text-stone-400', d.label));
      card.appendChild(el('div', 'text-xl font-bold text-stone-800', d.get()));
      card.appendChild(el('div', 'text-[11px] text-stone-500', d.sub()));
      c.appendChild(card);
    });
  }

  var METRIC_ROWS = [
    { name: 'Real GDP ($bn chained-2017)', sim: function () { return kfmt(st.gdp_level); }, act: function (y) { var v = histAt('real_gdp_bn_chained2017', y); return v ? kfmt(v) : '—'; }, num: function () { return st.gdp_level; }, anum: function (y) { return histAt('real_gdp_bn_chained2017', y); } },
    { name: 'Unemployment (%)', sim: function () { return f2(st.unemployment); }, act: function (y) { var v = histAt('unemployment_pct', y); return v ? f2(v) : '—'; }, num: function () { return st.unemployment; }, anum: function (y) { return histAt('unemployment_pct', y); }, inv: true },
    { name: 'Debt / GDP (%)', sim: function () { return f1(st.debt_gdp); }, act: function (y) { var v = histAt('debt_to_gdp_pct', y); return v ? f1(v) : '—'; }, num: function () { return st.debt_gdp; }, anum: function (y) { return histAt('debt_to_gdp_pct', y); }, inv: true },
    { name: 'Median household income ($)', sim: function () { return kfmt(st.med_income); }, act: function (y) { var v = histAt('real_median_hh_income_usd', y); return v ? kfmt(v) : '—'; }, num: function () { return st.med_income; }, anum: function (y) { return histAt('real_median_hh_income_usd', y); } },
    { name: 'Homelessness (thousands)', sim: function () { return kfmt(st.homelessness); }, act: function (y) { var v = histAt('homelessness_pit', y); return v ? kfmt(v) : '—'; }, num: function () { return st.homelessness; }, anum: function (y) { return histAt('homelessness_pit', y); }, inv: true },
    { name: 'Overdose deaths / yr', sim: function () { return kfmt(st.overdoses); }, act: function (y) { var v = histAt('overdose_deaths', y); return v ? kfmt(v) : '—'; }, num: function () { return st.overdoses; }, anum: function (y) { return histAt('overdose_deaths', y); }, inv: true },
    { name: 'Incarcerated (millions)', sim: function () { return f2(st.incarcerated); }, act: function (y) { var v = histAt('incarcerated_millions', y); return v ? f2(v) : '—'; }, num: function () { return st.incarcerated; }, anum: function (y) { return histAt('incarcerated_millions', y); }, inv: true }
  ];
  function renderMetricsTable() {
    var tb = document.querySelector('#metrics-table tbody');
    tb.innerHTML = '';
    METRIC_ROWS.forEach(function (r) {
      var tr = el('tr', 'border-b border-stone-100');
      tr.appendChild(el('td', 'font-medium text-stone-600', r.name));
      tr.appendChild(el('td', '', r.sim()));
      tr.appendChild(el('td', 'text-stone-400', r.act(st.year)));
      var av = r.anum(st.year), dcell = el('td', '', '—');
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
      row.appendChild(el('span', 'text-stone-600', DET_LABELS[d]));
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

  /* ---------------- policies tab ---------------- */
  function optionLabel(def, val) {
    if (def.kind === 'slider') return val + def.unit;
    for (var i = 0; i < def.options.length; i++) if (def.options[i].id === val) return def.options[i].label;
    return val;
  }

  function buildPolicyCards() {
    var grid = $('policy-grid');
    grid.innerHTML = '';
    POLICIES.forEach(function (def) {
      var card = el('div', 'policy-card');
      card.appendChild(el('h3', null, esc(def.name)));
      card.appendChild(el('p', 'desc', esc(def.desc)));

      var ctrlRow = el('div', 'flex items-center gap-2');
      if (def.kind === 'slider') {
        var range = el('input');
        range.type = 'range'; range.min = def.min; range.max = def.max; range.step = def.step;
        range.value = st.pol[def.id].value;
        range.id = 'pol-' + def.id;
        var valSpan = el('span', 'text-xs font-bold text-teal-800 whitespace-nowrap', optionLabel(def, st.pol[def.id].value));
        valSpan.id = 'polval-' + def.id;
        range.addEventListener('input', function () { valSpan.textContent = range.value + def.unit; });
        range.addEventListener('change', function () {
          var res = E.applyPolicy(st, def.id, parseFloat(range.value));
          if (!res.ok) { toast(res.msg, true); }
          else { toast(res.msg); }
          render();
        });
        ctrlRow.appendChild(range);
        ctrlRow.appendChild(valSpan);
      } else {
        var sel = el('select');
        sel.id = 'pol-' + def.id;
        def.options.forEach(function (o) {
          var opt = el('option', null, esc(o.label) + '  (−' + o.pc + ' PC)');
          opt.value = o.id;
          sel.appendChild(opt);
        });
        sel.value = st.pol[def.id].value;
        sel.addEventListener('change', function () {
          var res = E.applyPolicy(st, def.id, sel.value);
          if (!res.ok) { toast(res.msg, true); }
          else { toast(res.msg); }
          render();
        });
        ctrlRow.appendChild(sel);
      }
      card.appendChild(ctrlRow);

      card.appendChild(el('p', 'meta', '💰 ' + esc(def.cost)));
      card.appendChild(el('p', 'meta', '📈 ' + esc(def.expected)));
      var rampInfo = el('p', 'meta');
      rampInfo.id = 'polramp-' + def.id;
      card.appendChild(rampInfo);
      grid.appendChild(card);
    });
  }

  function renderPolicies() {
    $('pol-pc').textContent = 'Political Capital: ' + Math.floor(st.pc) + ' / 100  (+8/turn)';
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
      var ri = $('polramp-' + def.id);
      if (ri) {
        ri.textContent = ps.ramp < 1
          ? '⏳ Phasing in: ' + Math.round(ps.ramp * 100) + '% of full effect (current: ' + optionLabel(def, ps.value) + ')'
          : 'Current: ' + optionLabel(def, ps.value) + ' · full effect';
      }
    });
  }

  /* ---------------- election tab ---------------- */
  function renderElection() {
    var c = $('voter-table'); c.innerHTML = '';
    E.GROUP_IDS.forEach(function (g) {
      var v = st.approval[g];
      var row = el('div', 'voter-row');
      row.appendChild(el('span', 'text-stone-600', VG.labels[g] + ' <span class="text-stone-400">(' + VG.weights[g] + ')</span>'));
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
    if (st.elections.length) {
      eh.innerHTML = st.elections.map(function (e) {
        return '<div class="' + (e.won ? 'text-teal-700' : 'text-red-700') + ' font-semibold">' +
          (e.won ? '✓ Won' : '✗ Lost') + ' the ' + e.year + ' election — ' + f1(e.pct) + '% weighted approval</div>';
      }).join('');
    } else {
      eh.innerHTML = '<span class="text-stone-400">No elections held yet. First election at turn 16 (Q4 2011).</span>';
    }

    // campaign actions
    var open = E.campaignOpen(st);
    $('camp-funds').textContent = '$' + Math.floor(st.funds) + 'M funds';
    $('camp-status').textContent = open
      ? 'Campaign window OPEN (turns 13–16 / 29–32). Each use of an action has diminishing returns (×0.85ⁿ).'
      : 'Campaign actions unlock in turns 13–16 and 29–32 (election quarters).';
    var ca = $('campaign-actions');
    ca.innerHTML = '';
    Object.keys(E.CAMPAIGN).forEach(function (id) {
      var a = E.CAMPAIGN[id];
      var used = st.campaignUsed[id] || 0;
      var b = el('button', 'btn-primary !text-xs !py-2',
        esc(a.name) + '<br><span class="font-normal opacity-80">$' + a.cost + 'M' + (used ? ' · used ×' + used : '') + '</span>');
      b.disabled = st.over || !open || st.funds < a.cost;
      b.addEventListener('click', function () {
        var res = E.applyCampaign(st, id);
        toast(res.msg, !res.ok);
        render();
      });
      ca.appendChild(b);
    });
  }

  /* ---------------- report tab ---------------- */
  function renderReport() {
    var tb = document.querySelector('#det-compare tbody');
    tb.innerHTML = '';
    E.DET_IDS.forEach(function (d) {
      var s0 = EV.start.determinants[d], now = st.det[d], delta = now - s0;
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

  /* ---------------- charts ---------------- */
  var SIM_COLOR = '#0f766e', ACT_COLOR = '#a8a29e';
  function labels40() {
    var L = [];
    for (var t = 0; t <= EV.maxTurns; t++) {
      if (t === 0) { L.push("Q4 '07"); continue; }
      var y = 2008 + Math.floor((t - 1) / 4), q = ((t - 1) % 4) + 1;
      L.push('Q' + q + " '" + String(y).slice(2));
    }
    return L;
  }
  // actual annual series placed at Q4 positions (turn 4 = 2008 … turn 40 = 2017)
  function actualSeries(key) {
    var arr = new Array(EV.maxTurns + 1).fill(null);
    arr[0] = H[key]['2007'] !== undefined ? H[key]['2007'] : null;
    for (var y = 2008; y <= 2017; y++) {
      var t = (y - 2008 + 1) * 4;
      arr[t] = H[key][String(y)] !== undefined ? H[key][String(y)] : null;
    }
    return arr;
  }
  function simSeries(fn, startVal) {
    var arr = [startVal];
    st.snapshots.forEach(function (s) { arr.push(fn(s)); });
    return arr;
  }

  function makeChart(id, simData, actData, label) {
    if (!hasCharts) return;
    var ctx = $(id);
    if (!ctx) return;
    charts[id] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels40(),
        datasets: [
          { label: 'Simulated', data: simData, borderColor: SIM_COLOR, backgroundColor: SIM_COLOR, borderWidth: 2, pointRadius: 0, tension: 0.25 },
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
    ch.data.datasets[0].data = simData;
    if (actData) ch.data.datasets[1].data = actData;
    ch.update('none');
  }

  function buildCharts() {
    makeChart('ch-gdp', simSeries(function (s) { return s.gdp_level; }, EV.start.gdp_level), actualSeries('real_gdp_bn_chained2017'));
    makeChart('ch-debt', simSeries(function (s) { return s.debt_gdp; }, EV.start.debt_gdp), actualSeries('debt_to_gdp_pct'));
    makeChart('ch-unemp', simSeries(function (s) { return s.unemployment; }, EV.start.unemployment), actualSeries('unemployment_pct'));
    makeChart('ch-homeless', simSeries(function (s) { return s.homelessness; }, EV.start.homelessness), actualSeries('homelessness_pit'));
    makeChart('ch-poll', st.pollHistory.map(function (p) { return p.pct; }), null, '');
    if (charts['ch-poll']) {
      charts['ch-poll'].data.datasets[1].hidden = true;
      charts['ch-poll'].options.scales.y.min = 0;
      charts['ch-poll'].options.scales.y.max = 100;
      charts['ch-poll'].update('none');
    }
  }
  function updateCharts() {
    updateChart('ch-gdp', simSeries(function (s) { return s.gdp_level; }, EV.start.gdp_level), actualSeries('real_gdp_bn_chained2017'));
    updateChart('ch-debt', simSeries(function (s) { return s.debt_gdp; }, EV.start.debt_gdp), actualSeries('debt_to_gdp_pct'));
    updateChart('ch-unemp', simSeries(function (s) { return s.unemployment; }, EV.start.unemployment), actualSeries('unemployment_pct'));
    updateChart('ch-homeless', simSeries(function (s) { return s.homelessness; }, EV.start.homelessness), actualSeries('homelessness_pit'));
    if (charts['ch-poll']) {
      charts['ch-poll'].data.datasets[0].data = st.pollHistory.map(function (p) { return p.pct; });
      charts['ch-poll'].update('none');
    }
  }

  /* ---------------- overlay (game over / victory) ---------------- */
  function showOverlay() {
    var pw = E.computePower(st), ph = E.phaseOf(pw.S);
    $('ov-title').textContent = st.won ? '🏁 Term Complete' : '🏛️ Game Over';
    $('ov-body').textContent = st.overReason || '';
    $('ov-stats').textContent =
      'Turns served : ' + st.turn + ' / ' + EV.maxTurns + '\n' +
      'Real GDP     : ' + money(st.gdp_level) + ' (growth ' + f2(st.growth) + '%)\n' +
      'Unemployment : ' + pct(st.unemployment) + '\n' +
      'Debt / GDP   : ' + pct(st.debt_gdp) + '\n' +
      'Power score  : ' + f1(pw.S) + ' → ' + ph.name + '\n' +
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
    renderElection();
    renderReport();
    updateCharts();
  }

  function newGame() {
    st = E.createGame();
    $('overlay').classList.add('hidden');
    buildPolicyCards();
    render();
    toast('New game — you take office in Q1 2008, amid the Global Financial Crisis.');
  }

  $('btn-next').addEventListener('click', function () {
    if (st.over) return;
    E.advanceTurn(st);
    render();
    if (st.over) showOverlay();
    else if (st.elections.length && st.elections[st.elections.length - 1].turn === st.turn) {
      var e = st.elections[st.elections.length - 1];
      toast('🗳️ ' + e.year + ' election WON with ' + f1(e.pct) + '% weighted approval! Mandate renewed.');
    }
  });
  $('btn-new').addEventListener('click', function () { newGame(); });

  /* ---------------- init ---------------- */
  buildPolicyCards();
  buildCharts();
  render();
})();

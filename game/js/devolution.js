/* ============================================================================
   PoliSim-DBE — devolution.js  (WS-E)
   Legacy Acts-in-Force REMOVAL registry + state/city devolution model.

   CRITICAL DESIGN CONSTRAINT (no double-counting): the engine baseline already
   bakes these 8 Acts' effects in (baseline growth, outlays and metrics assume
   they exist). These defs are therefore NOT live acts with additive effects —
   they describe ONLY the removal delta. While an Act is in force, nothing
   changes; repealing it applies the deltas below.

   Removal model (per Act):
     - budget:  { <lineId>: pct }  — the federal budget line drops by pct of its
       CURRENT size at repeal time (states fund their share outside the federal
       budget). The line's own fx coefficients then ripple the cut through
       demand/groups exactly like a player slider cut (reused, not reinvented).
     - metrics: removal deltas for the channels the budget line does NOT carry,
       ramped in over a 4-turn unwind (mirrors the engine's repeal-unwind path):
         demand      pp growth per quarter (beyond the line's own demand fx)
         revenue     % of GDP of dedicated revenue that also disappears
                     (payroll/gas taxes fund these Acts — repeal ends both sides)
         unemp       pp unemployment per quarter at full removal
         inflation   pp inflation at full removal (rarely used)
         odPct/homelessPct/incarcPct/medIncomePct  per-quarter % drifts
         sentAdd/legitAdd   per-turn sentiment/legitimacy adds (political, NOT
                            mitigated — voters react to the repeal itself)
         det{}       determinant drift per turn
         groups{}    voter-group drift per turn (service experience → mitigated)
     - devolution: { share, efficiency, note } — when the federal Act is
       removed, states/cities pick up `share` of the function at `efficiency`
       (<1). Realized service loss is mitigated:
           applied_delta = delta × (1 − share × efficiency)
       Mitigation applies to SERVICE metrics only (demand, unemp, odPct,
       homelessPct, incarcPct, medIncomePct, det, groups). The federal budget
       line drops by pct regardless; sentAdd/legitAdd/backlash and the
       disruption shock are political reactions and are NOT mitigated.
     - cost:      PC price (entrenched status quo; the "third rail" ones are 40)
     - backlash:  one-time group approval deltas, spread over the 4-turn unwind
     - disruption:{ demand, sent, turns } — short-run transition shock, decays
       linearly to 0 over `turns` quarters.

   Every number is derived from the Act's ACT_TIMELINES evidence panel and is
   deliberately conservative (smaller than the raw literature estimate) because
   the budget-line ripple already carries part of the effect. Derivation notes
   per Act inline. Keys match ACT_TIMELINES.acts ids exactly.
   ========================================================================== */
(function (root, factory) {
  var D = factory();
  root.DEVOLUTION = D;
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var LEGACY_REPEALS = {
    ss1935: {
      name: 'Social Security Act (1935)',
      /* Evidence: "Pays ~$615B/yr to 50M+ beneficiaries (2008); the single
         largest budget line and the floor under senior poverty." The whole
         social_security line ($615bn base) is OASDI; 0.90 leaves a residual
         for the 1956-DI lineage quibble. Financing (timeline): 12.4% payroll
         tax — OASDI tax income ≈ $675bn ≈ 4.6% of 2008 GDP; conservative
         −4.2 means repeal ends BOTH the outlay and most of its dedicated
         revenue, so net federal savings are small (honest, per the trustees). */
      budget: { social_security: 0.90 },
      metrics: {
        demand: -0.10,          // automatic-stabilizer role beyond the line's own −0.18 ripple
        revenue: -4.2,          // % of GDP: dedicated payroll taxes end with the mandate
        unemp: 0.10,            // retirement-security channel on labor supply (weak, conservative)
        homelessPct: 0.40,      // elderly poverty 10%→~37% without OASI (CBPP); floor under seniors
        medIncomePct: -0.60,    // >50% of income for half of senior households (SSA)
        sentAdd: -2, legitAdd: -2,
        det: { output: -0.20, education: -0.05 },
        groups: { seniors: -0.40, workers: -0.15 }
      },
      devolution: {
        share: 0.25, efficiency: 0.60,
        note: 'Pensions pool risk nationally; a few states would build retirement plans, most cannot — states/cities replace only ~25% of the function at ~60% efficiency.'
      },
      cost: 40, // the third rail of American politics
      backlash: { seniors: -20, workers: -6 },
      disruption: { demand: -0.5, sent: -3, turns: 4 }
    },

    ui1935: {
      name: 'Unemployment Insurance (Title III, SSA 1935)',
      /* Evidence: "federal-state system... the premier automatic stabilizer."
         The UI sub-line is $40bn of the $261bn income_security line (≈15%);
         0.12 is conservative (the federal extended-benefit share only — base
         benefits are state-trust-fund financed). */
      budget: { income_security: 0.12 },
      metrics: {
        demand: -0.20,          // premier automatic stabilizer: countercyclical cushioning above the line fx
        unemp: 0.10,            // without UI, search intensity rises but demand falls; net small adverse
        medIncomePct: -0.20,    // wage-replacement floor gone
        groups: { workers: -0.30, youth: -0.10 },
        sentAdd: -1
      },
      devolution: {
        share: 0.70, efficiency: 0.80,
        note: 'Already a federal-STATE program with state trust funds and state taxes — states keep ~70% of the function running at ~80% efficiency.'
      },
      cost: 25,
      backlash: { workers: -10 },
      disruption: { demand: -0.3, sent: -1, turns: 2 }
    },

    gibill1944: {
      name: 'GI Bill (Servicemen\'s Readjustment Act, 1944)',
      /* Evidence: "successors still educate veterans today." Post-9/11 GI Bill
         ≈ $12bn/yr ≈ 25% of the veterans line ($47bn) — conservative 0.15 on
         veterans + 0.05 on education (tuition flows through both ledgers). */
      budget: { veterans: 0.15, education: 0.05 },
      metrics: {
        det: { education: -0.15, innovation: -0.05, output: -0.05 }, // "template for federal human-capital investment"
        medIncomePct: -0.10,
        groups: { youth: -0.20, workers: -0.10 },
        legitAdd: -1            // breaking the promise to veterans reads as national betrayal
      },
      devolution: {
        share: 0.30, efficiency: 0.60,
        note: 'States run the public universities veterans attend and could fund some tuition support — ~30% pickup at ~60% efficiency.'
      },
      cost: 15,
      backlash: { religious: -4, workers: -4 },
      disruption: { demand: -0.1, sent: -1, turns: 2 }
    },

    interstate1956: {
      name: 'Interstate Highway Act (1956)',
      /* Evidence: "funded 41,000 miles, 90% federal share, through the Highway
         Trust Fund." Highways sub is $41bn of $64bn transport (0.64); the
         Act's ongoing federal capital share is high but maintenance is largely
         state → 0.50. Gas-tax HTF receipts ≈ $40bn ≈ 0.27% of GDP; conservative
         −0.25 revenue. */
      budget: { transport: 0.50 },
      metrics: {
        revenue: -0.25,         // Highway Trust Fund gas tax ends with the federal mandate
        demand: -0.05,          // beyond the line's own ripple
        unemp: 0.05,
        det: { competitiveness: -0.20, output: -0.10 }, // "the physical platform of US commerce"
        groups: { workers: -0.15 }
      },
      devolution: {
        share: 0.60, efficiency: 0.70,
        note: 'States already own and operate the interstates — devolution is well-trodden here: ~60% pickup at ~70% efficiency (tolls and state gas taxes backfill).'
      },
      cost: 20,
      backlash: { workers: -6, capitalists: -4 },
      disruption: { demand: -0.2, sent: -1, turns: 2 }
    },

    cra1964: {
      name: 'Civil Rights Act (1964)',
      /* Evidence: "enforcement capacity lives in the justice budget line."
         EEOC ≈ $0.3–0.4bn of the $48bn justice line ≈ 1% → 0.02 conservative.
         The Act is a legal mandate, not a program: its removal deltas are
         legitimacy/social, not fiscal. */
      budget: { justice: 0.02 },
      metrics: {
        legitAdd: -3, sentAdd: -1, // repealing the legal backbone of equality damages institutional legitimacy
        unemp: 0.05,               // discrimination raises matching frictions (conservative)
        groups: { immigrants: -0.50, workers: -0.30, youth: -0.30 }
      },
      devolution: {
        share: 0.20, efficiency: 0.40,
        note: 'Anti-discrimination norms are inherently national; patchwork state civil-rights laws cover ~20% of the function at ~40% efficiency.'
      },
      cost: 30,
      backlash: { immigrants: -12, youth: -8, workers: -6 },
      disruption: { demand: -0.1, sent: -2, turns: 2 }
    },

    medicare1965: {
      name: 'Medicare & Medicaid (SSA Amendments, 1965)',
      /* Evidence: "created health coverage for seniors and low-income
         Americans... ~$590B/yr by 2008." The Act created BOTH programs
         (medicare $390bn + medicaid $201bn ≈ $591bn — matches); 0.85 leaves a
         residual for later amendments (Part D 2003 is its own Act). */
      budget: { medicare: 0.85, medicaid: 0.85 },
      metrics: {
        odPct: 0.60,            // treatment access loss beyond the lines' own ~+1.1 ripple
        homelessPct: 0.30,      // medical bankruptcy is a leading bankruptcy cause
        medIncomePct: -0.50,    // out-of-pocket costs crush household budgets
        unemp: 0.10, demand: -0.10,
        det: { output: -0.10 },
        groups: { seniors: -0.60, workers: -0.30, immigrants: -0.20 },
        sentAdd: -1, legitAdd: -2
      },
      devolution: {
        share: 0.35, efficiency: 0.55,
        note: 'Medicaid is already a state-federal partnership (states could expand their side); replacing Medicare nationally is far harder — ~35% pickup at ~55% efficiency.'
      },
      cost: 40,
      backlash: { seniors: -22, workers: -8, immigrants: -4 },
      disruption: { demand: -0.5, sent: -2, turns: 4 }
    },

    snap1964: {
      name: 'Food Stamp Act (SNAP, 1964)',
      /* Evidence: "feeds ~28M people by 2008; ~$1.8 of economic activity per
         benefit dollar." SNAP sub is $38bn of $261bn income_security (≈0.146)
         → conservative 0.12. */
      budget: { income_security: 0.12 },
      metrics: {
        demand: -0.15,          // highest multiplier in the safety net (USDA ERS $1.8/$1)
        homelessPct: 0.40,      // food insecurity forces rent-vs-food choices
        medIncomePct: -0.20,
        groups: { workers: -0.30, youth: -0.10 }
      },
      devolution: {
        share: 0.50, efficiency: 0.65,
        note: 'States already administer SNAP and some would partially backfill benefits — ~50% pickup at ~65% efficiency.'
      },
      cost: 20,
      backlash: { workers: -10, youth: -4 },
      disruption: { demand: -0.3, sent: -1, turns: 2 }
    },

    cleanair1970: {
      name: 'Clean Air Act (1970)',
      /* Evidence: "EPA cost-benefit reviews find benefits dwarf compliance
         costs." EPA sub is $8bn of $30bn environment (≈0.27); the Act drives
         most EPA standards work → 0.25. Removal deltas are health/output, not
         demand: the compliance-cost relief is real but the health drag
         dominates per the EPA retrospectives. */
      budget: { environment: 0.25 },
      metrics: {
        odPct: 0.15,            // air-pollution mortality channel (particulates), conservative
        medIncomePct: -0.05,
        det: { output: -0.10 }, // lost workdays + health capital (EPA retrospective: net positive)
        groups: { youth: -0.20, technocrats: -0.10 }
      },
      devolution: {
        share: 0.40, efficiency: 0.50,
        note: 'California-style state standards exist, but pollution crosses borders and a race to the bottom is likely — ~40% pickup at ~50% efficiency.'
      },
      cost: 18,
      backlash: { youth: -8, technocrats: -4 },
      disruption: { demand: 0, sent: -1, turns: 1 }
    }
  };

  /* mitigation factor for service metrics: states/cities pick up `share` of
     the removed function at `efficiency` — realized loss = full delta × this */
  function mitigation(def) {
    var d = (def && def.devolution) || {};
    return 1 - (d.share || 0) * (d.efficiency || 0);
  }

  /* plain-English estimate of the metric moves (state-independent part; the
     engine's preview adds $ savings from the CURRENT line sizes) */
  function describe(def) {
    var m = def.metrics || {}, out = [];
    var mit = mitigation(def);
    function svc(label, v, unit) { // service metric: shown post-mitigation
      if (!v) return;
      var a = v * mit;
      out.push(label + ' ' + (a > 0 ? '+' : '') + (Math.round(a * 100) / 100) + unit);
    }
    svc('demand', m.demand, ' pp/qtr');
    svc('unemployment', m.unemp, ' pp');
    svc('overdoses', m.odPct, '%/qtr');
    svc('homelessness', m.homelessPct, '%/qtr');
    svc('incarceration', m.incarcPct, '%/qtr');
    svc('median income', m.medIncomePct, '%/qtr');
    if (m.revenue) out.push('dedicated revenue ' + (m.revenue > 0 ? '+' : '') + m.revenue + '% of GDP (payroll/earmarked taxes end too)');
    if (m.outlayPct) out.push('outlays ' + (m.outlayPct > 0 ? '+' : '') + m.outlayPct + '% of GDP');
    if (m.inflation) out.push('inflation ' + (m.inflation > 0 ? '+' : '') + m.inflation + ' pp');
    if (m.det) Object.keys(m.det).forEach(function (d) {
      var a = m.det[d] * mit;
      if (a) out.push(d + ' determinant ' + (a > 0 ? '+' : '') + (Math.round(a * 100) / 100) + '/turn');
    });
    if (m.groups) Object.keys(m.groups).forEach(function (g) {
      var a = m.groups[g] * mit;
      if (a) out.push(g + ' approval drift ' + (a > 0 ? '+' : '') + (Math.round(a * 100) / 100) + '/turn');
    });
    if (m.sentAdd) out.push('sentiment ' + (m.sentAdd > 0 ? '+' : '') + m.sentAdd + ' (political — not devolved)');
    if (m.legitAdd) out.push('legitimacy ' + (m.legitAdd > 0 ? '+' : '') + m.legitAdd + ' (political — not devolved)');
    return out;
  }

  return {
    version: 1,
    unwindTurns: 4,           // mirrors the engine's repeal-unwind horizon
    LEGACY_REPEALS: LEGACY_REPEALS,
    mitigation: mitigation,
    describe: describe,
    list: function () { return Object.keys(LEGACY_REPEALS); }
  };
});

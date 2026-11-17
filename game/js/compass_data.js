/* ============================================================================
   PoliSim-DBE v0.5 — compass_data.js
   Reverse-engineered Filteries Political Simulator Compass constants,
   mapped to PoliSim's Big-Cycle determinants (spec_compass_integration.md).
   Plain browser global + Node fallback. No logic here beyond data.
   Effect sizes trace to the scoring-engine spec (§3 column "Spec basis").
   ========================================================================== */
(function (root) {
  'use strict';

  /* Eight axes, 0-100. Pole direction = the named abbreviation. */
  root.COMPASS_META = {
    axes: ['STA', 'LFT', 'REG', 'OWN', 'HSP', 'AUT', 'TRD', 'NTV'],
    poles: {
      STA: ['Statism', 'Minarchism'],
      LFT: ['Economic Left', 'Economic Right'],
      REG: ['Regulation', 'Deregulation'],
      OWN: ['Nationalization', 'Privatization'],
      HSP: ['High Spending', 'Frugality'],
      AUT: ['Authoritarian', 'Libertarian'],
      TRD: ['Traditionalist', 'Progressive'],
      NTV: ['Nativist', 'Cosmopolitan']
    },
    version: '1.0'
  };

  /* Report §3 anchors / archetype 8 (Liberal Republic, US-type).
     HSP excluded — formula-only (COMPASS_FISCAL). */
  root.COMPASS_USA_BASELINE = { STA: 45, LFT: 38, REG: 45, OWN: 12, AUT: 30, TRD: 45, NTV: 50 };

  /* Scenario-era offsets. CALIBRATION CHOICE (spec §11.1): the 2016 era opens
     with a nationalism/polarization premium so realign2016 sits one restrictive
     act from Nativism, matching the scenario narrative. */
  root.COMPASS_SCENARIO_OFFSET = {
    gfc2008: {},
    realign2016: { NTV: 4, AUT: 2, TRD: 1 }
  };

  /* Report §3 Axis 5 fiscal bridge: HSP = (govShare-5)/(65-5)*100.
     Game budget is FEDERAL only (~20.5% of GDP baseline) → constant S&L offset.
     20.5 + 14.5 = 35% → HSP = 50 exactly (task anchor). Reads ~2 pts low vs
     IMF general-government figures late in long games (documented, v2 fix). */
  root.COMPASS_FISCAL = { STATE_LOCAL_OFFSET_PCT: 14.5, FLOOR_PCT: 5, CEIL_PCT: 65 };

  /* ACT → AXIS deltas (spec §3). Apply while the Act is in force, scale with
     ps.ramp, unwind on repeal. Slider acts use perUnit × value.
     tax LFT is conditional (C3 v1.1): −3 standalone, +2 if paired with transfers. */
  root.COMPASS_ACT_DELTAS = {
    tax: {
      slider: true, max: 100,
      perUnit: { STA: 0.01, REG: 0.02 },
      condLFT: { alone: -0.03, paired: 0.02,
        pairedIf: "welfareActiveOrUbi" }   // welfare ∈ {expanded,cash,ubi} || ubi.dividend
    },
    military: { options: {
      increase: { STA: 1, AUT: 1, NTV: 1 },
      hold: {},
      cut25: { STA: -1, NTV: -1 },
      cut50: { STA: -2, AUT: -1, NTV: -1 }
    }},
    drug: { options: {
      prohibited: {},
      decriminalized: { STA: -1, REG: -8, AUT: -8, TRD: -3 },
      legal: { STA: -1, REG: -6, AUT: -8, TRD: -3 }
    }},
    church: { options: {
      exempt: {},
      property: { REG: 1, TRD: -1 },
      charity: { STA: 1, REG: 1, TRD: -2 }
    }},
    housing: { options: {
      statusquo: {},
      zoning: { LFT: 1, REG: -3 },
      housingfirst: { STA: 1, LFT: 3 },
      rentban: { STA: 2, LFT: 4, REG: 6 }
    }},
    immigration: { options: {
      restrictive: { REG: 2, AUT: 1, NTV: 6 },
      statusquo: {},
      reformed: { LFT: 1, REG: 2, NTV: -3 },
      open: { REG: -1, AUT: -1, NTV: -8 }
    }},
    welfare: { options: {
      statusquo: {},
      expanded: { STA: 1, LFT: 4 },
      cash: { STA: 2, LFT: 6, AUT: -1 },
      ubi: { STA: 1, LFT: 8, REG: -2, AUT: -1 }
    }},
    education: { options: {
      statusquo: {},
      vocational: { LFT: 1 },
      yearround: { LFT: 1, TRD: -1 },
      full: { STA: 1, LFT: 2, TRD: -2 }
    }},
    tariffs: { slider: true, max: 25, perUnit: { STA: 0.04, LFT: 0.08, REG: 0.24, NTV: 0.4 } },
    healthcare: { options: {
      statusquo: {},
      public: { STA: 1, LFT: 3, OWN: 1 },
      universal: { STA: 2, LFT: 7, OWN: 3 }
    }},
    law: { options: {
      statusquo: {},
      community: { REG: -1, AUT: -2 },
      reform: { REG: -1, AUT: -4, TRD: -1 },
      tough: { REG: 1, AUT: 4, TRD: 1 }
    }},
    infra: { slider: true, max: 3, perUnit: { STA: 1.0 } },
    ubi: { options: {
      off: {},
      dividend: { STA: 1, LFT: 8, REG: -2, AUT: -1 }   // D5 exact
    }},
    lvt: { options: {
      off: {},
      enact: { LFT: 2, REG: 1 }                        // OWN 0 per Hong Kong rule
    }},
    media: { options: {
      off: {},
      enact: { LFT: 1, AUT: -2 }
    }},
    democracy: { options: {
      off: {},
      enact: { STA: -1, LFT: 1, AUT: -3 }
    }}
  };

  /* BUDGET level → axes (spec §4): per +10% deviation of the EFFECTIVE
     multiplier from 1.0 (sub-line edits and deletions flow through catMult;
     a deleted category = −100% dev = 10 units). Signs mirror for cuts.
     Σ budget contribution per axis is clamped to ±8 (stacking cap). */
  root.COMPASS_BUDGET_DELTAS = {
    defense: { STA: 0.3, AUT: 0.1, NTV: 0.1 },
    social_security: { LFT: 0.4 },
    medicare: { LFT: 0.3, OWN: 0.1 },
    medicaid: { LFT: 0.3, OWN: 0.1 },
    income_security: { LFT: 0.4 },
    health: { LFT: 0.2 },
    veterans: { TRD: 0.1 },
    education: { LFT: 0.1, TRD: -0.1 },
    transport: { STA: 0.1 },
    environment: { REG: 0.2, TRD: -0.1 },
    international: { NTV: -0.2 },
    science: { TRD: -0.1 },
    justice: { AUT: 0.2, REG: 0.1 },
    interest: {},
    other: {}
  };
  root.COMPASS_BUDGET_CAP = 8; // per-axis budget-channel stacking cap

  /* Add-on sectors (while added; scale by sector mult). */
  root.COMPASS_SECTOR_DELTAS = {
    green_energy: { REG: 2, OWN: 0.5, TRD: -1 },
    universal_prek: { LFT: 2, OWN: 0.5 },
    mental_health: { LFT: 1 },
    broadband: {}
  };

  /* Label gates (spec §5) — evaluated in order, first match wins.
     ctx = { tariffRate, democracyAct, legitimacy, over }. */
  root.COMPASS_LABEL_GATES = {
    structure: function (a, ctx) {
      return 'Federal Nation-State' + (ctx.legitimacy <= 20 ? ' (in crisis)' : '');
      // City-State / Empire / Confederation unreachable: no sovereignty inputs (v1)
    },
    governing: function (a, ctx) {
      var part = ctx.democracyAct ? 'Participatory ' : '';
      if (a.AUT >= 65) return 'Authoritarian State';
      if (a.AUT >= 55) return 'Illiberal Democracy';
      if (a.AUT < 25) return part + 'Liberal Democracy';
      return part + 'Constitutional Democracy';
    },
    economic: function (a, ctx) {
      if (a.OWN >= 75) return a.STA >= 70 ? 'Command Economy' : 'Socialised Economy';
      if (a.OWN >= 55) return 'State Capitalism';
      var merc = (ctx.tariffRate >= 20 && a.NTV >= 65) ? ' · Mercantilist' : '';
      if (a.OWN <= 20 && a.HSP <= 35 && a.REG <= 35) return 'Laissez-Faire Capitalism' + merc;
      if (a.LFT >= 62 && a.HSP >= 70 && a.OWN <= 35) return 'Social Democracy' + merc;
      if (a.OWN >= 35) return 'Mixed Economy' + merc;
      return 'Market Economy' + merc; // USA baseline cell (OWN 12, HSP 50)
    },
    social: function (a, ctx) {
      if (a.TRD >= 55) return 'Traditionalism';
      if (a.NTV >= 55) return 'Nativism';
      if (a.NTV <= 30 && a.TRD <= 35) return 'Cosmopolitan Modernism';
      return 'Pluralism'; // USA baseline (archetype 8: NTV 50)
    }
  };

  /* Dalio markers (spec §6) — thresholds computed from game state in compass.js.
     Only computable markers are implemented; absent ones listed for honesty. */
  root.COMPASS_MARKERS_ABSENT = [
    'external war/alliance shocks', 'reserve-currency shock events',
    'natural-disaster markers', 'technology-breakthrough markers'
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = {
    COMPASS_META: root.COMPASS_META,
    COMPASS_USA_BASELINE: root.COMPASS_USA_BASELINE,
    COMPASS_SCENARIO_OFFSET: root.COMPASS_SCENARIO_OFFSET,
    COMPASS_FISCAL: root.COMPASS_FISCAL,
    COMPASS_ACT_DELTAS: root.COMPASS_ACT_DELTAS,
    COMPASS_BUDGET_DELTAS: root.COMPASS_BUDGET_DELTAS,
    COMPASS_BUDGET_CAP: root.COMPASS_BUDGET_CAP,
    COMPASS_SECTOR_DELTAS: root.COMPASS_SECTOR_DELTAS,
    COMPASS_LABEL_GATES: root.COMPASS_LABEL_GATES
  };
})(typeof window !== 'undefined' ? window : globalThis);

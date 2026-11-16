// PoliSim-DBE v0.4 — The Realignment (2016-2028+): scripted ACTUAL track through 2025, branching SIM from 2026.
// Loaded before data.js; consumed by SCENARIOS['realignment'].actualScript in data.js.
(function (root, factory) {
  var S = factory();
  if (typeof module === 'object' && module.exports) module.exports = S;
  root.SCENARIO_REALIGNMENT_2016 = S;
}(typeof self !== 'undefined' ? self : this, function () {
  return {
  "id": "realignment",
  "title": "The Realignment \u2014 scripted ACTUAL track (Trump \u2192 Biden \u2192 Trump, then a Project-2025-flavored horizon)",
  "startYear": 2016,
  "yearsActual": 10,
  "acts": [
    {
      "id": "tcja",
      "year": 2017,
      "title": "Tax Cuts and Jobs Act",
      "summary": "Corporate rate 35%\u219221%, individual cuts, SALT cap; ~$1.9tn added to the 10-yr deficit (CBO).",
      "effects": { "gdpGrowth": 0.45, "unemployment": -0.25, "inflation": 0.25, "debtDelta": 190, "corpTaxRate": -14, "incomeTaxRate": -1.5 }
    },
    {
      "id": "dereg1",
      "year": 2017,
      "title": "Deregulation wave (CRA rollbacks, energy/finance rules)",
      "summary": "14 Obama-era rules repealed via the Congressional Review Act; compliance costs fall, environmental and consumer protections thin.",
      "effects": { "gdpGrowth": 0.15, "inflation": -0.05, "regulation": -6, "envQuality": -2.5 }
    },
    {
      "id": "trade1",
      "year": 2018,
      "title": "Section 232/301 tariffs (steel, aluminum, China)",
      "summary": "Tariffs on $380bn of imports; Fed paper estimates net employment drag, consumers bear most of the cost.",
      "effects": { "gdpGrowth": -0.2, "inflation": 0.35, "unemployment": 0.1, "tradeOpenness": -6, "manufJobs": 0.15 }
    },
    {
      "id": "usmca",
      "year": 2020,
      "title": "USMCA (NAFTA replacement)",
      "summary": "NAFTA successor enters force; USITC estimates +$68bn GDP by year 6 \u2014 a reshuffle, not a reset.",
      "effects": { "gdpGrowth": 0.12, "tradeOpenness": 1.5, "manufJobs": 0.25 }
    },
    {
      "id": "cares",
      "year": 2020,
      "title": "CARES Act (COVID relief)",
      "summary": "$2.2tn: $1,200 checks, $600/wk unemployment top-up, PPP loans, airline/hospital bailouts.",
      "effects": { "gdpGrowth": 1.8, "unemployment": -2.2, "debtDelta": 2100, "inflation": 0.3, "poverty": -1.4 }
    },
    {
      "id": "covid_shock",
      "year": 2020,
      "title": "COVID-19 shock (exogenous)",
      "summary": "Lockdowns crater Q2 GDP by a record 9% (annualized 31%); unemployment peaks at 14.7%.",
      "effects": { "gdpGrowth": -3.4, "unemployment": 4.4, "inflation": -0.9, "debtDelta": 900, "healthOutcomes": -3 }
    },
    {
      "id": "arp",
      "year": 2021,
      "title": "American Rescue Plan",
      "summary": "$1.9tn: $1,400 checks, child tax credit expansion, state/local aid; critics link it to 2021-22 inflation.",
      "effects": { "gdpGrowth": 1.1, "unemployment": -0.9, "debtDelta": 1850, "inflation": 1.1, "poverty": -1.2 }
    },
    {
      "id": "iija",
      "year": 2021,
      "title": "Infrastructure Investment and Jobs Act",
      "summary": "$1.2tn ($550bn new) for roads, bridges, broadband, water, grid \u2014 bipartisan.",
      "effects": { "gdpGrowth": 0.35, "unemployment": -0.3, "debtDelta": 256, "infrastructure": 4, "manufJobs": 0.4 }
    },
    {
      "id": "chips",
      "year": 2022,
      "title": "CHIPS and Science Act",
      "summary": "$52.7bn semiconductor subsidies + R&D; fab construction boom in AZ/OH/NY.",
      "effects": { "gdpGrowth": 0.2, "debtDelta": 79, "manufJobs": 0.8, "techLevel": 1.5 }
    },
    {
      "id": "ira",
      "year": 2022,
      "title": "Inflation Reduction Act",
      "summary": "Clean-energy credits, Medicare drug pricing, IRS funding; scored \u2212$238bn to the 10-yr deficit (later eroded).",
      "effects": { "gdpGrowth": 0.15, "debtDelta": -238, "greenEnergy": 4, "healthCosts": -0.8 }
    },
    {
      "id": "fra",
      "year": 2023,
      "title": "Fiscal Responsibility Act (debt-ceiling deal)",
      "summary": "Suspends debt ceiling to Jan 2025; caps discretionary spending ~flat for two years.",
      "effects": { "debtDelta": -150, "govSpendingGrowth": -0.6 }
    },
    {
      "id": "tariffs2",
      "year": 2025,
      "title": "Universal + reciprocal tariff regime",
      "summary": "\u201cLiberation Day\u201d tariffs: effective rate 2.4%\u2192~17-18% peak; modeled drag on growth and trade, \u2212$2.8tn/10yr (CBO/Yale).",
      "effects": { "gdpGrowth": -0.55, "inflation": 0.9, "tradeOpenness": -12, "debtDelta": -280, "manufJobs": 0.3 }
    },
    {
      "id": "obba",
      "year": 2025,
      "title": "One Big Beautiful Bill Act",
      "summary": "Extends TCJA, adds tips/overtime deductions, Medicaid work requirements; CBO: +$3.4tn debt over 10 years.",
      "effects": { "gdpGrowth": 0.3, "debtDelta": 340, "incomeTaxRate": -1, "healthCoverage": -1.5, "poverty": 0.6 }
    },
    {
      "id": "doge",
      "year": 2025,
      "title": "DOGE federal workforce cuts",
      "summary": "Cost-cutting drive claims $190-215bn savings; GAO finds 96% unverifiable \u2014 modeled as small and noisy.",
      "effects": { "debtDelta": -60, "govSpendingGrowth": -1.2, "govServices": -2, "unemployment": 0.15 }
    }
  ],
  "turnEvents": [
    { "year": 2017, "text": "Trump takes office; unified GOP government passes TCJA on party lines.", "effects": { "party": { "presidentParty": 'r', "house": 241, "senate": 52 } } },
    { "year": 2018, "text": "Blue wave: Democrats flip the House (+41 seats) on health care and tariffs.", "effects": { "party": { "house": 235 } } },
    { "year": 2019, "text": "First Trump impeachment (Ukraine); economy steady at ~2.3% growth, 3.6% unemployment.", "effects": {} },
    { "year": 2020, "text": "COVID-19: 22m jobs lost in two months; CARES passes 96-0. George Floyd protests; record turnout election.", "effects": { "unemployment": 4.4, "gdpGrowth": -3.4, "party": { "presidentParty": 'd', "house": 222, "senate": 50 } } },
    { "year": 2021, "text": "Jan 6 Capitol attack; Biden inaugurated. Vaccine rollout; ARP passes without GOP votes; inflation begins climbing.", "effects": {} },
    { "year": 2022, "text": "Inflation peaks at 9.1% (June); Fed hikes 425bp in a year; Dobbs overturns Roe; Ukraine war shocks energy.", "effects": { "inflation": 3.2 } } ,
    { "year": 2023, "text": "Debt-ceiling standoff resolved by the Fiscal Responsibility Act; soft-landing hopes rise as inflation cools.", "effects": { "inflation": -1.4, "party": { "house": 221, "presidentParty": 'd' } } },
    { "year": 2024, "text": "Trump wins a second non-consecutive term (312 EV); GOP trifecta; immigration and prices dominate.", "effects": { "party": { "presidentParty": 'r', "house": 220, "senate": 53 } } },
    { "year": 2025, "text": "Tariff regime + OBBBA + DOGE: growth slows to ~1.8%, inflation re-accelerates toward 3%, term premium rises.", "effects": { "gdpGrowth": -0.4, "inflation": 0.6 } }
  ],
  "horizon": {
    "note": "From 2026 the SIM track takes over. The horizon below is a flavor baseline the engine blends with your policies \u2014 it is not a forecast.",
    "baseline": { "gdpGrowth": 1.8, "unemployment": 4.2, "inflation": 2.7, "debtGdpPath": [99, 101, 103, 105, 107] }
  }
};
}));

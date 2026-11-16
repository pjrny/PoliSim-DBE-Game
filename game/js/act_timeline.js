/* ============================================================================
   PoliSim-DBE v0.4 — Act effect timelines (enactment → 2025).
   GENERATED FILE — produced from research_act_timelines.json (compiled
   from SSA/CMS/USDA/EPA/DOL/OMB primary sources). Do not hand-edit.
   Consumed by the Acts-in-Force evidence panels (ui.js); the strip-and-
   simulate repeal feature (next phase) keys off acts[...].budgetCat.
   ========================================================================== */
window.ACT_TIMELINES = {
 "_meta": {
  "purpose": "Historical effects of 8 major US federal laws, 1935-2025, for a political simulation game with repeal mechanics",
  "conventions": "budgetArc.bn = annual federal outlay (or program total spending) in nominal $ billions at that year; detContribution is analysis/best-guess, not sourced fact; 'approx' flagged in notes where figures are rounded or estimated",
  "compiled": "2025",
  "note": "PoliSim-DBE v0.4: researched chronological effects (enactment→2025) of 8 heavy Acts. Powers the Acts-in-Force evidence panels and the future strip-and-simulate repeal feature. budgetCat maps each Act to the editable budget line(s) its repeal would hit."
 },
 "acts": {
  "ss1935": {
   "name": "Social Security Act of 1935 (OASI; DI added 1956)",
   "enacted": "1935-08-14",
   "budgetArc": [
    {
     "year": 1940,
     "bn": 0.04,
     "note": "First monthly benefits paid ($35M); retirement benefits began Jan 1940 (SSA Ann. Stat. Supp. Table 4.A4)"
    },
    {
     "year": 1950,
     "bn": 1.0,
     "note": "Benefits paid $961M; 1950 Amendments broadened coverage (SSA ASS 4.A4)"
    },
    {
     "year": 1965,
     "bn": 18.3,
     "note": "OASI+DI benefits $18.3B (SSA ASS 4.A4)"
    },
    {
     "year": 1980,
     "bn": 120.5,
     "note": "OASI $105.1B + DI $15.4B cash benefits (SSA ASS 4.A4)"
    },
    {
     "year": 2000,
     "bn": 407.6,
     "note": "OASI $352.7B + DI $54.9B (SSA ASS 4.A4)"
    },
    {
     "year": 2008,
     "bn": 615,
     "note": "OASDI benefit payments, approx (SSA OASDI Trustees)"
    },
    {
     "year": 2016,
     "bn": 911,
     "note": "OASDI benefit payments, approx (SSA OASDI Trustees)"
    },
    {
     "year": 2020,
     "bn": 1096,
     "note": "OASDI benefit payments; total cost $1.107T (SSA OASDI Trustees 2021)"
    },
    {
     "year": 2024,
     "bn": 1461,
     "note": "OASDI benefit payments; ~68M beneficiaries; ~5.1% of GDP, ~23% of federal budget (SSA OASDI Trustees 2025)"
    }
   ],
   "metricEffects": [
    {
     "metric": "Elderly poverty rate (65+)",
     "effect": "35% in 1959 -> 10.1% in 2023 (official measure); without Social Security income it would be 37.3% in 2023",
     "cite": "Census historical poverty tables; CBPP analysis of CPS 2024 (Romig 2025)"
    },
    {
     "metric": "People lifted above poverty line",
     "effect": "22.0 million in 2023, incl. 16.3M seniors, 4.8M adults 18-64, ~1M children; largest anti-poverty program",
     "cite": "CBPP / Census CPS March 2024 (2023 data)"
    },
    {
     "metric": "Beneficiary count",
     "effect": "~222,000 first monthly beneficiaries (1940) -> ~68M (2024), incl. ~9M disabled workers & dependents",
     "cite": "SSA OASDI Trustees 2025; SSA Fast Facts"
    },
    {
     "metric": "Share of elderly income",
     "effect": "Social Security provides >50% of income for about half of senior households; ~90% of income for ~1 in 4 seniors (approx)",
     "cite": "SSA Income of the Aged / SSA Fast Facts"
    },
    {
     "metric": "Financing",
     "effect": "12.4% payroll tax (6.2% each employer/employee); trust fund reserves ~$2.7T; OASI depletion projected ~2033 absent action",
     "cite": "SSA OASDI Trustees 2024/2025"
    },
    {
     "metric": "Cross-program effect",
     "effect": "Reduced elderly poverty among Black seniors from ~50% to ~18% and Latino seniors from ~45% to ~19% (2021)",
     "cite": "CBPP data in Journal of Economic Perspectives 39(1)"
    }
   ],
   "detContribution": [
    {
     "det": "economic output",
     "delta": "+",
     "rationale": "Stabilizes aggregate demand across cycles (automatic stabilizer) and frees capital formation by removing elderly-dependency burden from working families (analysis)"
    },
    {
     "det": "innovation & technology",
     "delta": "+",
     "rationale": "Retirement security raises lifetime risk tolerance for entrepreneurship/career change; weak but positive channel (analysis)"
    },
    {
     "det": "education",
     "delta": "+",
     "rationale": "Survivors/child benefits and higher household stability support human-capital investment of dependents (analysis)"
    },
    {
     "det": "competitiveness",
     "delta": "0/+",
     "rationale": "Payroll-tax wedge partially offsets; net roughly neutral-to-positive via demand stability (analysis)"
    },
    {
     "det": "financial-center status",
     "delta": "0",
     "rationale": "PAYGO system does not deepen capital markets the way funded pensions do (analysis)"
    },
    {
     "det": "reserve-currency status",
     "delta": "0",
     "rationale": "Entitlement solvency debates weigh on long-run fiscal outlook, but no direct channel (analysis)"
    }
   ],
   "stripStakeholders": [
    {
     "group": "seniors",
     "impact": "extreme",
     "note": "~68M beneficiaries; ~60M seniors/disabled lose core income; elderly poverty jumps ~10% -> ~37% (CBPP); approval collapse among highest-turnout bloc"
    },
    {
     "group": "workers",
     "impact": "high",
     "note": "4.8M working-age adults lifted out of poverty lose survivors/disability protection; intergenerational support burden shifts back onto families"
    },
    {
     "group": "youth",
     "impact": "medium",
     "note": "~1M children lifted out of poverty via survivors/dependent benefits; higher future elder-care burden"
    },
    {
     "group": "capitalists",
     "impact": "mixed",
     "note": "12.4% payroll tax removed boosts wages/profits short-run, but demand shock (~$1.5T/yr of retiree spending power) hits retail/health/housing sectors"
    },
    {
     "group": "technocrats",
     "impact": "high",
     "note": "Biggest second-order shock: disappearance of the largest automatic stabilizer makes recessions deeper; state/local relief systems overwhelmed, replaying 1930s poorhouse dynamics"
    }
   ],
   "sources": [
    "SSA OASDI Trustees Reports 2024/2025",
    "SSA Annual Statistical Supplement 2025 Tables 4.A1-4.A6",
    "CBPP 'Social Security Lifts More People Above the Poverty Line' (Romig, updated 2025)",
    "Census Historical Poverty Tables",
    "JEP 39(1) Social Security history article"
   ],
   "budgetCat": [
    "social_security"
   ]
  },
  "ui1935": {
   "name": "Unemployment Insurance (Titles III & IX, Social Security Act 1935; federal-state UI)",
   "enacted": "1935-08-14",
   "budgetArc": [
    {
     "year": 1940,
     "bn": 0.5,
     "note": "State UI benefits ~$0.5B, first payout decade (DOL ETA, approx)"
    },
    {
     "year": 1950,
     "bn": 1.4,
     "note": "State UI benefits (DOL ETA, approx)"
    },
    {
     "year": 1965,
     "bn": 2.2,
     "note": "State UI benefits (DOL ETA, approx)"
    },
    {
     "year": 1980,
     "bn": 14,
     "note": "Regular state UI during 1980 recession (DOL ETA, approx)"
    },
    {
     "year": 2000,
     "bn": 21,
     "note": "Regular state UI, boom-year low (DOL ETA, approx)"
    },
    {
     "year": 2008,
     "bn": 51.0,
     "note": "Total all programs: $43.1B state + $7.9B EUC08 (DOL ETA via IZA J Labor Policy 2023)"
    },
    {
     "year": 2009,
     "bn": 130.3,
     "note": "$79.6B state + $44.2B EUC08 + $6.5B EB; Great Recession peak response (DOL ETA)"
    },
    {
     "year": 2010,
     "bn": 138.0,
     "note": "Peak year incl. $70.2B EUC08; 2008-2013 cumulative $570B (DOL ETA)"
    },
    {
     "year": 2016,
     "bn": 31.7,
     "note": "Back to baseline, all programs (DOL ETA)"
    },
    {
     "year": 2019,
     "bn": 27.3,
     "note": "Pre-pandemic baseline (DOL ETA)"
    },
    {
     "year": 2020,
     "bn": 539.3,
     "note": "$143.6B state + $283.2B FPUC + $79.7B PUA + $28.6B PEUC (DOL ETA via IZA J Labor Policy 2023)"
    },
    {
     "year": 2021,
     "bn": 317.6,
     "note": "Pandemic programs expired Sept 6, 2021; 2020-21 cumulative $857B, $656B from emergency programs (DOL ETA)"
    },
    {
     "year": 2024,
     "bn": 35,
     "note": "Regular state UI, approx (DOL ETA)"
    }
   ],
   "metricEffects": [
    {
     "metric": "Anti-poverty effect",
     "effect": "UI kept ~2.5M people above SPM poverty line in 2012; ~0.5M in normal years",
     "cite": "CBPP analysis of Census SPM 2012"
    },
    {
     "metric": "Countercyclical coverage",
     "effect": "Peak: 5.9M on EUC08 (Feb-Mar 2010); 17M on PUA/PEUC (Aug 2020); avg weekly benefit ~$385 (Jan 2020), ~$985 with FPUC $600 supplement",
     "cite": "DOL ETA / Burtless 2020, in IZA Journal of Labor Policy 2023"
    },
    {
     "metric": "Automatic stabilizer scale",
     "effect": "Outlays swung $27B (2019) -> $539B (2020), ~20x expansion without new legislation; Moody's-style multiplier ~1.6 per $1 of UI extension",
     "cite": "DOL ETA; Blinder & Zandi 2015 (multiplier 1.61)"
    },
    {
     "metric": "Financing",
     "effect": "FUTA 6.0% on first $7,000 wages, net 0.6% with state credit; Title III funds state administration (~$4-5B/yr, approx)",
     "cite": "IRC; DOL ETA"
    },
    {
     "metric": "Recipiency",
     "effect": "Only ~25-30% of unemployed receive UI in normal times; state benefit replacement ~40-50% of prior wages (approx)",
     "cite": "DOL ETA / CBPP"
    }
   ],
   "detContribution": [
    {
     "det": "economic output",
     "delta": "+",
     "rationale": "Premier automatic stabilizer; cushions consumption in recessions (multiplier ~1.6) and shortens downturns (analysis; Blinder-Zandi 2015)"
    },
    {
     "det": "innovation & technology",
     "delta": "+",
     "rationale": "Income floor lets workers search for better job matches and take entrepreneurial risk (analysis)"
    },
    {
     "det": "competitiveness",
     "delta": "+",
     "rationale": "Better job matching raises allocative efficiency; small payroll-tax wedge partial offset (analysis)"
    },
    {
     "det": "education",
     "delta": "+",
     "rationale": "Household income smoothing protects children's schooling during parental unemployment (analysis)"
    },
    {
     "det": "military",
     "delta": "0",
     "rationale": "No direct channel (analysis)"
    },
    {
     "det": "trade",
     "delta": "0/+",
     "rationale": "Cushions adjustment costs of trade shocks, easing political resistance to openness (analysis)"
    }
   ],
   "stripStakeholders": [
    {
     "group": "workers",
     "impact": "extreme",
     "note": "In a 2020-scale shock, repeal removes $539B/yr of income support; consumption collapse cascades into second-round layoffs"
    },
    {
     "group": "youth",
     "impact": "high",
     "note": "Young workers have highest unemployment rates and least savings buffer"
    },
    {
     "group": "capitalists",
     "impact": "mixed",
     "note": "FUTA taxes removed (~$6-7B/yr) but demand-side multiplier loss (~1.6x) hurts firms in downturns; states lose Title III admin grants"
    },
    {
     "group": "seniors",
     "impact": "low",
     "note": "Minimal direct exposure"
    },
    {
     "group": "technocrats",
     "impact": "high",
     "note": "Biggest second-order shock: recession amplitude increases materially; state UI trust funds were designed inside federal framework (experience rating, Reed Act), so repeal forces 50-state re-legislation amid crisis"
    }
   ],
   "sources": [
    "DOL Employment & Training Administration UI financial data (ET 394/2112)",
    "IZA Journal of Labor Policy 2023 'U.S. Unemployment insurance through the Covid-19 crisis'",
    "Blinder & Zandi 2015",
    "CBPP SPM analyses 2012-2013",
    "SSA Act 1935 Titles III/IX"
   ],
   "budgetCat": [
    "income_security"
   ]
  },
  "gibill1944": {
   "name": "Servicemen's Readjustment Act of 1944 (GI Bill)",
   "enacted": "1944-06-22",
   "budgetArc": [
    {
     "year": 1945,
     "bn": 0.2,
     "note": "VA readjustment benefits ramp-up (VA historical, approx)"
    },
    {
     "year": 1948,
     "bn": 3.4,
     "note": "Peak spending year; veterans ~4% of labor force on programs (VA, approx)"
    },
    {
     "year": 1951,
     "bn": 2.0,
     "note": "Tapering; cumulative 1944-51 ~$14.5B (~1.5% of GDP at peak years) (VA/CBO historical, approx)"
    },
    {
     "year": 1956,
     "bn": 0.5,
     "note": "WWII program ends for most; cumulative cost ~$14.5B nominal (VA)"
    },
    {
     "year": 1985,
     "bn": 1.0,
     "note": "Montgomery GI Bill era (1984/85) (VA, approx)"
    },
    {
     "year": 2009,
     "bn": 3.5,
     "note": "Post-9/11 GI Bill begins (Aug 2009) (VA, approx)"
    },
    {
     "year": 2019,
     "bn": 13.5,
     "note": "Post-9/11 GI Bill + successors, ~700k+ users/yr (VA/CBO, approx)"
    },
    {
     "year": 2024,
     "bn": 14,
     "note": "VA education programs; cumulative Post-9/11 spending >$160B since 2009 (VA/CBO, approx)"
    }
   ],
   "metricEffects": [
    {
     "metric": "Veterans educated/trained",
     "effect": "7.8M of 16M eligible WWII veterans (49%) used education/training benefits by 1956; ~2.2M attended college/university, 3.5M other schooling, plus on-the-job/farm training",
     "cite": "VA historical data (GI Bill 50th anniversary; NARA)"
    },
    {
     "metric": "College expansion",
     "effect": "Total US college enrollment 1.5M (1940) -> 2.7M (1947); veterans ~half of male college students at peak",
     "cite": "NCES historical / NARA Prologue"
    },
    {
     "metric": "Home loans",
     "effect": "~2.4M VA-guaranteed home loans by 1952; VA mortgages fueled suburbia; US homeownership 44% (1940) -> 62% (1960)",
     "cite": "VA; Census housing historical"
    },
    {
     "metric": "Earnings effect",
     "effect": "GI Bill raised college completion ~20-30 pp for eligible cohorts; accounted for ~15% of median income rise for the 1940s birth cohort",
     "cite": "Bound & Turner 2002 QJE"
    },
    {
     "metric": "Return on investment",
     "effect": "Congressional analyses estimated ~$5-7 of added output/tax revenue per $1 spent (approx; commonly cited $7:$1)",
     "cite": "Congressional Joint Economic Committee estimates (1980s), widely cited"
    },
    {
     "metric": "Unemployment benefit",
     "effect": "~9M veterans used '52-20' readjustment unemployment pay at some point; smoothed demobilization of 16M (VA)",
     "cite": "VA historical"
    }
   ],
   "detContribution": [
    {
     "det": "education",
     "delta": "++",
     "rationale": "Largest single human-capital shock in US history; mass higher education a decade early, built the modern research-university system (analysis; Bound & Turner 2002)"
    },
    {
     "det": "innovation & technology",
     "delta": "++",
     "rationale": "Engineers/scientists of the 1950s-70s tech boom disproportionately GI-educated (analysis)"
    },
    {
     "det": "economic output",
     "delta": "++",
     "rationale": "Homeownership + skilled labor + demand smoothing underpinned 1945-73 golden age; ~$7:$1 return estimate (analysis)"
    },
    {
     "det": "competitiveness",
     "delta": "+",
     "rationale": "Skill premium advantage vs Europe/Japan in 1950s-60s (analysis)"
    },
    {
     "det": "military",
     "delta": "+",
     "rationale": "Education benefit became a permanent recruiting lever (Montgomery/Post-9/11 GI Bills) (analysis)"
    },
    {
     "det": "trade",
     "delta": "0",
     "rationale": "No direct channel (analysis)"
    },
    {
     "det": "financial-center status",
     "delta": "+",
     "rationale": "VA mortgage guarantee scaled mortgage finance and securities plumbing (analysis)"
    }
   ],
   "stripStakeholders": [
    {
     "group": "workers",
     "impact": "high",
     "note": "Modern analog: ~700k-1M Post-9/11 GI Bill users/yr lose tuition+housing; veteran unemployment rises"
    },
    {
     "group": "youth",
     "impact": "high",
     "note": "College access for military recruits collapses; enlistment incentive removed"
    },
    {
     "group": "military/veterans",
     "impact": "extreme",
     "note": "16M WWII vets historically; today's all-volunteer force relies on education benefit as top recruiting draw"
    },
    {
     "group": "capitalists",
     "impact": "mixed",
     "note": "Historical repeal (counterfactual) would have shrunk suburban construction/real-estate boom and skilled labor supply"
    },
    {
     "group": "technocrats",
     "impact": "high",
     "note": "Biggest second-order shock (1944 counterfactual): demobilizing 16M troops without benefits risks 1919-style unemployment/political radicalization; today: recruiting crisis + veteran higher-ed pipeline cut"
    }
   ],
   "sources": [
    "VA GI Bill history (50th/75th anniversary reports)",
    "NARA Prologue",
    "Bound & Turner 2002 QJE",
    "Census housing & NCES historical",
    "CBO/VA Post-9/11 GI Bill reports"
   ],
   "budgetCat": [
    "education",
    "veterans"
   ]
  },
  "interstate1956": {
   "name": "Federal-Aid Highway Act of 1956 (Interstate Highway System)",
   "enacted": "1956-06-29",
   "budgetArc": [
    {
     "year": 1957,
     "bn": 1.0,
     "note": "First full-year Interstate apportionments; 90% federal share; Highway Trust Fund + gas tax created 1956 (FHWA, approx)"
    },
    {
     "year": 1965,
     "bn": 4.0,
     "note": "Federal-aid highway outlays ramp (OMB Historical Tables, approx)"
    },
    {
     "year": 1980,
     "bn": 9.0,
     "note": "Federal highway outlays (OMB Hist. Tables, approx)"
    },
    {
     "year": 1992,
     "bn": 16,
     "note": "System declared complete (I-70 Glenwood Canyon, Oct 1992); cumulative cost ~$114B nominal vs $25B original 12-yr estimate (~$425-634B in 2006/2024 dollars) (FHWA/NARA, approx)"
    },
    {
     "year": 2000,
     "bn": 28,
     "note": "Federal-aid highway obligations (FHWA Highway Statistics, approx)"
    },
    {
     "year": 2008,
     "bn": 40,
     "note": "Pre-ARRA HTF spending; Trust Fund first bailout 2008 ($8B general-fund transfer) (FHWA/CBO, approx)"
    },
    {
     "year": 2016,
     "bn": 43,
     "note": "FAST Act era federal-aid highway outlays (FHWA, approx)"
    },
    {
     "year": 2020,
     "bn": 50,
     "note": "Federal-aid highway obligations (FHWA, approx)"
    },
    {
     "year": 2024,
     "bn": 62,
     "note": "IIJA (2021) elevated baseline, ~$110B/yr total DOT surface authorizations peak (FHWA/OMB, approx)"
    }
   ],
   "metricEffects": [
    {
     "metric": "System scale",
     "effect": "41,000 miles authorized (later 42,795); today 46,876 miles; ~35 years to complete vs 12 planned",
     "cite": "FHWA / NARA Prologue 'Ike's Interstates at 50'"
    },
    {
     "metric": "Cost",
     "effect": "~$114-129B nominal total vs $25B estimate; ~$425B (2006$) to ~$600B+ (2023$) inflation-adjusted",
     "cite": "NARA Prologue 2006; FHWA"
    },
    {
     "metric": "Commerce/freight",
     "effect": "Interstates ~1% of road miles carry ~25% of vehicle-miles traveled; trucking (Interstate-enabled) moves ~70%+ of US freight tonnage",
     "cite": "FHWA Freight Analysis; ATA (approx)"
    },
    {
     "metric": "Infrastructure condition",
     "effect": "ASCE 2009: overall infrastructure grade D, 5-yr investment need $2.2T; roads graded D-; 2021 C-; 2025 C (best ever) but residual gap ~$3.7T",
     "cite": "ASCE Report Cards 2009/2021/2025"
    },
    {
     "metric": "Economic impact",
     "effect": "Studies estimate Interstate construction raised sectoral productivity and drove Sun Belt/suburban growth; highway investment historically returned ~$0.20-0.30/yr output per $1 of capital (approx range)",
     "cite": "FHWA/transport economics literature (e.g., Nadiri & Mamuneas); ASCE Failure-to-Act 2016: underinvestment costs $3.9T GDP by 2025"
    },
    {
     "metric": "Safety/defense",
     "effect": "Controlled-access design far safer than surface roads (Interstate fatality rate roughly half of all-road average, approx); justified partly as defense mobility (official name: National System of Interstate and Defense Highways)",
     "cite": "FHWA/IIHS (approx); 1956 Act title"
    }
   ],
   "detContribution": [
    {
     "det": "competitiveness",
     "delta": "++",
     "rationale": "Cut freight times/costs nationally; enabled just-in-time logistics, national retail, Sun Belt industrial shift (analysis)"
    },
    {
     "det": "economic output",
     "delta": "++",
     "rationale": "Construction stimulus + durable productivity gain; suburbs/housing stock built around it (analysis)"
    },
    {
     "det": "innovation & technology",
     "delta": "+",
     "rationale": "Logistics, trucking, retail formats (big-box, malls) built on the network (analysis)"
    },
    {
     "det": "military",
     "delta": "+",
     "rationale": "Explicit defense-mobility rationale; 1-mi-in-5 straight for emergency aircraft use is myth but troop/materiel movement real (analysis)"
    },
    {
     "det": "trade",
     "delta": "+",
     "rationale": "Port-to-interior freight integration supports import/export economy (analysis)"
    },
    {
     "det": "financial-center status",
     "delta": "0",
     "rationale": "No direct channel (analysis)"
    }
   ],
   "stripStakeholders": [
    {
     "group": "capitalists",
     "impact": "extreme",
     "note": "Trucking/retail/logistics sectors lose the physical platform of US commerce; freight costs spike, inventory models break"
    },
    {
     "group": "workers",
     "impact": "high",
     "note": "~8-9M trucking/logistics jobs (ATA, approx) plus construction trades exposed; suburban commuters face congestion collapse"
    },
    {
     "group": "technocrats",
     "impact": "high",
     "note": "Biggest second-order shock: Highway Trust Fund/gas-tax model already near-insolvent (bailouts since 2008); repeal strands a 46,876-mi network with ASCE-estimated multi-trillion maintenance gap, devolving costs to states"
    },
    {
     "group": "seniors",
     "impact": "low-medium",
     "note": "Mobility/access effects, mostly indirect"
    },
    {
     "group": "youth",
     "impact": "low",
     "note": "Indirect via housing/commuting costs"
    }
   ],
   "sources": [
    "NARA Prologue 'Ike's Interstates at 50' (2006)",
    "FHWA Highway Statistics / Interstate 50th anniversary",
    "ASCE Report Card 2009, 2017, 2021, 2025",
    "OMB Historical Tables (transportation function)",
    "ASCE Failure to Act 2016",
    "ATA freight tonnage data"
   ],
   "budgetCat": [
    "transport"
   ]
  },
  "cra1964": {
   "name": "Civil Rights Act of 1964 (Titles II, VI, VII; created EEOC)",
   "enacted": "1964-07-02",
   "budgetArc": [
    {
     "year": 1966,
     "bn": 0.003,
     "note": "EEOC opens July 1965; first-year budget ~$3.3M; direct outlays trivial — effect is regulatory (EEOC, approx)"
    },
    {
     "year": 1980,
     "bn": 0.124,
     "note": "EEOC budget (EEOC, approx)"
    },
    {
     "year": 2000,
     "bn": 0.282,
     "note": "EEOC budget (EEOC, approx)"
    },
    {
     "year": 2008,
     "bn": 0.329,
     "note": "EEOC budget (EEOC, approx)"
    },
    {
     "year": 2016,
     "bn": 0.364,
     "note": "EEOC budget (EEOC, approx)"
    },
    {
     "year": 2020,
     "bn": 0.362,
     "note": "EEOC budget (EEOC, approx)"
    },
    {
     "year": 2024,
     "bn": 0.455,
     "note": "EEOC budget ~$455M; ~81k charges/yr filed (FY2023: 81,055) (EEOC, approx)"
    }
   ],
   "metricEffects": [
    {
     "metric": "Black/white male earnings ratio",
     "effect": "~60% before 1964 -> 74% by 1993; fastest convergence 1965-75, concentrated in the South (where Title VII coverage and federal contracting pressure were new)",
     "cite": "Clinton admin affirmative-action report (BLS/Census data); Donohue & Heckman 1991"
    },
    {
     "metric": "Black/white female earnings ratio",
     "effect": "~61% (1960) -> ~98% (1980) for women; Black women entered clerical/professional jobs en masse post-Title VII",
     "cite": "BLS/Census historical series"
    },
    {
     "metric": "Black poverty rate",
     "effect": "41.8% (1966, first year measured) -> 17.9% (2023)",
     "cite": "Census Historical Poverty Tables; Census 2024 report"
    },
    {
     "metric": "Black educational attainment",
     "effect": "Black adults 25+ with BA+: ~4% (1964, approx) -> ~28% (2023); Black college enrollment up ~550% 1962-2019",
     "cite": "Census/NCES historical (approx for 1964)"
    },
    {
     "metric": "Public accommodations & hospitals",
     "effect": "Title II ended legal segregation in hotels/restaurants; Title VI + Medicare funding (1966) desegregated ~1,000 Southern hospitals within months; Southern Black infant mortality fell sharply afterward",
     "cite": "Almond, Chay & Greenstone 2006 (NBER); JEP 39(1)"
    },
    {
     "metric": "EEOC enforcement scale",
     "effect": "81,055 charges filed FY2023; EEOC recovers ~$400-665M/yr for victims (FY2023 ~$665M, approx)",
     "cite": "EEOC FY2023 statistics"
    },
    {
     "metric": "Adjacent effect (VRA 1965)",
     "effect": "Black voter registration in the South ~29% -> ~67% (1965-69) — driven by Voting Rights Act, not CRA itself; flag to avoid misattribution",
     "cite": "US Commission on Civil Rights historical"
    }
   ],
   "detContribution": [
    {
     "det": "economic output",
     "delta": "+",
     "rationale": "Reallocating talent away from discriminatory barriers raised aggregate productivity (Hsieh et al. 2019: ~20-40% of 1960-2010 growth from improved talent allocation incl. women/Black workers, analysis-adjacent)"
    },
    {
     "det": "education",
     "delta": "+",
     "rationale": "Titles IV/VI drove school desegregation enforcement; Black college attainment rose ~7x (analysis)"
    },
    {
     "det": "innovation & technology",
     "delta": "+",
     "rationale": "Broader talent pool for science/professions (analysis)"
    },
    {
     "det": "competitiveness",
     "delta": "+",
     "rationale": "Labor-market efficiency and reduced regional distortion in the South (analysis; Wright 2013 'Sharing the Prize')"
    },
    {
     "det": "military",
     "delta": "0/+",
     "rationale": "Indirect: broader recruitment pool, unit cohesion (analysis)"
    },
    {
     "det": "trade",
     "delta": "0",
     "rationale": "No direct channel (analysis)"
    }
   ],
   "stripStakeholders": [
    {
     "group": "workers",
     "impact": "extreme",
     "note": "Black/minority workers (~40M+ people of color in labor force, approx) lose Title VII anti-discrimination recourse; wage-gap convergence risks reversal (evidence: convergence stalled when enforcement eased in 1980s)"
    },
    {
     "group": "youth",
     "impact": "high",
     "note": "Education Titles IV/VI protections removed; college-access pipeline effects"
    },
    {
     "group": "capitalists",
     "impact": "mixed",
     "note": "Compliance/litigation burden falls, but customer-base segregation costs and talent misallocation rise; Southern firms in 1964 often welcomed federal preemption of local Jim Crow (Wright 2013)"
    },
    {
     "group": "religious",
     "impact": "medium",
     "note": "Church networks were key CRA coalition; repeal inflames denominational politics"
    },
    {
     "group": "immigrants",
     "impact": "high",
     "note": "National-origin discrimination protection (Title VII) disappears for ~46M foreign-born residents (Census 2023, approx)"
    },
    {
     "group": "technocrats",
     "impact": "high",
     "note": "Biggest second-order shock: legal chaos as 50 states rebuild civil-rights law patchwork; legitimacy shock with mass protest risk (1963-68 precedent)"
    }
   ],
   "sources": [
    "Clinton WH affirmative action empirical report (1995)",
    "Donohue & Heckman 1991 JEL",
    "Wright 2013 'Sharing the Prize'",
    "Hsieh et al. 2019 QJE",
    "Almond/Chay/Greenstone 2006 NBER",
    "Census Historical Poverty & Educational Attainment",
    "EEOC charge statistics FY2023"
   ],
   "budgetCat": [
    "justice"
   ]
  },
  "medicare1965": {
   "name": "Social Security Amendments of 1965 (Medicare & Medicaid, Titles XVIII & XIX)",
   "enacted": "1965-07-30",
   "budgetArc": [
    {
     "year": 1967,
     "bn": 4.5,
     "note": "Medicare first full year ($4.5B); Medicaid $2.9B total federal+state; 19.1M enrolled Medicare July 1966 (CMS NHE; CMS)"
    },
    {
     "year": 1970,
     "bn": 7.7,
     "note": "Medicare $7.7B; Medicaid $5.3B (CMS NHE)"
    },
    {
     "year": 1980,
     "bn": 37.4,
     "note": "Medicare $37.4B; Medicaid $26.0B fed+state (CMS NHE)"
    },
    {
     "year": 1990,
     "bn": 111,
     "note": "Medicare ~$111B; Medicaid ~$75B fed+state (CMS NHE)"
    },
    {
     "year": 2000,
     "bn": 224,
     "note": "Medicare $224B; Medicaid ~$201B fed+state (CMS NHE)"
    },
    {
     "year": 2010,
     "bn": 524,
     "note": "Medicare ~$524B; Medicaid ~$401B fed+state (CMS NHE)"
    },
    {
     "year": 2016,
     "bn": 675,
     "note": "Medicare ~$675B; Medicaid ~$566B fed+state (CMS NHE, approx)"
    },
    {
     "year": 2020,
     "bn": 929,
     "note": "Medicare ~$929B; Medicaid ~$671B fed+state (CMS NHE)"
    },
    {
     "year": 2023,
     "bn": 1029,
     "note": "Medicare $1,029B; Medicaid $871B fed+state; combined >$1.9T, ~39% of $4.9T national health spending (CMS NHE 2023)"
    },
    {
     "year": 2024,
     "bn": 1050,
     "note": "Medicare federal budget outlays ~$1.05T gross / ~$850B net of premiums; ~67M enrollees (OMB/CBO/CMS Trustees, approx)"
    }
   ],
   "metricEffects": [
    {
     "metric": "Senior insurance coverage",
     "effect": "~44-50% of seniors uninsured (only ~25% had meaningful hospital insurance) pre-1965 -> ~97% covered virtually immediately; today ~1-2% of 65+ uninsured",
     "cite": "CMS 'Medicare & Medicaid at 50' (2015); Harris 1966 survey; Congressional Record 2003"
    },
    {
     "metric": "Enrollment",
     "effect": "Medicare 19.1M (1966) -> 65.7M (2023) -> ~68M (2025); Medicaid ~4M (1966) -> ~72M (2024), ~1 in 5 Americans",
     "cite": "CMS/Statista Medicare enrollment 1966-2023; CMS Medicaid enrollment"
    },
    {
     "metric": "Out-of-pocket risk",
     "effect": "Medicare cut top-quartile elderly out-of-pocket spending ~40% (first decade); large financial-risk protection though first-decade mortality effect was small",
     "cite": "Finkelstein & McKnight 2008 QJE"
    },
    {
     "metric": "Hospital desegregation effect",
     "effect": "Medicare certification + Title VI desegregated Southern hospitals in 1966; associated with large drop in Black infant mortality in the South (~50% gap reduction in affected cohorts)",
     "cite": "Almond, Chay & Greenstone 2006 NBER; JEP 39(1)"
    },
    {
     "metric": "Life expectancy at 65",
     "effect": "14.4 additional years (1960) -> ~19.5 (2022); multi-causal (Medicare one contributor)",
     "cite": "SSA/CDC life tables (approx)"
    },
    {
     "metric": "Medicaid safety-net role",
     "effect": "Medicaid pays ~40%+ of US births and ~2/3 of nursing-home care; largest US health program by enrollment",
     "cite": "KFF/CMS/MACPAC"
    },
    {
     "metric": "Program cost trajectory",
     "effect": "Medicare $3B (1966) -> $1T+ (2023-24), ~3.9% of GDP; combined Medicare+Medicaid ~10% of federal revenue base; largest driver of long-run federal deficits per CBO",
     "cite": "CMS NHE; CBO Long-Term Budget Outlook"
    }
   ],
   "detContribution": [
    {
     "det": "economic output",
     "delta": "+",
     "rationale": "Health security raises labor participation/productivity and eliminates medical-bankruptcy drag; health sector itself ~17% of GDP (analysis)"
    },
    {
     "det": "innovation & technology",
     "delta": "++",
     "rationale": "Guaranteed public payer de-risked the entire US biomedical/clinical industry (devices, pharma, hospital tech) (analysis)"
    },
    {
     "det": "competitiveness",
     "delta": "+/0",
     "rationale": "Frees employers from retiree health costs (positive) but ~18% of GDP health spending is a cost drag vs peers (analysis)"
    },
    {
     "det": "education",
     "delta": "+",
     "rationale": "Medicaid/CHIP-linked child health improves schooling outcomes; maternal coverage effects (analysis)"
    },
    {
     "det": "military",
     "delta": "0",
     "rationale": "No direct channel (analysis)"
    },
    {
     "det": "financial-center status",
     "delta": "0",
     "rationale": "Indirect via health-sector capital markets (analysis)"
    }
   ],
   "stripStakeholders": [
    {
     "group": "seniors",
     "impact": "extreme",
     "note": "67M Medicare enrollees; repeal -> senior uninsured rate 2% -> ~50% pre-1965 conditions; highest-turnout voting bloc; approval collapse"
    },
    {
     "group": "workers",
     "impact": "high",
     "note": "72M Medicaid enrollees incl. ~40% of children; low-wage workers lose only coverage (esp. non-expansion states)"
    },
    {
     "group": "youth",
     "impact": "high",
     "note": "Children are ~half of Medicaid enrollment; loss hits child health/schooling"
    },
    {
     "group": "capitalists",
     "impact": "extreme second-order",
     "note": "Biggest second-order shock: ~$2T/yr of provider revenue vanishes — hospital sector, pharma, insurers (Medicare Advantage ~50%+ of Medicare) face immediate revenue cliff; rural hospitals (Medicaid-dependent) collapse"
    },
    {
     "group": "religious",
     "impact": "medium",
     "note": "Faith-based hospitals/charity care load returns to pre-1965 patterns"
    },
    {
     "group": "technocrats",
     "impact": "high",
     "note": "Entire federal health-financing architecture (DRGs, payment systems, quality metrics) dismantled; states cannot absorb ~$600B federal Medicaid share"
    }
   ],
   "sources": [
    "CMS National Health Expenditure Accounts (NHE 1960-2023)",
    "CMS 'Medicare and Medicaid at 50' fact sheet 2015",
    "Medicare Trustees Report 2024",
    "CBO Long-Term Budget Outlook",
    "Finkelstein & McKnight 2008 QJE",
    "Almond/Chay/Greenstone 2006",
    "KFF Medicaid data",
    "Congressional Record 2003 (44% -> 1% uninsured seniors)"
   ],
   "budgetCat": [
    "medicare",
    "medicaid"
   ]
  },
  "snap1964": {
   "name": "Food Stamp Act of 1964 (permanent program; SNAP since 2008)",
   "enacted": "1964-08-31",
   "budgetArc": [
    {
     "year": 1969,
     "bn": 0.6,
     "note": "2.9M participants; national rollout after 1964 Act (USDA FNS)"
    },
    {
     "year": 1980,
     "bn": 9.5,
     "note": "21.1M participants; purchase requirement eliminated 1977-79 (USDA FNS)"
    },
    {
     "year": 1990,
     "bn": 15.5,
     "note": "~20M participants (USDA FNS, approx)"
    },
    {
     "year": 2000,
     "bn": 17.1,
     "note": "17.2M participants, post-welfare-reform trough (USDA FNS)"
    },
    {
     "year": 2008,
     "bn": 39.2,
     "note": "28.2M participants; renamed SNAP Oct 2008 (USDA FNS)"
    },
    {
     "year": 2013,
     "bn": 79.9,
     "note": "Peak: 47.6M participants (FY avg); ARRA boost expired Nov 2013 (USDA FNS FY23 Characteristics)"
    },
    {
     "year": 2019,
     "bn": 60.4,
     "note": "35.7M participants, expansion-era low (USDA FNS)"
    },
    {
     "year": 2020,
     "bn": 79.2,
     "note": "39.9M avg participants; pandemic emergency allotments (USDA FNS/AAF)"
    },
    {
     "year": 2022,
     "bn": 119.6,
     "note": "Peak cost: emergency allotments + Thrifty Food Plan update (Oct 2021, +21%) (USDA FNS)"
    },
    {
     "year": 2023,
     "bn": 113.2,
     "note": "42.2M avg participants, $107.1B benefits; avg benefit ~$6.20/person/day (USDA FNS)"
    },
    {
     "year": 2024,
     "bn": 100.3,
     "note": "~41.7M participants; $93.7B benefits (USDA FNS via Pew 2025)"
    },
    {
     "year": 2025,
     "bn": 101.7,
     "note": "42.1M participants; 12.3% of US residents; ~69% of USDA nutrition-assistance spending (USDA ERS)"
    }
   ],
   "metricEffects": [
    {
     "metric": "GDP multiplier",
     "effect": "$1B SNAP -> $1.79B GDP (FANIOM); $1.54B (FEDS-SAM 2019); Moody's model 1.73-1.74 in recession — highest multiplier of any stimulus category studied",
     "cite": "USDA ERS Hanson 2010 ERR-103; Canning & Stacy 2019 ERR-265; Blinder & Zandi 2015"
    },
    {
     "metric": "Jobs impact",
     "effect": "8,900-17,900 FTE jobs per $1B of SNAP benefits; county-level: +40-50k jobs per $1B during 2001-14, larger in Great Recession",
     "cite": "USDA ERS Hanson 2010; Pender et al. 2019"
    },
    {
     "metric": "Anti-poverty effect",
     "effect": "3.4M people lifted above SPM poverty line (2023; also 2017 incl. 1.5M children); with underreporting correction ~6.6M pre-COVID (incl. 3M children); cuts deep poverty (<50% of line) sharply (15.4% -> 10% share, 2017)",
     "cite": "Census SPM 2017; CBPP 2018/2023/2024"
    },
    {
     "metric": "Food insecurity",
     "effect": "SNAP participation reduces food insecurity ~30%; household food insecurity 10.2% (2021 low with expanded benefits) -> 13.5% (2023) after allotments ended",
     "cite": "Ratcliffe et al. 2011 AJAE; USDA ERS 2024"
    },
    {
     "metric": "Health effect",
     "effect": "SNAP participation associated with ~$1,400/yr lower health-care spending per low-income adult",
     "cite": "Berkowitz et al. 2017 JAMA Internal Medicine"
    },
    {
     "metric": "Targeting",
     "effect": "~89% of benefits go to households at/below poverty line; 54% to households below half of poverty; ~2/3 of participants are children, elderly, or disabled",
     "cite": "USDA FNS Characteristics FY2022-23"
    }
   ],
   "detContribution": [
    {
     "det": "economic output",
     "delta": "+",
     "rationale": "Automatic stabilizer with highest-in-class multiplier (~1.5-1.8); benefits spent immediately, cushioning recessions (analysis; USDA ERS)"
    },
    {
     "det": "education",
     "delta": "+",
     "rationale": "Childhood nutrition improves cognitive development, schooling, and adult earnings (Hoynes/Schanzenbach/Almond 2016: food-stamp access in childhood -> +18 pp high-school completion etc.) (analysis)"
    },
    {
     "det": "innovation & technology",
     "delta": "0/+",
     "rationale": "Indirect via child human capital (analysis)"
    },
    {
     "det": "competitiveness",
     "delta": "0/+",
     "rationale": "Healthier low-wage workforce; modest (analysis)"
    },
    {
     "det": "trade",
     "delta": "+",
     "rationale": "Food demand supports farm economy; ~$32M farm income per $1B SNAP (ERS) (analysis)"
    },
    {
     "det": "reserve-currency status",
     "delta": "0",
     "rationale": "No channel (analysis)"
    }
   ],
   "stripStakeholders": [
    {
     "group": "youth",
     "impact": "extreme",
     "note": "~40% of benefits flow to children; childhood nutrition losses show up in adult earnings/health decades later (Hoynes et al. 2016)"
    },
    {
     "group": "workers",
     "impact": "extreme",
     "note": "42M participants, mostly working-poor households (service/sales occupations); immediate food-security shock"
    },
    {
     "group": "seniors",
     "impact": "high",
     "note": "~26% of SNAP households include an elderly member"
    },
    {
     "group": "capitalists",
     "impact": "high second-order",
     "note": "Biggest second-order shock: removal of ~$100B/yr of grocery-sector demand; multiplier ~1.5-1.8 means ~$150-180B GDP hit in a downturn; grocers (Walmart ~largest SNAP retailer), food supply chain, farm income all contract simultaneously"
    },
    {
     "group": "religious",
     "impact": "medium",
     "note": "Food banks/charities (heavily faith-based) overwhelmed — Feeding America network provides ~1 meal per ~9 SNAP meals, cannot substitute"
    },
    {
     "group": "technocrats",
     "impact": "medium",
     "note": "EBT infrastructure and farm-bill coalition (nutrition + agriculture) collapse; states lose ~50% federal admin cost share"
    }
   ],
   "sources": [
    "USDA FNS National Level Annual Summary 1969-2025",
    "USDA FNS Characteristics of SNAP Households FY2023",
    "USDA ERS Hanson 2010 ERR-103 (multiplier 1.79)",
    "USDA ERS Canning & Stacy 2019 ERR-265 (multiplier 1.54)",
    "Blinder & Zandi 2015 (1.73-1.74)",
    "Census SPM 2017",
    "CBPP SNAP Chart Book 2024",
    "Hoynes, Schanzenbach & Almond 2016 AER",
    "Berkowitz et al. 2017 JAMA",
    "Pew 2025",
    "USDA ERS Key Statistics FY2025"
   ],
   "budgetCat": [
    "income_security"
   ]
  },
  "cleanair1970": {
   "name": "Clean Air Act Amendments of 1970 (NAAQS, EPA enforcement; amended 1977, 1990)",
   "enacted": "1970-12-31",
   "budgetArc": [
    {
     "year": 1971,
     "bn": 1.3,
     "note": "EPA first full-year budget (agency created Dec 1970); direct federal outlay small vs private compliance costs (EPA budget history, approx)"
    },
    {
     "year": 1980,
     "bn": 5.6,
     "note": "EPA budget peak of era incl. wastewater grants (EPA/OMB, approx)"
    },
    {
     "year": 1990,
     "bn": 5.5,
     "note": "1990 Amendments year: acid rain cap-and-trade, toxic air program added (EPA/OMB, approx)"
    },
    {
     "year": 2000,
     "bn": 7.4,
     "note": "EPA budget (OMB, approx)"
    },
    {
     "year": 2010,
     "bn": 10.3,
     "note": "EPA budget incl. ARRA supplement (OMB, approx)"
    },
    {
     "year": 2016,
     "bn": 8.1,
     "note": "EPA budget (OMB, approx)"
    },
    {
     "year": 2020,
     "bn": 9.1,
     "note": "EPA budget; compliance cost of 1990 Amendments ~$65B/yr borne by private sector (OMB; EPA 2011)"
    },
    {
     "year": 2024,
     "bn": 9.2,
     "note": "EPA base budget, plus multi-year IIJA/IRA supplements (~$100B+ climate/clean-energy authorities) (OMB/EPA, approx)"
    }
   ],
   "metricEffects": [
    {
     "metric": "Criteria pollutant emissions",
     "effect": "Aggregate emissions of the 6 criteria pollutants (PM, SO2, NOx, VOCs, CO, Pb) down ~73-78% 1970-2017/2023 while GDP grew ~262-324%; lead down ~98%, new cars ~99% cleaner than 1970",
     "cite": "EPA Air Quality Trends / EPA CAA 40th anniversary (1970-2017: -73%, GDP +324%)"
    },
    {
     "metric": "Lives saved (prospective)",
     "effect": "1990 Amendments prevent ~230,000 premature deaths in 2020 alone, plus 200,000 heart attacks, 2.4M asthma attacks, 17M lost workdays",
     "cite": "EPA 2011 Second Prospective Study (1990-2020)"
    },
    {
     "metric": "Lives saved (retrospective)",
     "effect": "1970-1990 rules prevented ~205,000 premature deaths over the period; benefits ~$22.2T (mean) vs costs $523B (~42:1)",
     "cite": "EPA 1997 Retrospective Study"
    },
    {
     "metric": "Benefit-cost ratio",
     "effect": "Central estimate: benefits exceed costs >30:1 (benefits ~$2T in 2020 vs $65B compliance cost); range 3:1 to 90:1; ~85% of benefits from avoided PM mortality",
     "cite": "EPA 2011 Second Prospective"
    },
    {
     "metric": "Ambient concentrations",
     "effect": "CO -85%, ozone -35%, lead -98%, NO2 -95%, SO2 -92% over ~40 years; PM2.5 national avg down ~37% since 2000 (approx)",
     "cite": "EPA Air Quality National Summary"
    },
    {
     "metric": "Macro effect",
     "effect": "GDP ~1.5% higher in 2010 because of the CAA (health/productivity savings); pollution controls did not stop growth — GDP +262% to +324% since 1970",
     "cite": "Jorgenson et al. 2010 Harvard analysis; EPA"
    },
    {
     "metric": "Innovation",
     "effect": "Catalytic converter, scrubbers, low-NOx burners, cap-and-trade (SO2 allowance trading cut compliance costs ~50-83% below projections) — regulation-induced innovation canonical case",
     "cite": "RFF/MIT acid rain cost studies; EPA"
    }
   ],
   "detContribution": [
    {
     "det": "economic output",
     "delta": "+",
     "rationale": "Net positive: $2T/yr benefits vs $65B costs; avoided lost workdays/health costs raise effective labor supply (analysis; EPA 2011, Jorgenson)"
    },
    {
     "det": "innovation & technology",
     "delta": "++",
     "rationale": "Forced-technology regulation spawned entire environmental-tech industry and the first large cap-and-trade market (analysis)"
    },
    {
     "det": "competitiveness",
     "delta": "+/0",
     "rationale": "Compliance costs real (~$65B/yr) but offset by productivity + exportable clean tech; empirical plant-level effects modest (analysis)"
    },
    {
     "det": "trade",
     "delta": "0/+",
     "rationale": "Clean-tech exports; pollution-haven effects small in evidence (analysis)"
    },
    {
     "det": "military",
     "delta": "0",
     "rationale": "No direct channel (analysis)"
    },
    {
     "det": "education",
     "delta": "+",
     "rationale": "Lower childhood PM/lead exposure improves cognition and schooling (5.4M school-loss days prevented in 2020) (analysis; EPA)"
    }
   ],
   "stripStakeholders": [
    {
     "group": "workers",
     "impact": "high",
     "note": "Respiratory/cardiovascular health burden falls on industrial-belt and fence-line communities; reversal adds ~230k premature deaths/yr trajectory"
    },
    {
     "group": "youth",
     "impact": "high",
     "note": "Lead/PM exposure harms child cognition (2.4M asthma attacks, 5.4M school-loss days prevented in 2020 would return)"
    },
    {
     "group": "capitalists",
     "impact": "mixed",
     "note": "Compliance-cost relief ~$65B/yr (1990-A program), but health-sector/employer productivity gains (~$2T benefits) lost; clean-tech industry stranded"
    },
    {
     "group": "immigrants",
     "impact": "medium",
     "note": "Fence-line/urban air-quality burdens disproportionately hit immigrant communities"
    },
    {
     "group": "technocrats",
     "impact": "high",
     "note": "Biggest second-order shock: NAAQS/state-implementation-plan framework dismantled; 50-state patchwork, interstate pollution externalities unpriced (SO2/NOx cross-state), health costs shift onto Medicare/Medicaid budgets — i.e., repeal partially pays for other acts' cost growth"
    }
   ],
   "sources": [
    "EPA 'Benefits and Costs of the Clean Air Act 1990-2020' Second Prospective (2011)",
    "EPA 1997 Retrospective (1970-1990, ~42:1)",
    "EPA Air Quality Trends/National Summary",
    "EPA CAA 40th Anniversary highlights",
    "Jorgenson et al. Harvard 2010",
    "OMB Historical Tables (EPA budget)",
    "NCBI/PMC 'The impact of the Clean Air Act'"
   ],
   "budgetCat": [
    "environment"
   ]
  }
 }
};

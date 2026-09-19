/* PoliSim-DBE v0.3 - acts_content.js
   Policy option explanations, preloaded historical Acts, and budget hints.
   Plain browser global, no modules. Option ids match js/data.js exactly.
   Numbers flagged by the source ledger as modeling assumptions are phrased
   as "the platform projects" rather than research findings. */
window.ACT_CONTENT = {
  policies: {
    tax: {
      summary: "What share of federal income tax to replace with a national VAT. States keep their own taxes either way.",
      options: {
        slider: {
          does: "Shifts federal collection from income toward consumption: each 10-point step replaces a tenth of income-tax revenue with VAT receipts at a matched rate.",
          doesnt: "Does not settle fairness by itself - a VAT without rebates lands hardest on low-income households who spend most of what they earn.",
          budget: "The platform projects about +0.45% of GDP (~$65B/yr at 2008 scale) in net revenue per 10 points of VAT share; treat the coefficient as a modeling assumption, not an estimate.",
          results: "Consumption taxes reduce the tax wedge on saving and investment relative to income taxes (Tax Foundation analysis) and VATs are hard to evade - nearly every OECD country uses one. Distributional pain is real unless paired with transfers (see Welfare/UBI).",
          cites: [
            "Tax Foundation, How Taxing Consumption Would Improve Long-Term Opportunity (2023)",
            "Yang 2020 policy archive: Value-Added Tax",
            "PoliSim source ledger: VAT revenue coefficient flagged as unsourced"
          ]
        }
      }
    },
    military: {
      summary: "Rebalance the defense budget; freed funds split between healthcare, cybersecurity and R&D.",
      options: {
        increase: {
          does: "Raises defense outlays by about 0.9% of GDP (~$130B/yr) for force buildup and readiness.",
          doesnt: "Does not buy innovation - defense is the least employment-intensive sector studied per dollar spent.",
          budget: "Adds roughly $130B/yr (~0.9% of GDP) to outlays.",
          results: "Military determinant rises ~1 point/turn while active. Opportunity cost is the story: Garrett-Peltier estimates ~6.9 jobs per $1M of defense spending versus ~19.2 in education and ~16-17 in healthcare and clean energy.",
          cites: ["Garrett-Peltier, Job Opportunity Cost of War (Brown Costs of War, 2017)"]
        },
        hold: {
          does: "Keeps defense outlays at current levels - roughly $600-700B/yr including Iraq and Afghanistan war funding.",
          doesnt: "Does not free any funds for health, cyber or R&D, and keeps Dalio's late-cycle overextension risk on the books.",
          budget: "Neutral - no change to outlays.",
          results: "Status quo: military determinant steady, no fiscal relief. The Costs of War analysis quantifies what the same dollars would buy in domestic sectors.",
          cites: ["Garrett-Peltier, Job Opportunity Cost of War (2017)"]
        },
        cut25: {
          does: "Cuts defense outlays by ~25% and redirects the savings to healthcare, cybersecurity and scientific R&D.",
          doesnt: "Does not make the cuts painless - force structure shrinks and deterrence depends on rivals not testing the gap.",
          budget: "Frees roughly $150-175B/yr (a quarter of ~$700B); the sim books ~0.5% of GDP in savings.",
          results: "Reallocated dollars buy more jobs (6.9 per $1M defense vs ~19 in education - Garrett-Peltier) and public R&D lifts productivity over multi-year lags (Fieldhouse & Mertens). Military determinant falls ~1 point/turn.",
          cites: [
            "Garrett-Peltier, Job Opportunity Cost of War (2017)",
            "Fieldhouse & Mertens, The Social Returns to Public R&D (NBER WP 33780)"
          ]
        },
        cut50: {
          does: "Cuts defense outlays by ~50% - a peacetime-style posture - with the savings split across healthcare, cybersecurity and R&D.",
          doesnt: "Does not preserve current global commitments; bases close, alliances notice, and the military determinant drops fast (~2 points/turn).",
          budget: "Frees on the order of $300-350B/yr; the sim books ~1.0% of GDP in savings.",
          results: "Largest possible sector-shift dividend: domestic sectors support roughly 2-3x the jobs per dollar (Garrett-Peltier), and R&D compounds into the innovation determinant. The platform's exact multiplier gap between sectors is a modeling assumption.",
          cites: [
            "Garrett-Peltier, Job Opportunity Cost of War (2017)",
            "Fieldhouse & Mertens (NBER WP 33780)",
            "PoliSim source ledger: 0.4 multiplier difference flagged as illustrative"
          ]
        }
      }
    },
    drug: {
      summary: "Set the federal posture on narcotics, from prohibition to a legal, taxed market.",
      options: {
        prohibited: {
          does: "Keeps federal prohibition: possession and sale remain crimes, enforced by DEA and the courts.",
          doesnt: "Does not shrink the black market - NIJ's deterrence review finds certainty of being caught matters, and current enforcement achieves little of it.",
          budget: "Neutral federally; total US corrections spending runs ~$80B/yr across all levels of government.",
          results: "Continuation of the 2008 baseline: ~36,000 overdose deaths a year (CDC/NCHS), ~2.3M incarcerated (BJS), cartel revenue untouched.",
          cites: [
            "NIJ, Five Things About Deterrence",
            "CDC/NCHS overdose data; BJS corrections data"
          ]
        },
        decriminalized: {
          does: "Ends criminal penalties for personal possession and routes users to treatment instead - the Portugal 2001 model. Sale stays illegal.",
          doesnt: "Does not create a legal, taxed market: supply remains illicit and product quality uncontrolled.",
          budget: "Savings from fewer arrests and cells; the platform books low tens of $B/yr as a scenario value, not a measured figure.",
          results: "Portugal after 2001: drug-related deaths and HIV infections fell sharply while treatment uptake rose (Greenwald/Cato 2009; EUDA 2017). Important: Portugal decriminalized use only - it cannot establish effect sizes for full legalization.",
          cites: [
            "Greenwald, Drug Decriminalization in Portugal (Cato Institute, 2009)",
            "EUDA/EMCDDA, Portugal Country Drug Report (2017)"
          ]
        },
        legal: {
          does: "Legalizes, regulates and taxes recreational drugs and related vice: licensed sale, age limits, quality control, excise taxes.",
          doesnt: "Does not guarantee overdose declines - the source ledger flags all legalization effect sizes (crime -10%, overdoses -10%) as unsupported generic coefficients.",
          budget: "The platform projects roughly $40-60B/yr in new revenue plus enforcement savings; state gambling taxes ($35B in FY2021) are the closest measured benchmark for legalized vice.",
          results: "Revenue appears and incarceration falls (~1.2%/qtr in-sim). Best causal analog from a decriminalized vice market: Rhode Island's accidental legalization of indoor prostitution was followed by 31% fewer reported rapes and 39% fewer female gonorrhea cases over 2004-09 (Cunningham & Shah).",
          cites: [
            "Cunningham & Shah, Decriminalizing Indoor Prostitution (NBER WP 20281)",
            "Urban-Brookings Tax Policy Center: gambling revenue data",
            "EUDA Portugal (2017) - decriminalization evidence only"
          ]
        }
      }
    },
    church: {
      summary: "Decide whether religious organizations keep their tax exemption.",
      options: {
        exempt: {
          does: "Keeps the full federal tax exemption for churches and religious organizations, as since 1913.",
          doesnt: "Does not resolve the subsidy debate - the exemption simply continues, unmeasured in the budget.",
          budget: "Neutral; an estimated ~$71B/yr of tax subsidy (Cragun et al. 2012) stays uncaptured.",
          results: "No fiscal change; religious voters stay content. The $71B figure is an estimate of subsidy under hypothetical taxation, not collectible revenue.",
          cites: ["Cragun, Yeager & Vega, How Secular Humanists (and Everyone Else) Subsidize Religion (2012)"]
        },
        property: {
          does: "Ends the property-tax exemption only: congregations pay local tax on buildings and land like other property owners.",
          doesnt: "Does not touch the income-tax exemption, clergy housing allowances, or donors' deductions.",
          budget: "The platform books ~0.07% of GDP (~$10B/yr) - one component of the estimated total subsidy.",
          results: "Small revenue gain, outsized religious-voter backlash. Property tax is only part of the $71B Cragun estimate, and estimated subsidy is not the same as collectible revenue.",
          cites: ["Cragun et al. (2012)"]
        },
        charity: {
          does: "Treats churches exactly like secular charities: the same reporting (Form 990), the same unrelated-business income tax, the same conditions for exemption.",
          doesnt: "Does not tax genuine charitable work harder than any nonprofit's - it equalizes treatment, which defenders call fair and churches call hostile.",
          budget: "The platform books ~0.15% of GDP (~$20B/yr); Cragun's full-subsidy estimate is ~$71B/yr, but the collectible share is much smaller.",
          results: "Revenue rises modestly; religious approval falls sharply (~12 points in-sim). Expect constitutional litigation - taxing religious exercise raises real First Amendment questions.",
          cites: [
            "Cragun et al. (2012)",
            "Andrew Yang policy thread: tax churches or treat them like charities"
          ]
        }
      }
    }
  }
};

// housing, immigration, welfare, education
(function (P) {
  P.housing = {
    summary: "Attack the housing cost crisis via supply, direct funding, or radical market intervention.",
    options: {
      statusquo: {
        does: "Leaves housing policy as-is: exclusionary zoning in most suburbs, a growing affordability gap, and the foreclosure crisis just beginning.",
        doesnt: "Does not respond to the 2008 foreclosure wave or the structural undersupply that follows it.",
        budget: "Neutral - no new outlays.",
        results: "Baseline: ~664,000 people homeless on a January night (HUD PIT 2008) and rents outpacing wages for the rest of the decade.",
        cites: ["HUD AHAR / Point-in-Time homelessness data"]
      },
      zoning: {
        does: "Federal incentives for states and cities to relax exclusionary zoning: duplexes, apartments and density near jobs (the Yang 2020 zoning plank).",
        doesnt: "Does not build anything directly - land use stays local, so relief arrives over years, not quarters.",
        budget: "Cheap federally (incentive grants); the platform books negligible net cost.",
        results: "Supply-side relief lowers rent pressure and homelessness gradually. Related evidence: Finland's undeveloped-land tax raised housing starts ~12% (Lyytikainen 2009), and heavier land taxation shifts development density (Banzhaf & Lavery 2010).",
        cites: [
          "Yang 2020 policy archive: Zoning",
          "Lyytikainen, Three-rate property taxation and housing construction, JUE (2009)",
          "Banzhaf & Lavery, Can the land tax help curb urban sprawl?, JUE (2010)"
        ]
      },
      housingfirst: {
        does: "Funds permanent supportive housing nationwide with no sobriety preconditions - house people first, then treat.",
        doesnt: "Does not fix rents or add supply; it is a floor under the worst cases, not a market reform.",
        budget: "The platform books ~0.25% of GDP (~$35B/yr) at full ramp.",
        results: "The strongest evidence-based homelessness intervention in the deck: Utah reported cutting chronic homelessness ~91% over a decade with Housing First. In-sim the PIT count falls ~2.5%/quarter while funded.",
        cites: [
          "HUD AHAR / PIT homelessness data",
          "Utah Housing First program reporting (2005-2015)"
        ]
      },
      rentban: {
        does: "Radical: bans renting out homes - owner-occupancy only, one house per person, no corporate ownership of residential property.",
        doesnt: "Does not create a single new house; it reshuffles ownership and can shrink the rental stock overnight while enforcement learns the loopholes.",
        budget: "Direct fiscal cost is small; the economic disruption is large and deliberately unpriced in the sim's revenue lines.",
        results: "The platform projects forced sales, cheaper purchase prices and rising ownership - but the source ledger flags every headline number here (90% ownership, -15% prices, -50% homelessness) as unsourced. Expect a homelessness shock first (evictions, stranded renters), then partial relief. Singapore's HDB (~90% resident ownership) still operates a rental scheme - no real-world ban exists to copy.",
        cites: [
          "Singapore HDB public housing data",
          "PoliSim source ledger, section 19: housing numbers flagged as unsourced"
        ]
      }
    }
  };
  P.immigration = {
    summary: "Set the stance on immigration flows and enforcement.",
    options: {
      restrictive: {
        does: "Tightens the system: lower visa caps, expanded deportations, stricter workplace enforcement.",
        doesnt: "Does not remove the ~11-12M unauthorized residents already here; it mostly slows new flows and raises compliance costs.",
        budget: "Enforcement costs rise modestly; slower labor-force growth trims future revenue.",
        results: "Demand, trade and competitiveness dip in-sim. The counterfactual benchmark: CBO projected comprehensive reform (S.744) would raise GDP ~3.3% by 2023 - restriction forgoes that path.",
        cites: ["CBO, The Economic Impact of S.744 (2013)"]
      },
      statusquo: {
        does: "Keeps the pre-2008 system: legal caps unchanged, ~11-12M unauthorized residents in limbo, episodic enforcement.",
        doesnt: "Does not fix the backlog, the border, or the underground labor market - it is the gridlock default.",
        budget: "Neutral.",
        results: "The broken status quo that both parties campaigned against in 2006-08 and neither could reform until after the sim's window.",
        cites: ["CBO, The Economic Impact of S.744 (2013) - as the road not taken"]
      },
      reformed: {
        does: "Easier legal entry paired with strict enforcement: expanded visas, a pathway to citizenship, and swift deportation for serious violations (the Yang structure).",
        doesnt: "Does not clear backlogs instantly - courts and agencies bind the pace of integration.",
        budget: "Net fiscal positive over time under CBO's S.744 scoring; administrative costs up front.",
        results: "CBO scored S.744 at output ~3.3% higher in 2023 and ~5.4% higher in 2033 via labor supply, investment and productivity. Those are bill-specific projections, not universal coefficients - but they set the direction.",
        cites: [
          "CBO, The Economic Impact of S.744 (2013)",
          "Yang 2020 policy archive: Pathway to Citizenship"
        ]
      },
      open: {
        does: "Maximal legal immigration with rules: high caps, fast processing, strict deportation for violations. Legal-channel abundance, not open borders.",
        doesnt: "Does not suspend enforcement - the 'with rules' half is load-bearing, politically and administratively.",
        budget: "A larger labor force grows the tax base; the platform projects a demand boost while active.",
        results: "Direction from CBO's S.744 analysis (labor force, productivity, GDP all up), magnified. Honest tradeoffs: wage pressure in some sectors and integration strain. The ledger warns against simple shortcuts like '+1% population = +1% GDP'.",
        cites: [
          "CBO, The Economic Impact of S.744 (2013)",
          "PoliSim source ledger, section 11"
        ]
      }
    }
  };
  P.welfare = {
    summary: "Design the social safety net, from status quo to a Universal Basic Income.",
    options: {
      statusquo: {
        does: "Keeps the patchwork: TANF (post-1996 work rules), SNAP, unemployment insurance, housing vouchers, each with its own forms and cliffs.",
        doesnt: "Does not simplify anything - red tape and benefit cliffs stay exactly where PRWORA left them.",
        budget: "Neutral; the automatic stabilizers (UI, SNAP) still expand on their own in recessions.",
        results: "Baseline safety net: catches many, misses the childless poor and anyone who cannot navigate the paperwork.",
        cites: ["PRWORA (1996) program structure; USDA SNAP program data"]
      },
      expanded: {
        does: "Expands the existing programs: higher SNAP and UI benefits, broader eligibility, more housing vouchers - more of the same machine.",
        doesnt: "Does not reduce bureaucracy; means tests and enrollment friction remain.",
        budget: "The platform books ~0.8% of GDP (~$115B/yr).",
        results: "High-multiplier support: USDA ERS estimated roughly $1.8 of economic activity per SNAP dollar during the downturn. Homelessness and hardship fall; the deficit grows unless offset.",
        cites: ["USDA ERS, SNAP economic-impact analysis (Hanson, 2010)"]
      },
      cash: {
        does: "Replaces most in-kind programs with direct cash, conditional on a social score built from work, compliance and education signals (the Yang-thread design).",
        doesnt: "Does not eliminate conditionality - the score IS the condition, and it will be gamed, appealed and litigated.",
        budget: "The platform books ~1.2% of GDP (~$175B/yr), partially offset by dismantled administration.",
        results: "Cash transfers outperform in-kind aid on recipient welfare in most transfer research, and administration gets cheaper. The score adds exclusion errors and legitimacy risk: those cut off become your angriest constituency. Yang's own framework chose unconditional cash partly to avoid this.",
        cites: [
          "Andrew Yang policy thread: cash equivalents tied to a social score",
          "Yang 2020 policy archive: The Freedom Dividend (unconditional contrast)"
        ]
      },
      ubi: {
        does: "A Freedom Dividend-style UBI: $1,000/month to every adult, no conditions, funded by consolidating welfare programs and new revenue (ideally the VAT).",
        doesnt: "Does not pay for itself - gross cost is on the order of $2.8-3T/yr at the 2008 adult population; financing design decides the macro outcome.",
        budget: "Widerquist's back-of-envelope net cost for a poverty-line UBI is about 2.95% of GDP after counting replaced transfers; gross is far higher.",
        results: "Roosevelt Institute scenario modeling: meaningful GDP gains appear mainly when debt-financed; tax-financed versions are roughly neutral. Negative-income-tax experiments show modest labor-supply reductions (Widerquist 2005). In-sim: demand and median income up, homelessness down, capitalists furious.",
        cites: [
          "Widerquist, The Cost of Basic Income, Basic Income Studies 12(2) (2017)",
          "Nikiforos, Steinbaum & Zezza, Modeling the Macroeconomic Effects of a UBI (Roosevelt Institute, 2017)",
          "Widerquist, A Failure to Communicate, Journal of Socio-Economics (2005)"
        ]
      }
    }
  };
  P.education = {
    summary: "Invest in human capital: vocational tracks, year-round schooling, or full reform.",
    options: {
      statusquo: {
        does: "Keeps the current system: the long summer break, the college-for-all push, and No Child Left Behind testing as the federal frame.",
        doesnt: "Does not address student debt, the skills gap, or summer learning loss.",
        budget: "Neutral.",
        results: "Baseline: the education determinant drifts sideways while rivals invest. Dalio ranks education first among the Big Cycle determinants.",
        cites: ["Dalio, Principles for Dealing with the Changing World Order (2021)"]
      },
      vocational: {
        does: "Scales paid apprenticeships and vocational tracks as an alternative to 2-6 years of college, especially for non-STEM paths (a Yang plank).",
        doesnt: "Does not halve youth unemployment - the source ledger explicitly retires the 50% figure as unsourced.",
        budget: "The platform books ~0.3% of GDP (~$45B/yr).",
        results: "Directionally supported by Germany's dual-apprenticeship outcomes, but no causal study supports a US transfer coefficient; expect steady education-determinant gains and earlier labor-market entry, not miracles.",
        cites: [
          "Yang 2020 policy archive: Promote Vocational Education",
          "PoliSim source ledger, section 14: German-model coefficient retired"
        ]
      },
      yearround: {
        does: "Ends the long summer break: shorter year-round class schedules plus expanded apprenticeship placement for older students.",
        doesnt: "Does not transform achievement - meta-analyses find modest average gains, and no extra benefit for disadvantaged students in the year-round literature.",
        budget: "The platform books ~0.5% of GDP (~$75B/yr) in staffing and operations.",
        results: "Summer learning loss averages about one month of learning (Cooper et al. 1996); single-track year-round schooling shows modest positive achievement effects (Fitzpatrick & Burns 2019). Teacher burnout is the operational risk.",
        cites: [
          "Cooper et al., The Effects of Summer Vacation on Achievement Test Scores, RER (1996)",
          "Fitzpatrick & Burns, Campbell Systematic Reviews (2019)"
        ]
      },
      full: {
        does: "Full reform: year-round calendar, vocational substitution for non-STEM tracks, and a major R&D expansion for research universities.",
        doesnt: "Does not show up in this quarter's GDP - education is the slowest determinant in the game, compounding over years.",
        budget: "The platform books ~1.0% of GDP (~$150B/yr).",
        results: "Largest education-determinant gain (+0.7/turn) plus innovation lift via public R&D, whose productivity returns arrive on multi-year lags (Fieldhouse & Mertens). The payoff is a competitiveness story for the 2020s.",
        cites: [
          "Fieldhouse & Mertens, The Social Returns to Public R&D (NBER WP 33780)",
          "Dalio, Changing World Order: education determinant ordering"
        ]
      }
    }
  };
})(window.ACT_CONTENT.policies);

// tariffs, healthcare, law, infra, and the four new Acts
(function (P) {
  P.tariffs = {
    summary: "Average import tariff rate, 0-25%. Revenue now, growth drag later.",
    options: {
      slider: {
        does: "Sets an across-the-board import tariff. Each point collects revenue at the border and raises consumer prices by a fraction of a point.",
        doesnt: "Does not rebuild the 1960s industrial economy - retaliation from trading partners and modern supply chains cap the gains.",
        budget: "The platform projects ~0.35% of GDP (~$50B/yr) in revenue per tariff point, before accounting for the growth losses that eat the base.",
        results: "Each point drags growth and the trade and competitiveness determinants (PWBM-style estimates put broad aggressive tariffs at roughly -6% long-run GDP and -5% wages at the extreme end). Historical anchor: Smoot-Hawley (1930) triggered retaliation and deepened the Depression.",
        cites: [
          "Penn Wharton Budget Model, tariff policy analyses",
          "Smoot-Hawley Tariff Act (1930), standard economic history"
        ]
      }
    }
  };
  P.healthcare = {
    summary: "Expand public health coverage - a public option or a universal system.",
    options: {
      statusquo: {
        does: "Keeps the pre-ACA system: ~46M uninsured (2008), employer-based coverage, medical bankruptcy as a leading cause of personal bankruptcy filings.",
        doesnt: "Does nothing about cost growth - healthcare inflation outpaces wages either way.",
        budget: "Neutral now; Medicare and Medicaid keep growing on autopilot.",
        results: "Baseline: costs compound, the uninsured roll grows in recessions, and overdose treatment access stays thin as fentanyl arrives.",
        cites: ["U.S. Census Bureau uninsured estimates (2008)"]
      },
      public: {
        does: "Adds a Medicare-like public option that competes with private plans on the insurance marketplaces.",
        doesnt: "Does not achieve universal coverage - take-up is voluntary and gaps remain.",
        budget: "The platform books ~0.7% of GDP (~$100B/yr); CBO (2013) estimated a marketplace public option could modestly reduce deficits through premium competition.",
        results: "Coverage expands and premiums face a disciplined competitor. In-sim, treatment access cuts overdose deaths ~1.5%/quarter. Political cost: insurers and providers mobilize hard.",
        cites: ["CBO, budget option: add a public option to the health insurance marketplace (2013)"]
      },
      universal: {
        does: "Moves to universal publicly-guaranteed coverage - a single-payer-style system replacing most private insurance.",
        doesnt: "Does not avoid the transition shock: ~150M people move off employer plans, provider rates get renegotiated, and taxes rise visibly.",
        budget: "Estimates vary enormously by design: Blahous (Mercatus, 2018) put added federal cost near $32T over 10 years for one Medicare-for-All bill; the sim books a partial-transition cost of ~2.2% of GDP.",
        results: "Coverage goes universal; medical bankruptcy fades; overdose and homelessness metrics improve. Tradeoffs: higher taxes, a contracting private-insurance sector, and wait-time risk if capacity lags.",
        cites: [
          "Blahous, Mercatus Center, Medicare-for-All cost study (2018)",
          "Yang 2020 white paper: A New Way Forward for Healthcare in America"
        ]
      }
    }
  };
  P.law = {
    summary: "Set policing and sentencing doctrine.",
    options: {
      statusquo: {
        does: "Keeps the 2008 posture: mandatory minimums, the tail end of the drug war, and ~2.3M people behind bars (BJS).",
        doesnt: "Does not reduce the world's highest incarceration rate or its ~$80B/yr all-in corrections cost.",
        budget: "Neutral.",
        results: "Baseline: incarceration plateaus near its historic peak; crime keeps its long decline for reasons researchers still debate.",
        cites: ["Bureau of Justice Statistics, correctional populations (2008)"]
      },
      community: {
        does: "Funds community policing: foot patrols, local accountability, de-escalation training, federal oversight of troubled departments.",
        doesnt: "Does not deter through severity - it works through certainty and trust, which build slowly.",
        budget: "Modest outlay, partially offset by slowly falling incarceration (~0.3%/quarter in-sim).",
        results: "NIJ's deterrence summary: the certainty of being caught - the channel community policing strengthens - is a substantially stronger deterrent than severity. Incarceration drifts down; youth and immigrant approval rises.",
        cites: ["NIJ, Five Things About Deterrence"]
      },
      reform: {
        does: "Sentencing reform for nonviolent offenses (shorter terms, reentry funding) paired with harsh penalties for heinous violent and white-collar crimes.",
        doesnt: "Does not claim deterrence from the harsh end - NIJ finds the death-penalty research inconclusive; the gains here come from the reform side.",
        budget: "Decarceration savings (~0.8%/quarter in-sim) partially fund courts, reentry and victims' services.",
        results: "Prison population falls from the 2.3M peak while certainty-focused enforcement holds crime steady. The ledger explicitly retires any predetermined '-5% violent crime from express executions' benefit.",
        cites: [
          "NIJ, Five Things About Deterrence",
          "BJS corrections statistics",
          "PoliSim source ledger, section 10"
        ]
      },
      tough: {
        does: "Mandatory minimums, three-strikes expansion, and a faster capital-punishment track - the 'express lane' option.",
        doesnt: "Does not reliably deter: NIJ summarizes that research cannot establish whether capital punishment raises, lowers, or has no effect on homicide.",
        budget: "Incarceration grows ~1%/quarter; corrections costs (~$80B/yr nationally) climb with it.",
        results: "Prison population pushes toward new highs; religious and senior approval rises while youth and immigrant approval falls. Spectacle executions carry a legitimacy risk.",
        cites: [
          "NIJ, Five Things About Deterrence",
          "BJS corrections statistics"
        ]
      }
    }
  };
  P.infra = {
    summary: "Extra federal investment in infrastructure and R&D, as % of GDP.",
    options: {
      slider: {
        does: "Adds 0-3% of GDP in federal investment: roads, bridges, grid, broadband, water systems and research labs.",
        doesnt: "Does not deliver instant growth - projects ramp over quarters and R&D pays back over years.",
        budget: "Costs exactly the slider value: each 0.25% of GDP is roughly $35-40B/yr at 2008 scale.",
        results: "High employment content per dollar (Garrett-Peltier: infrastructure supports more jobs per $1M than defense); the innovation determinant rises once investment exceeds ~1.5% of GDP. The need is documented: ASCE graded US infrastructure a D in 2009 with a $2.2T five-year gap.",
        cites: [
          "ASCE, Report Card for America's Infrastructure (2009)",
          "Garrett-Peltier, Job Opportunity Cost of War (2017)",
          "Fieldhouse & Mertens (NBER WP 33780)"
        ]
      }
    }
  };
  P.ubi = {
    summary: "The Freedom Dividend Act: $1,000 per month to every American adult.",
    options: {
      dividend: {
        does: "Enacts the Freedom Dividend: $1,000/month ($12,000/yr) to every US adult, no conditions, funded by the VAT and consolidation of existing welfare programs.",
        doesnt: "Does not eliminate poverty alone at $12k/yr, and it is not free - financing through the VAT shifts the burden onto consumption.",
        budget: "Gross cost on the order of $2.8T/yr; Widerquist's back-of-envelope NET cost for a poverty-line UBI is ~2.95% of GDP after counting replaced transfers.",
        results: "Roosevelt Institute scenarios: GDP gains appear mainly when debt-financed; tax-financed versions are roughly neutral. NIT experiments show modest labor-supply reductions (Widerquist 2005). In-sim: demand, median income and homelessness improve; capitalists and deficit hawks revolt.",
        cites: [
          "Yang 2020 policy archive: The Freedom Dividend",
          "Widerquist, Basic Income Studies 12(2) (2017)",
          "Nikiforos, Steinbaum & Zezza, Roosevelt Institute (2017)"
        ]
      }
    }
  };
  P.lvt = {
    summary: "The Land Value Tax Act: tax the unimproved value of land, not the buildings on it.",
    options: {
      enact: {
        does: "Creates a federal framework for taxing land value - especially undeveloped parcels - replacing part of ordinary property taxes. Buildings become tax-lighter; idle lots become tax-heavier.",
        doesnt: "Does not eliminate property taxes nationwide overnight - the evidence covers development response, not wholesale institutional replacement.",
        budget: "Designed as roughly property-tax-neutral with a development bonus; revenue depends on rates and the taxable land base (the ledger's 0.53-style coefficients remain placeholders).",
        results: "Finnish municipalities that adopted an undeveloped-land tax saw ~12% more single-family housing starts (Lyytikainen 2009); heavier land taxation shifts development toward density (Banzhaf & Lavery 2010). Land cannot flee or hide - the theory says near-zero deadweight loss (George, 1879).",
        cites: [
          "Lyytikainen, Three-rate property taxation and housing construction, JUE (2009)",
          "Banzhaf & Lavery, Can the land tax help curb urban sprawl?, JUE (2010)",
          "Henry George, Progress and Poverty (1879)"
        ]
      }
    }
  };
  P.media = {
    summary: "The Local Journalism Fund Act: public money for local news, with firewall governance.",
    options: {
      enact: {
        does: "Funds grants to local outlets, nonprofits, libraries and public-media partnerships (the Yang plank), with an independent nonpartisan commission keeping government hands off editorial decisions.",
        doesnt: "Does not guarantee trust or truth - funding design matters, and state-adjacent media always carries capture risk.",
        budget: "Small by federal standards: hundreds of millions to ~$1B/yr scale - negligible next to GDP, outsized next to a closing newsroom.",
        results: "In a Nieman-reported survey, 41.9% of PBS viewers cited public funding as a reason they trust it - independence can be designed. The ledger flags any hard 'trust +10' coefficient as a placeholder; treat gains as directional: better local information, slower civic decay.",
        cites: [
          "Nieman Journalism Lab, PBS public-funding trust research (2025)",
          "Yang 2020 policy archive: Local Journalism Fund / American Journalism Fellows"
        ]
      }
    }
  };
  P.democracy = {
    summary: "Democracy Dollars + ranked-choice voting: attack donor capture and the spoiler effect together.",
    options: {
      enact: {
        does: "Gives every voter $100 per cycle in publicly-funded campaign vouchers (Democracy Dollars) and moves federal elections to ranked-choice ballots.",
        doesnt: "Does not remove big money by itself - outside spending after Citizens United (2010) needs separate reforms.",
        budget: "The platform projects roughly $20-25B per election cycle at full take-up (~$100 x ~235M adults), plus administration.",
        results: "Real-world pilots: Seattle's Democracy Voucher program (2017) broadened and diversified the small-donor pool; Maine adopted ranked-choice voting in 2016, blunting spoiler effects. Yang's white paper argues the package restores institutional legitimacy - the sim books it as a legitimacy and campaign-finance shift.",
        cites: [
          "Seattle Ethics & Elections Commission, Democracy Voucher Program (2017)",
          "Maine ranked-choice voting referendum (2016)",
          "Yang 2020 white paper: Restoring Democracy, Rebuilding Trust"
        ]
      }
    }
  };
})(window.ACT_CONTENT.policies);

// Preloaded Acts: major US laws already in force at game start (2008).
window.ACT_CONTENT.preloaded = [
  {
    name: "Social Security Act", year: 1935, status: "In force",
    does: "Created old-age pensions, unemployment insurance, and aid to dependent children - the foundation of the American welfare state.",
    ongoing: "Pays ~$615B/yr to 50M+ beneficiaries (2008); the single largest budget line and the floor under senior poverty.",
    cites: ["Social Security Act of 1935; SSA program data"]
  },
  {
    name: "Unemployment Insurance (Title III, SSA)", year: 1935, status: "In force",
    does: "Federal-state system paying temporary benefits to laid-off workers, funded by employer payroll taxes.",
    ongoing: "The premier automatic stabilizer: rolls expand in recessions without a vote, cushioning demand exactly when the sim's shocks hit.",
    cites: ["Social Security Act of 1935; DOL UI program data"]
  },
  {
    name: "GI Bill (Servicemen's Readjustment Act)", year: 1944, status: "In force",
    does: "Funded college tuition, training and home loans for returning WWII veterans.",
    ongoing: "The template for federal human-capital investment - credited with building the postwar middle class; successors still educate veterans today.",
    cites: ["Servicemen's Readjustment Act of 1944; VA education benefit history"]
  },
  {
    name: "Interstate Highway Act", year: 1956, status: "In force",
    does: "Funded 41,000 miles of interstate highways, 90% federal share, through the Highway Trust Fund.",
    ongoing: "The physical platform of US commerce; its aging now drives the ASCE's D-grade infrastructure gap the infra slider addresses.",
    cites: ["Federal-Aid Highway Act of 1956", "ASCE Report Card (2009)"]
  },
  {
    name: "Civil Rights Act", year: 1964, status: "In force",
    does: "Outlawed discrimination in employment, public accommodations and federally funded programs; created the EEOC.",
    ongoing: "The legal backbone of workplace and public-life equality; enforcement capacity lives in the justice budget line.",
    cites: ["Civil Rights Act of 1964 (Public Law 88-352)"]
  },
  {
    name: "Medicare & Medicaid (Social Security Amendments)", year: 1965, status: "In force",
    does: "Created health coverage for seniors (Medicare) and low-income Americans (Medicaid).",
    ongoing: "Together ~$590B/yr by 2008 and the fastest-growing part of the budget - the long-run deficit story in two programs.",
    cites: ["Social Security Amendments of 1965; CMS program data"]
  },
  {
    name: "Food Stamp Act (SNAP)", year: 1964, status: "In force",
    does: "Made food assistance permanent and nationwide for low-income households.",
    ongoing: "Feeds ~28M people by 2008; USDA estimated ~$1.8 of economic activity per benefit dollar - the most stimulative line in the safety net.",
    cites: ["Food Stamp Act of 1964", "USDA ERS economic-impact analysis (Hanson, 2010)"]
  },
  {
    name: "Clean Air Act", year: 1970, status: "In force",
    does: "Set national air-quality standards and gave the EPA power to regulate pollutants.",
    ongoing: "EPA cost-benefit reviews find benefits dwarf compliance costs; the model for the environment budget line's quiet returns.",
    cites: ["Clean Air Act of 1970; EPA retrospective benefit-cost studies"]
  },
  {
    name: "Community Reinvestment Act", year: 1977, status: "In force",
    does: "Required banks to lend in the low-income communities where they take deposits - an anti-redlining law.",
    ongoing: "Still shapes bank lending maps in 2008; blamed (wrongly, per Fed analyses) for the crisis and defended as a credit-access tool.",
    cites: ["Community Reinvestment Act of 1977; Federal Reserve CRA research"]
  },
  {
    name: "Americans with Disabilities Act", year: 1990, status: "In force",
    does: "Banned disability discrimination and mandated accessibility in employment, transit and public spaces.",
    ongoing: "Accessibility is now baked into every infrastructure dollar - the reason new construction costs include ramps and lifts.",
    cites: ["Americans with Disabilities Act of 1990 (Public Law 101-336)"]
  },
  {
    name: "NAFTA", year: 1994, status: "In force",
    does: "Created a free-trade zone across the US, Canada and Mexico, phasing out most tariffs.",
    ongoing: "Integrated North American supply chains; the trade determinant's baseline and the rallying cry of the tariff slider's supporters.",
    cites: ["North American Free Trade Agreement (1994); USTR trade data"]
  },
  {
    name: "Welfare Reform (PRWORA)", year: 1996, status: "In force",
    does: "Replaced AFDC with TANF: work requirements, time limits, and block grants to states.",
    ongoing: "Cash-assistance rolls fell by more than half from 1996 levels; its work-first design is the template the 'workfare'-style options extend.",
    cites: ["Personal Responsibility and Work Opportunity Reconciliation Act (1996); HHS TANF caseload data"]
  },
  {
    name: "USA PATRIOT Act", year: 2001, status: "In force",
    does: "Expanded surveillance and intelligence-sharing powers after 9/11.",
    ongoing: "The legal frame for the surveillance programs Snowden will expose in 2013; a standing tension between security and legitimacy in the sim's era.",
    cites: ["USA PATRIOT Act (2001); later NSA program disclosures (2013)"]
  },
  {
    name: "No Child Left Behind", year: 2002, status: "In force",
    does: "Tied federal education funds to standardized testing and school accountability targets.",
    ongoing: "The testing regime every education reform option in the deck inherits, works around, or replaces.",
    cites: ["No Child Left Behind Act (2002); Dept. of Education program data"]
  },
  {
    name: "Medicare Part D (Modernization Act)", year: 2003, status: "In force",
    does: "Added prescription-drug coverage to Medicare - the biggest Medicare expansion since 1965.",
    ongoing: "Adds tens of $B/yr to Medicare's growth; seniors' drug costs fall while the long-run fiscal math worsens.",
    cites: ["Medicare Prescription Drug, Improvement, and Modernization Act (2003)"]
  },
  {
    name: "TARP (Emergency Economic Stabilization Act)", year: 2008, status: "In force",
    does: "$700B authority to buy troubled assets and recapitalize banks amid the financial panic.",
    ongoing: "Signed October 3, 2008 - live during turn 4. Its bank rescues plus the ARRA stimulus define the crisis baseline this game starts inside.",
    cites: ["Emergency Economic Stabilization Act of 2008; CBO TARP reports"]
  }
];

// Budget hints: one line each on what cutting/raising a category does.
window.ACT_CONTENT.budgetHelp = {
  budget_other: "Other mandatory and discretionary programs not itemized above — cutting here trims smaller agencies, farm supports, and general government costs.",
  budget_defense: "Cut: saves big money but weakens the military determinant and defense-sector jobs. Raise: deterrence up, debt up.",
  budget_social_security: "Cut: seniors' incomes and approval fall - the third rail. Raise: durable poverty floor, heavy cost.",
  budget_medicare: "Cut: squeezes hospitals and seniors' care. Raise: buys health outcomes at rising prices.",
  budget_medicaid: "Cut: hits the poorest and state budgets at once. Raise: fewer uninsured, better overdose treatment access.",
  budget_income_security: "Cut in a slump deepens the hole (high multipliers). Raise: strong automatic stabilizer and demand support.",
  budget_health: "Cut: slows NIH/CDC research and outbreak response. Raise: feeds innovation and treatment capacity cheaply.",
  budget_veterans: "Cut: breaks a promise to a cross-partisan bloc. Raise: faster claims and care; costs lag wars by decades.",
  budget_education: "Cut: small savings, long shadow on the education determinant. Raise: the slowest, highest-compounding payoff.",
  budget_transport: "Cut: deferred maintenance becomes deferred debt. Raise: classic stimulus, high jobs per dollar.",
  budget_environment: "Cut: cleanups and enforcement slow (see Flint). Raise: cheap insurance on water, air and parks.",
  budget_international: "Cut: trivial savings (~1% of budget), real soft-power loss. Raise: influence at bargain prices (CFR).",
  budget_science: "Cut: thins the basic-research pipeline. Raise: multi-year-lag productivity via public R&D.",
  budget_justice: "Cut: less enforcement capacity - and certainty, not severity, is what deters (NIJ). Raise: more agents, courts, prisons.",
  budget_interest: "Cannot be cut directly - it follows debt x r. Keep r below g or this line eats everything else."
};

// Baseline 'off' options for the four new Acts (matches data.js option ids).
(function (P) {
  P.ubi.options.off = {
    does: "Leaves the Freedom Dividend unenacted; the welfare system stays as configured in the Welfare policy.",
    doesnt: "Does not preclude a later dividend - it is the default, not a ban.",
    budget: "Neutral - no new outlays or VAT pairing.",
    results: "Baseline: safety net remains the TANF/SNAP/UI patchwork; no demand dividend.",
    cites: ["Yang 2020 policy archive: The Freedom Dividend (proposal, never enacted)"]
  };
  P.lvt.options.off = {
    does: "Keeps ordinary property taxation: buildings and land taxed together at the local level.",
    doesnt: "Does not touch the incentive to sit on idle land while cities sprawl.",
    budget: "Neutral.",
    results: "Baseline: land speculation remains untaxed; the development response documented in Finland (starts +12%) is left on the table.",
    cites: ["Lyytikainen, JUE (2009)"]
  };
  P.media.options.off = {
    does: "Leaves local journalism to the market: no public fund, no fellows program.",
    doesnt: "Does not stop the ongoing collapse of local news ad revenue that accelerated after 2008.",
    budget: "Neutral.",
    results: "Baseline: newsroom employment keeps shrinking through the era; civic information thins.",
    cites: ["Yang 2020 policy archive: Local Journalism Fund (proposal, never enacted)"]
  };
  P.democracy.options.off = {
    does: "Keeps first-past-the-post elections and private campaign finance as-is.",
    doesnt: "Does not address donor capture or spoiler effects - the post-Citizens United money flood proceeds on schedule.",
    budget: "Neutral.",
    results: "Baseline: legitimacy drifts with outcomes alone; Seattle (2017) and Maine (2016) remain the only live experiments.",
    cites: [
      "Seattle Democracy Voucher Program (2017)",
      "Maine ranked-choice voting referendum (2016)"
    ]
  };
})(window.ACT_CONTENT.policies);

/* PoliSim-DBE v0.3 - glossary.js
   3-slide explainers for metrics, determinants, the Big Cycle, formulas,
   budget categories and party mechanics. Plain browser global, no modules.
   Slide structure: (1) what it is, (2) what it means / how the game computes it,
   (3) why it matters. */
window.GLOSSARY = {
  /* ---------------- Metrics ---------------- */
  metric_gdp: {
    title: "GDP",
    slides: [
      "Gross Domestic Product: the total value of everything the economy produces in a year. In 2008 the US economy was about $14.7 trillion (nominal).",
      "The game grows real GDP each quarter from a baseline path, plus or minus policy effects: stimulus adds demand, tariffs and shocks subtract. Inflation is layered on top to get nominal dollars.",
      "GDP is the scoreboard almost everything hangs on: tax revenue, debt ratios and jobs all scale with it. Watch the growth rate, not just the level - compounding is the whole game."
    ]
  },
  metric_unemployment: {
    title: "Unemployment",
    slides: [
      "The share of the labor force that wants work but cannot find it. It was about 5% when the game starts (early 2008) and peaked at 10.0% in October 2009 in real history.",
      "The game links unemployment to growth through Okun's law: roughly 2 points of lost growth translates into about 1 point of extra unemployment. Recession shocks and weak demand push it up; stimulus pulls it down.",
      "Unemployment is the metric voters feel first. High joblessness crushes approval, widens deficits (less tax, more benefits) and scars workers for years."
    ]
  },
  metric_debt: {
    title: "Federal Debt (% of GDP)",
    slides: [
      "The accumulated IOUs of the federal government, shown as a share of GDP. It was about 68% of GDP in early 2008 - before the crisis bailouts and recession deficits.",
      "Each quarter the game adds the deficit (spending minus revenue) to the debt. Then debt dynamics kick in: debt grows with the interest rate r and shrinks relative to GDP when the economy grows (g).",
      "Debt itself is not the villain; unpayable debt is. When r stays above g for years, interest eats the budget - that line item is called budget_interest, and it crowds out everything else."
    ]
  },
  metric_inflation: {
    title: "Inflation",
    slides: [
      "The pace at which prices rise, roughly 2-3% a year in a healthy modern economy. In 2008 it briefly spiked near 5% on oil, then went near zero (deflation risk) in the crisis.",
      "The game nudges inflation up when stimulus outruns the economy's capacity (a hot output gap) and down when demand collapses. The Fed's rate posture matters too.",
      "Moderate inflation quietly shrinks debt ratios; high inflation destroys median purchasing power and voter patience; deflation is worse - debts get heavier while incomes fall."
    ]
  },
  metric_med_income: {
    title: "Median Household Income",
    slides: [
      "The income of the household exactly in the middle - half earn more, half less. Around $52-74k depending on measure at game start; the sim tracks a real (inflation-adjusted) figure.",
      "It drifts with real growth and gets boosts from wage-friendly policies (welfare expansion, education investment, worker bargaining power) and drags from unemployment and inflation.",
      "GDP can rise while the median household treads water - that divergence is the story of the 2010s. If you grow the pie but the middle shrinks, expect angry voters and falling legitimacy."
    ]
  },
  metric_homelessness: {
    title: "Homelessness (PIT count)",
    slides: [
      "People without stable shelter, measured by HUD's Point-in-Time count - a one-night January census. About 664,000 in 2008; HUD's AHAR reports are the source of record.",
      "The sim moves the count a few percent per quarter with housing policy (Housing First cuts it hard), welfare cash, rents and health coverage. A rental-market ban shocks it upward before any relief.",
      "Homelessness is the visible tip of affordability failure. It is also the metric where cash and housing policies show results fastest - within a few quarters, not decades."
    ]
  },
  metric_overdoses: {
    title: "Overdose Deaths",
    slides: [
      "Annual drug-poisoning deaths, tracked by CDC/NCHS. About 36,000 in 2008; the real curve exploded past 50,000 by 2015 and 100,000+ by 2021 as fentanyl spread.",
      "Drug policy and treatment funding steer the sim's trajectory: decriminalization with treatment and broader healthcare bend it down; prohibition alone does not. Effects lag several quarters.",
      "The opioid crisis is the era's deadliest policy failure. Portugal's 2001 decriminalization-plus-treatment is the famous natural experiment - deaths and HIV fell sharply (Cato 2009)."
    ]
  },
  metric_incarcerated: {
    title: "Incarcerated Population",
    slides: [
      "People held in prisons and jails: about 2.3 million in 2008, the highest rate on Earth per BJS. The US locks up roughly 1% of its adults at any moment.",
      "Sentencing doctrine (law policy) and drug policy move it a percent or two per quarter. Tough-on-crime grows it; reform and decriminalization shrink it.",
      "Prisons cost real money (~$80B/yr across all levels of government) and destroy labor supply. NIJ's deterrence review: certainty of catching criminals deters, not sentence severity."
    ]
  },
  metric_taxtake: {
    title: "Tax Take",
    slides: [
      "Federal revenue collected per year, roughly 17-18% of GDP in normal times. It is not a dial - it is an outcome of the tax code you set and the economy you get.",
      "The game computes revenue from base rates times nominal GDP, plus revenue effects from your tax slider (VAT share), tariffs, legalized drugs, church taxation and growth itself.",
      "Revenue is the only honest way to pay for the budget. Booms swell it automatically (2007), crashes gut it (2009). Every deficit quarter adds to the debt - no free lunch."
    ]
  },
  metric_sentiment: {
    title: "Public Sentiment",
    slides: [
      "How the country feels - consumer and voter mood rolled into one index. Starts low in 2008 because, well, look around.",
      "It reacts fast to jobs, incomes and headlines, and drifts toward the weighted voter approval score. Crisis shocks hit it hard; recoveries heal it slowly.",
      "Sentiment is the forward indicator of elections. You can survive bad numbers with good mood; you cannot survive bad mood even with good numbers."
    ]
  },
  metric_legitimacy: {
    title: "Legitimacy",
    slides: [
      "Whether people believe the system itself is fair and worth obeying - trust in elections, courts and agencies. In Dalio's framework, eroding legitimacy is the heartbeat of internal disorder.",
      "It rises with good outcomes and fair process, falls with perceived capture (money in politics), chaos (shutdowns, riots) and hypocrisy. Slow to build, fast to burn.",
      "Low legitimacy is the gateway to the decline phases of the Big Cycle: rule-bending, polarization, and eventually the reset nobody wants. Guard it like a reserve currency."
    ]
  },
  metric_pc: {
    title: "Political Capital",
    slides: [
      "Your supply of favors, goodwill and party discipline - the currency you spend to change policy. Big swings cost more than tweaks.",
      "Each policy option has a political-capital cost; sliders cost per step. It regenerates each turn, faster when approval is high and elections are far away.",
      "This is the game being honest about politics: you cannot do everything at once. Sequencing - what you do in the honeymoon - decides your whole term."
    ]
  },
  metric_funds: {
    title: "Campaign Funds",
    slides: [
      "Money available for elections and courting voter blocs. Real campaigns run on this; so does your party in the game.",
      "Funds accumulate from donors aligned with your record and are spent during campaign windows (see party_court). Some reforms (Democracy Dollars) deliberately weaken big-money advantage.",
      "Funds buy attention, not love. Overspending with bad approval still loses - ask any incumbent who outspent a challenger and lost a wave midterm."
    ]
  },
  /* ---------------- Determinants ---------------- */
  det_education: {
    title: "Determinant: Education",
    slides: [
      "The skill level of the population - the first determinant in Dalio's Big Cycle ordering, because everything else is downstream of human capital.",
      "It moves slowly (a point or less per turn) with education policy: vocational tracks, year-round schooling, full reform. Nothing cuts it quickly, which is the point.",
      "Education compounds into innovation and competitiveness decades out. Countries that lead it rise; countries that let it decay decline. It is the highest-lag, highest-payoff investment in the game."
    ]
  },
  det_innovation: {
    title: "Determinant: Innovation",
    slides: [
      "The capacity to invent and commercialize new technology - patents, R&D, frontier firms. America in 2008 is the world leader; the sim scores it high (85).",
      "Rises with R&D spending (infra slider above ~1.5% of GDP), military reallocation into science, education reform and open immigration of talent. Public R&D returns build over years (Fieldhouse & Mertens, NBER).",
      "Innovation is the engine of productivity growth - the only way median incomes rise long-run without borrowing. Lose the frontier and the Big Cycle top starts slipping."
    ]
  },
  det_competitiveness: {
    title: "Determinant: Competitiveness",
    slides: [
      "How well the economy competes globally - costs, skills, infrastructure quality and openness rolled together. Dalio treats it as the bridge between education and trade power.",
      "Improved by education, zoning reform, immigration openness; dragged down by tariffs and restrictive policy. Moves modestly each turn.",
      "Competitiveness decides who sells to the world. When it fades, deficits widen, the currency's reserve premium comes into question, and decline phases accelerate."
    ]
  },
  det_military: {
    title: "Determinant: Military Strength",
    slides: [
      "Hard power: the ability to deter rivals and protect trade routes. The US in 2008 is the unipolar power - scored 90 - but wars in Iraq and Afghanistan are expensive.",
      "The military reallocation policy trades it against innovation and budget savings: cuts of 25-50% free up to ~1% of GDP but shave this determinant. Increases do the opposite.",
      "Dalio's warning: overextension is the classic late-cycle disease - empires spend more than rivals to defend a bigger map, and the fiscal rot starts here."
    ]
  },
  det_trade: {
    title: "Determinant: Trade",
    slides: [
      "The economy's share and centrality in world commerce. In 2008 the US is the indispensable buyer of last resort, running large deficits that the world happily finances.",
      "Open immigration lifts it; tariffs drag it down point by point. Recessions crash volumes temporarily - world trade fell harder than GDP in 2009.",
      "Trade is how competitiveness gets monetized. Reserve-currency countries can run deficits cheaply - until the day the privilege fades, which is exactly what the late decline phase models."
    ]
  },
  det_output: {
    title: "Determinant: Output Share",
    slides: [
      "The country's slice of world production - the pure size score in Dalio's determinant stack. The US share peaked decades ago and has been sliding as China rises.",
      "Grows with sustained investment (infrastructure, R&D) and strong growth; erodes with stagnation. Slow-moving by design.",
      "Output share is gravity in the cycle: big economies get military reach, financial centers and reserve currencies. When the share slides for decades, the rest of the stack follows."
    ]
  },
  det_fincenter: {
    title: "Determinant: Financial Center",
    slides: [
      "Being the place where the world's money does business - Wall Street's depth, rule of law, and market trust. Scored highest of all determinants (95) in 2008, even mid-crisis.",
      "Damaged by financial chaos and legitimacy shocks; supported by stability and institutional trust. Crises like 2008 test it - the fact that capital fled INTO Treasuries shows the moat.",
      "Financial-center status is the platform for the reserve currency. Amsterdam and London each held it after their empires peaked - the last advantage to die, and the loudest when it does."
    ]
  },
  det_reserve_fx: {
    title: "Determinant: Reserve Currency",
    slides: [
      "The dollar's role as the world's savings vehicle - about 60%+ of global reserves. It lets the US borrow cheaply and sanction powerfully. Dalio calls it the ultimate late-cycle privilege.",
      "Sustained by debt credibility (r vs g), low inflation and financial-center strength. Chronic fiscal dominance - printing to fund deficits - is how empires lose it, slowly then suddenly.",
      "Reserve status is an 'exorbitant privilege' with an exorbitant responsibility. While you hold it, debt crises are optional; if you lose it, every past deficit arrives as one bill."
    ]
  }
};

// Big Cycle, formulas, budget categories, party mechanics
(function (G) {
  /* ---------------- Big Cycle ---------------- */
  G.cycle_s = {
    title: "The Big Cycle Score (S)",
    slides: [
      "A single summary of national power drawn from Ray Dalio's 'Principles for Dealing with the Changing World Order' (2021): eight determinants - education, innovation, competitiveness, military, trade, output, financial center, reserve currency.",
      "The game averages the eight determinant scores (with weights) into S, then reads your phase: rise, top, early decline, late decline, or reset.",
      "S is the slow plot of the game. Quarterly GDP is weather; S is climate. Every policy is really a bet on where the determinants point a decade from now."
    ]
  };
  G.phase_rise = {
    title: "Phase: Rise",
    slides: [
      "The upward arc: strong education, work ethic and institutions attract capital and talent, and the gains get reinvested. Think postwar America, 1945-1970.",
      "In-game: determinants trending up together, S climbing, legitimacy high. New powers rise by learning from - then out-competing - the incumbent.",
      "Rises are built on boring things: schools, infrastructure, sound money, low internal conflict. If you inherit a rise, your job is mostly to not interrupt it."
    ]
  };
  G.phase_top = {
    title: "Phase: Top",
    slides: [
      "The peak: the incumbent leads on every determinant - output, trade, finance, military, reserve currency - and the privilege starts to feel permanent.",
      "At the top, wages are high, the currency is the world's savings vehicle, and rivals are still catching up. The US circa 2008 is modeled as late-top: still dominant, but the lead is narrowing.",
      "Tops sow their own decline: prosperity makes labor expensive, competitors copy the playbook, and debt accumulates because borrowing is cheap. The top is where discipline matters most and is practiced least."
    ]
  };
  G.phase_early_decline = {
    title: "Phase: Early Decline",
    slides: [
      "The drift: growth leans more on debt, productivity slows, education and competitiveness slip, and wealth gaps widen. Life is still good - that's what makes it dangerous.",
      "In-game: S plateauing or gently falling, deficits creeping, internal conflict rising. Politically this is polarization with prosperity - fights over a pie that is still growing, just slower and less evenly.",
      "Early decline is reversible - that's the tragedy. Investments in education, innovation and fiscal order still pay off. Most incumbents skip the repair because the bill is small and the pain is now."
    ]
  };
  G.phase_late_decline = {
    title: "Phase: Late Decline",
    slides: [
      "The squeeze: debts outgrow incomes, so the state faces the classic trilemma - austerity, default, or printing money. Internal conflict sharpens as groups fight over a shrinking surplus.",
      "In-game: interest costs crowd out the budget (budget_interest), legitimacy erodes, r > g dynamics bite, and each crisis hits harder because the buffers are gone.",
      "Dalio's pattern: late decline ends with the reserve privilege questioned and the internal order stressed - populism, institutional norm-breaking, contested elections. Recovery requires either painful restructuring or a genuine productivity miracle."
    ]
  };
  G.phase_reset = {
    title: "Phase: Reset / New Order",
    slides: [
      "The reordering: debts get written down or inflated away, institutions are rebuilt, and a new monetary and political order emerges. 1930s-1945 and 1971 are the modern examples.",
      "In-game: the extreme tail - reached when debt dynamics and internal conflict run past the guardrails. It is not a game-over screen so much as a new game with scarred determinants.",
      "Resets are how cycles close. They clear dead debt and dead institutions, but the price - depression, war, or both in history - is why the whole game is about avoiding one."
    ]
  };
  /* ---------------- Formulas ---------------- */
  G.formula_okun = {
    title: "Formula: Okun's Law",
    slides: [
      "An empirical rule of thumb (Arthur Okun, 1960s): every extra point of unemployment corresponds to roughly 2 points of lost output relative to potential - and vice versa.",
      "In-game: when real growth falls short of trend, unemployment rises by about half the shortfall (plus any direct crisis shock). Strong demand stimulus pulls it back down the same way.",
      "Okun is why recessions are doubly cruel: the same shortfall shows up as lost GDP AND lost jobs. It is also why crisis stimulus punches above its weight - it buys back both."
    ]
  };
  G.formula_debt = {
    title: "Formula: Debt Dynamics (r - g)",
    slides: [
      "Debt-to-GDP evolves by a simple law: it grows by the deficit, plus the gap between the interest rate r and growth rate g, applied to existing debt. Olivier Blanchard's 2019 AEA address made 'r < g' famous.",
      "In-game: each quarter, debt += deficit + (r - g) x debt. When growth exceeds the interest rate, the debt ratio can shrink even with modest deficits; when r > g, debt snowballs on its own.",
      "This is the deepest formula in the sim. Booms with low rates are forgiving; stagnation with rising rates is a trap. Every fiscal choice is really a bet on r - g."
    ]
  };
  G.formula_gap = {
    title: "Formula: Output Gap Closure",
    slides: [
      "The output gap is the distance between what the economy produces and what it could produce at full employment. In 2009 that gap was roughly a trillion dollars a year.",
      "In-game: a negative gap (slump) decays slowly toward zero on its own, and stimulus (welfare, infrastructure, tax cuts) closes it faster by adding demand. Overshooting past zero runs the economy hot and lifts inflation.",
      "The gap is the answer to 'why didn't the 2009 stimulus feel bigger?' - a $787B bill against a multi-trillion-dollar hole. Sizing policy to the gap, not the headlines, is the skill."
    ]
  };
  G.formula_conflict = {
    title: "Formula: Internal Conflict",
    slides: [
      "Dalio's 'internal order/disorder' cycle: conflict rises when wealth gaps are wide, economic pain is high, and legitimacy is low - the combination that produces populism and norm-breaking.",
      "In-game: a pressure gauge fed by unemployment, stagnant median income, legitimacy and polarizing policy choices. High conflict taxes approval for everyone and raises crisis risk.",
      "History's warning: internal conflict, not external rivals, is what usually breaks great powers. Managing distribution and trust is not softness - it is national security."
    ]
  };
  G.formula_approval = {
    title: "Formula: Weighted Voter Approval",
    slides: [
      "Your approval is a weighted average across seven voter blocs - workers (22), seniors (18), capitalists (14), youth (14), religious (12), immigrants (10), technocrats (10).",
      "In-game: each policy option carries per-group approval effects (some instant, some drifting per turn). Your score is the bloc-weighted mean; sentiment follows it with a lag.",
      "No policy pleases everyone - a VAT delights technocrats and angers workers unless you pair it with transfers. Reading the weights is reading the electorate: seniors and workers are almost half the map."
    ]
  };
})(window.GLOSSARY);

(function (G) {
  /* ---------------- Budget categories (CBO-style, FY2008 scale) ---------------- */
  G.budget_defense = {
    title: "Budget: Defense",
    slides: [
      "The Pentagon and wars: roughly $600-700B a year at game start with Iraq/Afghanistan funding - the largest discretionary line, over half of all discretionary spending.",
      "Cutting it saves real money but weakens the military determinant and costs defense-sector jobs; raising it does the reverse. Reallocation (see the Military policy) moves dollars to health/cyber/R&D instead.",
      "Dalio's overextension warning lives here: empires overspend on defense late in the cycle. But cutting into a crisis or a rival's buildup is how deterrence fails. Sequence carefully."
    ]
  };
  G.budget_social_security = {
    title: "Budget: Social Security",
    slides: [
      "The largest single program: about $615B in 2008, pensions and disability for 50M+ Americans, funded by its own payroll tax.",
      "Cutting it hits seniors - the highest-turnout bloc - directly in the wallet; raising it is expensive but durable and popular. It is 'mandatory' spending: it pays out by law until Congress changes the law.",
      "The third rail of American politics. Every serious long-run deficit plan touches it eventually, because demographics (boomers retiring from 2008 on) grow it automatically."
    ]
  };
  G.budget_medicare = {
    title: "Budget: Medicare",
    slides: [
      "Health coverage for seniors: about $390B in 2008 and the fastest-growing major program as healthcare prices outpace inflation.",
      "Cuts squeeze hospitals and seniors' care (and seniors' approval); increases buy health outcomes at rising prices. Payment reform is the efficiency frontier.",
      "Medicare is the long-run deficit story - not waste, just medicine getting expensive for an aging country. Bend this cost curve and r - g looks very different in 2030."
    ]
  };
  G.budget_medicaid = {
    title: "Budget: Medicaid",
    slides: [
      "Health coverage for low-income families, the disabled and nursing-home care: about $200B federal in 2008, shared with the states.",
      "Cuts fall on the poorest and on state budgets simultaneously; expansions reduce uninsured rates, medical bankruptcy and overdose mortality (treatment access). Countercyclical: rolls swell in recessions automatically.",
      "Medicaid is the quiet giant - fewer headlines than Medicare, but it funds most nursing-home care and is the main treatment channel in the opioid crisis."
    ]
  };
  G.budget_income_security = {
    title: "Budget: Income Security",
    slides: [
      "The safety net proper: unemployment insurance, SNAP (food stamps), TANF, housing aid and the EITC - roughly $270B in 2008, ballooning in recessions.",
      "These are 'automatic stabilizers': spending rises in slumps without a vote, cushioning demand. Raising it (or the Welfare policy) amplifies that; cutting it in a downturn deepens the hole.",
      "This line is the fiscal immune system. USDA estimated each SNAP dollar returned roughly $1.5+ in activity during the recession - cutting stabilizers in a crisis is penny-wise."
    ]
  };
  G.budget_health = {
    title: "Budget: Health (non-Medicare/Medicaid)",
    slides: [
      "NIH research, CDC, public health, the FDA and veterans' adjacent health programs: roughly $60B a year - small, but it is the nation's R&D lab for medicine.",
      "Cuts slow biomedical research and outbreak response; increases feed the innovation determinant and, in this era, overdose treatment capacity.",
      "The ROI case: NIH-funded science underlies a large share of modern drug development. Public health is cheap until the quarter you need it - then it is priceless."
    ]
  };
  G.budget_veterans = {
    title: "Budget: Veterans",
    slides: [
      "VA healthcare, disability compensation and benefits: about $90B in 2008, climbing as Iraq/Afghanistan veterans enter the system.",
      "Cuts break a literal promise and anger a cross-partisan constituency; increases speed claims processing and care. Costs lag wars by decades, not quarters.",
      "The 2014 VA wait-list scandal showed what under-capacity looks like. War's true price tag lands here long after the defense line moves on."
    ]
  };
  G.budget_education = {
    title: "Budget: Education",
    slides: [
      "Federal education spending - Pell grants, Title I, student aid: roughly $80B. Most school funding is state/local; the federal share is the equity and research layer.",
      "Increases feed the education determinant slowly (it is the highest-lag payoff in the game); cuts are small fiscal wins with long shadow costs to skills and competitiveness.",
      "Dalio puts education first among the determinants for a reason: it compounds into everything else over a generation. Cutting it is borrowing from 2035."
    ]
  };
  G.budget_transport = {
    title: "Budget: Transportation",
    slides: [
      "Highways, transit, aviation, rail: about $75B a year, funded partly by the gas-tax Highway Trust Fund. The Interstate System (1956) is the ancestor program.",
      "Cuts defer maintenance - bridges don't fail politely, they fail all at once; increases are classic stimulus with high employment content (Garrett-Peltier: infrastructure beats defense on jobs per dollar).",
      "ASCE graded US infrastructure a D in 2009 with a $2.2T five-year investment gap. Deferred maintenance is deferred debt - it just accrues in concrete instead of Treasuries."
    ]
  };
  G.budget_environment = {
    title: "Budget: Environment & Natural Resources",
    slides: [
      "EPA, national parks, water infrastructure, land management: roughly $30B a year - one of the smallest lines, protecting assets worth trillions.",
      "Cuts slow cleanups and enforcement (flashing back to why the Clean Air Act passed in 1970); increases fund water systems, parks and conservation - the Flint crisis shows the cost of neglect.",
      "Environmental spending is insurance with scenery. It rarely wins elections and quietly decides whether your water and air stay boring."
    ]
  };
  G.budget_international = {
    title: "Budget: International Affairs",
    slides: [
      "State Department, embassies, and foreign aid: about $40B - around 1% of federal spending (CFR), despite polls showing most Americans guess 25%+.",
      "Cuts buy trivial fiscal savings at real soft-power cost - alliances, HIV/AIDS programs (PEPFAR), disaster relief; increases buy influence cheaply by historical standards.",
      "The source ledger is blunt: eliminating aid cannot produce big savings. This line is diplomacy's rounding error and its foundation at the same time."
    ]
  };
  G.budget_science = {
    title: "Budget: Science & Space",
    slides: [
      "NASA, NSF, DOE science programs: roughly $27B a year. The Apollo-era peak was over 4% of the budget; by 2008 it is well under 1%.",
      "Cuts thin the pipeline that feeds the innovation determinant; increases compound over years (Fieldhouse & Mertens: public R&D returns arrive on multi-year lags).",
      "Basic science is the classic public good - markets underfund it because nobody can patent gravity. Small line, outsized future GDP."
    ]
  };
  G.budget_justice = {
    title: "Budget: Justice & Federal Law Enforcement",
    slides: [
      "FBI, DEA, federal courts, prisons, border enforcement: about $45B. The federal share of the justice system - states hold most of the 2.3M incarcerated.",
      "Cuts constrain enforcement capacity (remember: NIJ says certainty of catching offenders deters more than sentence length); increases fund agents, courts and prisons.",
      "Where drug and law policies become dollars. Prohibition enforcement and incarceration live here; so does the capacity that actually deters."
    ]
  };
  G.budget_interest = {
    title: "Budget: Interest on the Debt",
    slides: [
      "The price of past deficits: about $250B in 2008 at low rates. You cannot cut it directly - it is set by the debt stock and the interest rate r.",
      "It grows when debt grows or rates rise; the only controls are borrowing less and keeping r below g (growth). Every dollar here is a dollar not spent on anything else.",
      "Interest is the cycle's tell. When it crowds out the rest of the budget, you are in late decline by definition. Watch this line to know which phase you are really in."
    ]
  };
  /* ---------------- Party mechanics ---------------- */
  G.party_house = {
    title: "Party: The House",
    slides: [
      "All 435 House seats are elected every two years - the most sensitive instrument in American politics. Democrats won it in 2006 and hold it at game start.",
      "In-game: House control tracks your weighted approval with a short fuse. Lose the midterms (turn 12, turn 28) and political-capital regeneration slows - big reforms cost more.",
      "The House is the thermometer: 1994, 2006, 2010 all flipped on national mood. If your approval sinks, assume the gavel follows."
    ]
  };
  G.party_senate = {
    title: "Party: The Senate",
    slides: [
      "A third of Senate seats are up every two years; six-year terms and small-state bias make it slower to move than the House. The 60-vote filibuster norm is the real bar.",
      "In-game: Senate standing moves like the House but damped - it lags approval swings and rarely flips in one cycle. Divided control raises the political-capital cost of everything.",
      "The Senate is why landslides still produce gridlock. Winning 60 seats is the closest thing to a cheat code the real system offers - and it usually lasts one Congress."
    ]
  };
  G.party_governors = {
    title: "Party: Governors & the States",
    slides: [
      "Fifty state governments run elections, Medicaid, and most schools and prisons. They are the farm team and the implementation layer for half your policies.",
      "In-game: governor strength drifts with approval and economic conditions; strong state allies make policy effects land faster (implementation), weak ones slow them.",
      "Federalism is the cheat-resistant design: Washington can fund Housing First or Medicaid expansion, but states build it. Ignore the states and your reforms arrive late."
    ]
  };
  G.party_midterms = {
    title: "Party: Midterm Elections",
    slides: [
      "The referendum nobody votes FOR you in: midterms (Q4 2010 = turn 12, Q4 2014 = turn 28) historically punish the president's party - 2010 cost Democrats 63 House seats.",
      "In-game: midterms read your approval at the moment of the election, not your best quarter. Political capital and bloc approvals in the two quarters before the vote decide the damage.",
      "The midterm clock is the real turn timer. Honeymoon reforms (turns 1-8) get graded at turn 12 - whatever is popular by then survives; whatever isn't gets repealed in spirit."
    ]
  };
  G.party_court = {
    title: "Party: Courting Voter Blocs",
    slides: [
      "Targeted outreach: spending campaign funds to court a specific bloc (workers, seniors, youth...) during campaign windows - ads, promises, turnout operations.",
      "In-game: during windows (turns 13-16 and 29-32) you can spend funds to lift a bloc's approval. Costs rise as the bloc gets saturated; effects fade after the election.",
      "Courting buys margin, not mandate. It can save a midterm at the edges - but a bloc you govern well for four years beats a bloc you advertise at for four weeks."
    ]
  };
})(window.GLOSSARY);

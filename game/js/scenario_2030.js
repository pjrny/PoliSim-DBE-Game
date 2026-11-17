/* ============================================================================
   PoliSim-DBE v0.5 — "Dimensions Beyond Energy" (2030): transition-shock crisis.
   Inspired by the DBE_V0 research branch (github.com/pjrny/DBE_V0,
   dimensions-beyond-energy — read-only; nothing upstream was changed).

   Design brief (from the repo): a Dimensional Braid Engine — a compact
   quantum-assisted fusion device — crosses net-electric breakeven. Your
   party controls the presidency. Manage the transition. Dimension G of the
   repo is the GOVERNANCE layer: the political shocks of a civilization
   leaving energy scarcity. The repo's eight named transition-shock scenarios
   (fusion shock, quantum-crypto shock, AGI energy-solution shock, post-work
   abundance, longevity, energy monopoly, ecological rebound, digital rights)
   are mapped here to scripted shocks + statement events, 2030-2040.

   Epistemic discipline (per the repo): the DBE device is FICTIONAL. Every
   macro number below is our OWN calibration, chained to the ACTUAL-track
   projection that ends scenario_2016.js (turn 56 ≈ Q4 2030). The repo's
   "stabilized money markets" claim has no in-repo support — its own
   quantum-crypto material implies the opposite — so the mid-game money-
   market beat is a DESTABILIZATION crisis (Q-Day + repo stress), and the
   repo's "2038 presidency" vignette is re-dated: partial/net-electric
   breakthrough in 2030, commercial viability arriving 2038 (turn 33).
   ========================================================================== */

/* ---- scripted macro shocks (consumed via scenarioEvent() in engine.js) ---- */
window.EVENTS.dbe = {
  name: 'Dimensions Beyond Energy',
  banner: '⚛️ DIMENSIONS BEYOND ENERGY — a quantum-assisted fusion device has crossed net-electric breakeven. Cheap power is coming; so are stranded fossil assets, a cryptography panic, and a fight over who owns the future. Manage the transition from scarcity to abundance without breaking the republic.',
  // pp growth shock per turn: capex boom (2030) → stranded-asset credit stress
  // (2030Q4-2031) → Q-Day crypto panic (2033) → scale-up dividend (2034) →
  // commercial-viability boom (2038) → abundance plateau (2040)
  shocks: {
    1: 1.5, 2: 1.2, 3: 0.8,
    5: -1.2, 6: -1.8, 7: -1.4, 8: -0.8, 9: -0.4,
    13: -0.8, 14: -1.6, 15: -1.2, 16: -0.6,
    21: 0.8, 22: 1.0, 23: 0.8,
    33: 1.2, 34: 1.5, 35: 1.2, 36: 0.8,
    41: 1.0, 42: 1.2
  },
  // labor-market scarring: fossil-belt layoffs + transition churn, then Q-Day
  unempShock: {
    5: 0.3, 6: 0.5, 7: 0.4, 8: 0.3, 9: 0.2,
    14: 0.3, 15: 0.3, 16: 0.2
  },
  // extra outlays, % of GDP per quarter: just-transition assistance, then the
  // post-quantum cryptography migration + Treasury backstop
  outlayShock: {
    5: 0.5, 6: 0.8, 7: 0.8, 8: 0.5, 9: 0.3,
    14: 1.0, 15: 0.8, 16: 0.5
  },
  // v0.5 engine extension: direct determinant hits per turn (see engine.js
  // determinants-drift block). Credit wobble dents the financial center;
  // Q-Day dents reserve status; fusion scale-up lifts output/competitiveness.
  detShock: {
    1:  { innovation: 1 },
    5:  { fincenter: -2 }, 6: { fincenter: -2 }, 7: { fincenter: -1 },
    13: { reserve_fx: -4, fincenter: -2 },
    14: { reserve_fx: -4, fincenter: -2 },
    15: { reserve_fx: -2 },
    16: { reserve_fx: -1 },
    21: { competitiveness: 1 },
    33: { output: 2, competitiveness: 1 },
    34: { output: 2 },
    41: { output: 1 }
  }
};

/* ---- statement events: the eight Dimension-G transition shocks as popups ----
   Schema identical to realworld_events.js. These are SPECULATIVE-FUTURE
   events (fiction grounded in the DBE_V0 digest), so kind is 'statement',
   actId is null, and sources cite the DBE_V0 branch, not news archives.    */
(function () {
  var RWE = window.REALWORLD_EVENTS;
  if (!RWE) return; // realworld_events.js must load first (script order)
  RWE.scenarios.dbe2030 = {
    turns: {
      "1": [{
        id: "breakeven", kind: "statement", tier: "major",
        quarterLabel: "Q1 2030", title: "Net-electric breakeven",
        headline: "The Meridian consortium announces its DBE reactor has run 40 days net-electric — fusion power that pays for itself",
        context: "Forty years of 'thirty years away' just ended. Markets are roaring, oil is sliding, and every camera in the world wants to know what the President intends to do with the first energy source in history that does not need fuel.",
        blocs: ["technocrats", "capitalists", "workers", "youth"],
        actId: null,
        options: [
          { id: "champion-public", label: "Champion a public energy moonshot", text: "\"This belongs to every American. We will build the grid, the factories and the workforce in the open, and we will not sell the future to the highest bidder.\"",
            pc: 0, groups: { technocrats: 3, workers: 2, capitalists: -3, youth: 1 }, preview: "Technocrats and workers will rally to a national mission; investors fear being cut out of the licensing gold rush." },
          { id: "let-market-run", label: "Let the market run it", text: "\"Government didn't invent this, and government shouldn't strangle it. Get out of the way and let American enterprise scale it.\"",
            pc: 0, groups: { capitalists: 3, technocrats: -1, workers: -1 }, preview: "Investors and executives cheer; engineers worry about corner-cutting and workers hear abandonment." },
          { id: "urge-caution", label: "Urge caution — \"one reactor is not a grid\"", text: "\"One reactor is not a grid, and a press conference is not a kilowatt. We'll build this carefully, on the evidence.\"",
            pc: 0, groups: { technocrats: 1, youth: -1, capitalists: -1 }, preview: "Sober-minded experts nod; the country wanted a sermon about the future and got a seminar." }
        ],
        noComment: { groups: { technocrats: -1, youth: -1 }, sentiment: 0 },
        actualReaction: "DBE_V0 Dimension G: the fusion shock is primarily a GOVERNANCE shock — the physics is the easy part; legitimacy, ownership and transition management decide whether abundance lands as prosperity or chaos.",
        sources: ["DBE_V0 dimensions-beyond-energy, transition-shock scenarios: fusion shock"]
      }],
      "3": [{
        id: "fossil-layoffs", kind: "statement", tier: "standard",
        quarterLabel: "Q3 2030", title: "Fossil-belt layoffs begin",
        headline: "Two major shale producers announce 40,000 combined layoffs as breakeven cheapens every barrel; refinery towns brace for the worst",
        context: "The boom you didn't create is about to burn towns you represent. Workers who built the old energy economy are watching the new one get announced on television without them.",
        blocs: ["workers", "seniors", "religious"],
        actId: null,
        options: [
          { id: "promise-transition", label: "Promise a just transition", text: "\"No worker who powered this country for a generation will be left in the dark. Wage insurance, relocation, retraining — guaranteed, by law.\"",
            pc: 1, groups: { workers: 4, religious: 1, capitalists: -2 }, preview: "Energy-country workers and their communities will hear a real commitment; the Chamber will grumble about the bill." },
          { id: "promise-transition-bare", label: "Offer thoughts, not money", text: "\"Change is hard, but America has always managed change. These workers are resilient, and the new economy will need them.\"",
            pc: 0, groups: { workers: -2, seniors: -1 }, preview: "The language of condolence, not commitment. Workers have heard this speech before, right before the plant closed." },
          { id: "blame-companies", label: "Blame the companies", text: "\"They took the subsidies in the good years and they're abandoning the towns in the bad ones. We'll remember who stood where.\"",
            pc: 0, groups: { workers: 2, capitalists: -3, technocrats: -1 }, preview: "Workers love the fight; executives call it dangerous populism; technocrats worry about scaring the capital the transition needs." }
        ],
        noComment: { groups: { workers: -3 }, sentiment: -1 },
        actualReaction: "DBE_V0: the fusion shock hits unevenly — asset owners absorb paper losses, but FOSSIL-BELT LABOR absorbs real ones; transition assistance is the difference between a managed shift and a radicalized one.",
        sources: ["DBE_V0: fusion shock; Dimension G transition management"]
      }],
      "5": [{
        id: "grid-war", kind: "statement", tier: "standard",
        quarterLabel: "Q1 2031", title: "The interconnection war",
        headline: "Grid operators report a 9-year queue for new DBE plants to connect; governors threaten to seize transmission corridors",
        context: "Everyone wants to build reactors; nobody can plug them in. The transmission queue is becoming a constitutional fight between states, and a gift to every NIMBY with a lawyer.",
        blocs: ["technocrats", "capitalists", "workers"],
        actId: null,
        options: [
          { id: "federal-corridors", label: "Federalize the corridors", text: "\"We will use federal eminent domain for transmission the way we used it for the interstates. The electrons will move.\"",
            pc: 2, groups: { technocrats: 2, capitalists: 1, workers: 1, religious: -1 }, preview: "Engineers and builders cheer a decisive hand; property-rights voters reach for their lawyers and their pitchforks." },
          { id: "state-compact", label: "Push a state compact", text: "\"Fifty governors, one table. We'll build the corridors state by state, with federal money and local consent.\"",
            pc: 0, groups: { technocrats: 1, religious: 1 }, preview: "Slower and safer; technocrats appreciate the process and localists the consent — but the queue grows while you negotiate." },
          { id: "let-markets-queue", label: "Let the queue sort itself out", text: "\"Scarcity prices solve queues. The plants that matter most will pay to connect first.\"",
            pc: 0, groups: { capitalists: 2, workers: -1, technocrats: -1 }, preview: "Investors like the price signal; engineers warn the 'plants that matter most' will be the ones nearest money, not the ones the grid needs." }
        ],
        noComment: { groups: { technocrats: -1, workers: -1 }, sentiment: 0 },
        actualReaction: "DBE_V0: infrastructure interconnection lag is the binding constraint on the transition — governance bandwidth, not physics, sets the pace.",
        sources: ["DBE_V0: fusion shock — deployment & interconnection constraints"]
      }],
      "7": [{
        id: "dbe-trust", kind: "statement", tier: "standard",
        quarterLabel: "Q3 2031", title: "The DBE trust",
        headline: "Leaked licensing data: the Meridian consortium controls 80% of viable DBE patents and is cross-licensing only with allies",
        context: "The energy source that could free humanity from scarcity is starting to look like it has an owner. Antitrust hawks, foreign governments and every rival lab are asking what you plan to do about it.",
        blocs: ["capitalists", "technocrats", "youth"],
        actId: null,
        options: [
          { id: "break-patent-wall", label: "Threaten compulsory licensing", text: "\"Energy that fundamental cannot be a toll road. License it fairly or we will license it for you — with compensation, but we will do it.\"",
            pc: 2, groups: { youth: 2, technocrats: 1, capitalists: -4, workers: 1 }, preview: "Young voters and open-access advocates cheer; the entire investor class marks you down as a confiscation risk." },
          { id: "tolerate-then-tax", label: "Tolerate the monopoly — and tax the rents", text: "\"Let them build it; then we'll tax the superprofits and recycle the revenue to the public. Don't kill the golden reactor.\"",
            pc: 0, groups: { capitalists: 1, technocrats: 1, youth: -1 }, preview: "The pragmatic middle: business accepts the bargain, technocrats respect it, and the left calls it appeasement." },
          { id: "national-security-carveout", label: "National-security carveout only", text: "\"We intervene only where defense and grid resilience demand it. Beyond that, this is a private success story — for now.\"",
            pc: 0, groups: { capitalists: 2, youth: -2 }, preview: "Investors relax; anti-monopoly voters conclude the fix is in." }
        ],
        noComment: { groups: { youth: -2, capitalists: 1 }, sentiment: 0 },
        actualReaction: "DBE_V0: the energy-monopoly scenario is its own named transition shock — WHO OWNS ABUNDANCE is the central political question of the post-scarcity order.",
        sources: ["DBE_V0: energy monopoly transition-shock scenario"]
      }],
      "10": [{
        id: "ag-suit", kind: "statement", tier: "standard",
        quarterLabel: "Q2 2032", title: "The antitrust trial of the century",
        headline: "Twenty-three state attorneys general sue to break up the DBE patent pool; Meridian counters that the suit would 'freeze the transition itself'",
        context: "The courts are now in the middle of the energy future. Whichever side you back, half the country will call it either corporate capture or a war on progress.",
        blocs: ["capitalists", "youth", "workers", "technocrats"],
        actId: null,
        options: [
          { id: "back-the-suit", label: "Back the states", text: "\"I have directed the DOJ to join the states. No single consortium will hold the power supply of the republic hostage.\"",
            pc: 2, groups: { youth: 3, workers: 1, capitalists: -4, technocrats: -1 }, preview: "A generational fight on the side of the public; Wall Street treats it as an existential threat to the transition's funding." },
          { id: "back-meridian", label: "Back the consortium", text: "\"The fastest transition is the one that pays its builders. Breaking Meridian slows deployment by a decade — the states are wrong.\"",
            pc: 1, groups: { capitalists: 3, technocrats: 1, youth: -3, workers: -1 }, preview: "Industry and deployment hawks stand with you; young voters see a government captured by the company that owns the sun." },
          { id: "settlement-push", label: "Push for a consent decree", text: "\"Nobody wins a ten-year trial. Open licensing on grid-scale reactors, keep the rest — settle it this year.\"",
            pc: 1, groups: { technocrats: 2, capitalists: 1, youth: 1 }, preview: "The dealmaker's lane: unglamorous, broadly acceptable, and both sides' maximalists call it surrender." }
        ],
        noComment: { groups: { youth: -1, capitalists: -1 }, sentiment: 0 },
        actualReaction: "DBE_V0 Dimension G: antitrust is governance infrastructure in the transition — the monopoly fight is where abstract ownership questions become real law.",
        sources: ["DBE_V0: energy monopoly scenario — antitrust as transition governance"]
      }],
      "13": [{
        id: "qday", kind: "statement", tier: "major",
        quarterLabel: "Q1 2033", title: "Q-DAY",
        headline: "A quantum computer has factored an RSA-2048 challenge key; 'harvest now, decrypt later' stockpiles suddenly mean every secret since 2015 is potentially public",
        context: "Banking, defense, hospital and diplomatic traffic — all of it rides on math that just died. Markets are closed for the second day. The repo market, which lends trillions overnight against collateral, is refusing Treasuries signed with legacy keys.",
        blocs: ["technocrats", "capitalists", "seniors", "workers"],
        actId: null,
        options: [
          { id: "moonshot-pqc", label: "Declare a PQC moonshot", text: "\"Every federal system, every critical bank, every piece of infrastructure — re-keyed in 18 months, whatever it costs. This is Y2K with teeth, and we will not blink.\"",
            pc: 2, groups: { technocrats: 3, capitalists: 1, seniors: 1, workers: 1 }, preview: "Competence theater at its best: experts and markets both want a single throat to choke and a single hand on the wheel." },
          { id: "blame-meridian", label: "Blame the quantum lab", text: "\"The same consortium that sold us the future built the machine that cracked the present. Trust them with your power grid, then.\"",
            pc: 0, groups: { workers: 1, youth: -1, capitalists: -2, technocrats: -1 }, preview: "A crowd-pleasing villain; engineers note the attack would have come from somewhere eventually, and investors hear instability." },
          { id: "reassure-calm", label: "Reassure — \"systems are sound\"", text: "\"Our critical systems are sound, our regulators are engaged, and panic helps no one. Please go about your business.\"",
            pc: 0, groups: { seniors: -1, workers: -1, technocrats: -2 }, preview: "Saying 'sound' during a bank run has never once worked. Everyone hears the whistling past the graveyard." }
        ],
        noComment: { groups: { technocrats: -2, capitalists: -2, seniors: -1 }, sentiment: -2 },
        actualReaction: "DBE_V0: the quantum-crypto shock is a NAMED transition scenario and implies destabilization — the repo 'the repo market, stabilized' framing in the fiction is wrong on its own material. We model it as a real crisis beat.",
        sources: ["DBE_V0: quantum-crypto shock; harvest-now-decrypt-later"]
      }],
      "15": [{
        id: "repo-stress", kind: "statement", tier: "standard",
        quarterLabel: "Q3 2033", title: "The repo seizure",
        headline: "Overnight repo rates spike to 9% as dealers refuse legacy-signed collateral; the Fed opens an emergency PQC-accepted collateral facility",
        context: "The plumbing of the entire financial system — the market where Treasuries are pledged for cash overnight — is gumming up over cryptography. The Fed just backstopped it. Congress wants to know who pays.",
        blocs: ["capitalists", "technocrats", "seniors", "workers"],
        actId: null,
        options: [
          { id: "backstop-blanket", label: "Full federal backstop, no questions", text: "\"The full faith and credit of the United States does not expire because the math changed. We backstop it all, and we re-key it all.\"",
            pc: 1, groups: { capitalists: 3, seniors: 1, workers: 1, youth: -1 }, preview: "Markets stabilize and remember who steadied the ship; the left calls it another bailout and they're not entirely wrong." },
          { id: "means-test-backstop", label: "Backstop households first", text: "\"Deposits and paychecks first, dealer balance sheets last. The Street can discount its own collateral risk.\"",
            pc: 1, groups: { youth: 2, workers: 2, capitalists: -3, technocrats: 1 }, preview: "Popular and defensible; trading desks call it punitive and price in a grudge." },
          { id: "congress-fight", label: "Make Congress own it", text: "\"I will not rule by emergency facility. The legislature authorized this system; the legislature will re-authorize it — in the open.\"",
            pc: 0, groups: { technocrats: 1, capitalists: -2, seniors: -1, youth: 1 }, preview: "Constitutionally pure, financially terrifying: markets do not enjoy waiting on a floor vote during a seize-up." }
        ],
        noComment: { groups: { capitalists: -2, seniors: -1 }, sentiment: -1 },
        actualReaction: "DBE_V0 material: quantum capability implies monetary-system destabilization risk; 'stabilized money markets' is asserted nowhere the repo can support.",
        sources: ["DBE_V0: quantum-crypto shock — monetary plumbing"]
      }],
      "18": [{
        id: "agi-solver", kind: "statement", tier: "standard",
        quarterLabel: "Q2 2034", title: "The six-month design cycle",
        headline: "An AI lab's materials-solver cuts DBE magnet design cycles from six years to six months; the consortium's moat starts looking like a puddle",
        context: "The same class of system that cracked RSA is now designing better reactors than the consortium's own engineers. Breakthroughs are arriving quarterly. Nobody's regulatory framework, labor model or monopoly theory was built for this pace.",
        blocs: ["technocrats", "capitalists", "workers", "youth"],
        actId: null,
        options: [
          { id: "open-agi-gov", label: "Propose open AGI governance", text: "\"Systems that design reactors and crack codes need rules the whole planet signs. I'm calling for an international AI-and-energy charter — this year.\"",
            pc: 1, groups: { technocrats: 2, youth: 2, capitalists: -1, religious: -1 }, preview: "Technocrats and young voters want the charter; business dreads a global regulator and sovereigntists smell world government." },
          { id: "race-to-build", label: "Race to build, regulate later", text: "\"Every rule we write today is obsolete by next quarter. Speed is the only safety: whoever scales first sets the standard.\"",
            pc: 0, groups: { capitalists: 2, technocrats: -1, youth: -1 }, preview: "The accelerationist lane: investors ecstatic, engineers warning about exactly the last two crises, young voters uneasy." },
          { id: "public-ai-lab", label: "Found a public AI lab", text: "\"We'll build a national AI laboratory for energy and medicine — public weights, public benefit, private profits welcome to compete with it.\"",
            pc: 2, groups: { workers: 1, youth: 2, technocrats: 2, capitalists: -3 }, preview: "A new public enterprise; the left loves it, tech capital hates it, and someone has to actually run it." }
        ],
        noComment: { groups: { technocrats: -1, youth: -1 }, sentiment: 0 },
        actualReaction: "DBE_V0: the AGI energy-solution shock — capability arriving faster than institutions can metabolize it is the recurring Dimension-G failure mode.",
        sources: ["DBE_V0: AGI energy-solution shock"]
      }],
      "21": [{
        id: "thirty-hour", kind: "statement", tier: "standard",
        quarterLabel: "Q1 2035", title: "The thirty-hour week petition",
        headline: "With DBE power prices falling 60% and automation absorbing routine work, a petition for a federal thirty-hour week crosses 10 million signatures",
        context: "Abundance is arriving — but as dividends to capital and layoffs for labor, not yet as time for anyone. The post-work question is no longer philosophy; it's on your desk with ten million signatures.",
        blocs: ["workers", "youth", "capitalists", "seniors"],
        actId: null,
        options: [
          { id: "back-30hr", label: "Back the thirty-hour week", text: "\"The industrial age stole our time and called it employment. The abundance age can give it back. Thirty hours, full benefits, phased in by 2040.\"",
            pc: 2, groups: { workers: 4, youth: 3, capitalists: -4, seniors: -1 }, preview: "Labor's biggest win in a century; business warns of a competitiveness cliff and means it." },
          { id: "dividend-instead", label: "Counter with an energy dividend", text: "\"Don't shorten the week — thicken the paycheck. A sovereign dividend on fusion royalties, every citizen, every quarter.\"",
            pc: 1, groups: { workers: 2, capitalists: 1, seniors: 2, youth: 1 }, preview: "Splits the difference: everyone likes a check, though purists on both sides call it a dodge of the power question." },
          { id: "reject-both", label: "Reject both — \"work is dignity\"", text: "\"We will not legislate leisure from the Oval Office. Work is dignity. Build, don't redistribute the meaning of life.\"",
            pc: 0, groups: { capitalists: 2, religious: 2, workers: -3, youth: -3 }, preview: "The traditionalist lane: faith and business approve; workers and the young hear 'your century of leisure is cancelled'." }
        ],
        noComment: { groups: { workers: -2, youth: -2 }, sentiment: 0 },
        actualReaction: "DBE_V0: post-work abundance is a named shock — the distribution of LEISURE AND MEANING becomes the central labor conflict once energy stops being scarce.",
        sources: ["DBE_V0: post-work abundance transition-shock scenario"]
      }],
      "24": [{
        id: "longevity-ss", kind: "statement", tier: "standard",
        quarterLabel: "Q4 2035", title: "The actuaries' bombshell",
        headline: "With longevity therapies reaching the clinic, SSA actuaries project average life expectancy of 96 by 2050 — Social Security's math collapses on live television",
        context: "The good news is everyone might live to 96. The bad news is the trust funds were built for 79. Every solution — later retirement, bigger payroll taxes, means-testing, sovereign wealth — has a constituency and a kill-switch.",
        blocs: ["seniors", "youth", "workers", "capitalists"],
        actId: null,
        options: [
          { id: "sovereign-fund", label: "Fund it from the fusion sovereign fund", text: "\"We finally have a revenue source that grows faster than the actuaries' nightmares. Anchor Social Security to the energy dividend and end the 75-year panic permanently.\"",
            pc: 1, groups: { seniors: 3, workers: 2, youth: 1, capitalists: -2 }, preview: "The elegant fix: retirees and workers sign on; the only losers are those who wanted the crisis to force privatization." },
          { id: "raise-retirement", label: "Raise the retirement age", text: "\"Ninety-six-year-olds can work past 67. We will index the retirement age to longevity — honest math, on the record.\"",
            pc: 1, groups: { capitalists: 2, technocrats: 1, seniors: -4, workers: -2 }, preview: "Actuarially true and politically radioactive: seniors hear 'work until you drop' and they vote every two years." },
          { id: "means-test", label: "Means-test the benefits", text: "\"A billionaire's Social Security check is a rounding error and a moral absurdity. Cut the top, protect the floor.\"",
            pc: 0, groups: { youth: 2, capitalists: -2, seniors: -1, workers: 1 }, preview: "Popular with the young, hated by seniors who paid in for decades and consider the check earned, not charity." }
        ],
        noComment: { groups: { seniors: -2 }, sentiment: -1 },
        actualReaction: "DBE_V0: longevity is a named shock — every entitlement, pension and career ladder in the country was quietly built on a death schedule that just moved.",
        sources: ["DBE_V0: longevity transition-shock scenario"]
      }],
      "28": [{
        id: "rewilding", kind: "statement", tier: "standard",
        quarterLabel: "Q4 2036", title: "The rewilding boom",
        headline: "Cheap desalination and fusion-driven vertical farms trigger a farmland-abandonment wave; forty counties apply for 'post-extraction transition' funds in one month",
        context: "The ecological rebound is real — rivers coming back, forests returning, carbon falling — but it is arriving as boarded-up main streets in the counties that fed the country for two centuries. Nature is healing; the map is hollowing.",
        blocs: ["workers", "religious", "seniors", "youth"],
        actId: null,
        options: [
          { id: "county-trust", label: "A trust for the emptied counties", text: "\"We will buy the abandoned land into a national trust, pay the counties in perpetuity, and let the forest come back on a salary.\"",
            pc: 1, groups: { workers: 2, religious: 1, youth: 2, capitalists: -1 }, preview: "Rural dignity with a check attached; greens love it, and the only complaint is the price tag." },
          { id: "let-it-rewild", label: "Let nature take it", text: "\"Not every county survives every economy. The land returns to the wild, the people move to where the work is — as they always have.\"",
            pc: 0, groups: { capitalists: 1, youth: 1, workers: -3, religious: -1, seniors: -2 }, preview: "Economically literate, humanly brutal: the map doesn't forgive and neither will its abandoned voters." },
          { id: "agrivoltaic-jobs", label: "Convert to agrivoltaics and data towns", text: "\"Every empty county becomes a power-and-compute county: reactors, data centers, server farms. New work on old land.\"",
            pc: 1, groups: { workers: 2, capitalists: 2, religious: -1, seniors: 1 }, preview: "Industrial policy with a rural face; skeptics note data centers employ dozens, not thousands." }
        ],
        noComment: { groups: { workers: -2, seniors: -1 }, sentiment: 0 },
        actualReaction: "DBE_V0: ecological rebound is a named shock — the environment recovers faster than the communities extracted to damage it, and the gap is political dynamite.",
        sources: ["DBE_V0: ecological rebound transition-shock scenario"]
      }],
      "31": [{
        id: "digital-rights", kind: "statement", tier: "standard",
        quarterLabel: "Q3 2037", title: "The Digital Rights Amendment",
        headline: "A bipartisan convention push for a 28th Amendment — cognitive liberty, neural-data ownership, and a right to human authentication — clears 34 state applications",
        context: "After Q-Day, after the AGI lab scandals, after a decade of synthetic media, the country is trying to constitutionalize the line between human and machine. Whatever passes will outlive every law you've signed.",
        blocs: ["youth", "technocrats", "religious", "capitalists"],
        actId: null,
        options: [
          { id: "champion-amendment", label: "Champion the amendment", text: "\"The next hundred years will test what a person even is. I will campaign for the 28th in every state that hasn't ratified. Some lines belong above politics.\"",
            pc: 1, groups: { youth: 3, religious: 2, technocrats: 1, capitalists: -2 }, preview: "An above-the-fray statesman play: young voters and faith leaders rarely agree on anything, and they'd agree on this." },
          { id: "statute-not-amendment", label: "Fight it — statute, not scripture", text: "\"Amendments are forever and we can't predict next quarter's model. Legislate, regulate, revisit — do not carve today's panic into the Constitution.\"",
            pc: 0, groups: { capitalists: 2, technocrats: 2, religious: -2, youth: -2 }, preview: "The process conservative lane: industry and engineers approve; everyone who wanted a moral line hears technocracy." },
          { id: "own-the-issue", label: "Hijack the text", text: "\"I support a digital rights amendment — with my administration's enforcement clause, my civil-liberties framework, and my name on the preamble.\"",
            pc: 0, groups: { youth: 1, technocrats: -1, religious: -1, capitalists: -1 }, preview: "Politically masterful and universally distrusted: every faction gets half of what it wants and suspects the other half." }
        ],
        noComment: { groups: { youth: -1, religious: -1 }, sentiment: 0 },
        actualReaction: "DBE_V0: digital rights is a named shock — the constitution itself becomes a contested artifact of the transition.",
        sources: ["DBE_V0: digital rights transition-shock scenario"]
      }],
      "33": [{
        id: "commercial-fusion", kind: "statement", tier: "major",
        quarterLabel: "Q1 2038", title: "Commercial fusion",
        headline: "The first merchant DBE plant sells power into the open grid at 40% below gas; utilities file decommissioning plans for 118 fossil units in a single quarter",
        context: "Eight years after breakeven, it is finally unequivocal: the energy age has turned. The question left is only who holds the gains — and whether the republic that managed the shocks gets credit for the abundance.",
        blocs: ["workers", "capitalists", "youth", "seniors", "technocrats"],
        actId: null,
        options: [
          { id: "claim-the-win", label: "Claim the transition", text: "\"Eight years ago they said it couldn't be done, and some of them said it shouldn't be. We did it anyway — and history will record who managed it and who merely watched.\"",
            pc: 0, groups: { workers: 2, seniors: 1, technocrats: 1, youth: 1, capitalists: -1 }, preview: "Victory lap with a scoreboard: your coalition basks; the opposition pretends they were always for it." },
          { id: "share-the-credit", label: "Share the credit", text: "\"No party owns the sun. This belonged to the engineers, the linemen, the towns that absorbed the shocks, and the country that financed the moonshot.\"",
            pc: 0, groups: { technocrats: 2, religious: 1, youth: 2, workers: 1, capitalists: 1 }, preview: "Grace at scale: almost nobody objects, though your own base wonders why you're sharing their triumph." },
          { id: "warn-the-future", label: "Warn about the next shock", text: "\"Energy is solved. Food, water, computation, meaning — those shocks are queued up behind it. Enjoy the milestone; then get back to work.\"",
            pc: 0, groups: { technocrats: 2, youth: 1, seniors: -1 }, preview: "The Cassandra lane: experts respect it and the victory-drunk country finds it a bit of a buzzkill." }
        ],
        noComment: { groups: { workers: -1, youth: -1 }, sentiment: 0 },
        actualReaction: "DBE_V0: the repo's own vignette — 'Year 2038: compact fusion has become commercially viable… Your party controls the presidency. Manage the transition.' — re-dated here to arrive as the payoff of the 2030-2037 arc rather than its start.",
        sources: ["DBE_V0: 2038 presidency vignette (re-dated)", "DBE_V0: fusion shock"]
      }],
      "37": [{
        id: "petro-collapse", kind: "statement", tier: "standard",
        quarterLabel: "Q1 2039", title: "The petro-state collapse",
        headline: "Two OPEC states default within a month as oil demand falls below 2030 forecasts; refugee flows and loose-warhead headlines dominate the news cycle",
        context: "The geostrategy of scarcity is unwinding in real time — and it is not doing so gently. Alliances built on energy dependency are rewiring, and the collapsed states' problems have a habit of arriving at your borders.",
        blocs: ["religious", "workers", "seniors", "capitalists"],
        actId: null,
        options: [
          { id: "marshall-plan", label: "Propose an abundance Marshall Plan", text: "\"We will finance their transition the way we financed our own — reactors for oil, grids for wells, a century of dependency unwound by choice instead of collapse.\"",
            pc: 2, groups: { technocrats: 2, youth: 2, religious: 1, workers: -2, seniors: -2 }, preview: "Grand-strategy generosity: the world notices, and your industrial heartland asks why the money isn't theirs." },
          { id: "fortress", label: "Fortress America", text: "\"America managed its transition. Their collapse is not our bill. Secure the warheads, seal the borders, and let the old order die in peace.\"",
            pc: 0, groups: { religious: 2, seniors: 2, workers: 1, youth: -3, immigrants: -2 }, preview: "The sovereigntist lane: older and heartland voters approve; young voters and the world file it under decline." },
          { id: "selective-rescue", label: "Rescue selectively, publicly", text: "\"We save the arsenals and the reactors, openly and on camera, and we let the rest reorganize itself. Targeted, transparent, done.\"",
            pc: 1, groups: { capitalists: 1, seniors: 1, technocrats: 1, youth: -1 }, preview: "The cold-eyed middle: strategically defensible, morally unsatisfying, and nobody writes songs about it." }
        ],
        noComment: { groups: { seniors: -1, youth: -1 }, sentiment: 0 },
        actualReaction: "DBE_V0 Dimension G: the external order built on energy scarcity unwinds with it — alliance structures, petro-states and the security architecture all re-price at once.",
        sources: ["DBE_V0: Dimension G — geopolitical reordering beyond scarcity"]
      }]
    },
    // market texture: fictional fusion/quantum names (WS7 will wire real tickers)
    marketEvents: {
      "1":  [{ headline: "Meridian Power (MRDN) +34% on net-electric confirmation; uranium and gas majors slide", marketNote: "energy complex reprices", ticker: "MRDN", pricePath: null, statementRef: "breakeven" }],
      "7":  [{ headline: "GridWorks Transmission (GRID) hits record as interconnection queue fees triple", marketNote: "transmission scarcity trade", ticker: "GRID", pricePath: null, statementRef: "grid-war" }],
      "13": [{ headline: "VaultQ Security (VLTQ) +61% as post-quantum migration orders flood in; legacy fintech halts", marketNote: "Q-Day repricing", ticker: "VLTQ", pricePath: null, statementRef: "qday" }],
      "18": [{ headline: "Helix Materials (HLXM) unveils solver-designed DBE magnet; consortium patents questioned", marketNote: "AGI disruption trade", ticker: "HLXM", pricePath: null, statementRef: "agi-solver" }],
      "33": [{ headline: "Merchant fusion arrives: Tri-Grid utility index decommissions 118 fossil units; MRDN +22%", marketNote: "the energy age turns", ticker: "MRDN", pricePath: null, statementRef: "commercial-fusion" }]
    }
  };
})();

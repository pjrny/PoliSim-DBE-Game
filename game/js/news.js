/* PoliSim-DBE v0.3 - news.js
   News ticker + social reaction content. Plain browser global, no modules.
   Turn N = quarter N starting Q1 2008 (turn1=Q1 2008, turn40=Q4 2017). */
window.NEWS = {
  turns: {
    "1": {
      h: [
        "[WIRE] Fed brokers emergency JPMorgan rescue of Bear Stearns; shares wiped out in fire sale",
        "[MARKETS] Oil crosses $100 a barrel; recession fears grip Wall Street"
      ],
      s: [
        "@EconProf: Bear was the canary. If this is the worst of it, we are lucky. I doubt it is the worst.",
        "@MainStreetCEO: Credit lines frozen at my bank this week. Nobody is lending to anybody."
      ]
    },
    "2": {
      h: [
        "[WIRE] Treasury mails stimulus checks as gas nears $4 a gallon",
        "[POLITICS] Obama clinches Democratic nomination, first Black major-party nominee"
      ],
      s: [
        "@CollegeKid22: just watched a concession speech turn into a movement. history in real time",
        "@SoccerMomOH: $4 gas. Filling the minivan costs more than the groceries inside it."
      ]
    },
    "3": {
      h: [
        "[WIRE] Lehman Brothers files for bankruptcy; AIG nationalized days later",
        "[MARKETS] House rejects bailout, Dow plunges 777 points in one day",
        "[WIRE] Treasury unveils $700B TARP rescue plan"
      ],
      s: [
        "@WallStWhale: Twenty-three years in this market. Never seen the ticker look like this.",
        "@UnionBoss: They found $700B for the banks in a weekend. Ask for a bridge loan for your house, see what happens."
      ]
    },
    "4": {
      h: [
        "[WIRE] President signs $700B TARP into law amid market freefall",
        "[POLITICS] Barack Obama elected 44th President of the United States",
        "[MARKETS] Dow sheds a third of its value for the year as recession deepens"
      ],
      s: [
        "@TeaPartyPatriot: Bailouts for Wall Street, pink slips for us. Remember this in two years.",
        "@StudentOrganizer: Grant Park looks unreal tonight. Maybe politics can actually change something."
      ]
    },
    "5": {
      h: [
        "[WIRE] Obama sworn in before record inaugural crowd of 1.8 million",
        "[WIRE] President signs $787B stimulus (ARRA) into law",
        "[MARKETS] Dow sinks below 6,600, lowest close since 1997"
      ],
      s: [
        "@EconProf: The stimulus is roughly half what the output gap calls for. Watch the unemployment line anyway.",
        "@SenateGOP: $787 billion borrowed in one bill. Our grandkids will get the invoice."
      ]
    },
    "6": {
      h: [
        "[WIRE] General Motors files for bankruptcy; government takes majority stake",
        "[WIRE] WHO declares H1N1 swine flu a pandemic",
        "[DATA] Unemployment hits 9.5%, a 26-year high"
      ],
      s: [
        "@AutoWorker22: Grandpa retired from GM. Dad retired from GM. I just got my badge taken back.",
        "@FedWatcher: Green shoots everywhere, they say. Tell that to the 9.5%."
      ]
    },
    "7": {
      h: [
        "[WIRE] Cash for Clunkers fuels brief auto-sales rebound",
        "[POLITICS] Tea Party protests pack town halls over health reform",
        "[DATA] NBER later dates the recession's end to June 2009"
      ],
      s: [
        "@TeaPartyPatriot: We are the people and we are FED UP. See you at the town hall.",
        "@NursesUnion: Folks screaming about government healthcare while on Medicare. Make it make sense."
      ]
    },
    "8": {
      h: [
        "[DATA] Unemployment peaks at 10.0% in October",
        "[WIRE] Obama orders 30,000-troop surge in Afghanistan"
      ],
      s: [
        "@VetForPeace: Another surge. I did two tours so a third surge could happen. Tired.",
        "@EconProf: 10% unemployment with inflation dead. Textbook demand shortfall."
      ]
    },
    "9": {
      h: [
        "[WIRE] Supreme Court's Citizens United ruling opens floodgates for outside spending",
        "[WIRE] Obama signs Affordable Care Act; biggest health law since 1965"
      ],
      s: [
        "@SenateGOP: A 2,700-page bill nobody read. We will campaign on repeal, and we will win.",
        "@CollegeKid22: staying on my parents insurance til 26?? fine by me honestly"
      ]
    },
    "10": {
      h: [
        "[WIRE] Deepwater Horizon rig explodes; oil gushes into the Gulf",
        "[MARKETS] Flash Crash: Dow drops nearly 1,000 points in minutes",
        "[WIRE] EU and IMF approve 110B euro Greek bailout as euro crisis spreads"
      ],
      s: [
        "@GulfShrimper: BP poisoned our water and runs ads about how much they care.",
        "@WallStWhale: The machines sold and nobody bought. That was the scariest 20 minutes of my career."
      ]
    },
    "11": {
      h: [
        "[WIRE] Obama signs Dodd-Frank, the biggest financial overhaul since the 1930s",
        "[WIRE] BP seals blown-out Gulf well after 87 days"
      ],
      s: [
        "@CommunityBanker: 2,300 pages of rules and the too-big banks just got bigger.",
        "@EconProf: Dodd-Frank fixes some plumbing. It does not fix leverage culture."
      ]
    },
    "12": {
      h: [
        "[POLITICS] Republicans win 63 House seats in midterm wave, retake the chamber",
        "[MARKETS] Fed launches QE2, buying $600B in Treasuries",
        "[WIRE] Tunisian street vendor's death sparks Arab Spring protests"
      ],
      s: [
        "@TeaPartyPatriot: We TOLD you. The House is ours. Repeal starts now.",
        "@SenateDem: Shellacking is the word the President used, and it fits."
      ]
    }
  }
};

// turns 13-28
(function (T) {
  T["13"] = {
    h: [
      "[WIRE] Egypt's Mubarak resigns after 18 days of mass protests",
      "[WIRE] Magnitude-9.0 quake and tsunami hit Japan; Fukushima reactors melt down"
    ],
    s: [
      "@CollegeKid22: changed my avatar for Egypt. the whole region is livestreaming a revolution",
      "@EconProf: Supply chains run through Sendai. Watch auto and chip output next quarter."
    ]
  };
  T["14"] = {
    h: [
      "[WIRE] Osama bin Laden killed in Navy SEAL raid in Abbottabad, Pakistan",
      "[POLITICS] Treasury warns debt ceiling breach looms; talks stall in Washington"
    ],
    s: [
      "@VetForPeace: Ten years, two wars, one raid. Crowds chanting USA outside the White House at 1am.",
      "@FedWatcher: They are actually going to play chicken with the full faith and credit. Incredible."
    ]
  };
  T["15"] = {
    h: [
      "[WIRE] Debt-ceiling deal reached hours before default; automatic cuts locked in",
      "[MARKETS] S&P strips US of AAA credit rating for first time ever",
      "[WIRE] Occupy Wall Street camp forms in Zuccotti Park"
    ],
    s: [
      "@TeaPartyPatriot: We got the cuts. Now watch them cry about it.",
      "@OccupyKid: we are the 99%. see you in the park. bring a sleeping bag"
    ]
  };
  T["16"] = {
    h: [
      "[WIRE] Police clear Occupy encampments in New York, Oakland and Portland",
      "[WIRE] Last US troops leave Iraq, ending nine-year war"
    ],
    s: [
      "@UnionBoss: You can evict a camp. You cannot evict a conversation about inequality.",
      "@SenateGOP: Iraq withdrawal on someone else's timetable. Elections have consequences."
    ]
  };
  T["17"] = {
    h: [
      "[DATA] Unemployment falls to 8.3% as job growth finally picks up",
      "[WIRE] Shooting of Trayvon Martin in Florida ignites national outcry",
      "[WEB] Kony 2012 video becomes fastest-spreading viral film ever"
    ],
    s: [
      "@CollegeKid22: 100 million views in six days. the internet just figured out what it can do",
      "@EconProf: Jobs coming back, but wages are flat. A recovery for output, not yet for paychecks."
    ]
  };
  T["18"] = {
    h: [
      "[MARKETS] Facebook IPO stumbles out of the gate after $38 debut",
      "[WIRE] Supreme Court upholds Obamacare individual mandate, 5-4"
    ],
    s: [
      "@TechFounder: Bought FB at the open. Regretting it by lunch. Still worth it, probably.",
      "@SenateGOP: The mandate survives as a tax. Fine. We will repeal it at the ballot box."
    ]
  };
  T["19"] = {
    h: [
      "[WIRE] US consulate in Benghazi attacked; Ambassador Stevens and three others killed",
      "[MARKETS] Fed launches QE3: open-ended $40B monthly bond purchases"
    ],
    s: [
      "@FedWatcher: Open-ended QE. Bernanke just bet the balance sheet on the labor market.",
      "@SenateGOP: Four Americans dead and a story that keeps changing. There will be hearings."
    ]
  };
  T["20"] = {
    h: [
      "[WIRE] Superstorm Sandy floods New York and New Jersey; damage tops $60B",
      "[POLITICS] Obama re-elected, defeats Romney 332-206 in Electoral College",
      "[WIRE] 26 killed, 20 of them children, at Sandy Hook Elementary"
    ],
    s: [
      "@SoccerMomOH: Dropped my first grader off Monday and cried in the car. Enough.",
      "@EconProf: Re-election settled. Now the fiscal cliff: the largest austerity nobody voted for."
    ]
  };
  T["21"] = {
    h: [
      "[WIRE] Obama sworn in for second term",
      "[WIRE] Sequester takes effect: $85B in automatic spending cuts begin",
      "[MARKETS] Dow closes at record high, erasing crisis losses"
    ],
    s: [
      "@MainStreetCEO: Stocks at records, Main Street still digging out. Two economies, one ticker.",
      "@SenateDem: The sequester was designed to be stupid so nobody would allow it. We allowed it."
    ]
  };
  T["22"] = {
    h: [
      "[WIRE] Two bombs explode at Boston Marathon finish line; city locked down in manhunt",
      "[WIRE] Snowden leaks expose NSA mass surveillance programs",
      "[WIRE] Supreme Court strikes down Defense of Marriage Act"
    ],
    s: [
      "@TechFounder: So the government reads everything and we just... accept the terms of service?",
      "@CollegeKid22: cried at the DOMA ruling. my roommate can marry the love of her life now"
    ]
  };
  T["23"] = {
    h: [
      "[WIRE] Syria crosses chemical 'red line'; Obama seeks Congress vote on strikes",
      "[WIRE] Zimmerman acquitted in Trayvon Martin case; protests nationwide",
      "[MARKETS] 'Taper tantrum': yields spike as Fed hints at slowing QE"
    ],
    s: [
      "@OccupyKid: not guilty. two words that explain a lot of american history",
      "@EconProf: One hint of tapering and global markets convulse. That tells you what QE was doing."
    ]
  };
  T["24"] = {
    h: [
      "[WIRE] Federal government shuts down for 16 days in Obamacare standoff",
      "[TECH] HealthCare.gov launch collapses under errors and outages",
      "[WIRE] Obama nominates Janet Yellen as first woman to chair the Fed"
    ],
    s: [
      "@MainStreetCEO: Closed the government to stop a website that doesn't even work. Galaxy brains.",
      "@FedWatcher: Yellen at the Fed. The doves inherit the vault."
    ]
  };
  T["25"] = {
    h: [
      "[WIRE] Russia seizes Crimea; West imposes sanctions",
      "[DATA] CDC flags sharp rise in synthetic-opioid deaths as fentanyl spreads",
      "[WIRE] Polar vortex freezes half the country"
    ],
    s: [
      "@NursesUnion: We are seeing overdoses we cannot revive anymore. This is not the old heroin.",
      "@SenateGOP: A reset button was not a strategy. Europe just rediscovered geography."
    ]
  };
  T["26"] = {
    h: [
      "[WIRE] ISIS storms Mosul; Iraqi army collapses as caliphate declared",
      "[WIRE] VA scandal: veterans died on secret wait lists, secretary resigns",
      "[WIRE] Surge of unaccompanied children overwhelms border facilities"
    ],
    s: [
      "@VetForPeace: We rebuilt an army that dissolved in a weekend and a VA that hid its dying. Enough.",
      "@FarmerIA: Kids arriving alone at the border by the thousand. Somebody's failure, ours now."
    ]
  };
  T["27"] = {
    h: [
      "[WIRE] Michael Brown shot in Ferguson; weeks of protests and militarized police response",
      "[WIRE] ISIS broadcasts beheadings of US journalists; airstrikes begin",
      "[WEB] Ice Bucket Challenge raises $100M+ for ALS in a month"
    ],
    s: [
      "@OccupyKid: they brought mine-resistant trucks to a protest over a kid in the street. ferguson is everywhere",
      "@CollegeKid22: my grandma dumped ice on her head and donated. best internet week ever"
    ]
  };
  T["28"] = {
    h: [
      "[POLITICS] Republicans retake the Senate, completing midterm sweep",
      "[WIRE] Ebola panic peaks as US treats first domestic cases",
      "[MARKETS] OPEC holds output; oil price collapse begins"
    ],
    s: [
      "@TeaPartyPatriot: House AND Senate. The voters just fired the Senate majority.",
      "@EconProf: Cheaper oil is a tax cut for consumers and a pink slip for the shale patch."
    ]
  };
})(window.NEWS.turns);

// turns 29-40
(function (T) {
  T["29"] = {
    h: [
      "[MARKETS] Oil crashes below $50 a barrel",
      "[WIRE] Gunmen kill 12 at Charlie Hebdo offices in Paris",
      "[POLITICS] Clinton private email server story breaks"
    ],
    s: [
      "@FarmerIA: Diesel this cheap means the drillers three counties over are hurting. Boom and bust.",
      "@SenateDem: Private server. Because the last thing this party needs is an easy scandal."
    ]
  };
  T["30"] = {
    h: [
      "[WIRE] Baltimore erupts after Freddie Gray dies in police custody",
      "[POLITICS] Donald Trump descends escalator, announces run for president",
      "[WIRE] Nine worshippers killed at Charleston church; SCOTUS legalizes same-sex marriage"
    ],
    s: [
      "@PastorMike: They prayed with him for an hour before he opened fire. Lord have mercy on us.",
      "@EconProf: The escalator candidacy is a ratings stunt. That said, the anger he channels is real data."
    ]
  };
  T["31"] = {
    h: [
      "[MARKETS] China devalues yuan as its stock bubble bursts; global selloff follows",
      "[WIRE] VW admits cheating on diesel emissions tests for 11 million cars",
      "[WIRE] Pope Francis addresses Congress, a first"
    ],
    s: [
      "@WallStWhale: If Beijing sneezes, my portfolio gets pneumonia. New world.",
      "@MainStreetCEO: VW built a device to lie to regulators. And people ask why trust is low."
    ]
  };
  T["32"] = {
    h: [
      "[WIRE] ISIS-linked attackers kill 130 across Paris; San Bernardino shooting kills 14",
      "[DATA] Overdose deaths pass 52,000 a year, worst on record",
      "[MARKETS] Fed raises rates for the first time since 2006"
    ],
    s: [
      "@NursesUnion: 52,000 overdose deaths. That's a 737 crashing every day and a half. Where is the emergency?",
      "@FedWatcher: Liftoff. Nine years at zero. Historic, and oddly quiet."
    ]
  };
  T["33"] = {
    h: [
      "[POLITICS] Trump, Cruz win early GOP contests; Sanders takes New Hampshire",
      "[WIRE] WHO declares Zika a global emergency",
      "[WIRE] Obama visits Flint as lead-water crisis becomes national scandal"
    ],
    s: [
      "@CollegeKid22: my whole dorm is phone-banking for a 74-year-old socialist. what is happening",
      "@SoccerMomOH: They poisoned a city's water to save money and switched the signs. My kids drink tap water."
    ]
  };
  T["34"] = {
    h: [
      "[WIRE] 49 killed at Pulse nightclub in Orlando, deadliest US mass shooting to date",
      "[WIRE] Britain votes to leave the European Union; Cameron resigns"
    ],
    s: [
      "@UnionBoss: If Britain can vote itself off the continent, do not tell me it can't happen here.",
      "@EconProf: Brexit is the canary for the whole postwar consensus. Watch the rust belts."
    ]
  };
  T["35"] = {
    h: [
      "[POLITICS] Conventions nominate Clinton and Trump; DNC email leak rocks Democrats",
      "[WIRE] Rio Olympics open under Zika and recession clouds",
      "[WIRE] 400+ US economists warn against protectionism as trade dominates campaign"
    ],
    s: [
      "@OccupyKid: leaked emails, purged voter rolls, a coronation. and they wonder why we stay home",
      "@SenateGOP: This is not my party anymore. But the judges. Think of the judges."
    ]
  };
  T["36"] = {
    h: [
      "[POLITICS] Donald Trump elected 45th President in stunning upset",
      "[WIRE] Dakota Access Pipeline protests peak at Standing Rock",
      "[MARKETS] Fed hikes as markets rally on tax-cut hopes"
    ],
    s: [
      "@EconProf: Every model, mine included, got this wrong. That should humble us. It won't.",
      "@FarmerIA: They laughed at us for twenty years. They're not laughing this morning."
    ]
  };
  T["37"] = {
    h: [
      "[WIRE] Trump inaugurated; Women's Marches draw millions the next day",
      "[WIRE] Travel ban order sparks airport chaos and court battles"
    ],
    s: [
      "@NursesUnion: Marched with my whole ward. Bigger than the inauguration, and I checked.",
      "@VetForPeace: Interpreters who bled beside us stuck at airports. That's not who we are."
    ]
  };
  T["38"] = {
    h: [
      "[WIRE] Trump fires FBI Director Comey amid Russia probe",
      "[WIRE] US announces withdrawal from Paris climate accord",
      "[POLITICS] House passes Obamacare repeal; Senate battle looms"
    ],
    s: [
      "@TechFounder: Quitting Paris while my engineers build batteries. The future doesn't wait for DC.",
      "@SenateDem: They fired the man investigating them. In May. On TV. Just say it plainly."
    ]
  };
  T["39"] = {
    h: [
      "[WIRE] Charlottesville rally turns deadly; 'both sides' remark draws fire",
      "[WIRE] Harvey floods Houston; Irma and Maria devastate the Caribbean and Puerto Rico",
      "[POLITICS] McCain's thumbs-down kills Obamacare repeal at 1:30 a.m."
    ],
    s: [
      "@PastorMike: Nazis with tiki torches and a senator's thumb. What a month to be alive.",
      "@SoccerMomOH: My cousin in San Juan has no power, no water, and a paper-towel photo op."
    ]
  };
  T["40"] = {
    h: [
      "[WIRE] Trump signs $1.5T Tax Cuts and Jobs Act, cutting corporate rate to 21%",
      "[WEB] #MeToo goes viral; harassment reckoning topples powerful men",
      "[MARKETS] Bitcoin nears $20,000 as crypto mania peaks; Dow up 25% for the year"
    ],
    s: [
      "@MainStreetCEO: 21% corporate rate. I'll pretend to complain all the way to the bank.",
      "@UnionBoss: Trillions for shareholders, crumbs with an expiration date for workers. Noted for 2018."
    ]
  };
})(window.NEWS.turns);

// Post-2017 generic content for turns beyond the scripted era
window.NEWS.generic = {
  h: [
    "[WIRE] Federal deficit tops $2 trillion as interest costs climb",
    "[MARKETS] Fed weighs balance between inflation fight and job market",
    "[WIRE] Congress races deadline to avoid debt-ceiling breach",
    "[TECH] Lawmakers grill AI executives over jobs and misinformation",
    "[WIRE] Record-breaking storm season strains FEMA reserves",
    "[DATA] Home prices hit new highs as housing shortage deepens",
    "[WIRE] Antitrust suits against Big Tech advance in federal court",
    "[MARKETS] Chip subsidies spur factory construction boom",
    "[WIRE] Opioid settlement funds reach states amid fentanyl crisis",
    "[POLITICS] Polls show trust in institutions near historic lows",
    "[DATA] Remote work reshapes downtowns as office vacancies persist",
    "[WIRE] Grid operators warn of strain as demand surges"
  ],
  s: [
    "@EconProf: r is flirting with g again. Debt math is about to become everyone's problem.",
    "@MainStreetCEO: Can't find workers, can't find affordable houses for them. Same problem, two ends.",
    "@UnionBoss: Productivity up, wages flat, rent up. Tell me again how the economy is 'strong'.",
    "@TechFounder: Every country subsidizing chips now. Industrial policy is back, it just doesn't say so.",
    "@CollegeKid22: degree costs six figures, entry level wants five years experience. cool system",
    "@SoccerMomOH: Groceries up 30% and my feed says the economy is great. I know what my cart says.",
    "@FedWatcher: Soft landing or hard landing, the deficit is the story nobody wants to read.",
    "@VetForPeace: Twenty years of war, and the VA waitlist outlived the wars. Fund care, not parades."
  ]
};

// Reactions when the player changes a policy. Keys = policy ids from data.js.
window.NEWS.actReacts = {
  tax: [
    "@EconProf: Shifting toward consumption taxes lowers the saving penalty, but someone must offset the regressivity. Math, not vibes.",
    "@SoccerMomOH: a tax on everything I BUY instead of what the CEO earns?? read the room",
    "@MainStreetCEO: A VAT is hard to dodge and easy to collect. As a taxpayer, I hate it. As a businessman, I get it.",
    "@UnionBoss: Tax bread and diapers, rebate the rich. We have seen this movie."
  ],
  military: [
    "@VetForPeace: Move the money to cyber, healthcare and R&D? The wars of 2040 won't be fought with 1990s budgets. Do it.",
    "@SenateGOP: Gutting defense in a dangerous world is not a strategy, it is a press release.",
    "@EconProf: Same dollars, different sector. Brown's Costs of War work says education buys roughly triple the jobs of defense per million spent.",
    "@DefenseContractorCEO: Innovation follows the Pentagon's checkbook. Cut it and see what happens to your internet."
  ],
  drug: [
    "@NursesUnion: Treat addiction as health, not crime. Portugal did it in 2001 and overdoses fell while treatment rose.",
    "@PastorMike: Legalize poison and tax the misery? There are easier ways to balance a budget.",
    "@CollegeKid22: my roommate has a record for a joint while banks launder cartel cash. prioritize",
    "@EconProf: Decriminalization evidence from Portugal is real, but it is NOT evidence for a fully legal commercial market. Know the difference."
  ],
  church: [
    "@PastorMike: Tax the food pantry and the shelter while you're at it. Churches ARE the safety net in half this county.",
    "@EconProf: Estimates put religious tax subsidies near $71B a year (Cragun et al., 2012). Estimated subsidy is not the same as collectible revenue.",
    "@CollegeKid22: the megachurch pastor has two jets and pays zero. cool cool cool",
    "@SenateGOP: A government that can tax the church can control the pulpit. Hard pass."
  ],
  housing: [
    "@SoccerMomOH: my kids will never afford a house in the town they grew up in. SOMEBODY do something",
    "@EconProf: Finland's land-tax experiment raised housing starts ~12% (Lyytikainen, JUE 2009). Supply responds to incentives. Who knew.",
    "@MainStreetCEO: Ban rentals and you ban mobility. Students, contractors, new hires all rent. Think it through.",
    "@CollegeKid22: rent is 60% of my paycheck. ban landlords yesterday"
  ],
  immigration: [
    "@EconProf: CBO scored the 2013 reform bill at +3.3% GDP by 2023. Bill-specific, yes, but the direction is not controversial.",
    "@FarmerIA: Come legally, work hard, follow the rules. That's the deal. Nobody serious disagrees.",
    "@UnionBoss: Flood the labor market, watch wages stall. Solidarity has a payroll limit.",
    "@TechFounder: Half my engineering team has a visa story. Talent goes where it is welcome."
  ],
  welfare: [
    "@UnionBoss: Cash with no forms and no lectures. Dignity is the most efficient program ever designed.",
    "@EconProf: Widerquist's back-of-envelope math: a poverty-line basic income nets out near 2.95% of GDP after you count existing transfers.",
    "@SenateGOP: Paying people not to work is not compassion, it is a subsidy for decline.",
    "@SoccerMomOH: one flat check instead of nine agencies and a fax machine? yes. obviously yes"
  ],
  education: [
    "@CollegeKid22: four years of debt for a degree, or two years paid to learn a trade? not a hard question anymore",
    "@EconProf: Summer learning loss is real (Cooper et al. 1996, ~1 month), but year-round school shows only modest gains in the meta-analyses.",
    "@TeachersUnionRep: Year-round school without year-round pay is just burnout with a calendar.",
    "@TechFounder: I'll take a great apprentice over a mediocre diploma every single hiring cycle."
  ],
  tariffs: [
    "@UnionBoss: Finally, someone remembers who makes things in this country.",
    "@EconProf: Penn Wharton estimates a big universal tariff drags long-run GDP roughly 6% and wages 5%. Protection is a tax with a flag on it.",
    "@MainStreetCEO: My input costs just went up 25%. Guess whose prices follow.",
    "@FarmerIA: Tariff their soybeans, they tariff ours. Ask me how 2018 went. Oh wait, wrong timeline."
  ],
  healthcare: [
    "@NursesUnion: We watch people ration insulin every shift. Coverage is not a luxury debate here.",
    "@SenateGOP: Government healthcare means government waiting lines. Ask the VA.",
    "@EconProf: CBO has scored a public option as deficit-reducing via cheaper premiums; full single-payer estimates run ~$32T/10yrs gross (Mercatus 2018).",
    "@SoccerMomOH: I have 'good insurance' and a $6,000 deductible. Explain the good part."
  ],
  law: [
    "@OccupyKid: certainty of punishment deters, severity just cages. NIJ has said this for years. read it",
    "@SenateGOP: When predators walk free on technicalities, voters notice. Order first.",
    "@EconProf: NIJ's own review: the research cannot show the death penalty deters homicide. Certainty of apprehension beats severity.",
    "@PastorMike: Grace and order can coexist. Reformed prisons that return neighbors, not statistics."
  ],
  infra: [
    "@MainStreetCEO: Every dollar in roads and grids comes back with friends. Build it.",
    "@EconProf: ASCE graded US infrastructure a D in 2009 with a $2.2T five-year gap. Deferred maintenance is deferred debt.",
    "@TeaPartyPatriot: 'Infrastructure' always means my taxes funding someone's ribbon-cutting.",
    "@UnionBoss: Hard hats, good wages, actual bridges. Best jobs program ever invented."
  ],
  ubi: [
    "@CollegeKid22: $1000 a month = no choosing between textbooks and groceries. math",
    "@EconProf: Roosevelt Institute modeled UBI scenarios; results depend entirely on financing. Debt-funded stimulus is not a free lunch.",
    "@MainStreetCEO: A floor nobody can fall through? My town's shuttered shops would feel that every single month.",
    "@SenateGOP: A trillion-dollar check-writing scheme dressed as philosophy. Next."
  ],
  lvt: [
    "@EconProf: Tax land, not buildings: landowners can't move Manhattan to the Caymans. Finland saw housing starts jump ~12% (Lyytikainen 2009).",
    "@FarmerIA: My farm is land-rich and cash-poor. A land tax reads my net worth and my bank account as the same thing. They are not.",
    "@TechFounder: Un-sprawl the cities, tax the idle lots, watch the cranes appear. Georgism having a moment.",
    "@SenateGOP: An annual rent bill from the government on land you already own. Ownership, but with subscriptions."
  ],
  media: [
    "@LocalPaperEd: Our newsroom is two people and a copier. A local journalism fund is CPR for democracy.",
    "@EconProf: Nieman research: PBS viewers cite public funding as a reason they trust it. Independence can be designed, not just hoped for.",
    "@SenateGOP: State-funded news. What could possibly go wrong. Read any history book.",
    "@CollegeKid22: my town's paper closed and now the only news is a facebook group. fund the reporters"
  ],
  democracy: [
    "@OccupyKid: democracy dollars = my $100 counts the same as a lobbyist's lunch. finally",
    "@EconProf: Seattle's voucher program and Maine's ranked-choice adoption are live experiments. Early evidence: broader donor pools, fewer spoiler effects.",
    "@TeaPartyPatriot: Ranked-choice is a scheme to make sure nobody's first choice ever wins again.",
    "@SenateDem: Every Maine voter who ranked their ballot survived. Democracy did not collapse. Try it everywhere."
  ]
};

/* PoliSim-DBE v0.5 — realworld_events.js
   Real-world events + player public-statement reactions.
   Plain browser global, no modules (same pattern as NEWS / SCENARIOS).
   Effect sizes are DESIGNER CALIBRATION; event dates/facts are public record
   (see meta.sources). Consumed by engine.js collectRealworldEvents(). */
window.REALWORLD_EVENTS = {
  meta: {
    version: "0.5.0",
    conventions: [
      "Turn keys are engine turns (gfc2008: turn 1 = Q1 2008; realign2016: turn 1 = Q1 2017).",
      "groups keys must be VOTER_GROUPS ids: workers, capitalists, youth, seniors, religious, immigrants, technocrats.",
      "Bloc deltas enter via st.groupQueue {remaining:2,total:2} (half now, half next turn).",
      "sentiment/legitimacy values enter st.stmtFx {sent,legit,left:2} and decay after 2 turns.",
      "Every option needs an authored vague `preview` (direction + blocs, no numbers).",
      "noComment applies automatically if the player advances without responding."
    ],
    mechanics: {
      responseWindowTurns: 1,
      maxPopupsPerTurn: 2,
      groupSpreadTurns: 2,
      stmtFxTurns: 2,
      maxSingleOptionDelta: 5,
      maxEscalationPc: 3
    },
    sources: "Event dates and facts: public record (news archives, official records). " +
      "Bloc-effect magnitudes: designer calibration, tuned to ±1-4 vs the existing policy " +
      "groups scale (cf. MATH_AND_LOGIC.md attribution convention). actualReaction lines " +
      "reference published polling movement (Gallup quarterly approval approximations, " +
      "as used in scenario_2016.js polling arrays)."
  },
  scenarios: {
    realign2016: {
      turns: {
        "1": [{
          id: "travel-ban", kind: "statement", tier: "standard",
          quarterLabel: "Q1 2017", title: "Travel ban & Women's Marches",
          headline: "President signs order banning travel from seven majority-Muslim nations as millions join Women's Marches worldwide",
          context: "Chaos at airports, green-card holders detained, and the largest single-day protest in American history. The country is watching how you respond.",
          blocs: ["immigrants", "youth", "technocrats", "religious", "seniors"],
          actId: null,
          options: [
            { id: "condemn", label: "Condemn the ban and join the outcry", text: "\"This is not who we are. We do not slam the door on the persecuted and call it security.\"",
              pc: 0, groups: { immigrants: 3, youth: 2, technocrats: 1, religious: -2 }, preview: "Immigrant communities and young voters will rally to you; some religious voters hear an attack on their side." },
            { id: "defend-order", label: "Defend the order", text: "\"We cannot protect the homeland if we cannot control who enters it. The order stands.\"",
              pc: 0, groups: { religious: 2, seniors: 1, immigrants: -4, youth: -1 }, preview: "Law-and-order conservatives and older voters will stand up and cheer; immigrant families will remember this." },
            { id: "deflect", label: "Deflect — \"let the courts sort it out\"", text: "\"The courts will review the order, and I respect that process.\"",
              pc: 0, groups: { immigrants: -1 }, preview: "Nobody is satisfied. Immigrant communities notice the shrug most." }
          ],
          noComment: { groups: { immigrants: -2, youth: -1 }, sentiment: 0 },
          actualReaction: "ACTUAL track: the real president defended the order through three revisions; his base held, the opposition hardened, and the courts rewrote it twice.",
          sources: ["Jan 2017, public record", "Gallup weekly approval, Jan-Feb 2017"]
        }],
        "3": [{
          id: "charlottesville", kind: "statement", tier: "standard",
          quarterLabel: "Q3 2017", title: "Charlottesville",
          headline: "White-supremacist rally turns deadly in Virginia; the president's response draws national fire",
          context: "A torch-lit march, a car attack, one dead. The country waits to hear what its leaders actually think.",
          blocs: ["workers", "youth", "immigrants", "religious"],
          actId: null,
          options: [
            { id: "condemn", label: "Condemn the rally, full throat", text: "\"Nazis marching in an American city are not a sideshow. I condemn them without reservation.\"",
              pc: 0, groups: { workers: 1, youth: 2, immigrants: 2, religious: -1 }, preview: "Your base and young voters want moral clarity. Some religious voters will grumble." },
            { id: "equivocate", label: "\"Very fine people on both sides\"", text: "\"There's blame on many sides. Many sides.\"",
              pc: 0, groups: { religious: 1, workers: -2, youth: -2, immigrants: -2 }, preview: "The talk-radio right will cheer. Workers, youth and immigrants will not forget it." },
            { id: "deflect", label: "Deflect — \"I condemn all violence\"", text: "\"I condemn all violence, everywhere, and urge calm.\"",
              pc: 0, groups: { workers: -1, youth: -1 }, preview: "Nobody is inspired. Nobody is furious. The story moves on." }
          ],
          noComment: { groups: { workers: -2, youth: -3 }, sentiment: 0 },
          actualReaction: "ACTUAL track: the real president equivocated (\"very fine people on both sides\"); Gallup approval slid ~2 pts within two weeks.",
          sources: ["Aug 2017, public record", "Gallup weekly approval, Aug 2017"]
        }],
        "4": [{
          id: "tcja-signing", kind: "act_link", tier: "standard",
          quarterLabel: "Q4 2017", title: "TCJA signing",
          headline: "President signs the Tax Cuts and Jobs Act, cutting the corporate rate to 21% in the biggest tax overhaul since 1986",
          context: "Republicans deliver their first big legislative win; Democrats call it a heist for the donor class. Every camera in town wants your reaction.",
          blocs: ["capitalists", "seniors", "workers", "youth"],
          actId: "tcja",
          options: [
            { id: "cheer", label: "Cheer the tax cut", text: "\"We just put money back in the pockets of job creators, and the American worker will feel it first.\"",
              pc: 0, groups: { capitalists: 3, seniors: 1, workers: -1, youth: -1 }, preview: "Business owners and investors will toast you; workers and young voters suspect they are last in line." },
            { id: "attack-giveaway", label: "Attack it as a giveaway", text: "\"This bill was written in the boardroom, not the break room — working families get crumbs while corporations get the feast.\"",
              pc: 0, groups: { workers: 3, youth: 2, capitalists: -3, seniors: -1 }, preview: "Workers and young voters will love the fight; investors and executives will not forgive it." },
            { id: "deflect", label: "Deflect — \"judge me by wages\"", text: "\"Judge me by what happens to your paycheck, not by what the lobbyists say.\"",
              pc: 0, groups: { capitalists: -1, workers: -1 }, preview: "A shrug. Investors and workers both file it under wait-and-see." }
          ],
          noComment: { groups: { capitalists: -1, workers: -1 }, sentiment: 0 },
          actualReaction: "ACTUAL track: the real signing was a low-key December ceremony; TCJA never polled above roughly 40% even as the economy grew.",
          sources: ["Dec 2017, public record", "Pew/Gallup polling on TCJA, 2017-18"]
        }, {
          id: "metoo", kind: "statement", tier: "standard",
          quarterLabel: "Q4 2017", title: "#MeToo reckoning",
          headline: "#MeToo movement topples powerful men across Hollywood, media and Congress",
          context: "Allegations cascade from Weinstein to Capitol Hill; every politician in the country is being asked whose side they are on.",
          blocs: ["youth", "workers", "religious"],
          actId: null,
          options: [
            { id: "support-movement", label: "Support the movement", text: "\"Believe women. The era of powerful men silencing their accusers is over, and it is overdue.\"",
              pc: 0, groups: { youth: 2, workers: 1, religious: -1 }, preview: "Young voters and working women will hear you; traditionalists will mutter about witch hunts." },
            { id: "urge-due-process", label: "Urge due process", text: "\"Every accusation deserves a hearing — and every accused deserves one too. That is not evasion; that is justice.\"",
              pc: 0, groups: { religious: 1, youth: -2 }, preview: "Traditional voters nod along; young voters hear a dodge." },
            { id: "deflect", label: "Deflect — \"a conversation for every workplace\"", text: "\"This is a conversation every workplace in America needs to have.\"",
              pc: 0, groups: { youth: -1 }, preview: "Safe words, forgotten by morning. Young voters wanted more." }
          ],
          noComment: { groups: { youth: -2 }, sentiment: 0 },
          actualReaction: "ACTUAL track: the movement forced resignations from Franken to Lauer; politicians who dismissed it paid in the 2018 suburban-women midterm wave.",
          sources: ["Oct-Dec 2017, public record", "2018 midterm exit polling"]
        }],
        "5": [{
          id: "parkland", kind: "statement", tier: "standard",
          quarterLabel: "Q1 2018", title: "Parkland",
          headline: "Seventeen dead in Parkland school shooting; surviving students launch a national gun-control movement",
          context: "Teenagers from Marjory Stoneman Douglas are out-organizing the gun lobby on live television. The country is choosing sides again.",
          blocs: ["youth", "religious", "seniors"],
          actId: null,
          options: [
            { id: "back-students", label: "Back the students", text: "\"These kids have done more in a week than Congress has done in a decade. I stand with them.\"",
              pc: 0, groups: { youth: 3, religious: -2, seniors: -1 }, preview: "Young voters will remember who stood with them; gun-country voters will see a betrayal." },
            { id: "defend-2a", label: "Defend the Second Amendment", text: "\"We do not punish a hundred million lawful gun owners for one evil act. The answer is hardening schools, not softening rights.\"",
              pc: 0, groups: { religious: 2, seniors: 1, youth: -3 }, preview: "Gun voters and older conservatives will stand with you; young voters will not let this go." },
            { id: "deflect", label: "Deflect — \"thoughts and prayers\"", text: "\"Our thoughts and prayers are with the families of Parkland.\"",
              pc: 0, groups: { youth: -2 }, preview: "The kids on TV have a word for this, and it is not kind." }
          ],
          noComment: { groups: { youth: -2, religious: -1 }, sentiment: 0 },
          actualReaction: "ACTUAL track: March for Our Lives drew hundreds of thousands; Washington passed almost nothing, and youth turnout surged in November.",
          sources: ["Feb 2018, public record", "March for Our Lives estimates, Mar 2018"]
        }],
        "6": [{
          id: "family-separation", kind: "statement", tier: "standard",
          tierNote: "std+",
          quarterLabel: "Q2 2018",
          title: "Family separation",
          headline: "Thousands of migrant children separated from parents at the border under 'zero tolerance' policy",
          context: "Audio of crying children in detention is running on every network. Even friendly commentators are demanding an answer.",
          blocs: ["immigrants", "youth", "technocrats", "religious", "seniors"],
          actId: null,
          options: [
            { id: "condemn", label: "Condemn the separations", text: "\"Ripping children from their parents is not deterrence; it is cruelty wearing a policy's clothes. It ends now.\"",
              pc: 0, groups: { immigrants: 3, youth: 2, technocrats: 1, religious: -2 }, preview: "Immigrant families and young voters will exhale; border hawks will call you weak." },
            { id: "defend-deterrence", label: "Defend the policy as deterrence", text: "\"The law is the law, and a country without borders is not a country. Blame the smugglers, not the enforcement.\"",
              pc: 0, groups: { religious: 2, seniors: 1, immigrants: -4, youth: -2 }, preview: "Hard-liners and older voters will back you; immigrant communities will never forgive it." },
            { id: "deflect", label: "Deflect — \"Congress must act\"", text: "\"This is a mess Congress created, and only Congress can fix it.\"",
              pc: 0, groups: { immigrants: -2 }, preview: "Nobody believes you cannot pick up a pen. Immigrant families least of all." }
          ],
          noComment: { groups: { immigrants: -3, youth: -2 }, sentiment: 0 },
          actualReaction: "ACTUAL track: the real president signed an executive order ending the practice within days as approval sagged; the images endured for years.",
          sources: ["Jun 2018, public record", "Gallup weekly approval, Jun 2018"]
        }],
        "7": [{
          id: "kavanaugh", kind: "statement", tier: "standard",
          quarterLabel: "Q3 2018", title: "Kavanaugh hearings",
          headline: "Kavanaugh hearings erupt over assault allegation; nation transfixed by Ford testimony",
          context: "A Supreme Court seat, a credible accusation, and the most watched Senate hearing since Anita Hill. There is no safe ground here.",
          blocs: ["religious", "seniors", "youth", "workers", "technocrats"],
          actId: null,
          options: [
            { id: "back-nominee", label: "Back the nominee, full stop", text: "\"Judge Kavanaugh is a good man being destroyed by a smear machine. Confirm him now.\"",
              pc: 0, groups: { religious: 3, seniors: 1, youth: -2, workers: -1 }, preview: "Religious conservatives will march through walls for you; young voters and suburban women will not." },
            { id: "demand-investigation", label: "Demand a real investigation", text: "\"A lifetime appointment deserves more than a partisan ram-job. Investigate fully, then vote.\"",
              pc: 0, groups: { youth: 2, technocrats: 1, religious: -3 }, preview: "Young voters and institutionalists will credit the caution; the base will call it a cave." },
            { id: "deflect", label: "Deflect — \"the Senate owns this\"", text: "\"This is the Senate's constitutional duty, and I will let them do their job.\"",
              pc: 0, groups: { religious: -1, youth: -1 }, preview: "Both sides wanted a fighter. Neither got one." }
          ],
          noComment: { groups: { religious: -2, youth: -1 }, sentiment: 0 },
          actualReaction: "ACTUAL track: the fight juiced Republican midterm enthusiasm — the 'Kavanaugh effect' — while deepening the gender gap that cost the House.",
          sources: ["Sep-Oct 2018, public record", "2018 midterm exit polls"]
        }],
        "8": [{
          id: "gm-lordstown", kind: "statement", tier: "standard",
          quarterLabel: "Q4 2018", title: "GM Lordstown layoffs",
          headline: "GM to idle its Lordstown plant and cut up to 14,000 jobs in a sweeping restructuring",
          context: "The plant that anchored Ohio's Mahoning Valley for half a century goes dark. You campaigned on exactly these jobs.",
          blocs: ["workers", "capitalists", "technocrats"],
          actId: null,
          options: [
            { id: "side-with-workers", label: "Side with the workers — \"GM took the bailout\"", text: "\"America bailed out GM when it was dying. GM does not get to abandon Ohio now. I want those jobs back.\"",
              pc: 0, groups: { workers: 3, capitalists: -2 }, preview: "Factory towns will roar; the C-suite crowd will call it grandstanding." },
            { id: "market-realities", label: "Cite market realities", text: "\"Car buyers changed, and no politician can order a company to build what people will not buy.\"",
              pc: 0, groups: { capitalists: 2, technocrats: 1, workers: -2 }, preview: "Investors and policy wonks will nod; laid-off workers will hear a shrug in a suit." },
            { id: "deflect", label: "Deflect — \"watching the situation closely\"", text: "\"We are monitoring the situation and doing everything we can for these families.\"",
              pc: 0, groups: { workers: -1 }, preview: "Lordstown has heard 'monitoring' before." }
          ],
          noComment: { groups: { workers: -2 }, sentiment: 0 },
          actualReaction: "ACTUAL track: the real president attacked GM and threatened its subsidies; the plant still closed in 2019 and was later sold.",
          sources: ["Nov 2018, public record", "Lordstown closure coverage, 2018-19"]
        }],
        "12": [{
          id: "impeachment-1", kind: "statement", tier: "standard",
          quarterLabel: "Q4 2019", title: "First impeachment",
          headline: "House impeaches the president over the Ukraine call — the third impeachment in American history",
          context: "A phone call, a whistleblower, and a party-line vote. Half the country wants conviction, half wants the television turned off.",
          blocs: ["technocrats", "youth", "religious", "seniors", "workers"],
          actId: null,
          options: [
            { id: "support-impeachment", label: "Support the impeachment", text: "\"No one is above the law — not the president, not anyone. The House had no choice.\"",
              pc: 0, groups: { technocrats: 2, youth: 2, religious: -2, seniors: -1 }, preview: "Institutionalists and young voters will approve; the religious right will close ranks." },
            { id: "witch-hunt", label: "Call it a witch hunt", text: "\"This is a partisan hit job by people who never accepted the 2016 election. The voters will settle it.\"",
              pc: 0, groups: { religious: 2, seniors: 1, technocrats: -2, youth: -1 }, preview: "The base will love the fight; the wonks and the kids will see contempt for process." },
            { id: "deflect", label: "Deflect — \"back to the kitchen table\"", text: "\"While Washington plays its games, I am focused on your wages, your health care, your kitchen table.\"",
              pc: 0, groups: { workers: 1, technocrats: -1 }, preview: "Working voters appreciate the pivot; process-watchers call it ducking." }
          ],
          noComment: { groups: { technocrats: -1, religious: -1 }, sentiment: 0 },
          actualReaction: "ACTUAL track: approval barely moved through the whole saga — the country's mind was made up long before the vote.",
          sources: ["Dec 2019, public record", "Gallup approval through impeachment, 2019-20"]
        }],
        "13": [{
          id: "covid-cares", kind: "act_link", tier: "major",
          quarterLabel: "Q1 2020", title: "COVID-19 & the CARES Act",
          headline: "Pandemic shuts down the nation; Congress passes the $2 trillion CARES Act",
          context: "Refrigerated trucks outside hospitals, twenty million jobs at risk, and the largest rescue bill in American history. The country is frightened — and listening.",
          blocs: ["workers", "seniors", "youth", "capitalists", "religious", "technocrats"],
          actId: "cares",
          options: [
            { id: "address-nation", label: "Address the nation (3 PC)", text: "\"We will get through this together, as one country. Help is coming to every kitchen table, and I will level with you every step of the way.\"",
              pc: 3, groups: { workers: 3, seniors: 3, youth: 2 }, sentiment: 2, legitimacy: 1, preview: "A prime-time moment of unity. Workers, seniors and the young want steady hands — and it costs real political capital to command that stage." },
            { id: "downplay-reopen", label: "Downplay it — push to reopen", text: "\"The cure cannot be worse than the problem. We built the greatest economy in the world, and we will reopen it soon.\"",
              pc: 0, groups: { capitalists: 2, religious: 1, seniors: -3, technocrats: -2 }, sentiment: -1, preview: "Business owners and the reopen crowd will cheer; terrified seniors and the experts will not forget." },
            { id: "deflect", label: "Deflect — defer to the experts", text: "\"I will let the doctors and the governors handle the science. My job is keeping the checks flowing.\"",
              pc: 0, groups: { technocrats: 1, workers: -1 }, sentiment: -0.5, preview: "The experts appreciate the deference; workers wanted a leader, not a referee." }
          ],
          noComment: { groups: { workers: -2, seniors: -2, youth: -2 }, sentiment: -2 },
          actualReaction: "ACTUAL track: the real president's brief rally-round-the-flag bump faded by summer as deaths mounted; the CARES Act itself polled enormously well.",
          sources: ["Mar 2020, public record", "Gallup approval, Mar-Apr 2020"]
        }],
        "14": [{
          id: "george-floyd", kind: "act_link", tier: "major",
          quarterLabel: "Q2 2020", title: "George Floyd protests",
          headline: "George Floyd killed by Minneapolis police; protests erupt in hundreds of cities",
          context: "Nine minutes on video, and the largest protest movement in American history is in the streets. A curfew is not a position.",
          blocs: ["youth", "immigrants", "workers", "religious", "seniors"],
          actId: null,
          options: [
            { id: "march-with-protesters", label: "March with the protesters", text: "\"I hear you, and I am with you. Black lives matter, and the time for justice is not someday — it is now.\"",
              pc: 0, groups: { youth: 4, immigrants: 3, workers: 1, religious: -2, seniors: -2 }, preview: "Young voters and minority communities will surge to you; law-and-order voters will see surrender." },
            { id: "law-and-order", label: "Demand law and order", text: "\"Peaceful protest is American; burning cities is not. We will restore order and protect every neighborhood.\"",
              pc: 0, groups: { religious: 3, seniors: 2, youth: -4, immigrants: -3 }, preview: "The law-and-order base will rally hard; a generation of young voters will turn away." },
            { id: "deflect", label: "Deflect — name a task force", text: "\"I am naming a task force to study policing and report back with recommendations.\"",
              pc: 0, groups: { youth: -2, immigrants: -1 }, preview: "A commission is what you announce when you do not know what to say. The streets know it." }
          ],
          noComment: { groups: { youth: -3, immigrants: -2 }, sentiment: -1 },
          actualReaction: "ACTUAL track: the real president chose 'law and order,' including the Lafayette Square photo op; his approval slid and the phrase became a byword.",
          sources: ["May-Jun 2020, public record", "Gallup approval, Jun 2020"]
        }],
        "17": [{
          id: "jan6", kind: "act_link", tier: "major",
          quarterLabel: "Q1 2021", title: "Capitol attack",
          headline: "Mob storms the U.S. Capitol to stop the electoral count; five dead, democracy shaken",
          context: "The Capitol breached for the first time since 1814, on live television, while the world watched. History will record what you say today.",
          blocs: ["technocrats", "youth", "immigrants", "religious", "workers"],
          actId: null,
          options: [
            { id: "defend-certification", label: "Defend the certification", text: "\"The people's votes were counted, the courts ruled, and this mob will not overturn an American election. Democracy holds.\"",
              pc: 0, groups: { technocrats: 3, youth: 2, immigrants: 1, religious: -3 }, legitimacy: 1, preview: "Institutionalists and the young will stand taller; the election-denying base will call you a traitor." },
            { id: "stolen-election", label: "Echo the stolen-election claim", text: "\"I understand the anger. A lot of people believe this election was stolen, and their voices deserve to be heard.\"",
              pc: 0, groups: { religious: 3, workers: 1, technocrats: -4, youth: -2 }, sentiment: -1, legitimacy: -2, preview: "The base will follow you anywhere; the institutions of the republic — and everyone who runs them — will not." },
            { id: "deflect", label: "Deflect — \"peaceful transfer, move on\"", text: "\"We will have a peaceful transfer of power, and then we will move on to the people's business.\"",
              pc: 0, groups: { religious: -1, technocrats: -1 }, preview: "A procedural answer to a national wound. Everyone notices the missing word: concede." }
          ],
          noComment: { groups: { technocrats: -2, youth: -2 }, sentiment: 0, legitimacy: -1 },
          actualReaction: "ACTUAL track: the real president's approval hit its term low after the attack; a second impeachment followed within days.",
          sources: ["Jan 6 2021, public record", "Gallup final approval, Jan 2021"]
        }, {
          id: "arp-checks", kind: "act_link", tier: "standard",
          quarterLabel: "Q1 2021", title: "ARP $1,400 checks",
          headline: "American Rescue Plan signed: $1,400 checks, expanded child credit and state aid in a $1.9T package",
          context: "Direct deposits are hitting bank accounts within days. Somebody is going to take credit, and somebody is going to warn about the bill.",
          blocs: ["workers", "seniors", "capitalists", "technocrats"],
          actId: "arp",
          options: [
            { id: "celebrate-checks", label: "Celebrate the checks", text: "\"Fourteen hundred dollars in your pocket, help for your kids, shots in arms. That is what government for the people looks like.\"",
              pc: 0, groups: { workers: 3, seniors: 2, capitalists: -2 }, preview: "Working families and retirees will cash it and remember; fiscal hawks will reach for the smelling salts." },
            { id: "attack-debt", label: "Attack the debt", text: "\"Two trillion dollars of borrowed money to buy applause today and inflation tomorrow. Your grandkids get the invoice.\"",
              pc: 0, groups: { capitalists: 2, technocrats: 1, workers: -1 }, preview: "Investors and deficit hawks will applaud; voters holding the checks will not." },
            { id: "deflect", label: "Deflect — \"it is done, let's move on\"", text: "\"The bill is law, the checks are out, and my focus is on getting people back to work.\"",
              pc: 0, groups: { workers: -1 }, preview: "You left the credit on the table. Someone else will pick it up." }
          ],
          noComment: { groups: { workers: -1, seniors: -1 }, sentiment: 0 },
          actualReaction: "ACTUAL track: the checks were wildly popular — even many Republican voters credited a president whose party voted no; the inflation argument aged better.",
          sources: ["Mar 2021, public record", "Polling on ARP, spring 2021"]
        }],
        "19": [{
          id: "afghanistan", kind: "act_link", tier: "major",
          quarterLabel: "Q3 2021", title: "Afghanistan withdrawal",
          headline: "Kabul falls as the U.S. withdrawal turns chaotic; 13 service members killed in airport bombing",
          context: "Twenty years, and it ends with desperate crowds on a runway and a flag-lowering on live TV. The country is angry and grieving.",
          blocs: ["youth", "workers", "seniors", "technocrats", "religious"],
          actId: null,
          options: [
            { id: "defend-exit", label: "Defend the exit — end forever wars", text: "\"I will not ask another generation of Americans to fight a war that should have ended years ago. Leaving was right; leaving is hard.\"",
              pc: 0, groups: { youth: 2, workers: 1, seniors: -2, technocrats: -1 }, preview: "War-weary voters and the young will stand with the decision; veterans' families and the foreign-policy class wanted contrition." },
            { id: "condemn-execution", label: "Condemn the execution", text: "\"Ending the war was defensible. This shambolic retreat — our allies abandoned, our people in peril — is not.\"",
              pc: 0, groups: { seniors: 2, religious: 2, technocrats: 1, youth: -1 }, preview: "Veterans, seniors and the security establishment will nod; anti-war voters hear a dodge." },
            { id: "deflect", label: "Deflect — \"honor the troops\"", text: "\"Today we honor the thirteen Americans who gave everything at Abbey Gate. Full stop.\"",
              pc: 0, groups: { seniors: 1, technocrats: -1 }, preview: "Solemn and safe. The question about what went wrong does not go away." }
          ],
          noComment: { groups: { seniors: -2, religious: -1 }, sentiment: 0 },
          actualReaction: "ACTUAL track: the real president's approval broke below 50% in August 2021 and never recovered — the defining wound of the term.",
          sources: ["Aug 2021, public record", "Gallup approval, Aug-Sep 2021"]
        }],
        "21": [{
          id: "ukraine", kind: "act_link", tier: "major",
          quarterLabel: "Q1 2022", title: "Russia invades Ukraine",
          headline: "Russia launches full-scale invasion of Ukraine — the largest war in Europe since 1945",
          context: "Kyiv is under missile fire and a comedian-turned-president is refusing evacuation. The free world wants to know where you stand.",
          blocs: ["technocrats", "seniors", "immigrants", "workers", "religious"],
          actId: null,
          options: [
            { id: "stand-with-kyiv", label: "Stand with Kyiv", text: "\"Ukraine is fighting for every democracy on earth, and America does not abandon its friends. Slava Ukraini.\"",
              pc: 0, groups: { technocrats: 3, seniors: 2, immigrants: 1, workers: -1 }, preview: "The foreign-policy center and older Cold War voters will rally; anti-interventionists grumble about blank checks." },
            { id: "not-our-war", label: "\"Not our war\" — demand restraint", text: "\"We have a border to secure and families to feed at home. Not one more endless foreign war on the American credit card.\"",
              pc: 0, groups: { workers: 2, religious: 1, technocrats: -2, seniors: -1 }, preview: "War-weary working voters will nod; the establishment and old-guard hawks will hear appeasement." },
            { id: "deflect", label: "Deflect — \"monitoring the situation\"", text: "\"We are watching events closely and coordinating with our allies.\"",
              pc: 0, groups: { technocrats: -1 }, preview: "Kyiv is burning and you are 'monitoring.' The wonks notice." }
          ],
          noComment: { groups: { technocrats: -2, seniors: -1 }, sentiment: 0 },
          actualReaction: "ACTUAL track: the real president unified NATO and armed Kyiv; a modest approval bump faded as the war became a grind.",
          sources: ["Feb 2022, public record", "Gallup approval, Q1 2022"]
        }],
        "22": [{
          id: "dobbs", kind: "act_link", tier: "major",
          quarterLabel: "Q2 2022", title: "Dobbs decision",
          headline: "Supreme Court overturns Roe v. Wade, ending fifty years of federal abortion rights",
          context: "The leak was true. Clinics are closing in half the states tonight, and both movements are in the streets.",
          blocs: ["religious", "seniors", "youth", "workers", "technocrats"],
          actId: null,
          options: [
            { id: "defend-ruling", label: "Defend the ruling", text: "\"Five unelected judges held this country hostage for fifty years. Today the people get their voice back.\"",
              pc: 0, groups: { religious: 4, seniors: 1, youth: -3, workers: -1 }, preview: "The pro-life movement will name their children after you; young voters and suburban women will organize against you." },
            { id: "codify-roe", label: "Vow to codify Roe", text: "\"A woman's right to choose is fundamental, and if Congress will not protect it, I will fight until it does.\"",
              pc: 0, groups: { youth: 3, workers: 2, technocrats: 1, religious: -4, seniors: -1 }, preview: "Young voters and working women will flood your rallies; the religious right will make you its villain." },
            { id: "deflect", label: "Deflect — \"to the states\"", text: "\"The Court has returned this question to the states, where voters will decide.\"",
              pc: 0, groups: { religious: -1, youth: -1 }, preview: "Both movements hear a punt. One waited fifty years; the other lost fifty years." }
          ],
          noComment: { groups: { religious: -2, youth: -2 }, sentiment: 0 },
          actualReaction: "ACTUAL track: Dobbs powered the Democrats' midterm over-performance months later; every red-state referendum on abortion rights since has passed.",
          sources: ["Jun 2022, public record", "2022 midterm exit polls"]
        }],
        "23": [{
          id: "chips-ira", kind: "act_link", tier: "standard",
          quarterLabel: "Q3 2022", title: "CHIPS + IRA signed",
          headline: "CHIPS Act and Inflation Reduction Act signed in the same quarter — industrial policy returns",
          context: "Semiconductor fabs in Ohio, clean-energy credits, Medicare drug pricing. The biggest legislative quarter in years wants a narrator.",
          blocs: ["workers", "technocrats", "capitalists", "religious"],
          actId: null,
          actIds: ["chips", "ira"],
          options: [
            { id: "champion-industrial-policy", label: "Champion the industrial policy", text: "\"We are going to make things in America again — chips in Ohio, batteries in Michigan, and the jobs to prove it.\"",
              pc: 0, groups: { workers: 3, technocrats: 2, capitalists: -1 }, preview: "Factory towns and the tech-policy crowd will cheer; market purists will hiss 'subsidies.'" },
            { id: "attack-corporate-welfare", label: "Attack it as corporate welfare", text: "\"Hundreds of billions in handouts to chip giants and green lobbyists, paid for by you. This is cronyism with a press release.\"",
              pc: 0, groups: { capitalists: 2, religious: 1, technocrats: -1, workers: -1 }, preview: "Free-marketeers and small-government voters will approve; the wonks and the factory towns will not." },
            { id: "deflect", label: "Deflect — \"the market will decide\"", text: "\"Time will tell whether these investments pay off. I am focused on prices at the pump.\"",
              pc: 0, groups: { workers: -1 }, preview: "A yawn in a news cycle built for a victory lap." }
          ],
          noComment: { groups: { workers: -1, technocrats: -1 }, sentiment: 0 },
          actualReaction: "ACTUAL track: both bills passed with bipartisan Senate votes and fab construction boomed — but the politics of 'Bidenomics' never sold.",
          sources: ["Aug 2022, public record", "Senate roll calls, Jul-Aug 2022"]
        }],
        "25": [{
          id: "svb", kind: "statement", tier: "standard",
          quarterLabel: "Q1 2023", title: "SVB collapse",
          headline: "Silicon Valley Bank seized after a $42 billion bank run — the largest failure since 2008",
          context: "A weekend of panic, payrolls frozen, and regulators inventing a backstop by Sunday night. Everyone remembers who got bailed out last time.",
          blocs: ["workers", "technocrats", "capitalists"],
          actId: null,
          options: [
            { id: "backstop-depositors", label: "Backstop the depositors", text: "\"No depositor will lose a dollar, and no taxpayer will pay a cent — the banks' own insurance fund carries this. That is the promise.\"",
              pc: 0, groups: { workers: 2, technocrats: 1, capitalists: -1 }, preview: "Workers and the policy crowd will credit the steadiness; free-marketeers will cry moral hazard." },
            { id: "let-it-fail", label: "Let it fail", text: "\"No bailouts — not for banks, not for venture capitalists who forgot what risk means. Deposit insurance protects the little guy; the rest knew better.\"",
              pc: 0, groups: { capitalists: 1, workers: -1, technocrats: -2 }, preview: "Populists and purists will cheer the spine; the markets and the wonks will hold their breath." },
            { id: "deflect", label: "Deflect — \"the regulators are on it\"", text: "\"The regulators are handling it, and the banking system is sound.\"",
              pc: 0, groups: { technocrats: -1 }, preview: "The last man who said 'the system is sound' worked at Lehman. Technocrats wince." }
          ],
          noComment: { groups: { technocrats: -2, workers: -1 }, sentiment: 0 },
          actualReaction: "ACTUAL track: regulators invoked the systemic-risk exception and covered all depositors; the panic stopped by midweek.",
          sources: ["Mar 2023, public record", "FDIC/Fed/Treasury joint statement, Mar 12 2023"]
        }],
        "28": [{
          id: "campus-protests", kind: "statement", tier: "standard",
          quarterLabel: "Q4 2023", title: "Gaza campus protests",
          headline: "Gaza protest encampments spread across dozens of campuses; mass arrests follow",
          context: "Tents on the quads, canceled commencements, riot police on the evening news. A foreign war is now a domestic politics problem.",
          blocs: ["youth", "immigrants", "religious", "technocrats", "seniors"],
          actId: null,
          options: [
            { id: "protect-protest", label: "Protect the right to protest", text: "\"Students have always been America's conscience — from Vietnam to today. Dissent is not disorder, and I will not criminalize it.\"",
              pc: 0, groups: { youth: 3, immigrants: 2, religious: -1, technocrats: -1 }, preview: "The encampments and their generation will hear you; donors, alumni and order-first voters will not." },
            { id: "order-on-campus", label: "Demand order on campus", text: "\"Every student deserves to feel safe on campus, and no mob gets to shut down a university. Restore order — now.\"",
              pc: 0, groups: { religious: 2, seniors: 2, youth: -3, immigrants: -2 }, preview: "Parents, donors and older voters will applaud; the kids in the tents will never forget the sirens." },
            { id: "deflect", label: "Deflect — \"universities must lead\"", text: "\"This is for university presidents and local authorities to handle.\"",
              pc: 0, groups: { youth: -1 }, preview: "Everyone is looking at Washington, and Washington is looking at the floor." }
          ],
          noComment: { groups: { youth: -2, immigrants: -1 }, sentiment: 0 },
          actualReaction: "ACTUAL track: the real president split the difference — defended protest, condemned 'chaos' — and satisfied neither side in an election year.",
          sources: ["Apr-May 2024, public record", "Campus protest coverage, spring 2024"]
        }],
        "33": [{
          id: "tariffs-doge", kind: "act_link", tier: "major",
          quarterLabel: "Q1 2025", title: "Tariff wave + DOGE",
          headline: "'Liberation Day' tariffs hit nearly every trading partner as DOGE cuts ripple through the agencies",
          context: "The steepest tariffs in a century and a chainsaw to the federal workforce in the same quarter. Markets are diving; your coalition is waiting for its lines.",
          blocs: ["workers", "religious", "capitalists", "technocrats", "seniors"],
          actId: null,
          actIds: ["tariffs2025", "doge"],
          options: [
            { id: "cheer-tariffs", label: "Cheer the tariffs", text: "\"For fifty years they shipped your jobs overseas and called it free trade. No more. American workers come first — finally.\"",
              pc: 0, groups: { workers: 2, religious: 1, capitalists: -3, technocrats: -2 }, preview: "Factory towns and the populist base will roar; Wall Street and the economists will run for cover." },
            { id: "warn-on-prices", label: "Warn on prices", text: "\"Tariffs are a tax on American families, full stop. This will raise prices, empty retirement accounts, and invite retaliation.\"",
              pc: 0, groups: { capitalists: 2, technocrats: 2, seniors: 1, workers: -2 }, preview: "Investors, economists and retirees watching the market will agree; the protectionist base will call it betrayal." },
            { id: "deflect", label: "Deflect — \"short-term pain, long-term gain?\"", text: "\"There may be some short-term adjustment, but we will see where the negotiations take us.\"",
              pc: 0, groups: { workers: -1, capitalists: -1 }, preview: "You managed to worry the markets and bore the base in one sentence." }
          ],
          noComment: { groups: { workers: -2, technocrats: -1 }, sentiment: 0 },
          actualReaction: "ACTUAL track: the real rollout crashed markets for days — the worst two-day S&P drop since 2020 — before partial pauses; economic approval slid.",
          sources: ["Apr 2025, public record", "Market data and approval polls, Apr 2025"]
        }],
        "35": [{
          id: "obbba-event", kind: "act_link", tier: "standard",
          quarterLabel: "Q3 2025", title: "OBBBA signed",
          headline: "'One Big Beautiful Bill' signed: tax cuts extended, Medicaid and SNAP cut, deficit up $3.4T",
          context: "A July signing ceremony on the South Lawn. Your friends call it historic; the scorekeepers call it the largest upward revision to the debt in years.",
          blocs: ["capitalists", "seniors", "workers", "youth", "technocrats"],
          actId: "obbba",
          options: [
            { id: "celebrate", label: "Celebrate the bill", text: "\"The largest tax cut in American history is now law — no tax on tips, no tax on overtime, and a permanent win for working families.\"",
              pc: 0, groups: { capitalists: 3, seniors: 2, workers: -1, youth: -1 }, preview: "Investors and retirees will celebrate; the people whose coverage gets cut will hear it too." },
            { id: "attack-deficit-medicaid", label: "Attack the deficit and Medicaid cuts", text: "\"They cut health care for millions of Americans to finance tax breaks for billionaires, and charged the whole thing to your grandchildren.\"",
              pc: 0, groups: { workers: 3, youth: 2, technocrats: 1, capitalists: -2 }, preview: "Working families and young voters will amplify it; the donor class will take notes." },
            { id: "deflect", label: "Deflect — \"the economy will decide\"", text: "\"The bill is law. Now let us see the economy do its work.\"",
              pc: 0, groups: { capitalists: -1, workers: -1 }, preview: "A shrug on a signature law. Both sides wanted a fight." }
          ],
          noComment: { groups: { capitalists: -1, workers: -1 }, sentiment: 0 },
          actualReaction: "ACTUAL track: the real signing was a July 4 spectacle with flyovers; the bill polled underwater from day one, with the Medicaid cuts its most toxic line.",
          sources: ["Jul 2025, public record", "Public polling on OBBBA, summer 2025"]
        }]
      },
      marketEvents: {
        "5": [{
          id: "fb-cambridge", kind: "company", company: "Facebook", ticker: "FB",
          sector: "tech", quarterLabel: "Q1 2018",
          headline: "Cambridge Analytica harvested 87M Facebook profiles; Zuckerberg called to testify",
          socialPosts: [
            "@TechFounder: We built the machine and sold the keys. The hearings will be theater; the ad model is the story.",
            "@SoccerMomOH: deleted the app off my phone today. we'll see how long that lasts"
          ],
          marketNote: "FB −14% on the scandal; Nasdaq shrugs it off by summer",
          pricePath: null, statementRef: null, affectsPlayer: false
        }],
        "8": [{
          id: "gm-layoffs-2018", kind: "company", company: "General Motors", ticker: "GM",
          sector: "autos", quarterLabel: "Q4 2018",
          headline: "GM to close Lordstown and four other plants, cutting up to 14,000 jobs",
          socialPosts: [
            "@LordstownLocal: They took the bailout, took the tax break, and left us a parking lot. Merry Christmas from General Motors.",
            "@AutoAnalyst: Sedans are dead and GM is finally acting like it. Wall Street loves discipline — just ask the stock."
          ],
          marketNote: "GM shares jump on the restructuring even as Ohio fumes",
          pricePath: null, statementRef: "gm-lordstown", affectsPlayer: false
        }],
        "9": [{
          id: "boeing-max", kind: "company", company: "Boeing", ticker: "BA",
          sector: "aerospace", quarterLabel: "Q1 2019",
          headline: "Boeing 737 MAX grounded worldwide after a second fatal crash in five months",
          socialPosts: [
            "@FrequentFlyerAmy: boarding pass says 737 MAX 8. absolutely not. see you all on the later flight.",
            "@AvGeekNews: Two hull losses, one flight-control system, grounding orders from nearly every regulator on earth. This is Boeing's DC-10 moment."
          ],
          marketNote: "BA slides double digits from its peak; deliveries frozen",
          pricePath: null, statementRef: null, affectsPlayer: false
        }],
        "24": [{
          id: "ftx", kind: "company", company: "FTX", ticker: "FTT",
          sector: "crypto", quarterLabel: "Q4 2022",
          headline: "FTX collapses into bankruptcy; Sam Bankman-Fried's $32 billion crypto empire vaporized",
          socialPosts: [
            "@CryptoHodlr: withdrawals frozen since tuesday. my whole stack is on there. it's gone, isn't it",
            "@FedWatcher: Turns out 'effective altruism' was just effective. Billions in customer funds funneled into a hedge fund and Bahamas real estate."
          ],
          marketNote: "FTT token −90% in days; Bitcoin slides to a two-year low",
          pricePath: null, statementRef: null, affectsPlayer: false
        }],
        "25": [{
          id: "svb-collapse", kind: "company", company: "Silicon Valley Bank", ticker: "SIVB",
          sector: "regional-banks", quarterLabel: "Q1 2023",
          headline: "SVB seized by regulators after $42bn bank run; second-biggest bank failure in US history",
          socialPosts: [
            "@TechFounder: payroll is at SVB. PAYROLL. monday is in 48 hours.",
            "@FedWatcher: Held-to-maturity meets deposit flight. Duration risk just became a household term."
          ],
          marketNote: "Regional banks −8% on the week; deposit flight to the big four",
          pricePath: null, statementRef: "svb", affectsPlayer: false
        }],
        "29": [{
          id: "boeing-door-plug", kind: "company", company: "Boeing", ticker: "BA",
          sector: "aerospace", quarterLabel: "Q1 2024",
          headline: "Alaska Airlines 737 MAX-9 door plug blows out mid-flight; FAA grounds the fleet again",
          socialPosts: [
            "@FrequentFlyerAmy: a door. a DOOR fell off the plane. at 16,000 feet. i am never booking a MAX again.",
            "@AvGeekNews: Missing bolts, whistleblower warnings, another grounding. Boeing's quality problem is now a national story, not an aviation one."
          ],
          marketNote: "BA −9% on the week; FAA caps MAX production",
          pricePath: null, statementRef: null, affectsPlayer: false
        }],
        "34": [{
          id: "liberation-day-rout", kind: "company", company: "U.S. Broad Market", ticker: "SPX",
          sector: "broad-market", quarterLabel: "Q2 2025",
          headline: "Markets crater after 'Liberation Day' tariffs in the worst two-day drop since 2020",
          socialPosts: [
            "@WallStWhale: Lost more in two sessions than in all of 2022. The tariff math on the board behind the podium wasn't even math.",
            "@RetireeInFL: logged into the 401(k). logged right back out. somebody tell me this is a negotiating tactic."
          ],
          marketNote: "S&P −10% in two sessions",
          pricePath: null, statementRef: null, affectsPlayer: false
        }]
      }
    },
    gfc2008: {
      turns: {
        "3": [{
          id: "lehman-tarp", kind: "act_link", tier: "major",
          quarterLabel: "Q3 2008", title: "Lehman collapse & TARP",
          headline: "Lehman Brothers collapses; Treasury and the Fed propose a $700 billion rescue as markets crater",
          context: "The worst financial panic since 1929. The Dow just dropped 777 points, and Congress is being told the whole system dies without the bailout.",
          blocs: ["capitalists", "technocrats", "workers", "youth"],
          actId: null,
          options: [
            { id: "back-rescue", label: "Back the rescue — prevent collapse", text: "\"I hate this bailout as much as you do. But if the banking system dies, your job, your mortgage and your savings die with it. We act now.\"",
              pc: 0, groups: { capitalists: 3, technocrats: 2, workers: -2 }, sentiment: 1, preview: "Wall Street and the experts will breathe again; Main Street will smell a sellout." },
            { id: "no-bailouts", label: "\"No bailouts for Wall Street\"", text: "\"Not one dime of taxpayer money for the gamblers who did this. Let the market punish its own sins.\"",
              pc: 0, groups: { workers: 3, youth: 2, capitalists: -3 }, sentiment: -1, preview: "Main Street will stand and cheer; the markets will take the stairs down." },
            { id: "deflect", label: "Deflect — \"let Treasury work\"", text: "\"Secretary Paulson and Chairman Bernanke have my confidence to work the problem.\"",
              pc: 0, groups: { technocrats: -1, workers: -1 }, preview: "You outsourced your voice to the two men America is angriest at." }
          ],
          noComment: { groups: { workers: -2, capitalists: -1 }, sentiment: -1 },
          actualReaction: "History: the House actually voted TARP down on first pass and the Dow fell 777 points; it passed four days later, and 'bailout' became a curse word for a decade.",
          sources: ["Sep-Oct 2008, public record", "House roll call, Sep 29 2008"]
        }],
        "4": [{
          id: "obama-elected", kind: "statement", tier: "standard",
          quarterLabel: "Q4 2008", title: "Obama elected",
          headline: "Barack Obama elected 44th president — the first African American to win the White House",
          context: "A hundred thousand people in Grant Park, and the whole world watching. Whether you won or lost, history is asking for a sentence.",
          blocs: ["youth", "immigrants", "workers", "religious"],
          actId: null,
          options: [
            { id: "gracious-unity", label: "Gracious unity", text: "\"Tonight America proved again that anything is possible here. He is my opponent no longer — he is my president, and I wish him well.\"",
              pc: 0, groups: { youth: 2, immigrants: 2, workers: 1 }, legitimacy: 0.5, preview: "Young voters and minority communities will remember the grace; the country exhales." },
            { id: "partisan-attack", label: "Partisan attack", text: "\"The voters chose hope over experience, and they will learn the difference soon enough.\"",
              pc: 0, groups: { religious: 1, youth: -2, immigrants: -2 }, preview: "The die-hards will nod; a generation watching history happen will not." },
            { id: "deflect", label: "Deflect — \"the voters have spoken\"", text: "\"The voters have spoken, and the transition begins. That is the American way.\"",
              pc: 0, groups: { youth: -1 }, preview: "Correct, courteous, and forgotten by sunrise." }
          ],
          noComment: { groups: { youth: -1, immigrants: -1 }, sentiment: 0 },
          actualReaction: "History: McCain's concession was widely praised as a model of grace; Obama's approval opened above 70%.",
          sources: ["Nov 2008, public record", "Gallup, Nov 2008"]
        }],
        "6": [{
          id: "gm-bankruptcy", kind: "statement", tier: "standard",
          quarterLabel: "Q2 2009", title: "GM bankruptcy",
          headline: "General Motors files Chapter 11; the government takes a majority stake in the restructuring",
          context: "The company that once bragged 'what's good for GM is good for America' is bankrupt, with Washington as its new owner.",
          blocs: ["workers", "capitalists", "technocrats"],
          actId: null,
          options: [
            { id: "stand-with-autoworkers", label: "Stand with the autoworkers", text: "\"We are saving an industry, not a balance sheet. A million jobs hang on this, and I will not let the Midwest become a ghost town.\"",
              pc: 0, groups: { workers: 3, capitalists: -2 }, preview: "Union halls will cheer; the free-market crowd will call it socialism with a V8." },
            { id: "no-more-rescues", label: "\"No more rescues\"", text: "\"Bankruptcy law exists for a reason. The government is not a car company, and it should not try to be one.\"",
              pc: 0, groups: { capitalists: 2, technocrats: 1, workers: -3 }, preview: "Investors and economists will approve; Michigan will not forget." },
            { id: "deflect", label: "Deflect — \"the courts will handle it\"", text: "\"The bankruptcy court will supervise the restructuring, as the law provides.\"",
              pc: 0, groups: { workers: -1 }, preview: "Technically true. Emotionally absent." }
          ],
          noComment: { groups: { workers: -2 }, sentiment: 0 },
          actualReaction: "History: GM emerged from bankruptcy in 40 days; the auto rescue polled far better in hindsight than it did in 2009.",
          sources: ["Jun 1 2009, public record", "Polling on the auto bailout, 2009 vs 2012"]
        }],
        "7": [{
          id: "tea-party", kind: "statement", tier: "standard",
          quarterLabel: "Q3 2009", title: "Tea Party town halls",
          headline: "Town halls erupt over health care and spending as the 'Tea Party' movement goes national",
          context: "Congressmen are being shouted down in gymnasiums from coast to coast. Someone is angry, and someone organized them — the question is which you think matters.",
          blocs: ["religious", "seniors", "workers", "youth", "technocrats"],
          actId: null,
          options: [
            { id: "hear-the-anger", label: "Hear the anger", text: "\"These are not mobs. These are Americans who feel unheard, and I intend to hear them — even when it is uncomfortable.\"",
              pc: 0, groups: { religious: 2, seniors: 1, workers: 1, youth: -1 }, preview: "The town-hall crowd and older voters will feel respected; young voters will wonder what they are really hearing." },
            { id: "dismiss-astroturf", label: "Dismiss it as astroturf", text: "\"This is not grassroots — it is fertilizer. Lobbyists bought the buses, and the anger came pre-packaged.\"",
              pc: 0, groups: { youth: 1, technocrats: 1, religious: -2, seniors: -2 }, preview: "The wonks will enjoy the line; the movement you just insulted will print it on signs." },
            { id: "deflect", label: "Deflect — \"passions run high on both sides\"", text: "\"Passions run high in a democracy, on all sides, and that is healthy.\"",
              pc: 0, groups: { religious: -1, seniors: -1 }, preview: "True and toothless. The shouty summer continues without you." }
          ],
          noComment: { groups: { religious: -1, seniors: -1 }, sentiment: 0 },
          actualReaction: "History: the movement was mocked early and underestimated; fourteen months later it flipped the House in the biggest midterm wave since 1938.",
          sources: ["Aug 2009, public record", "2010 midterm results"]
        }],
        "8": [{
          id: "afghan-surge", kind: "statement", tier: "standard",
          quarterLabel: "Q4 2009", title: "Afghanistan surge",
          headline: "President orders 30,000 more troops to Afghanistan and sets a 2011 drawdown date",
          context: "West Point, December. A war-weary country is told the escalation is temporary; the antiwar left and the hawks both doubt it.",
          blocs: ["seniors", "religious", "youth", "immigrants"],
          actId: null,
          options: [
            { id: "support-surge", label: "Support the surge", text: "\"We will break the Taliban's momentum and then bring our troops home. This is a strategy to end a war, not extend one.\"",
              pc: 0, groups: { seniors: 2, religious: 2, youth: -2 }, preview: "Security-minded older voters will stand with the commander-in-chief; the antiwar young will feel betrayed." },
            { id: "oppose-escalation", label: "Oppose the escalation", text: "\"We cannot rebuild Afghanistan at gunpoint while our own country crumbles. Bring them home.\"",
              pc: 0, groups: { youth: 2, immigrants: 1, seniors: -1, religious: -1 }, preview: "War-weary young voters will rally; the flag-draped middle will question your nerve." },
            { id: "deflect", label: "Deflect — \"trust the commanders\"", text: "\"I trust the commanders on the ground and the timeline they have set.\"",
              pc: 0, groups: { seniors: -1 }, preview: "You deferred to men in uniforms. Voters wanted someone in charge." }
          ],
          noComment: { groups: { seniors: -1, religious: -1 }, sentiment: 0 },
          actualReaction: "History: the surge briefly stabilized the war and split the president's own coalition; the drawdown date reassured no one.",
          sources: ["Dec 1 2009, public record", "West Point address, Dec 2009"]
        }],
        "9": [{
          id: "citizens-united", kind: "statement", tier: "standard",
          quarterLabel: "Q1 2010", title: "Citizens United",
          headline: "Supreme Court's Citizens United ruling unleashes corporate and union campaign spending",
          context: "A 5-4 decision, and by tonight every lobbyist in Washington is reading it twice. Money in politics just got a new gear.",
          blocs: ["technocrats", "youth", "workers", "capitalists", "religious"],
          actId: null,
          options: [
            { id: "condemn-ruling", label: "Condemn the ruling", text: "\"Corporations are not people, and elections are not auctions. This ruling drowns the voice of the ordinary citizen.\"",
              pc: 0, groups: { technocrats: 2, youth: 2, workers: 1, capitalists: -2 }, preview: "Reformers, students and working voters will cheer; boardrooms will reach for their checkbooks." },
            { id: "defend-free-speech", label: "Defend it as free speech", text: "\"The First Amendment does not ask who is speaking. The answer to speech you dislike is more speech, not less.\"",
              pc: 0, groups: { capitalists: 2, religious: 1, technocrats: -2, youth: -1 }, preview: "Business and free-speech conservatives will approve; reformers hear a shrug at a floodgate." },
            { id: "deflect", label: "Deflect — \"Congress will study it\"", text: "\"Congress will review the ruling and consider the appropriate response.\"",
              pc: 0, groups: { technocrats: -1 }, preview: "'Study it' is Washington for 'bury it.' The reformers know." }
          ],
          noComment: { groups: { technocrats: -1, youth: -1 }, sentiment: 0 },
          actualReaction: "History: the real president condemned it with the justices in the front row at the State of the Union; super PACs were spending within months.",
          sources: ["Jan 21 2010, public record", "State of the Union, Jan 2010"]
        }],
        "10": [{
          id: "deepwater", kind: "statement", tier: "standard",
          quarterLabel: "Q2 2010", title: "Deepwater Horizon",
          headline: "BP's Deepwater Horizon rig explodes; millions of barrels of oil flood the Gulf",
          context: "Eleven dead, a mile-deep gusher on a live camera feed, and tar balls on four states' beaches. The country wants a boot on someone's neck.",
          blocs: ["workers", "youth", "capitalists", "religious"],
          actId: null,
          options: [
            { id: "hammer-bp", label: "Hammer BP", text: "\"BP will pay every dime of this cleanup, and we will keep our boot on their neck until the Gulf is whole again.\"",
              pc: 0, groups: { workers: 2, youth: 2, capitalists: -2 }, preview: "Gulf families and young environmental voters will cheer; the energy industry will call it a shakedown." },
            { id: "defend-drilling", label: "Defend domestic drilling", text: "\"One terrible accident cannot justify shutting down American energy. We fix what failed and keep drilling.\"",
              pc: 0, groups: { capitalists: 2, religious: 1, youth: -2, workers: -1 }, preview: "Oil-patch voters and industry will approve; a generation watching the spill cam will not." },
            { id: "deflect", label: "Deflect — \"the experts are on scene\"", text: "\"The best engineers in the world are working the problem, and the cleanup is the priority.\"",
              pc: 0, groups: { workers: -1 }, preview: "The Gulf is on day forty of 'working the problem.'" }
          ],
          noComment: { groups: { workers: -1, youth: -1 }, sentiment: 0 },
          actualReaction: "History: 'plug the damn hole' and the $20B escrow fund played well; the months of underwater footage did not.",
          sources: ["Apr-Jul 2010, public record", "BP escrow agreement, Jun 2010"]
        }],
        "11": [{
          id: "dodd-frank", kind: "act_link", tier: "standard",
          quarterLabel: "Q3 2010", title: "Dodd-Frank signed",
          headline: "Dodd-Frank financial overhaul signed into law — the biggest Wall Street reform since the 1930s",
          context: "2,300 pages, a new consumer bureau, and derivatives pushed onto exchanges. Wall Street spent a fortune fighting it and lost.",
          blocs: ["technocrats", "workers", "capitalists"],
          actId: null,
          options: [
            { id: "champion-overhaul", label: "Champion the overhaul", text: "\"Never again will a handful of banks hold the whole economy hostage. The casino now has rules, and taxpayers are off the hook.\"",
              pc: 0, groups: { technocrats: 2, workers: 1, capitalists: -2 }, preview: "Reformers and working voters will credit the spine; Wall Street will fund your opponent." },
            { id: "repeal-red-tape", label: "Promise to repeal the red tape", text: "\"Two thousand pages of new rules will crush community banks and small-business credit, and the too-big-to-fail giants will only get bigger.\"",
              pc: 0, groups: { capitalists: 3, technocrats: -2, workers: -1 }, preview: "Bankers and business owners will applaud; the wonks who wrote it will call it fantasy." },
            { id: "deflect", label: "Deflect — \"the proof will be in the markets\"", text: "\"Time and the markets will tell us whether this law works.\"",
              pc: 0, groups: { capitalists: -1 }, preview: "Neither side fights for a referee." }
          ],
          noComment: { groups: { capitalists: -1, technocrats: -1 }, sentiment: 0 },
          actualReaction: "History: the law passed almost entirely on party lines; 'repeal Dodd-Frank' became a GOP plank for the next decade.",
          sources: ["Jul 21 2010, public record", "Congressional roll calls, 2010"]
        }],
        "14": [{
          id: "bin-laden", kind: "statement", tier: "standard",
          quarterLabel: "Q2 2011", title: "Bin Laden raid",
          headline: "Osama bin Laden killed in a Navy SEAL raid in Abbottabad, Pakistan",
          context: "Ten years, two wars, one raid. Crowds gather outside the White House at 1 a.m. chanting USA.",
          blocs: ["workers", "capitalists", "youth", "seniors", "religious", "immigrants", "technocrats"],
          actId: null,
          options: [
            { id: "address-nation", label: "Address the nation (1 PC)", text: "\"Justice has been done. Tonight we are one country, and we remember who we buried.\"",
              pc: 1, groups: { workers: 1, capitalists: 1, youth: 1, seniors: 1, religious: 1, immigrants: 1, technocrats: 1 }, sentiment: 2, legitimacy: 1, preview: "A rally-round-the-flag moment. Everyone nods along. It will not last, so spend it well." },
            { id: "spike-football", label: "Spike the football", text: "\"I said I'd get him, and I got him. You're welcome, America.\"",
              pc: 0, groups: { religious: 1, seniors: 1, technocrats: -1, youth: -1 }, preview: "The base loves it. The wonks and the kids cringe." },
            { id: "deflect", label: "Deflect — \"credit the SEALs\"", text: "\"The credit belongs to the team in the helicopters, not to any politician.\"",
              pc: 0, groups: { seniors: 1 }, preview: "Safe and humble. A small nod from older voters." }
          ],
          noComment: { groups: { seniors: -1 }, sentiment: -1 },
          actualReaction: "History: the real president's approval bounced ~6 pts for about a month, then faded.",
          sources: ["May 2 2011, public record", "Gallup, May 2011"]
        }],
        "15": [{
          id: "occupy", kind: "statement", tier: "standard",
          quarterLabel: "Q3 2011", title: "Occupy Wall Street",
          headline: "Occupy Wall Street camps spread from Zuccotti Park to dozens of cities",
          context: "Tents, drum circles, and a chant — 'We are the 99 percent' — that is suddenly on every front page in America.",
          blocs: ["youth", "workers", "capitalists", "religious"],
          actId: null,
          options: [
            { id: "hear-the-99", label: "Hear the 99 percent", text: "\"I get it. People played by the rules, and the rules got changed on them. That frustration is as American as the First Amendment.\"",
              pc: 0, groups: { youth: 3, workers: 2, capitalists: -2 }, preview: "Young voters and struggling families will feel heard; Wall Street will hear a threat." },
            { id: "dismiss", label: "Dismiss them — \"go get a job\"", text: "\"If they spent half as much time looking for work as they do banging drums, they would have a paycheck by now.\"",
              pc: 0, groups: { capitalists: 2, religious: 1, youth: -3, workers: -2 }, preview: "The business crowd and law-and-order voters will laugh; a generation with no jobs will not." },
            { id: "deflect", label: "Deflect — \"everyone is frustrated\"", text: "\"People are frustrated on all sides, and I understand that.\"",
              pc: 0, groups: { youth: -1 }, preview: "The park hears a politician doing politics." }
          ],
          noComment: { groups: { youth: -2, workers: -1 }, sentiment: 0 },
          actualReaction: "History: the camps were cleared by winter, but 'the 1 percent' entered the language — and the next decade's politics.",
          sources: ["Sep-Nov 2011, public record", "Occupy movement coverage, fall 2011"]
        }],
        "17": [{
          id: "trayvon", kind: "statement", tier: "standard",
          quarterLabel: "Q1 2012", title: "Trayvon Martin",
          headline: "Shooting of Trayvon Martin sparks a national furor over race, self-defense law and profiling",
          context: "An unarmed teenager, a neighborhood watchman, and a million hoodie photos. The country is arguing about whether its promise applies to everyone.",
          blocs: ["youth", "immigrants", "religious", "seniors"],
          actId: null,
          options: [
            { id: "call-for-justice", label: "Call for justice", text: "\"If I had a son, he would look like Trayvon. His family deserves answers, and this country deserves a full accounting.\"",
              pc: 0, groups: { youth: 2, immigrants: 2, religious: -1 }, preview: "Young voters and minority communities will feel seen; some hear a politician putting a thumb on the scale." },
            { id: "wait-for-facts", label: "Wait for the facts", text: "\"A young man is dead, and that is a tragedy. But justice requires facts and process, not a verdict from a cable news panel.\"",
              pc: 0, groups: { religious: 1, seniors: 1, youth: -2, immigrants: -1 }, preview: "Older and law-and-order voters will approve the restraint; the hoodie photos will keep coming." },
            { id: "deflect", label: "Deflect — \"a matter for local authorities\"", text: "\"This is a matter for local law enforcement and the courts of Florida.\"",
              pc: 0, groups: { youth: -1 }, preview: "A local story stopped being local three weeks ago." }
          ],
          noComment: { groups: { youth: -2, immigrants: -1 }, sentiment: 0 },
          actualReaction: "History: 'If I had a son, he'd look like Trayvon' became the defining line of the case — praised as empathy, attacked as interference.",
          sources: ["Mar 2012, public record", "Presidential remarks, Mar 23 2012"]
        }],
        "20": [{
          id: "sandy-hook", kind: "statement", tier: "major",
          quarterLabel: "Q4 2012", title: "Sandy Hook",
          headline: "Twenty children and six adults murdered at Sandy Hook Elementary School",
          context: "First-graders. The nation is in mourning a week before Christmas, and the gun debate is about to reopen whether anyone wants it or not.",
          blocs: ["youth", "seniors", "religious"],
          actId: null,
          options: [
            { id: "vow-gun-action", label: "Vow action on guns", text: "\"These tragedies must end. And to end them, we must change — and I will use whatever power this office holds to protect our children.\"",
              pc: 0, groups: { youth: 2, seniors: 1, religious: -2 }, sentiment: 1, preview: "Grieving parents and young voters will stand with you; gun voters will read it as a confiscation speech." },
            { id: "defend-2a", label: "Defend the Second Amendment", text: "\"Evil visited that school, not a law-abiding gun owner. We protect our children without disarming their parents.\"",
              pc: 0, groups: { religious: 2, youth: -1, seniors: -1 }, preview: "Gun voters will stand firm; the grieving country wanted tears, not a brief." },
            { id: "deflect", label: "Deflect — \"grieve, not legislate\"", text: "\"Today is for grieving with those families, not for politics.\"",
              pc: 0, groups: { seniors: 1, youth: -1 }, preview: "Reverent and safe — though some will ask when, if not now." }
          ],
          noComment: { groups: { youth: -1 }, sentiment: -1 },
          actualReaction: "History: the real president wept on camera and pushed the hardest gun fight in decades; the Senate killed it anyway, and the country moved on.",
          sources: ["Dec 14 2012, public record", "Senate Manchin-Toomey vote, Apr 2013"]
        }],
        "22": [{
          id: "snowden", kind: "statement", tier: "standard",
          quarterLabel: "Q2 2013", title: "Snowden leaks",
          headline: "NSA contractor leaks reveal mass surveillance of Americans' phone and internet records",
          context: "A 29-year-old in a Hong Kong hotel room just showed the world the government's receipt for everyone's phone calls. Spy or whistleblower?",
          blocs: ["seniors", "religious", "technocrats", "youth"],
          actId: null,
          options: [
            { id: "defend-programs", label: "Defend the programs", text: "\"These programs are legal, overseen by all three branches, and they have saved lives. You cannot have 100 percent security and 100 percent privacy.\"",
              pc: 0, groups: { seniors: 1, religious: 1, technocrats: -2, youth: -2 }, preview: "Security-minded voters will nod; the tech world and the young will hear 'trust us' from the people who got caught." },
            { id: "rein-in-nsa", label: "Rein in the NSA", text: "\"A free people should not have to wonder whether their government is reading their mail. This surveillance state ends on my watch.\"",
              pc: 0, groups: { technocrats: 2, youth: 2, seniors: -1, religious: -1 }, preview: "Civil libertarians and the internet generation will cheer; the security establishment will call it reckless." },
            { id: "deflect", label: "Deflect — \"a debate worth having\"", text: "\"I welcome the debate between security and liberty.\"",
              pc: 0, groups: { technocrats: -1 }, preview: "You 'welcomed' a debate you spent years avoiding. Everyone noticed." }
          ],
          noComment: { groups: { technocrats: -1, youth: -1 }, sentiment: 0 },
          actualReaction: "History: the real president 'welcomed the debate' while defending the programs; Congress passed the USA Freedom Act two years later.",
          sources: ["Jun 2013, public record", "USA Freedom Act, 2015"]
        }],
        "24": [{
          id: "shutdown-2013", kind: "statement", tier: "standard",
          quarterLabel: "Q4 2013", title: "Government shutdown",
          headline: "Government shuts down for 16 days in a fight over health care funding",
          context: "Parks closed, paychecks frozen, the World War II memorial barricaded — and both parties pointing at each other.",
          blocs: ["technocrats", "workers", "seniors", "religious"],
          actId: null,
          options: [
            { id: "fund-government", label: "Fund the government, full stop", text: "\"You do not get to burn the house down because you lost the last vote on the furniture. Open the government, pay the bills, then argue.\"",
              pc: 0, groups: { technocrats: 2, workers: 1, seniors: 1, religious: -1 }, preview: "Federal workers, retirees and the get-things-done crowd will approve; the base that demanded the fight will call it surrender." },
            { id: "hold-the-line", label: "Hold the line", text: "\"We were sent here to stop a bad law, and we do not surrender because Washington finds a shutdown uncomfortable.\"",
              pc: 0, groups: { religious: 2, seniors: -2, technocrats: -1 }, preview: "The base will love the spine; seniors watching their checks and the markets will not." },
            { id: "deflect", label: "Deflect — \"both sides must talk\"", text: "\"Both sides need to sit down and work this out like adults.\"",
              pc: 0, groups: { technocrats: -1 }, preview: "A pox-on-both-houses classic. The houses disagree." }
          ],
          noComment: { groups: { seniors: -1, technocrats: -1 }, sentiment: 0 },
          actualReaction: "History: the shutdown's architects got the blame and none of the policy; GOP favorability hit record lows and the health law survived intact.",
          sources: ["Oct 2013, public record", "Gallup party favorability, Oct 2013"]
        }],
        "27": [{
          id: "ferguson", kind: "statement", tier: "standard",
          quarterLabel: "Q3 2014", title: "Ferguson",
          headline: "Ferguson erupts after the police shooting of Michael Brown; National Guard deployed",
          context: "Tear gas on an American street, armored vehicles in a suburb, and a hashtag — Black Lives Matter — that is about to become a movement.",
          blocs: ["youth", "immigrants", "workers", "religious", "seniors"],
          actId: null,
          options: [
            { id: "doj-review", label: "Order a Justice Department review", text: "\"Michael Brown's family deserves answers, and Ferguson deserves a police force that looks like and serves its community. Justice will follow the facts.\"",
              pc: 0, groups: { youth: 2, immigrants: 2, workers: 1, religious: -1 }, preview: "Young voters and minority communities will credit the action; police unions and their allies will not." },
            { id: "back-the-police", label: "Back the police", text: "\"Our police officers run toward danger every night. We will not sacrifice them to a mob or a hashtag.\"",
              pc: 0, groups: { religious: 2, seniors: 1, youth: -2, immigrants: -2 }, preview: "Law-and-order voters will stand tall; the streets of Ferguson will hear whose side you are on." },
            { id: "deflect", label: "Deflect — \"let the investigation proceed\"", text: "\"We should let the investigation run its course before anyone rushes to judgment.\"",
              pc: 0, groups: { youth: -1 }, preview: "Prudent, procedural, and utterly beside the point in Ferguson." }
          ],
          noComment: { groups: { youth: -2, immigrants: -1 }, sentiment: 0 },
          actualReaction: "History: the real president sent the Attorney General to Ferguson; the DOJ report validated the protesters' core complaints months later.",
          sources: ["Aug 2014, public record", "DOJ Ferguson report, Mar 2015"]
        }]
      },
      marketEvents: {
        "1": [{
          id: "bear-stearns", kind: "company", company: "Bear Stearns", ticker: "BSC",
          sector: "banks", quarterLabel: "Q1 2008",
          headline: "Bear Stearns sold to JPMorgan for $2 a share in a Fed-brokered fire sale",
          socialPosts: [
            "@WallStWhale: Two dollars a share. Bear was trading at $170 last year. Two. Dollars.",
            "@MainStreetCEO: my banker just told me our credit line is 'under review.' that means frozen."
          ],
          marketNote: "BSC −84% on the open; bank stocks reel as the Fed opens its window",
          pricePath: null, statementRef: null, affectsPlayer: false
        }],
        "3": [{
          id: "lehman-aig", kind: "company", company: "Lehman Brothers / AIG",
          ticker: "LEH", sector: "banks", quarterLabel: "Q3 2008",
          headline: "Lehman Brothers files for bankruptcy; AIG nationalized days later",
          socialPosts: [
            "@WallStWhale: Twenty-three years in this market. Never seen the ticker look like this.",
            "@UnionBoss: They found $700B for the banks in a weekend. Ask for a bridge loan for your house, see what happens."
          ],
          marketNote: "Dow −777 pts in a day; money markets freeze",
          pricePath: null, statementRef: "lehman-tarp", affectsPlayer: false
        }],
        "6": [{
          id: "gm-ch11", kind: "company", company: "General Motors", ticker: "GM",
          sector: "autos", quarterLabel: "Q2 2009",
          headline: "GM files for Chapter 11 bankruptcy; government to take a 60% stake",
          socialPosts: [
            "@UnionBoss: A hundred years of General Motors ends in a bankruptcy court on a Monday morning. God help this town.",
            "@FreeMarketFred: Bondholders got cents on the dollar and the union fund got equity. Remember this next time someone quotes you the 'rules.'"
          ],
          marketNote: "GM delisted from the Dow within days; old shares head toward zero",
          pricePath: null, statementRef: "gm-bankruptcy", affectsPlayer: false
        }],
        "10": [{
          id: "bp-spill", kind: "company", company: "BP", ticker: "BP",
          sector: "energy", quarterLabel: "Q2 2010",
          headline: "BP's Deepwater Horizon well gushes unchecked into the Gulf of Mexico",
          socialPosts: [
            "@GulfShrimper: third generation on these waters. the oil is in the marsh now and nobody from BP can tell me when it stops.",
            "@EnergyTrader: BP getting whacked again in London. Market cap down a third since the rig blew and the dividend is a coin flip."
          ],
          marketNote: "BP shares halve from the April peak; dividend suspended under political pressure",
          pricePath: null, statementRef: "deepwater", affectsPlayer: false
        }]
      }
    }
  }
};
if (typeof module !== 'undefined' && module.exports) module.exports = window.REALWORLD_EVENTS;

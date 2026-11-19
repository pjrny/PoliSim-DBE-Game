# PoliSim-DBE — Phased Build Plan

## Goal
Turn-based political/economic education simulation game:
- Gameplay modelled on Democracy 4 (policy sliders/options → voter groups & metrics, lagged effects, moddable data files)
- Country lifecycle modelled on Ray Dalio's Big Cycle (3 big cycles + 8 determinants + additional determinants, Rise → Top → Decline → New Order)
- Data: static real historical pulls (FRED via igo_open_data, World Bank, IMF, Yahoo Finance) as starting points per campaign year — NOT OpenBB
- Infra: GitHub repo (pjrny/PoliSim-DBE-Game) as version control; Cloudflare Workers + D1 + Pages for hosting/persistence
- Delivery: phase by phase, each phase playable/checkable

## Phase 0 — Foundations (this session)
- Confirm plan + scope choices with user
- Inspect repo state, Drive assets (DONE)
- Check Cloudflare auth + GitHub write access

## Phase 1 — v0.2 Playable MVP (static, single-player) ✅ DELIVERED 2026-09-19
Skill: vibecoding-webapp-swarm (scoped) or direct build; plain HTML/JS/CSS (Tailwind) so it runs on GitHub Pages AND Cloudflare Pages without a build step.
- Core game loop: 1 turn = 1 quarter; start year 2008 (financial crisis), 40 turns, elections at turns 16 & 32
- 12 Democracy-4-style policies: income tax, military, drug policy, church taxation, housing (incl. rental ban), immigration, welfare→UBI, education, tariffs, healthcare, law enforcement, infrastructure — each with PC cost, option effects, lagged ramps, voter-group approval shifts
- Metrics tracked: GDP, unemployment, debt/GDP, median income, homelessness, overdoses, incarceration, tax intake, sentiment, legitimacy
- Big Cycle engine: 8 determinants 0-100 + debt burden + internal conflict → S-score → phase (Rise / Top / Early Decline / Late Decline / Reset)
- 7 voter groups (Workers, Capitalists, Youth, Seniors, Religious, Immigrants, Technocrats), campaign windows with funds + diminishing returns
- Baseline: real 2004-2024 US data baked in as JS (FRED pulls 2026-09-19 + HUD/CDC/BJS series), Sim-vs-Actual comparison on dashboard + report
- Dashboard + Policies + Election + Report tabs, CSV/JSON export
- Shipped: local files at /mnt/agents/output/game/ (double-click index.html), pushed to GitHub main under game/ (all 9 files blob-SHA verified), repo README updated; node test.js all green
- DEFERRED per user decision: deployment ("local files first, deploy later")

## Phase 2 — v0.3 Gameplay Upgrade (USER FEEDBACK, THIS BUILD)
Source: poly-sci-sim-feedback-phase1.md + user message 2026-09-20 + new docs (Andrew Yang ACTS thread, Source Ledger, Poly Sci Sim V2, Big Cycle book).
Gate 0 (before building): audit current math/data against thread + whitepapers V0.1/V0.15 + Big Cycle book; verify history.json vs raw FRED/HUD/CDC/BJS pulls. Fix any Critical findings.
Features:
1. Policies → Acts: heavy, expensive, multi-quarter PC drain; each Act states does / does-not / budget cuts+adds / predicted effects / cited articles. Pre-load famous pre-2008 Acts (Social Security, Medicare/Medicaid, etc.). Add core multi-source policies + Yang thread Acts (Freedom Dividend, VAT, Democracy Dollars, etc.).
2. Budget pane: real US federal budget categories (2008 actuals) — raise/cut/delete categories, add researched new sectors; cheaper PC than Acts.
3. Education layer: hover any metric/budget line/formula → 2-3 slide explainer pop-up; persistent footer with citations, databases, series, math, GitHub link.
4. Determinants ↔ metrics network tab: nodes (metrics = dots, determinants = bars/dots), green/red edges, thickness+speed = strength, live update when hovering/selecting an Act or budget change; node size scales with spend.
5. Election tab = party operator: start holding House + Senate + governors + presidency; quarterly regional losses cut capital; spend funds to court voter blocs; goal = keep party power, NO end state (endless mode after turn 40).
6. News strip every turn: real historical news per quarter 2008+, exogenous events, player's own Act effects (incl. blunted historical negatives), optional social-reaction lane in distinct color.
Capital rule: Acts expensive+multi-quarter; budget moves cheaper; courting blocs = money → capital.
Upload-papers analysis pipeline: NOTED, deferred to Phase 4+.

## Phase 2.5 — v0.4 Two-Americas Build ✅ DELIVERED 2026-11-17
Source: user design message 2026-10-15 (carried through sessions): port old POLICY_CATEGORIES to Acts; budget sub-departments; researched Act-effect timelines 1935→2025; second crisis scenario starting 2016 ("the current republican party wins the presidency") with dual-track mechanics.
Features:
1. **Act categories (8)**: window.ACT_CATEGORIES groups the 16 POLICY_DEFS into tax / welfare / housing / education / health / defense / justice / democracy, color-coded cards in the Acts tab.
2. **Budget sub-departments**: every major budget line decomposes into researched FY2008 sub-departments (Defense→personnel/O&M/procurement/RDT&E; Justice→FBI/BOP/courts/grants; ...). Child sliders 0–200% of own baseline (1 PC per 10%, min 2); parent multiplier = baseline-weighted mean of surviving children (full-baseline denominator); child delete = 5 PC with fxShare-scaled backlash; restore = 5 PC.
3. **Act-effect research layer**: window.ACT_TIMELINES — the 8 heavy researched Acts (SSA 1935, UI 1935, GI Bill 1944, Interstate 1956, CRA 1964, Medicare/Medicaid 1965, SNAP 1964, Clean Air 1970) with budget arcs, measured metric effects, determinant contributions, strip-stakeholders and sources; rendered as evidence panels in the Acts tab. budgetCat field maps each Act to editable budget lines — the hook for strip-and-simulate.
4. **The Realignment (2016) dual-track scenario**: window.SCENARIOS + window.SCENARIO_2016. Q4 2016 start; new party with 5 House / 1 Senate / 3 governors / $300M. SIM track = full counterfactual (PC sized to shadow governing mandate, era-calibrated interest {base 2.3, knee 100, slope 0.04}); ACTUAL track = scripted quarter-by-quarter 2017→2025 (14 real Acts firing on real dates: TCJA t4, First Step t8, CARES t13, USMCA t15, CAA t16, ARP t17, IIJA t20, CHIPS+IRA t23, CAA23 t24, FRA t26, tariffs+DOGE t33, OBBBA t35) + 2026–30 projection, with 3-line polling (your party / Republican / Democrat actual). Influence mechanic: ACTUAL-track nudges (3–4 Influence, +5/turn cap 25, ~0.9975/qtr decay). Losing the SIM presidency does not end the game. Scripted 2017–2025 news feed per scenario.
5. **Repeal**: any player-enacted Act can be repealed (min 8 PC); effects ramp off along the reverse build-up curve; group deltas unwind linearly; upkeep stops; metric anchors released.
6. **UX**: scenario picker modal, grouped Acts rail, sub-dept accordion with ⟲ restore, hd-influ/hd-scenario header badges, glossary entries for all new mechanics, research evidence panels.
Validation: node test.js all green; node --check clean; scenario clock/election timing decoupled from hardcoded 2008 (clockYearOf/turnToYear/turnToQuarter + electConsts).

## Phase 2.6 — v0.5 Ecosystem Upgrade ✅ DELIVERED 2026-11-17 (v0.5.1 polish 2026-11-18)
Source: user priority message 2026-11-17 + uploaded specs (scoring-engine-spec.md, big-cycle-structure.md, report(1).pdf).
- P1: Act↔budget redundancy system (spec delivered: spec_act_budget_links.md) · real-world events + public-statement reaction popups (spec: spec_realworld_events.md) · multi-nation Big Cycle graph (world_powers_data.json) · Act/budget balance · repeal UX polish · more population/company reactions · educational definitions · UX/UI pass
- P2: drag-and-drop "create your own Act" — Kimi estimates political/economic/metric effects from uploaded sources
- P3: reverse-engineered Filteries compass → Network tab (8 axes STA/LFT/REG/OWN/HSP/AUT/TRD/NTV, label gates, Big-Cycle stage classifier; validated against scoring-engine-spec v1.1)
- P4: 2030 AGI/fusion crisis scenario (read-only from github.com/pjrny/DBE_V0 @dimensions-beyond-energy)
- P5: GLO-BUS layer — US stock ticker + company headlines in gameplay
Infra note: GDrive folder (G:\My Drive\APPS\Strategy Sim...) is user-local, not reachable from sandbox; user uploads files directly instead.

### v0.5 workstream log (2026-11-17)
- **WS1 Act↔Budget links — DONE.** ACT_BUDGET_LINKS (data.js), engine computeLinks/tickLinkSnap, UI badges + Consolidate buttons + impact chips (option-gated), glossary mech_links, tests (xv), browser smoke verified.
- **WS2 real-world events — DONE.** js/realworld_events.js (36 events: 21 realign + 15 gfc + 11 market beats), engine statement mechanics (1-turn window, no-comment expiry, 2-turn bloc spread, stmtFx decay, major-first ≤2/turn, ACTUAL-track isolation), event modal + badge + Report "Public Statements" section, tests (xvi), browser smoke verified.
- **WS3 world Big Cycle — DONE.** js/world_powers.js from world_powers_data.json (6 nations × 13 metrics × 2000–2024 + normalization), Chart.js line chart with SIM/ACTUAL overlays + standings + radar. KNOWN ISSUE awaiting user decision: sim det scale (~77) vs dataset S (USA 2008 = 58.8) — overlay floats ~19 pts high.
- **WS4 compass — DONE.** js/compass_data.js + js/compass.js (UMD): 8 axes w/ USA baseline, scenario offsets, HSP fiscal bridge, act/budget/sector deltas, C3 VAT×transfers interaction, 4 label classifiers, 18 Dalio markers, 4-stage classifier + sub-cycle gauges; UI suite in Network tab (bars, 2D plot w/ trail, stage chip, flow map); glossary mech_compass; tests (xvii) incl. documented calibration note (Social Democracy gate trips at 140% entitlements, spec said 125%); browser smoke verified (0 pageerrors).
- **WS6 P4 DBE 2030 scenario — DONE.** js/scenario_2030.js (EVENTS.dbe shock calendar + detShock channel, REALWORLD_EVENTS.scenarios.dbe2030 with 15 transition events + 5 market beats), SCENARIOS.dbe2030 registration (start chained to realign2016 projection end), engine detShock + keepPlayingOnLoss + start.approval override, tests (xviii), browser smoke verified (0 pageerrors). Repo read-only respected; repo's "stabilized money markets" deprioritized in favor of its own quantum-crypto destabilization material; 2038 vignette re-dated (breakeven 2030 → commercial viability 2038).
- **WS7 P5 GLO-BUS market panel — DONE.** js/market_data.js (real Yahoo Finance quarter-end closes via agent-gw: 14 tickers × 37 quarters for realign2016, 10 × 21 for gfc2008; SIVB documented as skipped-no-data, headline-only row), Market card + marquee ticker strip on Dashboard, glossary mech_market, tests (xix), browser smoke verified.
- **WS5 P2 custom-Act studio — DONE.** js/act_studio.js (6 Kimi-analyzed templates, honest keyword pre-fill heuristic, balance formula pc=clamp(6+3w,8,40)/upkeep/lag, buildDef validation, localStorage persistence + JSON export/import), engine registerCustomAct/unregisterCustomAct, 3-step wizard modal, custom cards with delete, glossary mech_studio, tests (xx), browser smoke verified (incl. reload-restore).
- **WS0 GitHub push — DONE.** v0.4: head f14a91f9, 13/13 SHA-verified. v0.5: head f63e51bd, 18/18 SHA-verified, no secrets (4 junk probe commits from an incident were cleaned via delete_file; tree verified clean). test.js stays at game/test.js (matches v0.4 layout + index.html reference).
- **Preview — v0.5 saved (website_version_manager version 0996a90).**
- **Open calibration decisions for user:** (1) world-chart scale mismatch (see WS3); (2) Social Democracy label gate at 140% vs spec 125% (see WS4).

### v0.5.1 user-feedback patch (2026-11-18) — calibration decisions + freeze fix
- **DECIDED (1) world-chart scale:** user chose **dual axes** over renormalize/rescale — dataset S on left axis, game sim/act on right axis, so the ~19 pt calibration gap is visible rather than hidden. Implemented in `makeWorldLine` (y1 scale, sim/ACTUAL → yAxisID y1).
- **DECIDED (2) Social Democracy gate:** user said "if it trips at 140 keep it at that" — gate stays at 140% entitlements (spec said 125%; documented in test xvii comment).
- **Consolidation (user request):** Big Cycle determinant gauges card **moved off the Dashboard into the top of the Network & Compass tab** — one "cycle home", no duplicate visualizations/calculations across tabs. Dashboard keeps economy charts + market card; world chart caption explains the two-scale design.
- **Freeze root cause + fix:** user reported the game "froze" near the world-chart section. Diagnosis: NOT performance (40-turn stress: avg 238 ms/turn, no slow turns) — it was event-modal click interception, in two layers: (a) the full-screen event modal auto-opened on every tab and swallowed all clicks (fixed: `maybeOpenEvent` now gated to the Dashboard tab; elsewhere the pending-event badge pulses and the player responds when ready); (b) deeper bug found during verification — the `#ev-pending-badge` inside `#btn-next` called `stopPropagation()` unconditionally, so on non-dashboard tabs the click never reached the advance handler and the gated modal never opened: turn never advanced = looks frozen. Fixed: badge only swallows the click on the Dashboard (where the modal will actually open); everywhere else the click bubbles to Next Quarter.
- **Verified:** `node test.js` 20/20 blocks green; freeze regression (modal never auto-opens on side tabs, dashboard auto-open intact); 40-turn stress clean; 0 pageerrors.
- **v0.5.2 load fix (2026-11-19) — "fails to load in this browser, others, and accelerated mobile website":** root cause = the two boot-time CDN dependencies (`cdn.tailwindcss.com` JIT runtime + Chart.js from jsdelivr). Any browser/mobile-accelerator that blocks or throttles CDNs = unstyled or dead page. Fix: Tailwind compiled to a static `css/tailwind.css` (content-scanned index.html + js/*.js; dynamic-class audit clean), Chart.js vendored to `js/vendor/chart.umd.min.js`, visible boot guard if a lib is missing. Verified: fully playable with **all** external requests blocked (boot 1.8 s vs 3.9–6 s), full test suite + freeze + 40-turn stress green.

## Phase 2.7 — v0.6 Profiles, Modes & Event Center ✅ DELIVERED 2026-11-19
User drivers: still failing to load across browsers/accelerated mobile (root cause: boot-time CDN deps) + requests for login, dual-track vs the party in power, legacy-act removal w/ devolution, act templates, and a no-hijack event UX.
- **WS-A load fix — DONE.** Tailwind → static `css/tailwind.css` (content-scanned, dynamic-class audit clean); Chart.js → `js/vendor/chart.umd.min.js`; visible boot guard. Verified playable with 100% external requests blocked; boot 1.8 s vs 3.9–6 s.
- **WS-B profiles/settings — DONE.** `js/profiles.js`: localStorage profiles, FNV-1a password gate (convenience, not security — public repo), seeded admin (password `XXX`, full settings on load), per-profile settings (complexity hides Budget sub-sliders/exports, default scenario ★, eventsFreq → engine popup cap, world chart off, reduce-motion), header profile bar, resume note. Engine hook: `PROFILES.eventCap()` in collectRealworldEvents.
- **WS-D Event Center — DONE.** `js/event_queue.js` + ui.js rework: full modal NEVER auto-opens; compact bottom-right queue (mobile chip), dashboard-only banner, badge as sibling button of Next Quarter (no stopPropagation anywhere); park/expire unchanged; Report text updated.
- **WS-F act templates — DONE.** All 16 built-in Acts offered as studio starting templates with Evidence blurbs; specials honestly flagged ("special mechanics not carried over"); balance formula re-prices.
- **WS-C dual-track Challenge — DONE.** `js/modes.js`: incumbent track = engine approval model replayed over ACTUAL metrics (gfc2008: history.json interpolation; realign2016: scripted ACTUAL 50/50 blended with scripted White-House polling; dbe2030 challenge disabled — projection only). OVERTAKE on approval cross; elections vs incumbent benchmark; win flips to govern ("you own the record"); loss keeps racing (legitimacy collapse only loss). Multiplayer card = locked "needs backend (Phase 3)".
- **WS-E legacy repeal + devolution — DONE.** `js/devolution.js`: 8 Acts-in-Force permanently repealable (PC-priced, 4-turn unwind, budget lines shrink by researched pct, earmarked revenue honestly ended — SS repeal ≈ deficit-neutral). Devolution: states/cities pick up `share` at `efficiency<1` → applied metric loss = delta × (1 − share×eff); disruption shock not mitigated. Blocks when a linked player Act is in force. Baseline no-repeal run bit-for-bit unchanged (hardcoded 12-turn expectation in test xxv).
- **Integration — DONE.** test.js 25/25 blocks; full offline smoke (all external requests blocked): boot 2.4 s, mode select, 8-turn no-auto-modal run with explicit queue response, govern UI clean, studio picker 16 templates, 0 pageerrors.
- **Deferred (user-approved scope):** 3D network view (later phase); drag-an-act-into-network visual preview (user said later); real PvP multiplayer (Phase 3 backend); full game-state save/resume (profiles store last scenario/turn note only).
- **Push — pending this session's final step (single push incl. v0.5.2 vendored files).**

## Phase 3 — Cloudflare backend (Workers + D1)  [was Phase 2]
- Read cloudflare:cloudflare-mcp-usage skill; create D1 database (games, turns, policies, metrics_history tables)
- Worker API: create game, submit turn, get state, leaderboards
- Keep frontend static on Cloudflare Pages, wired to Worker
- Save/resume games; multi-device

## Phase 4 — Real data pipeline  [was Phase 3]
- Scripts pulling FRED (igo_open_data), World Bank, IMF series → normalized quarterly JSON committed to repo
- Backtest mode: start 2008, compare simulated path vs actuals; calibration notes in MATH_AND_LOGIC.md

## Phase 5 — Multiplayer & elections  [was Phase 4]
- 4-5 parties × 4-5 players, turn submission flow, campaign phase (funds, ads, debates), coalition
- Scoring + end-game report

## Phase 6+ — Later
- Live feeds, Monte Carlo, Odoo integration, more countries, upload-paper analysis

## Working agreements
- Each phase ends with: deployed/previewable artifact + repo commit + short "are we on track" checkpoint with the user
- Keep everything moddable: policies/determinants/voter groups in JSON, math in one documented module

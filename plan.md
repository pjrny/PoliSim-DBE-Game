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

## Phase 2.6 — v0.5 Ecosystem Upgrade (IN PROGRESS)
Source: user priority message 2026-11-17 + uploaded specs (scoring-engine-spec.md, big-cycle-structure.md, report(1).pdf).
- P1: Act↔budget redundancy system (spec delivered: spec_act_budget_links.md) · real-world events + public-statement reaction popups (spec: spec_realworld_events.md) · multi-nation Big Cycle graph (world_powers_data.json) · Act/budget balance · repeal UX polish · more population/company reactions · educational definitions · UX/UI pass
- P2: drag-and-drop "create your own Act" — Kimi estimates political/economic/metric effects from uploaded sources
- P3: reverse-engineered Filteries compass → Network tab (8 axes STA/LFT/REG/OWN/HSP/AUT/TRD/NTV, label gates, Big-Cycle stage classifier; validated against scoring-engine-spec v1.1)
- P4: 2030 AGI/fusion crisis scenario (read-only from github.com/pjrny/DBE_V0 @dimensions-beyond-energy)
- P5: GLO-BUS layer — US stock ticker + company headlines in gameplay
Infra note: GDrive folder (G:\My Drive\APPS\Strategy Sim...) is user-local, not reachable from sandbox; user uploads files directly instead.

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

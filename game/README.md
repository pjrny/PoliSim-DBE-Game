# PoliSim-DBE — v0.6

**v0.6 adds:**
- **Fully self-contained boot** — Tailwind is compiled to a static stylesheet and Chart.js is vendored locally; the game loads with zero external requests (fixes "fails to load" in browsers and accelerated mobile modes that block CDNs).
- **Player profiles & settings** — a lightweight local login (header profile bar): create/switch profiles, per-player settings (UI complexity, default scenario, event frequency, world chart, reduced motion), and a seeded **admin** profile (password `XXX`) that unlocks every option with full settings on load. This is a convenience gate, not security — real accounts arrive with the multiplayer backend.
- **Game modes** — after picking a scenario, choose **Govern** (single-track, the classic game) or **Challenge** (dual-track): lead the opposition against the incumbent's *actual* record, with an approval race, OVERTAKE moments, and elections decided against the incumbent benchmark. **Multiplayer** shows as a locked card until the backend lands. (Challenge is disabled for the 2030 projection scenario — no actual record to race.)
- **Event Center** — real-world statement events no longer hijack the screen. New events slide into a compact bottom-right queue; a dashboard banner and a badge remind you; the full response modal opens only when you ask for it. The turn always advances, on every tab.
- **Legacy Act repeal + devolution** — the eight Acts-in-Force (Social Security 1935 → Clean Air 1970) can now be permanently repealed: federal budget lines shrink by the researched amount, metrics move over a 4-quarter unwind, and states/cities pick up a share of the function (mitigated, never free). One-way, PC-priced, with honest savings estimates before you confirm.
- **Act studio templates** — the studio's source step now offers all 16 built-in Acts as research-backed starting templates ("Start from an existing Act"), each carrying its Evidence blurb and honest notes about mechanics that don't carry over.

*v0.5.1 notes follow.*

# PoliSim-DBE — v0.5.1

**v0.5.1 adds (user-feedback patch):**
- **Freeze fix** — the event popup no longer hijacks the whole screen on side tabs. It auto-opens only on the Dashboard; on other tabs a pulsing badge inside Next Quarter reminds you, and the turn always advances (previously the badge swallowed the click and the game appeared frozen).
- **Dual-axis world chart** — the six-nation dataset runs on the left axis and your simulation/actual lines on the right axis, so the known calibration gap between the two scales is visible instead of being silently merged.
- **One cycle home** — the Big Cycle determinant gauges moved from the Dashboard into the Network & Compass tab, consolidating every cycle visualization in one place.
- **Fully self-contained (load fix)** — Tailwind and Chart.js are vendored locally (`css/tailwind.css`, `js/vendor/chart.umd.min.js`); the game no longer depends on any CDN at boot, which fixes "fails to load" in browsers and accelerated mobile modes that block CDN traffic. Verified playable with 100% of external requests blocked. Boot guard shows a visible warning if a library is ever missing.

*v0.5 notes follow.*

# PoliSim-DBE — v0.5

**v0.5 adds:**
- **Act ↔ Budget balance** — every Act is wired to the budget lines it absorbs or raises: redundancy badges (full/part/inverse), Consolidate buttons, one-click cut suggestions, and snapback cushions if you repeal an Act whose budget line you deleted (UBI enacted ⇒ Social Security/welfare cuts get cheap; universal healthcare ⇒ Medicare/Medicaid can be consolidated).
- **Real-world events** — 36 public-record events across both scenarios (21 for The Realignment, 15 for the GFC) surface as statement popups: respond within the turn or eat the no-comment penalty. Statements move voter blocs only — never the scripted actual timeline, never the economy. Plus 11 company/market headline beats in the news wire.
- **World Big Cycle** — the great powers 2000–2024: six nations scored on Dalio's 8 determinants from real data (composite S, 0–100), with your simulation overlaid live and the scripted ACTUAL line dashed underneath. Radar comparison included.
- **Political Compass & cycle stage** (Network tab) — 8 Filteries-style axes (statism, economic left, regulation, ownership, high-spending, authority, traditionalism, nativism) computed from your Acts, budget deviations and fiscal stance; 4 governance label classifiers; Dalio's 18 decline markers; the 4-stage Big-Cycle classifier with debt/internal/external sub-cycle gauges and a your-inputs→determinants→stage flow map.
- **Dimensions Beyond Energy (2030)** — a third scenario: a quantum-assisted fusion device crosses net-electric breakeven and your party holds the presidency. Manage the ten-year transition (inspired by the DBE_V0 research branch, read-only): stranded fossil assets, the Q-Day cryptography panic, the DBE monopoly fight, post-work abundance, longevity math, ecological rebound, digital rights — 15 authored transition events, scripted macro shocks, and a `detShock` engine channel for determinant hits. Losing an election is a heavy blow here, not the end — the transition outlives any one administration.
- **Create-your-own-Act studio** (Acts tab → 🛠️) — drop or paste source material (or pick one of six pre-analyzed templates), calibrate its effects on a live balance-formula readout, and register it as a real Act of Congress: PC cost, upkeep, lag, ramp, repeal, voter-group and determinant effects, saved in your browser and shareable as JSON.

---
*v0.4 notes follow.*
# v0.4

**v0.4 adds:** 8 Act categories · budget sub-departments (FY2008 researched splits, per-child sliders, delete/restore) · **The Realignment (2016)** dual-track scenario — America's real 2017–2025 timeline plays out under your counterfactual, with a tiny real caucus you nudge via **Influence** · researched **Acts-in-Force** evidence panels (8 Acts, 1935→2025) · **Act repeal** (effects unwind in reverse) · scenario picker + era-clocked charts, 3-line polling, scripted 2017–2025 news feed, glossary for all new mechanics.

---
*Phase 2 (v0.3) notes follow.*
# v0.3

A single-player, turn-based political-economic education simulation:
**Democracy 4-style governance × Ray Dalio's "Big Cycle" country lifecycle.**

You are the operator of a US political party taking office in **Q1 2008**, amid the Global
Financial Crisis. One turn = one quarter. **Endless mode**: the years roll on past 2017 —
the game ends only when your party **loses the White House** (weighted approval < 50% at a
presidential election: turns 20, 36, 52…) or when **legitimacy collapses** (≤ 15).
Midterms (turns 12, 28, 44…) move your seats — with the usual −5 penalty for holding the
presidency. Actual-history comparison lines run through 2024 (turn 68).

## How to run

Double-click `index.html` (works over `file://` — no server, no build step).
Tailwind CSS and Chart.js load from CDN; if offline, everything still works except charts.

Self-test (optional, needs Node):

```bash
node test.js
```

## How to play

1. **Dashboard** — the economy: simulated metrics vs *actual* US history (grey dashed),
   8 Big Cycle determinant gauges, composite power score and cycle phase. The game opens
   in **"The Top"** (S ≈ 68) — post-peak America, per Dalio's placement of the modern US.
2. **Acts** — 16 Acts of Congress (tax/VAT, military reallocation, drugs, churches, housing,
   immigration, welfare, education, tariffs, healthcare, law enforcement, infrastructure/R&D,
   plus the new **Freedom Dividend**, **Land Value Tax**, **Public Journalism Fund** and
   **Democracy Dollars + RCV**). Every Act is **heavy**: an upfront Political Capital cost
   plus **per-turn upkeep** — if upkeep goes unpaid, the Act **stalls** (amber) and its
   effects pause. Each Act card carries an **Evidence** section (what it does / doesn't do /
   budget adds & cuts / predicted results / cited articles). A read-only **National Fabric**
   panel shows the Acts already in force.
3. **Budget** — the FY2008 federal budget by category (defense, Social Security, Medicare…,
   ≈ 20.5% of GDP). Sliders run 0–200% of baseline (2 PC per 10% move); ✕ deletes a category
   (10 PC, big backlash); **Net Interest** is debt-driven and locked. **Add-sector** dropdown
   creates new line items (green energy, universal pre-K, mental health, broadband; 8 PC).
   Every line shows $bn and % of GDP, with totals for outlays, receipts and deficit.
4. **Network** — a deterministic causal graph: 8 determinants (inner ring) × 8 metrics
   (outer ring), ~23 signed edges. Node size scales with live values (the debt bubble can
   grow). **Hover an Act option or move a budget slider** to preview affected edges and
   predicted directions (▲/▼) before you commit.
5. **Party** — you are the party, not the president. Seats (House 255/435, Senate 59/100,
   Governors 28/50, White House) scale your **PC regen and cap** and drift toward your
   approval-implied share each quarter. **Bloc courting** (Ads, Debate, Grassroots,
   Endorsements) is available *every* turn with ×0.85ⁿ diminishing returns — and ×1.5
   during campaign windows (turns e−3…e before each presidential election).
6. **Report** — per-turn cause→effect log, full news/social log, determinants before/after,
   CSV/JSON export.

Every tab has a persistent **footer** with the data citations, and most numbers have a
**glossary tooltip** (click any underlined-ish stat) with a 3-slide explainer.

### Survival tips
- The 2008–09 crisis hits growth with scripted shocks for 5 turns. Infrastructure & R&D,
  Welfare and budget-line boosts are your demand-stimulus tools — the news strip will tell
  you when "your stimulus blunted the recession shock".
- Unemployment above ~8% will cost you the 2012 election. Do nothing and you lose.
- Military "cuts" are **spend-neutral reallocations** to R&D/health/cyber — they boost
  demand slightly but erode the military determinant. There is no free lunch.
- A rental-market ban shocks homelessness +6%/qtr for a year, then leaves a **sustained
  supply-collapse rent pressure** — Housing First beats it long-run.
- Drug legalization's overdose reduction is **capped** (−15% cumulative vs enactment, and
  only if treatment capacity exists via Healthcare ≥ public option; otherwise −7%).
- Tariff revenue **saturates** above ~10% (Laffer), while the growth/trade drag keeps scaling.

## File map

| File | Purpose |
|---|---|
| `index.html` | Single page, 6 tabs (Dashboard / Acts / Budget / Network / Party / Report) + news strip + footer + glossary modal |
| `css/style.css` | Warm low-saturation dashboard theme (slate/stone + teal/amber), network/budget/news/modal styles |
| `js/news.js` | `window.NEWS` — per-turn historical headlines & social posts, act reactions *(content pack)* |
| `js/glossary.js` | `window.GLOSSARY` — 3-slide explainers keyed by `data-tip` *(content pack)* |
| `js/acts_content.js` | `window.ACT_CONTENT` — Act summaries/options evidence, preloaded Acts, budget help *(content pack)* |
| `js/data.js` | `window.HISTORY` (real US data 2004–2024), `window.POLICY_DEFS` (16 Acts), `window.VOTER_GROUPS`, `window.BUDGET_CATS`, `window.NEW_SECTORS`, `window.NETWORK_DEF`, `window.EVENTS`, `window.SCENARIOS` (gfc2008 / realign2016 / **dbe2030**), `window.ACT_BUDGET_LINKS` — **all moddable config lives here** |
| `js/scenario_2016.js` | `window.SCENARIO_2016` — scripted ACTUAL track for The Realignment (generated) |
| `js/realworld_events.js` | `window.REALWORLD_EVENTS` — 36 statement events + 11 market beats (spec: `spec_realworld_events.md`) |
| `js/scenario_2030.js` | `window.EVENTS.dbe` shocks + `REALWORLD_EVENTS.scenarios.dbe2030` — the fusion-transition crisis content |
| `js/world_powers.js` | `window.WORLD_POWERS` — 6 nations × 13 metrics × 2000–2024 + normalization block |
| `js/compass_data.js` / `js/compass.js` | Filteries-style compass axes, baselines, deltas, label gates + cycle-stage classifier (UMD) |
| `js/engine.js` | Pure simulation (no DOM; UMD: `window.ENGINE` / Node `module.exports`): growth, Okun, full budget model with categories & Laffer tariffs, debt dynamics, capped homelessness/overdose trajectories, determinant drift (+ `detShock`), power score & cycle phase, party seats/midterms/presidential elections, PC upkeep & stalling, network model (`computeNetwork`), news assembly, act↔budget link engine, real-world event mechanics |
| `js/ui.js` | Rendering for all 6 tabs, Chart.js wiring, glossary modal, news ticker, network SVG + live preview, act-budget badges/consolidate, event popups, compass suite, world chart, CSV/JSON download |
| `test.js` | `node test.js` — fixed-script run + checks for all v0.3 mechanics (start phase, rent-ban fix, spend-neutral reallocation, election timing, overdose cap, budget deletion, endless mode, PC upkeep) |
| `data/history.json` | Source data (FRED, HUD AHAR, CDC/NCHS, BJS) — kept verbatim |
| `MATH_AND_LOGIC.md` | Every formula, its rationale, and source references |

## Roadmap

- **Phase 2 (done)**: Acts with upkeep/stalling, full budget pane, party-operator model with
  midterms & endless mode, causal network with live preview, news strip, education layer.
- Phase 3+: scripted events past 2008 (COVID-19 2020, debt-ceiling standoffs, geopolitical
  shocks), AI opponent parties, international dimension (other countries on their own cycles),
  save/load (localStorage), difficulty modes, scenario seeds (1980, 2000),
  calibration pass fitting elasticities to literature (see "Deferred scope" in MATH_AND_LOGIC.md).

## Learning path

1. **Play once doing nothing** — watch the crisis unfold and lose the 2012 election.
   Read the Report tab: every turn explains *why* each metric moved.
2. **Play as a crisis firefighter** — stimulus early, consolidation later. Compare your
   GDP/unemployment/debt lines against the grey actual-history lines.
3. **Experiment** — 25% tariffs (watch the Laffer saturation), a rental-market ban (watch
   the supply collapse linger), the Freedom Dividend (watch the −25% homelessness cap) —
   and read the determinant gauges: the Big Cycle score translates policy into long-run power.
4. **Read `MATH_AND_LOGIC.md`** — every equation is documented with its source
   (Okun's law, CBO baselines, r−g debt dynamics, Dalio's 8 determinants).
5. **Mod the game** — all acts, budget lines, voter groups and events are plain data in `js/data.js`.

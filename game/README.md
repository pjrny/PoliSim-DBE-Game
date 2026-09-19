# PoliSim-DBE — Phase 2 (v0.3)

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
| `js/data.js` | `window.HISTORY` (real US data 2004–2024), `window.POLICY_DEFS` (16 Acts), `window.VOTER_GROUPS`, `window.BUDGET_CATS`, `window.NEW_SECTORS`, `window.NETWORK_DEF`, `window.EVENTS` — **all moddable config lives here** |
| `js/engine.js` | Pure simulation (no DOM; UMD: `window.ENGINE` / Node `module.exports`): growth, Okun, full budget model with categories & Laffer tariffs, debt dynamics, capped homelessness/overdose trajectories, determinant drift, power score & cycle phase, party seats/midterms/presidential elections, PC upkeep & stalling, network model (`computeNetwork`), news assembly |
| `js/ui.js` | Rendering for all 6 tabs, Chart.js wiring, glossary modal, news ticker, network SVG + live preview, CSV/JSON download |
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

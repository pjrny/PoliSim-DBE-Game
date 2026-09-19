# PoliSim-DBE — Phase 1

A single-player, turn-based political-economic education simulation:
**Democracy 4-style governance × Ray Dalio's "Big Cycle" country lifecycle.**

You take office in **Q1 2008**, amid the Global Financial Crisis. One turn = one quarter.
Elections at **turn 16 (Q4 2011)** and **turn 32 (Q4 2015)**. The game ends at **turn 40
(Q4 2017)**, when you lose an election, or when legitimacy collapses (≤ 15).

## How to run

Double-click `index.html` (works over `file://` — no server, no build step).
Tailwind CSS and Chart.js load from CDN; if offline, everything still works except charts.

Self-test (optional, needs Node):

```bash
node test.js
```

## How to play

1. **Dashboard** — watch the economy: simulated metrics vs *actual* US history (grey dashed),
   8 Big Cycle determinant gauges, and your composite power score / cycle phase.
2. **Policies** — 12 levers (tax, military, drugs, churches, housing, immigration, welfare,
   education, tariffs, healthcare, law enforcement, infrastructure/R&D). Each change costs
   **Political Capital** (100 max, +8/turn; costs 5–25 by magnitude) and phases in over a
   **lag** of 1–4 turns.
3. **Election** — 7 voter groups (Workers, Capitalists, Youth, Seniors, Religious, Immigrants,
   Technocrats) with weighted approval; win threshold is 50%. Near elections (turns 13–16,
   29–32) you can spend campaign funds on Ads, Debates, Grassroots and Endorsements
   (diminishing returns: ×0.85ⁿ).
4. **Report** — per-turn cause→effect log, determinants before/after, and CSV/JSON export
   of the full run.

### Survival tips
- The 2008–09 crisis hits growth with scripted shocks for 5 turns. Infrastructure & R&D
  and Welfare expansions are your demand-stimulus tools.
- Unemployment above ~8% will cost you the 2011 election. Do nothing and you lose.
- Debt above 90% of GDP drags growth; above 110–120% it erodes the financial-center and
  reserve-currency determinants (the Dalio decline dynamic).
- Tariffs raise a little revenue and please Workers, but drag growth, trade and
  competitiveness every turn they are in place.

## File map

| File | Purpose |
|---|---|
| `index.html` | Single page, 4 tabs (Dashboard / Policies / Election / Report) |
| `css/style.css` | Warm low-saturation dashboard theme (slate/stone + teal/amber) |
| `js/data.js` | `window.HISTORY` (real US data 2004–2024, copied from `data/history.json`), `window.POLICY_DEFS`, `window.VOTER_GROUPS`, `window.EVENTS` — **all moddable config lives here** |
| `js/engine.js` | Pure simulation (no DOM): growth, Okun, budget, debt dynamics, homelessness/overdose/incarceration trajectories, determinant drift, power score & cycle phase, elections. Exports for browser and Node. |
| `js/ui.js` | Rendering, tab navigation, Chart.js wiring, event handlers, CSV/JSON download |
| `test.js` | `node test.js` — plays a fixed 40-turn script, asserts finite & plausible metrics, both elections won |
| `data/history.json` | Source data (FRED, HUD AHAR, CDC/NCHS, BJS) — kept verbatim |
| `MATH_AND_LOGIC.md` | Every formula, its rationale, and source references |

## Roadmap (Phase 2+)

- More scripted events (COVID-19 2020, debt-ceiling standoffs, geopolitical shocks)
- AI opponent parties with policy platforms; coalition/parliament mode
- International dimension: other countries on their own cycles, reserve-currency competition
- Save/load (localStorage), difficulty modes, scenario seeds (e.g. start 1980, start 2000)
- Calibration pass: fit elasticities to literature (CBO multipliers, Okun coefficients by decade)

## Learning path

1. **Play once doing nothing** — watch the crisis unfold and lose the 2011 election.
   Read the Report tab: every turn explains *why* each metric moved.
2. **Play as a crisis firefighter** — stimulus early, consolidation later. Compare your
   GDP/unemployment/debt lines against the grey actual-history lines.
3. **Experiment** — run 25% tariffs, or a rental-market ban, or UBI, and read the
   determinant gauges: the Big Cycle score translates policy into long-run national power.
4. **Read `MATH_AND_LOGIC.md`** — every equation is documented with its source
   (Okun's law, CBO baselines, r−g debt dynamics, Dalio's 8 determinants).
5. **Mod the game** — all policies, voter groups, and events are plain data in `js/data.js`.

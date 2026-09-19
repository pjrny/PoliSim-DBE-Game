# PoliSim-DBE — Math & Logic Reference (v0.3)

Every formula in `js/engine.js`, with rationale and source pointers. This is an
**educational, stylized** model: elasticities are chosen to be directionally correct
and pedagogically legible, not econometrically estimated.

Conventions: 1 turn = 1 quarter. Growth/inflation/interest rates are **annualized %**;
per-quarter application divides by 4 (or 400 for compound terms). `clamp(x,lo,hi)` bounds x.

> **Attribution note (v0.3 audit).** Ray Dalio's *Principles for Dealing with the Changing
> World Order* (2021) supplies the **8 determinants** and the qualitative **three-stage
> rise/top/decline archetype**. It does **not** contain numeric thresholds. The following
> are **DESIGNER CALIBRATION** choices, not Dalio citations: the composite formula
> `S = mean(dets) − 0.25·debt_burden − 0.25·internal_conflict` (both 0.25 discounts),
> `debt_burden = clamp(debt_gdp − 60, 0, 100)`, the **five** phase labels and their
> thresholds 70/58/46/36, the voter-group list and weights, the ≥50% election win rule,
> and the legitimacy-collapse threshold ≤ 15. They are tuned so a 2008 start lands in
> "The Top" (see §5) and play feels like Dalio's narrative; they are not in the book.

---

## 1. Growth block

**Potential growth**
```
g* = 2.0 + 0.03·(innovation−60) + 0.02·(education−60) + 0.02·(competitiveness−60)   [pp/yr]
```
Long-run supply-side growth anchored at the ~2% US post-war productivity trend (CBO
potential-GDP assumptions). Determinants above/below 60 shift potential — this is the
core Dalio mechanism: *investing in education and innovation raises the speed limit.*

**Actual growth**
```
growth = g* + demand_stimulus − 0.08·tariff% − max(0, debt_gdp−90)·0.012 + gapBoost + shock
gapBoost = clamp(0.25·(unemployment − 5.5), 0, 2.5)
```
- `demand_stimulus` = Σ act demand effects (Infrastructure & R&D: +0.25 pp per 1% of GDP;
  Welfare: +0.4–0.8 pp; military increase +0.2 pp; **military reallocation +0.15/+0.3 pp**;
  Freedom Dividend +1.2 pp) + Σ budget-category demand effects (§3). Magnitudes follow
  CBO/CRS fiscal-multiplier ranges for slack economies (~0.5–1.5) compressed into a single
  demand term.
- **Tariff drag** −0.08 pp per tariff point: order-of-magnitude consistent with
  Penn Wharton Budget Model / IMF estimates of tariff GDP costs.
- **Debt drag** above 90% debt/GDP: threshold-and-erosion pattern after
  Reinhart–Rogoff (2010, directionally; we use the weaker post-critique magnitude,
  cf. Herndon–Ash–Pollin 2013) and CBO long-term outlook crowding-out.
- **gapBoost** (output-gap closure): slack labor markets support above-trend catch-up
  growth. **v0.3 fix (A8): coefficient 0.4 → 0.25** — with 0.4 the simulated 2009–2017
  baseline recovery ran ~4.5%/yr against the actual ~2.5%/yr; 0.25 reproduces the
  realized pace while still closing the Okun gap.
- **shock**: scripted GFC growth shocks, turns 1–5: −2.5, −6.5, −4.0, −1.5, 0 pp
  (calibrated to the actual real-GDP path Q1 2008 – Q1 2009).

**Inflation** (acceleration-lite Phillips logic)
```
target = 2 + 0.25·(growth − g*) + 0.04·tariff%  (−1.2 during GFC)
inflation += 0.25·(target − inflation);  clamp −2…12
```
The starting value 2.4 is **core CPI** (%) at end-2007 — headline CPI spiked higher in
2008 on oil; core is the steadier policy-relevant measure.

**GDP accounting**
```
gdp_level   *= 1 + growth/400            (real, $bn chained-2017)
priceIndex  *= 1 + inflation/400         (start = nominal/real ratio of 2007 ≈ 0.870)
gdp_nominal  = gdp_level · priceIndex
```

## 2. Labor market — Okun's law

```
Δunemployment = −0.4·(growth − g*)/4  per quarter   + GFC scarring shock
```
Okun's classic coefficient is ≈ −0.5; we use −0.4 for the post-1990 weakening
(Ball, Leigh & Loungani, IMF 2013). The GFC adds direct quarterly unemployment shocks
(+0.2…+0.9 pp, turns 1–8) for labor-market scarring/hysteresis that pure Okun misses.
Median income: `growth_qtr = (growth − 0.5)/4 + workersBonus/4`, where workersBonus
comes from Welfare/Education/Freedom-Dividend transfers — the "shared prosperity" channel.

## 3. Budget model (v0.3) & debt dynamics

**Category budget.** The federal budget is now explicit: 15 categories with FY2008
approximate baselines ($bn, NIPA-ish): defense 616, Social Security 615, Medicare 390,
Medicaid 201, income security 261, other health 265, veterans 47, education 57,
transport 64, environment 30, international 29, science 25, justice 48, **net interest 253
(auto)**, other/adjustments 90 — total ≈ **$2,991bn ≈ 20.5% of 2008 nominal GDP**
($14,608bn; actuals in `data/history.json` are FRED FGRECPT/FGEXPND **Q4 SAAR, NIPA basis**).

Each category carries a multiplier (slider 0–200%, 10% steps; deletion = 0% with a
one-time 10 PC backlash; a move costs 2 PC per 10%):
```
outlay_share = Σ_categories share_i·mult_i + Σ_sectors gdpPct·mult + act outlays + crisis stabilizers
share_i      = base_bn,i / 14608.209 · 100        (category baseline as % of GDP)
```
Category deviations from baseline carry per-+10% effects (e.g. Medicaid: overdoses
−0.08%/qtr; income security: demand +0.03 pp, homelessness −0.08%/qtr; education:
education determinant +0.05/turn; science: innovation +0.06/turn; justice: incarceration
+0.05%/qtr…). Added sectors (green energy 0.2% GDP, universal pre-K 0.15%, mental health
0.1% with overdoses −0.5%/qtr at full funding, broadband 0.08%) scale effects with funding.

**Net interest is automatic** (locked slider):
```
interest_share = debt_gdp · r_eff / 100,   r_eff = 2.7 + max(0, debt_gdp−90)·0.05
```
r_eff ≈ 2.7% matches the 2008 effective average rate on the debt stock (253bn / 64.2% of
GDP); the surcharge models rising risk premia at high debt.

**Receipts** are act-driven:
```
revenue_share = 17.5% + 4.5%·VAT_share + revPerPt·tariff% + act revAdd
revPerPt      = 0.35% · 10 / max(10, tariff%)        ← v0.3 fix (A9): Laffer saturation
```
Above a ~10% average tariff, revenue per point decays hyperbolically (import-base erosion
and avoidance), while the growth/trade drag keeps scaling linearly — high tariffs become
all pain, little gain. Church taxation at "taxed like charity" yields **0.35% of GDP**
(v0.3 fix A6): the gross anchor is $70–80bn/yr of forgone religious-exemption revenue
(~0.5% of 2008 GDP), discounted ~30% for behavioral response (reincorporation, reduced
religious giving/changes in charitable structure).

**Debt dynamics (r − g)**
```
debt_gdp += (deficit/gdp_nominal·100)/4  +  (r − g_nominal)·debt_gdp/400
r         = 2 + max(0, debt_gdp−90)·0.05        (policy-ish short rate)
g_nominal = growth + inflation
```
The standard government budget constraint in `r−g` form (Blanchard 2019; Dalio's
"beautiful deleveraging" framing). While g > r debt melts relative to GDP; once debt
passes 90%, rising r flips the arithmetic — the debt-spiral risk that drives the Big
Cycle's decline phase.

## 4. Social trajectories

**Homelessness (thousands, HUD PIT-anchored; 2007 history value 671.9k)**
```
%/qtr = 0.8·Δunemployment + 1.2·rent_pressure + act/budget homelessPct effects
rent_pressure = +1 (2008–2012), +2 (2013+) baseline; zoning reform −0.6; LVT −1
Housing First: −2.5 %/qtr after 2-turn lag (Finland/Utah evidence: strong but gradual)
Freedom Dividend: −2.0 %/qtr, cumulative reduction CAPPED at −25% vs enactment level
Rental-market ban (v0.3 fix A1): +6 %/qtr shock for 4 turns, then NO relief —
  sustained rent pressure +1.5 while the ban is active (supply collapse persists)
```
The pre-v0.3 rental ban switched to −4%/qtr forever after its shock, which made it the
*best* housing policy — contradicting the rent-control evidence (e.g. Diamond, McQuade &
Qian 2019 on San Francisco: controlled rentals lost ~15% of rental supply). Now the
aftermath keeps homelessness pressure **above baseline drift** and Housing First clearly
outperforms the ban long-run. Overall homelessness remains deliberately stylized vs the
flat-to-down 2008–2017 PIT actuals (HUD AHAR) to keep the lever meaningful.

**Overdose deaths (CDC/NCHS-anchored)**
```
base drift: +2 %/qtr (2008–2012), +3.5 %/qtr (2013–2015 fentanyl ramp), +2 %/qtr (2016+)
Legal+Taxed: −3 %/qtr; Decriminalized: −0.8 %/qtr; treatment (Healthcare ≥ public): −1.5 %/qtr
v0.3 fix (A4): cumulative reduction vs the enactment level is CAPPED per policy —
  legal: −15% (requires Healthcare = public or universal — the treatment-capacity gate);
  −7% without it; decriminalized: −7%. Reductions never exceed the cap.
```
Legal-status effects (revenue, incarceration) are immediate-ish; treatment effects lag
(6-turn policy lag, v0.3 fix A7).

**Incarcerated (millions, BJS-anchored)**
```
base drift −0.2 %/qtr; Tough-on-crime +1.0; Community −0.3; Reform −0.8; Legal drugs −1.2
```

## 5. The Big Cycle — determinants & power score

Eight determinants (Dalio 2021): education, innovation & technology, competitiveness,
military, trade, economic output, financial-center status, reserve-currency status.

Per-turn drift (all clamped 0–100):
| Determinant | Drivers |
|---|---|
| education | +0.3/+0.45/+0.7 per Education reform tier (lag 8 turns — human capital is slow, A7); +0.05 per +10% education budget; +0.4 universal pre-K |
| innovation | +0.1 baseline; +0.25 if Infra&R&D ≥ 1.5% GDP; +0.2/0.35 military reallocation; +0.06 per +10% science budget |
| competitiveness | +0.05 baseline; −0.05·tariff%; +0.1 zoning/immigration reform; +0.15 LVT; small VAT efficiency gain |
| military | +1 increase; −1 / −2 for 25% / 50% reallocation; +0.04 per +10% defense budget |
| trade | −0.1·tariff%; +0.15 / +0.25 immigration reform/open; +0.02 per +10% international budget |
| output | mean-reverts (0.3/turn) toward 88 + 60·(GDP vs 2007 baseline) |
| fincenter | −0.15/turn if debt > 110% GDP; else +0.02 |
| reserve_fx | −0.1/turn if debt > 120% GDP; −0.05 if inflation > 5%; else +0.005 |

**Composite power score — DESIGNER CALIBRATION (see attribution note)**
```
S = mean(8 determinants) − 0.25·debt_burden − 0.25·internal_conflict
debt_burden       = clamp(debt_gdp − 60, 0, 100)
internal_conflict = clamp(70 − sentiment + 0.3·(max−min group approval), 0, 100)
```
This encodes Dalio's qualitative claim: measured strengths are *discounted* by debt excess
and internal conflict. The conflict base was raised 60 → 70 in v0.3 (fix A5) so the game
**opens in "The Top"**: with start determinants education 55 / innovation 80 /
competitiveness 62 / military 85 / trade 68 / output 85 / fincenter 92 / reserve_fx 90
(mean 77.1, discounted from v0.2's 81.9 — a post-peak US), debt 64.2% and sentiment 42,
S ≈ 68.4 — inside the 58–70 band.

**Cycle phases — DESIGNER CALIBRATION**: S ≥ 70 *The Rise* · 58–70 *The Top* ·
46–58 *Early Decline* · 36–46 *Late Decline* · < 36 *Reset / New Order*. (Dalio's book
describes three big stages without numeric thresholds; five labels give finer feedback.)

## 6. Politics — party model, sentiment, legitimacy, voters, elections

```
sentiment  = 30 + 0.3·(50 − 5·unemployment) + 0.5·(4·mi_growth_qtr) − 0.3·homelessness%/qtr
             + goodwill + act sentAdd
goodwill   = clamp((mean group approval − 50)/5, −6, +6)
legitimacy += 0.25·(sentiment − legitimacy) + act legitAdd      (collapse at ≤ 15 — DESIGNER CALIBRATION)
```

**Party & political capital (v0.3).** The player is a party operator holding
House 255/435, Senate 59/100, Governors 28/50 and the presidency:
```
pc cap   = 60 + 0.4·(house + senate)
pc regen = 4 + 4·house/435 + 3·senate/100 + 2·governors/50 + 2·president  (+ act pcRegen)
```
Seats drift 3%/quarter toward the approval-implied share. **Midterms** (turns 12, 28, 44…)
move House/Governors 50% and the Senate 25% toward the share implied by approval **minus a
5-pp penalty for holding the presidency** (the empirically reliable midterm loss pattern).
**Presidential elections** (turns 20, 36, 52… — Q4 2012, Q4 2016, then every 4 years):
weighted approval ≥ 50% keeps the White House (legitimacy +12, +30 PC mandate); below 50%
ends the game — "Your party loses the White House." (v0.3 fixes A3: elections were at
16/32 with a hard turn-40 stop; v0.3 is **endless**, and campaign windows are turns
(e−3)…e → [17,20], [33,36], …)

**Acts are heavy (v0.3):** each non-baseline option has an upfront PC cost plus
`upkeep = {perTurn, turns}`. Each turn upkeep is paid before effects are computed; if PC
is short the act is **stalled** — its effects pause (ramp frozen) and the card shows amber.

Seven voter groups, weights Workers 22 / Capitalists 14 / Youth 14 / Seniors 18 /
Religious 12 / Immigrants 10 / Technocrats 10 (**DESIGNER CALIBRATION**). Approval 0–100
moves via policy affinities (one-time, over the lag), outcome drift (unemployment↓ →
Workers↑; debt↑ → Capitalists↓; overdoses↓ → Seniors↑; income → Youth↑; homelessness↓ →
Immigrants↑; rising S → Technocrats↑; Religious mean-reverts) and **bloc courting**:
Ad Blitz $25M (+1.5 all), Debate $15M, Grassroots $20M, Endorsement $15M — available
**every turn** with ×0.85ⁿ diminishing returns, ×1.5 during campaign windows. The
Democracy Dollars + RCV act cuts party funds income 10% but adds +2 PC/turn regen and
legitimacy/sentiment drift (small-donor vouchers crowd out big money — the trade-off is
the point).

## 7. Network model (v0.3)

`computeNetwork(state, previewFx)` returns deterministic node sizes and edge deltas for the
Network tab. Nodes: 8 determinants (inner ring) + 8 metrics (outer ring: gdp, unemployment,
debt, homelessness, overdoses, incarcerated, med_income, sentiment). Metric node radii map
live values to a 5–100-ish scale (`debt` radius ∝ debt_gdp — the debt bubble visibly grows).
Edges are the static `NETWORK_DEF` list (~23 entries: education→innovation +,
education→output +, unemployment→homelessness +, debt→fincenter −, reserve_fx→debt −
(easier financing), military→innovation +, trade→output +, gdp→debt − …) with
sign (+1/−1 → green/red) and strength 1–3 (→ edge width and CSS dash-flow speed).
**Live preview**: a hovered Act option or budget-slider position is converted to an fx
bundle (`previewPolicyFx` / `previewBudgetFx`), mapped onto node deltas (demand→gdp/output/
unemployment, det→determinant nodes, homelessPct→homelessness, outlay→debt, …); edges
touching a moved node brighten/thicken, others dim, and each moved node gets a ▲/▼ chip.

## 8. News system (v0.3)

The strip above the footer fires every turn, in priority order:
1. **Player alerts** — the top 2 cause→effect ledger entries from *your own* Acts/budget
   effects (e.g. "Your VAT begins raising revenue (+$180bn/yr)"), including stall warnings
   and **BLUNT detection**: during scripted shock turns, if your net demand stimulus
   exceeds +0.5 pp, "Your stimulus blunted the recession shock".
2. **1–2 historical items** from `NEWS.turns[turn].h` (through turn 40; `NEWS.generic`
   thereafter) — `js/news.js` content pack with a small built-in fallback.
3. **1 social post** from `NEWS.turns[turn].s`, rendered in a distinct "social" lane.
Act reactions (`NEWS.actReacts[policyId]`) fire on enactment. Items rotate (4s interval,
pause on hover); the Report tab keeps the full scrollable log.

## 9. Lag & ledger mechanics

Each act change sets `ramp = 0`; every non-stalled turn `ramp += 1/lag` until 1.
v0.3 fix (A7) lag floors: education 8, housing zoning reform 8 (permits → construction),
drug policy 6 (immediate legal-status effects vs 4–12-quarter treatment lag, split
approximated by a single 6-turn lag). One-time approval deltas are queued and released in
`1/lag` slices. Every turn pushes a ledger entry — the Report tab renders it as the
cause→effect log, and CSV/JSON exports contain the full per-turn snapshot history.

## Source references

- **Okun's law** — Okun (1962); Ball, Leigh & Loungani, IMF WP/13/10 (2013).
- **Debt dynamics r−g** — Blanchard (2019) AEA Presidential Address; Dalio (2018) *Big Debt Crises*.
- **Tariff drag & Laffer saturation** — Penn Wharton Budget Model trade analyses (2019–2024); IMF WEO tariff boxes.
- **Budget baseline** — CBO *Long-Term Budget Outlook*; FY2008 category splits after CBO/OMB
  budget-of-the-US-government tables; historical receipts/outlays in `data/history.json`
  (FRED FGRECPT/FGEXPND, **Q4 SAAR, NIPA basis**).
- **Military reallocation multipliers** — spend-neutral reallocation logic
  ΔY = (m_new − m_def)·ΔG with ΔG = 0; multiplier gap ≈ 0.4 between R&D/health/cyber and
  defense procurement, after Ramey (2011) and Auerbach–Gorodnichenko recession-multiplier
  estimates — so net savings ≈ 0 (≤ −0.05% GDP admin saving) and demand rises slightly.
- **Rent control supply effects** — Diamond, McQuade & Qian (2019, SF rent control):
  large supply contraction behind the v0.3 rental-ban aftermath fix.
- **Housing First** — HUD & Finnish Housing First evaluations (strong, lagged reductions).
- **Drug policy caps** — treatment-capacity gating after the Portugal decriminalization
  literature and V0.15 design note: legalization's mortality benefit is bounded without
  treatment capacity.
- **Church taxation** — $70–80bn/yr gross anchor (Cragun/Yeung-style estimates of forgone
  religious exemptions), discounted ~30% for behavioral response → 0.35% of GDP.
- **Debt thresholds** — Reinhart & Rogoff (2010) directional motivation; magnitudes
  weakened per Herndon–Ash–Pollin (2013) and Cecchetti et al. (BIS 2011).
- **Big Cycle determinants & phase archetype** — Dalio (2021), chs. 1–5. All numeric
  thresholds/weights are designer calibration (see attribution note).
- **Midterm penalty** — the long-run empirical regularity that the president's party loses
  Congress seats midterm (≈ −5 pp vote-share adjustment, stylized).
- **Data** — FRED (GDPC1, GDP, UNRATE, GFDEGDQ188S, PAYEMS, MEHOINUSA672N, CPIAUCSL,
  FGRECPT, FGEXPND — pulled 2026-09-19 via the igo_open_data plugin); HUD AHAR PIT counts;
  CDC/NCHS NVSS overdose deaths; BJS correctional populations. See `data/history.json → _sources`.

## Known simplifications

- No monetary-policy agent (Fed reaction function implicit in `r` and inflation drift).
- No international sector; trade/fincenter determinants are scalar drifts.
- Housing rent-pressure baseline intentionally hotter than realized 2008–2017 PIT data (§4).
- Budget category baselines are FY2008-approximate and outlays scale with GDP share, not
  with beneficiary counts or prices.
- All elasticities are hand-set for pedagogy.

## Deferred scope (not yet modeled)

- Poverty metric (distinct from median income / homelessness).
- STI metric (drug-policy side channel).
- Housing-affordability index (price-to-income), distinct from rent pressure.
- Monte Carlo bands (P50–P90) around trajectories — model is currently deterministic.
- Yearly determinant z-scores against historical cross-country data.
- Shapley-style attribution of outcomes to individual acts.
- Sex-work policy, media policy and technocracy are only **partially** covered — the new
  Public Journalism Fund and Democracy Dollars + RCV Acts touch media/technocracy channels
  but dedicated levers remain future work.

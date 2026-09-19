# PoliSim-DBE — Math & Logic Reference

Every formula in `js/engine.js`, with rationale and source pointers. This is an
**educational, stylized** model: elasticities are chosen to be directionally correct
and pedagogically legible, not econometrically estimated.

Conventions: 1 turn = 1 quarter. Growth/inflation/interest rates are **annualized %**;
per-quarter application divides by 4 (or 400 for compound terms). `clamp(x,lo,hi)` bounds x.

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
gapBoost = clamp(0.4·(unemployment − 5.5), 0, 2.5)
```
- `demand_stimulus` = Σ policy demand effects (Infrastructure & R&D: +0.25 pp per 1% of GDP;
  Welfare: +0.4–0.8 pp; military increase +0.2 pp). Magnitudes follow CBO/CRS fiscal-multiplier
  ranges for slack economies (~0.5–1.5) compressed into a single demand term.
- **Tariff drag** −0.08 pp per tariff point: order-of-magnitude consistent with
  Penn Wharton Budget Model / IMF estimates of tariff GDP costs (PWBM 2019 trade-war analyses
  put a ~15% average-tariff scenario at ≈ −1 pp of GDP level per year; per-point quarterly
  coefficient scaled accordingly).
- **Debt drag** above 90% debt/GDP: threshold-and-erosion pattern after
  Reinhart–Rogoff (2010, directionally; we use the weaker post-critique magnitude,
  cf. Herndon–Ash–Pollin 2013) and CBO long-term outlook crowding-out.
- **gapBoost** (output-gap closure): slack labor markets support above-trend catch-up
  growth. Without it, Okun's law alone leaves unemployment permanently elevated after a
  shock — empirically false (US unemployment fell 10%→4.4% over 2010–2017). Coefficient
  chosen so the simulated 2009–2017 recovery roughly matches the actual pace.
- **shock**: scripted GFC growth shocks, turns 1–5: −2.5, −6.5, −4.0, −1.5, 0 pp
  (calibrated to actual real-GDP path Q1 2008 – Q1 2009, the −6.5 pp matching the
  Q4 2008/Q1 2009 collapse).

**Inflation** (simple acceleration-lite Phillips logic)
```
target = 2 + 0.25·(growth − g*) + 0.04·tariff%  (−1.2 during GFC: demand-collapse disinflation)
inflation += 0.25·(target − inflation);  clamp −2…12
```

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
Okun's classic coefficient is ≈ −0.5 (2% excess growth ≈ 1 pp lower unemployment per
*year*); we use −0.4 to reflect post-1990 weakening of the relationship
(Ball, Leigh & Loungani, IMF 2013). The GFC adds direct quarterly unemployment shocks
(+0.2…+0.9 pp, turns 1–8) modeling labor-market scarring/hysteresis that pure Okun
misses (actual US unemployment rose ~2 pp *after* GDP stopped falling).
Median income: `growth_qtr = (growth − 0.5)/4 + workersBonus/4`, where workersBonus
(0–1) comes from Welfare/Education transfers — the "shared prosperity" channel.

## 3. Budget & debt dynamics

```
revenue_share = 17.5% + 4.5%·VAT_share + 0.35%·tariff_pt + 0.3% (legal drugs) + 0.07–0.15% (church tax)
outlay_share  = 20.5% + Σ policy adds − military savings + crisis stabilizers
deficit_bn    = (outlay_share − revenue_share)·gdp_nominal
```
- 17.5% / 20.5% are the CBO long-run baseline revenue/outlay shares of GDP
  (CBO *Long-Term Budget Outlook*), consistent with actual FY2004–2007 averages
  (see `data/history.json`: receipts ≈ 17–18%, outlays ≈ 19–20% of GDP).
- VAT: a broad US VAT raises ≈ 0.45% of GDP per point of displacement of income-tax
  revenue at typical rates (CBO revenue options; TPC estimates).
- Crisis stabilizers (turns 1–8, +2.0→+0.5% of GDP): automatic stabilizers +
  TARP/ARRA-style rescue, matching the actual 2009–2010 deficit spike to ~10% of GDP.

**Debt dynamics (r − g)**
```
debt_gdp += (deficit/gdp_nominal·100)/4  +  (r − g_nominal)·debt_gdp/400
r       = 2 + max(0, debt_gdp−90)·0.05        (interest rate rises with debt)
g_nominal = growth + inflation
```
The standard government budget constraint in `r−g` form (Blanchard 2019, *Public Debt
and Low Interest Rates*; Dalio's "beautiful deleveraging" framing). While g > r debt
melts relative to GDP; once debt passes 90%, rising r flips the arithmetic — the
debt-spiral risk that drives the Big Cycle's decline phase.

## 4. Social trajectories

**Homelessness (thousands, HUD PIT-anchored)**
```
%/qtr = 0.8·Δunemployment + 1.2·rent_pressure − housing/welfare effects
rent_pressure = +1 (2008–2012), +2 (2013+) baseline; zoning reform −0.6
Housing First: −2.5 %/qtr after 2-turn lag (Finland/Utah evidence: strong but gradual)
Rental-market ban: +6 %/qtr shock for 4 turns, then −4 %/qtr (supply-collapse stylization)
```
Deliberately stylized: actual PIT counts 2008–2017 were flat-to-down (HUD AHAR) because
of Veterans' programs and the crisis-era HPRP; the model instead exposes the
*structural rent-pressure* the player must actively counter — the divergence between
your line and the grey actual line is itself the lesson.

**Overdose deaths (CDC/NCHS-anchored)**
```
base drift: +2 %/qtr (2008–2012), +3.5 %/qtr (2013–2015 fentanyl ramp), +2 %/qtr (2016+)
Legal+Taxed drugs: −3 %/qtr after 4-turn lag; treatment (Healthcare ≥ public option): −1.5 %/qtr
```
Tracks the actual opioid-epidemic acceleration (36k deaths 2008 → 70k 2017) and the
evidence that treatment access and regulated supply reduce mortality.

**Incarcerated (millions, BJS-anchored)**
```
base drift −0.2 %/qtr (actual slow decline 2008–2017)
Tough-on-crime +1.0; Community policing −0.3; Reform −0.8; Legal drugs −1.2 (lagged)
```

## 5. The Big Cycle — determinants & power score

Eight determinants (Dalio, *Principles for Dealing with the Changing World Order*, 2021):
education, innovation & technology, competitiveness, military, trade, economic output,
financial-center status, reserve-currency status. US 2008 start values in `EVENTS.start`.

Per-turn drift (all clamped 0–100):
| Determinant | Drivers |
|---|---|
| education | +0.3/+0.45/+0.7 per Education reform tier |
| innovation | +0.1 baseline; +0.25 if Infra&R&D ≥ 1.5% GDP; +0.2/0.35 if military funds reallocated; +0.05–0.15 education/immigration |
| competitiveness | +0.05 baseline; −0.05·tariff%; +0.1 zoning/immigration reform; small VAT efficiency gain |
| military | +1 increase; −1 / −2 for 25% / 50% cuts |
| trade | −0.1·tariff%; +0.15 / +0.25 immigration reform/open |
| output | mean-reverts (0.3/turn) toward 88 + 60·(GDP vs 2007 baseline) |
| fincenter | −0.15/turn if debt > 110% GDP; else +0.02 |
| reserve_fx | −0.1/turn if debt > 120% GDP; −0.05 if inflation > 5%; else +0.005 |

**Composite power score**
```
S = mean(8 determinants) − 0.25·debt_burden − 0.25·internal_conflict
debt_burden      = clamp(debt_gdp − 60, 0, 100)
internal_conflict = clamp(60 − sentiment + 0.3·(max−min group approval), 0, 100)
```
This encodes Dalio's central claim: measured strengths are *discounted* by debt excess
and internal conflict — the two forces that historically end reserve-currency eras.

**Cycle phases**: S ≥ 70 *The Rise* · 58–70 *The Top* · 46–58 *Early Decline* ·
36–46 *Late Decline* · < 36 *Reset / New Order* (Dalio's archetypal Big Cycle stages).

## 6. Politics — sentiment, legitimacy, voters, elections

```
sentiment  = 30 + 0.3·(50 − 5·unemployment) + 0.5·(4·mi_growth_qtr) − 0.3·homelessness%/qtr + goodwill
goodwill   = clamp((mean group approval − 50)/5, −6, +6)
legitimacy += 0.25·(sentiment − legitimacy)        (exponential drift; collapse at ≤ 15)
```

Seven voter groups (Democracy 4-style), weights: Workers 22, Capitalists 14, Youth 14,
Seniors 18, Religious 12, Immigrants 10, Technocrats 10. Approval 0–100 moves via:
1. **Policy affinities** — one-time deltas per option (e.g. UBI: Workers +8,
   Capitalists −10, Youth +6, Seniors +5, Technocrats +2), applied linearly over the lag.
2. **Outcome drift** — unemployment↓ → Workers↑; debt rising → Capitalists↓;
   overdoses↓ → Seniors↑; income growth → Youth↑; homelessness↓ → Immigrants↑;
   rising power score → Technocrats↑; Religious mean-reverts gently.
3. **Campaign actions** (turns 13–16 & 29–32): Ad Blitz $25M (+1.5 all), Debate $15M,
   Grassroots $20M, Endorsement $15M; effectiveness ×0.85ⁿ per repeat use.

**Elections** (turns 16 & 32): weighted approval ≥ 50% wins (legitimacy +12);
losing ends the game.

## 7. Lag & ledger mechanics

Each policy change sets `ramp = 0`; every turn `ramp += 1/lag` until 1 (full effect).
Slider values interpolate linearly over the ramp; dropdown option effects scale by ramp.
One-time approval deltas are queued and released in `1/lag` slices per turn. Every turn
pushes a ledger entry (policy changes, growth decomposition, lag completions, crisis
stabilizers, elections) — the Report tab renders this as the cause→effect log, and the
CSV/JSON export contains the full per-turn snapshot history.

## Source references

- **Okun's law** — Okun (1962); Ball, Leigh & Loungani, IMF WP/13/10 (2013).
- **Debt dynamics r−g** — Blanchard (2019) AEA Presidential Address; Dalio (2018) *Big Debt Crises*.
- **Tariff drag** — Penn Wharton Budget Model trade analyses (2019–2024); IMF WEO tariff boxes.
- **Budget baseline** — CBO *Long-Term Budget Outlook*; historical receipts/outlays in `data/history.json`.
- **Debt thresholds** — Reinhart & Rogoff (2010) as directional motivation; magnitudes
  deliberately weakened per Herndon–Ash–Pollin (2013) critique and Cecchetti et al. (BIS 2011).
- **Big Cycle determinants & phases** — Dalio (2021) *Principles for Dealing with the
  Changing World Order*, chs. 1–5 (the 8 determinants, rise/top/decline archetype).
- **Housing First effectiveness** — HUD & Finnish Housing First evaluations (strong,
  lagged reductions in chronic homelessness).
- **Data** — FRED: GDPC1, GDP, UNRATE, GFDEGDQ188S, PAYEMS, MEHOINUSA672N, CPIAUCSL,
  FGRECPT, FGEXPND; HUD AHAR Point-in-Time counts; CDC/NCHS NVSS overdose deaths;
  BJS correctional populations. See `data/history.json → _sources`.

## Known simplifications (Phase 1)

- No monetary-policy agent (Fed reaction function is implicit in `r` and inflation drift).
- No international sector; trade/fincenter determinants are scalar drifts.
- Housing rent-pressure baseline intentionally hotter than realized 2008–2017 PIT data
  (see §4) to keep the policy lever meaningful.
- All elasticities are hand-set for pedagogy; calibration against literature is on the roadmap.

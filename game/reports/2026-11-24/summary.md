# PoliSim-DBE — Nightly digest 2026-11-24

150 runs · 5 personas × 3 scenarios × 10 seeds (s0…s9) · deterministic · heuristic drivers on mechanical preview channels · Δ = vs no-op baseline; “act” columns = vs scripted ACTUAL (dual-track only)

## gfc2008 — Global Financial Crisis

| Persona | Δgrowth | Δdebt/GDP | Δoverdoses | Δhomeless | final S (ΔS) | stage | legit | camp/scand/corr |
|---|---|---|---|---|---|---|---|---|
| Humanitarian | +0.92 | +175.8 | −18,965 | −344 | 50.6 (−13.5) | Early Decline | 50 | 0/0/12.6 |
| Statesman | +0.72 | +175.8 | −8,742 | −452 | 51.5 (−12.6) | Early Decline | 46 | 0/0/16.8 |
| Nationalist | +0.96 | +175.8 | −288 | −295 | 53.7 (−10.4) | Early Decline | 41 | 18/6/23.1 |
| Machine | +0.93 | +175.8 | −13,271 | −308 | 54.1 (−10) | Early Decline | 43 | 18/6/23.1 |
| Machiavelli | +0.15 | +91.8 | +142,424 | +1,443 | 47 (−17.1) | Early Decline | 32 | 19.5/5.2/23.1 |

## realign2016 — The Realignment

| Persona | Δgrowth | Δdebt/GDP | Δoverdoses | Δhomeless | final S (ΔS) | stage | legit | camp/scand/corr |
|---|---|---|---|---|---|---|---|---|
| Humanitarian | +2.16 | +19.1 (act +120.9) | −160,648 (act −11,957) | −1,921 | 48.2 (+8.3) | Early Decline | 47 | 0/0/19.6 |
| Statesman | +2.62 | +19.1 (act +120.9) | −144,320 (act +4,371) | −1,923 | 52.2 (+12.4) | Early Decline | 43 | 0/0/22.4 |
| Nationalist | +2.18 | +19.1 (act +120.9) | −134,863 (act +13,828) | −1,795 | 54.1 (+14.3) | Early Decline | 40 | 17/3/24.5 |
| Machine | +2.88 | +19.1 (act +120.9) | −151,488 (act −2,797) | −1,829 | 56.2 (+16.4) | Early Decline | 42 | 17/3/24.5 |
| Machiavelli | +1.02 | +19.1 (act +120.9) | +55,429 (act +204,119) | +45 | 46.7 (+6.8) | Early Decline | 27 | 17/3/24.5 |

## dbe2030 — Dimensions Beyond Energy

| Persona | Δgrowth | Δdebt/GDP | Δoverdoses | Δhomeless | final S (ΔS) | stage | legit | camp/scand/corr |
|---|---|---|---|---|---|---|---|---|
| Humanitarian | +2.07 | ±0 | −156,541 | −2,863 | 45.9 (+12) | Early Decline | 63 | 0/0/11.2 |
| Statesman | +2.11 | ±0 | −140,993 | −2,838 | 46.3 (+12.4) | Early Decline | 55 | 0/0/15.4 |
| Nationalist | +1.28 | ±0 | −135,702 | −2,721 | 47.8 (+13.9) | Early Decline | 54 | 19/2/18.2 |
| Machine | +2.29 | ±0 | −148,542 | −2,763 | 50.7 (+16.8) | Early Decline | 54 | 19.6/3.6/18.2 |
| Machiavelli | +0.93 | ±0 | +51,137 | −141 | 41.1 (+7.3) | Late Decline | 43 | 19/2/18.2 |

## Top findings

**S movers (mean ΔS, users vs non-users):** Public Journalism Fund Act (Act) +9.71 (n=30) · Healthcare Act (Act) +7.37 (n=124) · Freedom Dividend Act (Act) +6.01 (n=120) · Housing Act (Act) +6.01 (n=120) · Education Act (Act) +6.01 (n=120)

**Welfare movers (−½(Δod%+Δhomeless%)):** Healthcare Act (Act) +149.9% (n=124) · Freedom Dividend Act (Act) +141.4% (n=120) · Housing Act (Act) +141.4% (n=120) · Education Act (Act) +141.4% (n=120) · Democracy Dollars + RCV Act (Act) +53.2% (n=56)

**Convergence:**
- gfc2008: robust = Welfare Act, Immigration Act, Law Enforcement Act, Tax Reform Act; solo signatures = Land Value Tax Act (only humanitarian), Tariff Act (only nationalist), Public Journalism Fund Act (only machine)
- realign2016: robust = Welfare Act, Immigration Act, Law Enforcement Act, Tax Reform Act; solo signatures = Land Value Tax Act (only humanitarian), Tariff Act (only nationalist), Public Journalism Fund Act (only machine)
- dbe2030: robust = Welfare Act, Healthcare Act, Immigration Act, Law Enforcement Act; solo signatures = Land Value Tax Act (only humanitarian), Tariff Act (only nationalist)

## Calibration flags (160)

Tally: RULE B × 10 · RULE C × 150.

- **RULE C** `gfc2008/humanitarian/s0` — RULE C (debt spiral): debt/GDP rose +185.8 pts over 60 turns (64.2% → 250%; threshold +40). No-op baseline ended at 74.2% (20 turns) ⇒ this spiral is persona-driven.
- **RULE C** `gfc2008/statesman/s0` — RULE C (debt spiral): debt/GDP rose +185.8 pts over 60 turns (64.2% → 250%; threshold +40). No-op baseline ended at 74.2% (20 turns) ⇒ this spiral is persona-driven.
- **RULE C** `gfc2008/nationalist/s0` — RULE C (debt spiral): debt/GDP rose +185.8 pts over 60 turns (64.2% → 250%; threshold +40). No-op baseline ended at 74.2% (20 turns) ⇒ this spiral is persona-driven.
- **RULE C** `gfc2008/machine/s0` — RULE C (debt spiral): debt/GDP rose +185.8 pts over 60 turns (64.2% → 250%; threshold +40). No-op baseline ended at 74.2% (20 turns) ⇒ this spiral is persona-driven.
- **RULE C** `gfc2008/machiavelli/s0` — RULE C (debt spiral): debt/GDP rose +103.4 pts over 60 turns (64.2% → 167.6%; threshold +40). No-op baseline ended at 74.2% (20 turns) ⇒ this spiral is persona-driven.
- **RULE C** `realign2016/humanitarian/s0` — RULE C (debt spiral): debt/GDP rose +145.4 pts over 60 turns (104.6% → 250%; threshold +40). The no-op baseline ALSO spirals (+126.3 pts over 60 turns) ⇒ engine/scenario-level spiral, not a persona artifact.
- **RULE C** `realign2016/statesman/s0` — RULE C (debt spiral): debt/GDP rose +145.4 pts over 60 turns (104.6% → 250%; threshold +40). The no-op baseline ALSO spirals (+126.3 pts over 60 turns) ⇒ engine/scenario-level spiral, not a persona artifact.
- **RULE C** `realign2016/nationalist/s0` — RULE C (debt spiral): debt/GDP rose +145.4 pts over 60 turns (104.6% → 250%; threshold +40). The no-op baseline ALSO spirals (+126.3 pts over 60 turns) ⇒ engine/scenario-level spiral, not a persona artifact.
- **RULE C** `realign2016/machine/s0` — RULE C (debt spiral): debt/GDP rose +145.4 pts over 60 turns (104.6% → 250%; threshold +40). The no-op baseline ALSO spirals (+126.3 pts over 60 turns) ⇒ engine/scenario-level spiral, not a persona artifact.
- **RULE C** `realign2016/machiavelli/s0` — RULE C (debt spiral): debt/GDP rose +145.4 pts over 60 turns (104.6% → 250%; threshold +40). The no-op baseline ALSO spirals (+126.3 pts over 60 turns) ⇒ engine/scenario-level spiral, not a persona artifact.
- **RULE B** `dbe2030/humanitarian/s0` — RULE B (single-Act |ΔS| > 8): Healthcare Act → public at turn 3 moved S by −8.3 over turns 3–11 with no other Act in the window (S 47.2 → 38.9). Evidence-check candidate.
- **RULE C** `dbe2030/humanitarian/s0` — RULE C (debt spiral): debt/GDP rose +120.9 pts over 60 turns (129.1% → 250%; threshold +40). The no-op baseline ALSO spirals (+120.9 pts over 60 turns) ⇒ engine/scenario-level spiral, not a persona artifact.
- **RULE B** `dbe2030/humanitarian/s1` — RULE B (single-Act |ΔS| > 8): Healthcare Act → public at turn 3 moved S by −8.3 over turns 3–11 with no other Act in the window (S 47.2 → 38.9). Evidence-check candidate.
- **RULE B** `dbe2030/humanitarian/s2` — RULE B (single-Act |ΔS| > 8): Healthcare Act → public at turn 3 moved S by −8.3 over turns 3–11 with no other Act in the window (S 47.2 → 38.9). Evidence-check candidate.
- **RULE B** `dbe2030/humanitarian/s3` — RULE B (single-Act |ΔS| > 8): Healthcare Act → public at turn 3 moved S by −8.3 over turns 3–11 with no other Act in the window (S 47.2 → 38.9). Evidence-check candidate.
- **RULE B** `dbe2030/humanitarian/s4` — RULE B (single-Act |ΔS| > 8): Healthcare Act → public at turn 3 moved S by −8.4 over turns 3–11 with no other Act in the window (S 47.2 → 38.8). Evidence-check candidate.
- **RULE B** `dbe2030/humanitarian/s5` — RULE B (single-Act |ΔS| > 8): Healthcare Act → public at turn 3 moved S by −8.3 over turns 3–11 with no other Act in the window (S 47.2 → 38.9). Evidence-check candidate.
- **RULE B** `dbe2030/humanitarian/s6` — RULE B (single-Act |ΔS| > 8): Healthcare Act → public at turn 3 moved S by −8.3 over turns 3–11 with no other Act in the window (S 47.2 → 38.9). Evidence-check candidate.
- **RULE B** `dbe2030/humanitarian/s7` — RULE B (single-Act |ΔS| > 8): Healthcare Act → public at turn 3 moved S by −8.4 over turns 3–11 with no other Act in the window (S 47.2 → 38.8). Evidence-check candidate.
- **RULE B** `dbe2030/humanitarian/s8` — RULE B (single-Act |ΔS| > 8): Healthcare Act → public at turn 3 moved S by −8.3 over turns 3–11 with no other Act in the window (S 47.2 → 38.9). Evidence-check candidate.
- …plus 135 seed-level RULE C entries with identical per-persona numbers (see calibration-ledger.jsonl).

_Rules: A untouched-metric divergence vs ACTUAL · B single-Act |ΔS|>8 in clean 8-turn window · C debt/GDP +40pts spiral · D overdose outcome below the documented evidence cap. Full report: report.html · data of record: traces.json_

# PoliSim-DBE — Nightly digest 2026-11-23

150 runs · 5 personas × 3 scenarios × 10 seeds (s0…s9) · deterministic · heuristic drivers on mechanical preview channels · Δ = vs no-op baseline; “act” columns = vs scripted ACTUAL (dual-track only)

## gfc2008 — Global Financial Crisis

| Persona | Δgrowth | Δdebt/GDP | Δoverdoses | Δhomeless | final S (ΔS) | stage | legit | camp/scand/corr |
|---|---|---|---|---|---|---|---|---|
| Humanitarian | +0.15 | +175.8 | −19,047 | −344 | 45.5 (−18.6) | Late Decline | 53 | 0/0/0 |
| Statesman | +0.7 | +175.8 | −8,584 | −452 | 50.6 (−13.5) | Early Decline | 51 | 0/0/0 |
| Nationalist | +0.88 | +175.8 | −448 | −295 | 52.7 (−11.4) | Early Decline | 48 | 15/2/0 |
| Machine | +0.91 | +175.8 | −12,489 | −308 | 54.1 (−10) | Early Decline | 51 | 16/2/0 |
| Machiavelli | −0.03 | +98.1 | +143,181 | +1,444 | 45.3 (−18.8) | Late Decline | 39 | 14.9/2/10 |

## realign2016 — The Realignment

| Persona | Δgrowth | Δdebt/GDP | Δoverdoses | Δhomeless | final S (ΔS) | stage | legit | camp/scand/corr |
|---|---|---|---|---|---|---|---|---|
| Humanitarian | +2.3 | +19.1 (act +120.9) | −155,633 (act −6,943) | −1,921 | 47.5 (+7.7) | Early Decline | 52 | 0/0/0 |
| Statesman | +2.6 | +19.1 (act +120.9) | −141,915 (act +6,776) | −1,926 | 50.5 (+10.6) | Early Decline | 50 | 0/0/0 |
| Nationalist | +2.28 | +19.1 (act +120.9) | −134,745 (act +13,946) | −1,795 | 53.4 (+13.6) | Early Decline | 51 | 16/2/0.3 |
| Machine | +2.84 | +19.1 (act +120.9) | −151,699 (act −3,009) | −1,732 | 54.4 (+14.6) | Early Decline | 53 | 16/2/0 |
| Machiavelli | +0.94 | +19.1 (act +120.9) | +58,622 (act +207,313) | +53 | 44.9 (+5) | Late Decline | 39 | 16/2/9.9 |

## dbe2030 — Dimensions Beyond Energy

| Persona | Δgrowth | Δdebt/GDP | Δoverdoses | Δhomeless | final S (ΔS) | stage | legit | camp/scand/corr |
|---|---|---|---|---|---|---|---|---|
| Humanitarian | +1.82 | ±0 | −151,827 | −2,863 | 43.9 (+10) | Late Decline | 65 | 0/0/0 |
| Statesman | +2.15 | ±0 | −140,651 | −2,929 | 45.7 (+11.8) | Late Decline | 59 | 0/0/0 |
| Nationalist | +1.47 | ±0 | −133,152 | −2,721 | 48.5 (+14.6) | Early Decline | 54 | 22/3/0.1 |
| Machine | +2.25 | ±0 | −148,166 | −2,591 | 49.1 (+15.2) | Early Decline | 50 | 21.2/3/0 |
| Machiavelli | +0.79 | ±0 | +52,195 | −140 | 40 (+6.1) | Late Decline | 41 | 22/3/9.8 |

## Top findings

**S movers (mean ΔS, users vs non-users):** Public Journalism Fund Act (Act) +8.93 (n=26) · Healthcare Act (Act) +6.94 (n=122) · Freedom Dividend Act (Act) +6.27 (n=120) · Housing Act (Act) +6.27 (n=120) · Education Act (Act) +6.27 (n=120)

**Welfare movers (−½(Δod%+Δhomeless%)):** Healthcare Act (Act) +145.2% (n=122) · Freedom Dividend Act (Act) +141.4% (n=120) · Housing Act (Act) +141.4% (n=120) · Education Act (Act) +141.4% (n=120) · Democracy Dollars + RCV Act (Act) +53.9% (n=57)

**Convergence:**
- gfc2008: robust = Welfare Act, Law Enforcement Act, Immigration Act, Tax Reform Act; solo signatures = Land Value Tax Act (only humanitarian), Tariff Act (only nationalist), Public Journalism Fund Act (only machine)
- realign2016: robust = Welfare Act, Law Enforcement Act, Immigration Act; solo signatures = Tariff Act (only nationalist), Public Journalism Fund Act (only machine)
- dbe2030: robust = Welfare Act, Healthcare Act, Immigration Act, Law Enforcement Act; solo signatures = Land Value Tax Act (only humanitarian), Tariff Act (only nationalist)

## Calibration flags (160)

Tally: RULE B × 10 · RULE C × 150.

- **RULE C** `gfc2008/humanitarian/s0` — RULE C (debt spiral): debt/GDP rose +185.8 pts over 60 turns (64.2% → 250%; threshold +40). No-op baseline ended at 74.2% (20 turns) ⇒ this spiral is persona-driven.
- **RULE C** `gfc2008/statesman/s0` — RULE C (debt spiral): debt/GDP rose +185.8 pts over 60 turns (64.2% → 250%; threshold +40). No-op baseline ended at 74.2% (20 turns) ⇒ this spiral is persona-driven.
- **RULE C** `gfc2008/nationalist/s0` — RULE C (debt spiral): debt/GDP rose +185.8 pts over 60 turns (64.2% → 250%; threshold +40). No-op baseline ended at 74.2% (20 turns) ⇒ this spiral is persona-driven.
- **RULE C** `gfc2008/machine/s0` — RULE C (debt spiral): debt/GDP rose +185.8 pts over 60 turns (64.2% → 250%; threshold +40). No-op baseline ended at 74.2% (20 turns) ⇒ this spiral is persona-driven.
- **RULE C** `gfc2008/machiavelli/s0` — RULE C (debt spiral): debt/GDP rose +109.8 pts over 60 turns (64.2% → 174%; threshold +40). No-op baseline ended at 74.2% (20 turns) ⇒ this spiral is persona-driven.
- **RULE C** `realign2016/humanitarian/s0` — RULE C (debt spiral): debt/GDP rose +145.4 pts over 60 turns (104.6% → 250%; threshold +40). The no-op baseline ALSO spirals (+126.3 pts over 60 turns) ⇒ engine/scenario-level spiral, not a persona artifact.
- **RULE C** `realign2016/statesman/s0` — RULE C (debt spiral): debt/GDP rose +145.4 pts over 60 turns (104.6% → 250%; threshold +40). The no-op baseline ALSO spirals (+126.3 pts over 60 turns) ⇒ engine/scenario-level spiral, not a persona artifact.
- **RULE C** `realign2016/nationalist/s0` — RULE C (debt spiral): debt/GDP rose +145.4 pts over 60 turns (104.6% → 250%; threshold +40). The no-op baseline ALSO spirals (+126.3 pts over 60 turns) ⇒ engine/scenario-level spiral, not a persona artifact.
- **RULE C** `realign2016/machine/s0` — RULE C (debt spiral): debt/GDP rose +145.4 pts over 60 turns (104.6% → 250%; threshold +40). The no-op baseline ALSO spirals (+126.3 pts over 60 turns) ⇒ engine/scenario-level spiral, not a persona artifact.
- **RULE C** `realign2016/machiavelli/s0` — RULE C (debt spiral): debt/GDP rose +145.4 pts over 60 turns (104.6% → 250%; threshold +40). The no-op baseline ALSO spirals (+126.3 pts over 60 turns) ⇒ engine/scenario-level spiral, not a persona artifact.
- **RULE B** `dbe2030/humanitarian/s0` — RULE B (single-Act |ΔS| > 8): Healthcare Act → public at turn 3 moved S by −9.1 over turns 3–11 with no other Act in the window (S 47.2 → 38). Evidence-check candidate.
- **RULE C** `dbe2030/humanitarian/s0` — RULE C (debt spiral): debt/GDP rose +120.9 pts over 60 turns (129.1% → 250%; threshold +40). The no-op baseline ALSO spirals (+120.9 pts over 60 turns) ⇒ engine/scenario-level spiral, not a persona artifact.
- **RULE B** `dbe2030/humanitarian/s1` — RULE B (single-Act |ΔS| > 8): Healthcare Act → public at turn 3 moved S by −9.1 over turns 3–11 with no other Act in the window (S 47.2 → 38). Evidence-check candidate.
- **RULE B** `dbe2030/humanitarian/s2` — RULE B (single-Act |ΔS| > 8): Healthcare Act → public at turn 3 moved S by −9.1 over turns 3–11 with no other Act in the window (S 47.2 → 38). Evidence-check candidate.
- **RULE B** `dbe2030/humanitarian/s3` — RULE B (single-Act |ΔS| > 8): Healthcare Act → public at turn 3 moved S by −9.1 over turns 3–11 with no other Act in the window (S 47.2 → 38). Evidence-check candidate.
- **RULE B** `dbe2030/humanitarian/s4` — RULE B (single-Act |ΔS| > 8): Healthcare Act → public at turn 3 moved S by −9.1 over turns 3–11 with no other Act in the window (S 47.2 → 38). Evidence-check candidate.
- **RULE B** `dbe2030/humanitarian/s5` — RULE B (single-Act |ΔS| > 8): Healthcare Act → public at turn 3 moved S by −9.1 over turns 3–11 with no other Act in the window (S 47.2 → 38). Evidence-check candidate.
- **RULE B** `dbe2030/humanitarian/s6` — RULE B (single-Act |ΔS| > 8): Healthcare Act → public at turn 3 moved S by −9.1 over turns 3–11 with no other Act in the window (S 47.2 → 38). Evidence-check candidate.
- **RULE B** `dbe2030/humanitarian/s7` — RULE B (single-Act |ΔS| > 8): Healthcare Act → public at turn 3 moved S by −9.1 over turns 3–11 with no other Act in the window (S 47.2 → 38). Evidence-check candidate.
- **RULE B** `dbe2030/humanitarian/s8` — RULE B (single-Act |ΔS| > 8): Healthcare Act → public at turn 3 moved S by −9.1 over turns 3–11 with no other Act in the window (S 47.2 → 38). Evidence-check candidate.
- …plus 135 seed-level RULE C entries with identical per-persona numbers (see calibration-ledger.jsonl).

_Rules: A untouched-metric divergence vs ACTUAL · B single-Act |ΔS|>8 in clean 8-turn window · C debt/GDP +40pts spiral · D overdose outcome below the documented evidence cap. Full report: report.html · data of record: traces.json_

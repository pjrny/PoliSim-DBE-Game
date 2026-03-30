# PoliSim-DBE-Game

PoliSim-DBE is a browser-based political strategy + macro scenario simulator.
This version now includes a **manifesto-driven policy input board** tailored to your listed “10% chaos” US-party ideas, plus a practical secrets workflow for local and GitHub Pages deployments.

## What changed in this version

- Added a **policy slider board** for manifesto levers (VAT, military reallocation, vice legalization, church taxation, immigration openness, apprenticeship shift, etc.).
- Added **extra tracked metrics**: Trust Index, Civil Liberty Index, Cyber Capacity.
- Added **environment setup flow** for `OPENBB_API_KEY` and `SECURE_CODE` validation.
- Added runtime config placeholders (`RUNTIME_CONFIG`) and documentation for secure deployment.

---

## Quick start (local)

1. Clone repo.
2. Open `index.html` in a local server (recommended):
   - `python3 -m http.server 8080`
   - visit `http://localhost:8080`
3. Tune manifesto policy sliders.
4. Use **Validate Keys** after entering:
   - OpenBB API key
   - Secure code (your private admin code)

---

## Required variables (and where to get them)

### 1) `OPENBB_API_KEY`
- **What it is:** API key for OpenBB data access.
- **Where to get it:** from your OpenBB account dashboard.
- **Use in app:** set in runtime config and/or environment setup panel.

### 2) `SECURE_CODE`
- **What it is:** private passphrase only you/admins know.
- **Where to get it:** you define it yourself.
- **How app verifies:** hash this code with SHA-256 and store hash as `SECURE_CODE_HASH`.

### 3) `SECURE_CODE_HASH`
- **What it is:** SHA-256 hex digest of `SECURE_CODE`.
- **Generate locally:**
  ```bash
  echo -n "your-secure-code" | sha256sum
  ```
  (Use the first hex column.)

---

## Configure secrets for GitHub Pages

Because this is a static app, do **not** commit real secrets to git.
Use GitHub Actions + repository secrets:

1. In GitHub repo:
   - Settings → Secrets and variables → Actions.
2. Add secrets:
   - `OPENBB_API_KEY`
   - `SECURE_CODE_HASH`
3. In your deploy workflow, create a generated config file at build time (example):

```yaml
- name: Generate runtime config
  run: |
    cat > js/runtime_config.generated.js <<'CONF'
    export const GENERATED_RUNTIME_CONFIG = {
      OPENBB_API_KEY: "${{ secrets.OPENBB_API_KEY }}",
      SECURE_CODE_HASH: "${{ secrets.SECURE_CODE_HASH }}"
    };
    CONF
```

4. Import and merge this generated object in `db_data.js` (or switch `RUNTIME_CONFIG` to load from it).

---

## Policy mapping for your manifesto

Current policy levers are modeled as scenario intensities (0–100):

- VAT replacement
- Military reallocation to cyber/health/science
- Vice legalization/taxation
- Church/non-profit taxation
- Owner-occupancy housing push
- Direct democracy with policy gating
- Technocracy branch pressure
- Immigration openness + enforcement
- Welfare cash-equivalent shift
- Apprenticeship-first education path
- Year-round schooling
- Civil-liberty safeguard floor
- Chaos factor

These values apply drift multipliers yearly in the simulation engine.

---

## Roadmap to full implementation

1. **Data-backed calibration**
   - Replace placeholder multipliers in `POLICY_IMPACTS` with dataset-derived elasticities.
2. **OpenBB integration**
   - Pull real macro time series and use them for historical fit mode.
3. **Scenario presets**
   - Save/load policy bundles (e.g., “10% chaos baseline”, “hard-authoritarian”, “balanced technocrat”).
4. **Governance mechanics**
   - Add consequences for civil-liberty breaches and legitimacy shocks.
5. **Cloud saves**
   - Persist runs with optional backend token instead of localStorage only.

---

## Disclaimer

This simulator is a creative policy sandbox and not legal, financial, or political advice. It should not be used for real-world decision-making without rigorous external validation.

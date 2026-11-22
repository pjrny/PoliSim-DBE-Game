#!/usr/bin/env bash
# PoliSim-DBE Nightly Simulation Lab — macOS/Linux scheduler script.
# Schedule with cron (crontab -e), e.g. every night at 3:00 AM:
#   0 3 * * * /path/to/game/scripts/nightly.sh
# Or with a launchd plist / systemd timer — any scheduler that runs a shell command works.
set -euo pipefail
cd "$(dirname "$0")/.."          # game/
mkdir -p reports
node run_nightly.js 10            # 5 personas × 3 scenarios × 10 seeds = 150 runs (~5s)
echo "Nightly report: $(pwd)/reports/$(date +%F)/report.html"
# Optional: auto-open the report in the morning (macOS: uncomment)
# open "reports/$(date +%F)/report.html" 2>/dev/null || true

#!/usr/bin/env bash
# Run the whole test suite against the TEST environment (empty local database, own port) and stop it afterwards.
#   1. repository layout, environments and database schema   (no server)
#   2. shell unit tests                                      (no server)
#   3. API tests of every app                                (test environment)
#   4. browser tests with Playwright (system Chrome)         (test environment)
# Usage: scripts/test.sh [unit|api|e2e|all]      (default: all)
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
ROOT="$PWD"; PART="${1:-all}"; ENV=test
cfg() { python3 -I scripts/config.py "$@"; }
[ -f .env ] && { set -a; . ./.env; set +a; }
PORT="$(cfg get "$ENV" local.port)"; ORIGIN="http://localhost:$PORT"
export ADMIN_CLAVE="${ADMIN_KEY_TEST:-test-admin-key}"      # name kept: the apps' tests read ADMIN_CLAVE
FAILED=0
section() { printf '\n\033[1m== %s\033[0m\n' "$*"; }

if [ "$PART" = all ] || [ "$PART" = unit ]; then
  section "Layout, environments and database schema"; node --test tests/site db/tests || FAILED=1
  section "Shell"; (cd apps/shell && node --test tests/) || FAILED=1
fi
if [ "$PART" = all ] || [ "$PART" = api ] || [ "$PART" = e2e ]; then
  section "Starting the test environment ($ORIGIN, empty database)"
  scripts/local.sh up "$ENV" || exit 1
  trap 'scripts/local.sh down "$ENV" >/dev/null' EXIT
fi
if [ "$PART" = all ] || [ "$PART" = api ]; then
  for app in $(cfg app-ids); do
    section "API: $app"; BASE="$ORIGIN/$app" node --test "apps/$app/tests/" || FAILED=1
  done
fi
if [ "$PART" = all ] || [ "$PART" = e2e ]; then
  for app in team-canvas retro emociones openspace; do
    section "Browser: $app"; APP="$app" BASE="$ORIGIN" npx --no-install playwright test -c e2e/playwright.config.mjs admin-abrir || FAILED=1
  done
  section "Browser: shell (feedback)"; BASE="$ORIGIN" npx --no-install playwright test -c e2e/playwright.config.mjs shell-feedback || FAILED=1
fi
[ $FAILED -eq 0 ] && { echo; echo "All green."; } || { echo; echo "FAILURES (see above)."; exit 1; }

#!/usr/bin/env bash
# Deploy an environment that targets Cloudflare: build, migrate its D1, load the admin key secret, publish, verify.
#   scripts/deploy.sh <env>        e.g. prod (or test, once its target is "cloudflare")
# Needs: `npx wrangler login`, resources created (scripts/cloudflare-bootstrap.sh), and ADMIN_KEY_<ENV> in .env.
# Publishing is an outward-facing action: run it deliberately. It takes a D1 backup first.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
ENV="${1:-prod}"
cfg() { python3 -I scripts/config.py "$@"; }
[ -f .env ] && { set -a; . ./.env; set +a; }
[ "$(cfg get "$ENV" target)" = cloudflare ] || { echo "Environment '$ENV' does not target Cloudflare (set \"target\": \"cloudflare\" in config/environments.json)." >&2; exit 2; }
PROJECT="$(cfg get "$ENV" cloudflare.pages_project)"; DB="$(cfg get "$ENV" cloudflare.d1_database)"; URL="$(cfg get "$ENV" cloudflare.url)"
[ -n "$(cfg get "$ENV" cloudflare.d1_id)" ] || { echo "No D1 id for $ENV. Run: scripts/cloudflare-bootstrap.sh $ENV" >&2; exit 1; }
KEYVAR="ADMIN_KEY_$(echo "$ENV" | tr '[:lower:]' '[:upper:]')"; KEY="${!KEYVAR:-}"
[ ${#KEY} -ge 12 ] || { echo "Set $KEYVAR (12+ characters) in .env first." >&2; exit 1; }
W=(npx --no-install wrangler)

B=".local/backups"; mkdir -p "$B"
"${W[@]}" d1 export "$DB" --remote --output "$B/$DB-$(date +%Y%m%d-%H%M).sql" >/dev/null 2>&1 && echo "D1 backup saved in $B/" || echo "(no backup: the database is new or empty)"

python3 -I scripts/build.py --env "$ENV"
cd "build/$ENV"
"${W[@]}" d1 migrations apply "$DB" --remote
printf %s "$KEY" | "${W[@]}" pages secret put APP_ADMIN_CLAVE --project-name="$PROJECT" >/dev/null
"${W[@]}" pages deploy public --project-name="$PROJECT" --branch=main --commit-dirty=true
cd ../..

echo "Verifying $URL ..."
for route in / /app-admin/ $(for a in $(cfg app-ids); do echo "/$a/"; done); do
  ok=0; for _ in 1 2 3 4 5 6; do [ "$(curl -s -o /dev/null -m 15 -w '%{http_code}' "$URL$route")" = 200 ] && { ok=1; break; }; sleep 5; done
  [ $ok -eq 1 ] && echo "  OK   $route" || { echo "  FAIL $route" >&2; exit 1; }
done
echo "Deployed: $URL"

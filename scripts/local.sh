#!/usr/bin/env bash
# Run one LOCAL environment (dev or test) with `wrangler pages dev`: functions + local D1 + local KV.
#
#   scripts/local.sh up      <env>   build, migrate the local database, start (waits until it answers)
#   scripts/local.sh down    <env>   stop
#   scripts/local.sh status  <env>   is it answering?
#   scripts/local.sh reset   <env>   stop and delete the local data of that environment
#   scripts/local.sh logs    <env>   tail the server log
#
# Admin key: ADMIN_KEY_<ENV> from .env (defaults: dev-admin-key / test-admin-key).
# Listens on 127.0.0.1 only. LOCAL_IP=0.0.0.0 opens it to your LAN (mind the admin key).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
ROOT="$PWD"
CMD="${1:-}"; ENV="${2:-dev}"
cfg() { python3 -I scripts/config.py "$@"; }

[ -f .env ] && { set -a; . ./.env; set +a; }
case "$(cfg get "$ENV" target)" in
  local) ;;
  "") echo "Unknown environment: $ENV" >&2; exit 2 ;;
  *) echo "Environment '$ENV' targets Cloudflare, not local. Use: make deploy ENV=$ENV (or set its target to local)." >&2; exit 2 ;;
esac

PORT="$(cfg get "$ENV" local.port)"
DATA="$ROOT/$(cfg get "$ENV" local.data_dir)"
DB="$(cfg get "$ENV" cloudflare.d1_database)"
KEYVAR="ADMIN_KEY_$(echo "$ENV" | tr '[:lower:]' '[:upper:]')"
KEY="${!KEYVAR:-$ENV-admin-key}"
IP="${LOCAL_IP:-127.0.0.1}"
SITE="$DATA/site"                       # the server runs from its own copy of the build, so rebuilding build/<env> (tests, `make build`) cannot break it
PIDFILE="$DATA/server.pid"; LOG="$DATA/server.log"
WRANGLER=(npx --no-install wrangler)

answers() { local c; c="$(curl -s -o /dev/null -m 5 -w '%{http_code}' "http://127.0.0.1:$PORT$1")"; [ "$c" != 000 ] && [ "$c" -lt 500 ]; }
alive() { answers /; }                  # quick check while starting
healthy() { local app; answers / || return 1; for app in $(cfg app-ids); do answers "/$app/" || { echo "  /$app/ does not answer" >&2; return 1; }; done; }
stop() {
  # Kill the whole process tree of this environment (npm -> wrangler -> workerd), not just the port listener,
  # so no orphan keeps the port busy. The pattern is specific to this repository and port.
  pkill -f "pages dev public --port $PORT " 2>/dev/null || true
  lsof -ti "tcp:$PORT" -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null || true
  for _ in 1 2 3 4 5; do lsof -ti "tcp:$PORT" -sTCP:LISTEN >/dev/null 2>&1 || break; sleep 1; done
  lsof -ti "tcp:$PORT" -sTCP:LISTEN 2>/dev/null | xargs kill -9 2>/dev/null || true
  rm -f "$PIDFILE"
}

case "$CMD" in
  up)
    command -v npx >/dev/null || { echo "Node.js is required (see .nvmrc)." >&2; exit 1; }
    [ -d node_modules/wrangler ] || { echo "Dependencies missing. Run: make setup" >&2; exit 1; }
    stop
    if [ "$(cfg get "$ENV" local.reset_on_up)" = "true" ]; then rm -rf "$DATA/state"; fi
    mkdir -p "$DATA"
    python3 -I scripts/build.py --env "$ENV" >/dev/null
    mkdir -p "$SITE" && rsync -a --delete "build/$ENV/" "$SITE/"
    (cd "$SITE" && "${WRANGLER[@]}" d1 migrations apply "$DB" --local --persist-to "$DATA/state" >"$DATA/migrate.log" 2>&1) \
      || { echo "Could not migrate the local database. Log: $DATA/migrate.log" >&2; tail -15 "$DATA/migrate.log" >&2; exit 1; }
    # Bindings are passed explicitly (--d1/--kv): `pages dev` does not read them from wrangler.toml in recent wrangler versions.
    # The local D1 id is the same one build.py writes into wrangler.toml, so migrations and server share one database file.
    # The whole background block is redirected: otherwise its subshell keeps our stdout open and `make dev | tee` would never return.
    ( cd "$SITE" && exec nohup "${WRANGLER[@]}" pages dev public --port "$PORT" --ip "$IP" --persist-to "$DATA/state" \
        --d1 "DB=local-$DB" --kv SKIN --binding APP_ADMIN_CLAVE="$KEY" ) </dev/null >"$LOG" 2>&1 &
    echo $! >"$PIDFILE"
    for _ in $(seq 1 90); do alive && break; sleep 1; done
    healthy || { echo "It did not start properly. Log: $LOG" >&2; tail -15 "$LOG" >&2; exit 1; }
    echo "[$ENV] up: http://localhost:$PORT/   admin key: $KEY   (admin: /app-admin/ and /<app>/admin/)"
    ;;
  down)   stop; echo "[$ENV] stopped" ;;
  status) if healthy; then echo "[$ENV] up: http://localhost:$PORT/  (shell and every app answer)"; else echo "[$ENV] down or unhealthy (port $PORT)"; exit 1; fi ;;
  reset)  stop; rm -rf "$DATA/state"; echo "[$ENV] local data deleted" ;;
  logs)   tail -f "$LOG" ;;
  *) sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac

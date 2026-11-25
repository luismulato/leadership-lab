#!/usr/bin/env bash
# Create the Cloudflare resources of an environment (Pages project, D1 database, KV namespace) and save their ids in
# config/environments.json. Idempotent: reuses what already exists. Requires `npx wrangler login`.
#   scripts/cloudflare-bootstrap.sh <env>        (prod by default)
# This creates resources in your Cloudflare account: run it deliberately.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
ENV="${1:-prod}"
cfg() { python3 -I scripts/config.py "$@"; }
W=(npx --no-install wrangler)
PROJECT="$(cfg get "$ENV" cloudflare.pages_project)"; DB="$(cfg get "$ENV" cloudflare.d1_database)"
[ -n "$PROJECT" ] || { echo "Unknown environment: $ENV" >&2; exit 2; }

echo "Environment $ENV -> Pages '$PROJECT', D1 '$DB', KV '$PROJECT-skin'"
"${W[@]}" whoami 2>&1 | grep -E "Account Name|│" | head -3 || true

# D1
d1_id() { "${W[@]}" d1 list --json 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const a=JSON.parse(s.slice(s.indexOf("[")));const x=a.find(d=>d.name===process.argv[1]);console.log(x?x.uuid:"")})' "$DB"; }
ID="$(d1_id)"
if [ -z "$ID" ]; then "${W[@]}" d1 create "$DB" >/dev/null; ID="$(d1_id)"; echo "D1 created: $DB"; else echo "D1 exists: $DB"; fi
[ -n "$ID" ] || { echo "Could not get the D1 id for $DB" >&2; exit 1; }
cfg set "$ENV" cloudflare.d1_id "$ID"

# KV
kv_id() { "${W[@]}" kv namespace list 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const a=JSON.parse(s.slice(s.indexOf("[")));const x=a.find(n=>n.title===process.argv[1]);console.log(x?x.id:"")})' "$PROJECT-skin"; }
KV="$(kv_id)"
if [ -z "$KV" ]; then "${W[@]}" kv namespace create "$PROJECT-skin" >/dev/null 2>&1 || true; KV="$(kv_id)"; echo "KV created: $PROJECT-skin"; else echo "KV exists: $PROJECT-skin"; fi
[ -n "$KV" ] || { echo "Could not get the KV id" >&2; exit 1; }
cfg set "$ENV" cloudflare.kv_id "$KV"

# Pages project
"${W[@]}" pages project create "$PROJECT" --production-branch=main >/dev/null 2>&1 && echo "Pages project created: $PROJECT" || echo "Pages project exists: $PROJECT"
echo "Done. Ids saved in config/environments.json (commit them). Next: make deploy ENV=$ENV"

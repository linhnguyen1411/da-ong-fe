#!/usr/bin/env bash
# prod diagnostic script for Da Ong app
# Usage: sudo bash diagnose_prod.sh /path/to/app [PORT]
APP_DIR=${1:-/var/www/daong}
PORT=${2:-3000}
OUT=/tmp/prod_diagnostic_$(date +%Y%m%d_%H%M%S).txt
set -e
exec > >(tee "$OUT") 2>&1
echo "==== PROD DIAGNOSTIC START $(date) ===="
echo "App dir: $APP_DIR"
echo "Port: $PORT"
echo
echo "--- uname / env ---"
uname -a
cat /etc/os-release 2>/dev/null || true
echo
echo "--- Current user ---"
whoami
id
echo
echo "--- Last 500 lines production.log (if exists) ---"
if [ -f "$APP_DIR/log/production.log" ]; then
  tail -n 500 "$APP_DIR/log/production.log"
else
  echo "No production.log at $APP_DIR/log/production.log"
fi
echo
echo "--- systemd app service (if exists) ---"
if command -v systemctl >/dev/null 2>&1; then
  systemctl list-units --type=service | grep -i puma || true
fi

echo
echo "--- Running processes (rails/puma) ---"
ps aux | egrep 'puma|rails|passenger' --color=auto || true

echo
echo "--- Listening ports ---"
if command -v ss >/dev/null 2>&1; then
  ss -ltnp | egrep ":$PORT|:3000|:3012" || true
elif command -v lsof >/dev/null 2>&1; then
  lsof -i -P -n | egrep LISTEN || true
else
  netstat -ltnp 2>/dev/null || true
fi

echo
echo "--- Docker status (if any) ---"
if command -v docker >/dev/null 2>&1; then
  docker ps --filter "name=daong" --format "table {{.ID}}\t{{.Image}}\t{{.Names}}\t{{.Status}}" || true
fi

echo
echo "--- Env vars (RAILS_ENV, RAILS_MASTER_KEY, DATABASE_URL) ---"
echo "RAILS_ENV=${RAILS_ENV:-unset}"
echo "RAILS_MASTER_KEY=${RAILS_MASTER_KEY:+(set)}"
echo "DATABASE_URL=${DATABASE_URL:+(set)}"

echo
echo "--- Check for verify_authenticity_token usage in controllers ---"
if [ -d "$APP_DIR" ]; then
  grep -nR "verify_authenticity_token" "$APP_DIR" || true
else
  echo "$APP_DIR not found, skipping grep"
fi

echo
echo "--- Git branch & last commits (if app dir exists) ---"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git rev-parse --abbrev-ref HEAD || true
  git --no-pager log -n 5 --pretty=oneline || true
  cd - >/dev/null
else
  echo "No git repo at $APP_DIR"
fi

echo
echo "--- Rails: migration status & DB connection (if app dir exists) ---"
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"
  if [ -f "bin/rails" ]; then
    RAILS_ENV=production bin/rails db:migrate:status || true
    RAILS_ENV=production bin/rails runner "begin; puts ActiveRecord::Base.connection.active?; rescue => e; puts 'DB ERROR: ' + e.message; end" || true
  else
    echo "No bin/rails in $APP_DIR"
  fi
  cd - >/dev/null
fi

echo
echo "--- HTTP tests ---"
echo "GET /api/v1/menu_items ->"
curl -sS -m 10 http://127.0.0.1:$PORT/api/v1/menu_items || echo "curl failed"

echo
echo "POST /api/v1/zalo/webhook ->"
curl -sS -m 10 -X POST http://127.0.0.1:$PORT/api/v1/zalo/webhook -H 'Content-Type: application/json' -d '{}' || echo "curl failed"

echo
echo "==== PROD DIAGNOSTIC END $(date) ===="

echo "Output saved to: $OUT"

# print location for convenience
ls -l "$OUT"

exit 0

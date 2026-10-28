#!/usr/bin/env bash
# Start Campaigner for phones/other devices on the same Wi-Fi.
# Usage (from repo root):  bash tools/lan-dev.sh
# Force restart if ports are busy:  FORCE=1 bash tools/lan-dev.sh
set -euo pipefail
cd "$(dirname "$0")/.."

GAME_PORT="${GAME_PORT:-5180}"
API_PORT="${API_PORT:-8787}"
FORCE="${FORCE:-0}"

lan_ip() {
  local ip=""
  ip="$(ipconfig getifaddr en0 2>/dev/null || true)"
  [[ -n "$ip" ]] || ip="$(ipconfig getifaddr en1 2>/dev/null || true)"
  if [[ -z "$ip" ]]; then
    ip="$(python3 -c "import socket; s=socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('8.8.8.8',80)); print(s.getsockname()[0]); s.close()")"
  fi
  printf '%s' "$ip"
}

port_busy() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

free_port() {
  local port="$1"
  local pids
  pids="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "Freeing port ${port} (pids: ${pids})"
    # shellcheck disable=SC2086
    kill $pids 2>/dev/null || true
    sleep 1
  fi
}

game_up() {
  curl -sf -m 2 "http://127.0.0.1:${GAME_PORT}/" | grep -q '<title>'
}

IP="$(lan_ip)"
if [[ -z "$IP" ]]; then
  echo "Could not find a LAN IP. Join Wi-Fi and try again." >&2
  exit 1
fi

export DATABASE_URL="${DATABASE_URL:-postgres://localhost/campaignrun_dev}"
export PORT="$API_PORT"
export CR_MIN_PLAYERS="${CR_MIN_PLAYERS:-1}"
export CR_ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173,http://localhost:${GAME_PORT},http://127.0.0.1:${GAME_PORT},http://${IP}:${GAME_PORT}"
export VITE_API_URL="http://${IP}:${API_PORT}"

print_urls() {
  echo
  echo "  Play on this Mac:      http://localhost:${GAME_PORT}/"
  echo "  Play on other devices: http://${IP}:${GAME_PORT}/"
  echo "  (same Wi-Fi as this Mac)"
  echo
}

# Already running — reuse instead of crashing on EADDRINUSE.
if [[ "$FORCE" != "1" ]] && port_busy "$GAME_PORT" && game_up; then
  print_urls
  echo "Already running on ports ${GAME_PORT}/${API_PORT}. Open the phone URL above."
  echo "To restart fresh:  FORCE=1 bash tools/lan-dev.sh"
  exit 0
fi

if [[ "$FORCE" == "1" ]]; then
  free_port "$GAME_PORT"
  free_port "$API_PORT"
fi

if port_busy "$GAME_PORT" || port_busy "$API_PORT"; then
  echo "Ports in use. Re-run with FORCE=1 to replace them:" >&2
  echo "  FORCE=1 bash tools/lan-dev.sh" >&2
  exit 1
fi

print_urls

cleanup() {
  [[ -n "${API_PID:-}" ]] && kill "$API_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

if [[ -f api/dist/server.js ]]; then
  if command -v pg_isready >/dev/null 2>&1; then
    pg_isready -h localhost >/dev/null 2>&1 || true
  fi
  node api/dist/server.js &
  API_PID=$!
  # Wait briefly so a bind failure is visible before Vite starts.
  sleep 0.4
  if ! kill -0 "$API_PID" 2>/dev/null; then
    echo "API failed to start on port ${API_PORT}." >&2
    exit 1
  fi
else
  echo "API not built (api/dist/server.js missing). Game still plays signed out."
  echo "To enable accounts/board:  pnpm --filter @cr/api build"
  echo
fi

exec pnpm --filter @cr/game exec vite --port "$GAME_PORT" --strictPort --host

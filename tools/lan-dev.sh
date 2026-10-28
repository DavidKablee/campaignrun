#!/usr/bin/env bash
# Start Campaigner for phones/other devices on the same Wi-Fi.
# Usage (from repo root):  bash tools/lan-dev.sh
set -euo pipefail
cd "$(dirname "$0")/.."

GAME_PORT="${GAME_PORT:-5180}"
API_PORT="${API_PORT:-8787}"

lan_ip() {
  local ip=""
  ip="$(ipconfig getifaddr en0 2>/dev/null || true)"
  [[ -n "$ip" ]] || ip="$(ipconfig getifaddr en1 2>/dev/null || true)"
  if [[ -z "$ip" ]]; then
    ip="$(python3 -c "import socket; s=socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('8.8.8.8',80)); print(s.getsockname()[0]); s.close()")"
  fi
  printf '%s' "$ip"
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

echo
echo "  Play on this Mac:     http://localhost:${GAME_PORT}/"
echo "  Play on other devices: http://${IP}:${GAME_PORT}/"
echo "  (same Wi-Fi as this Mac)"
echo

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
else
  echo "API not built (api/dist/server.js missing). Game still plays signed out."
  echo "To enable accounts/board:  pnpm --filter @cr/api build"
  echo
fi

exec pnpm --filter @cr/game exec vite --port "$GAME_PORT" --strictPort --host

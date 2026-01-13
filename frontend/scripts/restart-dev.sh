#!/usr/bin/env bash
set -euo pipefail

# Kill anything on ports 3000 or 3001, stop any running Next.js services/processes,
# then start Next.js dev on port 3000.
# Usage: ./scripts/restart-dev.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PORTS=(3000 3001)
TARGET_PORT=3000

# Try to stop any Next.js-related systemd units (user and system) matching common names.
stop_next_systemd_units() {
  echo "Checking for user-level systemd units related to Next/MaLangEE frontend..."
  # user units
  if command -v systemctl >/dev/null 2>&1; then
    USER_UNITS=$(systemctl --user list-units --type=service --all 2>/dev/null | awk '{print $1" "$2}' | grep -Ei 'malangee-frontend|next' || true)
    if [[ -n "$USER_UNITS" ]]; then
      echo "Found user units:\n$USER_UNITS"
      # Stop each unit name
      echo "$USER_UNITS" | awk '{print $1}' | while read -r u; do
        echo "Stopping user unit: $u"
        systemctl --user stop "$u" || true
      done
    fi

    echo "Checking for system-level units related to Next/MaLangEE frontend (may require sudo)..."
    SYS_UNITS=$(systemctl list-units --type=service --all 2>/dev/null | awk '{print $1" "$2}' | grep -Ei 'malangee-frontend|next' || true)
    if [[ -n "$SYS_UNITS" ]]; then
      echo "Found system units:\n$SYS_UNITS"
      echo "$SYS_UNITS" | awk '{print $1}' | while read -r u; do
        echo "Attempting to stop system unit: $u (may prompt for sudo)"
        sudo systemctl stop "$u" || true
      done
    fi
  fi
}

# Kill any Node/Next processes that appear to belong to this project or are Next servers.
stop_next_processes() {
  echo "Searching for Next/Node processes to stop..."
  # Match common patterns for Next.js servers and node processes running Next build/watch
  # Look for commands containing next, next-server, or the project's path
  PIDS=$(ps -eo pid,cmd | grep -E '/node_modules/.bin/next|next-server|next dev|\\bnext\\b' | grep -v grep | awk '{print $1}' | sort -u || true)

  # Also include processes that have our project path in the command (postcss/build workers, etc.)
  PROJECT_PIDS=$(ps -eo pid,cmd | grep "$ROOT_DIR" | grep -E 'node|next' | grep -v grep | awk '{print $1}' | sort -u || true)

  # Merge unique
  ALL_PIDS=$(printf "%s\n%s\n" "$PIDS" "$PROJECT_PIDS" | sort -u | sed '/^$/d' || true)

  if [[ -n "$ALL_PIDS" ]]; then
    echo "Found Next/Node-related PIDs to stop: $ALL_PIDS"
    # First try polite kill
    kill $ALL_PIDS 2>/dev/null || true
    sleep 1
    # If still present, try force kill
    STILL_ALIVE=$(ps -o pid= -p $(echo $ALL_PIDS | tr ' ' ',') 2>/dev/null || true)
    if [[ -n "$STILL_ALIVE" ]]; then
      echo "Some PIDs didn't exit, trying SIGKILL (may require sudo for other owners): $STILL_ALIVE"
      kill -9 $STILL_ALIVE 2>/dev/null || sudo kill -9 $STILL_ALIVE 2>/dev/null || true
    fi
  else
    echo "No Next/Node processes found to stop."
  fi
}

for PORT in "${PORTS[@]}"; do
  PIDS=$(lsof -t -i :"$PORT" || true)
  if [[ -n "$PIDS" ]]; then
    echo "Stopping processes on port $PORT: $PIDS"
    kill $PIDS || true
  fi
  # Fallback to pkill on known dev patterns (Next/Node) listening on the port
  pkill -f "next dev" 2>/dev/null || true
  pkill -f "node .*next dev" 2>/dev/null || true
  # Recheck if port is still in use
  if lsof -i :"$PORT" >/dev/null 2>&1; then
    echo "Warning: port $PORT is still in use. Will attempt broader Next service shutdown."
  fi
done

# Attempt to stop any systemd units and Next processes (covers cases where system/service restarts interfere)
stop_next_systemd_units
stop_next_processes

# Remove stale Next.js dev lock if present
rm -f .next/dev/lock

# Ensure target port is free before starting
if lsof -i :"$TARGET_PORT" >/dev/null 2>&1; then
  echo "Error: port $TARGET_PORT is still occupied after attempts to stop services. Resolve and rerun."
  ss -ltnp | grep ":$TARGET_PORT" || true
  exit 1
fi

# Start dev server on port 3000 (force PORT env)
echo "Starting Next.js dev server on port $TARGET_PORT..."
PORT=$TARGET_PORT NODE_ENV=development npm run dev

#!/usr/bin/env bash
set -euo pipefail

# manage-frontend.sh
# Stops any Next/Node processes that belong to this project (best-effort), clears locks and starts the systemd user service.
# Usage: ./scripts/manage-frontend.sh [start|stop|restart|status]

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="malangee-frontend.service"

cmd=${1:-restart}

function stop_manual_procs() {
  echo "Looking for frontend-related processes in $ROOT_DIR..."
  # find processes whose command contains the project frontend path
  PIDS=$(ps -eo pid,user,cmd | grep "$ROOT_DIR" | grep -E 'node|next' | awk '{print $1}' | sort -u || true)
  if [[ -n "$PIDS" ]]; then
    echo "Found PIDs to kill: $PIDS"
    kill $PIDS || true
    sleep 1
  else
    echo "No project-related Node/Next processes found."
  fi

  # Also kill processes listening on port 3000 owned by current user
  LOCAL_PIDS=$(lsof -t -i :3000 -sTCP:LISTEN -a -u "$(whoami)" || true)
  if [[ -n "$LOCAL_PIDS" ]]; then
    echo "Also killing user-owned listeners on :3000 -> $LOCAL_PIDS"
    kill $LOCAL_PIDS || true
  fi
}

function clear_lock() {
  echo "Removing stale .next/dev/lock if present"
  rm -f "$ROOT_DIR/.next/dev/lock" || true
}

function start_service() {
  echo "Starting user service: $SERVICE_NAME"
  systemctl --user daemon-reload || true
  systemctl --user enable --now $SERVICE_NAME
  sleep 1
  systemctl --user status $SERVICE_NAME --no-pager -l || true
}

function stop_service() {
  echo "Stopping user service: $SERVICE_NAME"
  systemctl --user stop $SERVICE_NAME || true
}

case "$cmd" in
  start)
    stop_manual_procs
    clear_lock
    start_service
    ;;
  stop)
    stop_service
    # try to kill any leftover project procs
    stop_manual_procs
    ;;
  restart)
    stop_service
    stop_manual_procs
    clear_lock
    start_service
    ;;
  status)
    systemctl --user status $SERVICE_NAME --no-pager -l || true
    ss -ltnp | grep -E ':3000|:3001' || true
    ;;
  *)
    echo "Unknown command: $cmd"
    echo "Usage: $0 [start|stop|restart|status]"
    exit 2
    ;;
esac


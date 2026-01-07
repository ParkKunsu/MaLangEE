#!/bin/bash

# Load environment variables from .env.local
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Check project root .env.local first
if [ -f "$PROJECT_ROOT/.env.local" ]; then
  export $(grep -v '^#' "$PROJECT_ROOT/.env.local" | xargs)
fi

# Check frontend/.env.local as fallback
if [ -f "$PROJECT_ROOT/frontend/.env.local" ]; then
  export $(grep -v '^#' "$PROJECT_ROOT/frontend/.env.local" | xargs)
fi

# Map FIGMA_API_KEY to FIGMA_ACCESS_TOKEN if needed
if [ -n "$FIGMA_API_KEY" ] && [ -z "$FIGMA_ACCESS_TOKEN" ]; then
  export FIGMA_ACCESS_TOKEN="$FIGMA_API_KEY"
fi

# Run Figma MCP server
npx -y figma-developer-mcp --stdio

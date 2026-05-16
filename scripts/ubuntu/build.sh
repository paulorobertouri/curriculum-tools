#!/bin/bash

set -euo pipefail

# Normalize to POSIX path
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

cd "$PROJECT_ROOT"

echo "Building application..."
pnpm build

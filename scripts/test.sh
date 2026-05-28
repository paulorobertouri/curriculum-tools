#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-all}"   # all | unit | e2e

cd "$ROOT"

case "$TARGET" in
  unit)
    pnpm run test
    ;;
  e2e)
    pnpm run test:e2e
    ;;
  all)
    pnpm run test
    pnpm run test:e2e
    ;;
  *)
    echo "Usage: $0 [all|unit|e2e]" >&2
    exit 1
    ;;
esac

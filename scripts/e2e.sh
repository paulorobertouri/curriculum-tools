#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:-test}"   # test | evidence

cd "$ROOT"

case "$MODE" in
  test)
    pnpm run test:e2e
    ;;
  evidence)
    pnpm exec playwright test tests/e2e/app.spec.ts --pass-with-no-tests
    ;;
  *)
    echo "Usage: $0 [test|evidence]" >&2
    exit 1
    ;;
esac

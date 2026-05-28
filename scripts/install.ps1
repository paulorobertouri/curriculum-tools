$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

Push-Location $Root
try {
    pnpm install
    pnpm exec playwright install chromium
} finally {
    Pop-Location
}

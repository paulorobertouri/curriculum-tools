# scripts/run.ps1 — start the Vite development server
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

Push-Location $Root
try {
    pnpm run dev
} finally {
    Pop-Location
}

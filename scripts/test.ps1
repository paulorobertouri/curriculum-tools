$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Target = if ($args.Count -gt 0) { $args[0] } else { "all" }

Push-Location $Root
try {
    switch ($Target) {
        "unit" { pnpm run test }
        "e2e"  { pnpm run test:e2e }
        "all"  { pnpm run test; pnpm run test:e2e }
        Default {
            Write-Error "Usage: .\scripts\test.ps1 [all|unit|e2e]"
            exit 1
        }
    }
} finally {
    Pop-Location
}

$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Mode = if ($args.Count -gt 0) { $args[0] } else { "test" }

Push-Location $Root
try {
    switch ($Mode) {
        "test" { pnpm run test:e2e }
        "evidence" { pnpm exec playwright test tests/e2e/app.spec.ts --pass-with-no-tests }
        Default {
            Write-Error "Usage: .\scripts\e2e.ps1 [test|evidence]"
            exit 1
        }
    }
} finally {
    Pop-Location
}

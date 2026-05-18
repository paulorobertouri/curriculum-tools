# Testing Strategy

Last updated: 2026-05-18

## Test Pyramid

- Unit tests (primary): domain, application use-cases, providers, storage, prompts.
- Component tests (targeted): rendering and interaction behavior for critical components.
- End-to-end tests: full user journeys and integration confidence.

## TDD Workflow

1. Add or update failing tests for desired behavior.
2. Implement minimal changes.
3. Refactor while keeping tests green.
4. Run full quality gates.

## BDD Naming

Use behavior-focused descriptions:

- `given valid input when processing then returns ranked candidates`
- `given provider fallback when primary fails then returns notice`

## Coverage Gates

Global Vitest thresholds:

- Statements: 82%
- Branches: 70%
- Functions: 80%
- Lines: 83%

## Mandatory Commands

- `pnpm run lint`
- `pnpm test --run`
- `pnpm test:coverage`
- `pnpm run build`
- `pnpm run test:e2e`

## Refactor Verification Matrix

- Provider refactors: provider adapter tests + response parsing tests + relevant use-case tests.
- Application boundary refactors: gateway/use-case tests + impacted component tests.
- UI refactors: component tests and e2e user flows.
- Prompt changes: prompt tests + e2e flow assertions using updated fixtures.

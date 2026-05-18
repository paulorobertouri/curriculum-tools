# Engineering Standards

Last updated: 2026-05-18

## Architecture (DDD-lite)

The codebase follows a layered browser-first architecture:

- `src/domain`: core business types and pure domain logic.
- `src/application`: use-cases that orchestrate workflows and depend on domain abstractions.
- `src/providers`: infrastructure adapters for OpenAI, Gemini, and DeepSeek.
- `src/storage`: persistence concerns (`localStorage`) behind modules.
- `src/components`: presentation and interaction layer.

Rules:

- Components should not embed provider orchestration logic.
- Use-cases should be testable without React.
- Domain modules must stay framework-agnostic.
- Provider-specific HTTP details stay in `src/providers`.

## Clean Code + DRY

- Keep functions small and intention-revealing.
- Prefer pure helpers in domain/application over duplicated UI logic.
- Keep side effects explicit at boundaries (provider calls, file extraction, storage).
- Favor composition over large components with mixed concerns.

## Design Patterns In Use

- Strategy pattern: provider adapters selected via `getProviderAdapter`.
- Use-case pattern (application service):
  - `runCandidateReviewUseCase`
  - `runHrRankingUseCase`
- Repository-like storage modules for local persistence.

## TDD Workflow

1. Add or update tests first for changed behavior.
2. Implement minimal code to satisfy tests.
3. Refactor while keeping tests green.
4. Run:
   - `pnpm test --run`
   - `pnpm run build`
   - `pnpm run lint`

## BDD-style Test Naming

Prefer behavior-driven naming:

- `given valid input when processing then returns ranked candidates`
- `given provider omission when processing then creates fallback entry`

## VS Code Workspace Baseline

Project includes:

- `.vscode/settings.json`
- `.vscode/extensions.json`
- `.vscode/tasks.json`
- `.vscode/launch.json`

These enforce format/lint consistency and speed up local workflows.

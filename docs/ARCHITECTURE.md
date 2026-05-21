# Curriculum Tools Architecture

Last planned: 2026-05-18

## Overview

Curriculum Tools is a browser-only Vite + React + TypeScript application.

- No backend in v1.
- Provider configuration is persisted in browser storage.
- CV text is extracted in-browser and sent to AI providers only after explicit user action.
- The app supports bring-your-own-key providers.

## Architecture Style

Layered Clean Architecture (DDD-lite):

- `src/domain`: business types, invariants, pure logic.
- `src/application`: use-cases and gateways that orchestrate workflows.
- `src/providers`: infrastructure adapters with provider-specific HTTP details.
- `src/storage`: persistence modules (`localStorage`).
- `src/components`: UI/presentation concerns.

Dependency direction:

- `components` -> `application` -> (`domain`, `providers`, `storage`)
- `domain` does not depend on framework or infrastructure modules.

## Current Provider Portfolio

Supported providers:

- OpenAI
- Gemini
- DeepSeek

Provider orchestration uses shared workflows in `src/providers/providerWorkflows.ts` and shared response extraction/parsing in `src/providers/responseParsing.ts`.

## Source Structure

```text
src/
  application/
    candidate/
    hr/
    provider/
    quality/
  components/
    common/
  domain/
    aiTypes.ts
    evaluationFixtures.ts
    hrChunking.ts
    hrMetricsSummary.ts
    reviewQuality.ts
    validation.ts
  files/
    extractText.ts
    exportResults.ts
  i18n/
    i18n.tsx
  prompts/
    candidatePrompt.ts
    candidateToolkitPrompt.ts
    hrPrompt.ts
    promptVersions.ts
  providers/
    index.ts
    deepseekProvider.ts
    geminiProvider.ts
    openaiProvider.ts
    providerUtils.ts
    providerWorkflows.ts
    responseParsing.ts
  storage/
    aiConfigStorage.ts
    candidateDraftStorage.ts
    evaluationHarnessStorage.ts
    hrDecisionsStorage.ts
```

## Application Boundaries

Application gateways/use-cases are the primary seams between UI and infrastructure:

- Candidate draft gateway: `src/application/candidate/candidateDraftGateway.ts`
- HR decisions gateway: `src/application/hr/hrDecisionsGateway.ts`
- Provider setup use-cases: `src/application/provider/providerSetupUseCases.ts`
- Quality harness execution/gateway:
  - `src/application/quality/runEvaluationHarnessUseCase.ts`
  - `src/application/quality/evaluationHarnessGateway.ts`

These keep components focused on rendering, interaction, and state transitions.

## Persistence

Storage keys:

- Provider config: `curriculum-tools.aiConfig.v1`
- Evaluation harness runs: `curriculum-tools.evaluationHarness.v1`

Storage modules validate payload shape and avoid logging sensitive values.

## Testing Architecture

- Unit tests cover domain, providers, storage, prompts, and application use-cases.
- E2E tests cover first-run setup, candidate flow, HR flow, chunking behavior, and partial extraction behavior.
- Coverage gates are enforced in Vitest.

## Architectural Decisions

See ADRs:

- `docs/adr/0001-provider-workflow-standardization.md`
- `docs/adr/0002-layer-boundaries-and-application-gateways.md`
- `docs/adr/0003-testing-strategy-and-coverage-gates.md`

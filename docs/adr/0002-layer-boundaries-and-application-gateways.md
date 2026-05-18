# ADR 0002: Layer Boundaries and Application Gateways

- Status: Accepted
- Date: 2026-05-18

## Context

Some UI components depended directly on storage and provider infrastructure modules. This created boundary leakage and made it harder to test presentation logic independently from persistence/provider concerns.

## Decision

Introduce application gateways/use-cases and route components through them:

- Candidate draft persistence via `src/application/candidate/candidateDraftGateway.ts`.
- HR decision persistence via `src/application/hr/hrDecisionsGateway.ts`.
- Provider setup interactions via `src/application/provider/providerSetupUseCases.ts`.
- Evaluation harness storage/execution via:
  - `src/application/quality/evaluationHarnessGateway.ts`
  - `src/application/quality/runEvaluationHarnessUseCase.ts`

Components now depend on application APIs rather than direct storage/provider modules.

## Consequences

Positive:

- Better alignment with Clean Architecture and DIP.
- Presentation layer is less coupled to infrastructure details.
- New tests can target use-case seams directly.

Trade-offs:

- Slight increase in file count and indirection.
- Requires discipline to keep business logic in application/domain layers.

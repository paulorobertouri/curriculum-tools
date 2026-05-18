# ADR 0001: Provider Workflow Standardization

- Status: Accepted
- Date: 2026-05-18

## Context

Provider adapters had duplicated workflow logic for candidate review and HR ranking orchestration. Request/parse code paths were spread across each provider file, increasing maintenance cost and making behavior drift likely when adding new providers.

## Decision

Standardize provider orchestration via shared application-level helpers:

- Add `src/providers/providerWorkflows.ts` to host common candidate + HR workflow orchestration.
- Keep provider-specific HTTP request shape inside each provider adapter.
- Move shared response extractors into `src/providers/responseParsing.ts`.

## Consequences

Positive:

- Reduced duplication and lower risk of inconsistent parsing behavior.
- New providers can be introduced with less boilerplate.
- Tests now validate shared extractor behavior explicitly.

Trade-offs:

- Shared helpers become a central dependency and require careful review on changes.
- Provider adapters remain responsible for endpoint-specific request payloads.

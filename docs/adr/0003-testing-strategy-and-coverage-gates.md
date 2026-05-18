# ADR 0003: Testing Strategy and Coverage Gates

- Status: Accepted
- Date: 2026-05-18

## Context

The project had strong domain/provider tests but weaker explicit coverage around newly introduced application boundaries. Coverage gates were lower than desired for the current reliability goals.

## Decision

- Add tests for newly introduced application gateways/use-cases.
- Keep a mixed strategy:
  - Unit tests for domain, providers, storage, prompts, and application use-cases.
  - End-to-end tests for full user flows.
- Raise global coverage gates in Vitest from 80% to 82% for:
  - Statements (82%)
  - Branches (70%)
  - Functions (80%)
  - Lines (83%)

## Consequences

Positive:

- Higher minimum quality bar for regressions.
- Better confidence during refactoring and provider evolution.

Trade-offs:

- CI/runtime can increase as test suites grow.
- Contributors must add tests for architectural seams as part of feature work.

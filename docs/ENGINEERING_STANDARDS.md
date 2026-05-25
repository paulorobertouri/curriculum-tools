# Engineering Standards

Last updated: 2026-05-25

## Architecture (Adapter)

The codebase follows an adapter-oriented, domain/feature-first structure:

- Endpoints/components handle translation, validation, and interaction concerns.
- Handlers own one use case or query each.
- Services orchestrate business behavior across collaborators.
- Repositories/clients encapsulate provider and storage persistence details.

Rules:

- Keep domain logic outside transport/UI adapters.
- Avoid pass-through layers with no behavior.
- Add interfaces only when multiple implementations or stable seams justify them.
- Prefer business boundary folder names over technical names.

## Clean Code + Pragmatism

- Keep modules focused on one responsibility.
- Extract only when code is hard to read, hard to test, or truly reused.
- Prefer concrete dependencies inside a bounded context.

## Async and Parallelism

- Keep I/O async end-to-end.
- Run independent I/O in parallel when safe.
- Propagate cancellation through adapter layers.

## Test Structure

- Mirror `src` structure in `tests`.
- Keep tests close to their domain/feature boundary.

## ADR Requirement

When adapter boundaries or folder strategy changes, update ADRs in `docs/adr`.

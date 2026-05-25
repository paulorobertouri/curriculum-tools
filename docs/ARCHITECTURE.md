# Curriculum Tools Architecture

Curriculum Tools now follows the monorepo **Adapter Architecture Standards**.

## Core Layout

- **Domain-first** when boundaries are stable (`candidate`, `hr`, `provider`, `quality`).
- **Feature-first** when work is short-lived and delivery-slice oriented.
- Keep adapters at the boundary and domain logic as the source of truth.

## Adapter Responsibilities

- **Components/endpoints**: UI and transport translation only.
- **Handlers**: one use case/query each, no framework-specific return types.
- **Services**: orchestration, policies, and calculations across collaborators.
- **Repositories/clients**: provider and storage details encapsulated.

## Path Convention

```text
{backend|frontend}/{src|tests|docs}/{domain|feature}/{class file}
```

For this frontend app, use:

- `frontend/src/{domain|feature}/{Component|Handler|Service}.ts(x)`
- `frontend/tests/{domain|feature}/{Component|Service}.test.ts(x)`

## Working Rules

- No extra service layers without behavior.
- Add interfaces only when a stable seam or multiple implementations exist.
- Keep async flows non-blocking and parallelize independent calls safely.

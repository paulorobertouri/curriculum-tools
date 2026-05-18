# Contributing

## Development Setup

1. Install dependencies:
   - `pnpm install`
2. Start dev server:
   - `pnpm run dev`

## Quality Gates

Before opening a PR, run:

1. `pnpm run format`
2. `pnpm run lint`
3. `pnpm test --run`
4. `pnpm test:coverage`
5. `pnpm run build`
6. `pnpm run test:e2e`

## Architecture Rules

- Keep domain logic in `src/domain` and framework-agnostic.
- Keep orchestration in `src/application`.
- Keep provider HTTP details in `src/providers`.
- Keep `src/components` focused on presentation and interaction.
- Avoid direct component imports from storage/provider internals when application gateways exist.

## Testing Rules (TDD + BDD style)

- Write/update tests before changing behavior.
- Use behavior-oriented test names.
- Add tests for any new application gateway/use-case.
- Keep provider changes covered by adapter tests.

## Privacy Rules

- Do not log API keys or unredacted sensitive prompt fields.
- Keep prompt redaction enabled by default.
- Avoid introducing provider calls before explicit user action.

## Pull Request Checklist

- [ ] Refactor scope and rationale documented
- [ ] Tests added/updated
- [ ] Coverage gates pass
- [ ] Lint and build pass
- [ ] E2E smoke flows pass
- [ ] Docs and ADRs updated when architecture changes

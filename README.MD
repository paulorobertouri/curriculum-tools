# Curriculum Tools

Browser-first AI tools for candidates and HR teams. Users bring their own Gemini, OpenAI, or DeepSeek API key, validate it in the app, and then process CVs directly from the browser.

This project is licensed under the MIT License. See [LICENSE](LICENSE).

## Features

- Provider setup gate with `Test and Save`.
- Valid provider config saved in `localStorage`.
- Candidate CV Reviewer with role-specific score and recommendations.
- HR CV Ranking with multiple CV uploads, summary metrics, and ranked justifications.
- TXT, PDF, and DOCX text extraction.
- Clear unsupported message for legacy DOC files.
- Explicit empty, loading, and ready states in the result panels.

## Commands

- `pnpm install` - install dependencies.
- `pnpm run dev` - start the Vite dev server.
- `pnpm run build` - typecheck and build production assets.
- `pnpm run build:pages` - build production assets for GitHub Pages at `/curriculum-tools/`.
- `pnpm run publish` - build and copy the site to `../paulorobertouri.github.io/curriculum-tools`.
- `pnpm test` - run unit and component tests once.
- `pnpm test:coverage` - run unit and component tests with coverage.
- `pnpm run lint` - run ESLint.
- `pnpm run test:e2e` - run Playwright smoke tests.

Playwright journey screenshots are written to `tests/e2e/evidence/`.

## Privacy Note

API keys are stored in this browser's `localStorage`. CV content is sent directly from the browser to the selected AI provider only when the user clicks `Process`.

## Browser-Only Limitations

- API keys are stored in plain browser storage (`localStorage`) for this origin.
- There is no backend proxy in v1, so provider calls are made directly from the browser.
- Legacy `.doc` parsing is not reliably supported. Convert files to `.docx` or `.pdf`, or paste CV text.

## Screenshots

### Provider Setup

Connect your Gemini, OpenAI, or DeepSeek API key before using any tool.

![Provider setup gate — first run](tests/e2e/evidence/setup-00-first-run.png)

### Candidate CV Reviewer

Review one CV against a target role and receive a score, strengths, gaps, rewritten bullets, a cover letter draft, and suggested interview questions.

![Candidate CV Reviewer — file upload ready](tests/e2e/evidence/candidate-01-upload-ready.png)

![Candidate CV Reviewer — review result with score and metrics](tests/e2e/evidence/candidate-00-review-result.png)

### HR CV Ranking

Upload multiple CVs for one role, compare candidates by score, and capture hiring decisions with shortlist, hold, reject, or interview tags.

![HR CV Ranking — ranking result with metrics and candidate cards](tests/e2e/evidence/hr-00-ranking-result.png)

### Quality Evaluation Harness

Run fixed fixture packs to track prompt quality, score drift, and ranking stability across model or prompt changes.

![Quality Evaluation Harness — harness run with delta and drift metrics](tests/e2e/evidence/quality-00-harness-run.png)

## Documentation

- [Product Plan](docs/PRODUCT_PLAN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Engineering Standards](docs/ENGINEERING_STANDARDS.md)
- [TODO](TODO.MD)

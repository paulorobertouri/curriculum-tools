# Curriculum Tools TODO

Last planned: 2026-05-15
Last implementation pass: 2026-05-16

## Goal

Create a browser-first AI application for curriculum and recruiting workflows. Users bring their own Gemini, OpenAI, or DeepSeek API key, validate the provider from the app, then use Candidate and HR tools without a backend.

## Current Status

- [x] Vite + React + TypeScript app scaffolded.
- [x] TailwindCSS, Vitest, Testing Library, ESLint, and Playwright are wired.
- [x] Provider setup gate implemented for Gemini, OpenAI, and DeepSeek.
- [x] Provider adapters implemented behind a shared interface.
- [x] Candidate CV Reviewer implemented.
- [x] HR CV Ranking implemented.
- [x] TXT, PDF, and DOCX extraction utilities implemented.
- [x] Legacy DOC files show a clear unsupported message.
- [x] Unit/component smoke tests and Playwright setup smoke tests pass.
- [x] Large HR batches are chunked and merged deterministically.
- [x] Candidate and HR E2E result-rendering flows have deeper coverage.
- [x] HR partial extraction failures are covered by E2E while valid files still process.

## Milestone 1: Project Scaffold

- [x] Initialize `curriculum-tools` as a Vite + React + TypeScript app.
- [x] Add TailwindCSS, Vitest, Testing Library, ESLint, Prettier, and Playwright-ready setup.
- [x] Keep the structure close to the existing `vite-react-template` conventions in this repository.
- [x] Add root commands for `dev`, `build`, `lint`, `format`, `test`, `test:coverage`, and `test:e2e`.
- [x] Add a minimal responsive shell with setup gate, provider status, and tool tabs.

Acceptance criteria:

- App builds with TypeScript.
- Unit test command runs successfully.
- First screen is the provider setup when no valid config exists in `localStorage`.

## Milestone 2: Provider Configuration

- [x] Define provider types for `gemini`, `openai`, and `deepseek`.
- [x] Define default model constants in one place.
- [x] Build a provider setup form with provider, API key, optional model, and `Test and Save`.
- [x] Save validated config in `localStorage` under `curriculum-tools.aiConfig.v1`.
- [x] Add actions to retest, edit, and clear saved provider config.
- [x] Display privacy copy explaining that API keys and CV content are handled in the browser and sent to the selected provider.

Acceptance criteria:

- Invalid keys do not unlock the app.
- Valid provider responses unlock the Candidate and HR tools.
- Reloading the app with a saved valid config bypasses setup.
- Clearing config returns the user to setup.

## Milestone 3: AI Provider Adapters

- [x] Create one provider interface with:
  - `testConnection(config)`
  - `reviewCandidateCv(input)`
  - `rankHrCvs(input)`
- [x] Implement OpenAI using the Responses API.
- [x] Implement Gemini using the `generateContent` REST endpoint.
- [x] Implement DeepSeek using the OpenAI-compatible chat completions endpoint.
- [x] Normalize provider errors into user-facing messages.
- [x] Add robust response parsing for JSON wrapped in Markdown fences, plain JSON, and malformed/missing fields.

Acceptance criteria:

- Each adapter maps requests and responses through a shared application contract.
- Provider-specific HTTP details do not leak into UI components.
- Tests mock `fetch` and verify endpoints, headers, payloads, success, and failure handling.

## Milestone 4: Candidate CV Reviewer

- [x] Build a Candidate tab with job title, job description, CV text area, CV file upload, and `Process`.
- [x] Support pasted CV text and `.txt`, `.pdf`, `.docx` uploads.
- [x] Treat `.doc` as unsupported or best-effort with a clear message.
- [x] Extract file text only after the user chooses a file; send content only after clicking `Process`.
- [x] Render score, summary, strengths, gaps, recommended changes, and rewritten bullet suggestions.

Acceptance criteria:

- Required fields are validated before processing.
- Loading and error states are clear.
- Score is constrained to `0.0` through `10.0`.
- AI output remains readable even if optional sections are missing.

## Milestone 5: HR CV Ranking

- [x] Build an HR tab with job title, job description, multiple CV upload, and `Process`.
- [x] Extract each CV into an internal candidate record with filename, text, status, and optional error.
- [x] Send all valid CV texts to the provider in one ranking request when size is reasonable.
- [x] If content is too large for a single request, process in chunks and merge results deterministically.
- [x] Render a ranked list with filename/name, score, justification, strengths, concerns, and interview recommendation.

Acceptance criteria:

- Multiple files can be selected and reviewed before processing.
- Per-file extraction failures do not block valid files.
- Results are sorted from highest score to lowest score.
- The UI shows enough context for HR to understand why each score was assigned.

## Milestone 6: Tests And Quality

- [x] Add unit tests for localStorage config behavior.
- [x] Add unit tests for provider adapters and normalized errors.
- [x] Add unit tests for JSON parsing and score validation.
- [x] Add unit tests for file extraction success and failure paths.
- [x] Add component tests for setup gate, Candidate form, and HR form.
- [x] Add E2E smoke tests using mocked provider responses.

Acceptance criteria:

- `test`, `build`, and `lint` pass.
- E2E smoke verifies first-run setup, successful provider test, Candidate result rendering, and HR result rendering.

## Milestone 7: Documentation

- [x] Keep `docs/PRODUCT_PLAN.md` updated when scope changes.
- [x] Keep `docs/ARCHITECTURE.md` updated when implementation choices change.
- [x] Add a short README after the app is scaffolded.
- [x] Document browser-only limitations, especially API key storage and legacy `.doc` parsing.

Acceptance criteria:

- A new engineer can implement from the docs without needing product decisions.
- Provider API references are rechecked before coding.

## Milestone 8: UI/UX, Localization, Metrics, Prompt Quality

### UI/UX/Layout Improvement Plan

- [x] Add first metrics visualization blocks in Candidate and HR result panels.
- [ ] Improve spacing hierarchy and responsive density for large HR result lists.
- [ ] Add empty/loading/success visual states with stronger visual differentiation.
- [ ] Add accessibility pass for keyboard navigation, focus visibility, and ARIA updates.

### Localization Plan (en-US, pt-BR, es-ES)

- [x] Add i18n foundation with locale persistence and runtime language switcher.
- [x] Start localizing setup, status, candidate, and HR core UI copy.
- [x] Complete localization for remaining static strings and error-state variants.
- [x] Add locale-aware formatting for scores/dates where applicable.
- [x] Add tests for language switching and key translated flows.

### Metrics Graphs Plan

- [x] Add initial in-app score bars for Candidate and HR metrics dashboards.
- [x] Add recommendation distribution graph for HR (`strong_yes`, `yes`, `maybe`, `no`).
- [x] Add trend/comparison view between batch average and top candidate score.
- [x] Add export-ready metrics summary model for future CSV/JSON reporting.

### Prompt And Metrics Quality Plan

- [x] Improve candidate and HR prompts with stricter rubric and evidence constraints.
- [x] Add prompt versioning constants to track changes over time.
- [x] Add first prompt quality evaluation fixture tests.
- [ ] Add evaluation harness with mocked CV fixtures to compare prompt quality deltas.
- [ ] Add calibration checks to reduce score drift across providers/models.

Acceptance criteria:

- UI remains clear on desktop and mobile with higher signal-to-noise for results.
- User can switch language between en-US, pt-BR, and es-ES from the app UI.
- Result panels include meaningful visual metrics, not only text blocks.
- Prompt outputs become more consistent, evidence-grounded, and auditable.

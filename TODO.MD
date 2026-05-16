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
- [ ] Add component tests for setup gate, Candidate form, and HR form.
- [x] Add E2E smoke tests using mocked provider responses.

Acceptance criteria:
- `test`, `build`, and `lint` pass.
- E2E smoke verifies first-run setup, successful provider test, Candidate result rendering, and HR result rendering.

## Milestone 7: Documentation

- [ ] Keep `docs/PRODUCT_PLAN.md` updated when scope changes.
- [ ] Keep `docs/ARCHITECTURE.md` updated when implementation choices change.
- [ ] Add a short README after the app is scaffolded.
- [ ] Document browser-only limitations, especially API key storage and legacy `.doc` parsing.

Acceptance criteria:
- A new engineer can implement from the docs without needing product decisions.
- Provider API references are rechecked before coding.

# Curriculum Tools Product Plan

Last planned: 2026-05-16

## Why

Candidates and HR teams often need fast, structured feedback on resumes, but most tools hide their scoring logic, require accounts, or centralize sensitive CV data. Curriculum Tools should be a lightweight, transparent, browser-first application where users bring their own AI provider key and choose when CV content is sent for analysis.

The first version optimizes for speed, privacy awareness, and practical output:

- Candidates get a score and concrete suggestions for a target role.
- HR users get a ranked CV list with justifications for a specific job.
- The app avoids operating a backend in v1, reducing deployment and data-retention complexity.

## What

Build a Vite + React + TypeScript + TailwindCSS application with Vitest coverage. The application has three main experiences:

1. Provider setup
2. Candidate CV Reviewer
3. HR CV Ranking

The app is bring-your-own-key. The user chooses Gemini, OpenAI, or DeepSeek, enters an API key, optionally edits a model name, and clicks `Test and Save`. The app sends a minimal prompt to confirm the selected provider responds successfully. Only after a successful test does it save the config in `localStorage` and unlock the tools.

## Audience

Primary users:

- Candidates tailoring CVs for a job posting.
- HR/recruiting users comparing many CVs against one job description.

Secondary users:

- Developers or power users who already have AI provider keys.
- Small teams that want a static, local-first workflow before deciding whether to add a backend later.

## Product Principles

- User control: CVs are sent only after the user clicks `Process`.
- Clear trust boundary: explain that API keys and CV content are handled in the browser and sent to the selected provider.
- Practical results: scores must include reasoning and recommended next actions.
- Provider portability: UI and domain logic should not depend on one AI vendor.
- Static-first: v1 should run without a custom backend.

## User Flow: First Visit

1. User opens the app.
2. App checks `localStorage` for `curriculum-tools.aiConfig.v1`.
3. If no config exists, the setup screen is shown.
4. User selects provider: Gemini, OpenAI, or DeepSeek.
5. User enters API key and optionally changes the model.
6. User clicks `Test and Save`.
7. App sends a small test prompt, such as `Reply with only: hello`.
8. If the provider responds successfully, app saves config and opens the tools.
9. If the provider fails, app shows an actionable error and remains on setup.

## User Flow: Returning Visit

1. User opens the app.
2. App reads saved config from `localStorage`.
3. If the config shape is valid, the app opens the tools directly.
4. The provider status area shows selected provider and model.
5. User can retest, edit, or clear config.

The app should not silently call the provider on every visit. Retesting should be explicit to avoid unnecessary token usage.

## Candidate CV Reviewer

Inputs:

- Job title.
- Job description.
- CV content by pasted text or uploaded file.
- Supported uploads: `.txt`, `.pdf`, `.docx`.
- Legacy `.doc`: show a clear unsupported or limited-support message unless a reliable browser parser is added.

Processing:

- Validate required fields.
- Extract text from uploaded file if needed.
- Send job title, job description, and CV text to the selected provider.
- Request structured JSON output.
- Parse, validate, and render the result.

Output:

- Score from `0.0` to `10.0`.
- Short overall summary.
- Strengths matched to the role.
- Gaps or risks.
- Recommended CV changes.
- Suggested rewritten bullets.

Success criteria:

- Candidate can understand what to improve without reading raw AI prose.
- Score is visible but not the only information.
- Result is specific to the target job, not generic resume advice.

## HR CV Ranking

Inputs:

- Job title.
- Job description.
- Multiple CV uploads.
- Supported uploads: `.txt`, `.pdf`, `.docx`.

Processing:

- Extract each file into a candidate item with filename, text, and status.
- Keep per-file errors visible.
- Send valid CVs to AI only when user clicks `Process`.
- Prefer one ranking request for small batches.
- For large batches, split into chunks and merge results deterministically by score, then filename/id as tie-breakers.

Output:

- Ranked candidate list.
- Candidate name if detected by the model, otherwise filename.
- Score from `0.0` to `10.0`.
- A compact summary row showing candidate count, average score, and the top candidate before the detailed metrics.
- Batch metrics showing average score, top score, lowest score, and a comparison view between the average and top candidate.
- Score justification.
- Strengths.
- Concerns.
- Interview recommendation.

Success criteria:

- HR can compare candidates quickly.
- Ranking includes enough explanation to audit the score.
- Failed file extraction does not block all valid candidates.

## Scope

In scope for v1:

- Static React application.
- Bring-your-own-key provider setup.
- Browser `localStorage` config persistence.
- Gemini, OpenAI, and DeepSeek adapters.
- Candidate CV review.
- HR CV ranking.
- Text, PDF, and DOCX extraction.
- Tests for storage, adapters, parsing, forms, and smoke flows.

Out of scope for v1:

- Backend API proxy.
- User accounts.
- Team sharing.
- Server-side file storage.
- Payment or subscription features.
- Long-term CV history.
- Fine-tuning.
- ATS integrations.

## UX Requirements

- First screen should be setup when no valid saved config exists.
- App should use a work-focused interface, not a marketing landing page.
- Candidate and HR tools should be reachable through tabs or segmented navigation.
- Buttons should be disabled during async work.
- Errors should be concise and actionable.
- Empty, loading, and completed result states should be visually distinct so users can tell when work is still running versus finished.
- Results should be scannable, with the score prominent and explanations grouped.
- Use icons for provider status and actions when available through `lucide-react`.
- Avoid sending content before explicit user action.

## Privacy And Security Copy

The app should include visible copy similar to:

> Your API key is stored in this browser's localStorage. CV text is sent directly from this browser to the selected AI provider only when you click Process. Do not use this app with data you are not allowed to send to that provider.

Implementation notes:

- Do not log API keys.
- Do not show the full saved key after saving.
- Mask saved keys in the UI.
- Provide `Clear saved provider` action.
- Consider a later backend proxy if the app becomes public-facing at scale.

## Provider Documentation References

Recheck provider docs during implementation. API endpoints, model names, and response formats can change.

- OpenAI Responses API: `POST https://api.openai.com/v1/responses`
- Gemini REST content generation: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- DeepSeek chat completions: `POST https://api.deepseek.com/chat/completions`

Official docs:

- OpenAI Responses API: https://platform.openai.com/docs/api-reference/responses/create
- Gemini API docs: https://ai.google.dev/gemini-api/docs
- Gemini API reference: https://ai.google.dev/api
- DeepSeek chat completions: https://api-docs.deepseek.com/api/create-chat-completion

## Open Questions For Future Implementation

- Should default model names be pinned to stable low-cost defaults or provider-recommended current models?
- Should HR batch processing cap file count or total extracted characters in v1?
- Should JSON schema enforcement be enabled only for OpenAI, with prompt-based JSON for Gemini and DeepSeek?
- Should the app include an export-to-CSV action for HR rankings in v1 or defer it?

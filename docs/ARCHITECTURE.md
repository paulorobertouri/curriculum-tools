# Curriculum Tools Architecture

Last planned: 2026-05-16

## Overview

Curriculum Tools should be a browser-only Vite + React + TypeScript application. It has no backend in v1. The app stores validated provider configuration in `localStorage`, extracts CV text in the browser, and sends prompts directly to the selected AI provider.

Recommended stack:

- Vite
- React
- TypeScript
- TailwindCSS
- Vitest
- Testing Library
- Playwright
- `lucide-react` for icons
- `pdfjs-dist` for PDF text extraction
- `mammoth` for DOCX text extraction

## Suggested Source Structure

```text
src/
  app/
    App.tsx
    AppShell.tsx
  components/
    ProviderSetup.tsx
    ProviderStatus.tsx
    CandidateReviewer.tsx
    HrRanker.tsx
    ResultScore.tsx
    FilePicker.tsx
  domain/
    aiTypes.ts
    candidateReview.ts
    hrRanking.ts
    validation.ts
  providers/
    index.ts
    openaiProvider.ts
    geminiProvider.ts
    deepseekProvider.ts
    responseParsing.ts
  storage/
    aiConfigStorage.ts
  files/
    extractText.ts
  prompts/
    candidatePrompt.ts
    hrPrompt.ts
  test/
    mocks.ts
```

This structure keeps UI, domain contracts, provider HTTP details, storage, file parsing, and prompt construction separate.

## Core Types

Use one app-level provider config type:

```ts
export type AiProvider = 'openai' | 'gemini' | 'deepseek';

export type AiConfig = {
  provider: AiProvider;
  apiKey: string;
  model: string;
  savedAt: string;
};
```

Use one shared provider interface:

```ts
export type AiProviderAdapter = {
  testConnection(config: AiConfig): Promise<TestResult>;
  reviewCandidateCv(
    config: AiConfig,
    input: CandidateReviewInput,
  ): Promise<CandidateReview>;
  rankHrCvs(config: AiConfig, input: HrRankingInput): Promise<HrRankingResult>;
};
```

Candidate input:

```ts
export type CandidateReviewInput = {
  jobTitle: string;
  jobDescription: string;
  cvText: string;
};
```

Candidate output:

```ts
export type CandidateReview = {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  rewrittenBullets: string[];
};
```

HR input:

```ts
export type HrRankingInput = {
  jobTitle: string;
  jobDescription: string;
  cvs: Array<{
    id: string;
    filename: string;
    text: string;
  }>;
};
```

HR output:

```ts
export type HrRankingResult = {
  candidates: Array<{
    id: string;
    filename: string;
    detectedName?: string;
    score: number;
    justification: string;
    strengths: string[];
    concerns: string[];
    interviewRecommendation: 'strong_yes' | 'yes' | 'maybe' | 'no';
  }>;
};
```

HR chunking behavior in the current implementation:

- Send one request when the payload stays within thresholds.
- Split requests when CV count is above 8 or extracted text exceeds about 50,000 characters.
- Process chunks sequentially and merge partial rankings deterministically.
- Merge ordering is score descending, then filename ascending, then candidate ID ascending.
- If a provider response omits a candidate, include a fallback entry with score `0.0` and a clear justification.

## Storage

Store provider config in `localStorage` using:

```text
curriculum-tools.aiConfig.v1
```

Storage module responsibilities:

- Read config.
- Validate object shape.
- Save config after successful provider test.
- Clear config.
- Never log config.
- Mask key in UI, for example `sk-...abcd`.

Do not treat the presence of localStorage data as proof that the provider still works. It only means the config was previously saved after a successful test. Retesting should be user-triggered from the provider status area.

## Provider Setup Gate

Startup algorithm:

1. Read config from storage.
2. If config exists and matches expected shape, show the main app.
3. If config is missing or invalid, show setup.
4. On setup submit, call `testConnection`.
5. Save only after success.
6. On failure, show the provider error and remain on setup.

`Test and Save` prompt:

```text
Reply with only this exact word: hello
```

Success condition:

- HTTP request succeeds.
- Provider response contains text.
- Text includes or equals `hello` after trimming and case normalization.

Be tolerant of punctuation or extra whitespace, but not empty responses.

## Provider API Notes

These notes were checked against official docs on 2026-05-15. Recheck during implementation.

### OpenAI

Use the Responses API:

```http
POST https://api.openai.com/v1/responses
Authorization: Bearer <api-key>
Content-Type: application/json
```

Minimal payload shape:

```json
{
  "model": "gpt-5-mini",
  "input": "Reply with only this exact word: hello"
}
```

For structured results, use `text.format` with `type: "json_schema"` where the selected model supports it. Keep a fallback parser in the app for unexpected non-schema responses.

Reference: https://platform.openai.com/docs/api-reference/responses/create

### Gemini

Use REST `generateContent`:

```http
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
x-goog-api-key: <api-key>
Content-Type: application/json
```

Minimal payload shape:

```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "Reply with only this exact word: hello"
        }
      ]
    }
  ]
}
```

Default model should be defined in a constant and rechecked during implementation. The implementation uses stable `gemini-2.5-flash` as the default.

Reference: https://ai.google.dev/gemini-api/docs

### DeepSeek

Use the OpenAI-compatible chat completions endpoint:

```http
POST https://api.deepseek.com/chat/completions
Authorization: Bearer <api-key>
Content-Type: application/json
```

Minimal payload shape:

```json
{
  "model": "deepseek-chat",
  "messages": [
    {
      "role": "user",
      "content": "Reply with only this exact word: hello"
    }
  ]
}
```

For structured output, request JSON in the prompt and, if supported by the selected DeepSeek model/API mode, enable JSON output according to current DeepSeek docs.

Reference: https://api-docs.deepseek.com/api/create-chat-completion

## Prompt Design

Prompts should be strict and role-specific.

Candidate system/developer instruction:

```text
You are an expert CV reviewer. Evaluate the CV only against the provided job title and job description. Return valid JSON matching the requested schema. Do not invent experience that is not present in the CV.
```

Candidate user content should include:

- Job title.
- Job description.
- CV text.
- Required JSON schema.

HR system/developer instruction:

```text
You are an HR screening assistant. Rank candidates only against the provided job title and job description. Return valid JSON matching the requested schema. Be specific and fair. Do not infer protected characteristics.
```

HR user content should include:

- Job title.
- Job description.
- Candidate list with stable IDs, filenames, and extracted CV text.
- Required JSON schema.

Scoring rules:

- Use `0.0` to `10.0`.
- `10.0` means exceptionally strong match.
- `7.0` to `8.9` means good match with manageable gaps.
- `5.0` to `6.9` means partial match.
- Below `5.0` means weak match.
- Score must be based on evidence in the CV.

## Response Parsing And Validation

Provider responses can vary. Add a single parser that:

- Extracts text from provider-specific response bodies.
- Removes Markdown code fences.
- Parses JSON.
- Validates required keys.
- Coerces scores to numbers.
- Clamps scores to `0.0` through `10.0`.
- Converts missing arrays to empty arrays.
- Returns actionable errors when parsing fails.

Do not render raw JSON parser errors directly to users. Show a message such as:

```text
The provider responded, but the result was not in the expected format. Try again or use a different model.
```

## File Extraction

Supported file types:

- `.txt`: use `File.text()`.
- `.pdf`: use `pdfjs-dist` to read pages and concatenate text.
- `.docx`: use `mammoth` to extract raw text.

Legacy `.doc`:

- Do not promise reliable support in v1.
- Show a clear message asking the user to convert to `.docx`, `.pdf`, or paste text.

Extraction behavior:

- Store extracted text in component state only.
- Track status per file: `idle`, `extracting`, `ready`, `error`.
- Display filename, detected type, and extraction status.
- Do not send extracted text to a provider until the user clicks `Process`.

## Error Handling

Normalize provider errors into these categories:

- `auth`: invalid or unauthorized API key.
- `quota`: insufficient quota, billing, or rate limit.
- `network`: failed request, CORS, timeout, or offline.
- `provider`: provider returned an API-level error.
- `parse`: provider responded but not in expected format.
- `validation`: user input is missing or invalid.

Each category should map to a clear UI message and optional next action.

## UI States

Provider setup:

- Empty form.
- Testing.
- Success and saving.
- Error.

Main app:

- Provider status visible.
- Candidate tab.
- HR tab.
- Retest provider.
- Edit provider.
- Clear provider.

Candidate:

- Empty form.
- File extracting.
- Ready.
- Processing.
- Result.
- Error.

HR:

- Empty form.
- Files extracting.
- Ready list.
- Processing batch.
- Ranked result.
- Partial file errors.

## Testing Strategy

Unit tests:

- `aiConfigStorage` saves, reads, validates, and clears v1 config.
- Provider adapters create correct `fetch` calls.
- Provider adapters normalize HTTP and provider errors.
- Response parser handles plain JSON, fenced JSON, malformed JSON, missing arrays, and out-of-range scores.
- File extraction handles `.txt`, `.pdf`, `.docx`, and `.doc` errors.

Component tests:

- Setup gate blocks tools without config.
- Successful `Test and Save` unlocks tools.
- Failed provider test shows error and does not save.
- Candidate form validates required fields.
- Candidate result renders score and recommendations.
- HR form accepts multiple files and renders per-file statuses.
- HR ranking renders sorted results.

E2E tests:

- First-run setup screen.
- Mocked provider test unlocks app.
- Candidate mocked review renders score and recommendation sections.
- HR mocked ranking renders sorted candidate cards.

Mocking approach:

- Use mocked `fetch` for Vitest.
- Use Playwright route interception for E2E.
- Never require real API keys in automated tests.

## Implementation Order

1. Scaffold project and quality tooling.
2. Add domain types and storage module.
3. Build provider setup gate with mocked adapter.
4. Implement provider adapters.
5. Add response parsing and validation.
6. Build Candidate tool.
7. Add file extraction utilities.
8. Build HR tool.
9. Add tests and E2E smoke coverage.
10. Polish UI copy, privacy warnings, and documentation.

## Future Enhancements

- Optional backend proxy to avoid exposing API keys to browser runtime.
- CSV export for HR ranking.
- Local-only result history.
- More file formats.
- Token estimation before sending large HR batches.
- Model presets by quality, speed, and cost.
- Internationalization for English, Portuguese, and Spanish.

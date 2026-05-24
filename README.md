# Curriculum Tools

Browser-first AI tools designed for candidates and HR teams to review and rank CVs. This application runs entirely in the browser, connecting directly to AI providers without a backend proxy.

## Architecture

- **Domain**: CV processing, scoring rules, and ranking logic.
- **Application Gateways**: Manages provider setup, HR decisions, and quality harness runs.
- **Infrastructure**: Local storage for settings and direct provider API adapters (Gemini, OpenAI, DeepSeek).
- **Presentation**: React components for CV upload, review results, and HR dashboards.

## Features

- **Candidate CV Reviewer**: Role-specific scoring and recommendations.
- **HR CV Ranking**: Batch upload and comparison of multiple candidates.
- **Quality Evaluation Harness**: Track score drift and ranking stability across model/prompt changes.
- **Multi-provider Support**: Gemini, OpenAI, and DeepSeek integration.
- **Privacy Focused**: API keys and CV content stay in the browser/localStorage.

## Setup

```bash
pnpm install
```

## Build

```bash
pnpm run build
```

## Run

```bash
pnpm run dev
```

## Testing

- **Unit/Component**: `pnpm test`
- **Coverage**: `pnpm test:coverage` (Enforces 82% threshold)
- **E2E**: `pnpm run test:e2e`
- **Linting**: `pnpm run lint`

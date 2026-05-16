import {
  AiConfig,
  AiProviderAdapter,
  CandidateReview,
  HrRankingResult,
  TestResult,
} from '@/domain/aiTypes';
import {
  normalizeCandidateReview,
  normalizeHrRanking,
} from '@/domain/validation';
import { buildCandidatePrompt } from '@/prompts/candidatePrompt';
import { buildHrPrompt } from '@/prompts/hrPrompt';
import {
  TEST_PROMPT,
  assertSuccessfulResponse,
  ensureHello,
  toProviderError,
} from '@/providers/providerUtils';
import { parseJsonResult } from '@/providers/responseParsing';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

export const openaiProvider: AiProviderAdapter = {
  async testConnection(config): Promise<TestResult> {
    try {
      const text = await createResponse(config, TEST_PROMPT, null);
      ensureHello(text);
      return { ok: true, message: 'OpenAI responded successfully.' };
    } catch (error) {
      throw toProviderError(error);
    }
  },

  async reviewCandidateCv(config, input): Promise<CandidateReview> {
    const text = await createResponse(
      config,
      buildCandidatePrompt(input),
      candidateReviewSchema,
    );
    return parseJsonResult(text, normalizeCandidateReview);
  },

  async rankHrCvs(config, input): Promise<HrRankingResult> {
    const text = await createResponse(config, buildHrPrompt(input), hrRankingSchema);
    return parseJsonResult(text, normalizeHrRanking);
  },
};

const createResponse = async (
  config: AiConfig,
  prompt: string,
  schema: JsonSchema | null,
) => {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      input: prompt,
      ...(schema
        ? {
            text: {
              format: {
                type: 'json_schema',
                name: 'curriculum_tools_result',
                schema,
              },
            },
          }
        : {}),
    }),
  });

  await assertSuccessfulResponse(response);

  const body = await response.json();
  return extractOpenAiText(body);
};

const extractOpenAiText = (body: unknown): string => {
  const response = body as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  if (response.output_text) {
    return response.output_text;
  }

  const text = response.output
    ?.flatMap(item => item.content ?? [])
    .map(content => content.text)
    .filter(Boolean)
    .join('\n');

  return text ?? '';
};

type JsonSchema = Record<string, unknown>;

const stringArraySchema = {
  type: 'array',
  items: { type: 'string' },
} as const;

const candidateReviewSchema: JsonSchema = {
  type: 'object',
  properties: {
    score: { type: 'number' },
    summary: { type: 'string' },
    strengths: stringArraySchema,
    gaps: stringArraySchema,
    recommendations: stringArraySchema,
    rewrittenBullets: stringArraySchema,
  },
  required: [
    'score',
    'summary',
    'strengths',
    'gaps',
    'recommendations',
    'rewrittenBullets',
  ],
  additionalProperties: false,
};

const hrCandidateSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    filename: { type: 'string' },
    detectedName: { type: 'string' },
    score: { type: 'number' },
    justification: { type: 'string' },
    strengths: stringArraySchema,
    concerns: stringArraySchema,
    interviewRecommendation: {
      type: 'string',
      enum: ['strong_yes', 'yes', 'maybe', 'no'],
    },
  },
  required: [
    'id',
    'filename',
    'detectedName',
    'score',
    'justification',
    'strengths',
    'concerns',
    'interviewRecommendation',
  ],
  additionalProperties: false,
} as const;

const hrRankingSchema: JsonSchema = {
  type: 'object',
  properties: {
    candidates: {
      type: 'array',
      items: hrCandidateSchema,
    },
  },
  required: ['candidates'],
  additionalProperties: false,
};

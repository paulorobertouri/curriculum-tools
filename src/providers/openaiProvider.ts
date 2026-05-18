import {
  AiConfig,
  AiProviderAdapter,
  CandidateReview,
  HrRankingResult,
  TestResult,
} from '@/domain/aiTypes';
import {
  normalizeCandidateCareerToolkit,
  normalizeCandidateReview,
  normalizeHrRanking,
} from '@/domain/validation';
import { buildCandidatePrompt } from '@/prompts/candidatePrompt';
import { buildCandidateToolkitPrompt } from '@/prompts/candidateToolkitPrompt';
import { buildHrPrompt } from '@/prompts/hrPrompt';
import {
  TEST_PROMPT,
  assertSuccessfulResponse,
  ensureHello,
  isPromptRedactionEnabled,
  sanitizePromptForProvider,
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
    const reviewText = await createResponse(
      config,
      buildCandidatePrompt(input),
      candidateReviewSchema,
    );
    const toolkitText = await createResponse(
      config,
      buildCandidateToolkitPrompt(input),
      candidateToolkitSchema,
    );

    const review = parseJsonResult(reviewText, normalizeCandidateReview);
    const toolkit = parseJsonResult(
      toolkitText,
      normalizeCandidateCareerToolkit,
    );

    return {
      ...review,
      ...toolkit,
    };
  },

  async rankHrCvs(config, input): Promise<HrRankingResult> {
    const text = await createResponse(
      config,
      buildHrPrompt(input),
      hrRankingSchema,
    );
    return parseJsonResult(text, normalizeHrRanking);
  },
};

const createResponse = async (
  config: AiConfig,
  prompt: string,
  schema: JsonSchema | null,
) => {
  const sanitizedPrompt = sanitizePromptForProvider(
    prompt,
    isPromptRedactionEnabled(config),
  );

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      input: sanitizedPrompt,
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

const candidateToolkitSchema: JsonSchema = {
  type: 'object',
  properties: {
    rewrittenCv: { type: 'string' },
    coverLetter: { type: 'string' },
    interviewQa: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          suggestedAnswer: { type: 'string' },
        },
        required: ['question', 'suggestedAnswer'],
        additionalProperties: false,
      },
    },
  },
  required: ['rewrittenCv', 'coverLetter', 'interviewQa'],
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
    interviewQuestions: stringArraySchema,
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
    'interviewQuestions',
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

import { AiConfig, AiProviderAdapter, TestResult } from '@/domain/aiTypes';
import {
  TEST_PROMPT,
  assertSuccessfulResponse,
  ensureHello,
  isPromptRedactionEnabled,
  sanitizePromptForProvider,
  toProviderError,
} from '@/providers/providerUtils';
import {
  ProviderPromptContext,
  createStandardWorkflows,
} from '@/providers/providerWorkflows';
import { extractOpenAiResponseText } from '@/providers/responseParsing';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const OPENAI_MODELS_URL = 'https://api.openai.com/v1/models';

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

  async listModels(config): Promise<string[]> {
    try {
      const response = await fetch(OPENAI_MODELS_URL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      await assertSuccessfulResponse(response);
      const body = (await response.json()) as {
        data?: Array<{ id?: string }>;
      };

      return (body.data ?? [])
        .map(model => model.id?.trim() ?? '')
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
    } catch (error) {
      throw toProviderError(error);
    }
  },

  ...createStandardWorkflows((config, prompt, context) =>
    createResponse(config, prompt, schemaByContext[context]),
  ),
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
  return extractOpenAiResponseText(body);
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

const schemaByContext: Record<ProviderPromptContext, JsonSchema> = {
  candidateReview: candidateReviewSchema,
  candidateToolkit: candidateToolkitSchema,
  hrRanking: hrRankingSchema,
};

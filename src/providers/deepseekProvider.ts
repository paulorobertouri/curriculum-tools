import {
  AiConfig,
  AiProviderAdapter,
  CandidateReview,
  HrRankingResult,
  TestResult,
} from '@/domain/aiTypes';
import { normalizeCandidateReview, normalizeHrRanking } from '@/domain/validation';
import { buildCandidatePrompt } from '@/prompts/candidatePrompt';
import { buildHrPrompt } from '@/prompts/hrPrompt';
import {
  TEST_PROMPT,
  assertSuccessfulResponse,
  ensureHello,
  toProviderError,
} from '@/providers/providerUtils';
import { parseJsonResult } from '@/providers/responseParsing';

const DEEPSEEK_CHAT_URL = 'https://api.deepseek.com/chat/completions';

export const deepseekProvider: AiProviderAdapter = {
  async testConnection(config): Promise<TestResult> {
    try {
      const text = await createChatCompletion(config, TEST_PROMPT);
      ensureHello(text);
      return { ok: true, message: 'DeepSeek responded successfully.' };
    } catch (error) {
      throw toProviderError(error);
    }
  },

  async reviewCandidateCv(config, input): Promise<CandidateReview> {
    const text = await createChatCompletion(config, buildCandidatePrompt(input));
    return parseJsonResult(text, normalizeCandidateReview);
  },

  async rankHrCvs(config, input): Promise<HrRankingResult> {
    const text = await createChatCompletion(config, buildHrPrompt(input));
    return parseJsonResult(text, normalizeHrRanking);
  },
};

const createChatCompletion = async (config: AiConfig, prompt: string) => {
  const response = await fetch(DEEPSEEK_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  await assertSuccessfulResponse(response);

  const body = await response.json();
  return extractDeepSeekText(body);
};

const extractDeepSeekText = (body: unknown): string => {
  const response = body as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return response.choices?.[0]?.message?.content ?? '';
};

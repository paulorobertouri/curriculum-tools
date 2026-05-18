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

const POLLINATIONS_CHAT_URL =
  'https://text.pollinations.ai/openai/chat/completions';

export const pollinationsProvider: AiProviderAdapter = {
  async testConnection(config): Promise<TestResult> {
    try {
      const text = await createChatCompletion(config, TEST_PROMPT);
      ensureHello(text);
      return { ok: true, message: 'Pollinations responded successfully.' };
    } catch (error) {
      throw toProviderError(error);
    }
  },

  async reviewCandidateCv(config, input): Promise<CandidateReview> {
    const reviewText = await createChatCompletion(
      config,
      buildCandidatePrompt(input),
    );
    const toolkitText = await createChatCompletion(
      config,
      buildCandidateToolkitPrompt(input),
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
    const text = await createChatCompletion(config, buildHrPrompt(input));
    return parseJsonResult(text, normalizeHrRanking);
  },
};

const createChatCompletion = async (config: AiConfig, prompt: string) => {
  const sanitizedPrompt = sanitizePromptForProvider(
    prompt,
    isPromptRedactionEnabled(config),
  );

  const response = await fetch(POLLINATIONS_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: sanitizedPrompt }],
    }),
  });

  await assertSuccessfulResponse(response);

  const body = await response.json();
  return extractText(body);
};

const extractText = (body: unknown): string => {
  const response = body as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return response.choices?.[0]?.message?.content ?? '';
};

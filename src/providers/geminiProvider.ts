import {
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

export const geminiProvider: AiProviderAdapter = {
  async testConnection(config): Promise<TestResult> {
    try {
      const text = await generateContent(config.apiKey, config.model, TEST_PROMPT);
      ensureHello(text);
      return { ok: true, message: 'Gemini responded successfully.' };
    } catch (error) {
      throw toProviderError(error);
    }
  },

  async reviewCandidateCv(config, input): Promise<CandidateReview> {
    const text = await generateContent(
      config.apiKey,
      config.model,
      buildCandidatePrompt(input),
    );
    return parseJsonResult(text, normalizeCandidateReview);
  },

  async rankHrCvs(config, input): Promise<HrRankingResult> {
    const text = await generateContent(
      config.apiKey,
      config.model,
      buildHrPrompt(input),
    );
    return parseJsonResult(text, normalizeHrRanking);
  },
};

const generateContent = async (
  apiKey: string,
  model: string,
  prompt: string,
) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    },
  );

  await assertSuccessfulResponse(response);

  const body = await response.json();
  return extractGeminiText(body);
};

const extractGeminiText = (body: unknown): string => {
  const response = body as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  return (
    response.candidates?.[0]?.content?.parts
      ?.map(part => part.text)
      .filter(Boolean)
      .join('\n') ?? ''
  );
};

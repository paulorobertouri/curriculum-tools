import { AiConfig, AiProviderAdapter, TestResult } from '@/common/core/aiTypes';
import {
  TEST_PROMPT,
  assertSuccessfulResponse,
  ensureHello,
  isPromptRedactionEnabled,
  sanitizePromptForProvider,
  toProviderError,
} from '@/provider/providerUtils';
import { createStandardWorkflows } from '@/provider/providerWorkflows';
import { extractGeminiText } from '@/provider/responseParsing';

export const geminiProvider: AiProviderAdapter = {
  async testConnection(config, signal): Promise<TestResult> {
    try {
      const text = await generateContent(config, TEST_PROMPT, signal);
      ensureHello(text);
      return { ok: true, message: 'Gemini responded successfully.' };
    } catch (error) {
      throw toProviderError(error);
    }
  },

  async listModels(config, signal): Promise<string[]> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
          config.apiKey,
        )}`,
        {
          method: 'GET',
          signal,
        },
      );

      await assertSuccessfulResponse(response);

      const body = (await response.json()) as {
        models?: Array<{
          name?: string;
          supportedGenerationMethods?: string[];
        }>;
      };

      return (body.models ?? [])
        .filter(model =>
          (model.supportedGenerationMethods ?? []).includes('generateContent'),
        )
        .map(model => (model.name ?? '').replace(/^models\//, '').trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
    } catch (error) {
      throw toProviderError(error);
    }
  },

  ...createStandardWorkflows((config, prompt, _, signal) =>
    generateContent(config, prompt, signal),
  ),
};

const generateContent = async (
  config: AiConfig,
  prompt: string,
  signal?: AbortSignal,
) => {
  const sanitizedPrompt = sanitizePromptForProvider(
    prompt,
    isPromptRedactionEnabled(config),
  );

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      config.model,
    )}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: sanitizedPrompt }] }],
      }),
      signal,
    },
  );

  await assertSuccessfulResponse(response);

  const body = await response.json();
  return extractGeminiText(body);
};

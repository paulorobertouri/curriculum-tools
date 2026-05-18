import { AiConfig, AiProviderAdapter, TestResult } from '@/domain/aiTypes';
import {
  TEST_PROMPT,
  assertSuccessfulResponse,
  ensureHello,
  isPromptRedactionEnabled,
  sanitizePromptForProvider,
  toProviderError,
} from '@/providers/providerUtils';
import { createStandardWorkflows } from '@/providers/providerWorkflows';
import { extractGeminiText } from '@/providers/responseParsing';

export const geminiProvider: AiProviderAdapter = {
  async testConnection(config): Promise<TestResult> {
    try {
      const text = await generateContent(config, TEST_PROMPT);
      ensureHello(text);
      return { ok: true, message: 'Gemini responded successfully.' };
    } catch (error) {
      throw toProviderError(error);
    }
  },

  async listModels(config): Promise<string[]> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
          config.apiKey,
        )}`,
        {
          method: 'GET',
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

  ...createStandardWorkflows((config, prompt) =>
    generateContent(config, prompt),
  ),
};

const generateContent = async (config: AiConfig, prompt: string) => {
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
    },
  );

  await assertSuccessfulResponse(response);

  const body = await response.json();
  return extractGeminiText(body);
};

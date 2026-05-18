import { AiConfig, AiProviderAdapter, TestResult } from '@/domain/aiTypes';
import {
  TEST_PROMPT,
  assertSuccessfulResponse,
  ensureNonEmptyResponse,
  isPromptRedactionEnabled,
  sanitizePromptForProvider,
  toProviderError,
} from '@/providers/providerUtils';
import { createStandardWorkflows } from '@/providers/providerWorkflows';
import { extractChatCompletionText } from '@/providers/responseParsing';

const POLLINATIONS_CHAT_URL =
  'https://text.pollinations.ai/openai/chat/completions';
const POLLINATIONS_MODELS_URL = 'https://text.pollinations.ai/openai/models';

export const pollinationsProvider: AiProviderAdapter = {
  async testConnection(config): Promise<TestResult> {
    try {
      const text = await createChatCompletion(config, TEST_PROMPT);
      ensureNonEmptyResponse(text);
      return { ok: true, message: 'Pollinations responded successfully.' };
    } catch (error) {
      throw toProviderError(error);
    }
  },

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(POLLINATIONS_MODELS_URL, {
        method: 'GET',
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

  ...createStandardWorkflows((config, prompt) =>
    createChatCompletion(config, prompt),
  ),
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
  return extractChatCompletionText(body);
};

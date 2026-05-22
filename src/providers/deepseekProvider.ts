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
import { extractChatCompletionText } from '@/providers/responseParsing';

const DEEPSEEK_CHAT_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODELS_URL = 'https://api.deepseek.com/models';

export const deepseekProvider: AiProviderAdapter = {
  async testConnection(config, signal): Promise<TestResult> {
    try {
      const text = await createChatCompletion(config, TEST_PROMPT, signal);
      ensureHello(text);
      return { ok: true, message: 'DeepSeek responded successfully.' };
    } catch (error) {
      throw toProviderError(error);
    }
  },

  async listModels(config, signal): Promise<string[]> {
    try {
      const response = await fetch(DEEPSEEK_MODELS_URL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal,
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

  ...createStandardWorkflows((config, prompt, _, signal) =>
    createChatCompletion(config, prompt, signal),
  ),
};

const createChatCompletion = async (
  config: AiConfig,
  prompt: string,
  signal?: AbortSignal,
) => {
  const sanitizedPrompt = sanitizePromptForProvider(
    prompt,
    isPromptRedactionEnabled(config),
  );

  const response = await fetch(DEEPSEEK_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: sanitizedPrompt }],
    }),
    signal,
  });

  await assertSuccessfulResponse(response);

  const body = await response.json();
  return extractChatCompletionText(body);
};

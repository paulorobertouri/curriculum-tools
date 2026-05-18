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

const LLM7_CHAT_URL = 'https://api.llm7.io/v1/chat/completions';
const LLM7_MODELS_URL = 'https://api.llm7.io/v1/models';

export const llm7Provider: AiProviderAdapter = {
  async testConnection(config): Promise<TestResult> {
    try {
      const text = await createChatCompletion(config, TEST_PROMPT);
      ensureHello(text);
      return { ok: true, message: 'LLM7 responded successfully.' };
    } catch (error) {
      throw toProviderError(error);
    }
  },

  async listModels(config): Promise<string[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (config.apiKey.trim()) {
        headers.Authorization = `Bearer ${config.apiKey.trim()}`;
      }

      const response = await fetch(LLM7_MODELS_URL, {
        method: 'GET',
        headers,
      });

      await assertSuccessfulResponse(response);

      const body = (await response.json()) as
        | { data?: Array<{ id?: string }> }
        | Array<{ id?: string }>;

      const models = Array.isArray(body) ? body : (body.data ?? []);

      return models
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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey.trim()) {
    headers.Authorization = `Bearer ${config.apiKey.trim()}`;
  }

  const response = await fetch(LLM7_CHAT_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: sanitizedPrompt }],
    }),
  });

  await assertSuccessfulResponse(response);

  const body = await response.json();
  return extractChatCompletionText(body);
};

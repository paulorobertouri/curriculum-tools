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

const OVH_CHAT_URL =
  'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions';
const OVH_MODELS_URL =
  'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/models';

export const ovhProvider: AiProviderAdapter = {
  async testConnection(config): Promise<TestResult> {
    try {
      const text = await createChatCompletion(config, TEST_PROMPT);
      ensureHello(text);
      return {
        ok: true,
        message: 'OVHcloud AI Endpoints responded successfully.',
      };
    } catch (error) {
      const providerError = toProviderError(error);

      if (providerError.kind === 'quota') {
        await verifyModelsEndpoint(config);
        return {
          ok: true,
          message:
            'OVHcloud AI Endpoints is reachable, but chat is currently rate-limited.',
        };
      }

      throw providerError;
    }
  },

  async listModels(config): Promise<string[]> {
    try {
      return await fetchModels(config);
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

  const response = await fetch(OVH_CHAT_URL, {
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

const verifyModelsEndpoint = async (config: AiConfig) => {
  await fetchModels(config);
};

const fetchModels = async (config: AiConfig): Promise<string[]> => {
  const headers: Record<string, string> = {};

  if (config.apiKey.trim()) {
    headers.Authorization = `Bearer ${config.apiKey.trim()}`;
  }

  const response = await fetch(OVH_MODELS_URL, {
    method: 'GET',
    headers,
  });

  await assertSuccessfulResponse(response);

  const body = (await response.json()) as {
    data?: Array<{ id?: string }>;
  };

  return (body.data ?? [])
    .map(model => model.id?.trim() ?? '')
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
};

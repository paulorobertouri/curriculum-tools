import { AiProviderAdapter, AiProviderId } from '@/domain/aiTypes';
import { deepseekProvider } from '@/providers/deepseekProvider';
import { geminiProvider } from '@/providers/geminiProvider';
import { openaiProvider } from '@/providers/openaiProvider';

export const getProviderAdapter = (
  provider: AiProviderId,
): AiProviderAdapter => {
  switch (provider) {
    case 'openai':
      return openaiProvider;
    case 'gemini':
      return geminiProvider;
    case 'deepseek':
      return deepseekProvider;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
};

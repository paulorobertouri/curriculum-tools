import { AiProviderAdapter, AiProviderId } from '@/common/core/aiTypes';
import { deepseekProvider } from '@/provider/adapters/deepseekProvider';
import { geminiProvider } from '@/provider/adapters/geminiProvider';
import { openaiProvider } from '@/provider/adapters/openaiProvider';

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

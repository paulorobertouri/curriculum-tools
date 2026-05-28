import { AiProviderAdapter, AiProviderId } from '@/common/core/aiTypes';
import { openaiProvider } from '@/provider/adapters/openaiProvider';
import { deepseekProvider } from '@/provider/deepseekProvider';
import { geminiProvider } from '@/provider/geminiProvider';

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

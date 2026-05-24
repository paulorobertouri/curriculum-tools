import { AiProviderAdapter, AiProviderId } from '@/domain/aiTypes';
import { deepseekProvider } from '@/presentation/providers/deepseekProvider';
import { geminiProvider } from '@/presentation/providers/geminiProvider';
import { openaiProvider } from '@/presentation/providers/openaiProvider';

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

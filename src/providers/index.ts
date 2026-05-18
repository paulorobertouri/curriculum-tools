import { AiProviderAdapter, AiProviderId } from '@/domain/aiTypes';
import { deepseekProvider } from '@/providers/deepseekProvider';
import { geminiProvider } from '@/providers/geminiProvider';
import { kiloProvider } from '@/providers/kiloProvider';
import { llm7Provider } from '@/providers/llm7Provider';
import { openaiProvider } from '@/providers/openaiProvider';
import { ovhProvider } from '@/providers/ovhProvider';
import { pollinationsProvider } from '@/providers/pollinationsProvider';

export const getProviderAdapter = (
  provider: AiProviderId,
): AiProviderAdapter => {
  switch (provider) {
    case 'gemini':
      return geminiProvider;
    case 'openai':
      return openaiProvider;
    case 'deepseek':
      return deepseekProvider;
    case 'ovh':
      return ovhProvider;
    case 'llm7':
      return llm7Provider;
    case 'pollinations':
      return pollinationsProvider;
    case 'kilo':
      return kiloProvider;
  }
};

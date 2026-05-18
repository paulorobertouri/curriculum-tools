import {
  AiConfig,
  AiProviderId,
  DEFAULT_MODELS,
  ProviderError,
  ProviderErrorKind,
} from '@/domain/aiTypes';
import { getProviderAdapter } from '@/providers';

export type ProviderFallbackNotice = {
  primaryProvider: AiProviderId;
  fallbackProvider: AiProviderId;
  reasonKind: ProviderErrorKind;
};

type FallbackResult<T> = {
  data: T;
  notice: ProviderFallbackNotice | null;
};

const canFallbackFromOvh = (error: unknown): error is ProviderError => {
  if (!(error instanceof ProviderError)) {
    return false;
  }

  return (
    error.kind === 'quota' ||
    error.kind === 'network' ||
    error.kind === 'provider'
  );
};

export const runWithAnonymousFallback = async <T>(
  config: AiConfig,
  operation: (effectiveConfig: AiConfig) => Promise<T>,
): Promise<FallbackResult<T>> => {
  try {
    const data = await operation(config);
    return {
      data,
      notice: null,
    };
  } catch (error) {
    if (config.provider !== 'ovh' || !canFallbackFromOvh(error)) {
      throw error;
    }

    const fallbackConfig: AiConfig = {
      provider: 'llm7',
      apiKey: '',
      model: DEFAULT_MODELS.llm7,
      savedAt: new Date().toISOString(),
    };

    const data = await operation(fallbackConfig);

    return {
      data,
      notice: {
        primaryProvider: 'ovh',
        fallbackProvider: 'llm7',
        reasonKind: error.kind,
      },
    };
  }
};

export const callProviderReview = (
  config: AiConfig,
  input: Parameters<
    ReturnType<typeof getProviderAdapter>['reviewCandidateCv']
  >[1],
) => getProviderAdapter(config.provider).reviewCandidateCv(config, input);

export const callProviderRanking = (
  config: AiConfig,
  input: Parameters<ReturnType<typeof getProviderAdapter>['rankHrCvs']>[1],
) => getProviderAdapter(config.provider).rankHrCvs(config, input);

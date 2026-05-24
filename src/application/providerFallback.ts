import { AiConfig, AiProviderId, ProviderErrorKind } from '@/domain/aiTypes';
import { getProviderAdapter } from '@/presentation/providers';

export type ProviderFallbackNotice = {
  primaryProvider: AiProviderId;
  fallbackProvider: AiProviderId;
  reasonKind: ProviderErrorKind;
};

export const callProviderReview = (
  config: AiConfig,
  input: Parameters<
    ReturnType<typeof getProviderAdapter>['reviewCandidateCv']
  >[1],
  signal?: AbortSignal,
) => getProviderAdapter(config.provider).reviewCandidateCv(config, input, signal);

export const callProviderRanking = (
  config: AiConfig,
  input: Parameters<ReturnType<typeof getProviderAdapter>['rankHrCvs']>[1],
  signal?: AbortSignal,
) => getProviderAdapter(config.provider).rankHrCvs(config, input, signal);

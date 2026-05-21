import { AiConfig, AiProviderId, ProviderErrorKind } from '@/domain/aiTypes';
import { getProviderAdapter } from '@/providers';

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
) => getProviderAdapter(config.provider).reviewCandidateCv(config, input);

export const callProviderRanking = (
  config: AiConfig,
  input: Parameters<ReturnType<typeof getProviderAdapter>['rankHrCvs']>[1],
) => getProviderAdapter(config.provider).rankHrCvs(config, input);

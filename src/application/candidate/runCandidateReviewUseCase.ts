import {
  ProviderFallbackNotice,
  callProviderReview,
  runWithAnonymousFallback,
} from '@/application/providerFallback';
import {
  AiConfig,
  CandidateReview,
  CandidateReviewInput,
} from '@/domain/aiTypes';

type CandidateReviewUseCaseResult = {
  review: CandidateReview;
  providerNotice: ProviderFallbackNotice | null;
};

export const runCandidateReviewUseCase = async (
  config: AiConfig,
  input: CandidateReviewInput,
): Promise<CandidateReviewUseCaseResult> => {
  const { data, notice } = await runWithAnonymousFallback(config, effective =>
    callProviderReview(effective, input),
  );

  return {
    review: data,
    providerNotice: notice,
  };
};

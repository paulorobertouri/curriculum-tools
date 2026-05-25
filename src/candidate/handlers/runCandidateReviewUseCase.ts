import {
  AiConfig,
  CandidateReview,
  CandidateReviewInput,
} from '@/common/core/aiTypes';
import { callProviderReview } from '@/provider/providerFallback';

type CandidateReviewUseCaseResult = {
  review: CandidateReview;
};

export const runCandidateReviewUseCase = async (
  config: AiConfig,
  input: CandidateReviewInput,
  signal?: AbortSignal,
): Promise<CandidateReviewUseCaseResult> => {
  const data = await callProviderReview(config, input, signal);

  return {
    review: data,
  };
};

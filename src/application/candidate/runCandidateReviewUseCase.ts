import { callProviderReview } from '@/application/providerFallback';
import {
  AiConfig,
  CandidateReview,
  CandidateReviewInput,
} from '@/domain/aiTypes';

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

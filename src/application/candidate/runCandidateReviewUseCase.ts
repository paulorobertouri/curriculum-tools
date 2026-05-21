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
): Promise<CandidateReviewUseCaseResult> => {
  const data = await callProviderReview(config, input);

  return {
    review: data,
  };
};

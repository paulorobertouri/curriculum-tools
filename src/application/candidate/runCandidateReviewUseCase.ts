import {
  AiConfig,
  CandidateReview,
  CandidateReviewInput,
} from '@/domain/aiTypes';
import { getProviderAdapter } from '@/providers';

export const runCandidateReviewUseCase = async (
  config: AiConfig,
  input: CandidateReviewInput,
): Promise<CandidateReview> => {
  const adapter = getProviderAdapter(config.provider);
  return adapter.reviewCandidateCv(config, input);
};

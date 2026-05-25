import {
  CandidateReview,
  CandidateReviewInput,
  EvaluationResult,
} from './EvaluationModels';

// Mocking the provider call for this demonstration
/* eslint-disable @typescript-eslint/no-unused-vars */
const callProviderReview = async (
  _input: CandidateReviewInput,
  _signal?: AbortSignal,
): Promise<CandidateReview> => {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  // Logic from providerFallback would go here or in a separate Infrastructure client in this folder
  return {
    score: 85,
    summary: 'Strong candidate with relevant experience.',
    strengths: ['React', 'TypeScript'],
    weaknesses: ['Backend experience'],
  };
};

export class EvaluationService {
  /* 
     Service Layer: Orchestrates the evaluation logic.
  */
  async runReview(
    input: CandidateReviewInput,
    signal?: AbortSignal,
  ): Promise<EvaluationResult> {
    const review = await callProviderReview(input, signal);

    return {
      review,
      timestamp: new Date().toISOString(),
    };
  }
}

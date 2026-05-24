import { CandidateReview, CandidateReviewInput, EvaluationResult } from './EvaluationModels';
// Mocking the provider call for this demonstration
const callProviderReview = async (input: CandidateReviewInput, signal?: AbortSignal): Promise<CandidateReview> => {
  // Logic from providerFallback would go here or in a separate Infrastructure client in this folder
  return {
    score: 85,
    summary: "Strong candidate with relevant experience.",
    strengths: ["React", "TypeScript"],
    weaknesses: ["Backend experience"]
  };
};

export class EvaluationService {
  /* 
     Service Layer: Orchestrates the evaluation logic.
  */
  async runReview(input: CandidateReviewInput, signal?: AbortSignal): Promise<EvaluationResult> {
    const review = await callProviderReview(input, signal);
    
    return {
      review,
      timestamp: new Date().toISOString()
    };
  }
}

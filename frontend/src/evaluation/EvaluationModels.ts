// Domain types for Evaluation
export interface CandidateReviewInput {
  cvText: string;
  jobDescription: string;
}

export interface CandidateReview {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

export interface EvaluationResult {
  review: CandidateReview;
  timestamp: string;
}

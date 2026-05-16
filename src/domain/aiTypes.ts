export type AiProviderId = 'gemini' | 'openai' | 'deepseek';

export type AiConfig = {
  provider: AiProviderId;
  apiKey: string;
  model: string;
  savedAt: string;
};

export type TestResult = {
  ok: boolean;
  message: string;
};

export type CandidateReviewInput = {
  jobTitle: string;
  jobDescription: string;
  cvText: string;
};

export type CandidateReview = {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  rewrittenBullets: string[];
};

export type HrCvInput = {
  id: string;
  filename: string;
  text: string;
};

export type HrRankingInput = {
  jobTitle: string;
  jobDescription: string;
  cvs: HrCvInput[];
};

export type InterviewRecommendation = 'strong_yes' | 'yes' | 'maybe' | 'no';

export type RankedCandidate = {
  id: string;
  filename: string;
  detectedName?: string;
  score: number;
  justification: string;
  strengths: string[];
  concerns: string[];
  interviewRecommendation: InterviewRecommendation;
};

export type HrRankingResult = {
  candidates: RankedCandidate[];
};

export type ProviderErrorKind =
  | 'auth'
  | 'quota'
  | 'network'
  | 'provider'
  | 'parse'
  | 'validation';

export class ProviderError extends Error {
  constructor(
    public readonly kind: ProviderErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export type AiProviderAdapter = {
  testConnection(config: AiConfig): Promise<TestResult>;
  reviewCandidateCv(
    config: AiConfig,
    input: CandidateReviewInput,
  ): Promise<CandidateReview>;
  rankHrCvs(config: AiConfig, input: HrRankingInput): Promise<HrRankingResult>;
};

export const PROVIDER_LABELS: Record<AiProviderId, string> = {
  gemini: 'Gemini',
  openai: 'OpenAI',
  deepseek: 'DeepSeek',
};

export const DEFAULT_MODELS: Record<AiProviderId, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-5-mini',
  deepseek: 'deepseek-chat',
};

export const AI_CONFIG_STORAGE_KEY = 'curriculum-tools.aiConfig.v1';

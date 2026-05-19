export type AiProviderId =
  | 'gemini'
  | 'openai'
  | 'deepseek'
  | 'ovh'
  | 'llm7'
  | 'pollinations'
  | 'kilo';

export type AiConfig = {
  provider: AiProviderId;
  apiKey: string;
  model: string;
  savedAt: string;
  redactSensitiveData?: boolean;
};

export type TestResult = {
  ok: boolean;
  message: string;
};

export type CandidateReviewInput = {
  jobTitle: string;
  jobDescription: string;
  cvText: string;
  outputLocale?: 'en-US' | 'pt-BR' | 'es-ES';
};

export type CandidateInterviewQuestion = {
  question: string;
  suggestedAnswer: string;
};

export type CandidateCareerToolkit = {
  rewrittenCv: string;
  coverLetter: string;
  interviewQa: CandidateInterviewQuestion[];
};

export type CandidateReview = {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  rewrittenBullets: string[];
  rewrittenCv: string;
  coverLetter: string;
  interviewQa: CandidateInterviewQuestion[];
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
  outputLocale?: 'en-US' | 'pt-BR' | 'es-ES';
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
  interviewQuestions: string[];
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
  listModels?(config: AiConfig): Promise<string[]>;
  reviewCandidateCv(
    config: AiConfig,
    input: CandidateReviewInput,
  ): Promise<CandidateReview>;
  rankHrCvs(config: AiConfig, input: HrRankingInput): Promise<HrRankingResult>;
};

export const PROVIDER_LABELS: Record<AiProviderId, string> = {
  openai: 'OpenAI',
  gemini: 'Gemini',
  deepseek: 'DeepSeek',
  ovh: 'OVHcloud AI Endpoints (Anonymous)',
  llm7: 'LLM7 (Anonymous)',
  pollinations: 'Pollinations (Anonymous)',
  kilo: 'Kilo Code (Anonymous)',
};

export const DEFAULT_MODELS: Record<AiProviderId, string> = {
  openai: 'gpt-5.4-mini',
  gemini: 'gemini-3.1-flash-lite',
  deepseek: 'deepseek-v4-flash',
  ovh: 'Qwen3-32B',
  llm7: 'deepseek-v3-0324',
  pollinations: 'openai-fast',
  kilo: 'kilo-auto/free',
};

export const PROVIDER_RISK_I18N_KEY: Partial<Record<AiProviderId, string>> = {
  ovh: 'provider.setup.risk.ovh',
  llm7: 'provider.setup.risk.llm7',
  pollinations: 'provider.setup.risk.pollinations',
  kilo: 'provider.setup.risk.kilo',
};

export const DISABLED_PROVIDER_IDS: AiProviderId[] = [
  'ovh',
  'llm7',
  'pollinations',
  'kilo',
];

export const providerIsEnabled = (provider: AiProviderId): boolean =>
  !DISABLED_PROVIDER_IDS.includes(provider);

export const ENABLED_PROVIDER_IDS: AiProviderId[] = (
  Object.keys(PROVIDER_LABELS) as AiProviderId[]
).filter(providerIsEnabled);

export const PROVIDERS_WITH_OPTIONAL_API_KEY: AiProviderId[] = [
  'ovh',
  'llm7',
  'pollinations',
  'kilo',
];

export const providerRequiresApiKey = (provider: AiProviderId): boolean =>
  !PROVIDERS_WITH_OPTIONAL_API_KEY.includes(provider);

export const AI_CONFIG_STORAGE_KEY = 'curriculum-tools.aiConfig.v1';

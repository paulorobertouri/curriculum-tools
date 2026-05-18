export const PROMPT_VERSIONS = {
  candidateReview: 'candidate-review-v3',
  candidateToolkit: 'candidate-toolkit-v1',
  hr: 'hr-v3',
} as const;

export type PromptVersionKey = keyof typeof PROMPT_VERSIONS;

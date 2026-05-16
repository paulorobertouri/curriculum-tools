export const PROMPT_VERSIONS = {
  candidate: 'candidate-v2',
  hr: 'hr-v2',
} as const;

export type PromptVersionKey = keyof typeof PROMPT_VERSIONS;

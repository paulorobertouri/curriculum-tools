import {
  AiConfig,
  AiProviderAdapter,
} from '@/domain/aiTypes';
import {
  normalizeCandidateCareerToolkit,
  normalizeCandidateReview,
  normalizeHrRanking,
} from '@/domain/validation';
import { buildCandidatePrompt } from '@/prompts/candidatePrompt';
import { buildCandidateToolkitPrompt } from '@/prompts/candidateToolkitPrompt';
import { buildHrPrompt } from '@/prompts/hrPrompt';
import { parseJsonResult } from '@/presentation/providers/responseParsing';

export type ProviderPromptContext =
  | 'candidateReview'
  | 'candidateToolkit'
  | 'hrRanking';

type ExecutePrompt = (
  config: AiConfig,
  prompt: string,
  context: ProviderPromptContext,
  signal?: AbortSignal,
) => Promise<string>;

export const createStandardWorkflows = (
  executePrompt: ExecutePrompt,
): Pick<AiProviderAdapter, 'reviewCandidateCv' | 'rankHrCvs'> => ({
  async reviewCandidateCv(config, input, signal) {
    const reviewText = await executePrompt(
      config,
      buildCandidatePrompt(input),
      'candidateReview',
      signal,
    );
    const toolkitText = await executePrompt(
      config,
      buildCandidateToolkitPrompt(input),
      'candidateToolkit',
      signal,
    );

    const review = parseJsonResult(reviewText, normalizeCandidateReview);
    const toolkit = parseJsonResult(
      toolkitText,
      normalizeCandidateCareerToolkit,
    );

    return {
      ...review,
      ...toolkit,
    };
  },

  async rankHrCvs(config, input, signal) {
    const rankingText = await executePrompt(
      config,
      buildHrPrompt(input),
      'hrRanking',
      signal,
    );
    return parseJsonResult(rankingText, normalizeHrRanking);
  },
});

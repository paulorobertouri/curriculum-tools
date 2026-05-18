import {
  AiConfig,
  AiProviderAdapter,
  CandidateReviewInput,
  HrRankingInput,
} from '@/domain/aiTypes';
import {
  normalizeCandidateCareerToolkit,
  normalizeCandidateReview,
  normalizeHrRanking,
} from '@/domain/validation';
import { buildCandidatePrompt } from '@/prompts/candidatePrompt';
import { buildCandidateToolkitPrompt } from '@/prompts/candidateToolkitPrompt';
import { buildHrPrompt } from '@/prompts/hrPrompt';
import { parseJsonResult } from '@/providers/responseParsing';

export type ProviderPromptContext =
  | 'candidateReview'
  | 'candidateToolkit'
  | 'hrRanking';

type ExecutePrompt = (
  config: AiConfig,
  prompt: string,
  context: ProviderPromptContext,
) => Promise<string>;

export const createStandardWorkflows = (
  executePrompt: ExecutePrompt,
): Pick<AiProviderAdapter, 'reviewCandidateCv' | 'rankHrCvs'> => ({
  async reviewCandidateCv(config: AiConfig, input: CandidateReviewInput) {
    const reviewText = await executePrompt(
      config,
      buildCandidatePrompt(input),
      'candidateReview',
    );
    const toolkitText = await executePrompt(
      config,
      buildCandidateToolkitPrompt(input),
      'candidateToolkit',
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

  async rankHrCvs(config: AiConfig, input: HrRankingInput) {
    const rankingText = await executePrompt(
      config,
      buildHrPrompt(input),
      'hrRanking',
    );
    return parseJsonResult(rankingText, normalizeHrRanking);
  },
});

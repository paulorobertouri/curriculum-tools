import { describe, expect, it, vi } from 'vitest';

import { runCandidateReviewUseCase } from '@/application/candidate/runCandidateReviewUseCase';
import { AiConfig } from '@/domain/aiTypes';
import { reviewByProvider } from '@/providers';

vi.mock('@/providers', () => {
  const reviewByProvider = {
    openai: vi.fn(),
  };

  return {
    getProviderAdapter: (provider: string) => ({
      reviewCandidateCv: reviewByProvider[provider as 'openai'],
    }),
    reviewByProvider,
  };
});

describe('runCandidateReviewUseCase', () => {
  const config: AiConfig = {
    provider: 'openai',
    apiKey: 'key',
    model: 'gpt-4',
    savedAt: '2026-05-16',
  };

  it('calls the provider and returns review', async () => {
    const mockReview = {
      score: 8.5,
      summary: 'ok',
      strengths: [],
      gaps: [],
      recommendations: [],
      rewrittenBullets: [],
      rewrittenCv: '...',
      coverLetter: '...',
      interviewQa: [],
    };

    reviewByProvider.openai.mockResolvedValueOnce(mockReview);

    const result = await runCandidateReviewUseCase(config, {
      jobTitle: 'T',
      jobDescription: 'D',
      cvText: 'C',
    });

    expect(result.review).toEqual(mockReview);
    expect(reviewByProvider.openai).toHaveBeenCalledWith(
      config,
      expect.objectContaining({ jobTitle: 'T' }),
      undefined,
    );
  });
});

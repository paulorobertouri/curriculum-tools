import { describe, expect, it, vi } from 'vitest';

import { runCandidateReviewUseCase } from '@/candidate/runCandidateReviewUseCase';
import { AiConfig } from '@/common/core/aiTypes';

const reviewCandidateCvMock = vi.fn();

vi.mock('@/provider', () => {
  return {
    getProviderAdapter: vi.fn(() => ({
      reviewCandidateCv: reviewCandidateCvMock,
    })),
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

    reviewCandidateCvMock.mockResolvedValueOnce(mockReview);

    const result = await runCandidateReviewUseCase(config, {
      jobTitle: 'T',
      jobDescription: 'D',
      cvText: 'C',
    });

    expect(result.review).toEqual(mockReview);
    expect(reviewCandidateCvMock).toHaveBeenCalledWith(
      config,
      expect.objectContaining({ jobTitle: 'T' }),
      undefined,
    );
  });
});

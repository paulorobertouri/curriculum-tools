import { describe, expect, it, vi } from 'vitest';

import { runCandidateReviewUseCase } from '@/application/candidate/runCandidateReviewUseCase';
import { AiConfig } from '@/domain/aiTypes';

const reviewCandidateCvMock = vi.fn();

vi.mock('@/providers', () => ({
  getProviderAdapter: () => ({
    reviewCandidateCv: reviewCandidateCvMock,
  }),
}));

const config: AiConfig = {
  provider: 'openai',
  apiKey: 'sk-test',
  model: 'gpt-5.4-mini',
  savedAt: '2026-05-18T00:00:00.000Z',
};

describe('runCandidateReviewUseCase', () => {
  it('given valid config and input when executed then delegates to provider adapter', async () => {
    reviewCandidateCvMock.mockResolvedValueOnce({
      score: 8.1,
      summary: 'Strong fit.',
      strengths: [],
      gaps: [],
      recommendations: [],
      rewrittenBullets: [],
      rewrittenCv: '',
      coverLetter: '',
      interviewQa: [],
    });

    const result = await runCandidateReviewUseCase(config, {
      jobTitle: 'Frontend Engineer',
      jobDescription: 'Build React apps',
      cvText: 'React developer',
    });

    expect(reviewCandidateCvMock).toHaveBeenCalledWith(config, {
      jobTitle: 'Frontend Engineer',
      jobDescription: 'Build React apps',
      cvText: 'React developer',
    });
    expect(result.score).toBe(8.1);
  });
});

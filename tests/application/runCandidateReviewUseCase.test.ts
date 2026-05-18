import { beforeEach, describe, expect, it, vi } from 'vitest';

import { runCandidateReviewUseCase } from '@/application/candidate/runCandidateReviewUseCase';
import { AiConfig, ProviderError } from '@/domain/aiTypes';

const { reviewByProvider, getProviderAdapterMock } = vi.hoisted(() => ({
  reviewByProvider: {
    openai: vi.fn(),
    ovh: vi.fn(),
    llm7: vi.fn(),
  },
  getProviderAdapterMock: vi.fn(),
}));

vi.mock('@/providers', () => ({
  getProviderAdapter: getProviderAdapterMock,
}));

const config: AiConfig = {
  provider: 'openai',
  apiKey: 'sk-test',
  model: 'gpt-5.4-mini',
  savedAt: '2026-05-18T00:00:00.000Z',
};

describe('runCandidateReviewUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getProviderAdapterMock.mockImplementation((provider: string) => ({
      reviewCandidateCv:
        reviewByProvider[provider as 'openai' | 'ovh' | 'llm7'],
    }));
  });

  it('given valid config and input when executed then delegates to provider adapter', async () => {
    reviewByProvider.openai.mockResolvedValueOnce({
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

    expect(reviewByProvider.openai).toHaveBeenCalledWith(config, {
      jobTitle: 'Frontend Engineer',
      jobDescription: 'Build React apps',
      cvText: 'React developer',
    });
    expect(result.review.score).toBe(8.1);
    expect(result.providerNotice).toBeNull();
  });

  it('falls back from ovh to llm7 on retryable provider error', async () => {
    const ovhConfig: AiConfig = {
      provider: 'ovh',
      apiKey: '',
      model: 'Qwen3-32B',
      savedAt: '2026-05-18T00:00:00.000Z',
    };

    reviewByProvider.ovh.mockRejectedValueOnce(
      new ProviderError('quota', 'Rate limit'),
    );
    reviewByProvider.llm7.mockResolvedValueOnce({
      score: 7.4,
      summary: 'Fallback response.',
      strengths: [],
      gaps: [],
      recommendations: [],
      rewrittenBullets: [],
      rewrittenCv: '',
      coverLetter: '',
      interviewQa: [],
    });

    const result = await runCandidateReviewUseCase(ovhConfig, {
      jobTitle: 'Frontend Engineer',
      jobDescription: 'Build React apps',
      cvText: 'React developer',
    });

    expect(reviewByProvider.ovh).toHaveBeenCalledTimes(1);
    expect(reviewByProvider.llm7).toHaveBeenCalledTimes(1);
    expect(result.review.score).toBe(7.4);
    expect(result.providerNotice).toMatchObject({
      primaryProvider: 'ovh',
      fallbackProvider: 'llm7',
      reasonKind: 'quota',
    });
  });
});

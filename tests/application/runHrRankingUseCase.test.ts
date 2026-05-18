import { beforeEach, describe, expect, it, vi } from 'vitest';

import { runHrRankingUseCase } from '@/application/hr/runHrRankingUseCase';
import { AiConfig, ProviderError } from '@/domain/aiTypes';

const { rankByProvider, getProviderAdapterMock } = vi.hoisted(() => ({
  rankByProvider: {
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

describe('runHrRankingUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getProviderAdapterMock.mockImplementation((provider: string) => ({
      rankHrCvs: rankByProvider[provider as 'openai' | 'ovh' | 'llm7'],
    }));
  });

  it('given multiple cvs when executed then evaluates separately and sorts deterministically', async () => {
    rankByProvider.openai
      .mockResolvedValueOnce({
        candidates: [
          {
            id: 'b',
            filename: 'b.txt',
            score: 7.9,
            justification: 'Good fit',
            strengths: [],
            concerns: [],
            interviewRecommendation: 'yes',
            interviewQuestions: [],
          },
        ],
      })
      .mockResolvedValueOnce({
        candidates: [
          {
            id: 'a',
            filename: 'a.txt',
            score: 8.2,
            justification: 'Better fit',
            strengths: [],
            concerns: [],
            interviewRecommendation: 'strong_yes',
            interviewQuestions: [],
          },
        ],
      });

    const progress = vi.fn();

    const result = await runHrRankingUseCase({
      config,
      jobTitle: 'Backend Engineer',
      jobDescription: 'Build resilient APIs',
      cvs: [
        { id: 'b', filename: 'b.txt', text: 'cv-b' },
        { id: 'a', filename: 'a.txt', text: 'cv-a' },
      ],
      onProgress: progress,
    });

    expect(rankByProvider.openai).toHaveBeenCalledTimes(2);
    expect(progress).toHaveBeenNthCalledWith(1, 1, 2);
    expect(progress).toHaveBeenNthCalledWith(2, 2, 2);
    expect(result.ranking.candidates.map(candidate => candidate.id)).toEqual([
      'a',
      'b',
    ]);
    expect(result.providerNotice).toBeNull();
  });

  it('given missing provider candidate when executed then creates fallback entry', async () => {
    rankByProvider.openai.mockResolvedValueOnce({ candidates: [] });

    const result = await runHrRankingUseCase({
      config,
      jobTitle: 'Backend Engineer',
      jobDescription: 'Build resilient APIs',
      cvs: [{ id: 'x', filename: 'x.txt', text: 'cv-x' }],
    });

    expect(result.ranking.candidates[0]).toMatchObject({
      id: 'x',
      filename: 'x.txt',
      score: 0,
      interviewRecommendation: 'maybe',
    });
  });

  it('falls back from ovh to llm7 on retryable provider errors', async () => {
    const ovhConfig: AiConfig = {
      provider: 'ovh',
      apiKey: '',
      model: 'Qwen3-32B',
      savedAt: '2026-05-18T00:00:00.000Z',
    };

    rankByProvider.ovh.mockRejectedValueOnce(
      new ProviderError('network', 'Network down'),
    );
    rankByProvider.llm7.mockResolvedValueOnce({
      candidates: [
        {
          id: 'x',
          filename: 'x.txt',
          score: 6.2,
          justification: 'Fallback response',
          strengths: [],
          concerns: [],
          interviewRecommendation: 'maybe',
          interviewQuestions: [],
        },
      ],
    });

    const result = await runHrRankingUseCase({
      config: ovhConfig,
      jobTitle: 'Backend Engineer',
      jobDescription: 'Build resilient APIs',
      cvs: [{ id: 'x', filename: 'x.txt', text: 'cv-x' }],
    });

    expect(rankByProvider.ovh).toHaveBeenCalledTimes(1);
    expect(rankByProvider.llm7).toHaveBeenCalledTimes(1);
    expect(result.providerNotice).toMatchObject({
      primaryProvider: 'ovh',
      fallbackProvider: 'llm7',
      reasonKind: 'network',
    });
  });
});

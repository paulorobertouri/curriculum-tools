import { describe, expect, it, vi } from 'vitest';

import { runHrRankingUseCase } from '@/application/hr/runHrRankingUseCase';
import { AiConfig } from '@/domain/aiTypes';
import { rankByProvider } from '@/providers';

vi.mock('@/providers', () => {
  const rankByProvider = {
    openai: vi.fn(),
  };

  return {
    getProviderAdapter: (provider: string) => ({
      rankHrCvs: rankByProvider[provider as 'openai'],
    }),
    rankByProvider,
  };
});

describe('runHrRankingUseCase', () => {
  const config: AiConfig = {
    provider: 'openai',
    apiKey: 'key',
    model: 'gpt-4',
    savedAt: '2026-05-16',
  };

  it('calls the provider for each CV and sorts results', async () => {
    rankByProvider.openai
      .mockResolvedValueOnce({
        candidates: [
          {
            id: 'c1',
            score: 8,
            filename: 'f1.txt',
            justification: 'j1',
            strengths: [],
            concerns: [],
            interviewRecommendation: 'maybe',
            interviewQuestions: [],
          },
        ],
      })
      .mockResolvedValueOnce({
        candidates: [
          {
            id: 'c2',
            score: 9,
            filename: 'f2.txt',
            justification: 'j2',
            strengths: [],
            concerns: [],
            interviewRecommendation: 'maybe',
            interviewQuestions: [],
          },
        ],
      });

    const result = await runHrRankingUseCase({
      config,
      jobTitle: 'T',
      jobDescription: 'D',
      cvs: [
        { id: 'c1', filename: 'f1.txt', text: 't1' },
        { id: 'c2', filename: 'f2.txt', text: 't2' },
      ],
    });

    expect(result.ranking.candidates).toHaveLength(2);
    expect(result.ranking.candidates[0].id).toBe('c2'); // Sorted by score desc
    expect(result.ranking.candidates[1].id).toBe('c1');
    expect(rankByProvider.openai).toHaveBeenCalledTimes(2);
  });
});

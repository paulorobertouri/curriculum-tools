import { describe, expect, it, vi } from 'vitest';

import { runHrRankingUseCase } from '@/application/hr/runHrRankingUseCase';
import { AiConfig } from '@/domain/aiTypes';

const rankHrCvsMock = vi.fn();

vi.mock('@/providers', () => ({
  getProviderAdapter: () => ({
    rankHrCvs: rankHrCvsMock,
  }),
}));

const config: AiConfig = {
  provider: 'openai',
  apiKey: 'sk-test',
  model: 'gpt-5-mini',
  savedAt: '2026-05-18T00:00:00.000Z',
};

describe('runHrRankingUseCase', () => {
  it('given multiple cvs when executed then evaluates separately and sorts deterministically', async () => {
    rankHrCvsMock
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

    expect(rankHrCvsMock).toHaveBeenCalledTimes(2);
    expect(progress).toHaveBeenNthCalledWith(1, 1, 2);
    expect(progress).toHaveBeenNthCalledWith(2, 2, 2);
    expect(result.candidates.map(candidate => candidate.id)).toEqual(['a', 'b']);
  });

  it('given missing provider candidate when executed then creates fallback entry', async () => {
    rankHrCvsMock.mockResolvedValueOnce({ candidates: [] });

    const result = await runHrRankingUseCase({
      config,
      jobTitle: 'Backend Engineer',
      jobDescription: 'Build resilient APIs',
      cvs: [{ id: 'x', filename: 'x.txt', text: 'cv-x' }],
    });

    expect(result.candidates[0]).toMatchObject({
      id: 'x',
      filename: 'x.txt',
      score: 0,
      interviewRecommendation: 'maybe',
    });
  });
});

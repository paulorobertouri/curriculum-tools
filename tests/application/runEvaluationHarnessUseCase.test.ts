import { describe, expect, it, vi } from 'vitest';

import { runEvaluationHarnessUseCase } from '@/application/quality/runEvaluationHarnessUseCase';
import { AiConfig } from '@/domain/aiTypes';

const mockAdapter = {
  testConnection: vi.fn(),
  listModels: vi.fn(),
  reviewCandidateCv: vi.fn(),
  rankHrCvs: vi.fn(),
};

vi.mock('@/providers', () => ({
  getProviderAdapter: vi.fn(() => mockAdapter),
}));

describe('runEvaluationHarnessUseCase', () => {
  const config: AiConfig = {
    provider: 'openai',
    apiKey: 'key',
    model: 'gpt-5.4-mini',
    savedAt: '2026-05-18T00:00:00.000Z',
  };

  it('builds an evaluation run from all fixtures', async () => {
    mockAdapter.reviewCandidateCv.mockResolvedValue({ score: 8.2 });
    mockAdapter.rankHrCvs.mockResolvedValue({
      candidates: [
        { id: 'candidate-1', score: 7.5 },
        { id: 'candidate-2', score: 6.5 },
      ],
    });

    const run = await runEvaluationHarnessUseCase(config);

    expect(run.provider).toBe('openai');
    expect(run.model).toBe('gpt-5.4-mini');
    expect(run.id).toBeTypeOf('string');
    expect(run.ranAt).toBeTypeOf('string');
    expect(run.candidateRuns.length).toBeGreaterThan(0);
    expect(run.hrRuns.length).toBeGreaterThan(0);
    expect(run.hrRuns[0].candidateOrder).toEqual([
      'candidate-1',
      'candidate-2',
    ]);
    expect(run.hrRuns[0].averageScore).toBe(7);
  });
});

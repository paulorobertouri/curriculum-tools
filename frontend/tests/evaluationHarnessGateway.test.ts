import { describe, expect, it, vi } from 'vitest';

import {
  loadEvaluationRuns,
  persistEvaluationRuns,
} from '@/quality/evaluationHarnessGateway';

vi.mock('@/common/storage/evaluationHarnessStorage', () => ({
  readEvaluationRuns: vi.fn(() => [
    {
      id: 'run-1',
      provider: 'openai',
      model: 'gpt-5.4-mini',
      promptVersions: { candidate: 'v1' },
      ranAt: '2026-05-18T00:00:00.000Z',
      candidateRuns: [{ fixtureId: 'fixture-1', score: 8.5 }],
      hrRuns: [
        {
          fixtureId: 'hr-1',
          candidateOrder: ['candidate-1'],
          averageScore: 8.5,
        },
      ],
    },
  ]),
  saveEvaluationRuns: vi.fn(),
}));

describe('evaluationHarnessGateway', () => {
  it('loads runs through the storage boundary', async () => {
    const storage = await import('@/common/storage/evaluationHarnessStorage');

    expect(loadEvaluationRuns()).toHaveLength(1);
    expect(storage.readEvaluationRuns).toHaveBeenCalledTimes(1);
  });

  it('persists runs through the storage boundary', async () => {
    const storage = await import('@/common/storage/evaluationHarnessStorage');
    const runs = loadEvaluationRuns();

    persistEvaluationRuns(runs);

    expect(storage.saveEvaluationRuns).toHaveBeenCalledWith(runs);
  });
});

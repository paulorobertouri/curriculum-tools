import { describe, expect, it } from 'vitest';

import {
  EvaluationRun,
  readEvaluationRuns,
  saveEvaluationRuns,
} from '@/storage/evaluationHarnessStorage';

const makeRun = (index: number): EvaluationRun => ({
  id: `run-${index}`,
  provider: 'openai',
  model: 'gpt-5.4-mini',
  promptVersions: {
    candidate: '1.0.0',
    hr: '1.0.0',
    candidateToolkit: '1.0.0',
  },
  ranAt: new Date(
    `2026-05-${String((index % 28) + 1).padStart(2, '0')}T00:00:00.000Z`,
  ).toISOString(),
  candidateRuns: [{ fixtureId: 'candidate-1', score: 8.4 }],
  hrRuns: [
    { fixtureId: 'hr-1', candidateOrder: ['a', 'b'], averageScore: 8.1 },
  ],
});

describe('evaluationHarnessStorage', () => {
  it('returns empty array when storage is empty', () => {
    const storage = window.localStorage;
    storage.clear();

    expect(readEvaluationRuns(storage)).toEqual([]);
  });

  it('returns empty array for malformed JSON', () => {
    const storage = window.localStorage;
    storage.clear();
    storage.setItem('curriculum-tools.evaluationHarness.v1', '{not-json');

    expect(readEvaluationRuns(storage)).toEqual([]);
  });

  it('filters out invalid run entries and keeps valid ones', () => {
    const storage = window.localStorage;
    storage.clear();

    const validRun = makeRun(1);
    storage.setItem(
      'curriculum-tools.evaluationHarness.v1',
      JSON.stringify([
        validRun,
        {
          id: 'missing-fields',
          provider: 'openai',
          model: 'gpt-5.4-mini',
          ranAt: '2026-05-18T00:00:00.000Z',
          candidateRuns: 'not-array',
          hrRuns: [],
        },
      ]),
    );

    expect(readEvaluationRuns(storage)).toEqual([validRun]);
  });

  it('keeps only the latest 30 runs when saving', () => {
    const storage = window.localStorage;
    storage.clear();

    const runs = Array.from({ length: 35 }, (_, index) => makeRun(index + 1));
    saveEvaluationRuns(runs, storage);

    const parsed = readEvaluationRuns(storage);
    expect(parsed).toHaveLength(30);
    expect(parsed[0]?.id).toBe('run-6');
    expect(parsed[29]?.id).toBe('run-35');
  });
});

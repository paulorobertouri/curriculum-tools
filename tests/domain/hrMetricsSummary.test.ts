import { describe, expect, it } from 'vitest';

import { buildHrMetricsSummary } from '@/domain/hrMetricsSummary';

describe('hrMetricsSummary', () => {
  it('summarizes scores and recommendation counts for export', () => {
    const summary = buildHrMetricsSummary({
      candidates: [
        {
          id: '2',
          filename: 'bravo.txt',
          score: 7.5,
          justification: 'Solid candidate.',
          strengths: [],
          concerns: [],
          interviewRecommendation: 'yes',
          interviewQuestions: [],
        },
        {
          id: '1',
          filename: 'alpha.txt',
          score: 9.0,
          justification: 'Best fit.',
          strengths: [],
          concerns: [],
          interviewRecommendation: 'strong_yes',
          interviewQuestions: [],
        },
        {
          id: '3',
          filename: 'charlie.txt',
          score: 6.0,
          justification: 'Needs review.',
          strengths: [],
          concerns: [],
          interviewRecommendation: 'maybe',
          interviewQuestions: [],
        },
      ],
    });

    expect(summary.totalCandidates).toBe(3);
    expect(summary.averageScore).toBeCloseTo(7.5, 1);
    expect(summary.topScore).toBe(9.0);
    expect(summary.lowestScore).toBe(6.0);
    expect(summary.medianScore).toBe(7.5);
    expect(summary.standardDeviation).toBeCloseTo(1.2, 1);
    expect(summary.scoreSpread).toBeCloseTo(3.0, 1);
    expect(summary.yesOrBetterRate).toBeCloseTo(66.7, 1);
    expect(summary.recommendationCounts).toEqual({
      strong_yes: 1,
      yes: 1,
      maybe: 1,
      no: 0,
    });
    expect(summary.topCandidate?.id).toBe('2');
    expect(summary.topCandidateLabel).toBe('bravo.txt');
  });

  it('returns safe defaults when no candidates are present', () => {
    const summary = buildHrMetricsSummary({ candidates: [] });

    expect(summary.totalCandidates).toBe(0);
    expect(summary.averageScore).toBe(0);
    expect(summary.topScore).toBe(0);
    expect(summary.lowestScore).toBe(0);
    expect(summary.medianScore).toBe(0);
    expect(summary.standardDeviation).toBe(0);
    expect(summary.scoreSpread).toBe(0);
    expect(summary.yesOrBetterRate).toBe(0);
    expect(summary.recommendationCounts).toEqual({
      strong_yes: 0,
      yes: 0,
      maybe: 0,
      no: 0,
    });
    expect(summary.topCandidate).toBeNull();
    expect(summary.topCandidateLabel).toBe('N/A');
  });
});

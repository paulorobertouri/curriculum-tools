import { describe, expect, it } from 'vitest';

import {
  HrRankingResult,
  InterviewRecommendation,
} from '@/common/core/aiTypes';
import { buildHrPipelineMetrics } from '@/common/core/hrPipelineMetrics';

const makeCandidate = (
  score: number,
  recommendation: InterviewRecommendation,
  strengths: string[] = ['Strong skill'],
  concerns: string[] = ['Some concern'],
) => ({
  id: `candidate-${score}`,
  filename: `cv-${score}.pdf`,
  score,
  justification: 'Test justification',
  strengths,
  concerns,
  interviewRecommendation: recommendation,
  interviewQuestions: [],
});

const makeResult = (
  candidates: ReturnType<typeof makeCandidate>[],
): HrRankingResult => ({
  candidates,
});

describe('buildHrPipelineMetrics', () => {
  it('computes score distribution across 5 buckets', () => {
    const result = makeResult([
      makeCandidate(1.5, 'no'),
      makeCandidate(3.0, 'maybe'),
      makeCandidate(5.5, 'maybe'),
      makeCandidate(7.0, 'yes'),
      makeCandidate(9.5, 'strong_yes'),
    ]);

    const metrics = buildHrPipelineMetrics(result);

    expect(metrics.scoreDistribution).toHaveLength(5);
    expect(metrics.scoreDistribution[0].count).toBe(1); // 0-2
    expect(metrics.scoreDistribution[1].count).toBe(1); // 2-4
    expect(metrics.scoreDistribution[2].count).toBe(1); // 4-6
    expect(metrics.scoreDistribution[3].count).toBe(1); // 6-8
    expect(metrics.scoreDistribution[4].count).toBe(1); // 8-10
  });

  it('computes interview funnel with cumulative rates', () => {
    const result = makeResult([
      makeCandidate(9.0, 'strong_yes'),
      makeCandidate(8.0, 'yes'),
      makeCandidate(6.0, 'maybe'),
      makeCandidate(3.0, 'no'),
    ]);

    const metrics = buildHrPipelineMetrics(result);

    expect(metrics.interviewFunnel).toHaveLength(4);
    expect(metrics.interviewFunnel[0].recommendation).toBe('strong_yes');
    expect(metrics.interviewFunnel[0].count).toBe(1);
    expect(metrics.interviewFunnel[3].recommendation).toBe('no');
    expect(metrics.interviewFunnel[3].cumulativeRate).toBe(100);
  });

  it('computes shortlist efficiency', () => {
    const result = makeResult([
      makeCandidate(9.0, 'strong_yes'),
      makeCandidate(8.0, 'yes'),
      makeCandidate(5.0, 'maybe'),
      makeCandidate(2.0, 'no'),
    ]);

    const metrics = buildHrPipelineMetrics(result);

    expect(metrics.shortlistEfficiency).toBe(50); // 2 out of 4
  });

  it('computes strength diversity', () => {
    const result = makeResult([
      makeCandidate(9.0, 'strong_yes', ['React development expertise']),
      makeCandidate(8.0, 'yes', ['Python backend mastery']),
      makeCandidate(7.0, 'maybe', ['Docker container skills']),
    ]);

    const metrics = buildHrPipelineMetrics(result);

    expect(metrics.strengthDiversity).toBeGreaterThan(0);
  });

  it('identifies top concern keywords', () => {
    const result = makeResult([
      makeCandidate(
        5.0,
        'maybe',
        [],
        ['Limited testing experience', 'No Docker knowledge'],
      ),
      makeCandidate(
        4.0,
        'no',
        [],
        ['Limited testing background', 'Poor communication skills'],
      ),
    ]);

    const metrics = buildHrPipelineMetrics(result);

    expect(metrics.topConcerns.length).toBeGreaterThan(0);
    const keywords = metrics.topConcerns.map(c => c.keyword);
    expect(keywords).toContain('limited');
  });

  it('handles empty candidate list', () => {
    const metrics = buildHrPipelineMetrics({ candidates: [] });

    expect(metrics.scoreDistribution.every(b => b.count === 0)).toBe(true);
    expect(metrics.interviewFunnel.every(s => s.count === 0)).toBe(true);
    expect(metrics.shortlistEfficiency).toBe(0);
    expect(metrics.strengthDiversity).toBe(0);
    expect(metrics.topConcerns).toEqual([]);
  });
});

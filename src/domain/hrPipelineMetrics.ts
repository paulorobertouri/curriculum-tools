/**
 * Extended hiring pipeline analytics built on top of HR ranking results.
 */
import { HrRankingResult, InterviewRecommendation } from '@/domain/aiTypes';
import { extractKeywords } from '@/domain/textAnalysis';

export type ScoreDistributionBucket = {
  label: string;
  min: number;
  max: number;
  count: number;
};

export type InterviewFunnelStage = {
  recommendation: InterviewRecommendation;
  count: number;
  cumulativeRate: number;
};

export type ConcernFrequencyItem = {
  keyword: string;
  count: number;
};

export type HrPipelineMetrics = {
  scoreDistribution: ScoreDistributionBucket[];
  interviewFunnel: InterviewFunnelStage[];
  strengthDiversity: number;
  topConcerns: ConcernFrequencyItem[];
  shortlistEfficiency: number;
};

const SCORE_BUCKETS: Array<{ label: string; min: number; max: number }> = [
  { label: '0–2', min: 0, max: 2 },
  { label: '2–4', min: 2, max: 4 },
  { label: '4–6', min: 4, max: 6 },
  { label: '6–8', min: 6, max: 8 },
  { label: '8–10', min: 8, max: 10 },
];

const FUNNEL_ORDER: InterviewRecommendation[] = [
  'strong_yes',
  'yes',
  'maybe',
  'no',
];

export const buildHrPipelineMetrics = (
  result: HrRankingResult,
): HrPipelineMetrics => {
  const total = result.candidates.length;

  // Score distribution
  const scoreDistribution = SCORE_BUCKETS.map(bucket => ({
    ...bucket,
    count: result.candidates.filter(candidate => {
      if (bucket.max === 10) {
        return candidate.score >= bucket.min && candidate.score <= bucket.max;
      }
      return candidate.score >= bucket.min && candidate.score < bucket.max;
    }).length,
  }));

  // Interview funnel
  const recommendationCounts = result.candidates.reduce(
    (acc, candidate) => {
      acc[candidate.interviewRecommendation] += 1;
      return acc;
    },
    { strong_yes: 0, yes: 0, maybe: 0, no: 0 } as Record<
      InterviewRecommendation,
      number
    >,
  );

  let cumulative = 0;
  const interviewFunnel = FUNNEL_ORDER.map(recommendation => {
    cumulative += recommendationCounts[recommendation];
    return {
      recommendation,
      count: recommendationCounts[recommendation],
      cumulativeRate:
        total > 0 ? Number(((cumulative / total) * 100).toFixed(0)) : 0,
    };
  });

  // Strength diversity: unique top-strength themes
  const allStrengthKeywords = new Set<string>();
  for (const candidate of result.candidates) {
    const firstStrength = candidate.strengths[0];
    if (firstStrength) {
      for (const keyword of extractKeywords(firstStrength, { minLength: 4 })) {
        allStrengthKeywords.add(keyword);
      }
    }
  }
  const strengthDiversity = allStrengthKeywords.size;

  // Concern frequency
  const concernFrequency = new Map<string, number>();
  for (const candidate of result.candidates) {
    for (const concern of candidate.concerns) {
      for (const keyword of extractKeywords(concern, {
        minLength: 4,
        maxKeywords: 4,
      })) {
        concernFrequency.set(keyword, (concernFrequency.get(keyword) ?? 0) + 1);
      }
    }
  }

  const topConcerns = Array.from(concernFrequency.entries())
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Shortlist efficiency
  const shortlistCount =
    recommendationCounts.strong_yes + recommendationCounts.yes;
  const shortlistEfficiency =
    total > 0 ? Number(((shortlistCount / total) * 100).toFixed(0)) : 0;

  return {
    scoreDistribution,
    interviewFunnel,
    strengthDiversity,
    topConcerns,
    shortlistEfficiency,
  };
};

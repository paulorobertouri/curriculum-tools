import {
  HrRankingResult,
  InterviewRecommendation,
  RankedCandidate,
} from '@/domain/aiTypes';

export type HrMetricsSummary = {
  totalCandidates: number;
  averageScore: number;
  medianScore: number;
  standardDeviation: number;
  topScore: number;
  lowestScore: number;
  scoreSpread: number;
  yesOrBetterRate: number;
  recommendationCounts: Record<InterviewRecommendation, number>;
  topCandidate: RankedCandidate | null;
  topCandidateLabel: string;
};

const createRecommendationCounts = () => ({
  strong_yes: 0,
  yes: 0,
  maybe: 0,
  no: 0,
});

export const buildHrMetricsSummary = (
  result: HrRankingResult,
): HrMetricsSummary => {
  const totalCandidates = result.candidates.length;
  const scores = result.candidates.map(candidate => candidate.score);
  const averageScore =
    scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;
  const topScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
  const sortedScores = [...scores].sort((left, right) => left - right);
  const medianScore =
    sortedScores.length === 0
      ? 0
      : sortedScores.length % 2 === 0
        ?
          (sortedScores[sortedScores.length / 2 - 1] +
            sortedScores[sortedScores.length / 2]) /
          2
        : sortedScores[Math.floor(sortedScores.length / 2)];
  const variance =
    scores.length > 0
      ? scores.reduce((sum, score) => sum + (score - averageScore) ** 2, 0) /
        scores.length
      : 0;
  const standardDeviation = Math.sqrt(variance);
  const recommendationCounts = result.candidates.reduce(
    (accumulator, candidate) => {
      accumulator[candidate.interviewRecommendation] += 1;
      return accumulator;
    },
    createRecommendationCounts(),
  );

  return {
    totalCandidates,
    averageScore,
    medianScore,
    standardDeviation,
    topScore,
    lowestScore,
    scoreSpread: Math.max(0, topScore - averageScore),
    yesOrBetterRate:
      totalCandidates > 0
        ?
          ((recommendationCounts.strong_yes + recommendationCounts.yes) /
            totalCandidates) *
          100
        : 0,
    recommendationCounts,
    topCandidate: result.candidates[0] ?? null,
    topCandidateLabel:
      result.candidates[0]?.detectedName ??
      result.candidates[0]?.filename ??
      'N/A',
  };
};

import { CandidateReview, HrRankingResult } from '@/common/core/aiTypes';
import { extractKeywords, findEvidence } from '@/common/core/textAnalysis';

export type EvidenceTraceItem = {
  claim: string;
  evidence: string | null;
  supported: boolean;
};

export type CandidateQualitySummary = {
  confidenceScore: number;
  evidenceCoverageRate: number;
  hallucinationRiskScore: number;
  unsupportedClaims: string[];
  traces: EvidenceTraceItem[];
};

const computeHallucinationRisk = (
  traces: EvidenceTraceItem[],
  cvText: string,
): number => {
  if (traces.length === 0) {
    return 0;
  }

  const cvKeywords = new Set(extractKeywords(cvText));

  let zeroOverlapCount = 0;

  for (const trace of traces) {
    const claimKeywords = extractKeywords(trace.claim);
    const hasAnyOverlap = claimKeywords.some(keyword =>
      cvKeywords.has(keyword),
    );

    if (!hasAnyOverlap) {
      zeroOverlapCount += 1;
    }
  }

  return Number(((zeroOverlapCount / traces.length) * 100).toFixed(0));
};

export const buildCandidateQualitySummary = (
  cvText: string,
  review: CandidateReview,
): CandidateQualitySummary => {
  const claims = [
    ...review.strengths,
    ...review.gaps,
    ...review.recommendations,
    ...review.rewrittenBullets,
  ];

  const traces = claims.map(claim => {
    const evidence = findEvidence(claim, cvText);
    return {
      claim,
      evidence,
      supported: Boolean(evidence),
    };
  });

  const supportedCount = traces.filter(trace => trace.supported).length;
  const evidenceCoverageRate =
    traces.length > 0 ? (supportedCount / traces.length) * 100 : 0;

  const completenessSignals = [
    review.summary.trim().length > 0,
    review.rewrittenCv.trim().length > 0,
    review.coverLetter.trim().length > 0,
    review.interviewQa.length >= 3,
  ];
  const completenessRate =
    (completenessSignals.filter(Boolean).length / completenessSignals.length) *
    100;

  const confidenceScore = Number(
    Math.min(
      100,
      evidenceCoverageRate * 0.65 + completenessRate * 0.35,
    ).toFixed(0),
  );

  const hallucinationRiskScore = computeHallucinationRisk(traces, cvText);

  return {
    confidenceScore,
    evidenceCoverageRate: Number(evidenceCoverageRate.toFixed(0)),
    hallucinationRiskScore,
    unsupportedClaims: traces
      .filter(trace => !trace.supported)
      .map(trace => trace.claim),
    traces,
  };
};

export type HrRankDiffSummary = {
  previousAverage: number;
  currentAverage: number;
  averageDelta: number;
  rankSwapCount: number;
};

export type HrCandidateQualitySummary = {
  confidenceScore: number;
  unsupportedClaims: string[];
  traces: EvidenceTraceItem[];
};

export const buildHrCandidateQualitySummary = (
  cvText: string,
  claims: string[],
): HrCandidateQualitySummary => {
  const traces = claims.map(claim => {
    const evidence = findEvidence(claim, cvText);
    return {
      claim,
      evidence,
      supported: Boolean(evidence),
    };
  });

  const supported = traces.filter(item => item.supported).length;
  const confidenceScore =
    traces.length > 0
      ? Number(((supported / traces.length) * 100).toFixed(0))
      : 0;

  return {
    confidenceScore,
    unsupportedClaims: traces
      .filter(item => !item.supported)
      .map(item => item.claim),
    traces,
  };
};

const averageScore = (result: HrRankingResult) => {
  if (result.candidates.length === 0) {
    return 0;
  }

  return (
    result.candidates.reduce((sum, candidate) => sum + candidate.score, 0) /
    result.candidates.length
  );
};

export const buildHrRankDiffSummary = (
  previous: HrRankingResult,
  current: HrRankingResult,
): HrRankDiffSummary => {
  const previousPositions = new Map(
    previous.candidates.map((candidate, index) => [candidate.id, index]),
  );

  let rankSwapCount = 0;

  current.candidates.forEach((candidate, index) => {
    const previousIndex = previousPositions.get(candidate.id);
    if (typeof previousIndex === 'number' && previousIndex !== index) {
      rankSwapCount += 1;
    }
  });

  const previousAverage = averageScore(previous);
  const currentAverage = averageScore(current);

  return {
    previousAverage,
    currentAverage,
    averageDelta: Number((currentAverage - previousAverage).toFixed(1)),
    rankSwapCount,
  };
};

import { CandidateReview, HrRankingResult } from '@/domain/aiTypes';

export type EvidenceTraceItem = {
  claim: string;
  evidence: string | null;
  supported: boolean;
};

export type CandidateQualitySummary = {
  confidenceScore: number;
  evidenceCoverageRate: number;
  unsupportedClaims: string[];
  traces: EvidenceTraceItem[];
};

const stopWords = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'this',
  'that',
  'have',
  'has',
  'your',
  'into',
  'about',
  'role',
  'work',
  'were',
]);

const extractKeywords = (text: string) =>
  Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word)),
    ),
  );

const toSentences = (text: string) =>
  text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(item => item.trim())
    .filter(Boolean);

const findEvidence = (claim: string, source: string): string | null => {
  const keywords = extractKeywords(claim).slice(0, 6);
  if (keywords.length === 0) {
    return null;
  }

  const sentences = toSentences(source);
  let best: { sentence: string; score: number } | null = null;

  for (const sentence of sentences) {
    const lowered = sentence.toLowerCase();
    const score = keywords.filter(keyword => lowered.includes(keyword)).length;

    if (score === 0) {
      continue;
    }

    if (!best || score > best.score) {
      best = { sentence, score };
    }
  }

  return best && best.score >= 2 ? best.sentence : null;
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

  return {
    confidenceScore,
    evidenceCoverageRate: Number(evidenceCoverageRate.toFixed(0)),
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

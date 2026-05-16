import {
  CandidateReview,
  HrRankingResult,
  InterviewRecommendation,
} from '@/domain/aiTypes';

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => String(item ?? '').trim())
    .filter(item => item.length > 0);
};

export const normalizeScore = (value: unknown): number => {
  const parsed =
    typeof value === 'number' ? value : Number.parseFloat(String(value ?? '0'));

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(10, Math.max(0, Number(parsed.toFixed(1))));
};

export const normalizeCandidateReview = (
  value: Record<string, unknown>,
): CandidateReview => ({
  score: normalizeScore(value.score),
  summary: String(value.summary ?? 'No summary provided.'),
  strengths: asStringArray(value.strengths),
  gaps: asStringArray(value.gaps),
  recommendations: asStringArray(value.recommendations),
  rewrittenBullets: asStringArray(value.rewrittenBullets),
});

export const normalizeHrRanking = (
  value: Record<string, unknown>,
): HrRankingResult => {
  const candidates = Array.isArray(value.candidates) ? value.candidates : [];

  return {
    candidates: candidates
      .filter(
        (candidate): candidate is Record<string, unknown> =>
          typeof candidate === 'object' && candidate !== null,
      )
      .map(candidate => ({
        id: String(candidate.id ?? candidate.filename ?? crypto.randomUUID()),
        filename: String(candidate.filename ?? 'Unknown file'),
        detectedName:
          typeof candidate.detectedName === 'string'
            ? candidate.detectedName
            : undefined,
        score: normalizeScore(candidate.score),
        justification: String(
          candidate.justification ?? 'No justification provided.',
        ),
        strengths: asStringArray(candidate.strengths),
        concerns: asStringArray(candidate.concerns),
        interviewRecommendation: normalizeRecommendation(
          candidate.interviewRecommendation,
        ),
      }))
      .sort((left, right) => right.score - left.score),
  };
};

const normalizeRecommendation = (value: unknown): InterviewRecommendation => {
  if (
    value === 'strong_yes' ||
    value === 'yes' ||
    value === 'maybe' ||
    value === 'no'
  ) {
    return value;
  }

  return 'maybe';
};

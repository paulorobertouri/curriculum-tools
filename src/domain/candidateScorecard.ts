/**
 * Computes a multi-dimensional scorecard from a CandidateReview,
 * combining AI output quality signals with skill gap analysis.
 */
import { CandidateReview } from '@/domain/aiTypes';
import { CandidateQualitySummary } from '@/domain/reviewQuality';
import { SkillGapResult } from '@/domain/skillGapAnalysis';

export type LetterGrade =
  | 'A+'
  | 'A'
  | 'A-'
  | 'B+'
  | 'B'
  | 'B-'
  | 'C+'
  | 'C'
  | 'C-'
  | 'D'
  | 'F';

export type CandidateScorecard = {
  fitScore: number;
  completenessScore: number;
  riskScore: number;
  interviewReadinessScore: number;
  overallGrade: LetterGrade;
};

const computeFitScore = (
  review: CandidateReview,
  quality: CandidateQualitySummary,
  skillGap: SkillGapResult,
): number => {
  // Weighted combination: AI score (50%), evidence coverage (25%), keyword match (25%)
  const normalizedAiScore = (review.score / 10) * 100;
  const fit =
    normalizedAiScore * 0.5 +
    quality.evidenceCoverageRate * 0.25 +
    skillGap.keywordMatchRate * 0.25;

  return clamp(Math.round(fit), 0, 100);
};

const computeCompletenessScore = (review: CandidateReview): number => {
  const signals = [
    review.summary.trim().length > 0,
    review.strengths.length >= 2,
    review.gaps.length >= 1,
    review.recommendations.length >= 2,
    review.rewrittenBullets.length >= 2,
    review.rewrittenCv.trim().length > 0,
    review.coverLetter.trim().length > 0,
    review.interviewQa.length >= 3,
  ];

  const met = signals.filter(Boolean).length;
  return clamp(Math.round((met / signals.length) * 100), 0, 100);
};

const computeRiskScore = (
  review: CandidateReview,
  quality: CandidateQualitySummary,
  skillGap: SkillGapResult,
): number => {
  // Higher risk = more gaps, more unsupported claims, more missing skills
  const gapPenalty = Math.min(40, review.gaps.length * 8);
  const unsupportedPenalty = Math.min(30, quality.unsupportedClaims.length * 5);
  const missingSkillPenalty = Math.min(30, skillGap.missingSkills.length * 4);

  return clamp(gapPenalty + unsupportedPenalty + missingSkillPenalty, 0, 100);
};

const computeInterviewReadiness = (review: CandidateReview): number => {
  const qaScore = Math.min(40, review.interviewQa.length * 7);
  const coverLetterScore = review.coverLetter.trim().length > 50 ? 25 : 0;
  const rewrittenCvScore = review.rewrittenCv.trim().length > 50 ? 25 : 0;
  const bulletsScore = Math.min(10, review.rewrittenBullets.length * 2);

  return clamp(
    qaScore + coverLetterScore + rewrittenCvScore + bulletsScore,
    0,
    100,
  );
};

const deriveLetterGrade = (fitScore: number): LetterGrade => {
  if (fitScore >= 95) return 'A+';
  if (fitScore >= 90) return 'A';
  if (fitScore >= 85) return 'A-';
  if (fitScore >= 80) return 'B+';
  if (fitScore >= 75) return 'B';
  if (fitScore >= 70) return 'B-';
  if (fitScore >= 65) return 'C+';
  if (fitScore >= 60) return 'C';
  if (fitScore >= 55) return 'C-';
  if (fitScore >= 45) return 'D';
  return 'F';
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const buildCandidateScorecard = (
  review: CandidateReview,
  quality: CandidateQualitySummary,
  skillGap: SkillGapResult,
): CandidateScorecard => {
  const fitScore = computeFitScore(review, quality, skillGap);
  const completenessScore = computeCompletenessScore(review);
  const riskScore = computeRiskScore(review, quality, skillGap);
  const interviewReadinessScore = computeInterviewReadiness(review);
  const overallGrade = deriveLetterGrade(fitScore);

  return {
    fitScore,
    completenessScore,
    riskScore,
    interviewReadinessScore,
    overallGrade,
  };
};

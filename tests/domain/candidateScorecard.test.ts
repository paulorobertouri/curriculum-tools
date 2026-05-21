import { describe, expect, it } from 'vitest';

import { CandidateReview } from '@/domain/aiTypes';
import { buildCandidateScorecard } from '@/domain/candidateScorecard';
import { CandidateQualitySummary } from '@/domain/reviewQuality';
import { SkillGapResult } from '@/domain/skillGapAnalysis';

const makeReview = (
  overrides: Partial<CandidateReview> = {},
): CandidateReview => ({
  score: 7.5,
  summary: 'Strong candidate with React experience.',
  strengths: ['React expertise', 'TypeScript skills'],
  gaps: ['No Docker experience'],
  recommendations: ['Learn Docker', 'Add CI/CD skills'],
  rewrittenBullets: ['Built React apps', 'Improved performance'],
  rewrittenCv: 'Full rewritten CV content here with enough detail.',
  coverLetter:
    'Dear hiring manager, I am applying for this role with confidence.',
  interviewQa: [
    { question: 'Q1', suggestedAnswer: 'A1' },
    { question: 'Q2', suggestedAnswer: 'A2' },
    { question: 'Q3', suggestedAnswer: 'A3' },
  ],
  ...overrides,
});

const makeQuality = (
  overrides: Partial<CandidateQualitySummary> = {},
): CandidateQualitySummary => ({
  confidenceScore: 70,
  evidenceCoverageRate: 60,
  hallucinationRiskScore: 10,
  unsupportedClaims: ['Unsupported claim'],
  traces: [],
  ...overrides,
});

const makeSkillGap = (
  overrides: Partial<SkillGapResult> = {},
): SkillGapResult => ({
  matchedSkills: [
    { keyword: 'react', category: 'technical' },
    { keyword: 'typescript', category: 'technical' },
  ],
  missingSkills: [{ keyword: 'docker', category: 'technical' }],
  bonusSkills: [],
  keywordMatchRate: 67,
  categoryBreakdown: {
    technical: { matched: 2, missing: 1 },
    soft: { matched: 0, missing: 0 },
    domain: { matched: 0, missing: 0 },
    other: { matched: 0, missing: 0 },
  },
  ...overrides,
});

describe('buildCandidateScorecard', () => {
  it('produces a scorecard with all dimensions', () => {
    const scorecard = buildCandidateScorecard(
      makeReview(),
      makeQuality(),
      makeSkillGap(),
    );

    expect(scorecard.fitScore).toBeGreaterThanOrEqual(0);
    expect(scorecard.fitScore).toBeLessThanOrEqual(100);
    expect(scorecard.completenessScore).toBeGreaterThanOrEqual(0);
    expect(scorecard.completenessScore).toBeLessThanOrEqual(100);
    expect(scorecard.riskScore).toBeGreaterThanOrEqual(0);
    expect(scorecard.riskScore).toBeLessThanOrEqual(100);
    expect(scorecard.interviewReadinessScore).toBeGreaterThanOrEqual(0);
    expect(scorecard.interviewReadinessScore).toBeLessThanOrEqual(100);
    expect(scorecard.overallGrade).toBeDefined();
  });

  it('assigns high fit score for strong reviews', () => {
    const scorecard = buildCandidateScorecard(
      makeReview({ score: 9.5 }),
      makeQuality({ evidenceCoverageRate: 90 }),
      makeSkillGap({ keywordMatchRate: 95 }),
    );

    expect(scorecard.fitScore).toBeGreaterThanOrEqual(90);
    expect(['A+', 'A', 'A-']).toContain(scorecard.overallGrade);
  });

  it('assigns low fit score for weak reviews', () => {
    const scorecard = buildCandidateScorecard(
      makeReview({ score: 2.0 }),
      makeQuality({ evidenceCoverageRate: 10 }),
      makeSkillGap({ keywordMatchRate: 5 }),
    );

    expect(scorecard.fitScore).toBeLessThan(50);
    expect(['D', 'F']).toContain(scorecard.overallGrade);
  });

  it('calculates high completeness for fully populated reviews', () => {
    const scorecard = buildCandidateScorecard(
      makeReview(),
      makeQuality(),
      makeSkillGap(),
    );

    expect(scorecard.completenessScore).toBe(100);
  });

  it('calculates low completeness for sparse reviews', () => {
    const scorecard = buildCandidateScorecard(
      makeReview({
        summary: '',
        strengths: [],
        gaps: [],
        recommendations: [],
        rewrittenBullets: [],
        rewrittenCv: '',
        coverLetter: '',
        interviewQa: [],
      }),
      makeQuality(),
      makeSkillGap(),
    );

    expect(scorecard.completenessScore).toBe(0);
  });

  it('computes higher risk for more gaps and unsupported claims', () => {
    const lowRisk = buildCandidateScorecard(
      makeReview({ gaps: [] }),
      makeQuality({ unsupportedClaims: [] }),
      makeSkillGap({ missingSkills: [] }),
    );

    const highRisk = buildCandidateScorecard(
      makeReview({ gaps: ['G1', 'G2', 'G3', 'G4', 'G5'] }),
      makeQuality({
        unsupportedClaims: ['U1', 'U2', 'U3', 'U4', 'U5', 'U6'],
      }),
      makeSkillGap({
        missingSkills: [
          { keyword: 'a', category: 'technical' },
          { keyword: 'b', category: 'technical' },
          { keyword: 'c', category: 'technical' },
          { keyword: 'd', category: 'technical' },
          { keyword: 'e', category: 'technical' },
          { keyword: 'f', category: 'technical' },
          { keyword: 'g', category: 'technical' },
          { keyword: 'h', category: 'technical' },
        ],
      }),
    );

    expect(highRisk.riskScore).toBeGreaterThan(lowRisk.riskScore);
  });

  it('computes interview readiness from toolkit outputs', () => {
    const ready = buildCandidateScorecard(
      makeReview({
        interviewQa: Array.from({ length: 6 }, (_, i) => ({
          question: `Q${i}`,
          suggestedAnswer: `A${i}`,
        })),
        coverLetter:
          'A detailed cover letter that demonstrates strong writing skills.',
        rewrittenCv: 'A comprehensive rewritten CV with multiple sections.',
        rewrittenBullets: ['B1', 'B2', 'B3', 'B4', 'B5'],
      }),
      makeQuality(),
      makeSkillGap(),
    );

    expect(ready.interviewReadinessScore).toBeGreaterThanOrEqual(90);
  });

  it('assigns correct letter grades for the full range of scores', () => {
    const grades: Array<[number, string]> = [
      [98, 'A+'],
      [92, 'A'],
      [87, 'A-'],
      [82, 'B+'],
      [77, 'B'],
      [72, 'B-'],
      [67, 'C+'],
      [62, 'C'],
      [57, 'C-'],
      [47, 'D'],
      [30, 'F'],
    ];

    const dummyQuality = makeQuality({ evidenceCoverageRate: 80 });
    const dummySkillGap = makeSkillGap({ keywordMatchRate: 80 });

    for (const [score, grade] of grades) {
      // fitScore is (review.score * 10 * 0.5) + (quality.evidenceCoverageRate * 0.25) + (skillGap.keywordMatchRate * 0.25)
      // To get fitScore = X, we set review.score = (X - 40) / 5
      const reviewScore = (score - 40) / 5;
      const scorecard = buildCandidateScorecard(
        makeReview({ score: reviewScore }),
        dummyQuality,
        dummySkillGap,
      );
      expect(scorecard.overallGrade).toBe(grade);
    }
  });
});

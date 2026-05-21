import { describe, expect, it } from 'vitest';

import { CandidateReview, HrRankingResult } from '@/domain/aiTypes';
import {
  buildCandidateQualitySummary,
  buildHrCandidateQualitySummary,
  buildHrRankDiffSummary,
} from '@/domain/reviewQuality';

describe('reviewQuality', () => {
  const cvText = `
    Experienced Software Engineer with 5 years in React and Node.js.
    Led a team of 3 developers. Improved performance by 40%.
    Familiar with Docker and AWS.
  `;

  describe('buildCandidateQualitySummary', () => {
    const mockReview: CandidateReview = {
      score: 8.5,
      summary: 'Strong candidate with React experience.',
      strengths: ['5 years of React experience', 'Led a team of 3'],
      gaps: ['No mention of Node.js'],
      recommendations: ['Learn more about React performance'],
      rewrittenBullets: ['Optimized React performance by 40%'],
      rewrittenCv: '...',
      coverLetter: '...',
      interviewQa: [
        { question: 'q1', suggestedAnswer: 'a1' },
        { question: 'q2', suggestedAnswer: 'a2' },
        { question: 'q3', suggestedAnswer: 'a3' },
      ],
    };

    it('calculates quality metrics correctly', () => {
      const summary = buildCandidateQualitySummary(cvText, mockReview);

      expect(summary.evidenceCoverageRate).toBeGreaterThan(0);
      expect(summary.confidenceScore).toBeGreaterThan(0);
      expect(summary.hallucinationRiskScore).toBe(0); // All claims should have some overlap
      expect(summary.traces.length).toBe(
        mockReview.strengths.length +
          mockReview.gaps.length +
          mockReview.recommendations.length +
          mockReview.rewrittenBullets.length,
      );
    });

    it('identifies unsupported claims and hallucination risk', () => {
      const reviewWithHallucination: CandidateReview = {
        ...mockReview,
        strengths: ['Expert in Quantum Computing'], // Not in CV
      };

      const summary = buildCandidateQualitySummary(
        cvText,
        reviewWithHallucination,
      );

      expect(summary.unsupportedClaims).toContain(
        'Expert in Quantum Computing',
      );
      expect(summary.hallucinationRiskScore).toBeGreaterThan(0);
    });

    it('handles empty claims', () => {
      const emptyReview: CandidateReview = {
        ...mockReview,
        strengths: [],
        gaps: [],
        recommendations: [],
        rewrittenBullets: [],
      };

      const summary = buildCandidateQualitySummary(cvText, emptyReview);
      expect(summary.evidenceCoverageRate).toBe(0);
      expect(summary.traces).toHaveLength(0);
    });
  });

  describe('buildHrCandidateQualitySummary', () => {
    it('builds summary for HR candidate claims', () => {
      const claims = ['React experience', 'Led a team', 'Expert in COBOL'];
      const summary = buildHrCandidateQualitySummary(cvText, claims);

      expect(summary.traces).toHaveLength(3);
      expect(summary.traces[0].supported).toBe(true);
      expect(summary.traces[1].supported).toBe(true);
      expect(summary.traces[2].supported).toBe(false);
      expect(summary.confidenceScore).toBe(67); // 2/3 * 100
    });
  });

  describe('buildHrRankDiffSummary', () => {
    const prev: HrRankingResult = {
      candidates: [
        {
          id: '1',
          score: 9,
          filename: 'a.txt',
          justification: '',
          strengths: [],
          concerns: [],
          interviewRecommendation: 'yes',
          interviewQuestions: [],
        },
        {
          id: '2',
          score: 8,
          filename: 'b.txt',
          justification: '',
          strengths: [],
          concerns: [],
          interviewRecommendation: 'yes',
          interviewQuestions: [],
        },
        {
          id: '3',
          score: 7,
          filename: 'c.txt',
          justification: '',
          strengths: [],
          concerns: [],
          interviewRecommendation: 'yes',
          interviewQuestions: [],
        },
      ],
    };

    const curr: HrRankingResult = {
      candidates: [
        {
          id: '2',
          score: 9.5,
          filename: 'b.txt',
          justification: '',
          strengths: [],
          concerns: [],
          interviewRecommendation: 'yes',
          interviewQuestions: [],
        },
        {
          id: '1',
          score: 8.5,
          filename: 'a.txt',
          justification: '',
          strengths: [],
          concerns: [],
          interviewRecommendation: 'yes',
          interviewQuestions: [],
        },
        {
          id: '3',
          score: 7.5,
          filename: 'c.txt',
          justification: '',
          strengths: [],
          concerns: [],
          interviewRecommendation: 'yes',
          interviewQuestions: [],
        },
      ],
    };

    it('calculates average delta and rank swaps', () => {
      const diff = buildHrRankDiffSummary(prev, curr);

      expect(diff.previousAverage).toBe(8);
      expect(diff.currentAverage).toBe(8.5);
      expect(diff.averageDelta).toBe(0.5);
      expect(diff.rankSwapCount).toBe(2); // Candidate 1 and 2 swapped
    });

    it('handles empty results', () => {
      const empty: HrRankingResult = { candidates: [] };
      const diff = buildHrRankDiffSummary(empty, empty);
      expect(diff.previousAverage).toBe(0);
      expect(diff.currentAverage).toBe(0);
      expect(diff.rankSwapCount).toBe(0);
    });
  });
});

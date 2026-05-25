import { describe, expect, it } from 'vitest';

import {
  normalizeCandidateCareerToolkit,
  normalizeCandidateReview,
  normalizeHrRanking,
  normalizeScore,
} from '@/common/core/validation';

describe('validation', () => {
  describe('normalizeScore', () => {
    it('clamps scores between 0 and 10', () => {
      expect(normalizeScore(15)).toBe(10);
      expect(normalizeScore(-5)).toBe(0);
      expect(normalizeScore(7.5)).toBe(7.5);
    });

    it('handles non-numeric strings and invalid values', () => {
      expect(normalizeScore('8.2')).toBe(8.2);
      expect(normalizeScore('not a number')).toBe(0);
      expect(normalizeScore(undefined)).toBe(0);
      expect(normalizeScore(null)).toBe(0);
    });

    it('rounds to one decimal place', () => {
      expect(normalizeScore(8.2345)).toBe(8.2);
    });
  });

  describe('normalizeCandidateReview', () => {
    it('provides defaults for missing fields', () => {
      const result = normalizeCandidateReview({});
      expect(result.score).toBe(0);
      expect(result.summary).toBe('No summary provided.');
      expect(result.strengths).toEqual([]);
      expect(result.interviewQa).toEqual([]);
    });

    it('filters invalid array items and trims strings', () => {
      const result = normalizeCandidateReview({
        strengths: ['  Clean Code  ', '', null, 123],
        interviewQa: [
          { question: 'Q1', suggestedAnswer: 'A1' },
          { question: 'Q2' }, // Missing answer
          null,
        ],
      });

      expect(result.strengths).toEqual(['Clean Code', '123']);
      expect(result.interviewQa).toEqual([
        { question: 'Q1', suggestedAnswer: 'A1' },
      ]);
    });
  });

  describe('normalizeCandidateCareerToolkit', () => {
    it('normalizes career toolkit fields', () => {
      const result = normalizeCandidateCareerToolkit({
        rewrittenCv: '  New CV  ',
        coverLetter: 'Letter',
        interviewQa: [{ question: 'Q', suggestedAnswer: 'A' }],
      });

      expect(result.rewrittenCv).toBe('New CV');
      expect(result.coverLetter).toBe('Letter');
      expect(result.interviewQa).toHaveLength(1);
    });
  });

  describe('normalizeHrRanking', () => {
    it('sorts candidates by score descending', () => {
      const result = normalizeHrRanking({
        candidates: [
          { id: '1', score: 5, filename: 'a.txt' },
          { id: '2', score: 9, filename: 'b.txt' },
        ],
      });

      expect(result.candidates[0].id).toBe('2');
      expect(result.candidates[1].id).toBe('1');
    });

    it('normalizes recommendations', () => {
      const result = normalizeHrRanking({
        candidates: [
          { id: '1', interviewRecommendation: 'strong_yes' },
          { id: '2', interviewRecommendation: 'invalid' },
        ],
      });

      expect(
        result.candidates.find(c => c.id === '1')?.interviewRecommendation,
      ).toBe('strong_yes');
      expect(
        result.candidates.find(c => c.id === '2')?.interviewRecommendation,
      ).toBe('maybe');
    });

    it('handles tie-breaks with filename and id', () => {
      const result = normalizeHrRanking({
        candidates: [
          { id: 'b', score: 7, filename: 'same.txt' },
          { id: 'a', score: 7, filename: 'same.txt' },
        ],
      });

      expect(result.candidates[0].id).toBe('a');
      expect(result.candidates[1].id).toBe('b');
    });
  });
});

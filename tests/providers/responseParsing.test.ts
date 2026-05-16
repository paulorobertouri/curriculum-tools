import { describe, expect, it } from 'vitest';

import {
  normalizeCandidateReview,
  normalizeHrRanking,
} from '@/domain/validation';
import { parseJsonResult } from '@/providers/responseParsing';

describe('responseParsing', () => {
  it('parses fenced candidate JSON and normalizes score', () => {
    const result = parseJsonResult(
      '```json\n{"score":11,"summary":"Good","strengths":["A"]}\n```',
      normalizeCandidateReview,
    );

    expect(result.score).toBe(10);
    expect(result.strengths).toEqual(['A']);
    expect(result.gaps).toEqual([]);
  });

  it('sorts HR ranking results by score', () => {
    const result = parseJsonResult(
      JSON.stringify({
        candidates: [
          { id: 'b', filename: 'b.txt', score: 6 },
          { id: 'a', filename: 'a.txt', score: 9 },
        ],
      }),
      normalizeHrRanking,
    );

    expect(result.candidates.map(candidate => candidate.id)).toEqual([
      'a',
      'b',
    ]);
  });

  it('applies deterministic fallback IDs and tie-break sorting', () => {
    const result = parseJsonResult(
      JSON.stringify({
        candidates: [
          { filename: 'zeta.txt', score: 7 },
          { filename: 'alpha.txt', score: 7 },
        ],
      }),
      normalizeHrRanking,
    );

    expect(result.candidates.map(candidate => candidate.filename)).toEqual([
      'alpha.txt',
      'zeta.txt',
    ]);
    expect(result.candidates[0].id).toBe('candidate-2-alpha.txt');
    expect(result.candidates[1].id).toBe('candidate-1-zeta.txt');
  });

  it('throws a friendly parse error for malformed JSON', () => {
    expect(() => parseJsonResult('not json', normalizeCandidateReview)).toThrow(
      'expected format',
    );
  });
});

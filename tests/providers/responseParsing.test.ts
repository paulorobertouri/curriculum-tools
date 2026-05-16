import { describe, expect, it } from 'vitest';

import { normalizeCandidateReview, normalizeHrRanking } from '@/domain/validation';
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

    expect(result.candidates.map(candidate => candidate.id)).toEqual(['a', 'b']);
  });

  it('throws a friendly parse error for malformed JSON', () => {
    expect(() => parseJsonResult('not json', normalizeCandidateReview)).toThrow(
      'expected format',
    );
  });
});

import { describe, expect, it } from 'vitest';

import { HrCvInput } from '@/domain/aiTypes';
import {
  chunkHrCvs,
  mergeHrRankingResults,
  shouldChunkHrRequest,
} from '@/domain/hrChunking';

const createCv = (
  id: string,
  filename: string,
  textLength: number,
): HrCvInput => ({
  id,
  filename,
  text: 'x'.repeat(textLength),
});

describe('hrChunking', () => {
  it('chunks by file count and total characters', () => {
    const cvs = [
      createCv('a', 'a.txt', 10),
      createCv('b', 'b.txt', 10),
      createCv('c', 'c.txt', 10),
    ];

    expect(shouldChunkHrRequest(cvs, 2, 100)).toBe(true);
    expect(shouldChunkHrRequest(cvs, 10, 20)).toBe(true);
    expect(shouldChunkHrRequest(cvs, 10, 100)).toBe(false);

    const chunks = chunkHrCvs(cvs, 2, 25);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].map(cv => cv.id)).toEqual(['a', 'b']);
    expect(chunks[1].map(cv => cv.id)).toEqual(['c']);
  });

  it('keeps oversized single CV in its own chunk', () => {
    const cvs = [createCv('a', 'a.txt', 60), createCv('b', 'b.txt', 10)];

    const chunks = chunkHrCvs(cvs, 8, 50);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].map(cv => cv.id)).toEqual(['a']);
    expect(chunks[1].map(cv => cv.id)).toEqual(['b']);
  });

  it('merges chunk results deterministically and fills missing entries', () => {
    const cvs = [
      createCv('1', 'charlie.txt', 10),
      createCv('2', 'alpha.txt', 10),
      createCv('3', 'bravo.txt', 10),
    ];

    const merged = mergeHrRankingResults(cvs, [
      {
        candidates: [
          {
            id: '1',
            filename: 'charlie.txt',
            score: 7.5,
            justification: 'Strong backend experience.',
            strengths: ['Node'],
            concerns: [],
            interviewRecommendation: 'yes',
            interviewQuestions: [],
          },
        ],
      },
      {
        candidates: [
          {
            id: '2',
            filename: 'alpha.txt',
            score: 7.5,
            justification: 'Strong frontend experience.',
            strengths: ['React'],
            concerns: [],
            interviewRecommendation: 'yes',
            interviewQuestions: [],
          },
        ],
      },
    ]);

    expect(merged.candidates.map(candidate => candidate.id)).toEqual([
      '2',
      '1',
      '3',
    ]);
    expect(merged.candidates[2].justification).toBe(
      'No ranking details were returned for this CV.',
    );
    expect(merged.candidates[2].score).toBe(0);
  });
});

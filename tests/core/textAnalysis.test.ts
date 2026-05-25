import { describe, expect, it } from 'vitest';

import {
  classifyKeyword,
  computeCosineSimilarity,
  extractKeywords,
  findEvidence,
  toSentences,
} from '@/common/core/textAnalysis';

describe('extractKeywords', () => {
  it('extracts unique lowercase keywords filtering stop words and short words', () => {
    const result = extractKeywords(
      'The React developer has experience with TypeScript and testing',
    );

    expect(result).toContain('react');
    expect(result).toContain('developer');
    expect(result).toContain('experience');
    expect(result).toContain('typescript');
    expect(result).toContain('testing');
    expect(result).not.toContain('the');
    expect(result).not.toContain('and');
    expect(result).not.toContain('has');
    expect(result).not.toContain('with');
  });

  it('respects minLength option', () => {
    const result = extractKeywords('Go API dev ops', { minLength: 4 });
    expect(result).not.toContain('api');
    expect(result).not.toContain('dev');
    expect(result).not.toContain('ops');
  });

  it('respects maxKeywords option', () => {
    const result = extractKeywords(
      'React TypeScript JavaScript Python Java Docker Kubernetes',
      { maxKeywords: 3 },
    );
    expect(result.length).toBe(3);
  });

  it('returns empty array for empty input', () => {
    expect(extractKeywords('')).toEqual([]);
  });

  it('strips non-alphanumeric characters', () => {
    const result = extractKeywords('React.js, TypeScript; Docker!');
    expect(result).toContain('react');
    expect(result).toContain('typescript');
    expect(result).toContain('docker');
  });
});

describe('toSentences', () => {
  it('splits text into sentences', () => {
    const result = toSentences(
      'First sentence. Second sentence! Third sentence?',
    );
    expect(result).toEqual([
      'First sentence.',
      'Second sentence!',
      'Third sentence?',
    ]);
  });

  it('handles single sentence', () => {
    const result = toSentences('Single sentence here.');
    expect(result).toEqual(['Single sentence here.']);
  });

  it('returns empty for empty input', () => {
    expect(toSentences('')).toEqual([]);
  });
});

describe('findEvidence', () => {
  it('returns matching sentence when enough keywords match', () => {
    const source =
      'Built React applications with TypeScript. Improved CI/CD pipelines. Led team of engineers.';
    const result = findEvidence('React and TypeScript experience', source);
    expect(result).toBe('Built React applications with TypeScript.');
  });

  it('returns null when no sentence has enough keyword overlap', () => {
    const result = findEvidence('Managed DevOps pipelines', 'Loves cooking.');
    expect(result).toBeNull();
  });

  it('returns null for empty claim', () => {
    expect(findEvidence('', 'some source text')).toBeNull();
  });
});

describe('computeCosineSimilarity', () => {
  it('returns 1.0 for identical texts', () => {
    const result = computeCosineSimilarity(
      'React TypeScript developer',
      'React TypeScript developer',
    );
    expect(result).toBe(1);
  });

  it('returns 0 for completely different texts', () => {
    const result = computeCosineSimilarity(
      'astronomy biology chemistry',
      'quantum relativity entropy',
    );
    expect(result).toBe(0);
  });

  it('returns value between 0 and 1 for partial overlap', () => {
    const result = computeCosineSimilarity(
      'React TypeScript testing',
      'React JavaScript deployment',
    );
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
  });

  it('returns 0 for empty inputs', () => {
    expect(computeCosineSimilarity('', 'text')).toBe(0);
    expect(computeCosineSimilarity('text', '')).toBe(0);
  });

  it('returns 0 when no keywords remain after filtering', () => {
    // 'the' and 'and' are stop words and will be filtered out
    expect(computeCosineSimilarity('the and', 'the and')).toBe(0);
  });
});

describe('classifyKeyword', () => {
  it('classifies technical keywords', () => {
    expect(classifyKeyword('react')).toBe('technical');
    expect(classifyKeyword('typescript')).toBe('technical');
    expect(classifyKeyword('docker')).toBe('technical');
    expect(classifyKeyword('kubernetes')).toBe('technical');
    expect(classifyKeyword('nextjs')).toBe('technical');
    expect(classifyKeyword('mongodb')).toBe('technical');
  });

  it('classifies soft skill keywords', () => {
    expect(classifyKeyword('leadership')).toBe('soft');
    expect(classifyKeyword('communication')).toBe('soft');
    expect(classifyKeyword('mentoring')).toBe('soft');
    expect(classifyKeyword('problem-solving')).toBe('soft');
  });

  it('classifies technical suffixes', () => {
    expect(classifyKeyword('vuejs')).toBe('technical');
    expect(classifyKeyword('dynamodb')).toBe('technical');
    expect(classifyKeyword('postgresql')).toBe('technical');
    expect(classifyKeyword('secops')).toBe('technical');
  });

  it('classifies unknown keywords as other', () => {
    expect(classifyKeyword('banana')).toBe('other');
    expect(classifyKeyword('quarterly')).toBe('other');
  });
});

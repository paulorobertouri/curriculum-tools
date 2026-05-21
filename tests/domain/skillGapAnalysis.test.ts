import { describe, expect, it } from 'vitest';

import { analyzeSkillGap } from '@/domain/skillGapAnalysis';

describe('analyzeSkillGap', () => {
  it('identifies matched and missing skills', () => {
    const jd =
      'Looking for a React TypeScript developer with Docker experience and leadership skills.';
    const cv =
      'Experienced React developer with TypeScript. Built scalable applications using Python and Django.';

    const result = analyzeSkillGap(jd, cv);

    const matchedKeywords = result.matchedSkills.map(s => s.keyword);
    const missingKeywords = result.missingSkills.map(s => s.keyword);

    expect(matchedKeywords).toContain('react');
    expect(matchedKeywords).toContain('typescript');
    expect(matchedKeywords).toContain('developer');
    expect(missingKeywords).toContain('docker');
    expect(missingKeywords).toContain('leadership');
  });

  it('calculates keyword match rate', () => {
    const jd = 'React TypeScript testing deployment';
    const cv = 'React TypeScript experience';

    const result = analyzeSkillGap(jd, cv);

    expect(result.keywordMatchRate).toBeGreaterThan(0);
    expect(result.keywordMatchRate).toBeLessThanOrEqual(100);
  });

  it('identifies bonus skills from CV not in JD', () => {
    const jd = 'Looking for a React developer.';
    const cv =
      'React developer with Docker and Kubernetes experience plus mentoring skills.';

    const result = analyzeSkillGap(jd, cv);

    const bonusKeywords = result.bonusSkills.map(s => s.keyword);
    expect(bonusKeywords).toContain('docker');
    expect(bonusKeywords).toContain('kubernetes');
  });

  it('provides category breakdown', () => {
    const jd = 'React TypeScript leadership communication';
    const cv = 'React TypeScript developer';

    const result = analyzeSkillGap(jd, cv);

    expect(result.categoryBreakdown.technical).toBeDefined();
    expect(result.categoryBreakdown.soft).toBeDefined();
    expect(result.categoryBreakdown.technical.matched).toBeGreaterThanOrEqual(
      0,
    );
  });

  it('handles empty inputs', () => {
    const result = analyzeSkillGap('', '');

    expect(result.matchedSkills).toEqual([]);
    expect(result.missingSkills).toEqual([]);
    expect(result.bonusSkills).toEqual([]);
    expect(result.keywordMatchRate).toBe(0);
  });

  it('limits bonus skills to 15 items', () => {
    const jd = 'Frontend developer wanted.';
    const cv = Array.from({ length: 25 }, (_, i) => `skill${i}react`).join(' ');

    const result = analyzeSkillGap(jd, cv);
    expect(result.bonusSkills.length).toBeLessThanOrEqual(15);
  });
});

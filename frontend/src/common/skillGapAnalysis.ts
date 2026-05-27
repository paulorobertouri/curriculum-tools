/**
 * Cross-references job description keywords against CV text
 * to produce a structured skill gap analysis.
 */
import {
  KeywordCategory,
  classifyKeyword,
  extractKeywords,
} from '@/common/core/textAnalysis';

export type SkillMatch = {
  keyword: string;
  category: KeywordCategory;
};

export type SkillGapResult = {
  matchedSkills: SkillMatch[];
  missingSkills: SkillMatch[];
  bonusSkills: SkillMatch[];
  keywordMatchRate: number;
  categoryBreakdown: Record<
    KeywordCategory,
    { matched: number; missing: number }
  >;
};

const createEmptyCategoryBreakdown = (): Record<
  KeywordCategory,
  { matched: number; missing: number }
> => ({
  technical: { matched: 0, missing: 0 },
  soft: { matched: 0, missing: 0 },
  domain: { matched: 0, missing: 0 },
  other: { matched: 0, missing: 0 },
});

export const analyzeSkillGap = (
  jobDescription: string,
  cvText: string,
): SkillGapResult => {
  const jdKeywords = extractKeywords(jobDescription, { minLength: 3 });
  const cvKeywords = new Set(extractKeywords(cvText, { minLength: 3 }));

  const matchedSkills: SkillMatch[] = [];
  const missingSkills: SkillMatch[] = [];
  const categoryBreakdown = createEmptyCategoryBreakdown();

  for (const keyword of jdKeywords) {
    const category = classifyKeyword(keyword);
    const match: SkillMatch = { keyword, category };

    if (cvKeywords.has(keyword)) {
      matchedSkills.push(match);
      categoryBreakdown[category].matched += 1;
    } else {
      missingSkills.push(match);
      categoryBreakdown[category].missing += 1;
    }
  }

  // Find bonus skills: in CV but not in JD
  const jdKeywordSet = new Set(jdKeywords);
  const cvKeywordList = extractKeywords(cvText, { minLength: 3 });
  const bonusSkills: SkillMatch[] = [];
  const seenBonus = new Set<string>();

  for (const keyword of cvKeywordList) {
    if (!jdKeywordSet.has(keyword) && !seenBonus.has(keyword)) {
      const category = classifyKeyword(keyword);
      // Only include technical and soft as meaningful bonuses
      if (category === 'technical' || category === 'soft') {
        bonusSkills.push({ keyword, category });
        seenBonus.add(keyword);
      }
    }
  }

  const totalJdKeywords = jdKeywords.length;
  const keywordMatchRate =
    totalJdKeywords > 0
      ? Number(((matchedSkills.length / totalJdKeywords) * 100).toFixed(0))
      : 0;

  return {
    matchedSkills,
    missingSkills,
    bonusSkills: bonusSkills.slice(0, 15),
    keywordMatchRate,
    categoryBreakdown,
  };
};

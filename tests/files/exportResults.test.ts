import { describe, expect, it } from 'vitest';

import { CandidateReview, HrRankingResult } from '@/domain/aiTypes';
import { buildHrMetricsSummary } from '@/domain/hrMetricsSummary';
import { toCandidateReviewText, toHrRankingCsv } from '@/files/exportResults';

describe('exportResults', () => {
  it('builds candidate review export text with new sections', () => {
    const review: CandidateReview = {
      score: 8.6,
      summary: 'Strong fit for role.',
      strengths: ['React delivery'],
      gaps: ['Limited leadership examples'],
      recommendations: ['Quantify outcomes'],
      rewrittenBullets: ['Reduced page load by 20%'],
      rewrittenCv: 'Updated CV text',
      coverLetter: 'Tailored cover letter text',
      interviewQa: [
        {
          question: 'How do you measure impact?',
          suggestedAnswer: 'I define baseline metrics and track improvements.',
        },
      ],
    };

    const text = toCandidateReviewText(review);

    expect(text).toContain('Score: 8.6/10');
    expect(text).toContain('Rewritten CV:');
    expect(text).toContain('Cover letter:');
    expect(text).toContain('Interview questions and suggested answers:');
    expect(text).toContain('Suggested answer: I define baseline metrics');
  });

  it('builds HR ranking csv with metrics and interview questions', () => {
    const result: HrRankingResult = {
      candidates: [
        {
          id: 'candidate-1',
          filename: 'alice.txt',
          detectedName: 'Alice',
          score: 9.1,
          justification: 'Strong evidence.',
          strengths: ['System design'],
          concerns: ['Domain depth'],
          interviewRecommendation: 'strong_yes',
          interviewQuestions: ['How do you mentor engineers?'],
        },
      ],
    };

    const summary = buildHrMetricsSummary(result);
    const csv = toHrRankingCsv(result, summary);

    expect(csv).toContain('rank,id,filename,detectedName,score,recommendation');
    expect(csv).toContain('candidate-1');
    expect(csv).toContain('How do you mentor engineers?');
    expect(csv).toContain('section,key,value');
    expect(csv).toContain('metric,medianScore,9.1');
  });
});

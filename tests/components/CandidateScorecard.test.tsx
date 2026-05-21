import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CandidateScorecard } from '@/components/candidate/CandidateScorecard';
import { CandidateReview } from '@/domain/aiTypes';
import { CandidateQualitySummary } from '@/domain/reviewQuality';
import { SkillGapResult } from '@/domain/skillGapAnalysis';
import { I18nProvider } from '@/i18n/i18n';

const dummyReview: CandidateReview = {
  score: 8.5,
  summary: 'Excellent candidate with React and TypeScript knowledge.',
  strengths: ['React expert', 'TypeScript pro'],
  gaps: ['No Go knowledge'],
  recommendations: ['Learn Go backend development'],
  rewrittenBullets: ['Mentored 2 junior engineers on best practices'],
  rewrittenCv: 'Re-written CV content...',
  coverLetter: 'Dear hiring manager...',
  interviewQa: [
    {
      question: 'Tell me about React hooks.',
      suggestedAnswer: 'Hooks let you use state and other React features.',
    },
  ],
};

const dummyQuality: CandidateQualitySummary = {
  confidenceScore: 92,
  evidenceCoverageRate: 85,
  hallucinationRiskScore: 0,
  unsupportedClaims: [],
  traces: [
    {
      claim: 'React expert',
      evidence: '4 years building React apps',
      keywordOverlapRate: 50,
      supported: true,
    },
  ],
};

const dummySkillGap: SkillGapResult = {
  keywordMatchRate: 80,
  matchedSkills: [
    { keyword: 'React', category: 'technical' },
    { keyword: 'TypeScript', category: 'technical' },
  ],
  missingSkills: [{ keyword: 'Go', category: 'technical' }],
  bonusSkills: [{ keyword: 'Docker', category: 'technical' }],
  categoryBreakdown: {
    technical: { matched: 2, missing: 1 },
    soft: { matched: 0, missing: 0 },
  },
};

describe('CandidateScorecard', () => {
  it('renders the multi-dimensional scorecard dimensions and overall grade', () => {
    render(
      <I18nProvider>
        <CandidateScorecard
          review={dummyReview}
          quality={dummyQuality}
          skillGap={dummySkillGap}
        />
      </I18nProvider>,
    );

    // Verify presence of title and subtitle
    expect(screen.getByText('Scorecard')).toBeInTheDocument();
    expect(
      screen.getByText('Multi-dimensional Assessment'),
    ).toBeInTheDocument();

    // Verify overall grade is shown
    expect(screen.getByText('B+')).toBeInTheDocument();

    // Verify dimension labels are rendered
    expect(screen.getAllByText('Fit')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Completeness')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Safety')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Interview')[0]).toBeInTheDocument();
  });

  it('calculates and displays correct grade for different scores', () => {
    const { rerender } = render(
      <I18nProvider>
        <CandidateScorecard
          review={{ ...dummyReview, score: 9.8 }} // fitScore will be ~94-98
          quality={{ ...dummyQuality, evidenceCoverageRate: 98 }}
          skillGap={{ ...dummySkillGap, keywordMatchRate: 98 }}
        />
      </I18nProvider>,
    );
    expect(screen.getByText('A+')).toBeInTheDocument();

    rerender(
      <I18nProvider>
        <CandidateScorecard
          review={{ ...dummyReview, score: 7.0 }} // fitScore = 7*10*0.5 + 20*0.25 + 20*0.25 = 35 + 5 + 5 = 45
          quality={{ ...dummyQuality, evidenceCoverageRate: 20 }}
          skillGap={{ ...dummySkillGap, keywordMatchRate: 20 }}
        />
      </I18nProvider>,
    );
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('shows quality metrics in the safety dimension', () => {
    // Safety score is (100 - riskScore).
    // riskScore = gapPenalty (min 40) + unsupportedPenalty (min 30) + missingSkillPenalty (min 30)
    // To get Safety = 65, we need riskScore = 35.

    render(
      <I18nProvider>
        <CandidateScorecard
          review={{ ...dummyReview, gaps: ['G1', 'G2', 'G3'] }} // gapPenalty = 24
          quality={{ ...dummyQuality, unsupportedClaims: ['U1', 'U2'] }} // unsupportedPenalty = 10
          skillGap={{ ...dummySkillGap, missingSkills: [] }} // missingSkillPenalty = 0
        />
      </I18nProvider>,
    );

    // 100 - (24 + 10) = 66
    expect(screen.getByText('66/100')).toBeInTheDocument();
  });
});

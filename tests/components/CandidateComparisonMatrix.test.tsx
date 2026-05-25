import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/common/i18n/i18n';
import {
  CandidateComparisonMatrix,
  ComparedCandidate,
} from '@/hr/components/CandidateComparisonMatrix';

const MOCK_COMPARED: ComparedCandidate[] = [
  {
    candidate: {
      id: 'c1',
      filename: 'alice_cv.pdf',
      detectedName: 'Alice Green',
      score: 8.5,
      justification: 'Excellent skills in React and system design.',
      strengths: [
        'React proficiency',
        'TypeScript integration',
        'System design',
      ],
      concerns: ['No backend cloud deployment credentials'],
      interviewRecommendation: 'strong_yes',
      interviewQuestions: [
        'Explain React context',
        'Describe system architecture',
      ],
    },
    cvText:
      'Alice is a Senior Frontend Engineer specialized in React, TypeScript, and architecture design.',
  },
  {
    candidate: {
      id: 'c2',
      filename: 'bob_cv.pdf',
      detectedName: 'Bob Smith',
      score: 6.0,
      justification:
        'Solid software fundamentals but lacks depth in core systems.',
      strengths: ['General software engineering', 'Git versioning'],
      concerns: [
        'No specialized JS framework competence',
        'Weak CSS layout styling',
      ],
      interviewRecommendation: 'maybe',
      interviewQuestions: ['What is git merge?', 'Explain box model'],
    },
    cvText:
      'Bob is a Software Developer focused on versioning systems and database normalization concepts.',
  },
];

describe('CandidateComparisonMatrix', () => {
  it('renders comparative headers, matrix table and radar polygons', () => {
    const handleClose = vi.fn();
    render(
      <I18nProvider>
        <CandidateComparisonMatrix
          candidates={MOCK_COMPARED}
          onClose={handleClose}
        />
      </I18nProvider>,
    );

    // Renders dialog title
    expect(
      screen.getByText('Candidate Side-by-Side Comparison'),
    ).toBeInTheDocument();

    // Renders candidate names in table headers
    expect(
      screen.getByRole('columnheader', { name: /Alice Green/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /Bob Smith/i }),
    ).toBeInTheDocument();

    // Renders overall fit scores
    expect(screen.getByText('8.5/10')).toBeInTheDocument();
    expect(screen.getByText('6.0/10')).toBeInTheDocument();

    // Renders detailed strengths list sections
    expect(screen.getAllByText('Strengths').length).toBe(2);
    expect(screen.getByText('React proficiency')).toBeInTheDocument();
  });

  it('triggers onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <I18nProvider>
        <CandidateComparisonMatrix
          candidates={MOCK_COMPARED}
          onClose={handleClose}
        />
      </I18nProvider>,
    );

    // Click close icon button
    const closeBtn = screen.getByRole('button');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledOnce();
  });
});

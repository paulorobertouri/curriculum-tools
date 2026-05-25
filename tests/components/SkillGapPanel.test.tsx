import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SkillGapPanel } from '@/candidate/components/SkillGapPanel';
import { I18nProvider } from '@/common/i18n/i18n';

describe('SkillGapPanel', () => {
  const jobDescription =
    'React, TypeScript developer with backend experience in Node.js and AWS.';
  const cvText =
    'Software developer with strong knowledge of React and TypeScript. Also familiar with Docker.';

  it('renders skill gap analysis matching keywords between job description and cv', () => {
    render(
      <I18nProvider>
        <SkillGapPanel jobDescription={jobDescription} cvText={cvText} />
      </I18nProvider>,
    );

    // Verify presence of title and subtitle
    expect(screen.getByText('Skill analysis')).toBeInTheDocument();
    expect(screen.getByText('Keyword Gap Analysis')).toBeInTheDocument();

    // Verify matched skills category is present and React/TypeScript keywords are shown
    expect(screen.getByText(/Matched \(/)).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();

    // Verify missing skills category is present and Node.js/AWS are shown
    expect(screen.getByText(/Missing \(/)).toBeInTheDocument();
    expect(screen.getByText('node')).toBeInTheDocument();
    expect(screen.getByText('aws')).toBeInTheDocument();

    // Verify bonus skill (Docker) is present
    expect(screen.getByText(/Bonus skills \(/)).toBeInTheDocument();
    expect(screen.getByText('docker')).toBeInTheDocument();
  });

  it('renders category breakdown when data is available', () => {
    render(
      <I18nProvider>
        <SkillGapPanel jobDescription={jobDescription} cvText={cvText} />
      </I18nProvider>,
    );

    expect(screen.getByText('Category breakdown')).toBeInTheDocument();
    expect(screen.getByText('Technical')).toBeInTheDocument();
  });

  it('handles empty input gracefully by returning null', () => {
    const { container } = render(
      <I18nProvider>
        <SkillGapPanel jobDescription='' cvText='' />
      </I18nProvider>,
    );

    expect(container.firstChild).toBeNull();
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ResumeBulletPlayground } from '@/candidate/ResumeBulletPlayground';
import { I18nProvider } from '@/common/i18n';

const MOCK_ORIGINAL = [
  'Helped to write code for the frontend.',
  'Managed a small team of developers.',
];
const MOCK_SUGGESTED = [
  'Architected and optimized frontend components, improving performance by 40%.',
  'Spearheaded redesign of core features, increasing user engagement by 25%.',
  'Engineered core features using React and TypeScript.',
];

describe('ResumeBulletPlayground', () => {
  it('renders title and original bullet point input', () => {
    render(
      <I18nProvider>
        <ResumeBulletPlayground
          originalBullets={MOCK_ORIGINAL}
          suggestedBullets={MOCK_SUGGESTED}
        />
      </I18nProvider>,
    );
    expect(screen.getByText('Resume Bullet Enhancer')).toBeInTheDocument();

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    expect(textarea.value).toBe(MOCK_ORIGINAL[0]);
  });

  it('updates text when a different original bullet is selected', () => {
    render(
      <I18nProvider>
        <ResumeBulletPlayground
          originalBullets={MOCK_ORIGINAL}
          suggestedBullets={MOCK_SUGGESTED}
        />
      </I18nProvider>,
    );
    const bullet2Btn = screen.getByText(MOCK_ORIGINAL[1]);
    fireEvent.click(bullet2Btn);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe(MOCK_ORIGINAL[1]);
  });

  it('renders AI suggestions and applies them when clicked', () => {
    render(
      <I18nProvider>
        <ResumeBulletPlayground
          originalBullets={MOCK_ORIGINAL}
          suggestedBullets={MOCK_SUGGESTED}
        />
      </I18nProvider>,
    );

    expect(screen.getByText(MOCK_SUGGESTED[0])).toBeInTheDocument();
    expect(screen.getByText(MOCK_SUGGESTED[1])).toBeInTheDocument();
    expect(screen.getByText(MOCK_SUGGESTED[2])).toBeInTheDocument();

    const suggestBtn = screen.getByText(MOCK_SUGGESTED[0]);
    fireEvent.click(suggestBtn);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe(MOCK_SUGGESTED[0]);
  });

  it('resets the edited bullet to the current original bullet', () => {
    render(
      <I18nProvider>
        <ResumeBulletPlayground
          originalBullets={MOCK_ORIGINAL}
          suggestedBullets={MOCK_SUGGESTED}
        />
      </I18nProvider>,
    );
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, {
      target: { value: 'Something completely different' },
    });
    expect(textarea.value).toBe('Something completely different');

    const resetBtn = screen.getByTitle('Reset bullet');
    fireEvent.click(resetBtn);
    expect(textarea.value).toBe(MOCK_ORIGINAL[0]);
  });
});

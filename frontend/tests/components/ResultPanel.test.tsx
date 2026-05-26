import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ResultPanel } from '@/common/components/ResultPanel';
import { I18nProvider } from '@/common/i18n/i18n';

const renderPanel = (props: Parameters<typeof ResultPanel>[0]) => {
  return render(
    <I18nProvider>
      <ResultPanel {...props} />
    </I18nProvider>,
  );
};

describe('ResultPanel', () => {
  it('shows the empty state by default', () => {
    renderPanel({
      title: 'Results',
      empty: 'Nothing is ready yet.',
      children: null,
    });

    expect(screen.getByText('Nothing is ready yet.')).toBeVisible();
    expect(screen.getByRole('complementary')).not.toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('shows the loading state with aria busy', () => {
    renderPanel({
      title: 'Results',
      empty: 'Nothing is ready yet.',
      status: 'loading',
      statusMessage: 'Processing result',
      children: null,
    });

    expect(screen.getByText('Processing result')).toBeVisible();
    expect(screen.getByRole('complementary')).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('shows the ready state and renders children', () => {
    renderPanel({
      title: 'Results',
      empty: 'Nothing is ready yet.',
      status: 'ready',
      statusMessage: 'Analysis complete',
      children: <p>Rendered content</p>,
    });

    expect(screen.getByText('Analysis complete')).toBeVisible();
    expect(screen.getByText('Rendered content')).toBeVisible();
  });
});

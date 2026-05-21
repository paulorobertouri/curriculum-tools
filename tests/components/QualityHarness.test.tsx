import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { loadEvaluationRuns } from '@/application/quality/evaluationHarnessGateway';
import { QualityHarness } from '@/components/QualityHarness';
import { AiConfig } from '@/domain/aiTypes';
import { I18nProvider } from '@/i18n/i18n';

const mockRuns = [
  {
    id: 'run-1',
    provider: 'openai',
    model: 'gpt-4o',
    promptVersions: { candidatePrompt: 'v1', hrPrompt: 'v1' },
    ranAt: '2026-05-20T12:00:00.000Z',
    candidateRuns: [
      {
        fixtureId: 'candidate-frontend-mid',
        score: 8.5,
        durationMs: 120,
        evidenceCoverageRate: 90,
      },
    ],
    hrRuns: [
      {
        fixtureId: 'hr-senior-engineer-batch',
        candidateOrder: ['c1', 'c2'],
        averageScore: 8.0,
        durationMs: 200,
      },
    ],
  },
];

// Mock storage gateways
vi.mock('@/application/quality/evaluationHarnessGateway', () => ({
  loadEvaluationRuns: vi.fn(() => mockRuns),
  persistEvaluationRuns: vi.fn(),
}));

describe('QualityHarness', () => {
  const config: AiConfig = {
    provider: 'openai',
    apiKey: 'dummy-key',
    model: 'gpt-4o',
    savedAt: '2026-05-18T00:00:00.000Z',
  };

  it('renders title, buttons and initial stats correctly', () => {
    render(
      <I18nProvider>
        <QualityHarness config={config} />
      </I18nProvider>,
    );

    // Verify headers and layout
    expect(screen.getByText('Evaluation Harness')).toBeInTheDocument();
    expect(screen.getByText(/Validate prompt quality/i)).toBeInTheDocument();

    // Verify run button is rendered
    expect(
      screen.getByRole('button', { name: /Run fixture pack/i }),
    ).toBeInTheDocument();

    // Verify stat cards labels
    expect(screen.getByText(/Runs stored/i)).toBeInTheDocument();
    expect(screen.getByText(/Candidate avg delta/i)).toBeInTheDocument();
    expect(screen.getByText(/HR rank swaps/i)).toBeInTheDocument();
  });

  it('expands and collapses fixture details', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <QualityHarness config={config} />
      </I18nProvider>,
    );

    // Find the expand button for the first candidate fixture
    // In the mock data, we have run-1 which has candidate-frontend-mid
    const expandButtons = screen
      .getAllByRole('button')
      .filter(button => button.querySelector('svg.lucide-chevron-down'));

    expect(expandButtons.length).toBeGreaterThan(0);

    // Expand
    await user.click(expandButtons[0]);
    expect(screen.getByText(/Duration/i)).toBeInTheDocument();
    expect(screen.getByText(/120ms/i)).toBeInTheDocument();
    expect(screen.getByText(/Evidence coverage/i)).toBeInTheDocument();
    expect(screen.getByText(/90%/i)).toBeInTheDocument();

    // Collapse
    await user.click(expandButtons[0]);
    expect(screen.queryByText(/120ms/i)).not.toBeInTheDocument();
  });

  it('shows warning when rank swaps occur', () => {
    const manySwapsRuns = [
      {
        ...mockRuns[0],
        id: 'run-0',
        ranAt: '2026-05-20T11:00:00.000Z',
        hrRuns: [
          {
            fixtureId: 'hr-senior-engineer-batch',
            candidateOrder: ['c1', 'c2'],
            averageScore: 8.0,
          },
        ],
      },
      {
        ...mockRuns[0],
        id: 'run-1',
        ranAt: '2026-05-20T12:00:00.000Z',
        hrRuns: [
          {
            fixtureId: 'hr-senior-engineer-batch',
            candidateOrder: ['c2', 'c1'],
            averageScore: 8.0,
          },
        ],
      },
    ];

    vi.mocked(loadEvaluationRuns).mockReturnValue(manySwapsRuns);

    render(
      <I18nProvider>
        <QualityHarness config={config} />
      </I18nProvider>,
    );

    const swapCard = screen.getByText(/HR rank swaps/i).closest('article');
    const swapStat = swapCard?.querySelector('p.text-2xl');

    expect(swapStat?.textContent).toBe('2'); // 2 swaps: c1 moved and c2 moved
    expect(swapStat).toHaveClass('text-rose-600');
  });
});

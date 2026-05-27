import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from '@/app/App';
import { AI_CONFIG_STORAGE_KEY } from '@/common/core/aiTypes';
import { I18nProvider } from '@/common/i18n/i18n';

const successfulOpenAiResponse = {
  ok: true,
  json: async () => ({ output_text: 'hello' }),
} as Response;

const savedConfig = {
  provider: 'openai',
  apiKey: 'sk-test-key',
  model: 'gpt-5.4-mini',
  savedAt: '2026-05-16T00:00:00.000Z',
  redactSensitiveData: true,
};

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const seedSavedConfig = () => {
    localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(savedConfig));
  };

  const renderApp = () => {
    return render(
      <I18nProvider>
        <App />
      </I18nProvider>,
    );
  };

  it('shows provider setup when no saved config exists', () => {
    renderApp();

    expect(
      screen.getByRole('heading', { name: 'Curriculum Tools' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Test and Save' })).toBeVisible();
  });

  it('switches setup copy when language changes', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.selectOptions(screen.getByLabelText('Language'), 'pt-BR');

    expect(
      screen.getByRole('heading', { name: 'Curriculum Tools' }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Conecte Gemini, OpenAI ou DeepSeek antes de revisar ou classificar CVs.',
      ),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Testar e Salvar' }),
    ).toBeVisible();
  });

  it('tests and saves a valid provider config before unlocking tools', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(successfulOpenAiResponse);

    renderApp();

    await user.selectOptions(screen.getByLabelText('Provider'), 'openai');
    await user.type(screen.getByLabelText('API key'), 'sk-test-key');
    await user.click(screen.getByRole('button', { name: 'Test and Save' }));

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'AI tools for candidates and HR' }),
      ).toBeVisible(),
    );

    expect(localStorage.getItem(AI_CONFIG_STORAGE_KEY)).toContain(
      'sk-test-key',
    );
  });

  it('fetches OpenAI models and updates the model input', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: 'gpt-4o-mini' }, { id: 'gpt-5.4-mini' }],
      }),
    } as Response);

    renderApp();

    await user.selectOptions(screen.getByLabelText('Provider'), 'openai');
    await user.type(screen.getByLabelText('API key'), 'sk-test-key');
    await user.click(screen.getByRole('button', { name: 'Fetch models' }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('gpt-4o-mini')).toBeVisible();
    });

    expect(await screen.findByText('2 models fetched.')).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/models',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('validates key before fetching models for key-required providers', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    renderApp();

    await user.selectOptions(screen.getByLabelText('Provider'), 'openai');
    await user.click(screen.getByRole('button', { name: 'Fetch models' }));

    expect(
      await screen.findByText('Enter an API key and model before testing.'),
    ).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps setup locked when provider test fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Nope' } }),
    } as Response);

    renderApp();

    await user.type(screen.getByLabelText('API key'), 'bad-key');
    await user.click(screen.getByRole('button', { name: 'Test and Save' }));

    expect(
      await screen.findByText('The API key was rejected by the provider.'),
    ).toBeVisible();
    expect(localStorage.getItem(AI_CONFIG_STORAGE_KEY)).toBeNull();
  });

  it('validates and renders Candidate review results', async () => {
    seedSavedConfig();
    const user = userEvent.setup();

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          output_text: JSON.stringify({
            score: 8.4,
            summary: 'Strong fit for the role.',
            strengths: ['React delivery'],
            gaps: ['Leadership examples'],
            recommendations: ['Quantify impact'],
            rewrittenBullets: [
              'Improved page performance by 30% in React app.',
            ],
          }),
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          output_text: JSON.stringify({
            rewrittenCv: 'Updated CV content',
            coverLetter: 'Tailored cover letter content',
            interviewQa: [
              {
                question: 'How did you improve delivery cadence?',
                suggestedAnswer:
                  'I introduced release checklists and automation that reduced delays.',
              },
            ],
          }),
        }),
      } as Response);

    renderApp();

    await user.click(screen.getByRole('button', { name: 'Process' }));
    expect(
      await screen.findByText(
        'Add job title, job description, and CV text before processing.',
      ),
    ).toBeVisible();

    await user.type(screen.getByLabelText('Job title'), 'Frontend Engineer');
    await user.type(
      screen.getByLabelText('Job description'),
      'Build React products.',
    );
    await user.type(
      screen.getByLabelText('CV text'),
      'Built and maintained React applications.',
    );
    await user.click(screen.getByRole('button', { name: 'Process' }));

    await waitFor(() => {
      expect(screen.getByText('8.4')).toBeVisible();
    });

    expect(screen.getByText('Strong fit for the role.')).toBeVisible();
    expect(screen.getByText('Scorecard')).toBeVisible();
    expect(screen.getByText('Skill analysis')).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Recommendations' }),
    ).toBeVisible();
  });

  it('validates and renders HR ranking results', async () => {
    seedSavedConfig();
    const user = userEvent.setup();

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          candidates: [
            {
              id: 'candidate-1',
              filename: 'alice.txt',
              detectedName: 'Alice',
              score: 9.2,
              justification: 'Strong leadership and delivery evidence.',
              strengths: ['Team leadership'],
              concerns: ['Limited domain depth'],
              interviewRecommendation: 'strong_yes',
              interviewQuestions: ['Tell us about your mentoring approach.'],
            },
          ],
        }),
      }),
    } as Response);
    seedSavedConfig();
    renderApp();

    const hrTab = screen.getByRole('tab', { name: /^HR$/ });
    fireEvent.click(hrTab);

    // Wait for HR form
    const jobTitleInput = await screen.findByLabelText(/Job title/i);

    await user.type(jobTitleInput, 'Engineering Manager');
    await user.type(
      screen.getByLabelText(/Job description/i),
      'Lead engineering teams and execute roadmap.',
    );

    const fileInput = screen.getByLabelText(/CV files/i);
    const file = new File(['Alice CV experience text'], 'alice.txt', {
      type: 'text/plain',
    });
    await user.upload(fileInput, file);

    fireEvent.click(screen.getByRole('button', { name: /^Process$/ }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alice' })).toBeVisible();
    });

    expect(screen.getByText('Candidates ranked')).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Average vs top candidate' }),
    ).toBeVisible();
  });
});

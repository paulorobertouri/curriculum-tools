import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from '@/App';
import { AI_CONFIG_STORAGE_KEY } from '@/domain/aiTypes';

const successfulOpenAiResponse = {
  ok: true,
  json: async () => ({ output_text: 'hello' }),
} as Response;

const savedConfig = {
  provider: 'openai',
  apiKey: 'sk-test-key',
  model: 'gpt-5-mini',
  savedAt: '2026-05-16T00:00:00.000Z',
};

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const seedSavedConfig = () => {
    localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(savedConfig));
  };

  it('shows provider setup when no saved config exists', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Curriculum Tools' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Test and Save' })).toBeVisible();
  });

  it('tests and saves a valid provider config before unlocking tools', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(successfulOpenAiResponse);

    render(<App />);

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

  it('keeps setup locked when provider test fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Nope' } }),
    } as Response);

    render(<App />);

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

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          score: 8.4,
          summary: 'Strong fit for the role.',
          strengths: ['React delivery'],
          gaps: ['Leadership examples'],
          recommendations: ['Quantify impact'],
          rewrittenBullets: ['Improved page performance by 30% in React app.'],
        }),
      }),
    } as Response);

    render(<App />);

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
            },
          ],
        }),
      }),
    } as Response);

    render(<App />);

    await user.click(screen.getByRole('button', { name: 'HR' }));
    await user.click(screen.getByRole('button', { name: 'Process' }));
    expect(
      await screen.findByText(
        'Add job title, job description, and at least one valid CV.',
      ),
    ).toBeVisible();

    await user.type(screen.getByLabelText('Job title'), 'Engineering Manager');
    await user.type(
      screen.getByLabelText('Job description'),
      'Lead engineering teams and execute roadmap.',
    );

    const fileInput = screen.getByLabelText('CV files');
    const file = new File(['Alice CV experience text'], 'alice.txt', {
      type: 'text/plain',
    });
    await user.upload(fileInput, file);

    await user.click(screen.getByRole('button', { name: 'Process' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alice' })).toBeVisible();
    });

    expect(screen.getByText('Recommendation: strong yes')).toBeVisible();
  });
});

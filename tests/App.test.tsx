import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from '@/App';
import { AI_CONFIG_STORAGE_KEY } from '@/domain/aiTypes';

const successfulOpenAiResponse = {
  ok: true,
  json: async () => ({ output_text: 'hello' }),
} as Response;

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

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

    expect(localStorage.getItem(AI_CONFIG_STORAGE_KEY)).toContain('sk-test-key');
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
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AiConfig } from '@/domain/aiTypes';
import { deepseekProvider } from '@/providers/deepseekProvider';
import { geminiProvider } from '@/providers/geminiProvider';
import { openaiProvider } from '@/providers/openaiProvider';

const config: AiConfig = {
  provider: 'openai',
  apiKey: 'test-key',
  model: 'test-model',
  savedAt: '2026-05-15T00:00:00.000Z',
};

describe('provider adapters', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls OpenAI Responses API for connection tests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ output_text: 'hello' }),
    } as Response);

    await expect(openaiProvider.testConnection(config)).resolves.toEqual({
      ok: true,
      message: 'OpenAI responded successfully.',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/responses',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('calls Gemini generateContent for connection tests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'hello' }] } }],
      }),
    } as Response);

    await geminiProvider.testConnection({ ...config, provider: 'gemini' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('calls DeepSeek chat completions for connection tests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'hello' } }] }),
    } as Response);

    await deepseekProvider.testConnection({ ...config, provider: 'deepseek' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.deepseek.com/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

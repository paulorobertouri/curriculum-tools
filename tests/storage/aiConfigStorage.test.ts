import { describe, expect, it } from 'vitest';

import { AI_CONFIG_STORAGE_KEY, AiConfig } from '@/domain/aiTypes';
import {
  clearAiConfig,
  maskApiKey,
  readAiConfig,
  saveAiConfig,
} from '@/storage/aiConfigStorage';

const config: AiConfig = {
  provider: 'openai',
  apiKey: 'sk-test-123456',
  model: 'gpt-5-mini',
  savedAt: '2026-05-15T00:00:00.000Z',
};

describe('aiConfigStorage', () => {
  it('saves and reads valid provider config', () => {
    const storage = window.localStorage;
    storage.clear();

    saveAiConfig(config, storage);

    expect(readAiConfig(storage)).toEqual(config);
  });

  it('ignores invalid stored config', () => {
    const storage = window.localStorage;
    storage.clear();
    storage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify({ provider: 'x' }));

    expect(readAiConfig(storage)).toBeNull();
  });

  it('clears saved config', () => {
    const storage = window.localStorage;
    saveAiConfig(config, storage);
    clearAiConfig(storage);

    expect(readAiConfig(storage)).toBeNull();
  });

  it('masks API keys for display', () => {
    expect(maskApiKey('sk-test-123456')).toBe('sk-t...3456');
  });
});

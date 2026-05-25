import { describe, expect, it } from 'vitest';

import { AI_CONFIG_STORAGE_KEY, AiConfig } from '@/common/core/aiTypes';
import {
  clearAiConfig,
  isAiConfig,
  maskApiKey,
  readAiConfig,
  saveAiConfig,
} from '@/common/storage/aiConfigStorage';

const config: AiConfig = {
  provider: 'openai',
  apiKey: 'sk-test-123456',
  model: 'gpt-5.4-mini',
  savedAt: '2026-05-15T00:00:00.000Z',
  redactSensitiveData: true,
};

describe('aiConfigStorage', () => {
  it('saves and reads valid provider config', () => {
    const storage = globalThis.localStorage;
    storage.clear();

    saveAiConfig(config, storage);

    expect(readAiConfig(storage)).toEqual(config);
  });

  it('ignores invalid stored config', () => {
    const storage = globalThis.localStorage;
    storage.clear();
    storage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify({ provider: 'x' }));

    expect(readAiConfig(storage)).toBeNull();
  });

  it('clears saved config', () => {
    const storage = globalThis.localStorage;
    saveAiConfig(config, storage);
    clearAiConfig(storage);

    expect(readAiConfig(storage)).toBeNull();
  });

  it('masks API keys for display', () => {
    expect(maskApiKey('sk-test-123456')).toBe('sk-t...3456');
  });

  it('rejects empty apiKey for providers that require keys', () => {
    const invalidConfig: AiConfig = {
      provider: 'openai',
      apiKey: '',
      model: 'gpt-5.4-mini',
      savedAt: '2026-05-18T00:00:00.000Z',
      redactSensitiveData: true,
    };

    expect(isAiConfig(invalidConfig)).toBe(false);
  });

  it('defaults redaction to enabled for legacy stored config', () => {
    const storage = globalThis.localStorage;
    storage.clear();
    storage.setItem(
      AI_CONFIG_STORAGE_KEY,
      JSON.stringify({
        provider: 'openai',
        apiKey: 'sk-test-123456',
        model: 'gpt-5.4-mini',
        savedAt: '2026-05-18T00:00:00.000Z',
      }),
    );

    expect(readAiConfig(storage)).toMatchObject({ redactSensitiveData: true });
  });

  it('preserves explicit redaction disabled config', () => {
    const storage = globalThis.localStorage;
    storage.clear();

    saveAiConfig(
      {
        provider: 'openai',
        apiKey: 'sk-test-123456',
        model: 'gpt-5.4-mini',
        savedAt: '2026-05-18T00:00:00.000Z',
        redactSensitiveData: false,
      },
      storage,
    );

    expect(readAiConfig(storage)).toMatchObject({ redactSensitiveData: false });
  });
});

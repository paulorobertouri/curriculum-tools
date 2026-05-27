import {
  AI_CONFIG_STORAGE_KEY,
  AiConfig,
  AiProviderId,
  providerRequiresApiKey,
} from '@/common/core/aiTypes';

const isProvider = (value: unknown): value is AiProviderId =>
  value === 'gemini' || value === 'openai' || value === 'deepseek';

export const isAiConfig = (value: unknown): value is AiConfig => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<AiConfig>;

  return (
    isProvider(candidate.provider) &&
    typeof candidate.apiKey === 'string' &&
    (providerRequiresApiKey(candidate.provider)
      ? candidate.apiKey.trim().length > 0
      : true) &&
    typeof candidate.model === 'string' &&
    candidate.model.trim().length > 0 &&
    typeof candidate.savedAt === 'string' &&
    (typeof candidate.redactSensitiveData === 'boolean' ||
      candidate.redactSensitiveData === undefined)
  );
};

export const readAiConfig = (
  storage: Storage = globalThis.localStorage,
): AiConfig | null => {
  const raw = storage.getItem(AI_CONFIG_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!isAiConfig(parsed)) {
      return null;
    }

    return {
      ...parsed,
      redactSensitiveData: parsed.redactSensitiveData !== false,
    };
  } catch {
    return null;
  }
};

export const saveAiConfig = (
  config: AiConfig,
  storage: Storage = globalThis.localStorage,
) => {
  storage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(config));
};

export const clearAiConfig = (storage: Storage = globalThis.localStorage) => {
  storage.removeItem(AI_CONFIG_STORAGE_KEY);
};

export const maskApiKey = (apiKey: string) => {
  const trimmed = apiKey.trim();

  if (trimmed.length <= 8) {
    return '••••';
  }

  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
};

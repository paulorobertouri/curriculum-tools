import { ProviderError } from '@/domain/aiTypes';

export const TEST_PROMPT = 'Reply with only this exact word: hello';

export const assertSuccessfulResponse = async (response: Response) => {
  if (response.ok) {
    return;
  }

  let message = `Provider request failed with status ${response.status}.`;

  try {
    const body = await response.json();
    const providerMessage =
      body?.error?.message ?? body?.message ?? body?.error ?? undefined;

    if (providerMessage) {
      message = String(providerMessage);
    }
  } catch {
    // Keep the status-based fallback.
  }

  if (response.status === 401 || response.status === 403) {
    throw new ProviderError('auth', 'The API key was rejected by the provider.');
  }

  if (response.status === 402 || response.status === 429) {
    throw new ProviderError(
      'quota',
      'The provider reported quota, billing, or rate limit trouble.',
    );
  }

  throw new ProviderError('provider', message);
};

export const ensureHello = (text: string) => {
  if (!text.trim().toLowerCase().includes('hello')) {
    throw new ProviderError(
      'provider',
      'The provider responded, but the test response did not include hello.',
    );
  }
};

export const toProviderError = (error: unknown): ProviderError => {
  if (error instanceof ProviderError) {
    return error;
  }

  return new ProviderError(
    'network',
    error instanceof Error
      ? error.message
      : 'The provider request could not be completed.',
  );
};

import { AiConfig, ProviderError } from '@/common/core/aiTypes';

export const TEST_PROMPT = 'Reply with only this exact word: hello';

const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const URL_REGEX = /\b(?:https?:\/\/|www\.)[^\s)]+/gi;
const PHONE_REGEX = /(?<!\d)(?:\+?\d[\d\s().-]{7,}\d)(?!\d)/g;
const CPF_REGEX = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const CNPJ_REGEX = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;

const redactLabelValue = (
  text: string,
  labels: string[],
  replacement: string,
) => {
  const safeLabels = labels.map(label =>
    label.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`),
  );
  const labelPattern = safeLabels.join('|');
  const regex = new RegExp(
    String.raw`(^\s*(?:${labelPattern})\s*:\s*).+$`,
    'gim',
  );

  return text.replace(regex, `$1${replacement}`);
};

export const isPromptRedactionEnabled = (
  config: Pick<AiConfig, 'redactSensitiveData'>,
): boolean => config.redactSensitiveData !== false;

export const sanitizePromptForProvider = (
  prompt: string,
  enabled = true,
): string => {
  if (!enabled) {
    return prompt;
  }

  let sanitized = prompt;

  sanitized = redactLabelValue(
    sanitized,
    ['name', 'full name', 'nome', 'nombre'],
    '[REDACTED_NAME]',
  );
  sanitized = redactLabelValue(
    sanitized,
    ['email', 'e-mail', 'correo', 'correo electronico'],
    '[REDACTED_EMAIL]',
  );
  sanitized = redactLabelValue(
    sanitized,
    ['phone', 'telephone', 'tel', 'celular', 'telefone', 'telefono'],
    '[REDACTED_PHONE]',
  );
  sanitized = redactLabelValue(
    sanitized,
    ['address', 'endereco', 'dirección', 'direccion'],
    '[REDACTED_ADDRESS]',
  );
  sanitized = redactLabelValue(
    sanitized,
    ['document', 'documento', 'cpf', 'cnpj', 'ssn', 'rg', 'id number'],
    '[REDACTED_DOCUMENT]',
  );

  return sanitized
    .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
    .replace(URL_REGEX, '[REDACTED_URL]')
    .replace(PHONE_REGEX, '[REDACTED_PHONE]')
    .replace(CPF_REGEX, '[REDACTED_DOCUMENT]')
    .replace(CNPJ_REGEX, '[REDACTED_DOCUMENT]')
    .replace(SSN_REGEX, '[REDACTED_DOCUMENT]');
};

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
    throw new ProviderError(
      'auth',
      'The API key was rejected by the provider.',
    );
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

export const ensureNonEmptyResponse = (text: string) => {
  if (!text.trim()) {
    throw new ProviderError(
      'provider',
      'The provider responded, but the test response was empty.',
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

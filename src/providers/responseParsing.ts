import { ProviderError } from '@/domain/aiTypes';

export const parseJsonResult = <T>(
  text: string,
  normalize: (value: Record<string, unknown>) => T,
): T => {
  const cleaned = stripMarkdownFence(text).trim();
  const jsonText = extractJsonObject(cleaned);

  try {
    const parsed = JSON.parse(jsonText);

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Result was not an object.');
    }

    return normalize(parsed as Record<string, unknown>);
  } catch {
    throw new ProviderError(
      'parse',
      'The provider responded, but the result was not in the expected format. Try again or use a different model.',
    );
  }
};

export const stripMarkdownFence = (text: string) =>
  text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

const extractJsonObject = (text: string) => {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return text;
  }

  return text.slice(firstBrace, lastBrace + 1);
};

import { ProviderError } from '@/domain/aiTypes';

export const parseJsonResult = <T,>(
  text: string,
  normalize: (value: Record<string, unknown>) => T,
): T => {
  const cleaned = stripMarkdownFence(text).trim();
  const jsonText = extractJsonObject(cleaned);

  try {
    const parsed = JSON.parse(jsonText);

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
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

export const extractOpenAiResponseText = (body: unknown): string => {
  const response = body as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  if (response.output_text) {
    return response.output_text;
  }

  const text = response.output
    ?.flatMap(item => item.content ?? [])
    .map(content => content.text)
    .filter(Boolean)
    .join('\n');

  return text ?? '';
};

export const extractGeminiText = (body: unknown): string => {
  const response = body as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  return (
    response.candidates?.[0]?.content?.parts
      ?.map(part => part.text)
      .filter(Boolean)
      .join('\n') ?? ''
  );
};

export const extractChatCompletionText = (body: unknown): string => {
  const response = body as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return response.choices?.[0]?.message?.content ?? '';
};

const extractJsonObject = (text: string) => {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return text;
  }

  return text.slice(firstBrace, lastBrace + 1);
};

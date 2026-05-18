type OutputLocale = 'en-US' | 'pt-BR' | 'es-ES';

const localeGuidance: Record<OutputLocale, string> = {
  'en-US':
    'Output language rule: all natural-language fields in the JSON must be written in English (en-US). Keep enum values and ids unchanged.',
  'pt-BR':
    'Output language rule: all natural-language fields in the JSON must be written in Portuguese (pt-BR). Keep enum values and ids unchanged.',
  'es-ES':
    'Output language rule: all natural-language fields in the JSON must be written in Spanish (es-ES). Keep enum values and ids unchanged.',
};

export const getPromptLocaleGuidance = (locale: OutputLocale | undefined) => {
  const safeLocale = locale ?? 'en-US';
  return localeGuidance[safeLocale];
};

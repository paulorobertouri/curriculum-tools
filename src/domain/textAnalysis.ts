/**
 * Shared text analysis utilities used by review quality, skill gap analysis,
 * and candidate scorecard modules.
 */

const DEFAULT_STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'this',
  'that',
  'have',
  'has',
  'your',
  'into',
  'about',
  'role',
  'work',
  'were',
  'will',
  'been',
  'they',
  'their',
  'also',
  'more',
  'some',
  'such',
  'than',
  'them',
  'when',
  'what',
  'which',
  'would',
  'could',
  'should',
  'other',
  'each',
  'make',
  'like',
  'over',
  'many',
  'then',
  'very',
  'just',
  'only',
]);

export type ExtractKeywordsOptions = {
  stopWords?: Set<string>;
  minLength?: number;
  maxKeywords?: number;
};

export const extractKeywords = (
  text: string,
  options?: ExtractKeywordsOptions,
): string[] => {
  const stopWords = options?.stopWords ?? DEFAULT_STOP_WORDS;
  const minLength = options?.minLength ?? 3;

  const keywords = Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length >= minLength && !stopWords.has(word)),
    ),
  );

  if (options?.maxKeywords && keywords.length > options.maxKeywords) {
    return keywords.slice(0, options.maxKeywords);
  }

  return keywords;
};

export const toSentences = (text: string): string[] =>
  text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(item => item.trim())
    .filter(Boolean);

export const findEvidence = (claim: string, source: string): string | null => {
  const keywords = extractKeywords(claim, { maxKeywords: 6 });
  if (keywords.length === 0) {
    return null;
  }

  const sentences = toSentences(source);
  let best: { sentence: string; score: number } | null = null;

  for (const sentence of sentences) {
    const lowered = sentence.toLowerCase();
    const score = keywords.filter(keyword => lowered.includes(keyword)).length;

    if (score === 0) {
      continue;
    }

    if (!best || score > best.score) {
      best = { sentence, score };
    }
  }

  return best && best.score >= 2 ? best.sentence : null;
};

/**
 * Compute bag-of-words cosine similarity between two text chunks.
 * Returns a value between 0.0 (no overlap) and 1.0 (identical).
 */
export const computeCosineSimilarity = (
  textA: string,
  textB: string,
): number => {
  const tokensA = extractKeywords(textA);
  const tokensB = extractKeywords(textB);

  if (tokensA.length === 0 || tokensB.length === 0) {
    return 0;
  }

  const vocabulary = new Set([...tokensA, ...tokensB]);
  const vectorA = new Map<string, number>();
  const vectorB = new Map<string, number>();

  for (const token of tokensA) {
    vectorA.set(token, (vectorA.get(token) ?? 0) + 1);
  }

  for (const token of tokensB) {
    vectorB.set(token, (vectorB.get(token) ?? 0) + 1);
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const word of vocabulary) {
    const a = vectorA.get(word) ?? 0;
    const b = vectorB.get(word) ?? 0;
    dotProduct += a * b;
    magnitudeA += a * a;
    magnitudeB += b * b;
  }

  const denominator = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);

  if (denominator === 0) {
    return 0;
  }

  return Number((dotProduct / denominator).toFixed(3));
};

export type KeywordCategory = 'technical' | 'soft' | 'domain' | 'other';

const TECHNICAL_PATTERNS = new Set([
  'react',
  'typescript',
  'javascript',
  'python',
  'java',
  'golang',
  'rust',
  'node',
  'docker',
  'kubernetes',
  'aws',
  'azure',
  'gcp',
  'sql',
  'nosql',
  'mongodb',
  'postgres',
  'redis',
  'graphql',
  'rest',
  'api',
  'microservices',
  'cicd',
  'terraform',
  'linux',
  'git',
  'agile',
  'scrum',
  'devops',
  'testing',
  'deployment',
  'architecture',
  'frontend',
  'backend',
  'fullstack',
  'mobile',
  'cloud',
  'database',
  'security',
  'performance',
  'scalability',
  'automation',
  'pipeline',
  'monitoring',
  'infrastructure',
  'html',
  'css',
  'webpack',
  'vite',
  'nextjs',
  'angular',
  'vue',
  'spring',
  'django',
  'flask',
  'express',
  'kafka',
  'rabbitmq',
  'elasticsearch',
  'nginx',
  'apache',
]);

const SOFT_PATTERNS = new Set([
  'leadership',
  'communication',
  'teamwork',
  'collaboration',
  'mentoring',
  'coaching',
  'presentation',
  'negotiation',
  'problem-solving',
  'critical',
  'thinking',
  'creativity',
  'adaptability',
  'flexibility',
  'initiative',
  'empathy',
  'accountability',
  'ownership',
  'stakeholder',
  'facilitation',
  'conflict',
  'resolution',
  'prioritization',
  'delegation',
  'influence',
  'interpersonal',
  'motivated',
  'proactive',
  'organized',
  'detail-oriented',
]);

export const classifyKeyword = (keyword: string): KeywordCategory => {
  const lowered = keyword.toLowerCase();

  if (TECHNICAL_PATTERNS.has(lowered)) {
    return 'technical';
  }

  if (SOFT_PATTERNS.has(lowered)) {
    return 'soft';
  }

  // Check for technical suffixes/patterns
  if (
    lowered.endsWith('js') ||
    lowered.endsWith('db') ||
    lowered.endsWith('ql') ||
    lowered.endsWith('ops')
  ) {
    return 'technical';
  }

  return 'other';
};

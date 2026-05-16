import { HrCvInput, HrRankingResult, RankedCandidate } from '@/domain/aiTypes';

export const MAX_CVS_PER_SINGLE_REQUEST = 8;
export const MAX_TOTAL_CHARS_PER_SINGLE_REQUEST = 50000;

export const shouldChunkHrRequest = (
  cvs: HrCvInput[],
  maxCvsPerRequest = MAX_CVS_PER_SINGLE_REQUEST,
  maxTotalCharsPerRequest = MAX_TOTAL_CHARS_PER_SINGLE_REQUEST,
): boolean => {
  if (cvs.length > maxCvsPerRequest) {
    return true;
  }

  const totalCharacters = cvs.reduce((sum, cv) => sum + cv.text.length, 0);
  return totalCharacters > maxTotalCharsPerRequest;
};

export const chunkHrCvs = (
  cvs: HrCvInput[],
  maxCvsPerRequest = MAX_CVS_PER_SINGLE_REQUEST,
  maxTotalCharsPerRequest = MAX_TOTAL_CHARS_PER_SINGLE_REQUEST,
): HrCvInput[][] => {
  if (cvs.length === 0) {
    return [];
  }

  const chunks: HrCvInput[][] = [];
  let currentChunk: HrCvInput[] = [];
  let currentCharacters = 0;

  for (const cv of cvs) {
    const exceedsFileLimit = currentChunk.length >= maxCvsPerRequest;
    const exceedsCharacterLimit =
      currentChunk.length > 0 &&
      currentCharacters + cv.text.length > maxTotalCharsPerRequest;

    if (exceedsFileLimit || exceedsCharacterLimit) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentCharacters = 0;
    }

    currentChunk.push(cv);
    currentCharacters += cv.text.length;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
};

export const mergeHrRankingResults = (
  inputCvs: HrCvInput[],
  partialResults: HrRankingResult[],
): HrRankingResult => {
  const mergedById = new Map<string, RankedCandidate>();

  for (const result of partialResults) {
    for (const candidate of result.candidates) {
      const current = mergedById.get(candidate.id);

      if (!current || candidate.score > current.score) {
        mergedById.set(candidate.id, candidate);
      }
    }
  }

  for (const cv of inputCvs) {
    if (mergedById.has(cv.id)) {
      continue;
    }

    mergedById.set(cv.id, {
      id: cv.id,
      filename: cv.filename,
      score: 0,
      justification: 'No ranking details were returned for this CV.',
      strengths: [],
      concerns: [],
      interviewRecommendation: 'maybe',
    });
  }

  const candidates = Array.from(mergedById.values()).sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    const byFilename = left.filename.localeCompare(right.filename);
    if (byFilename !== 0) {
      return byFilename;
    }

    return left.id.localeCompare(right.id);
  });

  return { candidates };
};

import {
  AiConfig,
  HrCvInput,
  HrRankingResult,
} from '@/domain/aiTypes';
import { getProviderAdapter } from '@/providers';

const sortCandidates = (
  result: HrRankingResult,
): HrRankingResult['candidates'] =>
  [...result.candidates].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    const byFilename = left.filename.localeCompare(right.filename);
    if (byFilename !== 0) {
      return byFilename;
    }

    return left.id.localeCompare(right.id);
  });

export const runHrRankingUseCase = async ({
  config,
  jobTitle,
  jobDescription,
  cvs,
  outputLocale,
  onProgress,
}: {
  config: AiConfig;
  jobTitle: string;
  jobDescription: string;
  cvs: HrCvInput[];
  outputLocale?: 'en-US' | 'pt-BR' | 'es-ES';
  onProgress?(index: number, total: number): void;
}): Promise<HrRankingResult> => {
  const adapter = getProviderAdapter(config.provider);
  const rankedCandidates = [] as HrRankingResult['candidates'];

  for (let index = 0; index < cvs.length; index += 1) {
    const cv = cvs[index];

    onProgress?.(index + 1, cvs.length);

    const partial = await adapter.rankHrCvs(config, {
      jobTitle,
      jobDescription,
      cvs: [cv],
      outputLocale,
    });

    const partialCandidate =
      partial.candidates.find(candidate => candidate.id === cv.id) ??
      partial.candidates[0];

    if (partialCandidate) {
      rankedCandidates.push(partialCandidate);
      continue;
    }

    rankedCandidates.push({
      id: cv.id,
      filename: cv.filename,
      score: 0,
      justification:
        'No candidate entry was returned for this file. Review manually.',
      strengths: [],
      concerns: ['No ranking response was returned for this candidate.'],
      interviewRecommendation: 'maybe',
      interviewQuestions: [],
    });
  }

  return {
    candidates: sortCandidates({ candidates: rankedCandidates }),
  };
};

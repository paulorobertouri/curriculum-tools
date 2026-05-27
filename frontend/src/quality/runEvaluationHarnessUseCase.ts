import { AiConfig } from '@/common/core/aiTypes';
import {
  candidateFixtures,
  hrFixtures,
} from '@/common/core/evaluationFixtures';
import { buildCandidateQualitySummary } from '@/common/core/reviewQuality';
import { EvaluationRun } from '@/common/evaluationHarnessStorage';
import { PROMPT_VERSIONS } from '@/prompts/promptVersions';
import { getProviderAdapter } from '@/provider';

const average = (values: number[]) => {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const runEvaluationHarnessUseCase = async (
  config: AiConfig,
  signal?: AbortSignal,
): Promise<EvaluationRun> => {
  const adapter = getProviderAdapter(config.provider);

  const candidateRuns = [] as EvaluationRun['candidateRuns'];
  for (const fixture of candidateFixtures) {
    const start = Date.now();
    const review = await adapter.reviewCandidateCv(
      config,
      fixture.input,
      signal,
    );
    const durationMs = Date.now() - start;

    const quality = buildCandidateQualitySummary(fixture.input.cvText, review);

    candidateRuns.push({
      fixtureId: fixture.id,
      score: review.score,
      durationMs,
      evidenceCoverageRate: quality.evidenceCoverageRate,
    });
  }

  const hrRuns = [] as EvaluationRun['hrRuns'];
  for (const fixture of hrFixtures) {
    const start = Date.now();
    const ranking = await adapter.rankHrCvs(config, fixture.input, signal);
    const durationMs = Date.now() - start;

    hrRuns.push({
      fixtureId: fixture.id,
      candidateOrder: ranking.candidates.map(candidate => candidate.id),
      averageScore: average(
        ranking.candidates.map(candidate => candidate.score),
      ),
      durationMs,
    });
  }

  return {
    id: crypto.randomUUID(),
    provider: config.provider,
    model: config.model,
    promptVersions: { ...PROMPT_VERSIONS },
    ranAt: new Date().toISOString(),
    candidateRuns,
    hrRuns,
  };
};

import { AiProviderId } from '@/domain/aiTypes';

const HARNESS_STORAGE_KEY = 'curriculum-tools.evaluationHarness.v1';

export type EvaluationCandidateRun = {
  fixtureId: string;
  score: number;
  durationMs?: number;
  evidenceCoverageRate?: number;
};

export type EvaluationHrRun = {
  fixtureId: string;
  candidateOrder: string[];
  averageScore: number;
  durationMs?: number;
};

export type EvaluationRun = {
  id: string;
  provider: AiProviderId;
  model: string;
  promptVersions: Record<string, string>;
  ranAt: string;
  candidateRuns: EvaluationCandidateRun[];
  hrRuns: EvaluationHrRun[];
};

const isRun = (value: unknown): value is EvaluationRun => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as EvaluationRun;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.provider === 'string' &&
    typeof candidate.model === 'string' &&
    typeof candidate.ranAt === 'string' &&
    Array.isArray(candidate.candidateRuns) &&
    Array.isArray(candidate.hrRuns)
  );
};

export const readEvaluationRuns = (
  storage: Storage = window.localStorage,
): EvaluationRun[] => {
  const raw = storage.getItem(HARNESS_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isRun);
  } catch {
    return [];
  }
};

export const saveEvaluationRuns = (
  runs: EvaluationRun[],
  storage: Storage = window.localStorage,
) => {
  storage.setItem(HARNESS_STORAGE_KEY, JSON.stringify(runs.slice(-30)));
};

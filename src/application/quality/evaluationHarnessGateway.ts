import {
  EvaluationRun,
  readEvaluationRuns,
  saveEvaluationRuns,
} from '@/infrastructure/storage/evaluationHarnessStorage';

export const loadEvaluationRuns = (): EvaluationRun[] => readEvaluationRuns();

export const persistEvaluationRuns = (runs: EvaluationRun[]) => {
  saveEvaluationRuns(runs);
};

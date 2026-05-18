import {
  EvaluationRun,
  readEvaluationRuns,
  saveEvaluationRuns,
} from '@/storage/evaluationHarnessStorage';

export const loadEvaluationRuns = (): EvaluationRun[] => readEvaluationRuns();

export const persistEvaluationRuns = (runs: EvaluationRun[]) => {
  saveEvaluationRuns(runs);
};

import {
  EvaluationRun,
  readEvaluationRuns,
  saveEvaluationRuns,
} from '@/common/storage/evaluationHarnessStorage';

export const loadEvaluationRuns = (): EvaluationRun[] => readEvaluationRuns();

export const persistEvaluationRuns = (runs: EvaluationRun[]) => {
  saveEvaluationRuns(runs);
};

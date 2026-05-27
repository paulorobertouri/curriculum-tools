import {
  EvaluationRun,
  readEvaluationRuns,
  saveEvaluationRuns,
} from '@/common/evaluationHarnessStorage';

export const loadEvaluationRuns = (): EvaluationRun[] => readEvaluationRuns();

export const persistEvaluationRuns = (runs: EvaluationRun[]) => {
  saveEvaluationRuns(runs);
};

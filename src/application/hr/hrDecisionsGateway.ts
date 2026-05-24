import {
  HrDecisionMap,
  readHrDecisions,
  saveHrDecisions,
} from '@/infrastructure/storage/hrDecisionsStorage';

export const loadHrDecisions = (): HrDecisionMap => readHrDecisions();

export const persistHrDecisions = (decisions: HrDecisionMap) => {
  saveHrDecisions(decisions);
};

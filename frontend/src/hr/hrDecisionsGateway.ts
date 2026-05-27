import {
  HrDecisionMap,
  readHrDecisions,
  saveHrDecisions,
} from '@/common/storage/hrDecisionsStorage';

export const loadHrDecisions = (): HrDecisionMap => readHrDecisions();

export const persistHrDecisions = (decisions: HrDecisionMap) => {
  saveHrDecisions(decisions);
};

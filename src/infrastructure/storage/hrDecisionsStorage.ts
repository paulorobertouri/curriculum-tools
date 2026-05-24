const HR_DECISIONS_STORAGE_KEY = 'curriculum-tools.hrDecisions.v1';

export type HrDecisionStatus = 'shortlist' | 'hold' | 'reject' | 'interview';

export type HrDecision = {
  candidateId: string;
  status: HrDecisionStatus;
  note: string;
  tags: string[];
  updatedAt: string;
};

export type HrDecisionMap = Record<string, HrDecision>;

export const readHrDecisions = (
  storage: Storage = window.localStorage,
): HrDecisionMap => {
  const raw = storage.getItem(HR_DECISIONS_STORAGE_KEY);

  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return parsed as HrDecisionMap;
  } catch {
    return {};
  }
};

export const saveHrDecisions = (
  decisions: HrDecisionMap,
  storage: Storage = window.localStorage,
) => {
  storage.setItem(HR_DECISIONS_STORAGE_KEY, JSON.stringify(decisions));
};

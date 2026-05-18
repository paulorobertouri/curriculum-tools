const CANDIDATE_DRAFT_STORAGE_KEY = 'curriculum-tools.candidateDraft.v1';

export const readCandidateCvDraft = (
  storage: Storage = window.localStorage,
): string => {
  return storage.getItem(CANDIDATE_DRAFT_STORAGE_KEY) ?? '';
};

export const saveCandidateCvDraft = (
  cvText: string,
  storage: Storage = window.localStorage,
) => {
  storage.setItem(CANDIDATE_DRAFT_STORAGE_KEY, cvText);
};

export const clearCandidateCvDraft = (
  storage: Storage = window.localStorage,
) => {
  storage.removeItem(CANDIDATE_DRAFT_STORAGE_KEY);
};

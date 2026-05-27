import {
  readCandidateCvDraft,
  saveCandidateCvDraft,
} from '@/common/candidateDraftStorage';

export const loadCandidateCvDraft = () => readCandidateCvDraft();

export const persistCandidateCvDraft = (cvText: string) => {
  saveCandidateCvDraft(cvText);
};

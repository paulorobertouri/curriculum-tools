import {
  readCandidateCvDraft,
  saveCandidateCvDraft,
} from '@/common/storage/candidateDraftStorage';

export const loadCandidateCvDraft = () => readCandidateCvDraft();

export const persistCandidateCvDraft = (cvText: string) => {
  saveCandidateCvDraft(cvText);
};

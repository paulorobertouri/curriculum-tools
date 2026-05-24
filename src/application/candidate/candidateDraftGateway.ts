import {
  readCandidateCvDraft,
  saveCandidateCvDraft,
} from '@/infrastructure/storage/candidateDraftStorage';

export const loadCandidateCvDraft = () => readCandidateCvDraft();

export const persistCandidateCvDraft = (cvText: string) => {
  saveCandidateCvDraft(cvText);
};

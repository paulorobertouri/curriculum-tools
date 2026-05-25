import { describe, expect, it } from 'vitest';

import {
  clearCandidateCvDraft,
  readCandidateCvDraft,
  saveCandidateCvDraft,
} from '@/common/storage/candidateDraftStorage';

describe('candidateDraftStorage', () => {
  it('returns empty string when nothing is saved', () => {
    const storage = window.localStorage;
    storage.clear();

    expect(readCandidateCvDraft(storage)).toBe('');
  });

  it('saves and reads CV text', () => {
    const storage = window.localStorage;
    storage.clear();

    saveCandidateCvDraft('My CV content', storage);

    expect(readCandidateCvDraft(storage)).toBe('My CV content');
  });

  it('clears saved CV text', () => {
    const storage = window.localStorage;
    saveCandidateCvDraft('My CV content', storage);
    clearCandidateCvDraft(storage);

    expect(readCandidateCvDraft(storage)).toBe('');
  });
});

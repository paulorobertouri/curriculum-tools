import { describe, expect, it, vi } from 'vitest';

import {
  loadCandidateCvDraft,
  persistCandidateCvDraft,
} from '@/candidate/handlers/candidateDraftGateway';

vi.mock('@/common/storage/candidateDraftStorage', () => ({
  readCandidateCvDraft: vi.fn(() => 'stored draft'),
  saveCandidateCvDraft: vi.fn(),
}));

describe('candidateDraftGateway', () => {
  it('loads candidate draft through storage boundary', async () => {
    const storage = await import('@/common/storage/candidateDraftStorage');

    expect(loadCandidateCvDraft()).toBe('stored draft');
    expect(storage.readCandidateCvDraft).toHaveBeenCalledTimes(1);
  });

  it('persists candidate draft through storage boundary', async () => {
    const storage = await import('@/common/storage/candidateDraftStorage');

    persistCandidateCvDraft('updated draft');

    expect(storage.saveCandidateCvDraft).toHaveBeenCalledWith('updated draft');
  });
});

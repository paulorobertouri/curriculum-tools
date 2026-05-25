import { describe, expect, it, vi } from 'vitest';

import {
  loadHrDecisions,
  persistHrDecisions,
} from '@/hr/handlers/hrDecisionsGateway';

vi.mock('@/common/storage/hrDecisionsStorage', () => ({
  readHrDecisions: vi.fn(() => ({
    'candidate-1': {
      candidateId: 'candidate-1',
      status: 'yes',
      note: 'Strong profile',
      tags: ['frontend'],
      updatedAt: '2026-05-18T00:00:00.000Z',
    },
  })),
  saveHrDecisions: vi.fn(),
}));

describe('hrDecisionsGateway', () => {
  it('loads decisions through storage boundary', async () => {
    const storage = await import('@/common/storage/hrDecisionsStorage');

    expect(loadHrDecisions()).toEqual({
      'candidate-1': {
        candidateId: 'candidate-1',
        status: 'yes',
        note: 'Strong profile',
        tags: ['frontend'],
        updatedAt: '2026-05-18T00:00:00.000Z',
      },
    });
    expect(storage.readHrDecisions).toHaveBeenCalledTimes(1);
  });

  it('persists decisions through storage boundary', async () => {
    const storage = await import('@/common/storage/hrDecisionsStorage');
    const decisions = {
      'candidate-2': {
        candidateId: 'candidate-2',
        status: 'hold' as const,
        note: '',
        tags: [],
        updatedAt: '2026-05-18T00:00:00.000Z',
      },
    };

    persistHrDecisions(decisions);

    expect(storage.saveHrDecisions).toHaveBeenCalledWith(decisions);
  });
});

import { describe, expect, it } from 'vitest';

import {
  HrDecisionMap,
  readHrDecisions,
  saveHrDecisions,
} from '@/storage/hrDecisionsStorage';

const decisions: HrDecisionMap = {
  'candidate-1': {
    candidateId: 'candidate-1',
    status: 'shortlist',
    note: 'Strong system design depth.',
    tags: ['leadership', 'architecture'],
    updatedAt: '2026-05-18T10:00:00.000Z',
  },
};

describe('hrDecisionsStorage', () => {
  it('returns empty object when storage is empty', () => {
    const storage = window.localStorage;
    storage.clear();

    expect(readHrDecisions(storage)).toEqual({});
  });

  it('returns empty object for malformed JSON', () => {
    const storage = window.localStorage;
    storage.clear();
    storage.setItem('curriculum-tools.hrDecisions.v1', '{bad-json');

    expect(readHrDecisions(storage)).toEqual({});
  });

  it('returns empty object for non-record payloads', () => {
    const storage = window.localStorage;
    storage.clear();
    storage.setItem(
      'curriculum-tools.hrDecisions.v1',
      JSON.stringify(['not-a-map']),
    );

    expect(readHrDecisions(storage)).toEqual({});
  });

  it('saves and reads decisions map', () => {
    const storage = window.localStorage;
    storage.clear();

    saveHrDecisions(decisions, storage);

    expect(readHrDecisions(storage)).toEqual(decisions);
  });
});

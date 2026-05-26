import { describe, expect, it } from 'vitest';

import { extractTextFromFile } from '@/common/files/extractText';

describe('extractTextFromFile', () => {
  it('extracts plain text files', async () => {
    const file = new File(['CV text'], 'resume.txt', { type: 'text/plain' });

    await expect(extractTextFromFile(file)).resolves.toBe('CV text');
  });

  it('rejects legacy doc files with a clear message', async () => {
    const file = new File(['binary'], 'resume.doc');

    await expect(extractTextFromFile(file)).rejects.toThrow('Legacy .doc');
  });
});

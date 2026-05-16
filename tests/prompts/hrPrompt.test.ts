import { describe, expect, it } from 'vitest';

import { buildHrPrompt } from '@/prompts/hrPrompt';
import { PROMPT_VERSIONS } from '@/prompts/promptVersions';

describe('hrPrompt', () => {
  it('includes versioning and batch ranking rubric guidance', () => {
    const prompt = buildHrPrompt({
      jobTitle: 'Engineering Manager',
      jobDescription: 'Lead teams and delivery.',
      cvs: [
        {
          id: 'candidate-1',
          filename: 'alice.txt',
          text: 'Led engineering teams and scaled delivery processes.',
        },
      ],
    });

    expect(prompt).toContain(`Prompt version: ${PROMPT_VERSIONS.hr}`);
    expect(prompt).toContain('Strict requirements:');
    expect(prompt).toContain('Scoring rubric:');
    expect(prompt).toContain('Engineering Manager');
    expect(prompt).toContain('alice.txt');
  });
});

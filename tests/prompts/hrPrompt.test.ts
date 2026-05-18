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

  it('includes output locale guidance for en-US and pt-BR', () => {
    const enPrompt = buildHrPrompt({
      jobTitle: 'Engineering Manager',
      jobDescription: 'Lead teams and delivery.',
      outputLocale: 'en-US',
      cvs: [
        {
          id: 'candidate-1',
          filename: 'alice.txt',
          text: 'Led engineering teams and scaled delivery processes.',
        },
      ],
    });

    const ptPrompt = buildHrPrompt({
      jobTitle: 'Gerente de Engenharia',
      jobDescription: 'Liderar times e entregas.',
      outputLocale: 'pt-BR',
      cvs: [
        {
          id: 'candidate-1',
          filename: 'alice.txt',
          text: 'Liderou times de engenharia e escalou entregas.',
        },
      ],
    });

    expect(enPrompt).toContain('must be written in English (en-US)');
    expect(ptPrompt).toContain('must be written in Portuguese (pt-BR)');
  });
});

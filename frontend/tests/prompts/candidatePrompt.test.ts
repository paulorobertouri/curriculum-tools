import { describe, expect, it } from 'vitest';

import { buildCandidatePrompt } from '@/prompts/candidatePrompt';
import { PROMPT_VERSIONS } from '@/prompts/promptVersions';

describe('candidatePrompt', () => {
  it('includes versioning and strict rubric guidance', () => {
    const prompt = buildCandidatePrompt({
      jobTitle: 'Frontend Engineer',
      jobDescription: 'Build React interfaces and ship features.',
      cvText: 'Built React apps and improved release cadence.',
    });

    expect(prompt).toContain(
      `Prompt version: ${PROMPT_VERSIONS.candidateReview}`,
    );
    expect(prompt).toContain('Strict requirements:');
    expect(prompt).toContain('Scoring rubric:');
    expect(prompt).toContain('Frontend Engineer');
    expect(prompt).toContain('Built React apps and improved release cadence.');
  });

  it('includes output locale guidance for pt-BR', () => {
    const prompt = buildCandidatePrompt({
      jobTitle: 'Engenheiro Frontend',
      jobDescription: 'Construir interfaces React.',
      cvText: 'Experiencia com React e TypeScript.',
      outputLocale: 'pt-BR',
    });

    expect(prompt).toContain('must be written in Portuguese (pt-BR)');
  });

  it('includes output locale guidance for en-US', () => {
    const prompt = buildCandidatePrompt({
      jobTitle: 'Frontend Engineer',
      jobDescription: 'Build React interfaces.',
      cvText: 'Experience with React and TypeScript.',
      outputLocale: 'en-US',
    });

    expect(prompt).toContain('must be written in English (en-US)');
  });
});

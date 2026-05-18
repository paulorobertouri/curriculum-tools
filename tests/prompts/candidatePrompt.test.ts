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
});

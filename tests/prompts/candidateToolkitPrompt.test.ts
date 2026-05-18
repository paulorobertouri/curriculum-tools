import { describe, expect, it } from 'vitest';

import { buildCandidateToolkitPrompt } from '@/prompts/candidateToolkitPrompt';
import { PROMPT_VERSIONS } from '@/prompts/promptVersions';

describe('candidateToolkitPrompt', () => {
  it('includes toolkit versioning and interview preparation guidance', () => {
    const prompt = buildCandidateToolkitPrompt({
      jobTitle: 'Frontend Engineer',
      jobDescription: 'Build React interfaces and mentor peers.',
      cvText: 'Built React apps and improved release cadence.',
    });

    expect(prompt).toContain(
      `Prompt version: ${PROMPT_VERSIONS.candidateToolkit}`,
    );
    expect(prompt).toContain('Create a practical candidate toolkit');
    expect(prompt).toContain('interviewQa');
    expect(prompt).toContain('Frontend Engineer');
  });
});

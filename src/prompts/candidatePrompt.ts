import { CandidateReviewInput } from '@/domain/aiTypes';
import { PROMPT_VERSIONS } from '@/prompts/promptVersions';

export const buildCandidatePrompt = (input: CandidateReviewInput) => `
Prompt version: ${PROMPT_VERSIONS.candidateReview}

Evaluate this CV for the target role. Return only valid JSON with this shape:
{
  "score": number,
  "summary": string,
  "strengths": string[],
  "gaps": string[],
  "recommendations": string[],
  "rewrittenBullets": string[]
}

Strict requirements:
- Output must be valid JSON only, with no Markdown code fences.
- Scoring uses 0.0 to 10.0 and one decimal place.
- Base every claim on explicit evidence from the CV text.
- Do not invent employers, dates, achievements, or skills.
- If evidence is missing, state the gap instead of inferring.

Scoring rubric:
- 9.0-10.0: exceptional match with strong evidence for core responsibilities.
- 7.0-8.9: strong match with manageable gaps.
- 5.0-6.9: partial match with several important gaps.
- below 5.0: weak match for role requirements.

Quality rules:
- summary: concise and specific, max 3 sentences.
- strengths and gaps: concrete and role-specific.
- recommendations: prioritized, practical actions.
- rewrittenBullets: measurable, impact-focused bullets when possible.
- rewrittenBullets should target key role requirements and stay truthful to CV evidence.

Job title:
${input.jobTitle}

Job description:
${input.jobDescription}

CV:
${input.cvText}
`;

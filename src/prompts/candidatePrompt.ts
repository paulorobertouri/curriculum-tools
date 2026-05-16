import { CandidateReviewInput } from '@/domain/aiTypes';

export const buildCandidatePrompt = (input: CandidateReviewInput) => `
Evaluate this CV for the target role. Return only valid JSON with this shape:
{
  "score": number,
  "summary": string,
  "strengths": string[],
  "gaps": string[],
  "recommendations": string[],
  "rewrittenBullets": string[]
}

Scoring uses 0.0 to 10.0. Base every claim on the CV evidence.

Job title:
${input.jobTitle}

Job description:
${input.jobDescription}

CV:
${input.cvText}
`;

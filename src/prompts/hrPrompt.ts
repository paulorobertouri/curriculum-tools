import { HrRankingInput } from '@/domain/aiTypes';

export const buildHrPrompt = (input: HrRankingInput) => `
Rank these CVs against the target role. Return only valid JSON with this shape:
{
  "candidates": [
    {
      "id": string,
      "filename": string,
      "detectedName": string,
      "score": number,
      "justification": string,
      "strengths": string[],
      "concerns": string[],
      "interviewRecommendation": "strong_yes" | "yes" | "maybe" | "no"
    }
  ]
}

Scoring uses 0.0 to 10.0. Rank from strongest to weakest. Do not infer protected characteristics.

Job title:
${input.jobTitle}

Job description:
${input.jobDescription}

CVs:
${input.cvs
  .map(
    cv => `
---
id: ${cv.id}
filename: ${cv.filename}
text:
${cv.text}
`,
  )
  .join('\n')}
`;

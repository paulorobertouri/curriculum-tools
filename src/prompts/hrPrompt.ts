import { HrRankingInput } from '@/common/core/aiTypes';
import { getPromptLocaleGuidance } from '@/prompts/promptLocale';
import { PROMPT_VERSIONS } from '@/prompts/promptVersions';

export const buildHrPrompt = (input: HrRankingInput) => `
Prompt version: ${PROMPT_VERSIONS.hr}

Evaluate each CV against the target role. Return only valid JSON with this shape:
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
      "interviewRecommendation": "strong_yes" | "yes" | "maybe" | "no",
      "interviewQuestions": string[]
    }
  ]
}

Strict requirements:
- Output must be valid JSON only, with no Markdown code fences.
- ${getPromptLocaleGuidance(input.outputLocale)}
- Keep the input id and filename for each candidate in the output.
- Use score range 0.0 to 10.0 with one decimal place.
- Rank from strongest to weakest.
- Do not infer protected characteristics or personal sensitive attributes.
- Do not invent experience that is not in the CV text.

Scoring rubric:
- 9.0-10.0: exceptional fit with clear evidence in core requirements.
- 7.0-8.9: strong fit with manageable concerns.
- 5.0-6.9: moderate fit with important missing evidence.
- below 5.0: low fit for role requirements.

Quality rules:
- justification must reference concrete role criteria and CV evidence.
- strengths and concerns must be specific, not generic.
- interviewRecommendation must be one of: strong_yes, yes, maybe, no.
- interviewQuestions should include 4 focused job-relevant interview questions.
- keep relative score calibration consistent across all candidates in this batch.
- the caller may send one candidate per request, so evaluate only provided inputs.

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

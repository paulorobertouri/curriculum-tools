import { CandidateReviewInput } from '@/common/core/aiTypes';
import { getPromptLocaleGuidance } from '@/prompts/promptLocale';
import { PROMPT_VERSIONS } from '@/prompts/promptVersions';

export const buildCandidateToolkitPrompt = (input: CandidateReviewInput) => `
Prompt version: ${PROMPT_VERSIONS.candidateToolkit}

Create a practical candidate toolkit for this role and CV. Return only valid JSON with this shape:
{
  "rewrittenCv": string,
  "coverLetter": string,
  "interviewQa": [
    {
      "question": string,
      "suggestedAnswer": string
    }
  ]
}

Strict requirements:
- Output must be valid JSON only, with no Markdown code fences.
- ${getPromptLocaleGuidance(input.outputLocale)}
- Keep all content grounded in evidence from the provided CV and job description.
- Do not invent employers, degrees, dates, projects, or certifications.
- If evidence is missing, suggested answers must acknowledge the gap and propose an honest response strategy.

Quality rules:
- rewrittenCv: rewrite into a concise, recruiter-friendly CV text with clear sections and impact-driven bullets.
- coverLetter: one tailored cover letter, professional tone, 3-5 short paragraphs.
- interviewQa: provide 6 role-relevant interview questions and suggested answers tailored to this CV.
- suggestedAnswer should be practical, concise, and interview-ready.

Job title:
${input.jobTitle}

Job description:
${input.jobDescription}

CV:
${input.cvText}
`;

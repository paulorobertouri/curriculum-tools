import {
  CandidateReview,
  HrRankingResult,
  RankedCandidate,
} from '@/common/core/aiTypes';
import { HrMetricsSummary } from '@/common/core/hrMetricsSummary';

const escapeCsv = (value: string | number) => {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const buildTimestamp = () => new Date().toISOString().replace(/:/g, '-');

const triggerDownload = (
  filename: string,
  content: string,
  mimeType: string,
) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const downloadJsonFile = (baseName: string, data: unknown) => {
  triggerDownload(
    `${baseName}-${buildTimestamp()}.json`,
    JSON.stringify(data, null, 2),
    'application/json;charset=utf-8',
  );
};

export const toCandidateReviewText = (result: CandidateReview) => {
  const qa = result.interviewQa
    .map(
      item =>
        `- Question: ${item.question}\n  Suggested answer: ${item.suggestedAnswer}`,
    )
    .join('\n');

  return [
    `Score: ${result.score.toFixed(1)}/10`,
    '',
    `Summary: ${result.summary}`,
    '',
    'Strengths:',
    ...result.strengths.map(item => `- ${item}`),
    '',
    'Gaps:',
    ...result.gaps.map(item => `- ${item}`),
    '',
    'Recommendations:',
    ...result.recommendations.map(item => `- ${item}`),
    '',
    'Rewritten bullets:',
    ...result.rewrittenBullets.map(item => `- ${item}`),
    '',
    'Rewritten CV:',
    result.rewrittenCv,
    '',
    'Cover letter:',
    result.coverLetter,
    '',
    'Interview questions and suggested answers:',
    qa || '- No interview questions generated.',
  ].join('\n');
};

export const downloadCandidateTextFile = (result: CandidateReview) => {
  triggerDownload(
    `candidate-review-${buildTimestamp()}.txt`,
    toCandidateReviewText(result),
    'text/plain;charset=utf-8',
  );
};

export const toHrRankingCsv = (
  result: HrRankingResult,
  summary: HrMetricsSummary,
): string => {
  const header = [
    'rank',
    'id',
    'filename',
    'detectedName',
    'score',
    'recommendation',
    'justification',
    'strengths',
    'concerns',
    'interviewQuestions',
  ];

  const metricRows = [
    ['metric', 'totalCandidates', summary.totalCandidates],
    ['metric', 'averageScore', summary.averageScore.toFixed(1)],
    ['metric', 'medianScore', summary.medianScore.toFixed(1)],
    ['metric', 'topScore', summary.topScore.toFixed(1)],
    ['metric', 'lowestScore', summary.lowestScore.toFixed(1)],
    ['metric', 'scoreDeviation', summary.standardDeviation.toFixed(1)],
    ['metric', 'yesOrBetterRate', `${summary.yesOrBetterRate.toFixed(0)}%`],
  ];

  const candidateRows = result.candidates.map((candidate, index) => [
    index + 1,
    candidate.id,
    candidate.filename,
    candidate.detectedName ?? '',
    candidate.score.toFixed(1),
    candidate.interviewRecommendation,
    candidate.justification,
    candidate.strengths.join(' | '),
    candidate.concerns.join(' | '),
    candidate.interviewQuestions.join(' | '),
  ]);

  return [
    header.join(','),
    ...candidateRows.map(row => row.map(escapeCsv).join(',')),
    '',
    'section,key,value',
    ...metricRows.map(row => row.map(escapeCsv).join(',')),
  ].join('\n');
};

export const downloadHrCsvFile = (
  result: HrRankingResult,
  summary: HrMetricsSummary,
) => {
  triggerDownload(
    `hr-ranking-${buildTimestamp()}.csv`,
    toHrRankingCsv(result, summary),
    'text/csv;charset=utf-8',
  );
};

export const downloadInterviewerBrief = (candidate: RankedCandidate) => {
  const content = [
    `Candidate: ${candidate.detectedName ?? candidate.filename}`,
    `File: ${candidate.filename}`,
    `Score: ${candidate.score.toFixed(1)}/10`,
    `Recommendation: ${candidate.interviewRecommendation}`,
    '',
    'Summary',
    candidate.justification,
    '',
    'Strengths',
    ...candidate.strengths.map(item => `- ${item}`),
    '',
    'Concerns',
    ...candidate.concerns.map(item => `- ${item}`),
    '',
    'Interview questions',
    ...candidate.interviewQuestions.map(item => `- ${item}`),
  ].join('\n');

  triggerDownload(
    `interviewer-brief-${candidate.id}-${buildTimestamp()}.txt`,
    content,
    'text/plain;charset=utf-8',
  );
};

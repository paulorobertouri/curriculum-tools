import { Download, Loader2, Sparkles } from 'lucide-react';
import { ChangeEvent, FormEvent, useMemo, useState } from 'react';

import { runHrRankingUseCase } from '@/application/hr/runHrRankingUseCase';
import {
  List,
  ResultPanel,
  Score,
  TextArea,
  TextField,
} from '@/components/CandidateReviewer';
import { AiConfig, HrCvInput, HrRankingResult, RankedCandidate } from '@/domain/aiTypes';
import { buildHrMetricsSummary } from '@/domain/hrMetricsSummary';
import {
  buildHrCandidateQualitySummary,
  buildHrRankDiffSummary,
} from '@/domain/reviewQuality';
import { SUPPORTED_FILE_TYPES, extractTextFromFile } from '@/files/extractText';
import {
  downloadHrCsvFile,
  downloadInterviewerBrief,
  downloadJsonFile,
} from '@/files/exportResults';
import { useI18n } from '@/i18n/i18n';
import {
  HrDecision,
  HrDecisionMap,
  HrDecisionStatus,
  readHrDecisions,
  saveHrDecisions,
} from '@/storage/hrDecisionsStorage';

type HrRankerProps = {
  config: AiConfig;
};

type FileStatus = HrCvInput & {
  status: 'ready' | 'error';
  error?: string;
};

export function HrRanker({ config }: HrRankerProps) {
  const { locale, t } = useI18n();
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [result, setResult] = useState<HrRankingResult | null>(null);
  const [previousResult, setPreviousResult] = useState<HrRankingResult | null>(
    null,
  );
  const [rawCvById, setRawCvById] = useState<Record<string, string>>({});
  const [decisions, setDecisions] = useState<HrDecisionMap>(() =>
    readHrDecisions(),
  );
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState<string | null>(null);

  const updateDecision = (
    candidateId: string,
    patch: Partial<Omit<HrDecision, 'candidateId' | 'updatedAt'>>,
  ) => {
    setDecisions(current => {
      const existing = current[candidateId];
      const next: HrDecision = {
        candidateId,
        status: patch.status ?? existing?.status ?? 'hold',
        note: patch.note ?? existing?.note ?? '',
        tags: patch.tags ?? existing?.tags ?? [],
        updatedAt: new Date().toISOString(),
      };

      const merged = {
        ...current,
        [candidateId]: next,
      };

      saveHrDecisions(merged);
      return merged;
    });
  };

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    setIsExtracting(true);
    setError(null);

    const extracted = await Promise.all(
      selectedFiles.map(async file => {
        const id = crypto.randomUUID();

        try {
          return {
            id,
            filename: file.name,
            text: await extractTextFromFile(file),
            status: 'ready' as const,
          };
        } catch (extractError) {
          return {
            id,
            filename: file.name,
            text: '',
            status: 'error' as const,
            error:
              extractError instanceof Error
                ? extractError.message
                : t('hr.extractError'),
          };
        }
      }),
    );

    setFiles(extracted);
    setIsExtracting(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validFiles = files.filter(
      file => file.status === 'ready' && file.text,
    );

    if (!jobTitle.trim() || !jobDescription.trim() || validFiles.length === 0) {
      setError(t('hr.validation'));
      return;
    }

    setIsProcessing(true);
    setProcessingLabel(t('hr.processing'));

    try {
      const ranking = await runHrRankingUseCase({
        config,
        jobTitle,
        jobDescription,
        cvs: validFiles,
        outputLocale: locale,
        onProgress(index, total) {
          setProcessingLabel(
            t('hr.batchProcessing', {
              index,
              total,
            }),
          );
        },
      });

      const nextRawCvById = validFiles.reduce<Record<string, string>>(
        (accumulator, cv) => {
          accumulator[cv.id] = cv.text;
          return accumulator;
        },
        {},
      );

      const mergedRawCvById = {
        ...rawCvById,
        ...nextRawCvById,
      };

      setPreviousResult(result);
      setResult(ranking);
      setRawCvById(mergedRawCvById);
    } catch (processError) {
      setError(
        processError instanceof Error
          ? processError.message
          : t('hr.processError'),
      );
    } finally {
      setIsProcessing(false);
      setProcessingLabel(null);
    }
  };

  return (
    <section className='tool-grid'>
      <form className='tool-panel' onSubmit={handleSubmit}>
        <div>
          <p className='eyebrow'>{t('hr.eyebrow')}</p>
          <h2 className='panel-title'>{t('hr.title')}</h2>
          <p className='mt-2 text-sm leading-6 text-slate-600'>
            {t('hr.description')}
          </p>
        </div>
        <TextField
          label={t('candidate.jobTitle')}
          value={jobTitle}
          onChange={setJobTitle}
        />
        <TextArea
          label={t('candidate.jobDescription')}
          value={jobDescription}
          onChange={setJobDescription}
          rows={8}
        />
        <label className='field-label' htmlFor='hr-files'>
          {t('hr.upload')}
        </label>
        <input
          id='hr-files'
          className='file-input'
          type='file'
          accept={SUPPORTED_FILE_TYPES}
          multiple
          onChange={handleFiles}
        />
        <p className='text-xs leading-5 text-slate-500'>{t('hr.uploadHint')}</p>
        {isExtracting ? (
          <p className='text-sm text-cyan-700'>{t('hr.extracting')}</p>
        ) : null}
        {isProcessing && processingLabel ? (
          <p className='text-sm text-cyan-700'>{processingLabel}</p>
        ) : null}
        {files.length > 0 ? (
          <ul className='space-y-2'>
            {files.map(file => (
              <li
                className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm shadow-sm'
                key={file.id}
              >
                <span className='font-semibold'>{file.filename}</span>
                <span
                  className={
                    file.status === 'ready'
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }
                >
                  {' '}
                  · {file.status === 'ready' ? t('hr.ready') : file.error}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {error ? (
          <p role='alert' className='error-message'>
            {error}
          </p>
        ) : null}
        <button
          className='primary-button'
          type='submit'
          disabled={isProcessing || isExtracting}
        >
          {isProcessing ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Sparkles className='h-4 w-4' />
          )}
          {isProcessing ? t('hr.processing') : t('hr.process')}
        </button>
        <p className='text-xs leading-5 text-slate-500'>{t('hr.processHint')}</p>
      </form>

      <ResultPanel
        title={t('hr.resultTitle')}
        empty={t('hr.resultEmpty')}
        className='lg:sticky lg:top-32'
        status={isProcessing ? 'loading' : result ? 'ready' : 'empty'}
        statusMessage={
          isProcessing
            ? (processingLabel ?? t('hr.processing'))
            : t('result.ready')
        }
      >
        {result ? (
          <RankingResult
            result={result}
            previousResult={previousResult}
            rawCvById={rawCvById}
            decisions={decisions}
            onDecisionChange={updateDecision}
          />
        ) : null}
      </ResultPanel>
    </section>
  );
}

function RankingResult({
  result,
  previousResult,
  rawCvById,
  decisions,
  onDecisionChange,
}: {
  result: HrRankingResult;
  previousResult: HrRankingResult | null;
  rawCvById: Record<string, string>;
  decisions: HrDecisionMap;
  onDecisionChange(
    candidateId: string,
    patch: Partial<Omit<HrDecision, 'candidateId' | 'updatedAt'>>,
  ): void;
}) {
  const { t } = useI18n();
  const summary = buildHrMetricsSummary(result);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);

  const diffSummary = useMemo(() => {
    if (!previousResult) {
      return null;
    }

    return buildHrRankDiffSummary(previousResult, result);
  }, [previousResult, result]);

  const comparedCandidates = result.candidates.filter(candidate =>
    comparisonIds.includes(candidate.id),
  );

  const toggleComparison = (candidateId: string) => {
    setComparisonIds(current => {
      if (current.includes(candidateId)) {
        return current.filter(id => id !== candidateId);
      }

      if (current.length >= 3) {
        return [...current.slice(1), candidateId];
      }

      return [...current, candidateId];
    });
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-2'>
        <button
          className='status-button'
          type='button'
          onClick={() =>
            downloadJsonFile('hr-ranking', {
              summary,
              result,
              decisions,
            })
          }
        >
          <Download className='h-4 w-4' />
          {t('export.json')}
        </button>
        <button
          className='status-button'
          type='button'
          onClick={() => downloadHrCsvFile(result, summary)}
        >
          <Download className='h-4 w-4' />
          {t('export.csv')}
        </button>
      </div>

      {diffSummary ? <HrRerunDiffPanel diff={diffSummary} /> : null}

      <HrMetricsDashboard result={result} />
      <HrRecommendationDistribution result={result} />

      {comparedCandidates.length >= 2 ? (
        <HrComparisonMatrix candidates={comparedCandidates} />
      ) : null}

      {result.candidates.map(candidate => (
        <HrCandidateCard
          key={candidate.id}
          candidate={candidate}
          cvText={rawCvById[candidate.id] ?? ''}
          decision={decisions[candidate.id]}
          onDecisionChange={onDecisionChange}
          isCompared={comparisonIds.includes(candidate.id)}
          onToggleComparison={toggleComparison}
        />
      ))}
    </div>
  );
}

function HrCandidateCard({
  candidate,
  cvText,
  decision,
  onDecisionChange,
  isCompared,
  onToggleComparison,
}: {
  candidate: RankedCandidate;
  cvText: string;
  decision?: HrDecision;
  onDecisionChange(
    candidateId: string,
    patch: Partial<Omit<HrDecision, 'candidateId' | 'updatedAt'>>,
  ): void;
  isCompared: boolean;
  onToggleComparison(candidateId: string): void;
}) {
  const { t } = useI18n();
  const quality = useMemo(
    () =>
      buildHrCandidateQualitySummary(cvText, [
        candidate.justification,
        ...candidate.strengths,
        ...candidate.concerns,
      ]),
    [candidate.concerns, candidate.justification, candidate.strengths, cvText],
  );

  return (
    <article className='rounded-3xl border border-slate-200 bg-white p-4 shadow-sm'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h3 className='text-lg font-black text-slate-950'>
            {candidate.detectedName || candidate.filename}
          </h3>
          <p className='text-sm text-slate-600'>{candidate.filename}</p>
          <label className='mt-2 inline-flex items-center gap-2 text-sm text-slate-700'>
            <input
              type='checkbox'
              checked={isCompared}
              onChange={() => onToggleComparison(candidate.id)}
            />
            Compare
          </label>
        </div>
        <div className='flex flex-col items-end gap-2'>
          <Score value={candidate.score} />
          <button
            className='status-button'
            type='button'
            onClick={() => downloadInterviewerBrief(candidate)}
          >
            <Download className='h-4 w-4' />
            Interviewer brief
          </button>
        </div>
      </div>

      <p className='mt-4 text-sm leading-6 text-slate-700'>{candidate.justification}</p>

      <div className='mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700'>
        Confidence: <span className='font-bold'>{quality.confidenceScore}/100</span>
      </div>

      {quality.unsupportedClaims.length > 0 ? (
        <div className='mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900'>
          Unsupported-claim guard: {quality.unsupportedClaims.length} claim(s)
        </div>
      ) : null}

      <div className='mt-4 grid gap-4 md:grid-cols-2'>
        <List title={t('candidate.list.strengths')} items={candidate.strengths} />
        <List title={t('candidate.list.concerns')} items={candidate.concerns} />
      </div>

      <p className='mt-4 rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800'>
        {t('hr.recommendation')}: {candidate.interviewRecommendation.replace('_', ' ')}
      </p>

      <div className='mt-4'>
        <List title={t('hr.list.interviewQuestions')} items={candidate.interviewQuestions} />
      </div>

      <HrDecisionPanel
        decision={decision}
        onStatusChange={status => onDecisionChange(candidate.id, { status })}
        onNoteChange={note => onDecisionChange(candidate.id, { note })}
        onTagChange={tags => onDecisionChange(candidate.id, { tags })}
      />

      <details className='mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3'>
        <summary className='cursor-pointer text-sm font-bold text-slate-900'>
          Evidence trace
        </summary>
        <div className='mt-2 space-y-2 text-sm text-slate-700'>
          {quality.traces.slice(0, 6).map(trace => (
            <div key={`${trace.claim}-${trace.evidence ?? 'none'}`}>
              <p className='font-semibold text-slate-900'>{trace.claim}</p>
              <p>{trace.evidence ?? 'No direct supporting excerpt found in CV text.'}</p>
            </div>
          ))}
        </div>
      </details>
    </article>
  );
}

function HrDecisionPanel({
  decision,
  onStatusChange,
  onNoteChange,
  onTagChange,
}: {
  decision?: HrDecision;
  onStatusChange(status: HrDecisionStatus): void;
  onNoteChange(note: string): void;
  onTagChange(tags: string[]): void;
}) {
  const statuses: Array<{ value: HrDecisionStatus; label: string }> = [
    { value: 'shortlist', label: 'Shortlist' },
    { value: 'hold', label: 'Hold' },
    { value: 'reject', label: 'Reject' },
    { value: 'interview', label: 'Interview' },
  ];

  return (
    <section className='mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3'>
      <p className='text-sm font-bold text-slate-900'>Decision actions</p>
      <div className='mt-2 flex flex-wrap gap-2'>
        {statuses.map(status => (
          <button
            key={status.value}
            className={[
              'status-button text-xs',
              decision?.status === status.value ? 'border-cyan-600 text-cyan-700' : '',
            ].join(' ')}
            type='button'
            onClick={() => onStatusChange(status.value)}
          >
            {status.label}
          </button>
        ))}
      </div>
      <label className='mt-3 block text-sm font-semibold text-slate-700'>Notes</label>
      <textarea
        className='text-input mt-1 resize-y'
        rows={2}
        value={decision?.note ?? ''}
        onChange={event => onNoteChange(event.target.value)}
      />
      <label className='mt-3 block text-sm font-semibold text-slate-700'>Tags (comma separated)</label>
      <input
        className='text-input mt-1'
        value={(decision?.tags ?? []).join(', ')}
        onChange={event =>
          onTagChange(
            event.target.value
              .split(',')
              .map(item => item.trim())
              .filter(Boolean),
          )
        }
      />
    </section>
  );
}

function HrComparisonMatrix({
  candidates,
}: {
  candidates: RankedCandidate[];
}) {
  return (
    <section className='rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm'>
      <h3 className='text-sm font-bold text-slate-900'>Side-by-side comparison</h3>
      <div className='mt-3 overflow-x-auto'>
        <table className='w-full min-w-[640px] border-collapse text-sm'>
          <thead>
            <tr className='text-left text-slate-600'>
              <th className='border-b border-slate-200 px-2 py-2'>Metric</th>
              {candidates.map(candidate => (
                <th key={candidate.id} className='border-b border-slate-200 px-2 py-2'>
                  {candidate.detectedName ?? candidate.filename}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <MatrixRow label='Score' values={candidates.map(item => item.score.toFixed(1))} />
            <MatrixRow
              label='Recommendation'
              values={candidates.map(item => item.interviewRecommendation.replace('_', ' '))}
            />
            <MatrixRow
              label='Top strengths'
              values={candidates.map(item => item.strengths.slice(0, 2).join(' | '))}
            />
            <MatrixRow
              label='Top concerns'
              values={candidates.map(item => item.concerns.slice(0, 2).join(' | '))}
            />
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MatrixRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr>
      <th className='border-b border-slate-200 px-2 py-2 text-left text-slate-700'>{label}</th>
      {values.map((value, index) => (
        <td key={`${label}-${index}`} className='border-b border-slate-200 px-2 py-2 text-slate-700'>
          {value || 'N/A'}
        </td>
      ))}
    </tr>
  );
}

function HrRerunDiffPanel({
  diff,
}: {
  diff: ReturnType<typeof buildHrRankDiffSummary>;
}) {
  return (
    <section className='rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm'>
      <h3 className='text-sm font-bold text-slate-900'>Rerun diff</h3>
      <div className='mt-2 grid gap-2 sm:grid-cols-3'>
        <p className='rounded-xl bg-white px-3 py-2 text-sm text-slate-700'>
          Avg score delta:{' '}
          <span className='font-bold'>
            {diff.averageDelta >= 0 ? '+' : ''}
            {diff.averageDelta.toFixed(1)}
          </span>
        </p>
        <p className='rounded-xl bg-white px-3 py-2 text-sm text-slate-700'>
          Previous avg: <span className='font-bold'>{diff.previousAverage.toFixed(1)}</span>
        </p>
        <p className='rounded-xl bg-white px-3 py-2 text-sm text-slate-700'>
          Rank swaps:{' '}
          <span className={diff.rankSwapCount > 1 ? 'font-bold text-amber-700' : 'font-bold'}>
            {diff.rankSwapCount}
          </span>
        </p>
      </div>
    </section>
  );
}

function HrMetricsDashboard({ result }: { result: HrRankingResult }) {
  const { locale, t } = useI18n();
  const summary = buildHrMetricsSummary(result);
  const percentFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  });

  return (
    <section className='rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm'>
      <p className='text-sm font-bold text-slate-900'>{t('hr.dashboard.title')}</p>
      <div className='mt-3 grid gap-3 sm:grid-cols-3'>
        <HrSummaryStat
          label={t('hr.dashboard.count')}
          value={summary.totalCandidates.toString()}
        />
        <HrSummaryStat
          label={t('hr.dashboard.average')}
          value={`${summary.averageScore.toFixed(1)}/10`}
        />
        <HrSummaryStat
          label={t('hr.dashboard.topCandidate')}
          value={summary.topCandidateLabel}
        />
      </div>
      <div className='mt-3 grid gap-3 sm:grid-cols-3'>
        <HrSummaryStat
          label={t('hr.dashboard.median')}
          value={`${summary.medianScore.toFixed(1)}/10`}
        />
        <HrSummaryStat
          label={t('hr.dashboard.deviation')}
          value={summary.standardDeviation.toFixed(1)}
        />
        <HrSummaryStat
          label={t('hr.dashboard.yesRate')}
          value={`${percentFormatter.format(summary.yesOrBetterRate)}%`}
        />
      </div>
      <div className='mt-3 space-y-3'>
        <HrMetricBar
          label={t('hr.dashboard.average')}
          value={summary.averageScore}
        />
        <HrMetricBar
          label={t('hr.dashboard.median')}
          value={summary.medianScore}
        />
        <HrMetricBar label={t('hr.dashboard.max')} value={summary.topScore} />
        <HrMetricBar
          label={t('hr.dashboard.min')}
          value={summary.lowestScore}
        />
      </div>
      <HrComparisonBar
        average={summary.averageScore}
        top={summary.topScore}
        lowest={summary.lowestScore}
      />
    </section>
  );
}

function HrSummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm'>
      <p className='text-[11px] font-bold uppercase tracking-wide text-slate-500'>
        {label}
      </p>
      <p className='mt-1 truncate text-sm font-bold text-slate-950'>{value}</p>
    </div>
  );
}

function HrMetricBar({ label, value }: { label: string; value: number }) {
  const { locale } = useI18n();
  const safeValue = Math.max(
    0,
    Math.min(10, Number.isFinite(value) ? value : 0),
  );
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <div>
      <div className='mb-1 flex items-center justify-between text-xs font-semibold text-slate-700'>
        <span>{label}</span>
        <span>{formatter.format(safeValue)}/10</span>
      </div>
      <div className='h-2 rounded-full bg-slate-200'>
        <div
          className='h-2 rounded-full bg-emerald-600 transition-all duration-300'
          style={{ width: `${safeValue * 10}%` }}
        />
      </div>
    </div>
  );
}

function HrComparisonBar({
  average,
  top,
  lowest,
}: {
  average: number;
  top: number;
  lowest: number;
}) {
  const { locale, t } = useI18n();
  const safeAverage = Math.max(0, Math.min(10, average));
  const safeTop = Math.max(0, Math.min(10, top));
  const safeLowest = Math.max(0, Math.min(10, lowest));
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const spread = Math.max(0, safeTop - safeLowest);

  return (
    <div className='mt-4 rounded-3xl border border-dashed border-slate-300 bg-white p-3 shadow-sm'>
      <h3 className='text-xs font-bold uppercase tracking-wide text-slate-700'>
        {t('hr.dashboard.comparison')}
      </h3>
      <div className='mt-3 space-y-3'>
        <div>
          <div className='mb-1 flex items-center justify-between text-xs font-semibold text-slate-700'>
            <span>{t('hr.dashboard.average')}</span>
            <span>{formatter.format(safeAverage)}/10</span>
          </div>
          <div className='h-2 rounded-full bg-slate-200'>
            <div
              className='h-2 rounded-full bg-cyan-600 transition-all duration-300'
              style={{ width: `${safeAverage * 10}%` }}
            />
          </div>
        </div>
        <div>
          <div className='mb-1 flex items-center justify-between text-xs font-semibold text-slate-700'>
            <span>{t('hr.dashboard.max')}</span>
            <span>{formatter.format(safeTop)}/10</span>
          </div>
          <div className='h-2 rounded-full bg-slate-200'>
            <div
              className='h-2 rounded-full bg-emerald-600 transition-all duration-300'
              style={{ width: `${safeTop * 10}%` }}
            />
          </div>
        </div>
        <p className='text-xs font-semibold text-slate-600'>
          {t('hr.dashboard.spread')}: {formatter.format(spread)}
        </p>
      </div>
    </div>
  );
}

function HrRecommendationDistribution({ result }: { result: HrRankingResult }) {
  const { locale, t } = useI18n();
  const counts = result.candidates.reduce(
    (accumulator, candidate) => {
      accumulator[candidate.interviewRecommendation] += 1;
      return accumulator;
    },
    {
      strong_yes: 0,
      yes: 0,
      maybe: 0,
      no: 0,
    },
  );
  const total = result.candidates.length || 1;
  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  });

  const entries = [
    ['strong_yes', 'bg-emerald-600'],
    ['yes', 'bg-cyan-600'],
    ['maybe', 'bg-amber-500'],
    ['no', 'bg-rose-600'],
  ] as const;

  return (
    <section className='rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm'>
      <p className='text-sm font-bold text-slate-900'>
        {t('hr.recommendationDistribution')}
      </p>
      <div className='mt-3 grid gap-3 sm:grid-cols-2'>
        {entries.map(([key, barClass]) => {
          const count = counts[key];
          const percentage = (count / total) * 100;

          return (
            <div
              key={key}
              className='rounded-md border border-slate-200 bg-white p-3'
            >
              <div className='mb-2 flex items-center justify-between text-xs font-semibold text-slate-700'>
                <span>{t(`hr.recommendation.${key}`)}</span>
                <span>{formatter.format(count)}</span>
              </div>
              <div className='h-2 rounded-full bg-slate-200'>
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${barClass}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

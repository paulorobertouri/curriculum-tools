import {
  ChevronDown,
  ChevronUp,
  Download,
  LayoutGrid,
  Loader2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { ChangeEvent, useMemo, useState } from 'react';

import { List } from '@/common/components/List';
import { MetricBar } from '@/common/components/MetricBar';
import { ResultPanel } from '@/common/components/ResultPanel';
import { Score } from '@/common/components/Score';
import { TextArea } from '@/common/components/TextArea';
import { TextField } from '@/common/components/TextField';
import {
  AiConfig,
  HrCvInput,
  HrRankingResult,
  RankedCandidate,
} from '@/common/core/aiTypes';
import { buildHrMetricsSummary } from '@/common/core/hrMetricsSummary';
import {
  buildHrCandidateQualitySummary,
  buildHrRankDiffSummary,
} from '@/common/core/reviewQuality';
import {
  downloadHrCsvFile,
  downloadInterviewerBrief,
  downloadJsonFile,
} from '@/common/files/exportResults';
import {
  SUPPORTED_FILE_TYPES,
  extractTextFromFile,
} from '@/common/files/extractText';
import { useI18n } from '@/common/i18n/i18n';
import {
  HrDecision,
  HrDecisionMap,
  HrDecisionStatus,
} from '@/common/storage/hrDecisionsStorage';
import { CandidateComparisonMatrix } from '@/hr/components/CandidateComparisonMatrix';
import { HrFunnelChart } from '@/hr/components/HrFunnelChart';
import { HrScoreHistogram } from '@/hr/components/HrScoreHistogram';
import {
  loadHrDecisions,
  persistHrDecisions,
} from '@/hr/handlers/hrDecisionsGateway';
import { runHrRankingUseCase } from '@/hr/handlers/runHrRankingUseCase';

type HrRankerProps = {
  readonly config: AiConfig;
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
    loadHrDecisions(),
  );
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [processingLabel, setProcessingLabel] = useState<string | null>(null);

  let resultStatus: 'loading' | 'ready' | 'empty' = 'empty';
  if (isProcessing) {
    resultStatus = 'loading';
  } else if (result) {
    resultStatus = 'ready';
  }

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

      persistHrDecisions(merged);
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

    setFiles(prev => [...prev, ...extracted]);
    setIsExtracting(false);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearFiles = () => {
    setFiles([]);
  };

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
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

    const controller = new AbortController();

    try {
      const { ranking } = await runHrRankingUseCase({
        config,
        jobTitle,
        jobDescription,
        cvs: validFiles.map(f => ({
          id: f.id,
          filename: f.filename,
          text: f.text,
        })),
        outputLocale: locale,
        onProgress: (index, total) => {
          setProcessingLabel(t('hr.batchProcessing', { index, total }));
        },
        signal: controller.signal,
      });

      setRawCvById(
        validFiles.reduce(
          (acc, file) => ({ ...acc, [file.id]: file.text }),
          {},
        ),
      );

      setPreviousResult(result);
      setResult(ranking);
      setIsFormCollapsed(true);
    } catch (processError) {
      if (processError instanceof Error && processError.name === 'AbortError')
        return;

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

  const metrics = useMemo(() => {
    if (!result) return null;
    return buildHrMetricsSummary(result);
  }, [result]);

  const rankDiff = useMemo(() => {
    if (!previousResult || !result) return null;
    return buildHrRankDiffSummary(previousResult, result);
  }, [previousResult, result]);

  return (
    <div className='tool-stack'>
      <div className='tool-panel overflow-hidden'>
        <button
          type='button'
          onClick={() => setIsFormCollapsed(!isFormCollapsed)}
          className='flex w-full items-center justify-between'
        >
          <div className='text-left'>
            <p className='eyebrow'>{t('hr.eyebrow')}</p>
            <h2 className='panel-title'>{t('hr.title')}</h2>
          </div>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200'>
            {isFormCollapsed ? (
              <ChevronDown className='h-5 w-5' />
            ) : (
              <ChevronUp className='h-5 w-5' />
            )}
          </div>
        </button>

        {!isFormCollapsed && (
          <form className='mt-2 grid gap-2' onSubmit={handleSubmit}>
            <p className='text-sm leading-6 text-slate-600'>
              {t('hr.description')}
            </p>

            <TextField
              label={t('candidate.jobTitle')}
              value={jobTitle}
              onChange={setJobTitle}
            />
            <TextArea
              label={t('candidate.jobDescription')}
              value={jobDescription}
              onChange={setJobDescription}
              rows={6}
            />

            <div className='space-y-2'>
              <label className='field-label' htmlFor='hr-files'>
                {t('hr.upload')}
              </label>
              <input
                id='hr-files'
                multiple
                className='file-input'
                type='file'
                accept={SUPPORTED_FILE_TYPES}
                onChange={handleFiles}
                disabled={isExtracting}
              />
              <p className='text-xs leading-5 text-slate-500'>
                {t('hr.uploadHint')}
              </p>
            </div>

            {files.length > 0 && (
              <div className='rounded-2xl border border-slate-200 bg-slate-50 p-2'>
                <div className='flex items-center justify-between px-1'>
                  <p className='text-[10px] font-bold uppercase tracking-wide text-slate-500'>
                    {isExtracting ? t('hr.extracting') : t('hr.ready')}
                  </p>
                  {!isExtracting && (
                    <button
                      type='button'
                      onClick={clearFiles}
                      className='text-[10px] font-bold text-rose-600 hover:text-rose-800 uppercase transition-colors'
                    >
                      {t('provider.status.clear')}
                    </button>
                  )}
                </div>
                <ul className='mt-2 max-h-40 overflow-y-auto space-y-1'>
                  {files.map(file => (
                    <li
                      key={file.id}
                      className='flex items-center justify-between text-sm group'
                    >
                      <div className='flex items-center gap-2 truncate'>
                        {file.status === 'ready' ? (
                          <span className='flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[8px] text-emerald-700'>
                            ✓
                          </span>
                        ) : (
                          <span
                            title={file.error}
                            className='flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 text-[8px] text-rose-700'
                          >
                            !
                          </span>
                        )}
                        <span className='truncate font-medium text-slate-700'>
                          {file.filename}
                        </span>
                      </div>
                      {!isExtracting && (
                        <button
                          type='button'
                          onClick={() => removeFile(file.id)}
                          className='p-1 text-slate-400 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 touch-target'
                          title='Remove file'
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {error && <p className='error-message'>{error}</p>}

            <button
              className='submit-button touch-target group mt-2 w-full'
              type='submit'
              disabled={isProcessing || isExtracting || files.length === 0}
            >
              {isProcessing ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Sparkles className='h-4 w-4' />
              )}
              {isProcessing ? t('hr.processing') : t('hr.process')}
            </button>
            <p className='text-xs leading-5 text-slate-500'>
              {t('hr.processHint')}
            </p>
          </form>
        )}
      </div>

      <ResultPanel
        title={t('hr.resultTitle')}
        empty={t('hr.resultEmpty')}
        status={resultStatus}
        statusMessage={processingLabel ?? t('result.ready')}
      >
        {result && metrics && (
          <div className='animate-fade-in space-y-2'>
            {/* Dashboard metrics */}
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              <MetricCard
                label={t('hr.dashboard.count')}
                value={metrics.totalCandidates}
              />
              <MetricCard
                label={t('hr.dashboard.average')}
                value={metrics.averageScore.toFixed(1)}
              />
              <MetricCard
                label={t('hr.dashboard.max')}
                value={metrics.topScore.toFixed(1)}
              />
              <MetricCard
                label={t('hr.dashboard.yesRate')}
                value={`${metrics.yesOrBetterRate.toFixed(0)}%`}
              />
            </div>

            {rankDiff && (
              <div className='rounded-3xl border border-slate-200 bg-emerald-50 p-3 shadow-sm'>
                <p className='text-xs font-bold uppercase tracking-wide text-emerald-800'>
                  {t('quality.rankStability')}
                </p>
                <div className='mt-2 flex items-baseline gap-4'>
                  <div>
                    <p className='text-2xl font-black text-slate-950'>
                      {rankDiff.rankSwapCount}
                    </p>
                    <p className='text-[10px] font-bold text-emerald-700 uppercase'>
                      {t('quality.rankSwaps')}
                    </p>
                  </div>
                  <div className='h-8 w-px bg-emerald-200' />
                  <div>
                    <p className='text-2xl font-black text-slate-950'>
                      {rankDiff.averageDelta > 0 ? '+' : ''}
                      {rankDiff.averageDelta}
                    </p>
                    <p className='text-[10px] font-bold text-emerald-700 uppercase'>
                      {t('quality.avgDelta')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className='grid gap-2 lg:grid-cols-2'>
              <div className='space-y-2'>
                <HrFunnelChart result={result} />
                <HrScoreHistogram result={result} />
              </div>

              <div className='rounded-3xl border border-dashed border-slate-300 bg-white p-3 shadow-sm'>
                <h3 className='text-xs font-bold uppercase tracking-wide text-slate-700'>
                  {t('hr.dashboard.comparison')}
                </h3>
                <div className='mt-2 space-y-2'>
                  <MetricBar
                    label={t('hr.dashboard.average')}
                    value={metrics.averageScore}
                  />
                  <MetricBar
                    label={t('hr.dashboard.topCandidate')}
                    value={metrics.topScore}
                  />
                </div>
                <p className='mt-2 text-[10px] leading-4 text-slate-500'>
                  {t('hr.dashboard.comparisonHint')}
                </p>
              </div>
            </div>

            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-black text-slate-950'>
                {t('hr.rankList')}
              </h3>
              <div className='flex gap-2'>
                <button
                  className='status-button touch-target text-xs'
                  type='button'
                  onClick={() => setIsMatrixOpen(true)}
                >
                  <LayoutGrid className='h-3 w-3' />
                  {t('hr.matrix.action')}
                </button>

                {isMatrixOpen && (
                  <CandidateComparisonMatrix
                    candidates={result.candidates.map(c => ({
                      candidate: c,
                      cvText: rawCvById[c.id] || '',
                    }))}
                    onClose={() => setIsMatrixOpen(false)}
                  />
                )}
                <button
                  className='status-button touch-target text-xs'
                  type='button'
                  onClick={() => downloadJsonFile('hr-ranking', result)}
                >
                  <Download className='h-3 w-3' />
                  {t('export.json')}
                </button>
                <button
                  className='status-button touch-target text-xs'
                  type='button'
                  onClick={() => downloadHrCsvFile(result, metrics)}
                >
                  <Download className='h-3 w-3' />
                  {t('export.csv')}
                </button>
              </div>
            </div>

            <div className='space-y-2'>
              {result.candidates.map(candidate => (
                <HrCandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  cvText={rawCvById[candidate.id]}
                  decision={decisions[candidate.id]}
                  onDecisionChange={patch =>
                    updateDecision(candidate.id, patch)
                  }
                />
              ))}
            </div>
          </div>
        )}
      </ResultPanel>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <article className='rounded-2xl border border-slate-200 bg-white p-3 shadow-sm'>
      <p className='text-[10px] font-bold uppercase tracking-wider text-slate-500'>
        {label}
      </p>
      <p className='mt-1 text-xl font-black text-slate-950'>{value}</p>
    </article>
  );
}

function HrCandidateCard({
  candidate,
  cvText = '',
  decision,
  onDecisionChange,
}: {
  candidate: RankedCandidate;
  cvText?: string;
  decision?: HrDecision;
  onDecisionChange: (patch: Partial<HrDecision>) => void;
}) {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);

  const quality = useMemo(
    () => buildHrCandidateQualitySummary(cvText || '', candidate.strengths),
    [cvText, candidate.strengths],
  );

  return (
    <article className='rounded-3xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex-1 min-w-[200px]'>
          <div className='flex items-center gap-2'>
            <h4 className='text-lg font-black text-slate-950'>
              {candidate.detectedName || candidate.filename}
            </h4>
            <span className='rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600'>
              {candidate.filename}
            </span>
          </div>
          <p className='mt-2 text-sm leading-6 text-slate-700'>
            {candidate.justification}
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Score value={candidate.score} />
          <div className='text-right'>
            <p className='text-[10px] font-bold uppercase tracking-wider text-slate-500'>
              {t('hr.recommendation')}
            </p>
            <p className='text-sm font-black text-slate-950 uppercase'>
              {t(`hr.recommendation.${candidate.interviewRecommendation}`)}
            </p>
          </div>
        </div>
      </div>

      <div className='mt-2 flex flex-wrap gap-2'>
        <button
          className='status-button touch-target'
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? t('provider.status.clear') : t('provider.status.edit')}
        </button>
        <div className='h-8 w-px bg-slate-200' />
        <DecisionToggles
          status={decision?.status || 'hold'}
          onChange={status => onDecisionChange({ status })}
        />
        <button
          className='status-button touch-target'
          onClick={() => downloadInterviewerBrief(candidate)}
        >
          <Download className='h-3 w-3' />
          {t('export.text')}
        </button>
      </div>

      {isExpanded && (
        <div className='mt-2 space-y-2 border-t border-slate-100 pt-2 animate-fade-in'>
          <div className='grid gap-2 lg:grid-cols-2'>
            <List
              title={t('candidate.list.strengths')}
              items={candidate.strengths}
            />
            <List
              title={t('candidate.list.concerns')}
              items={candidate.concerns}
            />
          </div>

          <div className='rounded-2xl border border-slate-200 bg-slate-50 p-3'>
            <p className='text-xs font-bold uppercase tracking-wide text-slate-500'>
              {t('candidate.metric.evidenceCoverage')}
            </p>
            <div className='mt-2 grid gap-2 sm:grid-cols-2'>
              <MetricBar
                label={t('candidate.metric.evidenceCoverage')}
                value={quality.confidenceScore / 10}
              />
              <div className='text-right'>
                <p className='text-xl font-black text-slate-950'>
                  {quality.confidenceScore}%
                </p>
                <p className='text-[10px] font-bold uppercase text-slate-500'>
                  Confidence
                </p>
              </div>
            </div>
          </div>

          <List
            title={t('hr.list.interviewQuestions')}
            items={candidate.interviewQuestions}
          />

          <TextArea
            label='Decision notes'
            value={decision?.note || ''}
            onChange={note => onDecisionChange({ note })}
            placeholder='Add reasoning, internal tags, or next steps...'
            rows={3}
          />
        </div>
      )}
    </article>
  );
}

function DecisionToggles({
  status,
  onChange,
}: {
  status: HrDecisionStatus;
  onChange: (status: HrDecisionStatus) => void;
}) {
  const options: Array<{ id: HrDecisionStatus; label: string; color: string }> =
    [
      { id: 'shortlist', label: 'Shortlist', color: 'bg-emerald-500' },
      { id: 'hold', label: 'Hold', color: 'bg-amber-500' },
      { id: 'reject', label: 'Reject', color: 'bg-rose-500' },
    ];

  return (
    <div className='flex gap-1 rounded-2xl bg-slate-100 p-1'>
      {options.map(opt => (
        <button
          key={opt.id}
          type='button'
          onClick={() => onChange(opt.id)}
          className={[
            'rounded-xl px-3 py-1 text-[10px] font-bold uppercase transition-all',
            status === opt.id
              ? `${opt.color} text-white shadow-sm`
              : 'text-slate-500 hover:text-slate-700',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

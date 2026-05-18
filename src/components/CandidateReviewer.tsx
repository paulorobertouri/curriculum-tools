import { Download, FileText, Loader2, Sparkles } from 'lucide-react';
import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useId,
  useMemo,
  useState,
} from 'react';

import { runCandidateReviewUseCase } from '@/application/candidate/runCandidateReviewUseCase';
import { AiConfig, CandidateReview } from '@/domain/aiTypes';
import { buildCandidateQualitySummary } from '@/domain/reviewQuality';
import {
  downloadCandidateTextFile,
  downloadJsonFile,
} from '@/files/exportResults';
import { SUPPORTED_FILE_TYPES, extractTextFromFile } from '@/files/extractText';
import { useI18n } from '@/i18n/i18n';
import {
  readCandidateCvDraft,
  saveCandidateCvDraft,
} from '@/storage/candidateDraftStorage';

type CandidateReviewerProps = {
  config: AiConfig;
};

export function CandidateReviewer({ config }: CandidateReviewerProps) {
  const { locale, t } = useI18n();
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [cvText, setCvText] = useState(() => readCandidateCvDraft());
  const [fileStatus, setFileStatus] = useState<string | null>(null);
  const [result, setResult] = useState<CandidateReview | null>(null);
  const [previousResult, setPreviousResult] = useState<CandidateReview | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);
    setFileStatus(t('candidate.extracting', { filename: file.name }));

    try {
      const text = await extractTextFromFile(file);
      setCvText(text);
      saveCandidateCvDraft(text);
      setFileStatus(t('candidate.ready', { filename: file.name }));
    } catch (extractError) {
      setFileStatus(null);
      setError(
        extractError instanceof Error
          ? extractError.message
          : t('candidate.extractError'),
      );
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!jobTitle.trim() || !jobDescription.trim() || !cvText.trim()) {
      setError(t('candidate.validation'));
      return;
    }

    setIsProcessing(true);

    try {
      const review = await runCandidateReviewUseCase(config, {
        jobTitle,
        jobDescription,
        cvText,
        outputLocale: locale,
      });
      setPreviousResult(result);
      setResult(review);
    } catch (processError) {
      setError(
        processError instanceof Error
          ? processError.message
          : t('candidate.processError'),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className='tool-grid'>
      <form className='tool-panel' onSubmit={handleSubmit}>
        <div>
          <p className='eyebrow'>{t('candidate.eyebrow')}</p>
          <h2 className='panel-title'>{t('candidate.title')}</h2>
          <p className='mt-2 text-sm leading-6 text-slate-600'>
            {t('candidate.description')}
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
          rows={6}
        />
        <label className='field-label' htmlFor='candidate-file'>
          {t('candidate.upload')}
        </label>
        <input
          id='candidate-file'
          className='file-input'
          type='file'
          accept={SUPPORTED_FILE_TYPES}
          onChange={handleFile}
        />
        <p className='text-xs leading-5 text-slate-500'>
          {t('candidate.uploadHint')}
        </p>
        {fileStatus ? (
          <p className='rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'>
            {fileStatus}
          </p>
        ) : null}
        <TextArea
          label={t('candidate.cvText')}
          value={cvText}
          onChange={(value) => {
            setCvText(value);
            saveCandidateCvDraft(value);
          }}
          rows={10}
        />
        {error ? (
          <p role='alert' className='error-message'>
            {error}
          </p>
        ) : null}
        <button
          className='primary-button'
          type='submit'
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Sparkles className='h-4 w-4' />
          )}
          {isProcessing ? t('candidate.processing') : t('candidate.process')}
        </button>
        <p className='text-xs leading-5 text-slate-500'>
          {t('candidate.processHint')}
        </p>
      </form>

      <ResultPanel
        title={t('candidate.resultTitle')}
        empty={t('candidate.resultEmpty')}
        status={isProcessing ? 'loading' : result ? 'ready' : 'empty'}
        statusMessage={
          isProcessing ? t('candidate.processing') : t('result.ready')
        }
      >
        {result ? (
          <CandidateResult
            result={result}
            cvText={cvText}
            previousResult={previousResult}
          />
        ) : null}
      </ResultPanel>
    </section>
  );
}

function CandidateResult({
  result,
  cvText,
  previousResult,
}: {
  result: CandidateReview;
  cvText: string;
  previousResult: CandidateReview | null;
}) {
  const { t } = useI18n();
  const quality = useMemo(
    () => buildCandidateQualitySummary(cvText, result),
    [cvText, result],
  );
  const scoreDelta = previousResult
    ? Number((result.score - previousResult.score).toFixed(1))
    : 0;

  return (
    <div className='space-y-5'>
      <div className='flex flex-wrap gap-2'>
        <button
          className='status-button'
          type='button'
          onClick={() => downloadJsonFile('candidate-review', result)}
        >
          <Download className='h-4 w-4' />
          {t('export.json')}
        </button>
        <button
          className='status-button'
          type='button'
          onClick={() => downloadCandidateTextFile(result)}
        >
          <Download className='h-4 w-4' />
          {t('export.text')}
        </button>
      </div>
      <Score value={result.score} />
      {previousResult ? (
        <div className='rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700'>
          <p className='font-bold text-slate-900'>Rerun diff</p>
          <p className='mt-1'>
            Score delta: {scoreDelta >= 0 ? '+' : ''}
            {scoreDelta.toFixed(1)}
          </p>
          <p>
            Strength items: {previousResult.strengths.length} {'->'}{' '}
            {result.strengths.length}
          </p>
          <p>
            Gap items: {previousResult.gaps.length} {'->'} {result.gaps.length}
          </p>
        </div>
      ) : null}
      <CandidateMetricsChart result={result} />
      <CandidateQualityPanel quality={quality} />
      <p className='text-sm leading-6 text-slate-700'>{result.summary}</p>
      <List title={t('candidate.list.strengths')} items={result.strengths} />
      <List title={t('candidate.list.gaps')} items={result.gaps} />
      <List
        title={t('candidate.list.recommendations')}
        items={result.recommendations}
      />
      <List
        title={t('candidate.list.rewritten')}
        items={result.rewrittenBullets}
      />
      <LongTextBlock
        title={t('candidate.list.rewrittenCv')}
        text={result.rewrittenCv}
      />
      <LongTextBlock
        title={t('candidate.list.coverLetter')}
        text={result.coverLetter}
      />
      <CandidateInterviewQaList items={result.interviewQa} />
    </div>
  );
}

function CandidateQualityPanel({
  quality,
}: {
  quality: ReturnType<typeof buildCandidateQualitySummary>;
}) {
  return (
    <section className='rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm'>
      <p className='text-sm font-bold text-slate-900'>Reliability checks</p>
      <div className='mt-2 grid gap-2 sm:grid-cols-2'>
        <p className='rounded-xl bg-white px-3 py-2 text-sm text-slate-700'>
          Confidence score:{' '}
          <span className='font-bold'>{quality.confidenceScore}/100</span>
        </p>
        <p className='rounded-xl bg-white px-3 py-2 text-sm text-slate-700'>
          Evidence coverage:{' '}
          <span className='font-bold'>{quality.evidenceCoverageRate}%</span>
        </p>
      </div>

      {quality.unsupportedClaims.length > 0 ? (
        <div className='mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900'>
          <p className='font-bold'>Unsupported-claim guard</p>
          <ul className='mt-1 list-disc space-y-1 pl-5'>
            {quality.unsupportedClaims.slice(0, 5).map(claim => (
              <li key={claim}>{claim}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <details className='mt-3 rounded-xl border border-slate-200 bg-white p-3'>
        <summary className='cursor-pointer text-sm font-bold text-slate-900'>
          Evidence trace
        </summary>
        <div className='mt-2 space-y-2 text-sm text-slate-700'>
          {quality.traces.slice(0, 8).map(trace => (
            <div key={`${trace.claim}-${trace.evidence ?? 'none'}`}>
              <p className='font-semibold text-slate-900'>{trace.claim}</p>
              <p>
                {trace.evidence ??
                  'No direct supporting excerpt found in CV text.'}
              </p>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}

function CandidateMetricsChart({ result }: { result: CandidateReview }) {
  const { t } = useI18n();
  const strengthsScore = Math.min(10, result.strengths.length * 2);
  const gapsScore = Math.max(0, 10 - Math.min(10, result.gaps.length * 2));
  const recommendationScore = Math.min(10, result.recommendations.length * 2);
  const evidenceCoverage = Math.min(
    10,
    (result.strengths.length + result.rewrittenBullets.length) * 1.25,
  );
  const interviewReadiness = Math.min(10, result.interviewQa.length * 1.5);

  return (
    <div className='rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm'>
      <p className='text-sm font-bold text-slate-900'>
        {t('candidate.summaryChart')}
      </p>
      <div className='mt-3 space-y-3'>
        <MetricBar label={t('candidate.metric.overall')} value={result.score} />
        <MetricBar
          label={t('candidate.metric.strengths')}
          value={strengthsScore}
        />
        <MetricBar label={t('candidate.metric.gaps')} value={gapsScore} />
        <MetricBar
          label={t('candidate.metric.recommendations')}
          value={recommendationScore}
        />
        <MetricBar
          label={t('candidate.metric.evidenceCoverage')}
          value={evidenceCoverage}
        />
        <MetricBar
          label={t('candidate.metric.interviewReadiness')}
          value={interviewReadiness}
        />
      </div>
    </div>
  );
}

function LongTextBlock({ title, text }: { title: string; text: string }) {
  const { t } = useI18n();

  return (
    <div>
      <h3 className='text-sm font-bold text-slate-950'>{title}</h3>
      {text.trim().length > 0 ? (
        <pre className='mt-2 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700'>
          {text}
        </pre>
      ) : (
        <p className='mt-2 text-sm text-slate-500'>{t('result.noItems')}</p>
      )}
    </div>
  );
}

function CandidateInterviewQaList({
  items,
}: {
  items: CandidateReview['interviewQa'];
}) {
  const { t } = useI18n();

  return (
    <div>
      <h3 className='text-sm font-bold text-slate-950'>
        {t('candidate.list.interviewQa')}
      </h3>
      {items.length > 0 ? (
        <div className='mt-2 space-y-3'>
          {items.map(item => (
            <article
              key={`${item.question}-${item.suggestedAnswer}`}
              className='rounded-2xl border border-slate-200 bg-slate-50 p-3'
            >
              <p className='text-sm font-bold text-slate-900'>
                {item.question}
              </p>
              <p className='mt-2 text-sm leading-6 text-slate-700'>
                <span className='font-semibold text-slate-900'>
                  {t('candidate.interview.suggestedAnswer')}:
                </span>{' '}
                {item.suggestedAnswer}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className='mt-2 text-sm text-slate-500'>{t('result.noItems')}</p>
      )}
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const safeValue = Math.max(
    0,
    Math.min(10, Number.isFinite(value) ? value : 0),
  );

  return (
    <div>
      <div className='mb-1 flex items-center justify-between text-xs font-semibold text-slate-700'>
        <span>{label}</span>
        <span>{safeValue.toFixed(1)}/10</span>
      </div>
      <div className='h-2 rounded-full bg-slate-200'>
        <div
          className='h-2 rounded-full bg-cyan-600 transition-all duration-300'
          style={{ width: `${safeValue * 10}%` }}
        />
      </div>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
}) {
  const id = useId();

  return (
    <div className='space-y-2'>
      <label className='field-label' htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className='text-input'
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  rows: number;
  onChange(value: string): void;
}) {
  const id = useId();

  return (
    <div className='space-y-2'>
      <label className='field-label' htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className='text-input resize-y'
        rows={rows}
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </div>
  );
}

export function ResultPanel({
  title,
  empty,
  status = 'empty',
  statusMessage,
  children,
  className = '',
}: {
  title: string;
  empty: string;
  status?: 'empty' | 'loading' | 'ready';
  statusMessage?: string;
  children: ReactNode;
  className?: string;
}) {
  const { t } = useI18n();
  const isReady = Boolean(children) && status === 'ready';

  return (
    <aside
      className={['tool-panel', className].filter(Boolean).join(' ')}
      aria-busy={status === 'loading'}
      aria-live='polite'
      aria-atomic='true'
      tabIndex={-1}
    >
      <div className='flex items-center gap-2'>
        <FileText className='h-5 w-5 text-cyan-700' />
        <h2 className='panel-title'>{title}</h2>
      </div>
      {status === 'loading' ? (
        <div className='rounded-3xl border border-dashed border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-900'>
          <div className='flex items-center gap-2 font-bold'>
            <Loader2 className='h-4 w-4 animate-spin' />
            <span>{statusMessage ?? t('result.loading')}</span>
          </div>
          <p className='mt-2 text-cyan-800/80'>{empty}</p>
        </div>
      ) : isReady ? (
        <div className='space-y-3'>
          <div className='inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800'>
            {statusMessage ?? t('result.ready')}
          </div>
          {children}
        </div>
      ) : (
        <div className='rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4'>
          <p className='text-sm leading-6 text-slate-600'>{empty}</p>
        </div>
      )}
    </aside>
  );
}

export function Score({ value }: { value: number }) {
  const { locale, t } = useI18n();
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <div className='rounded-lg border border-cyan-200 bg-cyan-50 p-4'>
      <p className='text-sm font-bold uppercase text-cyan-800'>
        {t('result.score')}
      </p>
      <p className='text-4xl font-black text-slate-950'>
        {formatter.format(value)}
      </p>
    </div>
  );
}

export function List({ title, items }: { title: string; items: string[] }) {
  const { t } = useI18n();

  return (
    <div>
      <h3 className='text-sm font-bold text-slate-950'>{title}</h3>
      {items.length > 0 ? (
        <ul className='mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700'>
          {items.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className='mt-2 text-sm text-slate-500'>{t('result.noItems')}</p>
      )}
    </div>
  );
}

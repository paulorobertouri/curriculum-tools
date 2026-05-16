import { FileText, Loader2, Sparkles } from 'lucide-react';
import { ChangeEvent, FormEvent, ReactNode, useState } from 'react';

import { AiConfig, CandidateReview } from '@/domain/aiTypes';
import { SUPPORTED_FILE_TYPES, extractTextFromFile } from '@/files/extractText';
import { useI18n } from '@/i18n/i18n';
import { getProviderAdapter } from '@/providers';

type CandidateReviewerProps = {
  config: AiConfig;
};

export function CandidateReviewer({ config }: CandidateReviewerProps) {
  const { t } = useI18n();
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [cvText, setCvText] = useState('');
  const [fileStatus, setFileStatus] = useState<string | null>(null);
  const [result, setResult] = useState<CandidateReview | null>(null);
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
    setResult(null);

    if (!jobTitle.trim() || !jobDescription.trim() || !cvText.trim()) {
      setError(t('candidate.validation'));
      return;
    }

    setIsProcessing(true);

    try {
      const review = await getProviderAdapter(
        config.provider,
      ).reviewCandidateCv(config, {
        jobTitle,
        jobDescription,
        cvText,
      });
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
        {fileStatus ? (
          <p className='text-sm text-emerald-700'>{fileStatus}</p>
        ) : null}
        <TextArea
          label={t('candidate.cvText')}
          value={cvText}
          onChange={setCvText}
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
      </form>

      <ResultPanel
        title={t('candidate.resultTitle')}
        empty={t('candidate.resultEmpty')}
      >
        {result ? <CandidateResult result={result} /> : null}
      </ResultPanel>
    </section>
  );
}

function CandidateResult({ result }: { result: CandidateReview }) {
  const { t } = useI18n();

  return (
    <div className='space-y-5'>
      <Score value={result.score} />
      <CandidateMetricsChart result={result} />
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
    </div>
  );
}

function CandidateMetricsChart({ result }: { result: CandidateReview }) {
  const { t } = useI18n();
  const strengthsScore = Math.min(10, result.strengths.length * 2);
  const gapsScore = Math.max(0, 10 - Math.min(10, result.gaps.length * 2));
  const recommendationScore = Math.min(10, result.recommendations.length * 2);

  return (
    <div className='rounded-lg border border-slate-200 bg-slate-50 p-4'>
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
      </div>
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
  const id = label.toLowerCase().replace(/\s+/g, '-');

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
  const id = label.toLowerCase().replace(/\s+/g, '-');

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
  children,
}: {
  title: string;
  empty: string;
  children: ReactNode;
}) {
  return (
    <aside className='tool-panel'>
      <div className='flex items-center gap-2'>
        <FileText className='h-5 w-5 text-cyan-700' />
        <h2 className='panel-title'>{title}</h2>
      </div>
      {children || <p className='text-sm leading-6 text-slate-600'>{empty}</p>}
    </aside>
  );
}

export function Score({ value }: { value: number }) {
  const { t } = useI18n();

  return (
    <div className='rounded-lg border border-cyan-200 bg-cyan-50 p-4'>
      <p className='text-sm font-bold uppercase text-cyan-800'>
        {t('result.score')}
      </p>
      <p className='text-4xl font-black text-slate-950'>{value.toFixed(1)}</p>
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

import { ChangeEvent, FormEvent, ReactNode, useState } from 'react';
import { FileText, Loader2, Sparkles } from 'lucide-react';

import { AiConfig, CandidateReview } from '@/domain/aiTypes';
import { extractTextFromFile, SUPPORTED_FILE_TYPES } from '@/files/extractText';
import { getProviderAdapter } from '@/providers';

type CandidateReviewerProps = {
  config: AiConfig;
};

export function CandidateReviewer({ config }: CandidateReviewerProps) {
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
    setFileStatus(`Extracting ${file.name}`);

    try {
      const text = await extractTextFromFile(file);
      setCvText(text);
      setFileStatus(`${file.name} is ready`);
    } catch (extractError) {
      setFileStatus(null);
      setError(
        extractError instanceof Error
          ? extractError.message
          : 'Could not extract text from this file.',
      );
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!jobTitle.trim() || !jobDescription.trim() || !cvText.trim()) {
      setError('Add job title, job description, and CV text before processing.');
      return;
    }

    setIsProcessing(true);

    try {
      const review = await getProviderAdapter(config.provider).reviewCandidateCv(
        config,
        {
          jobTitle,
          jobDescription,
          cvText,
        },
      );
      setResult(review);
    } catch (processError) {
      setError(
        processError instanceof Error
          ? processError.message
          : 'Could not process this CV.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className='tool-grid'>
      <form className='tool-panel' onSubmit={handleSubmit}>
        <div>
          <p className='eyebrow'>Candidate</p>
          <h2 className='panel-title'>CV Reviewer</h2>
        </div>
        <TextField label='Job title' value={jobTitle} onChange={setJobTitle} />
        <TextArea
          label='Job description'
          value={jobDescription}
          onChange={setJobDescription}
          rows={6}
        />
        <label className='field-label' htmlFor='candidate-file'>
          Upload CV
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
          label='CV text'
          value={cvText}
          onChange={setCvText}
          rows={10}
        />
        {error ? <p role='alert' className='error-message'>{error}</p> : null}
        <button className='primary-button' type='submit' disabled={isProcessing}>
          {isProcessing ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Sparkles className='h-4 w-4' />
          )}
          {isProcessing ? 'Processing' : 'Process'}
        </button>
      </form>

      <ResultPanel
        title='Review Result'
        empty='Run a CV review to see score, gaps, and concrete recommendations.'
      >
        {result ? <CandidateResult result={result} /> : null}
      </ResultPanel>
    </section>
  );
}

function CandidateResult({ result }: { result: CandidateReview }) {
  return (
    <div className='space-y-5'>
      <Score value={result.score} />
      <p className='text-sm leading-6 text-slate-700'>{result.summary}</p>
      <List title='Strengths' items={result.strengths} />
      <List title='Gaps' items={result.gaps} />
      <List title='Recommendations' items={result.recommendations} />
      <List title='Rewritten bullets' items={result.rewrittenBullets} />
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
  return (
    <div className='rounded-lg border border-cyan-200 bg-cyan-50 p-4'>
      <p className='text-sm font-bold uppercase text-cyan-800'>Score</p>
      <p className='text-4xl font-black text-slate-950'>{value.toFixed(1)}</p>
    </div>
  );
}

export function List({ title, items }: { title: string; items: string[] }) {
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
        <p className='mt-2 text-sm text-slate-500'>No items returned.</p>
      )}
    </div>
  );
}

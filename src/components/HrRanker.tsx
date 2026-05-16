import { Loader2, Sparkles } from 'lucide-react';
import { ChangeEvent, FormEvent, useState } from 'react';

import {
  List,
  ResultPanel,
  Score,
  TextArea,
  TextField,
} from '@/components/CandidateReviewer';
import { AiConfig, HrCvInput, HrRankingResult } from '@/domain/aiTypes';
import {
  chunkHrCvs,
  mergeHrRankingResults,
  shouldChunkHrRequest,
} from '@/domain/hrChunking';
import { SUPPORTED_FILE_TYPES, extractTextFromFile } from '@/files/extractText';
import { getProviderAdapter } from '@/providers';

type HrRankerProps = {
  config: AiConfig;
};

type FileStatus = HrCvInput & {
  status: 'ready' | 'error';
  error?: string;
};

export function HrRanker({ config }: HrRankerProps) {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [result, setResult] = useState<HrRankingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState<string | null>(null);

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
                : 'Could not extract this CV.',
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
    setResult(null);

    const validFiles = files.filter(
      file => file.status === 'ready' && file.text,
    );

    if (!jobTitle.trim() || !jobDescription.trim() || validFiles.length === 0) {
      setError('Add job title, job description, and at least one valid CV.');
      return;
    }

    setIsProcessing(true);
    setProcessingLabel('Processing...');

    try {
      const provider = getProviderAdapter(config.provider);
      const shouldChunk = shouldChunkHrRequest(validFiles);

      let ranking: HrRankingResult;

      if (shouldChunk) {
        const chunks = chunkHrCvs(validFiles);
        const partialResults: HrRankingResult[] = [];

        for (let index = 0; index < chunks.length; index += 1) {
          setProcessingLabel(
            `Processing batch ${index + 1} of ${chunks.length}...`,
          );

          const partial = await provider.rankHrCvs(config, {
            jobTitle,
            jobDescription,
            cvs: chunks[index],
          });

          partialResults.push(partial);
        }

        ranking = mergeHrRankingResults(validFiles, partialResults);
      } else {
        ranking = await provider.rankHrCvs(config, {
          jobTitle,
          jobDescription,
          cvs: validFiles,
        });
      }

      setResult(ranking);
    } catch (processError) {
      setError(
        processError instanceof Error
          ? processError.message
          : 'Could not rank these CVs.',
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
          <p className='eyebrow'>HR</p>
          <h2 className='panel-title'>CV Ranking</h2>
        </div>
        <TextField label='Job title' value={jobTitle} onChange={setJobTitle} />
        <TextArea
          label='Job description'
          value={jobDescription}
          onChange={setJobDescription}
          rows={8}
        />
        <label className='field-label' htmlFor='hr-files'>
          CV files
        </label>
        <input
          id='hr-files'
          className='file-input'
          type='file'
          accept={SUPPORTED_FILE_TYPES}
          multiple
          onChange={handleFiles}
        />
        {isExtracting ? (
          <p className='text-sm text-cyan-700'>Extracting files...</p>
        ) : null}
        {isProcessing && processingLabel ? (
          <p className='text-sm text-cyan-700'>{processingLabel}</p>
        ) : null}
        {files.length > 0 ? (
          <ul className='space-y-2'>
            {files.map(file => (
              <li
                className='rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm'
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
                  · {file.status === 'ready' ? 'ready' : file.error}
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
          {isProcessing ? 'Processing...' : 'Process'}
        </button>
      </form>

      <ResultPanel
        title='Ranking Result'
        empty='Upload CVs and process them to see a ranked shortlist.'
      >
        {result ? <RankingResult result={result} /> : null}
      </ResultPanel>
    </section>
  );
}

function RankingResult({ result }: { result: HrRankingResult }) {
  return (
    <div className='space-y-4'>
      {result.candidates.map(candidate => (
        <article
          className='rounded-lg border border-slate-200 p-4'
          key={candidate.id}
        >
          <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <h3 className='text-lg font-black text-slate-950'>
                {candidate.detectedName || candidate.filename}
              </h3>
              <p className='text-sm text-slate-600'>{candidate.filename}</p>
            </div>
            <Score value={candidate.score} />
          </div>
          <p className='mt-4 text-sm leading-6 text-slate-700'>
            {candidate.justification}
          </p>
          <div className='mt-4 grid gap-4 md:grid-cols-2'>
            <List title='Strengths' items={candidate.strengths} />
            <List title='Concerns' items={candidate.concerns} />
          </div>
          <p className='mt-4 rounded-md bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800'>
            Recommendation:{' '}
            {candidate.interviewRecommendation.replace('_', ' ')}
          </p>
        </article>
      ))}
    </div>
  );
}

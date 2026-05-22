import {
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { ChangeEvent, FormEvent, useMemo, useState } from 'react';

import {
  loadCandidateCvDraft,
  persistCandidateCvDraft,
} from '@/application/candidate/candidateDraftGateway';
import { runCandidateReviewUseCase } from '@/application/candidate/runCandidateReviewUseCase';
import { CandidateScorecard } from '@/components/candidate/CandidateScorecard';
import { InterviewSimulator } from '@/components/candidate/InterviewSimulator';
import { ResumeBulletPlayground } from '@/components/candidate/ResumeBulletPlayground';
import { SkillGapPanel } from '@/components/candidate/SkillGapPanel';
import { List } from '@/components/common/List';
import { LongTextBlock } from '@/components/common/LongTextBlock';
import { MetricBar } from '@/components/common/MetricBar';
import { ResultPanel } from '@/components/common/ResultPanel';
import { Score } from '@/components/common/Score';
import { TextArea } from '@/components/common/TextArea';
import { TextField } from '@/components/common/TextField';
import { AiConfig, CandidateReview } from '@/domain/aiTypes';
import {
  CandidateQualitySummary,
  buildCandidateQualitySummary,
} from '@/domain/reviewQuality';
import { analyzeSkillGap } from '@/domain/skillGapAnalysis';
import {
  downloadCandidateTextFile,
  downloadJsonFile,
} from '@/files/exportResults';
import { SUPPORTED_FILE_TYPES, extractTextFromFile } from '@/files/extractText';
import { useI18n } from '@/i18n/i18n';

type CandidateReviewerProps = {
  config: AiConfig;
};

export function CandidateReviewer({ config }: CandidateReviewerProps) {
  const { locale, t } = useI18n();
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [cvText, setCvText] = useState(() => loadCandidateCvDraft());
  const [fileStatus, setFileStatus] = useState<string | null>(null);
  const [result, setResult] = useState<CandidateReview | null>(null);
  const [previousResult, setPreviousResult] = useState<CandidateReview | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'toolkit'>(
    'overview',
  );

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
      persistCandidateCvDraft(text);
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

    const controller = new AbortController();

    try {
      const { review } = await runCandidateReviewUseCase(
        config,
        {
          jobTitle,
          jobDescription,
          cvText,
          outputLocale: locale,
        },
        controller.signal,
      );
      setPreviousResult(result);
      setResult(review);
      setIsFormCollapsed(true);
    } catch (processError) {
      if (processError instanceof Error && processError.name === 'AbortError')
        return;

      setError(
        processError instanceof Error
          ? processError.message
          : t('candidate.processError'),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const quality = useMemo(
    () => (result ? buildCandidateQualitySummary(cvText, result) : null),
    [result, cvText],
  );

  const skillGap = useMemo(
    () => analyzeSkillGap(jobDescription, cvText),
    [jobDescription, cvText],
  );

  const scoreDelta =
    result && previousResult ? result.score - previousResult.score : 0;

  return (
    <div className='tool-stack'>
      <div className='tool-panel overflow-hidden'>
        <button
          type='button'
          onClick={() => setIsFormCollapsed(!isFormCollapsed)}
          className='flex w-full items-center justify-between'
        >
          <div className='text-left'>
            <p className='eyebrow'>{t('candidate.eyebrow')}</p>
            <h2 className='panel-title'>{t('candidate.title')}</h2>
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
              {t('candidate.description')}
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
            </div>
            {fileStatus ? (
              <p className='success-message'>{fileStatus}</p>
            ) : null}
            <TextArea
              label={t('candidate.cvText')}
              value={cvText}
              onChange={value => {
                setCvText(value);
                persistCandidateCvDraft(value);
              }}
              rows={8}
            />

            {error ? <p className='error-message'>{error}</p> : null}

            <button
              className='submit-button touch-target group mt-2 w-full'
              type='submit'
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Sparkles className='h-4 w-4' />
              )}
              {isProcessing
                ? t('candidate.processing')
                : t('candidate.process')}
            </button>
            <p className='text-xs leading-5 text-slate-500'>
              {t('candidate.processHint')}
            </p>
          </form>
        )}
      </div>

      <ResultPanel
        title={t('candidate.resultTitle')}
        empty={t('candidate.resultEmpty')}
        status={isProcessing ? 'loading' : result ? 'ready' : 'empty'}
        statusMessage={
          isProcessing ? t('candidate.processing') : t('result.ready')
        }
      >
        <div className='mb-2 flex gap-2'>
          {[
            { id: 'overview', label: t('candidate.tab.overview') },
            { id: 'toolkit', label: t('candidate.tab.toolkit') },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'toolkit')}
              className={[
                'rounded-xl px-4 py-1.5 text-xs font-bold transition-all touch-target',
                activeTab === tab.id
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className='flex gap-2 mb-2'>
          <button
            className='status-button touch-target text-xs'
            type='button'
            onClick={() => downloadJsonFile('candidate-review', result)}
          >
            <Download className='h-3 w-3' />
            {t('export.json')}
          </button>
          <button
            className='status-button touch-target text-xs'
            type='button'
            onClick={() => downloadCandidateTextFile(result!)}
          >
            <Download className='h-3 w-3' />
            {t('export.text')}
          </button>
        </div>

        {activeTab === 'overview' && result && quality && (
          <div className='space-y-2 animate-fade-in'>
            <Score value={result.score} />
            {previousResult ? (
              <div className='rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700'>
                <p className='font-bold text-slate-900'>
                  {t('candidate.rerunDiff')}
                </p>
                <p className='mt-1'>
                  {t('candidate.scoreDelta')}: {scoreDelta >= 0 ? '+' : ''}
                  {scoreDelta.toFixed(1)}
                </p>
                <p>
                  {t('candidate.strengthItems')}:{' '}
                  {previousResult.strengths.length} {'->'}
                  {'  '}
                  {result.strengths.length}
                </p>
                <p>
                  {t('candidate.gapItems')}: {previousResult.gaps.length} {'->'}{' '}
                  {result.gaps.length}
                </p>
              </div>
            ) : null}
            <CandidateScorecard
              review={result}
              quality={quality}
              skillGap={skillGap}
            />
            <SkillGapPanel jobDescription={jobDescription} cvText={cvText} />
            <CandidateMetricsChart result={result} quality={quality} />
            <CandidateQualityPanel quality={quality} />
            <p className='text-sm leading-6 text-slate-700'>{result.summary}</p>
            <List
              title={t('candidate.list.strengths')}
              items={result.strengths}
            />
            <List title={t('candidate.list.gaps')} items={result.gaps} />
            <List
              title={t('candidate.list.recommendations')}
              items={result.recommendations}
            />
          </div>
        )}

        {activeTab === 'toolkit' && result && (
          <div className='space-y-2 animate-fade-in'>
            <ResumeBulletPlayground
              originalBullets={result.strengths}
              suggestedBullets={result.rewrittenBullets}
            />
            <InterviewSimulator questions={result.interviewQa} />
            <LongTextBlock
              title={t('candidate.list.rewrittenCv')}
              text={result.rewrittenCv}
            />
            <LongTextBlock
              title={t('candidate.list.coverLetter')}
              text={result.coverLetter}
            />
          </div>
        )}
      </ResultPanel>
    </div>
  );
}

function CandidateMetricsChart({
  result,
  quality,
}: {
  result: CandidateReview;
  quality: CandidateQualitySummary;
}) {
  const { t } = useI18n();

  const strengthsScore = Math.min(10, result.strengths.length * 1.5);
  const gapsScore = Math.max(0, 10 - result.gaps.length * 1.5);
  const recommendationScore = Math.min(10, result.recommendations.length * 2);
  const evidenceCoverage = quality.evidenceCoverageRate / 10;
  const interviewReadiness = Math.min(10, result.interviewQa.length * 1.5);

  return (
    <div className='rounded-3xl border border-slate-200 bg-slate-50 p-3 shadow-sm'>
      <p className='text-sm font-bold text-slate-900'>
        {t('candidate.summaryChart')}
      </p>
      <div className='mt-2 space-y-2'>
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

function CandidateQualityPanel({
  quality,
}: {
  quality: CandidateQualitySummary;
}) {
  const { t } = useI18n();

  return (
    <div className='rounded-3xl border border-slate-200 bg-white p-3 shadow-sm'>
      <p className='text-sm font-bold text-slate-900'>
        {t('candidate.quality.reliabilityChecks')}
      </p>
      <div className='mt-2 space-y-2'>
        <div className='flex items-start gap-2 rounded-2xl bg-slate-50 p-3'>
          <div className='h-2 w-2 mt-1.5 rounded-full bg-cyan-600' />
          <div>
            <p className='text-xs font-bold'>
              {t('candidate.quality.unsupportedGuard')}
            </p>
            <p className='text-[10px] text-slate-500 mt-0.5'>
              {quality.unsupportedClaims.length === 0
                ? t('candidate.quality.allVerified')
                : t('candidate.quality.unsupportedClaims', {
                    count: quality.unsupportedClaims.length,
                  })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

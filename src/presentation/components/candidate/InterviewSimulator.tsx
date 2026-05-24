import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';

import { useI18n } from '@/infrastructure/i18n/i18n';

type InterviewQuestion = {
  question: string;
  suggestedAnswer: string;
};

type InterviewSimulatorProps = {
  questions: InterviewQuestion[];
};

export function InterviewSimulator({ questions }: InterviewSimulatorProps) {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const currentQ = questions[currentIndex];

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer('');
      setShowFeedback(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setUserAnswer('');
      setShowFeedback(false);
    }
  };

  const reset = () => {
    setCurrentIndex(0);
    setUserAnswer('');
    setShowFeedback(false);
  };

  if (questions.length === 0) {
    return (
      <div className='flex items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-2'>
        <MessageSquare className='h-6 w-6 text-slate-400' />
        <p className='text-sm font-bold text-slate-800'>
          {t('candidate.interview.noQuestions')}
        </p>
      </div>
    );
  }

  // Simple keyword matching for "feedback" simulation
  const feedback = () => {
    const suggested = currentQ.suggestedAnswer.toLowerCase();
    const user = userAnswer.toLowerCase();
    const keywords = suggested
      .split(/\W+/)
      .filter(w => w.length > 2)
      .slice(0, 10);
    const matched = keywords.filter(w => user.includes(w));

    return {
      matched,
      all: keywords,
      score: keywords.length > 0 ? (matched.length / keywords.length) * 100 : 0,
    };
  };

  const results = feedback();

  return (
    <section className='tool-panel space-y-2'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='eyebrow'>{t('candidate.interview.eyebrow')}</p>
          <h3 className='text-lg font-bold text-slate-950'>
            {t('candidate.interview.title')}
          </h3>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className='p-2 rounded-full hover:bg-slate-100 disabled:opacity-30'
          >
            <ChevronLeft className='h-5 w-5' />
          </button>
          <span className='text-xs font-black text-slate-500 tabular-nums'>
            {currentIndex + 1} / {questions.length}
          </span>
          <button
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            className='p-2 rounded-full hover:bg-slate-100 disabled:opacity-30'
          >
            <ChevronRight className='h-5 w-5' />
          </button>
        </div>
      </div>

      <div className='space-y-2'>
        <div className='rounded-3xl bg-cyan-600 p-3 text-white shadow-lg shadow-cyan-200/50'>
          <p className='text-[10px] font-bold uppercase tracking-widest opacity-80'>
            {t('candidate.interview.questionPrefix')}
            {currentIndex + 1}
          </p>
          <p className='mt-2 text-lg font-black leading-tight'>
            {currentQ.question}
          </p>
        </div>

        <div className='space-y-2'>
          <label className='field-label'>
            {t('candidate.interview.yourResponse')}
          </label>
          <textarea
            className='text-input h-32 resize-none leading-relaxed'
            placeholder={t('candidate.interview.placeholder')}
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
          />
        </div>

        <div className='flex gap-2'>
          <button
            className='primary-button flex-1 touch-target'
            onClick={() => setShowFeedback(true)}
            disabled={!userAnswer.trim() || showFeedback}
          >
            <Sparkles className='h-4 w-4' />{' '}
            {t('candidate.interview.checkApproach')}
          </button>
          <button
            className='status-button touch-target'
            onClick={reset}
            title={t('candidate.interview.reset')}
          >
            <RotateCcw className='h-4 w-4' />
          </button>
        </div>
      </div>

      {showFeedback && (
        <div className='animate-fade-in space-y-2 border-t border-slate-100 pt-2'>
          <div className='rounded-2xl border border-emerald-200 bg-emerald-50 p-2'>
            <div className='flex items-center gap-2 text-emerald-800'>
              <CheckCircle2 className='h-5 w-5' />
              <p className='text-sm font-bold'>
                {t('candidate.interview.suggestedStrategy')}
              </p>
            </div>
            <p className='mt-2 text-sm leading-relaxed text-slate-700'>
              {currentQ.suggestedAnswer}
            </p>
          </div>

          <div className='space-y-2'>
            <p className='text-xs font-bold uppercase tracking-wide text-slate-500'>
              {t('candidate.interview.contentMatch', {
                score: Math.round(results.score),
              })}
            </p>
            <div className='flex flex-wrap gap-1.5'>
              {results.all.map(kw => (
                <span
                  key={kw}
                  className={[
                    'rounded-lg px-2 py-0.5 text-[10px] font-bold transition-colors',
                    results.matched.includes(kw)
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-400',
                  ].join(' ')}
                >
                  {kw}
                </span>
              ))}
            </div>
            <div className='mt-2'>
              {results.matched.length === 0 ? (
                <span className='text-slate-400 italic'>
                  {t('candidate.interview.noneMatching')}
                </span>
              ) : results.matched.length === results.all.length ? (
                <span className='text-slate-400 italic'>
                  {t('candidate.interview.fullyMatched')}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

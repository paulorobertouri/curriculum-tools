import { ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { useState } from 'react';

import { useI18n } from '@/i18n/i18n';

type ResumeBulletPlaygroundProps = {
  originalBullets: string[];
  suggestedBullets: string[];
};

export function ResumeBulletPlayground({
  originalBullets,
  suggestedBullets,
}: ResumeBulletPlaygroundProps) {
  const { t } = useI18n();
  const [activeOriginalIndex, setActiveOriginalIndex] = useState(0);
  const [editedBullet, setEditedBullet] = useState(originalBullets[0] || '');

  const applySuggestion = (suggestion: string) => {
    setEditedBullet(suggestion);
  };

  const handleSelectOriginal = (index: number) => {
    setActiveOriginalIndex(index);
    setEditedBullet(originalBullets[index]);
  };

  const reset = () => {
    setEditedBullet(originalBullets[activeOriginalIndex]);
  };

  return (
    <section className='tool-panel space-y-2'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='eyebrow'>{t('candidate.playground.eyebrow')}</p>
          <h3 className='text-lg font-bold text-slate-950'>
            {t('candidate.playground.title')}
          </h3>
        </div>
        <button
          onClick={reset}
          className='status-button touch-target'
          title={t('candidate.playground.reset')}
        >
          <RotateCcw className='h-4 w-4' />
        </button>
      </div>

      <div className='grid gap-2 lg:grid-cols-2'>
        <div className='space-y-2'>
          <p className='text-xs font-bold uppercase tracking-wide text-slate-500'>
            {t('candidate.playground.step1')}
          </p>
          <div className='space-y-2'>
            {originalBullets.map((bullet, i) => (
              <button
                key={i}
                onClick={() => handleSelectOriginal(i)}
                className={[
                  'w-full text-left p-2 rounded-2xl border text-sm transition-all touch-target',
                  activeOriginalIndex === i
                    ? 'border-cyan-600 bg-cyan-50 text-cyan-900 shadow-sm'
                    : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200',
                ].join(' ')}
              >
                {bullet}
              </button>
            ))}
          </div>
        </div>

        <div className='space-y-2'>
          <p className='text-xs font-bold uppercase tracking-wide text-slate-500'>
            {t('candidate.playground.step2')}
          </p>
          <div className='space-y-2 rounded-3xl border border-slate-200 bg-slate-50/50 p-2'>
            <textarea
              className='text-input h-32 resize-none bg-white shadow-xs'
              value={editedBullet}
              onChange={e => setEditedBullet(e.target.value)}
            />

            <div className='space-y-2'>
              <p className='text-[10px] font-bold uppercase tracking-widest text-slate-400'>
                {t('candidate.playground.suggestions')}
              </p>
              {suggestedBullets.slice(0, 3).map((s, i) => (
                <button
                  key={i}
                  onClick={() => applySuggestion(s)}
                  className='group flex w-full items-center justify-between rounded-xl bg-white p-2 text-xs font-medium text-slate-700 shadow-xs transition-all hover:bg-cyan-50 hover:text-cyan-900'
                >
                  <span className='truncate mr-2'>{s}</span>
                  <ArrowRight className='h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100' />
                </button>
              ))}
            </div>

            <div className='flex items-start gap-2 rounded-xl bg-emerald-100/50 p-2 text-[10px] font-bold text-emerald-800 leading-normal'>
              <CheckCircle2 className='h-3.5 w-3.5 flex-shrink-0 mt-0.5' />
              {t('candidate.playground.copyHint')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

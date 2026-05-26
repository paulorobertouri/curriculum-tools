import { FileText, Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

import { useI18n } from '@/common/i18n/i18n';

export function ResultPanel({
  title,
  empty,
  status = 'empty',
  statusMessage,
  errorMessage,
  children,
  className = '',
}: {
  title: string;
  empty: string;
  status?: 'empty' | 'loading' | 'ready' | 'error';
  statusMessage?: string;
  errorMessage?: string;
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
        <div className='state-loading rounded-3xl border border-dashed border-cyan-200 bg-cyan-50 p-3 text-sm leading-6 text-cyan-900'>
          <div className='flex items-center gap-2 font-bold'>
            <Loader2 className='h-4 w-4 animate-spin' />
            <span>{statusMessage ?? t('result.loading')}</span>
          </div>
          <div className='mt-2 space-y-2'>
            <div className='skeleton h-3 w-3/4' />
            <div className='skeleton h-3 w-5/6' />
            <div className='skeleton h-3 w-2/3' />
          </div>
          <p className='mt-2 text-cyan-800/80'>{empty}</p>
        </div>
      ) : status === 'error' ? (
        <div className='error-message'>
          <p className='font-bold'>{statusMessage ?? t('result.loading')}</p>
          <p className='mt-1 text-sm'>{errorMessage ?? empty}</p>
        </div>
      ) : isReady ? (
        <div className='space-y-2'>
          <div className='inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800'>
            {statusMessage ?? t('result.ready')}
          </div>
          {children}
        </div>
      ) : (
        <div className='rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-3'>
          <p className='text-sm leading-6 text-slate-600'>{empty}</p>
        </div>
      )}
    </aside>
  );
}

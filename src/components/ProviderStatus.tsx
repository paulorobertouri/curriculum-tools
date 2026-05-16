import { CheckCircle2, Pencil, RotateCcw, Trash2 } from 'lucide-react';

import { AiConfig, PROVIDER_LABELS } from '@/domain/aiTypes';
import { useI18n } from '@/i18n/i18n';
import { maskApiKey } from '@/storage/aiConfigStorage';

type ProviderStatusProps = {
  config: AiConfig;
  isTesting: boolean;
  message: string | null;
  onRetest(): void;
  onEdit(): void;
  onClear(): void;
};

export function ProviderStatus({
  config,
  isTesting,
  message,
  onRetest,
  onEdit,
  onClear,
}: ProviderStatusProps) {
  const { t } = useI18n();

  return (
    <section className='flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8'>
      <div className='mx-auto flex w-full max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-start gap-3'>
          <CheckCircle2 className='mt-1 h-5 w-5 text-emerald-600' />
          <div>
            <p className='text-sm font-bold text-slate-950'>
              {t('provider.status.connected', {
                provider: PROVIDER_LABELS[config.provider],
              })}
            </p>
            <p className='text-sm text-slate-600'>
              {config.model} · {maskApiKey(config.apiKey)}
            </p>
            {message ? (
              <p className='mt-1 text-sm text-slate-700' aria-live='polite'>
                {message}
              </p>
            ) : null}
          </div>
        </div>
        <div className='flex flex-wrap gap-2'>
          <button
            className='status-button'
            type='button'
            onClick={onRetest}
            disabled={isTesting}
          >
            <RotateCcw className='h-4 w-4' />
            {isTesting
              ? t('provider.status.testing')
              : t('provider.status.retest')}
          </button>
          <button className='status-button' type='button' onClick={onEdit}>
            <Pencil className='h-4 w-4' />
            {t('provider.status.edit')}
          </button>
          <button
            className='status-button text-rose-700'
            type='button'
            onClick={onClear}
          >
            <Trash2 className='h-4 w-4' />
            {t('provider.status.clear')}
          </button>
        </div>
      </div>
    </section>
  );
}

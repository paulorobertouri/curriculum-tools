import { CheckCircle2, Pencil, RotateCcw, Trash2 } from 'lucide-react';

import {
  AiConfig,
  PROVIDER_LABELS,
  PROVIDER_RISK_I18N_KEY,
} from '@/common/core/aiTypes';
import { useI18n } from '@/common/i18n';
import { maskApiKey } from '@/common/aiConfigStorage';

type ProviderStatusProps = {
  readonly config: AiConfig;
  readonly isTesting: boolean;
  readonly message: string | null;
  readonly onRetest: () => void;
  readonly onEdit: () => void;
  readonly onClear: () => void;
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
  const keyLabel = config.apiKey.trim()
    ? maskApiKey(config.apiKey)
    : t('provider.status.noKey');

  const providerRiskKey = PROVIDER_RISK_I18N_KEY[config.provider];
  const providerRiskMessage = providerRiskKey ? t(providerRiskKey) : null;

  return (
    <section className='border-b border-slate-200/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur sm:px-6 lg:px-8'>
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm sm:flex-row sm:items-start sm:justify-between'>
        <div className='flex items-start gap-3'>
          <CheckCircle2 className='mt-1 h-5 w-5 text-emerald-600' />
          <div>
            <p className='text-sm font-bold text-slate-950'>
              {t('provider.status.connected', {
                provider: PROVIDER_LABELS[config.provider],
              })}
            </p>
            <p className='text-sm text-slate-600'>
              {config.model} · {keyLabel}
            </p>
            <p className='text-xs font-semibold text-slate-500'>
              {config.redactSensitiveData !== false
                ? t('provider.status.redactionOn')
                : t('provider.status.redactionOff')}
            </p>
            {providerRiskMessage ? (
              <p className='mt-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900'>
                <span className='font-bold'>
                  {t('provider.setup.risk.title')}{' '}
                </span>
                {providerRiskMessage}
              </p>
            ) : null}
            {message ? (
              <p
                className='mt-1 text-sm text-slate-700'
                role='status'
                aria-live='polite'
              >
                {message}
              </p>
            ) : null}
          </div>
        </div>
        <div className='flex flex-wrap gap-2'>
          <button
            className='status-button touch-target'
            type='button'
            onClick={onRetest}
            disabled={isTesting}
          >
            <RotateCcw className='h-4 w-4' />
            {isTesting
              ? t('provider.status.testing')
              : t('provider.status.retest')}
          </button>
          <button
            className='status-button touch-target'
            type='button'
            onClick={onEdit}
          >
            <Pencil className='h-4 w-4' />
            {t('provider.status.edit')}
          </button>
          <button
            className='status-button touch-target text-rose-700'
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

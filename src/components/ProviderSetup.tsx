import { KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { FormEvent, useState } from 'react';

import { LanguageSelector } from '@/components/LanguageSelector';
import {
  AiConfig,
  AiProviderId,
  DEFAULT_MODELS,
  PROVIDER_LABELS,
} from '@/domain/aiTypes';
import { useI18n } from '@/i18n/i18n';
import { getProviderAdapter } from '@/providers';

type ProviderSetupProps = {
  initialConfig?: AiConfig | null;
  onSave(config: AiConfig): void;
};

export function ProviderSetup({ initialConfig, onSave }: ProviderSetupProps) {
  const { t } = useI18n();
  const [provider, setProvider] = useState<AiProviderId>(
    initialConfig?.provider ?? 'gemini',
  );
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey ?? '');
  const [model, setModel] = useState(
    initialConfig?.model ?? DEFAULT_MODELS.gemini,
  );
  const [status, setStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleProviderChange = (nextProvider: AiProviderId) => {
    setProvider(nextProvider);
    setModel(DEFAULT_MODELS[nextProvider]);
    setStatus(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (!apiKey.trim() || !model.trim()) {
      setStatus(t('provider.setup.validation'));
      return;
    }

    const config: AiConfig = {
      provider,
      apiKey: apiKey.trim(),
      model: model.trim(),
      savedAt: new Date().toISOString(),
    };

    setIsTesting(true);

    try {
      await getProviderAdapter(provider).testConnection(config);
      onSave(config);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : t('provider.status.failed'),
      );
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <main className='app-shell text-slate-950'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute -left-28 top-20 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl' />
        <div className='absolute right-0 top-24 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl' />
      </div>

      <div className='relative mx-auto grid min-h-screen max-w-7xl content-center gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
        <section className='grid gap-6 rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:grid-cols-[1fr_0.95fr] lg:p-10'>
          <div className='space-y-6'>
            <div className='flex justify-end'>
              <LanguageSelector compact />
            </div>
            <span className='inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-800'>
              <ShieldCheck className='h-4 w-4' />
              {t('provider.setup.badge')}
            </span>
            <div className='space-y-3'>
              <h1 className='text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl'>
                {t('provider.setup.title')}
              </h1>
              <p className='max-w-2xl text-base leading-7 text-slate-600 sm:text-lg'>
                {t('provider.setup.subtitle')}
              </p>
            </div>
            <dl className='grid gap-3 sm:grid-cols-3'>
              <div className='rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm'>
                <dt className='text-xs font-bold uppercase tracking-wide text-slate-500'>
                  {t('provider.setup.feature.browser')}
                </dt>
                <dd className='mt-1 text-sm font-semibold text-slate-950'>
                  {t('provider.setup.feature.browserValue')}
                </dd>
              </div>
              <div className='rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm'>
                <dt className='text-xs font-bold uppercase tracking-wide text-slate-500'>
                  {t('provider.setup.feature.storage')}
                </dt>
                <dd className='mt-1 text-sm font-semibold text-slate-950'>
                  {t('provider.setup.feature.storageValue')}
                </dd>
              </div>
              <div className='rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm'>
                <dt className='text-xs font-bold uppercase tracking-wide text-slate-500'>
                  {t('provider.setup.feature.direct')}
                </dt>
                <dd className='mt-1 text-sm font-semibold text-slate-950'>
                  {t('provider.setup.feature.directValue')}
                </dd>
              </div>
            </dl>
            <div className='rounded-3xl border border-amber-200/70 bg-amber-50/90 p-4 text-sm leading-6 text-amber-900 shadow-sm'>
              {t('provider.setup.privacy')}
            </div>
          </div>

          <form
            className='grid gap-5 rounded-[1.75rem] border border-slate-200 bg-white p-5 text-slate-950 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6'
            onSubmit={handleSubmit}
          >
            <div className='space-y-2'>
              <label className='text-sm font-bold' htmlFor='provider'>
                {t('provider.setup.provider')}
              </label>
              <select
                id='provider'
                className='w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100'
                value={provider}
                onChange={event =>
                  handleProviderChange(event.target.value as AiProviderId)
                }
              >
                {Object.entries(PROVIDER_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-bold' htmlFor='api-key'>
                {t('provider.setup.key')}
              </label>
              <input
                id='api-key'
                className='w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100'
                type='password'
                value={apiKey}
                onChange={event => setApiKey(event.target.value)}
                placeholder={t('provider.setup.placeholder')}
              />
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-bold' htmlFor='model'>
                {t('provider.setup.model')}
              </label>
              <input
                id='model'
                className='w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100'
                value={model}
                onChange={event => setModel(event.target.value)}
              />
            </div>

            {status ? (
              <p
                role='alert'
                className='rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700'
              >
                {status}
              </p>
            ) : null}

            <button
              className='inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:hover:translate-y-0'
              type='submit'
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <KeyRound className='h-4 w-4' />
              )}
              {isTesting
                ? t('provider.setup.testing')
                : t('provider.setup.submit')}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

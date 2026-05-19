import { KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import {
  listProviderModelsUseCase,
  testProviderConnectionUseCase,
} from '@/application/provider/providerSetupUseCases';
import { LanguageSelector } from '@/components/LanguageSelector';
import {
  AiConfig,
  AiProviderId,
  DEFAULT_MODELS,
  ENABLED_PROVIDER_IDS,
  PROVIDER_LABELS,
  PROVIDER_RISK_I18N_KEY,
  providerIsEnabled,
  providerRequiresApiKey,
} from '@/domain/aiTypes';
import { useI18n } from '@/i18n/i18n';

type ProviderSetupProps = {
  readonly initialConfig?: AiConfig | null;
  readonly onSave: (config: AiConfig) => void;
};

export function ProviderSetup({ initialConfig, onSave }: ProviderSetupProps) {
  const { t } = useI18n();
  const modelOptionsId = 'provider-model-options';
  const initialProvider: AiProviderId =
    initialConfig && providerIsEnabled(initialConfig.provider)
      ? initialConfig.provider
      : 'openai';
  const [provider, setProvider] = useState<AiProviderId>(initialProvider);
  const [apiKey, setApiKey] = useState(
    initialConfig?.provider === initialProvider ? initialConfig.apiKey : '',
  );
  const [model, setModel] = useState(
    initialConfig?.provider === initialProvider
      ? initialConfig.model
      : DEFAULT_MODELS[initialProvider],
  );
  const [redactSensitiveData, setRedactSensitiveData] = useState(
    initialConfig?.redactSensitiveData ?? true,
  );
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  const apiKeyRequired = providerRequiresApiKey(provider);

  const providerRiskKey = PROVIDER_RISK_I18N_KEY[provider];
  const providerRiskMessage = providerRiskKey ? t(providerRiskKey) : null;

  const handleProviderChange = (nextProvider: AiProviderId) => {
    setProvider(nextProvider);
    setModel(DEFAULT_MODELS[nextProvider]);
    setAvailableModels([]);
    setStatus(null);
  };

  const handleFetchModels = async () => {
    setStatus(null);

    if (apiKeyRequired && !apiKey.trim()) {
      setStatus(t('provider.setup.validation'));
      return;
    }

    const config: AiConfig = {
      provider,
      apiKey: apiKey.trim(),
      model: model.trim(),
      savedAt: new Date().toISOString(),
      redactSensitiveData,
    };

    setIsFetchingModels(true);

    try {
      const { supported, models } = await listProviderModelsUseCase(config);

      if (!supported) {
        setStatus(t('provider.setup.modelsUnsupported'));
        return;
      }

      setAvailableModels(models);

      if (models.length === 0) {
        setStatus(t('provider.setup.modelsEmpty'));
        return;
      }

      setModel(models[0]);

      setStatus(
        t('provider.setup.modelsFetched', { count: String(models.length) }),
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : t('provider.status.failed'),
      );
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (!model.trim()) {
      setStatus(t('provider.setup.validationModel'));
      return;
    }

    if (apiKeyRequired && !apiKey.trim()) {
      setStatus(t('provider.setup.validation'));
      return;
    }

    const config: AiConfig = {
      provider,
      apiKey: apiKey.trim(),
      model: model.trim(),
      savedAt: new Date().toISOString(),
      redactSensitiveData,
    };

    setIsTesting(true);

    try {
      await testProviderConnectionUseCase(config);
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
                className='text-input touch-target'
                value={provider}
                onChange={event =>
                  handleProviderChange(event.target.value as AiProviderId)
                }
              >
                {ENABLED_PROVIDER_IDS.map(id => (
                  <option key={id} value={id}>
                    {PROVIDER_LABELS[id]}
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-bold' htmlFor='api-key'>
                {apiKeyRequired
                  ? t('provider.setup.key')
                  : t('provider.setup.keyOptional')}
              </label>
              <input
                id='api-key'
                className='text-input touch-target'
                type='password'
                value={apiKey}
                onChange={event => setApiKey(event.target.value)}
                placeholder={
                  apiKeyRequired
                    ? t('provider.setup.placeholder')
                    : t('provider.setup.placeholderOptional')
                }
              />
            </div>

            {providerRiskMessage ? (
              <p className='rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'>
                <span className='font-bold'>
                  {t('provider.setup.risk.title')}{' '}
                </span>
                {providerRiskMessage}
              </p>
            ) : null}

            <div className='space-y-2'>
              <div className='flex items-center justify-between gap-3'>
                <label className='text-sm font-bold' htmlFor='model'>
                  {t('provider.setup.model')}
                </label>
                <button
                  className='status-button touch-target text-xs'
                  type='button'
                  onClick={handleFetchModels}
                  disabled={isFetchingModels || isTesting}
                >
                  {isFetchingModels
                    ? t('provider.setup.fetchingModels')
                    : t('provider.setup.fetchModels')}
                </button>
              </div>
              <input
                id='model'
                className='text-input touch-target'
                value={model}
                onChange={event => setModel(event.target.value)}
                list={availableModels.length > 0 ? modelOptionsId : undefined}
              />
              {availableModels.length > 0 ? (
                <datalist id={modelOptionsId}>
                  {availableModels.map(option => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              ) : null}
            </div>

            <label className='flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3'>
              <input
                className='mt-1 h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500'
                type='checkbox'
                checked={redactSensitiveData}
                onChange={event => setRedactSensitiveData(event.target.checked)}
              />
              <span className='text-sm text-slate-700'>
                <span className='block font-bold text-slate-950'>
                  {t('provider.setup.redaction.label')}
                </span>
                {t('provider.setup.redaction.help')}
              </span>
            </label>

            {status ? (
              <p
                role='alert'
                className='rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700'
              >
                {status}
              </p>
            ) : null}

            <button
              className='primary-button touch-target'
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

import { FormEvent, useState } from 'react';
import { KeyRound, Loader2, ShieldCheck } from 'lucide-react';

import {
  AiConfig,
  AiProviderId,
  DEFAULT_MODELS,
  PROVIDER_LABELS,
} from '@/domain/aiTypes';
import { getProviderAdapter } from '@/providers';

type ProviderSetupProps = {
  initialConfig?: AiConfig | null;
  onSave(config: AiConfig): void;
};

export function ProviderSetup({ initialConfig, onSave }: ProviderSetupProps) {
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
      setStatus('Enter an API key and model before testing.');
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
        error instanceof Error
          ? error.message
          : 'The provider test failed. Check the key and try again.',
      );
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <main className='min-h-screen bg-slate-950 text-white'>
      <div className='mx-auto grid min-h-screen max-w-5xl content-center gap-8 px-4 py-10 sm:px-6 lg:px-8'>
        <section className='grid gap-6 rounded-lg border border-white/10 bg-white/[0.06] p-6 shadow-2xl sm:p-8 lg:grid-cols-[1fr_0.9fr]'>
          <div className='space-y-5'>
            <span className='inline-flex items-center gap-2 rounded-full border border-cyan-300/40 px-3 py-1 text-sm font-semibold text-cyan-100'>
              <ShieldCheck className='h-4 w-4' />
              Browser-first AI setup
            </span>
            <div className='space-y-3'>
              <h1 className='text-4xl font-black tracking-tight sm:text-5xl'>
                Curriculum Tools
              </h1>
              <p className='max-w-2xl text-base leading-7 text-slate-300'>
                Connect Gemini, OpenAI, or DeepSeek with your own API key before
                reviewing CVs or ranking candidates.
              </p>
            </div>
            <div className='rounded-lg border border-amber-300/30 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50'>
              Your API key is stored in this browser&apos;s localStorage. CV
              text is sent directly from this browser to the selected AI
              provider only when you click Process.
            </div>
          </div>

          <form
            className='grid gap-5 rounded-lg bg-white p-5 text-slate-950'
            onSubmit={handleSubmit}
          >
            <div className='space-y-2'>
              <label className='text-sm font-bold' htmlFor='provider'>
                Provider
              </label>
              <select
                id='provider'
                className='w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100'
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
                API key
              </label>
              <input
                id='api-key'
                className='w-full rounded-md border border-slate-300 px-3 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100'
                type='password'
                value={apiKey}
                onChange={event => setApiKey(event.target.value)}
                placeholder='Paste your provider key'
              />
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-bold' htmlFor='model'>
                Model
              </label>
              <input
                id='model'
                className='w-full rounded-md border border-slate-300 px-3 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100'
                value={model}
                onChange={event => setModel(event.target.value)}
              />
            </div>

            {status ? (
              <p
                role='alert'
                className='rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700'
              >
                {status}
              </p>
            ) : null}

            <button
              className='inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400'
              type='submit'
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <KeyRound className='h-4 w-4' />
              )}
              {isTesting ? 'Testing provider' : 'Test and Save'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

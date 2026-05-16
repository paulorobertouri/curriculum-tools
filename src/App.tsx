import { BriefcaseBusiness, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CandidateReviewer } from '@/components/CandidateReviewer';
import { HrRanker } from '@/components/HrRanker';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ProviderSetup } from '@/components/ProviderSetup';
import { ProviderStatus } from '@/components/ProviderStatus';
import { AiConfig } from '@/domain/aiTypes';
import { useI18n } from '@/i18n/i18n';
import { getProviderAdapter } from '@/providers';
import {
  clearAiConfig,
  readAiConfig,
  saveAiConfig,
} from '@/storage/aiConfigStorage';

type ActiveTool = 'candidate' | 'hr';

function App() {
  const { t } = useI18n();
  const [config, setConfig] = useState<AiConfig | null>(() => readAiConfig());
  const [editingConfig, setEditingConfig] = useState(false);
  const [activeTool, setActiveTool] = useState<ActiveTool>('candidate');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isRetesting, setIsRetesting] = useState(false);

  const shouldShowSetup = !config || editingConfig;

  const activeContent = useMemo(() => {
    if (!config) {
      return null;
    }

    return activeTool === 'candidate' ? (
      <CandidateReviewer config={config} />
    ) : (
      <HrRanker config={config} />
    );
  }, [activeTool, config]);

  const handleSave = (nextConfig: AiConfig) => {
    saveAiConfig(nextConfig);
    setConfig(nextConfig);
    setEditingConfig(false);
    setStatusMessage(t('provider.status.saved'));
  };

  const handleClear = () => {
    clearAiConfig();
    setConfig(null);
    setEditingConfig(false);
    setStatusMessage(null);
  };

  const handleRetest = async () => {
    if (!config) {
      return;
    }

    setIsRetesting(true);
    setStatusMessage(null);

    try {
      const result = await getProviderAdapter(config.provider).testConnection(
        config,
      );
      setStatusMessage(result.message);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : t('provider.status.failed'),
      );
    } finally {
      setIsRetesting(false);
    }
  };

  if (shouldShowSetup) {
    return <ProviderSetup initialConfig={config} onSave={handleSave} />;
  }

  return (
    <main className='min-h-screen bg-slate-100 text-slate-950'>
      <ProviderStatus
        config={config}
        isTesting={isRetesting}
        message={statusMessage}
        onRetest={handleRetest}
        onEdit={() => setEditingConfig(true)}
        onClear={handleClear}
      />

      <div className='mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8'>
        <header className='grid gap-4'>
          <div className='flex items-center justify-between gap-3'>
            <p className='eyebrow'>{t('app.kicker')}</p>
            <LanguageSelector compact />
          </div>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
            <div>
              <h1 className='text-3xl font-black tracking-tight sm:text-4xl'>
                {t('app.title')}
              </h1>
              <p className='mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base'>
                {t('app.subtitle')}
              </p>
            </div>
            <nav className='inline-flex rounded-lg border border-slate-300 bg-white p-1'>
              <button
                className={toolButtonClass(activeTool === 'candidate')}
                type='button'
                onClick={() => setActiveTool('candidate')}
              >
                <UserRound className='h-4 w-4' />
                {t('app.tab.candidate')}
              </button>
              <button
                className={toolButtonClass(activeTool === 'hr')}
                type='button'
                onClick={() => setActiveTool('hr')}
              >
                <BriefcaseBusiness className='h-4 w-4' />
                {t('app.tab.hr')}
              </button>
            </nav>
          </div>
        </header>

        <section className='rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900'>
          {t('app.privacy', { provider: config.provider })}
        </section>

        {activeContent}
      </div>
    </main>
  );
}

const toolButtonClass = (active: boolean) =>
  [
    'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition',
    active
      ? 'bg-slate-950 text-white'
      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950',
  ].join(' ');

export default App;

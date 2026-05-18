import { BriefcaseBusiness, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CandidateReviewer } from '@/components/CandidateReviewer';
import { HrRanker } from '@/components/HrRanker';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ProviderSetup } from '@/components/ProviderSetup';
import { ProviderStatus } from '@/components/ProviderStatus';
import { QualityHarness } from '@/components/QualityHarness';
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
    <main className='app-shell text-slate-950'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute -left-24 top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl' />
        <div className='absolute right-0 top-40 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl' />
      </div>

      <ProviderStatus
        config={config}
        isTesting={isRetesting}
        message={statusMessage}
        onRetest={handleRetest}
        onEdit={() => setEditingConfig(true)}
        onClear={handleClear}
      />

      <div className='relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
        <header className='rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8'>
          <div className='flex flex-col gap-6'>
            <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
              <div className='max-w-3xl space-y-4'>
                <div className='flex flex-wrap items-center gap-3'>
                  <p className='eyebrow'>{t('app.kicker')}</p>
                  <span className='rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600'>
                    Browser-first workflow
                  </span>
                </div>
                <div className='space-y-3'>
                  <h1 className='text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl'>
                    {t('app.title')}
                  </h1>
                  <p className='max-w-3xl text-sm leading-7 text-slate-600 sm:text-base'>
                    {t('app.subtitle')}
                  </p>
                </div>
              </div>
              <div className='flex flex-col items-start gap-3 sm:items-end'>
                <LanguageSelector compact />
              </div>
            </div>

            <nav
              className='grid gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-2 sm:grid-cols-2'
              role='tablist'
              aria-label='Main tools'
            >
              <button
                className={toolButtonClass(activeTool === 'candidate')}
                type='button'
                onClick={() => setActiveTool('candidate')}
                role='tab'
                id='tab-candidate'
                aria-selected={activeTool === 'candidate'}
                aria-controls='panel-candidate'
              >
                <UserRound className='h-4 w-4' />
                <span>{t('app.tab.candidate')}</span>
              </button>
              <button
                className={toolButtonClass(activeTool === 'hr')}
                type='button'
                onClick={() => setActiveTool('hr')}
                role='tab'
                id='tab-hr'
                aria-selected={activeTool === 'hr'}
                aria-controls='panel-hr'
              >
                <BriefcaseBusiness className='h-4 w-4' />
                <span>{t('app.tab.hr')}</span>
              </button>
            </nav>
          </div>
        </header>

        <section className='mt-6 rounded-3xl border border-amber-200/70 bg-amber-50/90 p-4 text-sm leading-6 text-amber-900 shadow-sm'>
          {t('app.privacy', { provider: config.provider })}
        </section>

        <div
          className='mt-6'
          role='tabpanel'
          id={activeTool === 'candidate' ? 'panel-candidate' : 'panel-hr'}
          aria-labelledby={
            activeTool === 'candidate' ? 'tab-candidate' : 'tab-hr'
          }
        >
          {activeContent}
        </div>

        <QualityHarness config={config} />
      </div>
    </main>
  );
}

const toolButtonClass = (active: boolean) =>
  [
    'inline-flex w-full items-center justify-center gap-2 rounded-[1.1rem] px-4 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 sm:px-5',
    active
      ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/10'
      : 'text-slate-700 hover:bg-white hover:text-slate-950',
  ].join(' ');

export default App;

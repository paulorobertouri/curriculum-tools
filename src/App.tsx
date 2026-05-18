import { BriefcaseBusiness, FlaskConical, UserRound } from 'lucide-react';
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

type ActiveTool = 'candidate' | 'hr' | 'quality';

function App() {
  const { t } = useI18n();
  const [config, setConfig] = useState<AiConfig | null>(() => readAiConfig());
  const [editingConfig, setEditingConfig] = useState(false);
  const [activeTool, setActiveTool] = useState<ActiveTool>('candidate');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isRetesting, setIsRetesting] = useState(false);

  const shouldShowSetup = !config || editingConfig;
  const isRedactionEnabled = config?.redactSensitiveData !== false;

  const activeToolGuide = useMemo(() => {
    if (activeTool === 'candidate') {
      return {
        title: t('app.toolIntro.candidateTitle'),
        description: t('app.toolIntro.candidateDescription'),
        steps: t('app.toolIntro.candidateSteps'),
      };
    }

    if (activeTool === 'hr') {
      return {
        title: t('app.toolIntro.hrTitle'),
        description: t('app.toolIntro.hrDescription'),
        steps: t('app.toolIntro.hrSteps'),
      };
    }

    return {
      title: t('app.toolIntro.qualityTitle'),
      description: t('app.toolIntro.qualityDescription'),
      steps: t('app.toolIntro.qualitySteps'),
    };
  }, [activeTool, t]);

  const activeContent = useMemo(() => {
    if (!config) {
      return null;
    }

    if (activeTool === 'candidate') {
      return <CandidateReviewer config={config} />;
    }

    if (activeTool === 'hr') {
      return <HrRanker config={config} />;
    }

    return <QualityHarness config={config} />;
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
              className='grid gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-2 sm:grid-cols-3'
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
              <button
                className={toolButtonClass(activeTool === 'quality')}
                type='button'
                onClick={() => setActiveTool('quality')}
                role='tab'
                id='tab-quality'
                aria-selected={activeTool === 'quality'}
                aria-controls='panel-quality'
              >
                <FlaskConical className='h-4 w-4' />
                <span>{t('app.tab.quality')}</span>
              </button>
            </nav>
          </div>
        </header>

        <section className='mt-6 rounded-3xl border border-amber-200/70 bg-amber-50/90 p-4 text-sm leading-6 text-amber-900 shadow-sm'>
          {t('app.privacy', {
            provider: config.provider,
            redaction: isRedactionEnabled
              ? t('provider.redaction.enabled')
              : t('provider.redaction.disabled'),
          })}
        </section>

        <section className='mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm'>
          <p className='text-xs font-bold uppercase tracking-wide text-slate-500'>
            {t('app.toolIntro.title')}
          </p>
          <h2 className='mt-1 text-xl font-black text-slate-950'>
            {activeToolGuide.title}
          </h2>
          <p className='mt-2 text-sm leading-6 text-slate-700'>
            {activeToolGuide.description}
          </p>
          <p className='mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700'>
            {activeToolGuide.steps}
          </p>
        </section>

        <div
          className='mt-6'
          role='tabpanel'
          id={`panel-${activeTool}`}
          aria-labelledby={`tab-${activeTool}`}
        >
          {activeContent}
        </div>
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

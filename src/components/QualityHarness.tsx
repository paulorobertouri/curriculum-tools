import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  FlaskConical,
  HelpCircle,
  Loader2,
  Play,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Fragment, ReactNode, useMemo, useState } from 'react';

import {
  loadEvaluationRuns,
  persistEvaluationRuns,
} from '@/application/quality/evaluationHarnessGateway';
import { runEvaluationHarnessUseCase } from '@/application/quality/runEvaluationHarnessUseCase';
import { AiConfig } from '@/domain/aiTypes';
import { candidateFixtures, hrFixtures } from '@/domain/evaluationFixtures';
import { useI18n } from '@/i18n/i18n';
import { EvaluationRun } from '@/storage/evaluationHarnessStorage';

type QualityHarnessProps = {
  config: AiConfig;
};

const average = (values: number[]) => {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const rankSwapCount = (left: string[], right: string[]) => {
  const positions = new Map(left.map((id, index) => [id, index]));
  let swaps = 0;

  right.forEach((id, index) => {
    const previous = positions.get(id);
    if (typeof previous === 'number' && previous !== index) {
      swaps += 1;
    }
  });

  return swaps;
};

// Pure SVG sparkline component for inline score history rendering
function Sparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) {
    return <span className='text-xs text-slate-400'>-</span>;
  }

  const width = 80;
  const height = 20;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const spread = max - min;
  const range = spread === 0 ? 1 : spread;

  const points = scores
    .map((score, index) => {
      const x = (index / (scores.length - 1)) * width;
      const y = height - ((score - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className='overflow-visible'>
      <polyline
        fill='none'
        stroke='#0891b2'
        strokeWidth='1.5'
        points={points}
      />
      {scores.map((score, index) => {
        const x = (index / (scores.length - 1)) * width;
        const y = height - ((score - min) / range) * (height - 4) - 2;
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r='2'
            className='fill-cyan-600 stroke-white'
            strokeWidth='0.5'
          />
        );
      })}
    </svg>
  );
}

export function QualityHarness({ config }: QualityHarnessProps) {
  const { t } = useI18n();
  const [runs, setRuns] = useState<EvaluationRun[]>(() => loadEvaluationRuns());
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFixture, setExpandedFixture] = useState<string | null>(null);

  const latestRun = runs[runs.length - 1] ?? null;
  const previousRun = runs.length > 1 ? runs[runs.length - 2] : null;

  // Filter runs for the current provider to build localized drift history
  const providerRuns = useMemo(() => {
    return runs.filter(run => run.provider === config.provider);
  }, [runs, config.provider]);

  // Compute stats across stored runs for candidate fixtures
  const candidateFixtureStats = useMemo(() => {
    return candidateFixtures.map(fixture => {
      const history = providerRuns
        .map(
          run =>
            run.candidateRuns.find(item => item.fixtureId === fixture.id)
              ?.score,
        )
        .filter((val): val is number => typeof val === 'number');

      const latest = latestRun?.candidateRuns.find(
        item => item.fixtureId === fixture.id,
      );

      const avg = average(history);
      const spread =
        history.length > 0 ? Math.max(...history) - Math.min(...history) : 0;

      return {
        fixture,
        history,
        latestScore: latest?.score ?? null,
        latestDuration: latest?.durationMs ?? null,
        latestCoverage: latest?.evidenceCoverageRate ?? null,
        avg,
        spread,
      };
    });
  }, [candidateFixtures, providerRuns, latestRun]);

  // Compute stats across stored runs for HR fixtures
  const hrFixtureStats = useMemo(() => {
    return hrFixtures.map(fixture => {
      const history = providerRuns
        .map(
          run =>
            run.hrRuns.find(item => item.fixtureId === fixture.id)
              ?.averageScore,
        )
        .filter((val): val is number => typeof val === 'number');

      const latest = latestRun?.hrRuns.find(
        item => item.fixtureId === fixture.id,
      );

      const avg = average(history);
      const spread =
        history.length > 0 ? Math.max(...history) - Math.min(...history) : 0;

      return {
        fixture,
        history,
        latestAvgScore: latest?.averageScore ?? null,
        latestDuration: latest?.durationMs ?? null,
        latestOrder: latest?.candidateOrder ?? null,
        avg,
        spread,
      };
    });
  }, [hrFixtures, providerRuns, latestRun]);

  const driftAcrossModels = useMemo(() => {
    return candidateFixtureStats.map(stat => ({
      fixtureId: stat.fixture.id,
      fixtureName: stat.fixture.name,
      spread: stat.spread,
    }));
  }, [candidateFixtureStats]);

  const latestCandidateAverage = latestRun
    ? average(latestRun.candidateRuns.map(item => item.score))
    : 0;
  const previousCandidateAverage = previousRun
    ? average(previousRun.candidateRuns.map(item => item.score))
    : 0;

  const latestHrAverage = latestRun
    ? average(latestRun.hrRuns.map(item => item.averageScore))
    : 0;
  const previousHrAverage = previousRun
    ? average(previousRun.hrRuns.map(item => item.averageScore))
    : 0;

  const latestRankSwaps =
    latestRun && previousRun
      ? latestRun.hrRuns.reduce((sum, run) => {
          const previous = previousRun.hrRuns.find(
            item => item.fixtureId === run.fixtureId,
          );
          if (!previous) {
            return sum;
          }
          return (
            sum + rankSwapCount(previous.candidateOrder, run.candidateOrder)
          );
        }, 0)
      : 0;

  const runHarness = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const run = await runEvaluationHarnessUseCase(config);
      const nextRuns = [...runs, run].slice(-30);
      setRuns(nextRuns);
      persistEvaluationRuns(nextRuns);
    } catch (runError) {
      setError(
        runError instanceof Error ? runError.message : 'Harness run failed.',
      );
    } finally {
      setIsRunning(false);
    }
  };

  const toggleFixtureExpand = (id: string) => {
    setExpandedFixture(prev => (prev === id ? null : id));
  };

  return (
    <div className='tool-stack'>
      <div className='tool-panel space-y-2'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='eyebrow'>{t('quality.title')}</p>
            <h2 className='panel-title'>{t('quality.subtitle')}</h2>
            <p className='mt-2 text-sm leading-6 text-slate-600'>
              {t('quality.description')}
            </p>
          </div>
          <button
            className='primary-button touch-target self-start sm:self-center'
            type='button'
            onClick={runHarness}
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Play className='h-4 w-4' />
            )}
            {isRunning
              ? t('quality.runningFixtures')
              : t('quality.runFixtures')}
          </button>
        </div>

        <div className='grid gap-2 md:grid-cols-3'>
          <div className='flex items-start gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm'>
            <HelpCircle className='mt-0.5 h-5 w-5 text-cyan-600 flex-shrink-0' />
            <div>
              <p className='text-sm font-bold text-slate-900'>
                {t('quality.howToUse')}
              </p>
              <ul className='mt-2 space-y-1 text-xs text-slate-600'>
                <li>{t('quality.step1')}</li>
                <li>{t('quality.step2')}</li>
                <li>{t('quality.step3')}</li>
              </ul>
            </div>
          </div>

          <div className='rounded-2xl border border-slate-200 bg-white p-3 shadow-sm'>
            <p className='text-sm font-bold text-slate-900'>
              {t('quality.promptQualityDeltas')}
            </p>
            <div className='mt-2 space-y-2 text-sm text-slate-700'>
              <div className='flex justify-between border-b border-slate-100 pb-1'>
                <span>{t('quality.candidateAvg')}:</span>
                <span className='font-bold'>
                  {previousCandidateAverage.toFixed(1)} &rarr;{' '}
                  {latestCandidateAverage.toFixed(1)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span>{t('quality.hrAvg')}:</span>
                <span className='font-bold'>
                  {previousHrAverage.toFixed(1)} &rarr;{' '}
                  {latestHrAverage.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          <div className='rounded-2xl border border-slate-200 bg-white p-3 shadow-sm'>
            <p className='text-sm font-bold text-slate-900'>
              {t('quality.scoreDriftMonitor')}
            </p>
            <div className='mt-2 max-h-24 overflow-y-auto space-y-1 text-xs text-slate-600'>
              {driftAcrossModels.map(item => (
                <div key={item.fixtureId} className='flex justify-between'>
                  <span className='truncate mr-2'>{item.fixtureName}</span>
                  <span
                    className={
                      item.spread >= 1.5
                        ? 'font-bold text-rose-600'
                        : 'font-semibold'
                    }
                  >
                    {item.spread.toFixed(1)}{' '}
                    {item.spread >= 1.5 ? `(${t('quality.warning')})` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error ? <p className='error-message'>{error}</p> : null}

        <div className='grid gap-2 sm:grid-cols-3'>
          <StatCard
            label={t('quality.runsStored')}
            value={String(runs.length)}
            icon={<FlaskConical className='h-4 w-4' />}
          />
          <StatCard
            label={t('quality.candidateAvgDelta')}
            value={`${(latestCandidateAverage - previousCandidateAverage).toFixed(1)}`}
            icon={<TrendingUp className='h-4 w-4' />}
          />
          <StatCard
            label={t('quality.hrRankSwaps')}
            value={String(latestRankSwaps)}
            icon={<AlertTriangle className='h-4 w-4' />}
            warning={latestRankSwaps > 1}
          />
        </div>

        {/* Fixture Score History / Expandable Details Table */}
        <section className='space-y-2' aria-live='polite'>
          <h3 className='text-base font-bold text-slate-950'>
            {t('quality.fixtureHistory')}
          </h3>

          {/* Candidate Fixtures Table */}
          <div className='overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <table className='w-full border-collapse text-left text-sm'>
              <thead className='bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500'>
                <tr>
                  <th className='px-4 py-3'>{t('quality.table.fixture')}</th>
                  <th className='px-4 py-3 text-center'>
                    {t('quality.table.latestScore')}
                  </th>
                  <th className='px-4 py-3 text-center'>
                    {t('quality.table.avgScore')}
                  </th>
                  <th className='px-4 py-3 text-center'>
                    {t('quality.table.drift')}
                  </th>
                  <th className='px-4 py-3 text-center'>
                    {t('quality.table.history')}
                  </th>
                  <th className='px-4 py-3'></th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {candidateFixtureStats.map(
                  ({
                    fixture,
                    history,
                    latestScore,
                    latestDuration,
                    latestCoverage,
                    avg,
                    spread,
                  }) => {
                    const isExpanded = expandedFixture === fixture.id;
                    return (
                      <Fragment key={fixture.id}>
                        <tr className='hover:bg-slate-50/80 transition-colors'>
                          <td className='px-4 py-3 font-semibold text-slate-900'>
                            {fixture.name}
                          </td>
                          <td className='px-4 py-3 text-center font-bold text-slate-800'>
                            {latestScore !== null
                              ? latestScore.toFixed(1)
                              : '-'}
                          </td>
                          <td className='px-4 py-3 text-center text-slate-600'>
                            {history.length > 0 ? avg.toFixed(1) : '-'}
                          </td>
                          <td className='px-4 py-3 text-center'>
                            <span
                              className={
                                spread >= 1.5
                                  ? 'font-bold text-rose-600'
                                  : 'text-slate-600'
                              }
                            >
                              {spread.toFixed(1)}
                            </span>
                          </td>
                          <td className='px-4 py-3 text-center flex items-center justify-center h-[45px]'>
                            <Sparkline scores={history} />
                          </td>
                          <td className='px-4 py-3 text-right'>
                            <button
                              type='button'
                              onClick={() => toggleFixtureExpand(fixture.id)}
                              className='p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors touch-target'
                            >
                              {isExpanded ? (
                                <ChevronUp className='h-4 w-4' />
                              ) : (
                                <ChevronDown className='h-4 w-4' />
                              )}
                            </button>
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr>
                            <td
                              colSpan={6}
                              className='bg-slate-50/50 px-3 py-2'
                            >
                              <div className='grid gap-2 sm:grid-cols-3 text-xs'>
                                <div className='flex items-start gap-2 rounded-xl bg-white border border-slate-100 p-3'>
                                  <Clock className='h-4 w-4 text-cyan-600 mt-0.5' />
                                  <div>
                                    <p className='font-bold text-slate-800'>
                                      {t('quality.timing')}
                                    </p>
                                    <p className='mt-1 font-semibold text-slate-600'>
                                      {latestDuration !== null
                                        ? `${latestDuration}ms`
                                        : '-'}
                                    </p>
                                  </div>
                                </div>
                                <div className='flex items-start gap-2 rounded-xl bg-white border border-slate-100 p-3'>
                                  <Cpu className='h-4 w-4 text-cyan-600 mt-0.5' />
                                  <div>
                                    <p className='font-bold text-slate-800'>
                                      {t('quality.details.promptVersions')}
                                    </p>
                                    <div className='mt-1 text-[10px] space-y-0.5 font-semibold text-slate-600'>
                                      {latestRun ? (
                                        Object.entries(
                                          latestRun.promptVersions,
                                        ).map(([k, v]) => (
                                          <p
                                            key={k}
                                            className='truncate max-w-[150px]'
                                          >
                                            {k}:{' '}
                                            <span className='font-normal text-slate-500'>
                                              {v}
                                            </span>
                                          </p>
                                        ))
                                      ) : (
                                        <p>-</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className='flex items-start gap-2 rounded-xl bg-white border border-slate-100 p-3'>
                                  <ShieldAlert className='h-4 w-4 text-cyan-600 mt-0.5' />
                                  <div>
                                    <p className='font-bold text-slate-800'>
                                      {t('quality.details.evidenceCoverage')}
                                    </p>
                                    <p className='mt-1 font-semibold text-slate-600'>
                                      {latestCoverage !== null
                                        ? `${latestCoverage}%`
                                        : '-'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>

          {/* HR Fixtures Table */}
          <div className='overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <table className='w-full border-collapse text-left text-sm'>
              <thead className='bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500'>
                <tr>
                  <th className='px-4 py-3'>{t('quality.table.fixture')}</th>
                  <th className='px-4 py-3 text-center'>
                    {t('quality.table.latestAvg')}
                  </th>
                  <th className='px-4 py-3 text-center'>
                    {t('quality.table.overallAvg')}
                  </th>
                  <th className='px-4 py-3 text-center'>
                    {t('quality.table.drift')}
                  </th>
                  <th className='px-4 py-3 text-center'>
                    {t('quality.table.history')}
                  </th>
                  <th className='px-4 py-3'></th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {hrFixtureStats.map(
                  ({
                    fixture,
                    history,
                    latestAvgScore,
                    latestDuration,
                    latestOrder,
                    avg,
                    spread,
                  }) => {
                    const isExpanded = expandedFixture === fixture.id;
                    return (
                      <Fragment key={fixture.id}>
                        <tr className='hover:bg-slate-50/80 transition-colors'>
                          <td className='px-4 py-3 font-semibold text-slate-900'>
                            {fixture.name}
                          </td>
                          <td className='px-4 py-3 text-center font-bold text-slate-800'>
                            {latestAvgScore !== null
                              ? latestAvgScore.toFixed(1)
                              : '-'}
                          </td>
                          <td className='px-4 py-3 text-center text-slate-600'>
                            {history.length > 0 ? avg.toFixed(1) : '-'}
                          </td>
                          <td className='px-4 py-3 text-center'>
                            <span
                              className={
                                spread >= 1.5
                                  ? 'font-bold text-rose-600'
                                  : 'text-slate-600'
                              }
                            >
                              {spread.toFixed(1)}
                            </span>
                          </td>
                          <td className='px-4 py-3 text-center flex items-center justify-center h-[45px]'>
                            <Sparkline scores={history} />
                          </td>
                          <td className='px-4 py-3 text-right'>
                            <button
                              type='button'
                              onClick={() => toggleFixtureExpand(fixture.id)}
                              className='p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors touch-target'
                            >
                              {isExpanded ? (
                                <ChevronUp className='h-4 w-4' />
                              ) : (
                                <ChevronDown className='h-4 w-4' />
                              )}
                            </button>
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr>
                            <td
                              colSpan={6}
                              className='bg-slate-50/50 px-6 py-4'
                            >
                              <div className='grid gap-4 sm:grid-cols-2 text-xs'>
                                <div className='flex items-start gap-2 rounded-xl bg-white border border-slate-100 p-3'>
                                  <Clock className='h-4 w-4 text-cyan-600 mt-0.5' />
                                  <div>
                                    <p className='font-bold text-slate-800'>
                                      {t('quality.timing')}
                                    </p>
                                    <p className='mt-1 font-semibold text-slate-600'>
                                      {latestDuration !== null
                                        ? `${latestDuration}ms`
                                        : '-'}
                                    </p>
                                  </div>
                                </div>
                                <div className='flex items-start gap-2 rounded-xl bg-white border border-slate-100 p-3'>
                                  <Sparkles className='h-4 w-4 text-cyan-600 mt-0.5' />
                                  <div>
                                    <p className='font-bold text-slate-800'>
                                      {t('quality.details.rankOrder')}
                                    </p>
                                    <p className='mt-1 font-semibold text-slate-600 truncate max-w-[300px]'>
                                      {latestOrder
                                        ? latestOrder.join(' \u2192 ')
                                        : '-'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        </section>

        {latestRun ? (
          <div className='rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600 shadow-sm flex items-center justify-between'>
            <span>
              {t('quality.lastRun')}:{' '}
              <span className='font-bold text-slate-800'>
                {new Date(latestRun.ranAt).toLocaleString()}
              </span>
            </span>
            <span className='rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800 uppercase tracking-wider'>
              {latestRun.provider} · {latestRun.model}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  warning = false,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  warning?: boolean;
}) {
  return (
    <article className='rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col justify-between h-24'>
      <p className='flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500'>
        {icon}
        {label}
      </p>
      <p
        className={[
          'text-2xl font-black',
          warning ? 'text-rose-600' : 'text-slate-950',
        ].join(' ')}
      >
        {value}
      </p>
    </article>
  );
}

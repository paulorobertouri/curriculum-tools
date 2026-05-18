import { AlertTriangle, FlaskConical, Loader2, Play, TrendingUp } from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';

import { AiConfig } from '@/domain/aiTypes';
import { candidateFixtures, hrFixtures } from '@/domain/evaluationFixtures';
import { PROMPT_VERSIONS } from '@/prompts/promptVersions';
import { getProviderAdapter } from '@/providers';
import {
  EvaluationRun,
  readEvaluationRuns,
  saveEvaluationRuns,
} from '@/storage/evaluationHarnessStorage';

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

export function QualityHarness({ config }: QualityHarnessProps) {
  const [runs, setRuns] = useState<EvaluationRun[]>(() => readEvaluationRuns());
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latestRun = runs[runs.length - 1] ?? null;
  const previousRun = runs.length > 1 ? runs[runs.length - 2] : null;

  const driftAcrossModels = useMemo(() => {
    const sameFixtureRuns = runs.filter(run => run.provider === config.provider);

    return candidateFixtures.map(fixture => {
      const scores = sameFixtureRuns
        .map(run => run.candidateRuns.find(item => item.fixtureId === fixture.id)?.score)
        .filter((value): value is number => typeof value === 'number');

      if (scores.length === 0) {
        return {
          fixtureId: fixture.id,
          fixtureName: fixture.name,
          spread: 0,
        };
      }

      return {
        fixtureId: fixture.id,
        fixtureName: fixture.name,
        spread: Number((Math.max(...scores) - Math.min(...scores)).toFixed(1)),
      };
    });
  }, [config.provider, runs]);

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
          const previous = previousRun.hrRuns.find(item => item.fixtureId === run.fixtureId);
          if (!previous) {
            return sum;
          }

          return sum + rankSwapCount(previous.candidateOrder, run.candidateOrder);
        }, 0)
      : 0;

  const runHarness = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const adapter = getProviderAdapter(config.provider);

      const candidateRuns = [] as EvaluationRun['candidateRuns'];
      for (const fixture of candidateFixtures) {
        const review = await adapter.reviewCandidateCv(config, fixture.input);
        candidateRuns.push({ fixtureId: fixture.id, score: review.score });
      }

      const hrRuns = [] as EvaluationRun['hrRuns'];
      for (const fixture of hrFixtures) {
        const ranking = await adapter.rankHrCvs(config, fixture.input);
        hrRuns.push({
          fixtureId: fixture.id,
          candidateOrder: ranking.candidates.map(candidate => candidate.id),
          averageScore: average(ranking.candidates.map(candidate => candidate.score)),
        });
      }

      const run: EvaluationRun = {
        id: crypto.randomUUID(),
        provider: config.provider,
        model: config.model,
        promptVersions: { ...PROMPT_VERSIONS },
        ranAt: new Date().toISOString(),
        candidateRuns,
        hrRuns,
      };

      const nextRuns = [...runs, run].slice(-30);
      setRuns(nextRuns);
      saveEvaluationRuns(nextRuns);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Harness run failed.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className='tool-panel mt-6' aria-live='polite'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <p className='eyebrow'>Quality</p>
          <h2 className='panel-title'>Evaluation Harness</h2>
        </div>
        <button className='primary-button' type='button' onClick={runHarness} disabled={isRunning}>
          {isRunning ? <Loader2 className='h-4 w-4 animate-spin' /> : <Play className='h-4 w-4' />}
          {isRunning ? 'Running fixtures' : 'Run fixture pack'}
        </button>
      </div>

      {error ? <p className='error-message'>{error}</p> : null}

      <div className='grid gap-3 md:grid-cols-3'>
        <StatCard label='Runs stored' value={String(runs.length)} icon={<FlaskConical className='h-4 w-4' />} />
        <StatCard
          label='Candidate avg delta'
          value={`${(latestCandidateAverage - previousCandidateAverage).toFixed(1)}`}
          icon={<TrendingUp className='h-4 w-4' />}
        />
        <StatCard
          label='HR rank swaps'
          value={String(latestRankSwaps)}
          icon={<AlertTriangle className='h-4 w-4' />}
          warning={latestRankSwaps > 1}
        />
      </div>

      <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-sm font-bold text-slate-900'>Prompt quality deltas</h3>
        <p className='mt-2 text-sm text-slate-700'>
          Candidate avg: {previousCandidateAverage.toFixed(1)} &rarr; {latestCandidateAverage.toFixed(1)}
        </p>
        <p className='text-sm text-slate-700'>
          HR avg: {previousHrAverage.toFixed(1)} &rarr; {latestHrAverage.toFixed(1)}
        </p>
      </div>

      <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-sm font-bold text-slate-900'>Score drift monitor</h3>
        <ul className='mt-2 space-y-1 text-sm text-slate-700'>
          {driftAcrossModels.map(item => (
            <li key={item.fixtureId}>
              {item.fixtureName}: spread {item.spread.toFixed(1)}
              {item.spread >= 1.5 ? ' (warning)' : ''}
            </li>
          ))}
        </ul>
      </div>

      {latestRun ? (
        <div className='rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700'>
          Last run: {new Date(latestRun.ranAt).toLocaleString()} · {latestRun.provider} · {latestRun.model}
        </div>
      ) : null}
    </section>
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
    <article className='rounded-2xl border border-slate-200 bg-white p-3 shadow-sm'>
      <p className='flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600'>
        {icon}
        {label}
      </p>
      <p className={[
        'mt-2 text-lg font-black',
        warning ? 'text-amber-700' : 'text-slate-950',
      ].join(' ')}>
        {value}
      </p>
    </article>
  );
}

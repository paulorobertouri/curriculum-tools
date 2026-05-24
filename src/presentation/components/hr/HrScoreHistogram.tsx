/**
 * Horizontal bar histogram showing score distribution across buckets.
 */
import { useMemo } from 'react';

import { HrRankingResult } from '@/domain/aiTypes';
import { buildHrPipelineMetrics } from '@/domain/hrPipelineMetrics';
import { useI18n } from '@/infrastructure/i18n/i18n';

type HrScoreHistogramProps = {
  result: HrRankingResult;
};

const BUCKET_COLORS = [
  'bg-rose-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-cyan-500',
  'bg-emerald-500',
];

export function HrScoreHistogram({ result }: HrScoreHistogramProps) {
  const { t } = useI18n();
  const metrics = useMemo(() => buildHrPipelineMetrics(result), [result]);
  const maxCount = Math.max(...metrics.scoreDistribution.map(b => b.count), 1);

  return (
    <section className='rounded-3xl border border-slate-200 bg-slate-50 p-3 shadow-sm'>
      <p className='text-sm font-bold text-slate-900'>
        {t('hr.pipeline.scoreDistribution')}
      </p>
      <div className='mt-2 space-y-2'>
        {metrics.scoreDistribution.map((bucket, index) => {
          const percentage = (bucket.count / maxCount) * 100;

          return (
            <div key={bucket.label} className='flex items-center gap-2'>
              <span className='w-10 text-right text-xs font-semibold text-slate-600'>
                {bucket.label}
              </span>
              <div className='flex-1'>
                <div className='h-5 rounded-md bg-slate-200'>
                  <div
                    className={`h-5 rounded-md transition-all duration-500 ${BUCKET_COLORS[index]}`}
                    style={{
                      width:
                        bucket.count > 0 ? `${Math.max(percentage, 8)}%` : '0%',
                    }}
                  />
                </div>
              </div>
              <span className='w-8 text-right text-xs font-black text-slate-800'>
                {bucket.count}
              </span>
            </div>
          );
        })}
      </div>
      <div className='mt-2 flex items-center justify-between text-xs text-slate-500'>
        <span>
          {t('hr.pipeline.shortlistEfficiency')}: {metrics.shortlistEfficiency}%
        </span>
        <span>
          {t('hr.pipeline.strengthDiversity')}: {metrics.strengthDiversity}
        </span>
      </div>
    </section>
  );
}

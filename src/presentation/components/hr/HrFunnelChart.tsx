/**
 * Visual funnel chart showing interview recommendation breakdown
 * with cumulative pass-through rates.
 */
import { useMemo } from 'react';

import { HrRankingResult, InterviewRecommendation } from '@/domain/aiTypes';
import { buildHrPipelineMetrics } from '@/domain/hrPipelineMetrics';
import { useI18n } from '@/infrastructure/i18n/i18n';

type HrFunnelChartProps = {
  result: HrRankingResult;
};

const FUNNEL_COLORS: Record<InterviewRecommendation, string> = {
  strong_yes: 'bg-emerald-500',
  yes: 'bg-cyan-500',
  maybe: 'bg-amber-500',
  no: 'bg-rose-500',
};

const FUNNEL_BG: Record<InterviewRecommendation, string> = {
  strong_yes: 'border-emerald-200 bg-emerald-50',
  yes: 'border-cyan-200 bg-cyan-50',
  maybe: 'border-amber-200 bg-amber-50',
  no: 'border-rose-200 bg-rose-50',
};

export function HrFunnelChart({ result }: HrFunnelChartProps) {
  const { t } = useI18n();
  const metrics = useMemo(() => buildHrPipelineMetrics(result), [result]);
  const total = result.candidates.length || 1;

  return (
    <section className='rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm'>
      <p className='text-sm font-bold text-slate-900'>
        {t('hr.pipeline.interviewFunnel')}
      </p>

      <div className='mt-4 space-y-2'>
        {metrics.interviewFunnel.map(stage => {
          const width = (stage.count / total) * 100;

          return (
            <div
              key={stage.recommendation}
              className={`rounded-xl border p-3 ${FUNNEL_BG[stage.recommendation]}`}
            >
              <div className='flex items-center justify-between'>
                <span className='text-sm font-bold text-slate-900'>
                  {t(`hr.recommendation.${stage.recommendation}`)}
                </span>
                <div className='flex items-center gap-3 text-xs font-semibold text-slate-600'>
                  <span>
                    {stage.count} {t('hr.pipeline.candidates')}
                  </span>
                  <span className='rounded-full bg-white px-2 py-0.5 text-xs font-black text-slate-800'>
                    {stage.cumulativeRate}% {t('hr.pipeline.cumulative')}
                  </span>
                </div>
              </div>
              <div className='mt-2 h-2 rounded-full bg-white/60'>
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${FUNNEL_COLORS[stage.recommendation]}`}
                  style={{
                    width: stage.count > 0 ? `${Math.max(width, 5)}%` : '0%',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Top concerns */}
      {metrics.topConcerns.length > 0 ? (
        <div className='mt-2'>
          <p className='text-xs font-bold uppercase tracking-wide text-slate-500'>
            {t('hr.pipeline.topConcerns')}
          </p>
          <div className='mt-2 flex flex-wrap gap-1.5'>
            {metrics.topConcerns.slice(0, 8).map(item => (
              <span
                key={item.keyword}
                className='inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700'
              >
                {item.keyword}
                <span className='rounded-full bg-slate-100 px-1.5 text-[10px] font-black text-slate-600'>
                  {item.count}
                </span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

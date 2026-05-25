import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useMemo } from 'react';

import { RankedCandidate } from '@/common/core/aiTypes';
import { buildHrCandidateQualitySummary } from '@/common/core/reviewQuality';
import { useI18n } from '@/common/i18n/i18n';

export type ComparedCandidate = {
  candidate: RankedCandidate;
  cvText: string;
};

export function CandidateComparisonMatrix({
  candidates,
  onClose,
}: {
  candidates: ComparedCandidate[];
  onClose: () => void;
}) {
  const { t } = useI18n();

  // 1. Process candidate evaluation summaries
  const processed = useMemo(() => {
    return candidates.map(c => {
      const claims = [
        c.candidate.justification,
        ...c.candidate.strengths,
        ...c.candidate.concerns,
      ];
      const quality = buildHrCandidateQualitySummary(c.cvText, claims);

      // Derive dimensions for SVG radar chart plotting (each scaled to 0-10)
      const fit = c.candidate.score;
      const completeness = Math.min(
        10,
        (c.candidate.justification ? 2 : 0) +
          c.candidate.strengths.length * 1.5 +
          c.candidate.concerns.length * 1.5,
      );
      const safety = quality.confidenceScore / 10;
      const interview = Math.min(
        10,
        c.candidate.interviewQuestions.length * 2.5,
      );

      return {
        ...c,
        quality,
        dimensions: { fit, completeness, safety, interview },
      };
    });
  }, [candidates]);

  // Colors for candidates
  const colors = [
    {
      text: 'text-cyan-600',
      fill: 'rgba(8, 145, 178, 0.15)',
      stroke: '#0891b2',
      bg: 'bg-cyan-600',
    },
    {
      text: 'text-emerald-600',
      fill: 'rgba(5, 150, 105, 0.15)',
      stroke: '#059669',
      bg: 'bg-emerald-600',
    },
    {
      text: 'text-amber-600',
      fill: 'rgba(217, 119, 6, 0.15)',
      stroke: '#d97706',
      bg: 'bg-amber-600',
    },
  ];

  // SVG Radar grid dimensions
  const center = 100;
  const radius = 70;

  // Convert dimension score to SVG absolute coordinates
  const getCoordinates = (scores: {
    fit: number;
    completeness: number;
    safety: number;
    interview: number;
  }) => {
    const scale = (score: number) => (score / 10) * radius;
    return [
      { x: center, y: center - scale(scores.fit) }, // 0 deg - Up
      { x: center + scale(scores.completeness), y: center }, // 90 deg - Right
      { x: center, y: center + scale(scores.safety) }, // 180 deg - Down
      { x: center - scale(scores.interview), y: center }, // 270 deg - Left
    ];
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-xs'>
      <div className='w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl space-y-2 max-h-[90vh] overflow-y-auto animate-fade-in relative'>
        {/* Header Close Panel */}
        <div className='flex items-center justify-between border-b border-slate-100 pb-2'>
          <div>
            <span className='eyebrow'>{t('hr.matrix.eyebrow')}</span>
            <h3 className='text-xl font-bold text-slate-950 flex items-center gap-2'>
              {t('hr.matrix.title')}
            </h3>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-950 transition-colors touch-target'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        <div className='grid gap-6 lg:grid-cols-3'>
          {/* SVG Comparative Radar Graphic */}
          <div className='rounded-2xl border border-slate-200 p-5 space-y-4 flex flex-col justify-between items-center bg-slate-50/30'>
            <span className='block text-xs font-bold text-slate-700 uppercase tracking-wider text-center'>
              {t('hr.matrix.overlaps')}
            </span>

            {/* Pure SVG Radar Chart */}
            <svg viewBox='0 0 200 200' className='h-[160px] w-[160px]'>
              {/* Concentric grid lines */}
              {[0.25, 0.5, 0.75, 1].map((r, i) => (
                <polygon
                  key={i}
                  points={`${center},${center - radius * r} ${center + radius * r},${center} ${center},${center + radius * r} ${center - radius * r},${center}`}
                  fill='none'
                  stroke='#e2e8f0'
                  strokeWidth='0.8'
                />
              ))}

              {/* Axis lines */}
              <line
                x1={center}
                y1={center - radius}
                x2={center}
                y2={center + radius}
                stroke='#cbd5e1'
                strokeWidth='0.8'
              />
              <line
                x1={center - radius}
                y1={center}
                x2={center + radius}
                y2={center}
                stroke='#cbd5e1'
                strokeWidth='0.8'
              />

              {/* Dimension Labels */}
              <text
                x={center}
                y={center - radius - 4}
                textAnchor='middle'
                fontSize='8'
                fontWeight='bold'
                fill='#475569'
              >
                {t('scorecard.fit').toUpperCase()}
              </text>
              <text
                x={center + radius + 4}
                y={center + 3}
                textAnchor='start'
                fontSize='8'
                fontWeight='bold'
                fill='#475569'
              >
                {t('scorecard.completeness').toUpperCase().slice(0, 5)}
              </text>
              <text
                x={center}
                y={center + radius + 10}
                textAnchor='middle'
                fontSize='8'
                fontWeight='bold'
                fill='#475569'
              >
                {t('scorecard.risk').toUpperCase().slice(0, 4)}
              </text>
              <text
                x={center - radius - 4}
                y={center + 3}
                textAnchor='end'
                fontSize='8'
                fontWeight='bold'
                fill='#475569'
              >
                {t('scorecard.interviewReadiness').toUpperCase().slice(0, 4)}
              </text>

              {/* Plotted Candidate Polygons */}
              {processed.map((c, index) => {
                const color = colors[index % colors.length];
                const coords = getCoordinates(c.dimensions);
                const points = coords.map(p => `${p.x},${p.y}`).join(' ');

                return (
                  <polygon
                    key={c.candidate.id}
                    points={points}
                    fill={color.fill}
                    stroke={color.stroke}
                    strokeWidth='2'
                  />
                );
              })}
            </svg>

            {/* Radar Legend */}
            <div className='flex flex-wrap justify-center gap-3 text-xs font-bold'>
              {processed.map((c, index) => {
                const color = colors[index % colors.length];
                const name = c.candidate.detectedName ?? c.candidate.filename;
                return (
                  <div
                    key={c.candidate.id}
                    className='flex items-center gap-1.5'
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${color.bg}`} />
                    <span className='text-slate-800 truncate max-w-[80px]'>
                      {name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Core comparative detail tables */}
          <div className='lg:col-span-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white'>
            <table className='w-full border-collapse text-left text-xs'>
              <thead className='bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500'>
                <tr>
                  <th className='px-4 py-3'>{t('hr.matrix.metrics')}</th>
                  {processed.map((c, index) => {
                    const color = colors[index % colors.length];
                    const name =
                      c.candidate.detectedName ?? c.candidate.filename;
                    return (
                      <th
                        key={c.candidate.id}
                        className={`px-4 py-3 ${color.text}`}
                      >
                        {name}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100 font-semibold text-slate-800'>
                <tr>
                  <td className='px-4 py-3 font-bold text-slate-900'>
                    {t('hr.matrix.fitScore')}
                  </td>
                  {processed.map(c => (
                    <td
                      key={c.candidate.id}
                      className='px-4 py-3 text-sm font-black'
                    >
                      {c.candidate.score.toFixed(1)}/10
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className='px-4 py-3 font-bold text-slate-900'>
                    {t('hr.recommendation')}
                  </td>
                  {processed.map(c => (
                    <td key={c.candidate.id} className='px-4 py-3 capitalize'>
                      {t(
                        `hr.recommendation.${c.candidate.interviewRecommendation}`,
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className='px-4 py-3 font-bold text-slate-900'>
                    {t('hr.matrix.confidence')}
                  </td>
                  {processed.map(c => (
                    <td key={c.candidate.id} className='px-4 py-3'>
                      {c.quality.confidenceScore}%
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className='px-4 py-3 font-bold text-slate-900'>
                    {t('hr.matrix.readiness')}
                  </td>
                  {processed.map(c => (
                    <td key={c.candidate.id} className='px-4 py-3'>
                      {t('hr.matrix.readinessValue', {
                        count: c.candidate.interviewQuestions.length,
                      })}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed CV content insights comparisons */}
        <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3 pt-2 border-t border-slate-100'>
          {processed.map((c, index) => {
            const color = colors[index % colors.length];
            const name = c.candidate.detectedName ?? c.candidate.filename;
            return (
              <div
                key={c.candidate.id}
                className='rounded-2xl border border-slate-200 p-3 space-y-2'
              >
                {/* Header card badge */}
                <div className='flex items-center gap-2'>
                  <span className={`h-3 w-3 rounded-full ${color.bg}`} />
                  <span className='text-sm font-bold text-slate-950 truncate'>
                    {name}
                  </span>
                </div>

                {/* Key Strengths list */}
                <div className='space-y-1.5'>
                  <span className='text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1'>
                    <CheckCircle2 className='h-3.5 w-3.5 text-emerald-600' />
                    {t('candidate.list.strengths')}
                  </span>
                  <ul className='space-y-1 text-xs text-slate-600 font-medium pl-4 list-disc'>
                    {c.candidate.strengths.slice(0, 3).map((item, i) => (
                      <li key={i} className='truncate max-w-[240px]'>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Major Gaps list */}
                <div className='space-y-1.5'>
                  <span className='text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1'>
                    <AlertTriangle className='h-3.5 w-3.5 text-amber-600' />
                    {t('candidate.list.concerns')}
                  </span>
                  <ul className='space-y-1 text-xs text-slate-600 font-medium pl-4 list-disc'>
                    {c.candidate.concerns.slice(0, 3).map((item, i) => (
                      <li key={i} className='truncate max-w-[240px]'>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Coverage claims warnings */}
                {c.quality.unsupportedClaims.length > 0 && (
                  <div className='rounded-xl border border-rose-100 bg-rose-50/50 p-2.5 text-[10px] font-medium text-rose-800 leading-normal flex items-start gap-1.5'>
                    <AlertTriangle className='h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5' />
                    <div>
                      <p className='font-bold text-rose-950'>
                        {t('hr.matrix.unsupportedTitle')}
                      </p>
                      <p className='mt-0.5'>
                        {t('hr.matrix.unsupportedDescription', {
                          count: c.quality.unsupportedClaims.length,
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

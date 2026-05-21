/**
 * Visual radar/spider chart scorecard for candidate review results.
 * Uses pure SVG rendering — no charting library needed.
 */
import { useMemo } from 'react';

import { CandidateReview } from '@/domain/aiTypes';
import {
  CandidateScorecard as ScorecardData,
  buildCandidateScorecard,
} from '@/domain/candidateScorecard';
import { CandidateQualitySummary } from '@/domain/reviewQuality';
import { SkillGapResult } from '@/domain/skillGapAnalysis';
import { useI18n } from '@/i18n/i18n';

type CandidateScorecardProps = {
  review: CandidateReview;
  quality: CandidateQualitySummary;
  skillGap: SkillGapResult;
};

const GRADE_COLORS: Record<string, string> = {
  'A+': 'bg-emerald-600',
  A: 'bg-emerald-600',
  'A-': 'bg-emerald-500',
  'B+': 'bg-cyan-600',
  B: 'bg-cyan-600',
  'B-': 'bg-cyan-500',
  'C+': 'bg-amber-500',
  C: 'bg-amber-500',
  'C-': 'bg-amber-600',
  D: 'bg-rose-500',
  F: 'bg-rose-600',
};

export function CandidateScorecard({
  review,
  quality,
  skillGap,
}: CandidateScorecardProps) {
  const { t } = useI18n();
  const scorecard = useMemo(
    () => buildCandidateScorecard(review, quality, skillGap),
    [review, quality, skillGap],
  );

  const dimensions = [
    {
      label: t('scorecard.fit'),
      value: scorecard.fitScore,
      description: t('scorecard.fitDescription'),
    },
    {
      label: t('scorecard.completeness'),
      value: scorecard.completenessScore,
      description: t('scorecard.completenessDescription'),
    },
    {
      label: t('scorecard.risk'),
      value: 100 - scorecard.riskScore,
      description: t('scorecard.riskDescription'),
    },
    {
      label: t('scorecard.interviewReadiness'),
      value: scorecard.interviewReadinessScore,
      description: t('scorecard.interviewReadinessDescription'),
    },
  ];

  return (
    <section className='rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3 shadow-sm'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-xs font-bold uppercase tracking-wide text-slate-500'>
            {t('scorecard.title')}
          </p>
          <h3 className='mt-1 text-lg font-black text-slate-950'>
            {t('scorecard.subtitle')}
          </h3>
        </div>
        <GradeBadge grade={scorecard.overallGrade} />
      </div>

      <div className='mt-2 flex flex-col items-center gap-2 lg:flex-row'>
        <RadarChart dimensions={dimensions} />
        <div className='flex-1 space-y-2'>
          {dimensions.map(dimension => (
            <DimensionRow
              key={dimension.label}
              label={dimension.label}
              value={dimension.value}
              description={dimension.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function GradeBadge({ grade }: { grade: ScorecardData['overallGrade'] }) {
  const bgColor = GRADE_COLORS[grade] ?? 'bg-slate-500';
  return (
    <div
      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${bgColor} shadow-md`}
    >
      <span className='text-xl font-black text-white'>{grade}</span>
    </div>
  );
}

function DimensionRow({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  const barColor =
    value >= 75
      ? 'bg-emerald-500'
      : value >= 50
        ? 'bg-cyan-500'
        : value >= 30
          ? 'bg-amber-500'
          : 'bg-rose-500';

  return (
    <div className='rounded-xl border border-slate-200 bg-white px-3 py-2'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-bold text-slate-900'>{label}</span>
        <span className='text-sm font-black text-slate-950'>{value}/100</span>
      </div>
      <div className='mt-1.5 h-1.5 rounded-full bg-slate-200'>
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className='mt-1 text-xs text-slate-500'>{description}</p>
    </div>
  );
}

// Pure SVG radar chart
function RadarChart({
  dimensions,
}: {
  dimensions: Array<{ label: string; value: number }>;
}) {
  const size = 200;
  const center = size / 2;
  const maxRadius = 80;
  const levels = 4;
  const count = dimensions.length;
  const angleStep = (2 * Math.PI) / count;

  const getPoint = (index: number, radius: number) => {
    const angle = angleStep * index - Math.PI / 2;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  const gridLevels = Array.from({ length: levels }, (_, i) => {
    const radius = ((i + 1) / levels) * maxRadius;
    const points = Array.from({ length: count }, (_, j) => {
      const p = getPoint(j, radius);
      return `${p.x},${p.y}`;
    }).join(' ');
    return points;
  });

  const dataPoints = dimensions.map((d, i) => {
    const radius = (d.value / 100) * maxRadius;
    return getPoint(i, radius);
  });

  const dataPath = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className='flex-shrink-0'>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className='drop-shadow-sm'
      >
        {/* Grid levels */}
        {gridLevels.map((points, i) => (
          <polygon
            key={`grid-${i}`}
            points={points}
            fill='none'
            stroke='#e2e8f0'
            strokeWidth='1'
          />
        ))}

        {/* Axis lines */}
        {dimensions.map((_, i) => {
          const p = getPoint(i, maxRadius);
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke='#e2e8f0'
              strokeWidth='1'
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={dataPath}
          fill='rgba(6, 182, 212, 0.15)'
          stroke='#0891b2'
          strokeWidth='2'
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={`point-${i}`}
            cx={p.x}
            cy={p.y}
            r='4'
            fill='#0891b2'
            stroke='white'
            strokeWidth='2'
          />
        ))}

        {/* Labels */}
        {dimensions.map((d, i) => {
          const p = getPoint(i, maxRadius + 18);
          return (
            <text
              key={`label-${i}`}
              x={p.x}
              y={p.y}
              textAnchor='middle'
              dominantBaseline='middle'
              className='fill-slate-600 text-[10px] font-semibold'
            >
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

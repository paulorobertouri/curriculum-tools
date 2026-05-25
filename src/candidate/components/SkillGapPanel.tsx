/**
 * Panel showing the skill gap analysis between job description and CV.
 * Renders matched, missing, and bonus skills with visual indicators.
 */
import { useMemo } from 'react';

import {
  SkillGapResult,
  analyzeSkillGap,
} from '@/common/core/skillGapAnalysis';
import { useI18n } from '@/common/i18n/i18n';

type SkillGapPanelProps = {
  jobDescription: string;
  cvText: string;
};

export function SkillGapPanel({ jobDescription, cvText }: SkillGapPanelProps) {
  const { t } = useI18n();
  const skillGap = useMemo(
    () => analyzeSkillGap(jobDescription, cvText),
    [jobDescription, cvText],
  );

  if (
    skillGap.matchedSkills.length === 0 &&
    skillGap.missingSkills.length === 0
  ) {
    return null;
  }

  return (
    <section className='rounded-3xl border border-slate-200 bg-slate-50 p-3 shadow-sm'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-xs font-bold uppercase tracking-wide text-slate-500'>
            {t('skillGap.title')}
          </p>
          <h3 className='mt-1 text-lg font-black text-slate-950'>
            {t('skillGap.subtitle')}
          </h3>
        </div>
        <MatchRateBadge rate={skillGap.keywordMatchRate} />
      </div>

      {/* Match rate bar */}
      <div className='mt-2'>
        <div className='flex items-center justify-between text-xs font-semibold text-slate-700'>
          <span>{t('skillGap.matchRate')}</span>
          <span>{skillGap.keywordMatchRate}%</span>
        </div>
        <div className='mt-1 h-2 rounded-full bg-slate-200'>
          <div
            className='h-2 rounded-full bg-cyan-600 transition-all duration-500'
            style={{ width: `${skillGap.keywordMatchRate}%` }}
          />
        </div>
      </div>

      <div className='mt-2 grid gap-2 md:grid-cols-2'>
        {/* Matched skills */}
        {skillGap.matchedSkills.length > 0 ? (
          <div>
            <p className='text-sm font-bold text-emerald-800'>
              ✓ {t('skillGap.matched')} ({skillGap.matchedSkills.length})
            </p>
            <div className='mt-2 flex flex-wrap gap-1.5'>
              {skillGap.matchedSkills.map(skill => (
                <SkillTag
                  key={skill.keyword}
                  keyword={skill.keyword}
                  category={skill.category}
                  variant='matched'
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* Missing skills */}
        {skillGap.missingSkills.length > 0 ? (
          <div>
            <p className='text-sm font-bold text-amber-800'>
              ✗ {t('skillGap.missing')} ({skillGap.missingSkills.length})
            </p>
            <div className='mt-2 flex flex-wrap gap-1.5'>
              {skillGap.missingSkills.map(skill => (
                <SkillTag
                  key={skill.keyword}
                  keyword={skill.keyword}
                  category={skill.category}
                  variant='missing'
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Bonus skills */}
      {skillGap.bonusSkills.length > 0 ? (
        <div className='mt-4'>
          <p className='text-sm font-bold text-slate-700'>
            ★ {t('skillGap.bonus')} ({skillGap.bonusSkills.length})
          </p>
          <div className='mt-2 flex flex-wrap gap-1.5'>
            {skillGap.bonusSkills.map(skill => (
              <SkillTag
                key={skill.keyword}
                keyword={skill.keyword}
                category={skill.category}
                variant='bonus'
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Category breakdown */}
      <CategoryBreakdown skillGap={skillGap} />
    </section>
  );
}

function MatchRateBadge({ rate }: { rate: number }) {
  const bgColor =
    rate >= 70
      ? 'bg-emerald-100 text-emerald-800'
      : rate >= 40
        ? 'bg-amber-100 text-amber-800'
        : 'bg-rose-100 text-rose-800';

  return (
    <div className={`rounded-xl px-3 py-1.5 text-sm font-black ${bgColor}`}>
      {rate}%
    </div>
  );
}

function SkillTag({
  keyword,
  category,
  variant,
}: {
  keyword: string;
  category: string;
  variant: 'matched' | 'missing' | 'bonus';
}) {
  const variantClasses = {
    matched: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    missing: 'border-amber-200 bg-amber-50 text-amber-800',
    bonus: 'border-slate-200 bg-white text-slate-700',
  };

  const categoryBadge =
    category === 'technical' ? '⚙' : category === 'soft' ? '💬' : '';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold ${variantClasses[variant]}`}
    >
      {categoryBadge ? (
        <span className='text-[10px]'>{categoryBadge}</span>
      ) : null}
      {keyword}
    </span>
  );
}

function CategoryBreakdown({ skillGap }: { skillGap: SkillGapResult }) {
  const { t } = useI18n();
  const categories = ['technical', 'soft'] as const;

  const hasData = categories.some(
    cat =>
      skillGap.categoryBreakdown[cat].matched > 0 ||
      skillGap.categoryBreakdown[cat].missing > 0,
  );

  if (!hasData) {
    return null;
  }

  return (
    <details className='mt-2 rounded-xl border border-slate-200 bg-white p-3'>
      <summary className='cursor-pointer text-sm font-bold text-slate-900'>
        {t('skillGap.categoryBreakdown')}
      </summary>
      <div className='mt-2 grid gap-2 sm:grid-cols-2'>
        {categories.map(cat => {
          const data = skillGap.categoryBreakdown[cat];
          const total = data.matched + data.missing;
          if (total === 0) return null;

          return (
            <div
              key={cat}
              className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-2'
            >
              <p className='text-xs font-bold uppercase tracking-wide text-slate-600'>
                {cat === 'technical'
                  ? t('skillGap.technical')
                  : t('skillGap.soft')}
              </p>
              <p className='mt-1 text-sm text-slate-700'>
                <span className='font-bold text-emerald-700'>
                  {data.matched}
                </span>{' '}
                {t('skillGap.matched').toLowerCase()} ·{' '}
                <span className='font-bold text-amber-700'>{data.missing}</span>{' '}
                {t('skillGap.missing').toLowerCase()}
              </p>
            </div>
          );
        })}
      </div>
    </details>
  );
}

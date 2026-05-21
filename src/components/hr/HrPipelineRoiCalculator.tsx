import {
  DollarSign,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { useI18n } from '@/i18n/i18n';

export function HrPipelineRoiCalculator() {
  const { t } = useI18n();

  // Calculator Params State
  const [openRoles, setOpenRoles] = useState(15);
  const [candidatesPerRole, setCandidatesPerRole] = useState(60);
  const [hrHourlyRate, setHrHourlyRate] = useState(40);
  const [manualReviewTime, setManualReviewTime] = useState(15); // in minutes
  const [assessmentLicensing, setAssessmentLicensing] = useState(120); // per role

  const stats = useMemo(() => {
    const totalScreened = openRoles * candidatesPerRole;

    // Traditional Manual Costs
    const manualHours = (totalScreened * manualReviewTime) / 60;
    const traditionalReviewCost = manualHours * hrHourlyRate;
    const traditionalAssessmentCost = openRoles * assessmentLicensing;
    const totalTraditionalCost =
      traditionalReviewCost + traditionalAssessmentCost;

    // Automated Pipeline Costs (curriculum-tools AI workflow)
    // - Assumes 1 minute per candidate for HR to read the generated scorecards
    const autoHours = (totalScreened * 1.5) / 60;
    const autoReviewCost = autoHours * hrHourlyRate;
    const autoApiCost = totalScreened * 0.08; // $0.08 avg token cost per evaluation
    const totalAutoCost = autoReviewCost + autoApiCost;

    // Financial impacts
    const dollarSavings = Math.round(totalTraditionalCost - totalAutoCost);
    const costReductionRate =
      totalTraditionalCost > 0
        ? Math.round((dollarSavings / totalTraditionalCost) * 100)
        : 0;

    const timeSavedHours = Math.round(manualHours - autoHours);

    return {
      totalScreened,
      manualHours: Math.round(manualHours),
      autoHours: Math.round(autoHours),
      totalTraditionalCost: Math.round(totalTraditionalCost),
      totalAutoCost: Math.round(totalAutoCost),
      dollarSavings,
      costReductionRate,
      timeSavedHours,
    };
  }, [
    openRoles,
    candidatesPerRole,
    hrHourlyRate,
    manualReviewTime,
    assessmentLicensing,
  ]);

  // SVG bar graphic dimensions
  const maxCost = Math.max(
    stats.totalTraditionalCost,
    stats.totalAutoCost,
    1000,
  );
  const traditionalHeight = (stats.totalTraditionalCost / maxCost) * 160;
  const autoHeight = (stats.totalAutoCost / maxCost) * 160;

  return (
    <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='eyebrow'>{t('hr.roi.title')}</p>
          <h3 className='text-lg font-bold text-slate-950'>
            {t('hr.roi.subtitle')}
          </h3>
          <p className='text-xs leading-5 text-slate-600 mt-1'>
            {t('hr.roi.description')}
          </p>
        </div>
        <div className='rounded-full bg-cyan-100 text-cyan-800 text-xs px-3.5 py-1 font-bold flex items-center gap-1 self-start sm:self-center'>
          <ShieldCheck className='h-4 w-4' /> {t('hr.roi.badge')}
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-3'>
        {/* Left Inputs Controls */}
        <div className='space-y-4 md:col-span-2'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <label className='text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between'>
                <span>{t('hr.roi.openRoles')}</span>
                <span className='text-cyan-600 font-extrabold'>
                  {openRoles}
                </span>
              </label>
              <input
                type='range'
                min={1}
                max={100}
                value={openRoles}
                onChange={e => setOpenRoles(Number(e.target.value))}
                className='w-full accent-cyan-600 h-1.5 rounded-lg bg-slate-100 cursor-pointer'
              />
            </div>

            <div className='space-y-1.5'>
              <label className='text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between'>
                <span>{t('hr.roi.candidatesPerRole')}</span>
                <span className='text-cyan-600 font-extrabold'>
                  {candidatesPerRole}
                </span>
              </label>
              <input
                type='range'
                min={10}
                max={500}
                value={candidatesPerRole}
                onChange={e => setCandidatesPerRole(Number(e.target.value))}
                className='w-full accent-cyan-600 h-1.5 rounded-lg bg-slate-100 cursor-pointer'
              />
            </div>

            <div className='space-y-1.5'>
              <label className='text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between'>
                <span>{t('hr.roi.hourlyRate')}</span>
                <span className='text-cyan-600 font-extrabold'>
                  ${hrHourlyRate}/hr
                </span>
              </label>
              <input
                type='range'
                min={15}
                max={200}
                value={hrHourlyRate}
                onChange={e => setHrHourlyRate(Number(e.target.value))}
                className='w-full accent-cyan-600 h-1.5 rounded-lg bg-slate-100 cursor-pointer'
              />
            </div>

            <div className='space-y-1.5'>
              <label className='text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between'>
                <span>{t('hr.roi.manualTime')}</span>
                <span className='text-cyan-600 font-extrabold'>
                  {manualReviewTime} min
                </span>
              </label>
              <input
                type='range'
                min={5}
                max={60}
                value={manualReviewTime}
                onChange={e => setManualReviewTime(Number(e.target.value))}
                className='w-full accent-cyan-600 h-1.5 rounded-lg bg-slate-100 cursor-pointer'
              />
            </div>
          </div>

          <div className='space-y-1.5 pt-2 border-t border-slate-100'>
            <label className='text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between'>
              <span>{t('hr.roi.assessmentCost')}</span>
              <span className='text-cyan-600 font-extrabold'>
                ${assessmentLicensing}
              </span>
            </label>
            <input
              type='range'
              min={0}
              max={1000}
              step={20}
              value={assessmentLicensing}
              onChange={e => setAssessmentLicensing(Number(e.target.value))}
              className='w-full accent-cyan-600 h-1.5 rounded-lg bg-slate-100 cursor-pointer'
            />
          </div>

          {/* Core Telemetry metrics summary */}
          <div className='grid gap-3 grid-cols-3 text-center pt-2'>
            <div className='rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 space-y-0.5'>
              <Users className='h-4 w-4 text-cyan-600 mx-auto' />
              <span className='block text-[10px] font-bold text-slate-500 uppercase tracking-wider'>
                {t('hr.roi.cvsScreened')}
              </span>
              <span className='text-sm font-extrabold text-slate-800'>
                {stats.totalScreened}
              </span>
            </div>
            <div className='rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 space-y-0.5'>
              <TrendingDown className='h-4 w-4 text-emerald-600 mx-auto' />
              <span className='block text-[10px] font-bold text-slate-500 uppercase tracking-wider'>
                {t('skillGap.categoryBreakdown')}
              </span>
              <span className='text-sm font-extrabold text-emerald-600'>
                -{stats.costReductionRate}%
              </span>
            </div>
            <div className='rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 space-y-0.5'>
              <Sparkles className='h-4 w-4 text-cyan-600 mx-auto' />
              <span className='block text-[10px] font-bold text-slate-500 uppercase tracking-wider'>
                {t('hr.roi.timeSaved')}
              </span>
              <span className='text-sm font-extrabold text-slate-800'>
                {stats.timeSavedHours}h
              </span>
            </div>
          </div>
        </div>

        {/* Right Cost Comparison Visual Graphic */}
        <div className='rounded-2xl border border-slate-200 p-5 space-y-4 flex flex-col justify-between items-center bg-slate-50/20'>
          <span className='block text-xs font-bold text-slate-700 uppercase tracking-wider text-center'>
            {t('hr.roi.costProjection')}
          </span>

          {/* SVG Visual Bars */}
          <div className='h-[180px] w-full flex items-end justify-center gap-8 relative border-b border-slate-200 pb-2 px-2'>
            {/* Traditional bar */}
            <div className='flex flex-col items-center gap-1.5 w-16'>
              <span className='text-[10px] font-bold text-slate-600'>
                ${stats.totalTraditionalCost}
              </span>
              <div
                className='w-full rounded-t-xl bg-slate-300 transition-all duration-500 shadow-xs'
                style={{ height: `${Math.max(12, traditionalHeight)}px` }}
              />
              <span className='text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mt-0.5'>
                {t('hr.roi.manual')}
              </span>
            </div>

            {/* Curriculum tools bar */}
            <div className='flex flex-col items-center gap-1.5 w-16'>
              <span className='text-[10px] font-extrabold text-cyan-600'>
                ${stats.totalAutoCost}
              </span>
              <div
                className='w-full rounded-t-xl bg-cyan-600 transition-all duration-500 shadow-sm relative overflow-hidden'
                style={{ height: `${Math.max(12, autoHeight)}px` }}
              >
                <div className='absolute inset-0 bg-gradient-to-t from-transparent to-white/10' />
              </div>
              <span className='text-[9px] font-extrabold uppercase tracking-wider text-cyan-700 mt-0.5'>
                {t('hr.roi.aiTool')}
              </span>
            </div>
          </div>

          {/* Total savings metric */}
          <div className='text-center space-y-1 w-full bg-emerald-50 border border-emerald-100 rounded-xl p-2.5'>
            <span className='block text-[9px] font-bold text-emerald-800 uppercase tracking-wider'>
              {t('hr.roi.netSavings')}
            </span>
            <div className='text-lg font-black text-emerald-600 tracking-tight flex items-center justify-center gap-0.5'>
              <DollarSign className='h-4 w-4 stroke-[3px]' />
              {stats.dollarSavings.toLocaleString()}
              <span className='text-[10px] font-semibold text-emerald-800 ml-0.5'>
                {t('hr.roi.perYear')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

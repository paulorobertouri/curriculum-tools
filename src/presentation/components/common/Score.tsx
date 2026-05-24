import { useI18n } from '@/infrastructure/i18n/i18n';

export function Score({ value }: { value: number }) {
  const { locale, t } = useI18n();
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <div className='rounded-lg border border-cyan-200 bg-cyan-50 p-3'>
      <p className='text-sm font-bold uppercase text-cyan-800'>
        {t('result.score')}
      </p>
      <p className='text-4xl font-black text-slate-950'>
        {formatter.format(value)}
      </p>
    </div>
  );
}

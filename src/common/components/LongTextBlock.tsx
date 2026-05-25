import { useI18n } from '@/common/i18n/i18n';

export function LongTextBlock({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  const { t } = useI18n();

  return (
    <div>
      <h3 className='text-sm font-bold text-slate-950'>{title}</h3>
      {text.trim().length > 0 ? (
        <pre className='mt-2 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700'>
          {text}
        </pre>
      ) : (
        <p className='mt-2 text-sm text-slate-500'>{t('result.noItems')}</p>
      )}
    </div>
  );
}

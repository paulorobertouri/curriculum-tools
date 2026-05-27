import { useI18n } from '@/common/i18n';

export function List({ title, items }: { title: string; items: string[] }) {
  const { t } = useI18n();

  return (
    <div>
      <h3 className='text-sm font-bold text-slate-950'>{title}</h3>
      {items.length > 0 ? (
        <ul className='mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700'>
          {items.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className='mt-2 text-sm text-slate-500'>{t('result.noItems')}</p>
      )}
    </div>
  );
}

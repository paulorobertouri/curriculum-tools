import { Locale, useI18n } from '@/i18n/i18n';

type LanguageSelectorProps = {
  compact?: boolean;
};

export function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { locale, setLocale, t } = useI18n();

  const localeLabels: Record<Locale, string> = {
    'en-US': t('language.option.en'),
    'pt-BR': t('language.option.pt'),
    'es-ES': t('language.option.es'),
  };

  return (
    <div className={compact ? 'inline-flex items-center gap-2' : 'space-y-2'}>
      <label
        className={compact ? 'text-xs font-bold text-slate-600' : 'field-label'}
        htmlFor='language-selector'
      >
        {t('language.label')}
      </label>
      <select
        id='language-selector'
        className={
          compact
            ? 'rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100'
            : 'text-input'
        }
        value={locale}
        onChange={event => setLocale(event.target.value as Locale)}
      >
        {Object.entries(localeLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

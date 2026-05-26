import { Locale, useI18n } from '@/common/i18n/i18n';

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
            ? 'status-button touch-target px-3 py-1.5 text-xs font-semibold'
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

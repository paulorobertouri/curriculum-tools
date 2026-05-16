import { Locale, useI18n } from '@/i18n/i18n';

const localeLabels: Record<Locale, string> = {
  'en-US': 'English (US)',
  'pt-BR': 'Portugues (Brasil)',
  'es-ES': 'Espanol (Espana)',
};

type LanguageSelectorProps = {
  compact?: boolean;
};

export function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { locale, setLocale, t } = useI18n();

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
            ? 'rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700'
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

import { useI18n } from '@/i18n/i18n';

export const GlobalErrorPage = () => {
  const { t } = useI18n();
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center'>
      <h1 className='mb-2 text-2xl font-black text-slate-950'>
        {t('app.error.title') || 'Something went wrong'}
      </h1>
      <p className='mb-6 text-slate-600'>
        {t('app.error.description') ||
          'An unexpected error occurred. Please try reloading the page.'}
      </p>
      <button
        onClick={() => window.location.reload()}
        className='rounded-full bg-slate-950 px-6 py-2 text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95'
      >
        {t('app.error.reload') || 'Reload Page'}
      </button>
    </div>
  );
};

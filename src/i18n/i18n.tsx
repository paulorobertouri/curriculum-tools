/* eslint-disable react-refresh/only-export-components */
import { ReactNode, createContext, useContext, useMemo, useState } from 'react';

export type Locale = 'en-US' | 'pt-BR' | 'es-ES';

type Dictionary = Record<string, string>;

const LOCALE_STORAGE_KEY = 'curriculum-tools.locale.v1';
const DEFAULT_LOCALE: Locale = 'en-US';

const dictionaries: Record<Locale, Dictionary> = {
  'en-US': {
    'language.label': 'Language',
    'app.kicker': 'Curriculum Tools',
    'app.title': 'AI tools for candidates and HR',
    'app.subtitle':
      'Review one CV against a role, or rank many CVs against one job description. Content is sent only when you click Process.',
    'app.tab.candidate': 'Candidate',
    'app.tab.hr': 'HR',
    'app.privacy':
      'API keys are saved in localStorage on this browser. CV content is sent from this browser to {provider} only after Process is clicked.',
    'provider.setup.badge': 'Browser-first AI setup',
    'provider.setup.title': 'Curriculum Tools',
    'provider.setup.subtitle':
      'Connect Gemini, OpenAI, or DeepSeek with your own API key before reviewing CVs or ranking candidates.',
    'provider.setup.privacy':
      "Your API key is stored in this browser's localStorage. CV text is sent directly from this browser to the selected AI provider only when you click Process.",
    'provider.setup.provider': 'Provider',
    'provider.setup.key': 'API key',
    'provider.setup.model': 'Model',
    'provider.setup.placeholder': 'Paste your provider key',
    'provider.setup.validation': 'Enter an API key and model before testing.',
    'provider.setup.testing': 'Testing provider',
    'provider.setup.submit': 'Test and Save',
    'provider.status.connected': '{provider} connected',
    'provider.status.saved': 'Provider tested and saved.',
    'provider.status.testing': 'Testing',
    'provider.status.retest': 'Retest',
    'provider.status.edit': 'Edit',
    'provider.status.clear': 'Clear',
    'provider.status.failed': 'Provider retest failed.',
    'candidate.eyebrow': 'Candidate',
    'candidate.title': 'CV Reviewer',
    'candidate.jobTitle': 'Job title',
    'candidate.jobDescription': 'Job description',
    'candidate.upload': 'Upload CV',
    'candidate.cvText': 'CV text',
    'candidate.extracting': 'Extracting {filename}',
    'candidate.ready': '{filename} is ready',
    'candidate.extractError': 'Could not extract text from this file.',
    'hr.extractError': 'Could not extract text from this file.',
    'candidate.validation':
      'Add job title, job description, and CV text before processing.',
    'candidate.processError': 'Could not process this CV.',
    'candidate.processing': 'Processing',
    'candidate.process': 'Process',
    'candidate.resultTitle': 'Review Result',
    'candidate.resultEmpty':
      'Run a CV review to see score, gaps, and concrete recommendations.',
    'result.score': 'Score',
    'result.noItems': 'No items returned.',
    'candidate.summaryChart': 'Fit Metrics',
    'candidate.metric.overall': 'Overall score',
    'candidate.metric.strengths': 'Strength signals',
    'candidate.metric.gaps': 'Gap signals',
    'candidate.metric.recommendations': 'Actionability',
    'candidate.list.strengths': 'Strengths',
    'candidate.list.concerns': 'Concerns',
    'candidate.list.gaps': 'Gaps',
    'candidate.list.recommendations': 'Recommendations',
    'candidate.list.rewritten': 'Rewritten bullets',
    'hr.eyebrow': 'HR',
    'hr.title': 'CV Ranking',
    'hr.upload': 'CV files',
    'hr.extracting': 'Extracting files...',
    'hr.ready': 'ready',
    'hr.validation':
      'Add job title, job description, and at least one valid CV.',
    'hr.processError': 'Could not rank these CVs.',
    'hr.processing': 'Processing...',
    'hr.batchProcessing': 'Processing batch {index} of {total}...',
    'hr.process': 'Process',
    'hr.resultTitle': 'Ranking Result',
    'hr.resultEmpty': 'Upload CVs and process them to see a ranked shortlist.',
    'hr.recommendation': 'Recommendation',
    'hr.recommendationDistribution': 'Recommendation distribution',
    'hr.recommendation.strong_yes': 'Strong yes',
    'hr.recommendation.yes': 'Yes',
    'hr.recommendation.maybe': 'Maybe',
    'hr.recommendation.no': 'No',
    'hr.dashboard.title': 'Ranking Metrics',
    'hr.dashboard.count': 'Candidates ranked',
    'hr.dashboard.average': 'Average score',
    'hr.dashboard.max': 'Top score',
    'hr.dashboard.min': 'Lowest score',
    'hr.dashboard.topCandidate': 'Top candidate',
    'hr.dashboard.comparison': 'Average vs top candidate',
    'hr.dashboard.spread': 'Score spread',
  },
  'pt-BR': {
    'language.label': 'Idioma',
    'app.kicker': 'Curriculum Tools',
    'app.title': 'Ferramentas de IA para candidatos e RH',
    'app.subtitle':
      'Analise um CV para uma vaga ou classifique varios CVs para uma descricao de trabalho. O conteudo so e enviado quando voce clica em Processar.',
    'app.tab.candidate': 'Candidato',
    'app.tab.hr': 'RH',
    'app.privacy':
      'As chaves de API sao salvas no localStorage deste navegador. O conteudo do CV e enviado para {provider} somente apos clicar em Processar.',
    'provider.setup.badge': 'Configuracao de IA no navegador',
    'provider.setup.title': 'Curriculum Tools',
    'provider.setup.subtitle':
      'Conecte Gemini, OpenAI ou DeepSeek com sua propria chave antes de revisar ou classificar CVs.',
    'provider.setup.privacy':
      'Sua chave de API e armazenada no localStorage deste navegador. O texto do CV e enviado diretamente para o provedor selecionado somente quando voce clicar em Processar.',
    'provider.setup.provider': 'Provedor',
    'provider.setup.key': 'Chave de API',
    'provider.setup.model': 'Modelo',
    'provider.setup.placeholder': 'Cole sua chave do provedor',
    'provider.setup.validation':
      'Informe uma chave de API e um modelo antes de testar.',
    'provider.setup.testing': 'Testando provedor',
    'provider.setup.submit': 'Testar e Salvar',
    'provider.status.connected': '{provider} conectado',
    'provider.status.saved': 'Provedor testado e salvo.',
    'provider.status.testing': 'Testando',
    'provider.status.retest': 'Retestar',
    'provider.status.edit': 'Editar',
    'provider.status.clear': 'Limpar',
    'provider.status.failed': 'Falha ao retestar o provedor.',
    'candidate.eyebrow': 'Candidato',
    'candidate.title': 'Revisor de CV',
    'candidate.jobTitle': 'Titulo da vaga',
    'candidate.jobDescription': 'Descricao da vaga',
    'candidate.upload': 'Enviar CV',
    'candidate.cvText': 'Texto do CV',
    'candidate.extracting': 'Extraindo {filename}',
    'candidate.ready': '{filename} pronto',
    'candidate.extractError': 'Nao foi possivel extrair o texto do arquivo.',
    'hr.extractError': 'Nao foi possivel extrair o texto do arquivo.',
    'candidate.validation':
      'Informe titulo, descricao da vaga e texto do CV antes de processar.',
    'candidate.processError': 'Nao foi possivel processar este CV.',
    'candidate.processing': 'Processando',
    'candidate.process': 'Processar',
    'candidate.resultTitle': 'Resultado da Revisao',
    'candidate.resultEmpty':
      'Execute a revisao para ver nota, lacunas e recomendacoes.',
    'result.score': 'Nota',
    'result.noItems': 'Nenhum item retornado.',
    'candidate.summaryChart': 'Metricas de Aderencia',
    'candidate.metric.overall': 'Nota geral',
    'candidate.metric.strengths': 'Sinais de forca',
    'candidate.metric.gaps': 'Sinais de lacuna',
    'candidate.metric.recommendations': 'Acionabilidade',
    'candidate.list.strengths': 'Forcas',
    'candidate.list.concerns': 'Riscos',
    'candidate.list.gaps': 'Lacunas',
    'candidate.list.recommendations': 'Recomendacoes',
    'candidate.list.rewritten': 'Bullets reescritos',
    'hr.eyebrow': 'RH',
    'hr.title': 'Ranking de CVs',
    'hr.upload': 'Arquivos de CV',
    'hr.extracting': 'Extraindo arquivos...',
    'hr.ready': 'pronto',
    'hr.validation': 'Informe titulo, descricao e ao menos um CV valido.',
    'hr.processError': 'Nao foi possivel classificar os CVs.',
    'hr.processing': 'Processando...',
    'hr.batchProcessing': 'Processando lote {index} de {total}...',
    'hr.process': 'Processar',
    'hr.resultTitle': 'Resultado do Ranking',
    'hr.resultEmpty': 'Envie CVs e processe para ver a lista classificada.',
    'hr.recommendation': 'Recomendacao',
    'hr.recommendationDistribution': 'Distribuicao de recomendacoes',
    'hr.recommendation.strong_yes': 'Sim forte',
    'hr.recommendation.yes': 'Sim',
    'hr.recommendation.maybe': 'Talvez',
    'hr.recommendation.no': 'Nao',
    'hr.dashboard.title': 'Metricas de Ranking',
    'hr.dashboard.count': 'Candidatos classificados',
    'hr.dashboard.average': 'Nota media',
    'hr.dashboard.max': 'Maior nota',
    'hr.dashboard.min': 'Menor nota',
    'hr.dashboard.topCandidate': 'Melhor candidato',
    'hr.dashboard.comparison': 'Media vs melhor candidato',
    'hr.dashboard.spread': 'Diferença de notas',
  },
  'es-ES': {
    'language.label': 'Idioma',
    'app.kicker': 'Curriculum Tools',
    'app.title': 'Herramientas de IA para candidatos y RRHH',
    'app.subtitle':
      'Revisa un CV para un puesto o clasifica varios CVs para una descripcion de trabajo. El contenido solo se envia cuando haces clic en Procesar.',
    'app.tab.candidate': 'Candidato',
    'app.tab.hr': 'RRHH',
    'app.privacy':
      'Las claves API se guardan en localStorage de este navegador. El contenido del CV se envia a {provider} solo despues de hacer clic en Procesar.',
    'provider.setup.badge': 'Configuracion IA en navegador',
    'provider.setup.title': 'Curriculum Tools',
    'provider.setup.subtitle':
      'Conecta Gemini, OpenAI o DeepSeek con tu propia clave antes de revisar o clasificar CVs.',
    'provider.setup.privacy':
      'Tu clave API se guarda en el localStorage del navegador. El texto del CV se envia directamente al proveedor seleccionado solo cuando haces clic en Procesar.',
    'provider.setup.provider': 'Proveedor',
    'provider.setup.key': 'Clave API',
    'provider.setup.model': 'Modelo',
    'provider.setup.placeholder': 'Pega tu clave del proveedor',
    'provider.setup.validation':
      'Introduce una clave API y un modelo antes de probar.',
    'provider.setup.testing': 'Probando proveedor',
    'provider.setup.submit': 'Probar y Guardar',
    'provider.status.connected': '{provider} conectado',
    'provider.status.saved': 'Proveedor probado y guardado.',
    'provider.status.testing': 'Probando',
    'provider.status.retest': 'Reprobar',
    'provider.status.edit': 'Editar',
    'provider.status.clear': 'Limpiar',
    'provider.status.failed': 'Fallo al reprobar el proveedor.',
    'candidate.eyebrow': 'Candidato',
    'candidate.title': 'Revisor de CV',
    'candidate.jobTitle': 'Titulo del puesto',
    'candidate.jobDescription': 'Descripcion del puesto',
    'candidate.upload': 'Subir CV',
    'candidate.cvText': 'Texto del CV',
    'candidate.extracting': 'Extrayendo {filename}',
    'candidate.ready': '{filename} listo',
    'candidate.extractError': 'No se pudo extraer el texto de este archivo.',
    'hr.extractError': 'No se pudo extraer el texto de este archivo.',
    'candidate.validation':
      'Agrega titulo, descripcion del puesto y texto del CV antes de procesar.',
    'candidate.processError': 'No se pudo procesar este CV.',
    'candidate.processing': 'Procesando',
    'candidate.process': 'Procesar',
    'candidate.resultTitle': 'Resultado de Revision',
    'candidate.resultEmpty':
      'Ejecuta la revision para ver puntuacion, brechas y recomendaciones.',
    'result.score': 'Puntuacion',
    'result.noItems': 'No se devolvieron elementos.',
    'candidate.summaryChart': 'Metricas de Ajuste',
    'candidate.metric.overall': 'Puntuacion general',
    'candidate.metric.strengths': 'Senales de fortaleza',
    'candidate.metric.gaps': 'Senales de brecha',
    'candidate.metric.recommendations': 'Accionabilidad',
    'candidate.list.strengths': 'Fortalezas',
    'candidate.list.concerns': 'Riesgos',
    'candidate.list.gaps': 'Brechas',
    'candidate.list.recommendations': 'Recomendaciones',
    'candidate.list.rewritten': 'Bullets reescritos',
    'hr.eyebrow': 'RRHH',
    'hr.title': 'Ranking de CVs',
    'hr.upload': 'Archivos CV',
    'hr.extracting': 'Extrayendo archivos...',
    'hr.ready': 'listo',
    'hr.validation': 'Agrega titulo, descripcion y al menos un CV valido.',
    'hr.processError': 'No se pudieron clasificar los CVs.',
    'hr.processing': 'Procesando...',
    'hr.batchProcessing': 'Procesando lote {index} de {total}...',
    'hr.process': 'Procesar',
    'hr.resultTitle': 'Resultado de Ranking',
    'hr.resultEmpty': 'Sube CVs y procesa para ver la lista ordenada.',
    'hr.recommendation': 'Recomendacion',
    'hr.recommendationDistribution': 'Distribucion de recomendaciones',
    'hr.recommendation.strong_yes': 'Si fuerte',
    'hr.recommendation.yes': 'Si',
    'hr.recommendation.maybe': 'Tal vez',
    'hr.recommendation.no': 'No',
    'hr.dashboard.title': 'Metricas de Ranking',
    'hr.dashboard.count': 'Candidatos clasificados',
    'hr.dashboard.average': 'Puntuacion promedio',
    'hr.dashboard.max': 'Puntuacion maxima',
    'hr.dashboard.min': 'Puntuacion minima',
    'hr.dashboard.topCandidate': 'Mejor candidato',
    'hr.dashboard.comparison': 'Promedio vs mejor candidato',
    'hr.dashboard.spread': 'Diferencia de puntuacion',
  },
};

type TranslationValues = Record<string, string | number>;

type I18nContextValue = {
  locale: Locale;
  setLocale(locale: Locale): void;
  t(key: string, values?: TranslationValues): string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const readLocale = (): Locale => {
  const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);

  if (saved === 'en-US' || saved === 'pt-BR' || saved === 'es-ES') {
    return saved;
  }

  return DEFAULT_LOCALE;
};

const writeLocale = (locale: Locale) => {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
};

const applyTemplate = (
  template: string,
  values?: TranslationValues,
): string => {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (!(key in values)) {
      return `{${key}}`;
    }

    return String(values[key]);
  });
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readLocale());

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    writeLocale(nextLocale);
  };

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      setLocale,
      t(key, values) {
        const dictionary = dictionaries[locale];
        const fallback = dictionaries[DEFAULT_LOCALE][key] ?? key;
        return applyTemplate(dictionary[key] ?? fallback, values);
      },
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider.');
  }

  return context;
};

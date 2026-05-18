/* eslint-disable react-refresh/only-export-components */
import { ReactNode, createContext, useContext, useMemo, useState } from 'react';

export type Locale = 'en-US' | 'pt-BR' | 'es-ES';

type Dictionary = Record<string, string>;

const LOCALE_STORAGE_KEY = 'curriculum-tools.locale.v1';
const DEFAULT_LOCALE: Locale = 'en-US';

const dictionaries: Record<Locale, Dictionary> = {
  'en-US': {
    'language.label': 'Language',
    'language.option.en': 'English (US)',
    'language.option.pt': 'Portuguese (Brazil)',
    'language.option.es': 'Spanish (Spain)',
    'app.kicker': 'Curriculum Tools',
    'app.title': 'AI tools for candidates and HR',
    'app.subtitle':
      'Review one CV against a role, or rank many CVs against one job description. Content is sent only when you click Process.',
    'app.tab.candidate': 'Candidate',
    'app.tab.hr': 'HR',
    'app.tab.quality': 'Quality',
    'app.toolIntro.title': 'Tool guide',
    'app.toolIntro.candidateTitle': 'Candidate CV Reviewer',
    'app.toolIntro.candidateDescription':
      'Analyze one CV against one role and get practical improvements, rewritten content, and interview preparation guidance.',
    'app.toolIntro.candidateSteps':
      'Step 1: add role context. Step 2: upload or paste CV text. Step 3: process and review score, gaps, and toolkit outputs.',
    'app.toolIntro.hrTitle': 'HR CV Ranking',
    'app.toolIntro.hrDescription':
      'Evaluate multiple CVs for one role, compare ranked candidates, and capture hiring decisions with notes and tags.',
    'app.toolIntro.hrSteps':
      'Step 1: add role context. Step 2: upload several CV files. Step 3: process ranking, compare candidates, and export results.',
    'app.toolIntro.qualityTitle': 'Quality Evaluation Harness',
    'app.toolIntro.qualityDescription':
      'Run fixed fixture packs to track prompt quality, score drift, and ranking stability across runs.',
    'app.toolIntro.qualitySteps':
      'Run fixture packs after prompt or model changes and monitor score spread, average deltas, and rank swaps.',
    'app.privacy':
      'API keys are saved in localStorage on this browser. CV content is sent from this browser to {provider} only after Process is clicked. {redaction}',
    'provider.setup.badge': 'Browser-first AI setup',
    'provider.setup.title': 'Curriculum Tools',
    'provider.setup.subtitle':
      'Connect Gemini, OpenAI, DeepSeek, OVHcloud, LLM7, Pollinations, or Kilo before reviewing CVs or ranking candidates.',
    'provider.setup.privacy':
      "Your API key is stored in this browser's localStorage. CV text is sent directly from this browser to the selected AI provider only when you click Process.",
    'provider.setup.provider': 'Provider',
    'provider.setup.key': 'API key',
    'provider.setup.keyOptional': 'API key (optional)',
    'provider.setup.model': 'Model',
    'provider.setup.placeholder': 'Paste your provider key',
    'provider.setup.placeholderOptional':
      'Optional: paste a key for higher limits',
    'provider.setup.validation': 'Enter an API key and model before testing.',
    'provider.setup.validationModel': 'Enter a model before testing.',
    'provider.setup.fetchModels': 'Fetch models',
    'provider.setup.fetchingModels': 'Fetching models...',
    'provider.setup.modelsUnsupported':
      'Model listing is not available for this provider.',
    'provider.setup.modelsEmpty':
      'No models were returned by this provider endpoint.',
    'provider.setup.modelsFetched': '{count} models fetched.',
    'provider.setup.risk.title': 'Risk notice:',
    'provider.setup.risk.ovh':
      'Anonymous free tier is heavily rate-limited and can be unstable. Do not send sensitive CV data.',
    'provider.setup.risk.llm7':
      'No-signup access may route through third-party infrastructure with changing limits and availability. Do not send sensitive CV data.',
    'provider.setup.risk.pollinations':
      'Anonymous free usage is community-managed and can change limits quickly. Do not send sensitive CV data.',
    'provider.setup.risk.kilo':
      'Anonymous routing and free-model availability can change without notice. Do not send sensitive CV data.',
    'provider.setup.testing': 'Testing provider',
    'provider.setup.submit': 'Test and Save',
    'provider.setup.feature.browser': 'Browser-first',
    'provider.setup.feature.browserValue': 'No backend',
    'provider.setup.feature.storage': 'Stored locally',
    'provider.setup.feature.storageValue': 'localStorage only',
    'provider.setup.feature.direct': 'Direct provider calls',
    'provider.setup.feature.directValue': 'Triggered on Process',
    'provider.setup.redaction.label': 'Redact sensitive data before API calls',
    'provider.setup.redaction.help':
      'Removes full name labels, email, document IDs, address labels, phone numbers, and URLs from prompts before sending.',
    'provider.status.connected': '{provider} connected',
    'provider.status.saved': 'Provider tested and saved.',
    'provider.status.testing': 'Testing',
    'provider.status.retest': 'Retest',
    'provider.status.edit': 'Edit',
    'provider.status.clear': 'Clear',
    'provider.status.failed': 'Provider retest failed.',
    'provider.status.noKey': 'No API key',
    'provider.fallback.notice':
      'Primary provider {primary} failed ({reason}). Request was retried with {fallback}.',
    'provider.fallback.reason.auth': 'authentication error',
    'provider.fallback.reason.quota': 'quota or rate-limit error',
    'provider.fallback.reason.network': 'network error',
    'provider.fallback.reason.provider': 'provider error',
    'provider.fallback.reason.parse': 'response parse error',
    'provider.fallback.reason.validation': 'validation error',
    'provider.status.redactionOn': 'Sensitive data redaction: enabled',
    'provider.status.redactionOff': 'Sensitive data redaction: disabled',
    'provider.redaction.enabled': 'Sensitive data redaction is enabled.',
    'provider.redaction.disabled':
      'Sensitive data redaction is disabled; prompts are sent as-is.',
    'candidate.eyebrow': 'Candidate',
    'candidate.title': 'CV Reviewer',
    'candidate.description':
      'Review one CV against a target role and receive clear strengths, gaps, and rewrite suggestions.',
    'candidate.jobTitle': 'Job title',
    'candidate.jobDescription': 'Job description',
    'candidate.upload': 'Upload CV',
    'candidate.uploadHint':
      'Supported files: .txt, .pdf, and .docx. You can also paste CV text directly below.',
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
    'candidate.processHint':
      'Content is sent only when you click Process. Review result quality before using it externally.',
    'candidate.resultTitle': 'Review Result',
    'candidate.resultEmpty':
      'Run a CV review to see score, gaps, and concrete recommendations.',
    'result.score': 'Score',
    'result.noItems': 'No items returned.',
    'result.loading': 'Processing result',
    'result.ready': 'Analysis complete',
    'export.json': 'Export JSON',
    'export.csv': 'Export CSV',
    'export.text': 'Export text',
    'candidate.summaryChart': 'Fit Metrics',
    'candidate.metric.overall': 'Overall score',
    'candidate.metric.strengths': 'Strength signals',
    'candidate.metric.gaps': 'Gap signals',
    'candidate.metric.recommendations': 'Actionability',
    'candidate.metric.evidenceCoverage': 'Evidence coverage',
    'candidate.metric.interviewReadiness': 'Interview readiness',
    'candidate.list.strengths': 'Strengths',
    'candidate.list.concerns': 'Concerns',
    'candidate.list.gaps': 'Gaps',
    'candidate.list.recommendations': 'Recommendations',
    'candidate.list.rewritten': 'Rewritten bullets',
    'candidate.list.rewrittenCv': 'Rewritten CV',
    'candidate.list.coverLetter': 'Cover letter',
    'candidate.list.interviewQa': 'Interview questions and suggested answers',
    'candidate.interview.suggestedAnswer': 'Suggested answer',
    'hr.eyebrow': 'HR',
    'hr.title': 'CV Ranking',
    'hr.description':
      'Rank multiple CVs for one role, review evidence and concerns, and keep decision notes for each candidate.',
    'hr.upload': 'CV files',
    'hr.uploadHint':
      'Upload several CVs to build a shortlist. Invalid files are skipped but valid files still run.',
    'hr.extracting': 'Extracting files...',
    'hr.ready': 'ready',
    'hr.validation':
      'Add job title, job description, and at least one valid CV.',
    'hr.processError': 'Could not rank these CVs.',
    'hr.processing': 'Processing...',
    'hr.batchProcessing': 'Processing batch {index} of {total}...',
    'hr.process': 'Process',
    'hr.processHint':
      'Each candidate is evaluated separately to reduce context collisions and improve ranking consistency.',
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
    'hr.dashboard.median': 'Median score',
    'hr.dashboard.deviation': 'Score deviation',
    'hr.dashboard.yesRate': 'Yes or better',
    'hr.dashboard.comparison': 'Average vs top candidate',
    'hr.dashboard.spread': 'Score spread',
    'hr.list.interviewQuestions': 'Interview questions',
  },
  'pt-BR': {
    'language.label': 'Idioma',
    'language.option.en': 'Ingles (EUA)',
    'language.option.pt': 'Portugues (Brasil)',
    'language.option.es': 'Espanhol (Espanha)',
    'app.kicker': 'Curriculum Tools',
    'app.title': 'Ferramentas de IA para candidatos e RH',
    'app.subtitle':
      'Analise um CV para uma vaga ou classifique varios CVs para uma descricao de trabalho. O conteudo so e enviado quando voce clica em Processar.',
    'app.tab.candidate': 'Candidato',
    'app.tab.hr': 'RH',
    'app.tab.quality': 'Qualidade',
    'app.toolIntro.title': 'Guia da ferramenta',
    'app.toolIntro.candidateTitle': 'Revisor de CV do Candidato',
    'app.toolIntro.candidateDescription':
      'Analise um CV para uma vaga e receba melhorias praticas, conteudo reescrito e orientacao para entrevista.',
    'app.toolIntro.candidateSteps':
      'Passo 1: informe contexto da vaga. Passo 2: envie ou cole o texto do CV. Passo 3: processe e revise nota, lacunas e toolkit.',
    'app.toolIntro.hrTitle': 'Ranking de CVs para RH',
    'app.toolIntro.hrDescription':
      'Avalie varios CVs para uma vaga, compare candidatos ranqueados e registre decisoes com notas e tags.',
    'app.toolIntro.hrSteps':
      'Passo 1: informe contexto da vaga. Passo 2: envie varios CVs. Passo 3: processe ranking, compare candidatos e exporte resultados.',
    'app.toolIntro.qualityTitle': 'Harness de Avaliacao de Qualidade',
    'app.toolIntro.qualityDescription':
      'Execute pacotes fixos para acompanhar qualidade de prompt, desvio de nota e estabilidade de ranking.',
    'app.toolIntro.qualitySteps':
      'Execute os fixtures apos mudar prompt ou modelo e acompanhe spread de notas, deltas medios e trocas de ranking.',
    'app.privacy':
      'As chaves de API sao salvas no localStorage deste navegador. O conteudo do CV e enviado para {provider} somente apos clicar em Processar. {redaction}',
    'provider.setup.badge': 'Configuracao de IA no navegador',
    'provider.setup.title': 'Curriculum Tools',
    'provider.setup.subtitle':
      'Conecte Gemini, OpenAI, DeepSeek, OVHcloud, LLM7, Pollinations ou Kilo antes de revisar ou classificar CVs.',
    'provider.setup.privacy':
      'Sua chave de API e armazenada no localStorage deste navegador. O texto do CV e enviado diretamente para o provedor selecionado somente quando voce clicar em Processar.',
    'provider.setup.provider': 'Provedor',
    'provider.setup.key': 'Chave de API',
    'provider.setup.keyOptional': 'Chave de API (opcional)',
    'provider.setup.model': 'Modelo',
    'provider.setup.placeholder': 'Cole sua chave do provedor',
    'provider.setup.placeholderOptional':
      'Opcional: cole uma chave para limites maiores',
    'provider.setup.validation':
      'Informe uma chave de API e um modelo antes de testar.',
    'provider.setup.validationModel': 'Informe um modelo antes de testar.',
    'provider.setup.fetchModels': 'Buscar modelos',
    'provider.setup.fetchingModels': 'Buscando modelos...',
    'provider.setup.modelsUnsupported':
      'A listagem de modelos nao esta disponivel para este provedor.',
    'provider.setup.modelsEmpty':
      'Nenhum modelo foi retornado por este endpoint do provedor.',
    'provider.setup.modelsFetched': '{count} modelos carregados.',
    'provider.setup.risk.title': 'Aviso de risco:',
    'provider.setup.risk.ovh':
      'O modo anonimo gratuito tem limite de taxa forte e pode ser instavel. Nao envie dados sensiveis de CV.',
    'provider.setup.risk.llm7':
      'O acesso sem cadastro pode usar infraestrutura de terceiros com limites e disponibilidade variaveis. Nao envie dados sensiveis de CV.',
    'provider.setup.risk.pollinations':
      'O uso anonimo gratuito e gerenciado pela comunidade e pode mudar limites rapidamente. Nao envie dados sensiveis de CV.',
    'provider.setup.risk.kilo':
      'O roteamento anonimo e a disponibilidade de modelos gratis podem mudar sem aviso. Nao envie dados sensiveis de CV.',
    'provider.setup.testing': 'Testando provedor',
    'provider.setup.submit': 'Testar e Salvar',
    'provider.setup.feature.browser': 'Primeiro no navegador',
    'provider.setup.feature.browserValue': 'Sem backend',
    'provider.setup.feature.storage': 'Armazenado localmente',
    'provider.setup.feature.storageValue': 'Somente localStorage',
    'provider.setup.feature.direct': 'Chamadas diretas',
    'provider.setup.feature.directValue': 'Disparadas em Processar',
    'provider.setup.redaction.label':
      'Redigir dados sensiveis antes das chamadas de API',
    'provider.setup.redaction.help':
      'Remove rotulos de nome completo, email, documentos, rotulos de endereco, telefones e URLs dos prompts antes do envio.',
    'provider.status.connected': '{provider} conectado',
    'provider.status.saved': 'Provedor testado e salvo.',
    'provider.status.testing': 'Testando',
    'provider.status.retest': 'Retestar',
    'provider.status.edit': 'Editar',
    'provider.status.clear': 'Limpar',
    'provider.status.failed': 'Falha ao retestar o provedor.',
    'provider.status.noKey': 'Sem chave de API',
    'provider.fallback.notice':
      'O provedor principal {primary} falhou ({reason}). A requisicao foi repetida com {fallback}.',
    'provider.fallback.reason.auth': 'erro de autenticacao',
    'provider.fallback.reason.quota': 'erro de limite ou cota',
    'provider.fallback.reason.network': 'erro de rede',
    'provider.fallback.reason.provider': 'erro do provedor',
    'provider.fallback.reason.parse': 'erro de parse da resposta',
    'provider.fallback.reason.validation': 'erro de validacao',
    'provider.status.redactionOn': 'Redacao de dados sensiveis: ativada',
    'provider.status.redactionOff': 'Redacao de dados sensiveis: desativada',
    'provider.redaction.enabled': 'A redacao de dados sensiveis esta ativada.',
    'provider.redaction.disabled':
      'A redacao de dados sensiveis esta desativada; prompts sao enviados sem alteracoes.',
    'candidate.eyebrow': 'Candidato',
    'candidate.title': 'Revisor de CV',
    'candidate.description':
      'Revise um CV para uma vaga-alvo e receba forcas, lacunas e sugestoes de reescrita.',
    'candidate.jobTitle': 'Titulo da vaga',
    'candidate.jobDescription': 'Descricao da vaga',
    'candidate.upload': 'Enviar CV',
    'candidate.uploadHint':
      'Arquivos suportados: .txt, .pdf e .docx. Voce tambem pode colar o texto do CV abaixo.',
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
    'candidate.processHint':
      'O conteudo so e enviado quando voce clica em Processar. Revise a qualidade antes de usar externamente.',
    'candidate.resultTitle': 'Resultado da Revisao',
    'candidate.resultEmpty':
      'Execute a revisao para ver nota, lacunas e recomendacoes.',
    'result.score': 'Nota',
    'result.noItems': 'Nenhum item retornado.',
    'result.loading': 'Processando resultado',
    'result.ready': 'Analise concluida',
    'export.json': 'Exportar JSON',
    'export.csv': 'Exportar CSV',
    'export.text': 'Exportar texto',
    'candidate.summaryChart': 'Metricas de Aderencia',
    'candidate.metric.overall': 'Nota geral',
    'candidate.metric.strengths': 'Sinais de forca',
    'candidate.metric.gaps': 'Sinais de lacuna',
    'candidate.metric.recommendations': 'Acionabilidade',
    'candidate.metric.evidenceCoverage': 'Cobertura de evidencias',
    'candidate.metric.interviewReadiness': 'Preparo para entrevista',
    'candidate.list.strengths': 'Forcas',
    'candidate.list.concerns': 'Riscos',
    'candidate.list.gaps': 'Lacunas',
    'candidate.list.recommendations': 'Recomendacoes',
    'candidate.list.rewritten': 'Bullets reescritos',
    'candidate.list.rewrittenCv': 'CV reescrito',
    'candidate.list.coverLetter': 'Carta de apresentacao',
    'candidate.list.interviewQa':
      'Perguntas de entrevista e respostas sugeridas',
    'candidate.interview.suggestedAnswer': 'Resposta sugerida',
    'hr.eyebrow': 'RH',
    'hr.title': 'Ranking de CVs',
    'hr.description':
      'Classifique varios CVs para uma vaga, revise evidencias e riscos, e mantenha notas de decisao por candidato.',
    'hr.upload': 'Arquivos de CV',
    'hr.uploadHint':
      'Envie varios CVs para montar uma shortlist. Arquivos invalidos sao ignorados, mas os validos continuam.',
    'hr.extracting': 'Extraindo arquivos...',
    'hr.ready': 'pronto',
    'hr.validation': 'Informe titulo, descricao e ao menos um CV valido.',
    'hr.processError': 'Nao foi possivel classificar os CVs.',
    'hr.processing': 'Processando...',
    'hr.batchProcessing': 'Processando lote {index} de {total}...',
    'hr.process': 'Processar',
    'hr.processHint':
      'Cada candidato e avaliado separadamente para reduzir colisoes de contexto e melhorar consistencia.',
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
    'hr.dashboard.median': 'Nota mediana',
    'hr.dashboard.deviation': 'Desvio de notas',
    'hr.dashboard.yesRate': 'Sim ou melhor',
    'hr.dashboard.comparison': 'Media vs melhor candidato',
    'hr.dashboard.spread': 'Diferença de notas',
    'hr.list.interviewQuestions': 'Perguntas de entrevista',
  },
  'es-ES': {
    'language.label': 'Idioma',
    'language.option.en': 'Ingles (EE. UU.)',
    'language.option.pt': 'Portugues (Brasil)',
    'language.option.es': 'Espanol (Espana)',
    'app.kicker': 'Curriculum Tools',
    'app.title': 'Herramientas de IA para candidatos y RRHH',
    'app.subtitle':
      'Revisa un CV para un puesto o clasifica varios CVs para una descripcion de trabajo. El contenido solo se envia cuando haces clic en Procesar.',
    'app.tab.candidate': 'Candidato',
    'app.tab.hr': 'RRHH',
    'app.tab.quality': 'Calidad',
    'app.toolIntro.title': 'Guia de herramienta',
    'app.toolIntro.candidateTitle': 'Revisor de CV para Candidato',
    'app.toolIntro.candidateDescription':
      'Analiza un CV para un puesto y recibe mejoras practicas, contenido reescrito y orientacion de entrevista.',
    'app.toolIntro.candidateSteps':
      'Paso 1: agrega contexto del puesto. Paso 2: sube o pega el texto del CV. Paso 3: procesa y revisa puntuacion, brechas y toolkit.',
    'app.toolIntro.hrTitle': 'Ranking de CVs para RRHH',
    'app.toolIntro.hrDescription':
      'Evalua varios CVs para un puesto, compara candidatos ordenados y guarda decisiones con notas y etiquetas.',
    'app.toolIntro.hrSteps':
      'Paso 1: agrega contexto del puesto. Paso 2: sube varios CVs. Paso 3: procesa ranking, compara candidatos y exporta resultados.',
    'app.toolIntro.qualityTitle': 'Harness de Evaluacion de Calidad',
    'app.toolIntro.qualityDescription':
      'Ejecuta paquetes de fixtures para seguir calidad de prompts, deriva de puntuaciones y estabilidad de ranking.',
    'app.toolIntro.qualitySteps':
      'Ejecuta fixtures tras cambios de prompt o modelo y monitorea spread, deltas promedio y cambios de ranking.',
    'app.privacy':
      'Las claves API se guardan en localStorage de este navegador. El contenido del CV se envia a {provider} solo despues de hacer clic en Procesar. {redaction}',
    'provider.setup.badge': 'Configuracion IA en navegador',
    'provider.setup.title': 'Curriculum Tools',
    'provider.setup.subtitle':
      'Conecta Gemini, OpenAI, DeepSeek, OVHcloud, LLM7, Pollinations o Kilo antes de revisar o clasificar CVs.',
    'provider.setup.privacy':
      'Tu clave API se guarda en el localStorage del navegador. El texto del CV se envia directamente al proveedor seleccionado solo cuando haces clic en Procesar.',
    'provider.setup.provider': 'Proveedor',
    'provider.setup.key': 'Clave API',
    'provider.setup.keyOptional': 'Clave API (opcional)',
    'provider.setup.model': 'Modelo',
    'provider.setup.placeholder': 'Pega tu clave del proveedor',
    'provider.setup.placeholderOptional':
      'Opcional: pega una clave para limites mas altos',
    'provider.setup.validation':
      'Introduce una clave API y un modelo antes de probar.',
    'provider.setup.validationModel': 'Introduce un modelo antes de probar.',
    'provider.setup.fetchModels': 'Obtener modelos',
    'provider.setup.fetchingModels': 'Obteniendo modelos...',
    'provider.setup.modelsUnsupported':
      'La lista de modelos no esta disponible para este proveedor.',
    'provider.setup.modelsEmpty':
      'Este endpoint del proveedor no devolvio modelos.',
    'provider.setup.modelsFetched': '{count} modelos cargados.',
    'provider.setup.risk.title': 'Aviso de riesgo:',
    'provider.setup.risk.ovh':
      'El modo anonimo gratuito tiene limite de tasa estricto y puede ser inestable. No envies datos sensibles del CV.',
    'provider.setup.risk.llm7':
      'El acceso sin registro puede usar infraestructura de terceros con limites y disponibilidad variables. No envies datos sensibles del CV.',
    'provider.setup.risk.pollinations':
      'El uso anonimo gratuito es gestionado por la comunidad y puede cambiar limites rapidamente. No envies datos sensibles del CV.',
    'provider.setup.risk.kilo':
      'El enrutamiento anonimo y la disponibilidad de modelos gratuitos pueden cambiar sin aviso. No envies datos sensibles del CV.',
    'provider.setup.testing': 'Probando proveedor',
    'provider.setup.submit': 'Probar y Guardar',
    'provider.setup.feature.browser': 'Primero en el navegador',
    'provider.setup.feature.browserValue': 'Sin backend',
    'provider.setup.feature.storage': 'Guardado localmente',
    'provider.setup.feature.storageValue': 'Solo localStorage',
    'provider.setup.feature.direct': 'Llamadas directas',
    'provider.setup.feature.directValue': 'Se activan al procesar',
    'provider.setup.redaction.label':
      'Redactar datos sensibles antes de las llamadas API',
    'provider.setup.redaction.help':
      'Elimina etiquetas de nombre completo, correo, documentos, etiquetas de direccion, telefonos y URLs de los prompts antes de enviarlos.',
    'provider.status.connected': '{provider} conectado',
    'provider.status.saved': 'Proveedor probado y guardado.',
    'provider.status.testing': 'Probando',
    'provider.status.retest': 'Reprobar',
    'provider.status.edit': 'Editar',
    'provider.status.clear': 'Limpiar',
    'provider.status.failed': 'Fallo al reprobar el proveedor.',
    'provider.status.noKey': 'Sin clave API',
    'provider.fallback.notice':
      'El proveedor principal {primary} fallo ({reason}). La solicitud se reintento con {fallback}.',
    'provider.fallback.reason.auth': 'error de autenticacion',
    'provider.fallback.reason.quota': 'error de cuota o limite',
    'provider.fallback.reason.network': 'error de red',
    'provider.fallback.reason.provider': 'error del proveedor',
    'provider.fallback.reason.parse': 'error de parseo de respuesta',
    'provider.fallback.reason.validation': 'error de validacion',
    'provider.status.redactionOn': 'Redaccion de datos sensibles: activada',
    'provider.status.redactionOff': 'Redaccion de datos sensibles: desactivada',
    'provider.redaction.enabled':
      'La redaccion de datos sensibles esta activada.',
    'provider.redaction.disabled':
      'La redaccion de datos sensibles esta desactivada; los prompts se envian sin cambios.',
    'candidate.eyebrow': 'Candidato',
    'candidate.title': 'Revisor de CV',
    'candidate.description':
      'Revisa un CV contra un puesto objetivo y recibe fortalezas, brechas y sugerencias de reescritura.',
    'candidate.jobTitle': 'Titulo del puesto',
    'candidate.jobDescription': 'Descripcion del puesto',
    'candidate.upload': 'Subir CV',
    'candidate.uploadHint':
      'Archivos compatibles: .txt, .pdf y .docx. Tambien puedes pegar el texto del CV abajo.',
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
    'candidate.processHint':
      'El contenido solo se envia cuando haces clic en Procesar. Revisa la calidad antes de usarlo externamente.',
    'candidate.resultTitle': 'Resultado de Revision',
    'candidate.resultEmpty':
      'Ejecuta la revision para ver puntuacion, brechas y recomendaciones.',
    'result.score': 'Puntuacion',
    'result.noItems': 'No se devolvieron elementos.',
    'result.loading': 'Procesando resultado',
    'result.ready': 'Analisis completado',
    'export.json': 'Exportar JSON',
    'export.csv': 'Exportar CSV',
    'export.text': 'Exportar texto',
    'candidate.summaryChart': 'Metricas de Ajuste',
    'candidate.metric.overall': 'Puntuacion general',
    'candidate.metric.strengths': 'Senales de fortaleza',
    'candidate.metric.gaps': 'Senales de brecha',
    'candidate.metric.recommendations': 'Accionabilidad',
    'candidate.metric.evidenceCoverage': 'Cobertura de evidencia',
    'candidate.metric.interviewReadiness': 'Preparacion para entrevista',
    'candidate.list.strengths': 'Fortalezas',
    'candidate.list.concerns': 'Riesgos',
    'candidate.list.gaps': 'Brechas',
    'candidate.list.recommendations': 'Recomendaciones',
    'candidate.list.rewritten': 'Bullets reescritos',
    'candidate.list.rewrittenCv': 'CV reescrito',
    'candidate.list.coverLetter': 'Carta de presentacion',
    'candidate.list.interviewQa':
      'Preguntas de entrevista y respuestas sugeridas',
    'candidate.interview.suggestedAnswer': 'Respuesta sugerida',
    'hr.eyebrow': 'RRHH',
    'hr.title': 'Ranking de CVs',
    'hr.description':
      'Clasifica varios CVs para un puesto, revisa evidencias y riesgos, y guarda notas de decision por candidato.',
    'hr.upload': 'Archivos CV',
    'hr.uploadHint':
      'Sube varios CVs para crear una shortlist. Los archivos invalidos se omiten y los validos siguen.',
    'hr.extracting': 'Extrayendo archivos...',
    'hr.ready': 'listo',
    'hr.validation': 'Agrega titulo, descripcion y al menos un CV valido.',
    'hr.processError': 'No se pudieron clasificar los CVs.',
    'hr.processing': 'Procesando...',
    'hr.batchProcessing': 'Procesando lote {index} de {total}...',
    'hr.process': 'Procesar',
    'hr.processHint':
      'Cada candidato se evalua por separado para reducir colisiones de contexto y mejorar consistencia.',
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
    'hr.dashboard.median': 'Puntuacion mediana',
    'hr.dashboard.deviation': 'Desviacion de puntuacion',
    'hr.dashboard.yesRate': 'Si o mejor',
    'hr.dashboard.comparison': 'Promedio vs mejor candidato',
    'hr.dashboard.spread': 'Diferencia de puntuacion',
    'hr.list.interviewQuestions': 'Preguntas de entrevista',
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

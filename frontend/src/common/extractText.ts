import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

export type ExtractedFile = {
  id: string;
  filename: string;
  text: string;
};

export const SUPPORTED_FILE_TYPES = '.txt,.pdf,.doc,.docx';

export const extractTextFromFile = async (file: File): Promise<string> => {
  const extension = getFileExtension(file.name);

  if (extension === 'txt') {
    return file.text();
  }

  if (extension === 'pdf') {
    return extractPdfText(file);
  }

  if (extension === 'docx') {
    return extractDocxText(file);
  }

  if (extension === 'doc') {
    throw new Error(
      'Legacy .doc files are not reliably supported in the browser. Convert this file to .docx or PDF, or paste the CV text.',
    );
  }

  throw new Error('Use a .txt, .pdf, or .docx file.');
};

const getFileExtension = (filename: string) =>
  filename.split('.').pop()?.toLowerCase() ?? '';

const extractPdfText = async (file: File): Promise<string> => {
  const pdfjs = await import('pdfjs-dist');
  const data = await file.arrayBuffer();
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const document = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map(item => ('str' in item ? item.str : ''))
        .filter(Boolean)
        .join(' '),
    );
  }

  return pages.join('\n\n').trim();
};

const extractDocxText = async (file: File): Promise<string> => {
  const mammoth = await import('mammoth/mammoth.browser');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });

  return result.value.trim();
};

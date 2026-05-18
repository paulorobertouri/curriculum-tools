import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AiConfig } from '@/domain/aiTypes';
import { deepseekProvider } from '@/providers/deepseekProvider';
import { geminiProvider } from '@/providers/geminiProvider';
import { kiloProvider } from '@/providers/kiloProvider';
import { llm7Provider } from '@/providers/llm7Provider';
import { openaiProvider } from '@/providers/openaiProvider';
import { ovhProvider } from '@/providers/ovhProvider';
import { pollinationsProvider } from '@/providers/pollinationsProvider';

const config: AiConfig = {
  provider: 'openai',
  apiKey: 'test-key',
  model: 'test-model',
  savedAt: '2026-05-15T00:00:00.000Z',
};

const parseRequestBody = (requestInit: RequestInit | undefined) => {
  if (typeof requestInit?.body !== 'string') {
    throw new Error('Expected JSON string request body.');
  }

  return JSON.parse(requestInit.body) as Record<string, unknown>;
};

describe('provider adapters', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes auth errors for OpenAI test connection', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Unauthorized' } }),
    } as Response);

    await expect(openaiProvider.testConnection(config)).rejects.toMatchObject({
      kind: 'auth',
      message: 'The API key was rejected by the provider.',
    });
  });

  it('normalizes quota errors for Gemini test connection', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: { message: 'Rate limited' } }),
    } as Response);

    await expect(
      geminiProvider.testConnection({ ...config, provider: 'gemini' }),
    ).rejects.toMatchObject({
      kind: 'quota',
      message: 'The provider reported quota, billing, or rate limit trouble.',
    });
  });

  it('normalizes network failures for DeepSeek test connection', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network down'));

    await expect(
      deepseekProvider.testConnection({ ...config, provider: 'deepseek' }),
    ).rejects.toMatchObject({
      kind: 'network',
      message: 'Network down',
    });
  });

  it('calls OpenAI Responses API for connection tests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ output_text: 'hello' }),
    } as Response);

    await expect(openaiProvider.testConnection(config)).resolves.toEqual({
      ok: true,
      message: 'OpenAI responded successfully.',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/responses',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('lists OpenAI models', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 'gpt-5.4-mini' }, { id: 'gpt-4o' }] }),
    } as Response);

    await expect(openaiProvider.listModels?.(config)).resolves.toEqual([
      'gpt-4o',
      'gpt-5.4-mini',
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/models',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('sends a valid structured-output schema for OpenAI result parsing', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          output_text: JSON.stringify({
            score: 8.4,
            summary: 'Strong fit for the role.',
            strengths: ['React delivery'],
            gaps: ['Leadership examples'],
            recommendations: ['Quantify impact'],
            rewrittenBullets: [
              'Improved page performance by 30% in React app.',
            ],
          }),
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          output_text: JSON.stringify({
            rewrittenCv: 'Updated CV',
            coverLetter: 'Tailored cover letter',
            interviewQa: [
              {
                question: 'How do you measure impact?',
                suggestedAnswer:
                  'I use delivery and outcome metrics aligned to business goals.',
              },
            ],
          }),
        }),
      } as Response);

    await openaiProvider.reviewCandidateCv(
      { ...config },
      {
        jobTitle: 'Frontend Engineer',
        jobDescription: 'Build React apps.',
        cvText: 'Built React apps.',
      },
    );

    const requestInit = fetchMock.mock.calls[0]?.[1];
    expect(requestInit).toBeDefined();

    const body = JSON.parse(String((requestInit as RequestInit).body));

    expect(body.text.format.schema).toEqual({
      type: 'object',
      properties: {
        score: { type: 'number' },
        summary: { type: 'string' },
        strengths: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        rewrittenBullets: { type: 'array', items: { type: 'string' } },
      },
      required: [
        'score',
        'summary',
        'strengths',
        'gaps',
        'recommendations',
        'rewrittenBullets',
      ],
      additionalProperties: false,
    });

    const secondRequestInit = fetchMock.mock.calls[1]?.[1];
    const secondBody = JSON.parse(
      String((secondRequestInit as RequestInit).body),
    );
    expect(secondBody.text.format.schema).toEqual({
      type: 'object',
      properties: {
        rewrittenCv: { type: 'string' },
        coverLetter: { type: 'string' },
        interviewQa: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              suggestedAnswer: { type: 'string' },
            },
            required: ['question', 'suggestedAnswer'],
            additionalProperties: false,
          },
        },
      },
      required: ['rewrittenCv', 'coverLetter', 'interviewQa'],
      additionalProperties: false,
    });
  });

  it('sends a valid structured-output schema for OpenAI HR ranking', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          candidates: [
            {
              id: 'candidate-1',
              filename: 'alice.txt',
              detectedName: 'Alice',
              score: 9.2,
              justification: 'Strong leadership and delivery evidence.',
              strengths: ['Team leadership'],
              concerns: ['Limited domain depth'],
              interviewRecommendation: 'strong_yes',
              interviewQuestions: ['Describe your approach to mentoring.'],
            },
          ],
        }),
      }),
    } as Response);

    await openaiProvider.rankHrCvs(
      { ...config },
      {
        jobTitle: 'Engineering Manager',
        jobDescription: 'Lead engineering teams and execute roadmap.',
        cvs: [
          { id: 'candidate-1', filename: 'alice.txt', text: 'Alice CV text' },
        ],
      },
    );

    const requestInit = fetchMock.mock.calls[0]?.[1];
    expect(requestInit).toBeDefined();

    const body = JSON.parse(String((requestInit as RequestInit).body));

    expect(body.text.format.schema.properties.candidates.items).toEqual({
      type: 'object',
      properties: {
        id: { type: 'string' },
        filename: { type: 'string' },
        detectedName: { type: 'string' },
        score: { type: 'number' },
        justification: { type: 'string' },
        strengths: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        interviewRecommendation: {
          type: 'string',
          enum: ['strong_yes', 'yes', 'maybe', 'no'],
        },
        interviewQuestions: { type: 'array', items: { type: 'string' } },
      },
      required: [
        'id',
        'filename',
        'detectedName',
        'score',
        'justification',
        'strengths',
        'concerns',
        'interviewRecommendation',
        'interviewQuestions',
      ],
      additionalProperties: false,
    });
  });

  it('calls Gemini generateContent for connection tests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'hello' }] } }],
      }),
    } as Response);

    await geminiProvider.testConnection({ ...config, provider: 'gemini' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('lists Gemini models that support generateContent', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [
          {
            name: 'models/gemini-3.1-flash-lite',
            supportedGenerationMethods: ['generateContent'],
          },
          {
            name: 'models/text-embedding-004',
            supportedGenerationMethods: ['embedContent'],
          },
        ],
      }),
    } as Response);

    await expect(
      geminiProvider.listModels?.({ ...config, provider: 'gemini' }),
    ).resolves.toEqual(['gemini-3.1-flash-lite']);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://generativelanguage.googleapis.com/v1beta/models?key=test-key',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('calls DeepSeek chat completions for connection tests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'hello' } }] }),
    } as Response);

    await deepseekProvider.testConnection({ ...config, provider: 'deepseek' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.deepseek.com/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('lists DeepSeek models', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 'deepseek-v4-flash' }] }),
    } as Response);

    await expect(
      deepseekProvider.listModels?.({ ...config, provider: 'deepseek' }),
    ).resolves.toEqual(['deepseek-v4-flash']);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.deepseek.com/models',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('calls OVH anonymous chat completions for connection tests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'hello' } }] }),
    } as Response);

    await ovhProvider.testConnection({
      ...config,
      provider: 'ovh',
      apiKey: '',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = request.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('accepts OVH connectivity when chat is rate-limited but models is reachable', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ message: 'API rate limit exceeded' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 'Qwen3-32B' }] }),
      } as Response);

    await expect(
      ovhProvider.testConnection({
        ...config,
        provider: 'ovh',
        apiKey: '',
      }),
    ).resolves.toEqual({
      ok: true,
      message:
        'OVHcloud AI Endpoints is reachable, but chat is currently rate-limited.',
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/models',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('lists OVH models', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: 'Qwen3-32B' }, { id: 'gpt-oss-20b' }],
      }),
    } as Response);

    await expect(
      ovhProvider.listModels?.({ ...config, provider: 'ovh', apiKey: '' }),
    ).resolves.toEqual(['gpt-oss-20b', 'Qwen3-32B']);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/models',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('calls LLM7 chat completions and sends auth only when key exists', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'hello' } }] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'hello' } }] }),
      } as Response);

    await llm7Provider.testConnection({
      ...config,
      provider: 'llm7',
      apiKey: '',
    });
    await llm7Provider.testConnection({
      ...config,
      provider: 'llm7',
      apiKey: 'llm7-token',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.llm7.io/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );

    const firstHeaders = (fetchMock.mock.calls[0]?.[1] as RequestInit)
      .headers as Record<string, string>;
    const secondHeaders = (fetchMock.mock.calls[1]?.[1] as RequestInit)
      .headers as Record<string, string>;

    expect(firstHeaders.Authorization).toBeUndefined();
    expect(secondHeaders.Authorization).toBe('Bearer llm7-token');
  });

  it('lists LLM7 models from array responses', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 'deepseek-v3-0324' },
        { id: 'codestral-latest' },
      ],
    } as Response);

    await expect(
      llm7Provider.listModels?.({ ...config, provider: 'llm7', apiKey: '' }),
    ).resolves.toEqual(['codestral-latest', 'deepseek-v3-0324']);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.llm7.io/v1/models',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('calls Pollinations chat completions without api key', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'hello' } }] }),
    } as Response);

    await pollinationsProvider.testConnection({
      ...config,
      provider: 'pollinations',
      apiKey: '',
      model: 'openai-fast',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://text.pollinations.ai/openai/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );

    const headers = (fetchMock.mock.calls[0]?.[1] as RequestInit)
      .headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('accepts Pollinations test response when it is non-empty but not hello', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Hi there' } }] }),
    } as Response);

    await expect(
      pollinationsProvider.testConnection({
        ...config,
        provider: 'pollinations',
        apiKey: '',
        model: 'openai-fast',
      }),
    ).resolves.toEqual({
      ok: true,
      message: 'Pollinations responded successfully.',
    });
  });

  it('lists Pollinations models', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: 'openai-fast' }, { id: 'openai-large' }],
      }),
    } as Response);

    await expect(
      pollinationsProvider.listModels?.({
        ...config,
        provider: 'pollinations',
        apiKey: '',
      }),
    ).resolves.toEqual(['openai-fast', 'openai-large']);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://text.pollinations.ai/openai/models',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('calls Kilo chat completions and sends auth only when key exists', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'hello' } }] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'hello' } }] }),
      } as Response);

    await kiloProvider.testConnection({
      ...config,
      provider: 'kilo',
      apiKey: '',
      model: 'kilo-auto/free',
    });
    await kiloProvider.testConnection({
      ...config,
      provider: 'kilo',
      apiKey: 'kilo-token',
      model: 'kilo-auto/free',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.kilo.ai/api/gateway/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );

    const firstHeaders = (fetchMock.mock.calls[0]?.[1] as RequestInit)
      .headers as Record<string, string>;
    const secondHeaders = (fetchMock.mock.calls[1]?.[1] as RequestInit)
      .headers as Record<string, string>;

    expect(firstHeaders.Authorization).toBeUndefined();
    expect(secondHeaders.Authorization).toBe('Bearer kilo-token');
  });

  it('lists Kilo models', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: 'kilo-auto/free' }, { id: 'foo/bar' }],
      }),
    } as Response);

    await expect(
      kiloProvider.listModels?.({ ...config, provider: 'kilo', apiKey: '' }),
    ).resolves.toEqual(['foo/bar', 'kilo-auto/free']);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.kilo.ai/api/gateway/models',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('redacts sensitive data before sending prompts to OpenAI', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          output_text: JSON.stringify({
            score: 7.5,
            summary: 'Summary',
            strengths: ['Strength'],
            gaps: ['Gap'],
            recommendations: ['Recommendation'],
            rewrittenBullets: ['Bullet'],
          }),
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          output_text: JSON.stringify({
            rewrittenCv: 'Rewritten CV',
            coverLetter: 'Cover letter',
            interviewQa: [
              { question: 'Question', suggestedAnswer: 'Suggested answer' },
            ],
          }),
        }),
      } as Response);

    await openaiProvider.reviewCandidateCv(
      { ...config },
      {
        jobTitle: 'Frontend Engineer',
        jobDescription:
          'Contact me at jane.doe@example.com, +1 (555) 123-4567, https://portfolio.dev',
        cvText: `Name: Jane Doe\nEmail: jane.doe@example.com\nAddress: 123 Main St\nDocument: 123.456.789-09`,
      },
    );

    const firstBody = parseRequestBody(fetchMock.mock.calls[0]?.[1]);
    const prompt = String(firstBody.input);

    expect(prompt).not.toContain('Jane Doe');
    expect(prompt).not.toContain('jane.doe@example.com');
    expect(prompt).not.toContain('123 Main St');
    expect(prompt).not.toContain('123.456.789-09');
    expect(prompt).not.toContain('https://portfolio.dev');
    expect(prompt).not.toContain('+1 (555) 123-4567');
    expect(prompt).toContain('[REDACTED_NAME]');
    expect(prompt).toContain('[REDACTED_EMAIL]');
    expect(prompt).toContain('[REDACTED_ADDRESS]');
    expect(prompt).toContain('[REDACTED_DOCUMENT]');
    expect(prompt).toContain('[REDACTED_URL]');
    expect(prompt).toContain('[REDACTED_PHONE]');
  });

  it('redacts sensitive data before sending prompts to Gemini', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    candidates: [
                      {
                        id: 'candidate-1',
                        filename: 'cv.txt',
                        detectedName: 'Candidate',
                        score: 6.5,
                        justification: 'Justification',
                        strengths: ['Strength'],
                        concerns: ['Concern'],
                        interviewRecommendation: 'maybe',
                        interviewQuestions: ['Question'],
                      },
                    ],
                  }),
                },
              ],
            },
          },
        ],
      }),
    } as Response);

    await geminiProvider.rankHrCvs(
      { ...config, provider: 'gemini' },
      {
        jobTitle: 'Engineering Manager',
        jobDescription: 'Role details at https://example.org/jobs/1',
        cvs: [
          {
            id: 'candidate-1',
            filename: 'cv.txt',
            text: 'Email: candidate@example.org\nPhone: +55 11 91234-5678',
          },
        ],
      },
    );

    const requestBody = parseRequestBody(fetchMock.mock.calls[0]?.[1]);
    const prompt = String(requestBody.contents[0].parts[0].text);

    expect(prompt).not.toContain('candidate@example.org');
    expect(prompt).not.toContain('+55 11 91234-5678');
    expect(prompt).not.toContain('https://example.org/jobs/1');
    expect(prompt).toContain('[REDACTED_EMAIL]');
    expect(prompt).toContain('[REDACTED_PHONE]');
    expect(prompt).toContain('[REDACTED_URL]');
  });

  it('redacts sensitive data before sending prompts to DeepSeek', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                candidates: [
                  {
                    id: 'candidate-1',
                    filename: 'cv.txt',
                    detectedName: 'Candidate',
                    score: 8,
                    justification: 'Justification',
                    strengths: ['Strength'],
                    concerns: ['Concern'],
                    interviewRecommendation: 'yes',
                    interviewQuestions: ['Question'],
                  },
                ],
              }),
            },
          },
        ],
      }),
    } as Response);

    await deepseekProvider.rankHrCvs(
      { ...config, provider: 'deepseek' },
      {
        jobTitle: 'Engineering Manager',
        jobDescription: 'Linked profile: www.linkedin.com/in/janedoe',
        cvs: [
          {
            id: 'candidate-1',
            filename: 'cv.txt',
            text: 'Document: 123-45-6789\nAddress: 456 Market Ave',
          },
        ],
      },
    );

    const requestBody = parseRequestBody(fetchMock.mock.calls[0]?.[1]);
    const prompt = String(requestBody.messages[0].content);

    expect(prompt).not.toContain('123-45-6789');
    expect(prompt).not.toContain('456 Market Ave');
    expect(prompt).not.toContain('www.linkedin.com/in/janedoe');
    expect(prompt).toContain('[REDACTED_DOCUMENT]');
    expect(prompt).toContain('[REDACTED_ADDRESS]');
    expect(prompt).toContain('[REDACTED_URL]');
  });

  it('sends raw prompt data when redaction is explicitly disabled', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          output_text: JSON.stringify({
            score: 7,
            summary: 'Summary',
            strengths: ['Strength'],
            gaps: ['Gap'],
            recommendations: ['Recommendation'],
            rewrittenBullets: ['Bullet'],
          }),
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          output_text: JSON.stringify({
            rewrittenCv: 'Rewritten CV',
            coverLetter: 'Cover letter',
            interviewQa: [
              { question: 'Question', suggestedAnswer: 'Suggested answer' },
            ],
          }),
        }),
      } as Response);

    await openaiProvider.reviewCandidateCv(
      { ...config, redactSensitiveData: false },
      {
        jobTitle: 'Frontend Engineer',
        jobDescription: 'Contact at jane.doe@example.com',
        cvText: 'Name: Jane Doe\nEmail: jane.doe@example.com',
      },
    );

    const requestBody = parseRequestBody(fetchMock.mock.calls[0]?.[1]);
    const prompt = String(requestBody.input);

    expect(prompt).toContain('Jane Doe');
    expect(prompt).toContain('jane.doe@example.com');
    expect(prompt).not.toContain('[REDACTED_EMAIL]');
    expect(prompt).not.toContain('[REDACTED_NAME]');
  });
});

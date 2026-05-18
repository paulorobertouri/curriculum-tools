import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AiConfig } from '@/domain/aiTypes';
import { deepseekProvider } from '@/providers/deepseekProvider';
import { geminiProvider } from '@/providers/geminiProvider';
import { openaiProvider } from '@/providers/openaiProvider';

const config: AiConfig = {
  provider: 'openai',
  apiKey: 'test-key',
  model: 'test-model',
  savedAt: '2026-05-15T00:00:00.000Z',
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
});

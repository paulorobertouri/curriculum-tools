import { describe, expect, it, vi } from 'vitest';

import { AiConfig } from '@/common/core/aiTypes';
import {
  listProviderModelsUseCase,
  testProviderConnectionUseCase,
} from '@/provider/providerSetupUseCases';

const config: AiConfig = {
  provider: 'openai',
  apiKey: 'key',
  model: 'gpt-5.4-mini',
  savedAt: '2026-05-18T00:00:00.000Z',
};

const mockAdapter = {
  testConnection: vi.fn(),
  listModels: vi.fn(),
  reviewCandidateCv: vi.fn(),
  rankHrCvs: vi.fn(),
};

vi.mock('@/provider', () => ({
  getProviderAdapter: vi.fn(() => mockAdapter),
}));

describe('providerSetupUseCases', () => {
  it('delegates provider connection tests to provider adapter', async () => {
    mockAdapter.testConnection.mockResolvedValue({
      ok: true,
      message: 'ok',
    });

    await expect(testProviderConnectionUseCase(config)).resolves.toEqual({
      ok: true,
      message: 'ok',
    });
    expect(mockAdapter.testConnection).toHaveBeenCalledWith(config, undefined);
  });

  it('lists models when provider supports listing', async () => {
    mockAdapter.listModels.mockResolvedValue(['a-model', 'b-model']);

    await expect(listProviderModelsUseCase(config)).resolves.toEqual({
      supported: true,
      models: ['a-model', 'b-model'],
    });
  });

  it('returns unsupported when listModels is absent', async () => {
    const providers = await import('@/provider');
    vi.mocked(providers.getProviderAdapter).mockReturnValue({
      testConnection: mockAdapter.testConnection,
      reviewCandidateCv: mockAdapter.reviewCandidateCv,
      rankHrCvs: mockAdapter.rankHrCvs,
    });

    await expect(listProviderModelsUseCase(config)).resolves.toEqual({
      supported: false,
      models: [],
    });
  });
});

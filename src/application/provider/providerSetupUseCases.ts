import { AiConfig, TestResult } from '@/domain/aiTypes';
import { getProviderAdapter } from '@/presentation/providers';

export type ProviderModelsResult = {
  supported: boolean;
  models: string[];
};

export const testProviderConnectionUseCase = async (
  config: AiConfig,
  signal?: AbortSignal,
): Promise<TestResult> =>
  getProviderAdapter(config.provider).testConnection(config, signal);

export const listProviderModelsUseCase = async (
  config: AiConfig,
  signal?: AbortSignal,
): Promise<ProviderModelsResult> => {
  const adapter = getProviderAdapter(config.provider);

  if (!adapter.listModels) {
    return { supported: false, models: [] };
  }

  const models = await adapter.listModels(config, signal);
  return { supported: true, models };
};

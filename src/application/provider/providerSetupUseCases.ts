import { AiConfig, TestResult } from '@/domain/aiTypes';
import { getProviderAdapter } from '@/providers';

export type ProviderModelsResult = {
  supported: boolean;
  models: string[];
};

export const testProviderConnectionUseCase = async (
  config: AiConfig,
): Promise<TestResult> =>
  getProviderAdapter(config.provider).testConnection(config);

export const listProviderModelsUseCase = async (
  config: AiConfig,
): Promise<ProviderModelsResult> => {
  const adapter = getProviderAdapter(config.provider);

  if (!adapter.listModels) {
    return { supported: false, models: [] };
  }

  const models = await adapter.listModels(config);
  return { supported: true, models };
};

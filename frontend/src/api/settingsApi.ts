import { apiRequest } from './client';
import { ConnectionTestResponse, SettingsResponse } from '../types';

export const settingsApi = {
  async getSettings(): Promise<SettingsResponse> {
    return apiRequest('/api/settings');
  },

  async testConnection(
    baseUrl?: string,
    model?: string
  ): Promise<ConnectionTestResponse> {
    return apiRequest('/api/settings/test-connection', {
      method: 'POST',
      body: JSON.stringify({
        ollama_base_url: baseUrl,
        ollama_model: model,
      }),
    });
  },

  async getModelStatus(): Promise<ConnectionTestResponse> {
    return apiRequest('/api/model/status');
  },
};

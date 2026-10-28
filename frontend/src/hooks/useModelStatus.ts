import { useState, useEffect, useCallback } from 'react';
import { ConnectionTestResponse } from '../types';
import { settingsApi } from '../api/settingsApi';

export function useModelStatus() {
  const [status, setStatus] = useState<ConnectionTestResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await settingsApi.getModelStatus();
      setStatus(data);
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Failed to check model status');
      setStatus({
        reachable: false,
        model_available: false,
        installed_models: [],
        message: 'Ollama service is unreachable on localhost',
        is_local: true,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    status,
    loading,
    error,
    refreshStatus: checkStatus,
  };
}

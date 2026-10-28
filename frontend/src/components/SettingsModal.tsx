import React, { useState, useEffect } from 'react';
import {
  X,
  Server,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { settingsApi } from '../api/settingsApi';
import { ConnectionTestResponse } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyEnabled: boolean;
  onToggleHistory: (enabled: boolean) => void;
  onClearHistory: () => void;
  historyCount: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  historyEnabled,
  onToggleHistory,
  onClearHistory,
  historyCount,
}) => {
  const [baseUrl, setBaseUrl] = useState('http://127.0.0.1:11434');
  const [model, setModel] = useState('qwen3.5:4b');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResponse | null>(null);
  const [clearedNotice, setClearedNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      settingsApi.getSettings().then((s) => {
        setBaseUrl(s.ollama_base_url);
        setModel(s.ollama_model);
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await settingsApi.testConnection(baseUrl, model);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        reachable: false,
        model_available: false,
        installed_models: [],
        message: err?.detail || 'Connection failed',
        is_local: true,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearHistory = () => {
    onClearHistory();
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 2000);
  };

  const isRemote =
    baseUrl.length > 0 &&
    !baseUrl.includes('127.0.0.1') &&
    !baseUrl.includes('localhost') &&
    !baseUrl.includes('0.0.0.0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-rg-panel border border-rg-border rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl text-rg-text">
        {/* Header */}
        <div className="p-4 border-b border-rg-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-rg-accent" />
            <h2 className="text-sm font-bold">RepoGuard Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-rg-muted hover:text-rg-text hover:bg-rg-surface rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Remote Endpoint Security Warning */}
          {isRemote && (
            <div className="p-3 bg-rg-warning/10 border border-rg-warning/30 rounded-lg flex items-start gap-2.5 text-rg-warning">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Remote Host Warning:</strong> You have configured a remote non-localhost endpoint. Code diffs sent for review will leave your local machine over the network.
              </div>
            </div>
          )}

          {/* Ollama Endpoint Field */}
          <div>
            <label className="block text-[11px] font-semibold text-rg-muted uppercase tracking-wider mb-1">
              Ollama Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://127.0.0.1:11434"
              className="w-full bg-rg-bg border border-rg-border rounded-lg px-3 py-2 text-xs font-mono text-rg-text focus:outline-none focus:border-rg-accent"
            />
            <p className="text-[11px] text-rg-muted mt-1">
              Must be accessible via localhost/127.0.0.1 for local privacy.
            </p>
          </div>

          {/* Ollama Model Field */}
          <div>
            <label className="block text-[11px] font-semibold text-rg-muted uppercase tracking-wider mb-1">
              Model Name
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="qwen3.5:4b"
              className="w-full bg-rg-bg border border-rg-border rounded-lg px-3 py-2 text-xs font-mono text-rg-text focus:outline-none focus:border-rg-accent"
            />
            <p className="text-[11px] text-rg-muted mt-1">
              Default is <strong>qwen3.5:4b</strong>. Run <code>ollama pull qwen3.5:4b</code> if not installed.
            </p>
          </div>

          {/* Test Connection Button & Result */}
          <div className="pt-1">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rg-surface hover:bg-rg-border border border-rg-border font-medium text-rg-text transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? 'Testing Endpoint...' : 'Test Connection'}
            </button>

            {testResult && (
              <div
                className={`mt-2.5 p-3 rounded-lg border text-xs ${
                  testResult.reachable && testResult.model_available
                    ? 'bg-rg-accent/10 border-rg-accent/30 text-rg-accent'
                    : testResult.reachable
                    ? 'bg-rg-warning/10 border-rg-warning/30 text-rg-warning'
                    : 'bg-rg-error/10 border-rg-error/30 text-rg-error'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  {testResult.reachable && testResult.model_available ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span>{testResult.message}</span>
                </div>
                {testResult.installed_models.length > 0 && (
                  <div className="text-[11px] opacity-90 mt-1">
                    Installed models: {testResult.installed_models.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Opt-in History Preference */}
          <div className="pt-3 border-t border-rg-border space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-rg-text">Review History</h4>
                <p className="text-[11px] text-rg-muted">
                  Opt-in browser storage. By default, no review data is saved.
                </p>
              </div>
              <input
                type="checkbox"
                checked={historyEnabled}
                onChange={(e) => onToggleHistory(e.target.checked)}
                className="w-4 h-4 rounded border-rg-border bg-rg-bg text-rg-accent focus:ring-0 cursor-pointer"
              />
            </div>

            {historyCount > 0 && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-rg-muted">
                  {historyCount} saved review summary/summaries.
                </span>
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-1 text-[11px] text-rg-error hover:underline font-medium"
                >
                  <Trash2 className="w-3 h-3" />
                  {clearedNotice ? 'Cleared!' : 'Clear History'}
                </button>
              </div>
            )}
          </div>

          {/* Privacy Architecture Notice */}
          <div className="p-3 bg-rg-surface/60 border border-rg-border rounded-lg space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-rg-accent text-xs">
              <Lock className="w-3.5 h-3.5" />
              Privacy Architecture Guarantees
            </div>
            <ul className="list-disc list-inside text-[11px] text-rg-muted space-y-1">
              <li>Inference runs strictly on your machine via local Ollama daemon.</li>
              <li>Untrusted code in diffs is isolated in sandbox boundary tags.</li>
              <li>Model responses are cross-validated against real diff line numbers.</li>
              <li>No telemetry, tracking, or cloud sync is active.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-rg-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-rg-accent hover:bg-rg-accent/90 text-rg-bg font-semibold rounded-lg text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

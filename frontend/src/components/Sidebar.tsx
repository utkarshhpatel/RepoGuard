import React from 'react';
import {
  ShieldCheck,
  PlusCircle,
  PlayCircle,
  History,
  Settings,
  Lock,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { ConnectionTestResponse } from '../types';

interface SidebarProps {
  onNewReview: () => void;
  onLoadSample: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  modelStatus: ConnectionTestResponse | null;
  modelLoading: boolean;
  onRefreshModel: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onNewReview,
  onLoadSample,
  onOpenSettings,
  onOpenHistory,
  historyCount,
  modelStatus,
  modelLoading,
  onRefreshModel,
  isMobileOpen,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-rg-panel border-r border-rg-border flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-rg-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rg-accent/15 border border-rg-accent/30 flex items-center justify-center text-rg-accent">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-rg-text flex items-center gap-1.5">
                RepoGuard
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-rg-surface border border-rg-border text-rg-accent">
                  v1.0
                </span>
              </h1>
              <p className="text-[11px] text-rg-muted truncate">
                Local-first AI reviewer
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          <button
            onClick={() => {
              onNewReview();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg text-rg-text hover:bg-rg-surface border border-transparent hover:border-rg-border transition-colors text-left"
          >
            <PlusCircle className="w-4 h-4 text-rg-accent" />
            New Review
          </button>

          <button
            onClick={() => {
              onLoadSample();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg text-rg-text hover:bg-rg-surface border border-transparent hover:border-rg-border transition-colors text-left group"
          >
            <PlayCircle className="w-4 h-4 text-rg-info group-hover:text-rg-accent transition-colors" />
            <span>Load Demo Diff</span>
            <span className="ml-auto text-[10px] font-mono bg-rg-info/10 text-rg-info px-1.5 py-0.5 rounded">
              Demo
            </span>
          </button>

          <button
            onClick={() => {
              onOpenHistory();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg text-rg-muted hover:text-rg-text hover:bg-rg-surface border border-transparent hover:border-rg-border transition-colors text-left"
          >
            <History className="w-4 h-4" />
            <span>Saved History</span>
            {historyCount > 0 && (
              <span className="ml-auto text-xs px-1.5 py-0.2 rounded-full bg-rg-surface border border-rg-border text-rg-text">
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onOpenSettings();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg text-rg-muted hover:text-rg-text hover:bg-rg-surface border border-transparent hover:border-rg-border transition-colors text-left"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          {/* Privacy Guarantee Box */}
          <div className="mt-4 pt-4 border-t border-rg-border/60">
            <div className="p-3 bg-rg-surface/70 border border-rg-border rounded-lg">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rg-text mb-1">
                <Lock className="w-3.5 h-3.5 text-rg-accent" />
                Local Privacy
              </div>
              <p className="text-[11px] text-rg-muted leading-relaxed">
                Code never leaves localhost. No external AI APIs, zero tracking telemetry, and no account required.
              </p>
            </div>
          </div>
        </div>

        {/* Footer: Model Connection Status */}
        <div className="p-3 border-t border-rg-border bg-rg-surface/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-rg-muted flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              Ollama Engine
            </span>
            <button
              onClick={onRefreshModel}
              disabled={modelLoading}
              title="Refresh connection status"
              className="p-1 text-rg-muted hover:text-rg-text hover:bg-rg-surface rounded transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${modelLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {modelStatus?.reachable ? (
              modelStatus.model_available ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-rg-accent animate-pulse" />
                  <span className="text-rg-text font-mono truncate" title={modelStatus.message}>
                    qwen3.5:4b (Ready)
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-rg-warning" />
                  <span className="text-rg-warning truncate" title={modelStatus.message}>
                    Model Missing
                  </span>
                </>
              )
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rg-error" />
                <span className="text-rg-muted truncate" title={modelStatus?.message || 'Offline'}>
                  Offline (Use Demo)
                </span>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

import React from 'react';
import {
  Menu,
  Download,
  Plus,
  Bot,
  Sparkles,
  FileCode,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { ReviewResult, DiffParseResult } from '../types';
import { ReviewStatus } from '../hooks/useReview';

interface TopBarProps {
  onToggleMobileMenu: () => void;
  reviewResult: ReviewResult | null;
  parsedDiff: DiffParseResult | null;
  status: ReviewStatus;
  onNewReview: () => void;
  onOpenExport: () => void;
  modelName?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleMobileMenu,
  reviewResult,
  parsedDiff,
  status,
  onNewReview,
  onOpenExport,
  modelName,
}) => {
  const isDemo = reviewResult?.mode === 'demo';

  return (
    <header className="h-14 bg-rg-panel border-b border-rg-border px-4 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 text-rg-muted hover:text-rg-text hover:bg-rg-surface rounded-lg"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-rg-muted hidden sm:inline" />
          <span className="text-sm font-semibold text-rg-text">
            {parsedDiff?.total_files
              ? `${parsedDiff.total_files} file(s) loaded`
              : 'Workspace'}
          </span>

          {parsedDiff && parsedDiff.total_files > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-mono ml-1">
              <span className="text-rg-accent bg-rg-accent/10 px-1.5 py-0.5 rounded">
                +{parsedDiff.total_additions}
              </span>
              <span className="text-rg-error bg-rg-error/10 px-1.5 py-0.5 rounded">
                -{parsedDiff.total_deletions}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Middle Status Indicator */}
      <div className="hidden md:flex items-center gap-2">
        {status === 'reviewing' && (
          <div className="flex items-center gap-1.5 text-xs text-rg-info bg-rg-info/10 border border-rg-info/20 px-2.5 py-1 rounded-full animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Analyzing Diff with Local Engine...
          </div>
        )}
        {status === 'parsing' && (
          <div className="flex items-center gap-1.5 text-xs text-rg-muted bg-rg-surface border border-rg-border px-2.5 py-1 rounded-full">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Parsing Diff...
          </div>
        )}
        {status === 'completed' && reviewResult && (
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full border ${
                isDemo
                  ? 'bg-rg-info/10 text-rg-info border-rg-info/20'
                  : 'bg-rg-accent/10 text-rg-accent border-rg-accent/20'
              }`}
            >
              {isDemo ? (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Deterministic Demo Mode
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5" />
                  Local AI Review ({modelName || 'qwen2.5-coder:1.5b'})
                </>
              )}
            </span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-1 text-xs text-rg-error bg-rg-error/10 border border-rg-error/20 px-2.5 py-1 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5" />
            Review Interrupted
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {reviewResult && (
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-rg-surface hover:bg-rg-border border border-rg-border text-rg-text transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-rg-accent" />
            <span className="hidden sm:inline">Export Report</span>
          </button>
        )}

        <button
          onClick={onNewReview}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-rg-surface hover:bg-rg-border border border-rg-border text-rg-muted hover:text-rg-text transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New</span>
        </button>
      </div>
    </header>
  );
};

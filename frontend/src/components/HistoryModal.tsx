import React from 'react';
import { X, History, Trash2, ArrowRight } from 'lucide-react';
import { ReviewHistoryItem, ReviewResult } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ReviewHistoryItem[];
  onSelectHistoryItem: (review: ReviewResult) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-rg-panel border border-rg-border rounded-xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl text-rg-text">
        {/* Header */}
        <div className="p-4 border-b border-rg-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-rg-accent" />
            <h2 className="text-sm font-bold">Saved Review History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-rg-muted hover:text-rg-text hover:bg-rg-surface rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of items */}
        <div className="p-4 space-y-2.5 overflow-y-auto flex-1 text-xs">
          {history.length === 0 ? (
            <div className="p-8 text-center text-rg-muted">
              <p className="font-semibold text-rg-text mb-1">No Saved Reviews</p>
              <p className="text-[11px]">
                Enable history in Settings to retain review summaries in this browser session.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const dateStr = new Date(item.timestamp).toLocaleString();
              return (
                <div
                  key={item.id}
                  className="p-3 bg-rg-surface/60 border border-rg-border rounded-lg hover:border-rg-accent/40 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono text-rg-muted">
                        {dateStr}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-rg-bg border border-rg-border text-rg-muted">
                        {item.mode === 'demo' ? 'Demo' : 'Local AI'}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-rg-warning/15 border border-rg-warning/30 text-rg-warning">
                        {item.overall_risk}
                      </span>
                    </div>

                    <div className="text-xs text-rg-text truncate font-medium">
                      {item.summary}
                    </div>

                    <div className="text-[11px] text-rg-muted mt-1 truncate">
                      {item.files_reviewed.length} file(s) • {item.findings_count} finding(s)
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSelectHistoryItem(item.review_result);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-rg-surface hover:bg-rg-border border border-rg-border text-rg-accent hover:text-rg-accent/90 text-xs font-semibold shrink-0 transition-colors"
                  >
                    <span>Load</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-3 border-t border-rg-border flex items-center justify-between">
            <span className="text-[11px] text-rg-muted">
              {history.length} item(s) stored locally
            </span>
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 text-xs text-rg-error hover:underline font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

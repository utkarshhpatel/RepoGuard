import React from 'react';
import { Sparkles, ArrowRight, Cpu } from 'lucide-react';

interface DemoBannerProps {
  isDemo: boolean;
  modelReachable: boolean;
  onRunLocalAI?: () => void;
  onOpenSettings: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  isDemo,
  modelReachable,
  onRunLocalAI,
  onOpenSettings,
}) => {
  if (isDemo) {
    return (
      <div className="bg-rg-info/10 border-b border-rg-info/20 px-4 py-2 flex items-center justify-between text-xs text-rg-info">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0 text-rg-info" />
          <span>
            <strong>Deterministic Demo Mode:</strong> Viewing precomputed sample review findings (zero-division & type safety). No model inference needed.
          </span>
        </div>
        {modelReachable && onRunLocalAI && (
          <button
            onClick={onRunLocalAI}
            className="flex items-center gap-1 font-semibold text-rg-accent hover:underline shrink-0 ml-2"
          >
            <span>Run Live AI Review</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  if (!modelReachable) {
    return (
      <div className="bg-rg-surface border-b border-rg-border px-4 py-2 flex items-center justify-between text-xs text-rg-muted">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 shrink-0 text-rg-warning" />
          <span>
            Local Ollama server is currently offline. You can still test all review features using Demo Mode or start Ollama.
          </span>
        </div>
        <button
          onClick={onOpenSettings}
          className="font-medium text-rg-accent hover:underline shrink-0 ml-2"
        >
          Check Settings
        </button>
      </div>
    );
  }

  return null;
};

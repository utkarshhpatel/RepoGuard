import React from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileCode,
  Cpu,
  Layers,
  Sparkles,
  Bot,
} from 'lucide-react';
import { ReviewResult, OverallRisk } from '../types';

interface ReviewSummaryProps {
  review: ReviewResult;
}

export const ReviewSummary: React.FC<ReviewSummaryProps> = ({ review }) => {
  const isDemo = review.mode === 'demo';

  const criticalCount = review.findings.filter((f) => f.severity === 'critical').length;
  const highCount = review.findings.filter((f) => f.severity === 'high').length;
  const highPriorityTotal = criticalCount + highCount;

  const getRiskBadge = (risk: OverallRisk) => {
    switch (risk) {
      case 'critical':
        return {
          icon: <AlertOctagon className="w-4 h-4 text-rg-error" />,
          label: 'Critical Risk',
          classes: 'bg-rg-error/15 border-rg-error/30 text-rg-error',
        };
      case 'high':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rg-warning" />,
          label: 'High Risk',
          classes: 'bg-rg-warning/15 border-rg-warning/30 text-rg-warning',
        };
      case 'medium':
        return {
          icon: <Info className="w-4 h-4 text-rg-info" />,
          label: 'Medium Risk',
          classes: 'bg-rg-info/15 border-rg-info/30 text-rg-info',
        };
      case 'low':
      default:
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-rg-accent" />,
          label: 'Low Risk',
          classes: 'bg-rg-accent/15 border-rg-accent/30 text-rg-accent',
        };
    }
  };

  const riskBadge = getRiskBadge(review.overall_risk);

  return (
    <div className="p-4 bg-rg-panel border-b border-rg-border space-y-4">
      {/* Top Header: Risk & Mode */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${riskBadge.classes}`}
          >
            {riskBadge.icon}
            <span>{riskBadge.label}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-rg-surface border border-rg-border text-rg-muted">
            {isDemo ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-rg-info" />
                <span>Deterministic Demo</span>
              </>
            ) : (
              <>
                <Bot className="w-3.5 h-3.5 text-rg-accent" />
                <span>Local AI (Ollama)</span>
              </>
            )}
          </div>
        </div>

        <div className="text-[11px] text-rg-muted font-mono">
          Checked {review.files_reviewed.length} file(s)
        </div>
      </div>

      {/* Summary Narrative */}
      <div className="p-3 bg-rg-surface/50 border border-rg-border rounded-lg">
        <p className="text-xs text-rg-text leading-relaxed">
          {review.summary}
        </p>
        {review.risk_justification && (
          <p className="text-[11px] text-rg-muted mt-2 border-t border-rg-border/50 pt-2 font-mono">
            <strong>Risk Assessment:</strong> {review.risk_justification}
          </p>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 bg-rg-surface/40 border border-rg-border rounded-lg">
          <div className="flex items-center gap-1 text-[11px] text-rg-muted mb-1">
            <FileCode className="w-3.5 h-3.5" />
            <span>Files Reviewed</span>
          </div>
          <div className="text-lg font-bold font-mono text-rg-text">
            {review.files_reviewed.length}
          </div>
        </div>

        <div className="p-2.5 bg-rg-surface/40 border border-rg-border rounded-lg">
          <div className="flex items-center gap-1 text-[11px] text-rg-muted mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Total Findings</span>
          </div>
          <div className="text-lg font-bold font-mono text-rg-text">
            {review.findings.length}
          </div>
        </div>

        <div className="p-2.5 bg-rg-surface/40 border border-rg-border rounded-lg">
          <div className="flex items-center gap-1 text-[11px] text-rg-muted mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rg-warning" />
            <span>High Priority</span>
          </div>
          <div
            className={`text-lg font-bold font-mono ${
              highPriorityTotal > 0 ? 'text-rg-warning' : 'text-rg-text'
            }`}
          >
            {highPriorityTotal}
          </div>
        </div>

        <div className="p-2.5 bg-rg-surface/40 border border-rg-border rounded-lg">
          <div className="flex items-center gap-1 text-[11px] text-rg-muted mb-1">
            <Cpu className="w-3.5 h-3.5 text-rg-accent" />
            <span>Checks Run</span>
          </div>
          <div className="text-lg font-bold font-mono text-rg-accent truncate" title={review.checks_performed.join(', ')}>
            {review.checks_performed.length}
          </div>
        </div>
      </div>
    </div>
  );
};

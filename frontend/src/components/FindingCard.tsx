import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  Bot,
  Terminal,
} from 'lucide-react';
import { Finding, Severity } from '../types';

interface FindingCardProps {
  finding: Finding;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  isExpanded,
  onToggleExpand,
}) => {
  const [copiedFix, setCopiedFix] = useState(false);
  const [copiedTest, setCopiedTest] = useState(false);
  const [copiedEvidence, setCopiedEvidence] = useState(false);

  const copyToClipboard = async (
    text: string,
    setCopied: (v: boolean) => void
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case 'critical':
        return {
          icon: <AlertOctagon className="w-3.5 h-3.5 text-rg-error" />,
          label: 'Critical',
          classes: 'bg-rg-error/15 border-rg-error/30 text-rg-error',
        };
      case 'high':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rg-warning" />,
          label: 'High',
          classes: 'bg-rg-warning/15 border-rg-warning/30 text-rg-warning',
        };
      case 'medium':
        return {
          icon: <Info className="w-3.5 h-3.5 text-rg-info" />,
          label: 'Medium',
          classes: 'bg-rg-info/15 border-rg-info/30 text-rg-info',
        };
      case 'low':
      case 'informational':
      default:
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-rg-accent" />,
          label: severity,
          classes: 'bg-rg-accent/15 border-rg-accent/30 text-rg-accent',
        };
    }
  };

  const sev = getSeverityBadge(finding.severity);

  return (
    <div
      className={`border rounded-xl transition-all ${
        isExpanded
          ? 'bg-rg-panel border-rg-border shadow-md'
          : 'bg-rg-surface/60 hover:bg-rg-surface border-rg-border/80'
      }`}
    >
      {/* Header Row (Clickable) */}
      <button
        onClick={onToggleExpand}
        className="w-full p-3.5 flex items-start justify-between gap-3 text-left focus:outline-none"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`mt-0.5 p-1 rounded-md border flex items-center justify-center shrink-0 ${sev.classes}`}
          >
            {sev.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-bold text-rg-text truncate">
                {finding.title}
              </span>

              {/* Source Badge */}
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rg-bg border border-rg-border text-rg-muted flex items-center gap-1">
                {finding.source_type === 'deterministic' ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-rg-accent" />
                    Static Check
                  </>
                ) : (
                  <>
                    <Bot className="w-3 h-3 text-rg-info" />
                    Local AI
                  </>
                )}
              </span>

              {/* Verification Status */}
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  finding.verification_status === 'verified'
                    ? 'bg-rg-accent/10 border-rg-accent/30 text-rg-accent'
                    : 'bg-rg-muted/10 border-rg-border text-rg-muted'
                }`}
              >
                {finding.verification_status === 'verified'
                  ? 'Verified in Diff'
                  : 'Unverified Location'}
              </span>

              {/* Category */}
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rg-surface border border-rg-border text-rg-muted">
                {finding.category}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-rg-muted">
              <FileCode className="w-3.5 h-3.5 text-rg-muted shrink-0" />
              <span className="truncate">{finding.file_path}</span>
              {finding.line_number != null ? (
                <span className="text-rg-text font-semibold">
                  :line {finding.line_number}
                </span>
              ) : (
                <span className="text-rg-muted/70">(line unmapped)</span>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 p-1 text-rg-muted hover:text-rg-text transition-colors">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Expanded Details Body */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-rg-border/60 space-y-3.5 text-xs">
          {/* Description */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-rg-muted mb-1">
              Explanation
            </h4>
            <p className="text-rg-text leading-relaxed">
              {finding.description}
            </p>
          </div>

          {/* Evidence */}
          {finding.evidence && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-rg-muted">
                  Diff Evidence
                </h4>
                <button
                  onClick={() =>
                    copyToClipboard(finding.evidence, setCopiedEvidence)
                  }
                  className="flex items-center gap-1 text-[11px] text-rg-muted hover:text-rg-text transition-colors"
                >
                  {copiedEvidence ? (
                    <Check className="w-3 h-3 text-rg-accent" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedEvidence ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-2.5 bg-rg-bg border border-rg-border rounded-lg font-mono text-xs overflow-x-auto text-rg-warning/90 whitespace-pre">
                {finding.evidence}
              </pre>
            </div>
          )}

          {/* Impact and Conditions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {finding.impact && (
              <div className="p-2.5 bg-rg-surface/50 border border-rg-border rounded-lg">
                <span className="font-semibold text-rg-text block mb-1">
                  Why this matters:
                </span>
                <span className="text-rg-muted">{finding.impact}</span>
              </div>
            )}
            {finding.conditions && (
              <div className="p-2.5 bg-rg-surface/50 border border-rg-border rounded-lg">
                <span className="font-semibold text-rg-text block mb-1">
                  Trigger conditions:
                </span>
                <span className="text-rg-muted">{finding.conditions}</span>
              </div>
            )}
          </div>

          {/* Suggested Fix */}
          {finding.suggested_fix && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-rg-accent">
                    Suggested Fix
                  </h4>
                  <span className="text-[10px] text-rg-muted italic">
                    (Advisory — Review before applying)
                  </span>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(finding.suggested_fix, setCopiedFix)
                  }
                  className="flex items-center gap-1 text-[11px] text-rg-muted hover:text-rg-text transition-colors"
                >
                  {copiedFix ? (
                    <Check className="w-3 h-3 text-rg-accent" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedFix ? 'Copied Fix' : 'Copy Fix'}</span>
                </button>
              </div>
              <pre className="p-3 bg-rg-bg border border-rg-border rounded-lg font-mono text-xs overflow-x-auto text-rg-text whitespace-pre leading-relaxed">
                {finding.suggested_fix}
              </pre>
            </div>
          )}

          {/* Suggested Regression Test */}
          {finding.suggested_test && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-rg-info" />
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-rg-info">
                    Suggested Regression Test
                  </h4>
                  <span className="text-[10px] text-rg-muted italic">
                    (Not automatically executed)
                  </span>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(finding.suggested_test, setCopiedTest)
                  }
                  className="flex items-center gap-1 text-[11px] text-rg-muted hover:text-rg-text transition-colors"
                >
                  {copiedTest ? (
                    <Check className="w-3 h-3 text-rg-accent" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedTest ? 'Copied Test' : 'Copy Test'}</span>
                </button>
              </div>
              <pre className="p-3 bg-rg-bg border border-rg-border rounded-lg font-mono text-xs overflow-x-auto text-rg-text whitespace-pre leading-relaxed">
                {finding.suggested_test}
              </pre>
            </div>
          )}

          {/* Confidence footer */}
          <div className="pt-2 border-t border-rg-border/40 flex items-center justify-between text-[11px] text-rg-muted">
            <span>
              Confidence rating: <strong>{finding.confidence_label}</strong> (heuristic estimate)
            </span>
            <span className="text-rg-muted/70">ID: {finding.id}</span>
          </div>
        </div>
      )}
    </div>
  );
};

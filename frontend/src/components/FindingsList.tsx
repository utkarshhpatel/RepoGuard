import React, { useState } from 'react';
import { Finding, SeverityFilterType } from '../types';
import { FindingCard } from './FindingCard';
import { CheckCircle2, Filter } from 'lucide-react';

interface FindingsListProps {
  findings: Finding[];
  currentFilter: SeverityFilterType;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
}

export const FindingsList: React.FC<FindingsListProps> = ({
  findings,
  currentFilter,
  expandedId,
  onToggleExpand,
}) => {
  const [expandAll, setExpandAll] = useState(false);

  // Filter findings
  const filteredFindings = findings.filter((f) => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'deterministic') return f.source_type === 'deterministic';
    if (currentFilter === 'ai') return f.source_type === 'ai';
    return f.severity === currentFilter;
  });

  if (findings.length === 0) {
    return (
      <div className="p-8 text-center text-rg-muted flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-rg-accent/10 border border-rg-accent/30 text-rg-accent flex items-center justify-center mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-rg-text mb-1">
          No Actionable Defects Identified
        </h3>
        <p className="text-xs max-w-sm">
          Both static deterministic checks and local AI found no critical bugs, vulnerabilities, or safety regressions in the submitted diff.
        </p>
      </div>
    );
  }

  if (filteredFindings.length === 0) {
    return (
      <div className="p-8 text-center text-rg-muted flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-rg-surface border border-rg-border flex items-center justify-center mb-2">
          <Filter className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-semibold text-rg-text mb-1">
          No findings matching &quot;{currentFilter}&quot;
        </h4>
        <p className="text-[11px]">
          Try selecting another filter or choose &quot;All&quot; to inspect all {findings.length} findings.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 flex-1 overflow-y-auto">
      <div className="flex items-center justify-between text-xs text-rg-muted px-1">
        <span>
          Showing <strong>{filteredFindings.length}</strong> of{' '}
          {findings.length} findings
        </span>
        <button
          onClick={() => setExpandAll(!expandAll)}
          className="text-[11px] text-rg-accent hover:underline font-medium"
        >
          {expandAll ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      <div className="space-y-2.5">
        {filteredFindings.map((finding) => (
          <FindingCard
            key={finding.id}
            finding={finding}
            isExpanded={expandAll || expandedId === finding.id}
            onToggleExpand={() => onToggleExpand(finding.id)}
          />
        ))}
      </div>
    </div>
  );
};

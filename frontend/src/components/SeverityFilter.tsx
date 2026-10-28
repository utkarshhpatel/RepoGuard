import React from 'react';
import { SeverityFilterType, Finding } from '../types';

interface SeverityFilterProps {
  currentFilter: SeverityFilterType;
  onSelectFilter: (filter: SeverityFilterType) => void;
  findings: Finding[];
}

export const SeverityFilter: React.FC<SeverityFilterProps> = ({
  currentFilter,
  onSelectFilter,
  findings,
}) => {
  const getCount = (type: SeverityFilterType): number => {
    if (type === 'all') return findings.length;
    if (type === 'deterministic') return findings.filter((f) => f.source_type === 'deterministic').length;
    if (type === 'ai') return findings.filter((f) => f.source_type === 'ai').length;
    return findings.filter((f) => f.severity === type).length;
  };

  const filters: { id: SeverityFilterType; label: string; activeClass: string }[] = [
    { id: 'all', label: 'All', activeClass: 'bg-rg-text text-rg-bg' },
    { id: 'critical', label: 'Critical', activeClass: 'bg-rg-error text-rg-bg' },
    { id: 'high', label: 'High', activeClass: 'bg-rg-warning text-rg-bg' },
    { id: 'medium', label: 'Medium', activeClass: 'bg-rg-info text-rg-bg' },
    { id: 'low', label: 'Low', activeClass: 'bg-rg-accent text-rg-bg' },
    { id: 'informational', label: 'Info', activeClass: 'bg-rg-muted text-rg-bg' },
    { id: 'deterministic', label: 'Static Rules', activeClass: 'bg-rg-accent/80 text-rg-bg' },
    { id: 'ai', label: 'AI Inferred', activeClass: 'bg-rg-info/80 text-rg-bg' },
  ];

  return (
    <div className="flex items-center gap-1.5 p-3 border-b border-rg-border bg-rg-panel/80 overflow-x-auto">
      {filters.map((filter) => {
        const count = getCount(filter.id);
        const isSelected = currentFilter === filter.id;

        return (
          <button
            key={filter.id}
            onClick={() => onSelectFilter(filter.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
              isSelected
                ? `${filter.activeClass} font-semibold shadow-sm`
                : 'bg-rg-surface hover:bg-rg-border text-rg-muted hover:text-rg-text border border-rg-border'
            }`}
          >
            <span>{filter.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isSelected
                  ? 'bg-black/20 text-current'
                  : 'bg-rg-bg text-rg-muted'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

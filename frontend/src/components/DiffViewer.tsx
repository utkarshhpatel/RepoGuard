import React from 'react';
import { ParsedFile, Finding } from '../types';
import { AlertCircle } from 'lucide-react';

interface DiffViewerProps {
  file: ParsedFile | null;
  findings: Finding[];
  onSelectFinding?: (findingId: string) => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  file,
  findings,
  onSelectFinding,
}) => {
  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-rg-muted text-xs">
        No file selected or diff empty.
      </div>
    );
  }

  // Map findings by line number for quick inline indicators
  const findingsByLine = new Map<number, Finding[]>();
  for (const f of findings) {
    if (f.file_path === file.new_path && f.line_number != null) {
      const existing = findingsByLine.get(f.line_number) || [];
      existing.push(f);
      findingsByLine.set(f.line_number, existing);
    }
  }

  return (
    <div className="flex-1 overflow-auto bg-rg-bg font-mono text-xs select-text">
      <div className="p-2 bg-rg-surface/40 border-b border-rg-border flex items-center justify-between text-rg-muted text-[11px]">
        <div className="truncate">
          <strong>Path:</strong> {file.new_path}
          {file.old_path !== file.new_path && ` (from ${file.old_path})`}
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-rg-accent font-semibold">+{file.additions} added</span>
          <span className="text-rg-error font-semibold">-{file.deletions} removed</span>
        </div>
      </div>

      <div className="divide-y divide-rg-border/30">
        {file.hunks.map((hunk, hIdx) => (
          <div key={`hunk-${hIdx}`} className="diff-hunk">
            {/* Hunk Header */}
            <div className="bg-rg-surface/80 text-rg-info px-4 py-1 text-[11px] font-semibold border-y border-rg-border/40 select-none flex items-center justify-between">
              <span>{hunk.header}</span>
              <span className="text-rg-muted font-normal text-[10px]">
                Lines {hunk.new_start} - {hunk.new_start + hunk.new_lines - 1}
              </span>
            </div>

            {/* Lines in hunk */}
            <div className="divide-y divide-rg-border/10">
              {hunk.lines.map((line, lIdx) => {
                const isAdd = line.line_type === 'add';
                const isDel = line.line_type === 'del';
                const isHeader = line.line_type === 'header';

                const lineFindings = line.new_line_number
                  ? findingsByLine.get(line.new_line_number)
                  : undefined;

                return (
                  <div
                    key={`line-${hIdx}-${lIdx}`}
                    className={`flex items-start transition-colors ${
                      isAdd
                        ? 'bg-rg-accent/10 hover:bg-rg-accent/15 text-rg-text'
                        : isDel
                        ? 'bg-rg-error/10 hover:bg-rg-error/15 text-rg-muted'
                        : isHeader
                        ? 'bg-rg-surface/30 text-rg-muted italic'
                        : 'hover:bg-rg-surface/30 text-rg-text'
                    } ${lineFindings ? 'border-l-4 border-l-rg-warning bg-rg-warning/5' : ''}`}
                  >
                    {/* Old line number */}
                    <div className="w-10 py-0.5 px-2 text-right text-[10px] text-rg-muted/60 select-none border-r border-rg-border/20">
                      {line.old_line_number ?? ''}
                    </div>

                    {/* New line number */}
                    <div className="w-10 py-0.5 px-2 text-right text-[10px] text-rg-muted/60 select-none border-r border-rg-border/20">
                      {line.new_line_number ?? ''}
                    </div>

                    {/* Type Sign (+ / - / space) */}
                    <div
                      className={`w-6 py-0.5 text-center font-bold select-none ${
                        isAdd
                          ? 'text-rg-accent'
                          : isDel
                          ? 'text-rg-error'
                          : 'text-rg-muted/40'
                      }`}
                    >
                      {isAdd ? '+' : isDel ? '-' : ' '}
                    </div>

                    {/* Code Content */}
                    <div className="flex-1 py-0.5 px-2 overflow-x-auto whitespace-pre">
                      {line.content || ' '}
                    </div>

                    {/* Inline finding alert if any */}
                    {lineFindings && lineFindings.length > 0 && (
                      <div className="px-2 py-0.5 shrink-0 flex items-center gap-1 select-none">
                        {lineFindings.map((finding) => (
                          <button
                            key={finding.id}
                            onClick={() => onSelectFinding?.(finding.id)}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold bg-rg-warning/20 border border-rg-warning/40 text-rg-warning hover:bg-rg-warning/30 transition-colors"
                            title={`Line ${line.new_line_number}: ${finding.title}`}
                          >
                            <AlertCircle className="w-3 h-3" />
                            <span>Finding</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

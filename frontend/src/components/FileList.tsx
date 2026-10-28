import React from 'react';
import { FileCode, FilePlus, FileX, RefreshCw } from 'lucide-react';
import { ParsedFile } from '../types';

interface FileListProps {
  files: ParsedFile[];
  selectedIndex: number;
  onSelectFile: (index: number) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  selectedIndex,
  onSelectFile,
}) => {
  if (files.length === 0) return null;

  return (
    <div className="border-b border-rg-border bg-rg-panel/60 overflow-x-auto">
      <div className="flex items-center gap-1 p-2 min-w-max">
        {files.map((file, idx) => {
          const isSelected = idx === selectedIndex;
          const fileName = file.new_path.split('/').pop() || file.new_path;

          return (
            <button
              key={`${file.new_path}-${idx}`}
              onClick={() => onSelectFile(idx)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-colors border ${
                isSelected
                  ? 'bg-rg-surface border-rg-accent/40 text-rg-text font-semibold shadow-sm'
                  : 'bg-transparent border-transparent text-rg-muted hover:text-rg-text hover:bg-rg-surface/40'
              }`}
            >
              {file.status === 'added' ? (
                <FilePlus className="w-3.5 h-3.5 text-rg-accent" />
              ) : file.status === 'deleted' ? (
                <FileX className="w-3.5 h-3.5 text-rg-error" />
              ) : file.status === 'renamed' ? (
                <RefreshCw className="w-3.5 h-3.5 text-rg-warning" />
              ) : (
                <FileCode className="w-3.5 h-3.5 text-rg-info" />
              )}

              <span className="truncate max-w-[180px]" title={file.new_path}>
                {fileName}
              </span>

              <div className="flex items-center gap-1 text-[10px]">
                {file.additions > 0 && (
                  <span className="text-rg-accent font-semibold">+{file.additions}</span>
                )}
                {file.deletions > 0 && (
                  <span className="text-rg-error font-semibold">-{file.deletions}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

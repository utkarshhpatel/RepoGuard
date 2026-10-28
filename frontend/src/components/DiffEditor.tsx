import React, { useRef, useState } from 'react';
import {
  Upload,
  Play,
  FileText,
  AlertCircle,
  Sparkles,
  Bot,
  Loader2,
} from 'lucide-react';
import { ReviewStatus } from '../hooks/useReview';

interface DiffEditorProps {
  diffText: string;
  onDiffChange: (text: string) => void;
  onRunReview: (mode: 'auto' | 'demo' | 'local_ai') => void;
  onLoadSample: () => void;
  status: ReviewStatus;
  modelReachable: boolean;
  modelName: string;
  error: string | null;
}

const MAX_SIZE_BYTES = 1048576; // 1 MB limit

export const DiffEditor: React.FC<DiffEditorProps> = ({
  diffText,
  onDiffChange,
  onRunReview,
  onLoadSample,
  status,
  modelReachable,
  modelName,
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (file: File) => {
    setFileError(null);
    if (!file.name.endsWith('.diff') && !file.name.endsWith('.patch') && !file.name.endsWith('.txt')) {
      setFileError('Supported extensions are .diff, .patch, or .txt.');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setFileError(`File size (${(file.size / 1024).toFixed(1)} KB) exceeds the 1 MB safety limit.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onDiffChange(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const isBusy = status === 'parsing' || status === 'reviewing';

  return (
    <div className="flex flex-col h-full bg-rg-panel border-r border-rg-border">
      {/* Top action header */}
      <div className="p-3 border-b border-rg-border flex flex-wrap items-center justify-between gap-2 bg-rg-surface/40">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-rg-accent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-rg-muted">
            Git Diff Input
          </span>
          {diffText.trim() && (
            <span className="text-[11px] font-mono text-rg-muted">
              ({(new Blob([diffText]).size / 1024).toFixed(1)} KB)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            accept=".diff,.patch,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-rg-surface hover:bg-rg-border border border-rg-border text-rg-muted hover:text-rg-text transition-colors disabled:opacity-50"
            title="Upload unified diff file (up to 1MB)"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Diff
          </button>

          <button
            onClick={onLoadSample}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-rg-info/10 hover:bg-rg-info/20 border border-rg-info/30 text-rg-info transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Load Sample
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {(fileError || error) && (
        <div className="m-3 p-3 bg-rg-error/10 border border-rg-error/20 rounded-lg flex items-start gap-2 text-xs text-rg-error">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Notice:</span> {fileError || error}
          </div>
        </div>
      )}

      {/* Textarea Diff Input Area */}
      <div
        className={`flex-1 p-3 flex flex-col relative ${
          isDragging ? 'bg-rg-accent/5 border-2 border-dashed border-rg-accent' : ''
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <textarea
          value={diffText}
          onChange={(e) => onDiffChange(e.target.value)}
          placeholder={`Paste a unified Git diff here, drop a .diff/.patch file, or click 'Load Sample'...\n\nExample:\ndiff --git a/services/math.py b/services/math.py\n--- a/services/math.py\n+++ b/services/math.py\n@@ -1,3 +1,5 @@\n def divide(a, b):\n+    return a / b`}
          disabled={isBusy}
          className="flex-1 w-full bg-rg-bg border border-rg-border rounded-lg p-3 text-xs font-mono text-rg-text placeholder-rg-muted/50 focus:outline-none focus:border-rg-accent resize-none leading-relaxed selection:bg-rg-accent/20"
          spellCheck={false}
        />
      </div>

      {/* Bottom Review Buttons */}
      <div className="p-3 border-t border-rg-border bg-rg-surface/40 flex items-center justify-between gap-3">
        <div className="text-[11px] text-rg-muted">
          {modelReachable ? (
            <span className="flex items-center gap-1.5 text-rg-accent">
              <Bot className="w-3.5 h-3.5" />
              Local model ready ({modelName})
            </span>
          ) : (
            <span className="text-rg-muted">
              Model offline. Use Demo Review to test workflow.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onRunReview('demo')}
            disabled={isBusy || !diffText.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-rg-surface hover:bg-rg-border border border-rg-border text-rg-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Run precomputed deterministic demo review"
          >
            <Sparkles className="w-3.5 h-3.5 text-rg-info" />
            Demo Review
          </button>

          <button
            onClick={() => onRunReview(modelReachable ? 'local_ai' : 'demo')}
            disabled={isBusy || !diffText.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-rg-accent hover:bg-rg-accent/90 text-rg-bg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBusy ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Reviewing...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                {modelReachable ? 'Run Local AI Review' : 'Run Review'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

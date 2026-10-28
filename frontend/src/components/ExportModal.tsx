import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, FileText, Loader2 } from 'lucide-react';
import { ReviewResult } from '../types';
import { reviewApi } from '../api/reviewApi';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: ReviewResult | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  review,
}) => {
  const [markdown, setMarkdown] = useState<string>('');
  const [filename, setFilename] = useState<string>('repoguard-review.md');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && review) {
      setLoading(true);
      reviewApi
        .exportReview(review)
        .then((res) => {
          setMarkdown(res.markdown_content);
          setFilename(res.filename);
        })
        .catch(() => {
          setMarkdown('# Error generating export.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, review]);

  if (!isOpen || !review) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-rg-panel border border-rg-border rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl text-rg-text">
        {/* Header */}
        <div className="p-4 border-b border-rg-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-rg-accent" />
            <h2 className="text-sm font-bold">Export Markdown Review Report</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-rg-muted hover:text-rg-text hover:bg-rg-surface rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Markdown Preview Area */}
        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-xs text-rg-muted gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-rg-accent" />
              Generating structured Markdown...
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="text-[11px] text-rg-muted mb-2 flex items-center justify-between">
                <span>Markdown output (suitable for GitHub PR comments & review notes):</span>
                <span className="font-mono text-rg-accent">{filename}</span>
              </div>
              <textarea
                readOnly
                value={markdown}
                className="flex-1 w-full bg-rg-bg border border-rg-border rounded-lg p-3 text-xs font-mono text-rg-text resize-none focus:outline-none selection:bg-rg-accent/20"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-rg-border flex items-center justify-between">
          <div className="text-[11px] text-rg-muted">
            {markdown.split('\n').length} lines formatted
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rg-surface hover:bg-rg-border border border-rg-border text-xs font-medium text-rg-text transition-colors disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-rg-accent" />
                  Copied to Clipboard
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Markdown
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rg-accent hover:bg-rg-accent/90 text-xs font-semibold text-rg-bg transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Download .md
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

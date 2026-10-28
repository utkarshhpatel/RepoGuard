import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportModal } from '../src/components/ExportModal';
import { ReviewResult } from '../src/types';
import { reviewApi } from '../src/api/reviewApi';

const mockReview: ReviewResult = {
  summary: 'Export test summary',
  overall_risk: 'high',
  risk_justification: '1 high risk defect',
  files_reviewed: ['calc.py'],
  findings: [
    {
      id: '1',
      title: 'Division by zero',
      severity: 'high',
      category: 'correctness',
      file_path: 'calc.py',
      line_number: 10,
      description: 'Zero div',
      evidence: '10 / 0',
      impact: 'Crash',
      conditions: 'Always',
      suggested_fix: 'guard',
      suggested_test: 'test',
      confidence_label: 'high',
      source_type: 'deterministic',
      verification_status: 'verified',
    },
  ],
  checks_performed: ['DET-DIV0'],
  limitations: ['Test limitation'],
  mode: 'demo',
  total_additions: 5,
  total_deletions: 1,
};

describe('ExportModal Component', () => {
  beforeEach(() => {
    vi.spyOn(reviewApi, 'exportReview').mockResolvedValue({
      markdown_content: '# 🛡️ RepoGuard Code Review Report\n\n## 📋 Executive Summary\nExport test summary',
      filename: 'repoguard-review-high.md',
    });
  });

  it('renders markdown export preview content', async () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={vi.fn()}
        review={mockReview}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText('Export Markdown Review Report')
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toContain('RepoGuard Code Review Report');
      expect(textarea.value).toContain('Export test summary');
    });
  });

  it('copies markdown to clipboard upon click', async () => {
    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText');
    render(
      <ExportModal
        isOpen={true}
        onClose={vi.fn()}
        review={mockReview}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Copy Markdown')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Copy Markdown'));

    await waitFor(() => {
      expect(clipboardSpy).toHaveBeenCalled();
      expect(screen.getByText('Copied to Clipboard')).toBeInTheDocument();
    });
  });
});

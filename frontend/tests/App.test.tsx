import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/App';
import { reviewApi } from '../src/api/reviewApi';
import { settingsApi } from '../src/api/settingsApi';
import { ReviewResult, DiffParseResult } from '../src/types';

const mockSampleDiff = `diff --git a/services/math_service.py b/services/math_service.py
--- a/services/math_service.py
+++ b/services/math_service.py
@@ -1,3 +1,5 @@
 def divide(a, b):
+    return a / b
`;

const mockParsedDiff: DiffParseResult = {
  files: [
    {
      old_path: 'services/math_service.py',
      new_path: 'services/math_service.py',
      status: 'modified',
      additions: 1,
      deletions: 0,
      hunks: [
        {
          header: '@@ -1,3 +1,5 @@',
          old_start: 1,
          old_lines: 3,
          new_start: 1,
          new_lines: 5,
          lines: [
            {
              line_type: 'add',
              content: '    return a / b',
              old_line_number: null,
              new_line_number: 2,
            },
          ],
        },
      ],
      added_lines: [2],
      changed_lines: [2],
    },
  ],
  total_additions: 1,
  total_deletions: 0,
  total_files: 1,
  is_valid: true,
};

const mockReviewResult: ReviewResult = {
  summary: 'Identified uncaught ZeroDivisionError in math service.',
  overall_risk: 'high',
  risk_justification: '1 High risk defect found',
  files_reviewed: ['services/math_service.py'],
  findings: [
    {
      id: 'demo-1',
      title: 'Missing Zero-Denominator Guard',
      severity: 'high',
      category: 'correctness',
      file_path: 'services/math_service.py',
      line_number: 2,
      description: 'Zero denominator causes runtime crash.',
      evidence: 'return a / b',
      impact: 'Worker process abort',
      conditions: 'When b=0',
      suggested_fix: 'if b == 0: raise ValueError()',
      suggested_test: 'def test_zero(): ...',
      confidence_label: 'high',
      source_type: 'deterministic',
      verification_status: 'verified',
    },
  ],
  checks_performed: ['DET-DIV0'],
  limitations: ['Demo mode simulation'],
  mode: 'demo',
  total_additions: 1,
  total_deletions: 0,
};

describe('RepoGuard Full App Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(settingsApi, 'getModelStatus').mockResolvedValue({
      reachable: true,
      model_available: true,
      configured_model: 'qwen2.5-coder:1.5b',
      installed_models: ['qwen2.5-coder:1.5b'],
      message: 'Ollama is online',
      is_local: true,
    });
    vi.spyOn(settingsApi, 'getSettings').mockResolvedValue({
      ollama_base_url: 'http://127.0.0.1:11434',
      ollama_model: 'qwen2.5-coder:1.5b',
      request_timeout_seconds: 120,
      max_diff_size_bytes: 1048576,
      is_local: true,
    });
    vi.spyOn(reviewApi, 'getSampleDiff').mockResolvedValue({
      sample_diff: mockSampleDiff,
      description: 'Sample diff description',
    });
    vi.spyOn(reviewApi, 'parseDiff').mockResolvedValue(mockParsedDiff);
    vi.spyOn(reviewApi, 'runReview').mockResolvedValue(mockReviewResult);
  });

  it('renders initial empty state with title and demo button', async () => {
    render(<App />);

    expect(screen.getByText('RepoGuard')).toBeInTheDocument();
    expect(
      screen.getByText('RepoGuard Review Engine')
    ).toBeInTheDocument();
    expect(
      screen.getByText('1-Click Demo Review (Zero-Division Bug)')
    ).toBeInTheDocument();
  });

  it('runs complete 1-click demo review workflow without errors', async () => {
    render(<App />);

    const demoBtn = screen.getByText('1-Click Demo Review (Zero-Division Bug)');
    fireEvent.click(demoBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Identified uncaught ZeroDivisionError in math service.')
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('Missing Zero-Denominator Guard')
    ).toBeInTheDocument();
    expect(screen.getByText('High Risk')).toBeInTheDocument();
  });

  it('allows switching between Raw Diff Input and Diff Inspector tabs', async () => {
    render(<App />);

    // Load sample diff first
    const loadSampleBtn = screen.getAllByText('Load Sample')[0];
    fireEvent.click(loadSampleBtn);

    await waitFor(() => {
      expect(screen.getByText('Diff Inspector')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Diff Inspector'));

    await waitFor(() => {
      expect(screen.getByText('Path:')).toBeInTheDocument();
      expect(screen.getByText('+1 added')).toBeInTheDocument();
    });
  });
});

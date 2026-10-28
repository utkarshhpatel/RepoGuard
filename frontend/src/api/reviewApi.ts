import { apiRequest } from './client';
import {
  DiffParseResult,
  ReviewResult,
} from '../types';

export const reviewApi = {
  async getSampleDiff(): Promise<{ sample_diff: string; description: string }> {
    return apiRequest('/api/sample-diff');
  },

  async parseDiff(diffText: string): Promise<DiffParseResult> {
    return apiRequest('/api/diff/parse', {
      method: 'POST',
      body: JSON.stringify({ diff_text: diffText }),
    });
  },

  async runReview(
    diffText: string,
    mode: 'auto' | 'demo' | 'local_ai' = 'auto',
    modelOverride?: string
  ): Promise<ReviewResult> {
    return apiRequest('/api/review', {
      method: 'POST',
      body: JSON.stringify({
        diff_text: diffText,
        mode,
        model_override: modelOverride,
      }),
    });
  },

  async exportReview(
    review: ReviewResult
  ): Promise<{ markdown_content: string; filename: string }> {
    return apiRequest('/api/review/export', {
      method: 'POST',
      body: JSON.stringify({ review, format: 'markdown' }),
    });
  },
};

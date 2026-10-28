import { useState, useCallback } from 'react';
import {
  DiffParseResult,
  ReviewResult,
  SeverityFilterType,
} from '../types';
import { reviewApi } from '../api/reviewApi';

export type ReviewStatus =
  | 'ready'
  | 'parsing'
  | 'reviewing'
  | 'completed'
  | 'error';

export function useReview(onReviewComplete?: (result: ReviewResult) => void) {
  const [diffText, setDiffText] = useState<string>('');
  const [parsedDiff, setParsedDiff] = useState<DiffParseResult | null>(null);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [status, setStatus] = useState<ReviewStatus>('ready');
  const [error, setError] = useState<string | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilterType>('all');
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null);

  const loadSampleDiff = useCallback(async (): Promise<string | null> => {
    setStatus('parsing');
    setError(null);
    try {
      const sample = await reviewApi.getSampleDiff();
      setDiffText(sample.sample_diff);
      const parsed = await reviewApi.parseDiff(sample.sample_diff);
      setParsedDiff(parsed);
      setSelectedFileIndex(0);
      setStatus('ready');
      return sample.sample_diff;
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Failed to load sample diff');
      setStatus('error');
      return null;
    }
  }, []);

  const handleDiffChange = useCallback(async (newText: string) => {
    setDiffText(newText);
    setError(null);
    if (!newText.trim()) {
      setParsedDiff(null);
      setReviewResult(null);
      setStatus('ready');
      return;
    }

    try {
      const parsed = await reviewApi.parseDiff(newText);
      setParsedDiff(parsed);
      setSelectedFileIndex(0);
    } catch {
      // Don't mark fatal error while user is actively typing, just clear parsed
      setParsedDiff(null);
    }
  }, []);

  const runReview = useCallback(
    async (
      mode: 'auto' | 'demo' | 'local_ai' = 'auto',
      overrideDiffText?: string
    ) => {
      const textToReview = overrideDiffText !== undefined ? overrideDiffText : diffText;
      if (!textToReview.trim()) {
        setError('Please enter or upload a unified git diff first.');
        return;
      }

      setStatus('reviewing');
      setError(null);

      try {
        const result = await reviewApi.runReview(textToReview, mode);
        setReviewResult(result);
        setStatus('completed');
        if (result.findings.length > 0) {
          setExpandedFindingId(result.findings[0].id);
        }
        if (onReviewComplete) {
          onReviewComplete(result);
        }
      } catch (err: any) {
        setError(err?.detail || err?.message || 'Review failed');
        setStatus('error');
      }
    },
    [diffText, onReviewComplete]
  );

  const reset = useCallback(() => {
    setDiffText('');
    setParsedDiff(null);
    setReviewResult(null);
    setStatus('ready');
    setError(null);
    setSelectedFileIndex(0);
    setExpandedFindingId(null);
  }, []);

  return {
    diffText,
    setDiffText: handleDiffChange,
    parsedDiff,
    reviewResult,
    setReviewResult,
    status,
    error,
    selectedFileIndex,
    setSelectedFileIndex,
    severityFilter,
    setSeverityFilter,
    expandedFindingId,
    setExpandedFindingId,
    loadSampleDiff,
    runReview,
    reset,
  };
}

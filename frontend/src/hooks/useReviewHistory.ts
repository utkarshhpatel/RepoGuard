import { useState, useEffect, useCallback } from 'react';
import { ReviewHistoryItem, ReviewResult } from '../types';

const STORAGE_KEY_ENABLED = 'repoguard_history_enabled';
const STORAGE_KEY_ITEMS = 'repoguard_history_items';

export function useReviewHistory() {
  const [historyEnabled, setHistoryEnabled] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_ENABLED) === 'true';
  });

  const [history, setHistory] = useState<ReviewHistoryItem[]>(() => {
    if (localStorage.getItem(STORAGE_KEY_ENABLED) !== 'true') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ENABLED, String(historyEnabled));
    if (!historyEnabled) {
      localStorage.removeItem(STORAGE_KEY_ITEMS);
      setHistory([]);
    }
  }, [historyEnabled]);

  const toggleHistory = useCallback((enabled: boolean) => {
    setHistoryEnabled(enabled);
  }, []);

  const addReviewToHistory = useCallback(
    (review: ReviewResult) => {
      if (!historyEnabled) return;
      const newItem: ReviewHistoryItem = {
        id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        summary: review.summary,
        overall_risk: review.overall_risk,
        files_reviewed: review.files_reviewed,
        findings_count: review.findings.length,
        mode: review.mode,
        review_result: review,
      };

      setHistory((prev) => {
        const updated = [newItem, ...prev].slice(0, 30); // max 30 items
        try {
          localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(updated));
        } catch {
          // localStorage quota safety
        }
        return updated;
      });
    },
    [historyEnabled]
  );

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_ITEMS);
    setHistory([]);
  }, []);

  return {
    historyEnabled,
    history,
    toggleHistory,
    addReviewToHistory,
    clearHistory,
  };
}

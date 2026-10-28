import React, { useState } from 'react';
import { AppShell } from './components/AppShell';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DemoBanner } from './components/DemoBanner';
import { DiffEditor } from './components/DiffEditor';
import { FileList } from './components/FileList';
import { DiffViewer } from './components/DiffViewer';
import { ReviewSummary } from './components/ReviewSummary';
import { SeverityFilter } from './components/SeverityFilter';
import { FindingsList } from './components/FindingsList';
import { SettingsModal } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';
import { HistoryModal } from './components/HistoryModal';
import { ErrorBoundary } from './components/ErrorBoundary';

import { useReview } from './hooks/useReview';
import { useModelStatus } from './hooks/useModelStatus';
import { useReviewHistory } from './hooks/useReviewHistory';
import {
  Code,
  FileText,
  Play,
  Sparkles,
  Bot,
  Loader2,
} from 'lucide-react';

export const AppContent: React.FC = () => {
  const {
    historyEnabled,
    history,
    toggleHistory,
    addReviewToHistory,
    clearHistory,
  } = useReviewHistory();

  const {
    diffText,
    setDiffText,
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
  } = useReview(addReviewToHistory);

  const {
    status: modelStatus,
    loading: modelLoading,
    refreshStatus: refreshModelStatus,
  } = useModelStatus();

  // Modals & Panels state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [leftTab, setLeftTab] = useState<'editor' | 'viewer'>('editor');

  const selectedFile =
    parsedDiff && parsedDiff.files[selectedFileIndex]
      ? parsedDiff.files[selectedFileIndex]
      : null;

  const handleSelectFinding = (findingId: string) => {
    setExpandedFindingId(findingId);
  };

  const isDemo = reviewResult?.mode === 'demo';

  // Left Panel Content
  const renderLeftPanel = () => {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Left Sub-Header Tabs */}
        <div className="flex items-center justify-between border-b border-rg-border bg-rg-panel px-3 py-1.5 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLeftTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                leftTab === 'editor'
                  ? 'bg-rg-surface text-rg-text border border-rg-border font-semibold'
                  : 'text-rg-muted hover:text-rg-text'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Raw Diff Input
            </button>

            <button
              onClick={() => setLeftTab('viewer')}
              disabled={!parsedDiff}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                leftTab === 'viewer'
                  ? 'bg-rg-surface text-rg-text border border-rg-border font-semibold'
                  : 'text-rg-muted hover:text-rg-text'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Diff Inspector
              {parsedDiff && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rg-bg text-rg-accent">
                  {parsedDiff.total_files}
                </span>
              )}
            </button>
          </div>

          {leftTab === 'viewer' && (
            <button
              onClick={() => setLeftTab('editor')}
              className="text-[11px] text-rg-accent hover:underline font-medium"
            >
              Edit Diff
            </button>
          )}
        </div>

        {/* Tab content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {leftTab === 'editor' ? (
            <DiffEditor
              diffText={diffText}
              onDiffChange={(text) => {
                setDiffText(text);
              }}
              onRunReview={(mode) => {
                runReview(mode);
                if (parsedDiff) setLeftTab('viewer');
              }}
              onLoadSample={async () => {
                await loadSampleDiff();
                setLeftTab('editor');
              }}
              status={status}
              modelReachable={Boolean(modelStatus?.reachable && modelStatus?.model_available)}
              modelName={modelStatus?.installed_models[0] || 'qwen3.5:4b'}
              error={error}
            />
          ) : (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {parsedDiff && (
                <FileList
                  files={parsedDiff.files}
                  selectedIndex={selectedFileIndex}
                  onSelectFile={setSelectedFileIndex}
                />
              )}
              <DiffViewer
                file={selectedFile}
                findings={reviewResult?.findings || []}
                onSelectFinding={handleSelectFinding}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Right Panel Content
  const renderRightPanel = () => {
    if (status === 'reviewing') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-rg-muted">
          <div className="w-16 h-16 rounded-2xl bg-rg-accent/10 border border-rg-accent/20 text-rg-accent flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h3 className="text-base font-bold text-rg-text mb-1">
            Running Local Code Review
          </h3>
          <p className="text-xs max-w-sm mb-4 leading-relaxed">
            Executing deterministic static rules and analyzing unified diff with{' '}
            <code className="text-rg-accent font-mono">qwen3.5:4b</code> on your machine.
          </p>
          <div className="flex items-center gap-2 text-[11px] font-mono text-rg-muted bg-rg-surface px-3 py-1.5 rounded-full border border-rg-border">
            <span className="w-2 h-2 rounded-full bg-rg-accent animate-ping" />
            <span>Localhost only • Zero data transmitted to cloud</span>
          </div>
        </div>
      );
    }

    if (!reviewResult) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-rg-muted overflow-y-auto">
          <div className="w-14 h-14 rounded-2xl bg-rg-surface border border-rg-border flex items-center justify-center mb-4 text-rg-accent">
            <Bot className="w-7 h-7" />
          </div>

          <h3 className="text-base font-bold text-rg-text mb-1">
            RepoGuard Review Engine
          </h3>
          <p className="text-xs max-w-md mb-6 leading-relaxed">
            Paste or upload a unified Git diff on the left to inspect potential bugs, division by zero, hardcoded secrets, and generate automated regression tests.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={async () => {
                const sampleText = await loadSampleDiff();
                if (sampleText) {
                  await runReview('demo', sampleText);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rg-info/10 hover:bg-rg-info/20 border border-rg-info/30 text-rg-info text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              1-Click Demo Review (Zero-Division Bug)
            </button>

            {diffText.trim() && (
              <button
                onClick={() => runReview(modelStatus?.reachable ? 'local_ai' : 'demo')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rg-accent hover:bg-rg-accent/90 text-rg-bg text-xs font-bold transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                Review Current Diff
              </button>
            )}
          </div>

          {/* Feature checklist */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-md w-full">
            <div className="p-3 bg-rg-surface/40 border border-rg-border rounded-lg">
              <span className="font-semibold text-xs text-rg-text block mb-0.5">
                🛡️ Deterministic Rules
              </span>
              <span className="text-[11px] text-rg-muted">
                Detects eval, /0, secrets, empty exception handling.
              </span>
            </div>
            <div className="p-3 bg-rg-surface/40 border border-rg-border rounded-lg">
              <span className="font-semibold text-xs text-rg-text block mb-0.5">
                🔒 100% On-Device
              </span>
              <span className="text-[11px] text-rg-muted">
                Powered by Ollama (qwen3.5:4b). No cloud API leakage.
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <ReviewSummary review={reviewResult} />
        <SeverityFilter
          currentFilter={severityFilter}
          onSelectFilter={setSeverityFilter}
          findings={reviewResult.findings}
        />
        <FindingsList
          findings={reviewResult.findings}
          currentFilter={severityFilter}
          expandedId={expandedFindingId}
          onToggleExpand={(id) =>
            setExpandedFindingId(expandedFindingId === id ? null : id)
          }
        />
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <AppShell
        sidebar={
          <Sidebar
            onNewReview={reset}
            onLoadSample={async () => {
              await loadSampleDiff();
              setLeftTab('editor');
            }}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenHistory={() => setIsHistoryOpen(true)}
            historyCount={history.length}
            modelStatus={modelStatus}
            modelLoading={modelLoading}
            onRefreshModel={refreshModelStatus}
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />
        }
        topbar={
          <TopBar
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            reviewResult={reviewResult}
            parsedDiff={parsedDiff}
            status={status}
            onNewReview={reset}
            onOpenExport={() => setIsExportOpen(true)}
          />
        }
        banner={
          <DemoBanner
            isDemo={Boolean(isDemo)}
            modelReachable={Boolean(modelStatus?.reachable && modelStatus?.model_available)}
            onRunLocalAI={() => runReview('local_ai')}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        }
        leftPanel={renderLeftPanel()}
        rightPanel={renderRightPanel()}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        historyEnabled={historyEnabled}
        onToggleHistory={toggleHistory}
        onClearHistory={clearHistory}
        historyCount={history.length}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        review={reviewResult}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistoryItem={(res) => {
          setReviewResult(res);
          if (res.findings.length > 0) {
            setExpandedFindingId(res.findings[0].id);
          }
        }}
        onClearHistory={clearHistory}
      />
    </ErrorBoundary>
  );
};

export default function App() {
  return <AppContent />;
}

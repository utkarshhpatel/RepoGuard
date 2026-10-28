export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'informational';
export type SourceType = 'deterministic' | 'ai';
export type ConfidenceLabel = 'high' | 'medium' | 'low';
export type VerificationStatus = 'verified' | 'unverified';
export type OverallRisk = 'critical' | 'high' | 'medium' | 'low';

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  category: string;
  file_path: string;
  line_number?: number | null;
  description: string;
  evidence: string;
  impact: string;
  conditions: string;
  suggested_fix: string;
  suggested_test: string;
  confidence_label: ConfidenceLabel;
  source_type: SourceType;
  verification_status: VerificationStatus;
}

export interface ReviewResult {
  summary: string;
  overall_risk: OverallRisk;
  risk_justification: string;
  files_reviewed: string[];
  findings: Finding[];
  checks_performed: string[];
  limitations: string[];
  mode: string;
  total_additions: number;
  total_deletions: number;
}

export type LineType = 'add' | 'del' | 'context' | 'header';

export interface DiffLine {
  line_type: LineType;
  content: string;
  old_line_number?: number | null;
  new_line_number?: number | null;
}

export interface DiffHunk {
  header: string;
  old_start: number;
  old_lines: number;
  new_start: number;
  new_lines: number;
  lines: DiffLine[];
}

export interface ParsedFile {
  old_path: string;
  new_path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
  added_lines: number[];
  changed_lines: number[];
}

export interface DiffParseResult {
  files: ParsedFile[];
  total_additions: number;
  total_deletions: number;
  total_files: number;
  is_valid: boolean;
  error_message?: string | null;
}

export interface ConnectionTestResponse {
  reachable: boolean;
  model_available: boolean;
  configured_model?: string;
  installed_models: string[];
  message: string;
  is_local: boolean;
  warning?: string | null;
}

export interface SettingsResponse {
  ollama_base_url: string;
  ollama_model: string;
  request_timeout_seconds: number;
  max_diff_size_bytes: number;
  is_local: boolean;
  warning?: string | null;
}

export interface ReviewHistoryItem {
  id: string;
  timestamp: string;
  summary: string;
  overall_risk: OverallRisk;
  files_reviewed: string[];
  findings_count: number;
  mode: string;
  review_result: ReviewResult;
}

export type SeverityFilterType = 'all' | Severity | 'deterministic' | 'ai';

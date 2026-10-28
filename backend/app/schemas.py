from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFORMATIONAL = "informational"


class SourceType(str, Enum):
    DETERMINISTIC = "deterministic"
    AI = "ai"


class ConfidenceLabel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class OverallRisk(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class VerificationStatus(str, Enum):
    VERIFIED = "verified"
    UNVERIFIED = "unverified"


class Finding(BaseModel):
    id: str = Field(description="Stable finding identifier")
    title: str = Field(max_length=200, description="Short, descriptive title")
    severity: Severity = Field(description="Severity classification")
    category: str = Field(default="correctness", description="Issue category (e.g., security, correctness, error_handling)")
    file_path: str = Field(description="Target file path relative to repository")
    line_number: Optional[int] = Field(default=None, description="1-indexed line number in new file")
    description: str = Field(max_length=4000, description="Clear description of the issue")
    evidence: str = Field(default="", max_length=2000, description="Exact supporting code snippet from diff")
    impact: str = Field(default="", max_length=2000, description="Why this issue matters in production")
    conditions: str = Field(default="", max_length=2000, description="Exact conditions under which the issue occurs")
    suggested_fix: str = Field(default="", max_length=4000, description="Suggested code fix (unverified)")
    suggested_test: str = Field(default="", max_length=4000, description="Suggested regression test code")
    confidence_label: ConfidenceLabel = Field(default=ConfidenceLabel.MEDIUM, description="Heuristic confidence rating")
    source_type: SourceType = Field(description="Deterministic rule or AI model")
    verification_status: VerificationStatus = Field(
        default=VerificationStatus.UNVERIFIED,
        description="Whether the finding references a verified line in the diff"
    )


class ReviewResult(BaseModel):
    summary: str = Field(description="Executive summary of the review")
    overall_risk: OverallRisk = Field(description="Overall risk tier based on findings")
    risk_justification: str = Field(
        default="",
        description="Transparent breakdown of how risk was computed"
    )
    files_reviewed: list[str] = Field(default_factory=list, description="List of file paths inspected")
    findings: list[Finding] = Field(default_factory=list, description="Actionable findings identified")
    checks_performed: list[str] = Field(default_factory=list, description="Names of deterministic or AI checks run")
    limitations: list[str] = Field(default_factory=list, description="Known review boundaries and limitations")
    mode: str = Field(default="local_ai", description="Review execution mode: 'local_ai' or 'demo'")
    total_additions: int = Field(default=0)
    total_deletions: int = Field(default=0)


class LineType(str, Enum):
    ADD = "add"
    DEL = "del"
    CONTEXT = "context"
    HEADER = "header"


class DiffLine(BaseModel):
    line_type: LineType
    content: str
    old_line_number: Optional[int] = None
    new_line_number: Optional[int] = None


class DiffHunk(BaseModel):
    header: str
    old_start: int
    old_lines: int
    new_start: int
    new_lines: int
    lines: list[DiffLine] = Field(default_factory=list)


class FileChangeStatus(str, Enum):
    MODIFIED = "modified"
    ADDED = "added"
    DELETED = "deleted"
    RENAMED = "renamed"


class ParsedFile(BaseModel):
    old_path: str
    new_path: str
    status: FileChangeStatus
    additions: int = 0
    deletions: int = 0
    hunks: list[DiffHunk] = Field(default_factory=list)
    added_lines: list[int] = Field(default_factory=list, description="New line numbers for added lines")
    changed_lines: list[int] = Field(default_factory=list, description="All line numbers touched in new file")


class DiffParseResult(BaseModel):
    files: list[ParsedFile] = Field(default_factory=list)
    total_additions: int = 0
    total_deletions: int = 0
    total_files: int = 0
    is_valid: bool = True
    error_message: Optional[str] = None


# API Requests & Responses
class DiffParseRequest(BaseModel):
    diff_text: str = Field(..., max_length=10000000, description="Raw unified Git diff string")


class ReviewRequest(BaseModel):
    diff_text: str = Field(..., max_length=10000000, description="Raw unified Git diff string")
    mode: str = Field(default="auto", description="'auto', 'demo', or 'local_ai'")
    model_override: Optional[str] = Field(default=None, description="Optional model override")


class ConnectionTestRequest(BaseModel):
    ollama_base_url: Optional[str] = None
    ollama_model: Optional[str] = None


class ConnectionTestResponse(BaseModel):
    reachable: bool
    model_available: bool
    installed_models: list[str] = Field(default_factory=list)
    configured_model: str = Field(default="qwen2.5-coder:1.5b")
    message: str
    is_local: bool
    warning: Optional[str] = None


class SettingsResponse(BaseModel):
    ollama_base_url: str
    ollama_model: str
    request_timeout_seconds: float
    max_diff_size_bytes: int
    is_local: bool
    warning: Optional[str] = None


class ExportRequest(BaseModel):
    review: ReviewResult
    format: str = "markdown"


class ExportResponse(BaseModel):
    markdown_content: str
    filename: str

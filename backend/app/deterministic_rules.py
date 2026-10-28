import re
from typing import Callable, Optional
from .schemas import (
    Finding,
    ParsedFile,
    LineType,
    Severity,
    SourceType,
    ConfidenceLabel,
    VerificationStatus,
)


class DeterministicRule:
    def __init__(
        self,
        rule_id: str,
        title: str,
        category: str,
        severity: Severity,
        languages: list[str],
        description: str,
        limitations: str,
        check_fn: Callable[[ParsedFile], list[Finding]],
    ):
        self.rule_id = rule_id
        self.title = title
        self.category = category
        self.severity = severity
        self.languages = languages
        self.description = description
        self.limitations = limitations
        self.check_fn = check_fn


# Regex patterns for rules
ZERO_DIVISION_REGEX = re.compile(r"/(?:/)?\s*0(?![0-9.a-zA-Z_])|%\s*0(?![0-9.a-zA-Z_])")
DANGEROUS_EVAL_PY = re.compile(r"\b(eval|exec)\s*\(")
DANGEROUS_EVAL_JS = re.compile(r"\b(eval)\s*\(|new\s+Function\s*\(")
HARDCODED_KEY_REGEX = re.compile(
    r"(?i)(?:api_key|apikey|secret_key|secret|password|access_token|private_key)\s*[:=]\s*['\"][A-Za-z0-9_\-\.]{12,}['\"]"
)
PRIVATE_KEY_HEADER = re.compile(r"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----")
EMPTY_EXCEPT_PY = re.compile(r"except(?:\s+[\w\s,()]+)?:\s*pass\b")
EMPTY_CATCH_JS = re.compile(r"catch\s*\([^\)]*\)\s*\{\s*\}")
DEBUG_STMT_PY = re.compile(r"\b(breakpoint\(\)|import\s+pdb|pdb\.set_trace\(\)|print\(f?['\"]DEBUG)")
DEBUG_STMT_JS = re.compile(r"\b(console\.log\(|debugger;)")


def check_zero_division(file: ParsedFile) -> list[Finding]:
    findings = []
    # Relevant for Python, JS, TS, C, C++, Go, Java, Rust
    for hunk in file.hunks:
        for line in hunk.lines:
            if line.line_type == LineType.ADD and line.new_line_number is not None:
                stripped = line.content.strip()
                # Exclude comment lines
                if stripped.startswith("#") or stripped.startswith("//") or stripped.startswith("/*"):
                    continue
                if ZERO_DIVISION_REGEX.search(stripped):
                    findings.append(
                        Finding(
                            id=f"det-div0-{file.new_path}-{line.new_line_number}",
                            title="Potential Division by Literal Zero",
                            severity=Severity.HIGH,
                            category="correctness",
                            file_path=file.new_path,
                            line_number=line.new_line_number,
                            description=(
                                f"Line {line.new_line_number} contains a division or modulo by literal zero. "
                                "This will trigger a ZeroDivisionError (or equivalent runtime exception/NaN) at runtime."
                            ),
                            evidence=stripped,
                            impact="Causes an unhandled runtime crash when the denominator evaluates to zero.",
                            conditions="Occurs unconditionally whenever this statement is executed.",
                            suggested_fix="Validate that the denominator is non-zero before dividing: `if denominator != 0: return numerator / denominator`.",
                            suggested_test=(
                                "def test_zero_denominator():\n"
                                "    with pytest.raises(ZeroDivisionError):\n"
                                f"        # verify guard handles zero gracefully\n"
                                "        divide_function(10, 0)\n"
                            ),
                            confidence_label=ConfidenceLabel.HIGH,
                            source_type=SourceType.DETERMINISTIC,
                            verification_status=VerificationStatus.VERIFIED,
                        )
                    )
    return findings


def check_dangerous_eval(file: ParsedFile) -> list[Finding]:
    findings = []
    is_py = file.new_path.endswith(".py")
    is_js_ts = any(file.new_path.endswith(ext) for ext in [".js", ".ts", ".jsx", ".tsx"])

    for hunk in file.hunks:
        for line in hunk.lines:
            if line.line_type == LineType.ADD and line.new_line_number is not None:
                stripped = line.content.strip()
                if stripped.startswith("#") or stripped.startswith("//"):
                    continue
                match = None
                if is_py and DANGEROUS_EVAL_PY.search(stripped):
                    match = "eval/exec"
                elif is_js_ts and DANGEROUS_EVAL_JS.search(stripped):
                    match = "eval/Function"

                if match:
                    findings.append(
                        Finding(
                            id=f"det-eval-{file.new_path}-{line.new_line_number}",
                            title=f"Dangerous Dynamic Code Execution ({match})",
                            severity=Severity.CRITICAL,
                            category="security",
                            file_path=file.new_path,
                            line_number=line.new_line_number,
                            description=(
                                f"Usage of `{match}` detected on line {line.new_line_number}. "
                                "Evaluating arbitrary strings as executable code creates severe code injection risks (RCE)."
                            ),
                            evidence=stripped,
                            impact="Arbitrary remote code execution if input originates from an untrusted source.",
                            conditions="Occurs if untrusted or user-controllable input reaches this evaluation.",
                            suggested_fix="Refactor to use safe alternatives such as `ast.literal_eval()`, structured serialization (JSON), or a safe parser.",
                            suggested_test=(
                                "def test_eval_rejection():\n"
                                "    with pytest.raises(ValueError):\n"
                                "        safe_evaluate('__import__(\"os\").system(\"id\")')\n"
                            ),
                            confidence_label=ConfidenceLabel.HIGH,
                            source_type=SourceType.DETERMINISTIC,
                            verification_status=VerificationStatus.VERIFIED,
                        )
                    )
    return findings


def check_hardcoded_credentials(file: ParsedFile) -> list[Finding]:
    findings = []
    # Avoid scanning binary, lockfiles, or fixture files
    if any(file.new_path.endswith(ext) for ext in [".lock", ".min.js", ".svg", ".png", ".jpg"]):
        return findings

    for hunk in file.hunks:
        for line in hunk.lines:
            if line.line_type == LineType.ADD and line.new_line_number is not None:
                stripped = line.content.strip()
                if stripped.startswith("#") or stripped.startswith("//"):
                    continue
                if HARDCODED_KEY_REGEX.search(stripped) or PRIVATE_KEY_HEADER.search(stripped):
                    # Redact part of the evidence for security
                    redacted = re.sub(r"['\"][A-Za-z0-9_\-\.]{6,}", "'[REDACTED_SECRET]", stripped)
                    findings.append(
                        Finding(
                            id=f"det-cred-{file.new_path}-{line.new_line_number}",
                            title="Potential Hardcoded Secret or Private Key",
                            severity=Severity.HIGH,
                            category="security",
                            file_path=file.new_path,
                            line_number=line.new_line_number,
                            description=(
                                f"A secret, token, or private key pattern was detected on line {line.new_line_number}. "
                                "Hardcoding secrets into version control leads to credential leakage."
                            ),
                            evidence=redacted,
                            impact="Compromised API accounts, unauthorized data access, or privilege escalation.",
                            conditions="Occurs if this commit is pushed to shared or public repositories.",
                            suggested_fix="Inject secrets via environment variables (`os.getenv()`, `process.env`) or a secrets manager.",
                            suggested_test=(
                                "def test_secret_not_hardcoded():\n"
                                "    assert os.getenv('API_KEY') is not None\n"
                            ),
                            confidence_label=ConfidenceLabel.MEDIUM,
                            source_type=SourceType.DETERMINISTIC,
                            verification_status=VerificationStatus.VERIFIED,
                        )
                    )
    return findings


def check_empty_exception_handlers(file: ParsedFile) -> list[Finding]:
    findings = []
    is_py = file.new_path.endswith(".py")
    is_js_ts = any(file.new_path.endswith(ext) for ext in [".js", ".ts", ".jsx", ".tsx"])

    for hunk in file.hunks:
        for line in hunk.lines:
            if line.line_type == LineType.ADD and line.new_line_number is not None:
                stripped = line.content.strip()
                if (is_py and EMPTY_EXCEPT_PY.search(stripped)) or (is_js_ts and EMPTY_CATCH_JS.search(stripped)):
                    findings.append(
                        Finding(
                            id=f"det-except-{file.new_path}-{line.new_line_number}",
                            title="Empty Exception Handler (Silenced Error)",
                            severity=Severity.MEDIUM,
                            category="error_handling",
                            file_path=file.new_path,
                            line_number=line.new_line_number,
                            description=(
                                f"Empty exception handler detected on line {line.new_line_number}. "
                                "Silently swallowing exceptions masks underlying bugs and impedes debugging."
                            ),
                            evidence=stripped,
                            impact="Errors are swallowed silently, leading to inconsistent application state and hard-to-diagnose failures.",
                            conditions="Occurs whenever an exception is raised within the guarded block.",
                            suggested_fix="Log the caught error with context, re-raise it, or handle specific exceptions explicitly.",
                            suggested_test=(
                                "def test_exception_is_logged_or_handled():\n"
                                "    # ensure exceptions are not silently swallowed\n"
                                "    pass\n"
                            ),
                            confidence_label=ConfidenceLabel.HIGH,
                            source_type=SourceType.DETERMINISTIC,
                            verification_status=VerificationStatus.VERIFIED,
                        )
                    )
    return findings


def check_debug_statements(file: ParsedFile) -> list[Finding]:
    findings = []
    is_py = file.new_path.endswith(".py")
    is_js_ts = any(file.new_path.endswith(ext) for ext in [".js", ".ts", ".jsx", ".tsx"])

    for hunk in file.hunks:
        for line in hunk.lines:
            if line.line_type == LineType.ADD and line.new_line_number is not None:
                stripped = line.content.strip()
                if stripped.startswith("#") or stripped.startswith("//"):
                    continue
                match = None
                if is_py and DEBUG_STMT_PY.search(stripped):
                    match = "Python debug / breakpoint"
                elif is_js_ts and DEBUG_STMT_JS.search(stripped):
                    match = "JavaScript console.log / debugger"

                if match:
                    findings.append(
                        Finding(
                            id=f"det-dbg-{file.new_path}-{line.new_line_number}",
                            title=f"Leftover Debug Statement ({match})",
                            severity=Severity.LOW,
                            category="maintainability",
                            file_path=file.new_path,
                            line_number=line.new_line_number,
                            description=(
                                f"A debug statement or breakpoint was found on line {line.new_line_number}. "
                                "Breakpoints can halt execution in production environments."
                            ),
                            evidence=stripped,
                            impact="Can halt production processes (breakpoints) or flood logs with sensitive data.",
                            conditions="Occurs when code executes in production without debug filters.",
                            suggested_fix="Remove debugger statement or replace with standard structured logger at DEBUG level.",
                            suggested_test="// Ensure linters enforce no-console or no-debugger in CI\n",
                            confidence_label=ConfidenceLabel.HIGH,
                            source_type=SourceType.DETERMINISTIC,
                            verification_status=VerificationStatus.VERIFIED,
                        )
                    )
    return findings


ALL_RULES: list[DeterministicRule] = [
    DeterministicRule(
        rule_id="DET-DIV0",
        title="Division by literal zero",
        category="correctness",
        severity=Severity.HIGH,
        languages=["python", "javascript", "typescript", "c", "cpp", "go", "java"],
        description="Detects division or modulo by literal zero",
        limitations="Only flags literal zero denominators, not runtime variables evaluating to zero.",
        check_fn=check_zero_division,
    ),
    DeterministicRule(
        rule_id="DET-EVAL",
        title="Dangerous eval/exec",
        category="security",
        severity=Severity.CRITICAL,
        languages=["python", "javascript", "typescript"],
        description="Detects dynamic evaluation of strings as code",
        limitations="Does not track data-flow to determine if evaluated string is safe constant.",
        check_fn=check_dangerous_eval,
    ),
    DeterministicRule(
        rule_id="DET-CRED",
        title="Hardcoded secrets",
        category="security",
        severity=Severity.HIGH,
        languages=["all"],
        description="Detects private keys and high-entropy secret assignment patterns",
        limitations="Regex heuristic; placeholder or mock test tokens may be flagged.",
        check_fn=check_hardcoded_credentials,
    ),
    DeterministicRule(
        rule_id="DET-EXCEPT",
        title="Empty exception handling",
        category="error_handling",
        severity=Severity.MEDIUM,
        languages=["python", "javascript", "typescript"],
        description="Detects empty try/except/catch blocks",
        limitations="Does not flag handlers that contain only comments.",
        check_fn=check_empty_exception_handlers,
    ),
    DeterministicRule(
        rule_id="DET-DEBUG",
        title="Leftover debug statements",
        category="maintainability",
        severity=Severity.LOW,
        languages=["python", "javascript", "typescript"],
        description="Detects breakpoints and logging calls left in committed code",
        limitations="May flag intentional logging in test scripts.",
        check_fn=check_debug_statements,
    ),
]


def run_deterministic_checks(files: list[ParsedFile]) -> tuple[list[Finding], list[str]]:
    findings: list[Finding] = []
    checks_performed: list[str] = [rule.rule_id for rule in ALL_RULES]
    for rule in ALL_RULES:
        for file in files:
            findings.extend(rule.check_fn(file))
    return findings, checks_performed

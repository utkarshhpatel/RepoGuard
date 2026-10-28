from typing import Optional
from .schemas import (
    ReviewResult,
    Finding,
    Severity,
    OverallRisk,
    SourceType,
    ConfidenceLabel,
    VerificationStatus,
    DiffParseResult,
)
from .diff_parser import parse_unified_diff
from .deterministic_rules import run_deterministic_checks
from .ollama_client import OllamaClient
from .demo_data import get_demo_review_result


def normalize_severity(val: str) -> Severity:
    val = (val or "").strip().lower()
    for s in Severity:
        if s.value == val:
            return s
    return Severity.MEDIUM


def normalize_confidence(val: str) -> ConfidenceLabel:
    val = (val or "").strip().lower()
    for c in ConfidenceLabel:
        if c.value == val:
            return c
    return ConfidenceLabel.MEDIUM


def find_matching_file(file_path: str, parsed_files: list) -> Optional[tuple[str, list[int], list[int]]]:
    """Finds matching parsed file, normalizing paths like a/path or b/path."""
    clean_p = file_path.strip().lstrip("ab/")
    for f in parsed_files:
        f_clean = f.new_path.strip().lstrip("ab/")
        if f_clean == clean_p or f.new_path.endswith(clean_p) or clean_p.endswith(f_clean):
            return f.new_path, f.added_lines, f.changed_lines
    return None


def calculate_overall_risk(findings: list[Finding]) -> tuple[OverallRisk, str]:
    critical_count = sum(1 for f in findings if f.severity == Severity.CRITICAL)
    high_count = sum(1 for f in findings if f.severity == Severity.HIGH)
    medium_count = sum(1 for f in findings if f.severity == Severity.MEDIUM)
    low_count = sum(1 for f in findings if f.severity == Severity.LOW)

    if critical_count > 0:
        risk = OverallRisk.CRITICAL
    elif high_count > 0:
        risk = OverallRisk.HIGH
    elif medium_count > 0:
        risk = OverallRisk.MEDIUM
    else:
        risk = OverallRisk.LOW

    justification = (
        f"Computed deterministically from findings count: "
        f"{critical_count} critical, {high_count} high, {medium_count} medium, {low_count} low."
    )
    return risk, justification


async def run_review(
    diff_text: str,
    mode: str = "auto",
    model_override: Optional[str] = None,
) -> ReviewResult:
    # 1. Parse diff
    parsed: DiffParseResult = parse_unified_diff(diff_text)
    if not parsed.is_valid:
        raise ValueError(f"Diff parsing error: {parsed.error_message or 'Invalid diff format'}")

    files_reviewed = [f.new_path for f in parsed.files]

    # 2. Run deterministic static checks
    deterministic_findings, checks_performed = run_deterministic_checks(parsed.files)

    # 3. Handle Demo Mode
    if mode == "demo":
        demo_result = get_demo_review_result()
        demo_result.total_additions = parsed.total_additions
        demo_result.total_deletions = parsed.total_deletions
        demo_result.files_reviewed = files_reviewed
        # Combine demo findings with deterministic findings if not duplicate
        all_demo_findings = list(demo_result.findings)
        seen_keys = {(f.file_path, f.line_number, f.title.lower()) for f in all_demo_findings}
        for df in deterministic_findings:
            key = (df.file_path, df.line_number, df.title.lower())
            if key not in seen_keys:
                all_demo_findings.append(df)
                seen_keys.add(key)
        demo_result.findings = all_demo_findings
        risk, justification = calculate_overall_risk(all_demo_findings)
        demo_result.overall_risk = risk
        demo_result.risk_justification = justification
        return demo_result

    # 4. Live AI Review via Ollama
    client = OllamaClient(model=model_override)
    ai_raw = await client.generate_review(diff_text)

    # 5. Validate AI Findings
    validated_ai_findings: list[Finding] = []
    raw_findings = ai_raw.get("findings", [])
    if isinstance(raw_findings, list):
        for idx, item in enumerate(raw_findings[:25]):  # bound to max 25 findings
            if not isinstance(item, dict):
                continue

            raw_file = str(item.get("file_path", "")).strip()
            match = find_matching_file(raw_file, parsed.files)
            
            line_no = item.get("line_number")
            is_valid_int = isinstance(line_no, int) and line_no > 0
            
            verification_status = VerificationStatus.UNVERIFIED
            resolved_file = raw_file or (files_reviewed[0] if files_reviewed else "unknown")
            resolved_line = None

            if match:
                resolved_file = match[0]
                added_lines, changed_lines = match[1], match[2]
                if is_valid_int:
                    if line_no in changed_lines or line_no in added_lines:
                        verification_status = VerificationStatus.VERIFIED
                        resolved_line = line_no
                    else:
                        # Line exists outside the diff's changed scope
                        verification_status = VerificationStatus.UNVERIFIED
                        resolved_line = line_no
            else:
                # File not matched in diff
                verification_status = VerificationStatus.UNVERIFIED
                resolved_line = line_no if is_valid_int else None

            finding_id = str(item.get("id") or f"ai-finding-{idx + 1}")
            title = str(item.get("title") or "Unnamed AI Finding")[:200]
            severity = normalize_severity(str(item.get("severity", "medium")))
            category = str(item.get("category") or "correctness")[:50]
            description = str(item.get("description") or "No description provided.")[:4000]
            evidence = str(item.get("evidence") or "")[:2000]
            impact = str(item.get("impact") or "")[:2000]
            raw_cond = item.get("conditions")
            if isinstance(raw_cond, list):
                conditions = "; ".join(
                    str(c.get("description") or c.get("title") or c) if isinstance(c, dict) else str(c)
                    for c in raw_cond
                )[:2000]
            else:
                conditions = str(raw_cond or "")[:2000]
            suggested_fix = str(item.get("suggested_fix") or "")[:4000]
            suggested_test = str(item.get("suggested_test") or "")[:4000]
            confidence = normalize_confidence(str(item.get("confidence_label", "medium")))

            validated_ai_findings.append(
                Finding(
                    id=finding_id,
                    title=title,
                    severity=severity,
                    category=category,
                    file_path=resolved_file,
                    line_number=resolved_line,
                    description=description,
                    evidence=evidence,
                    impact=impact,
                    conditions=conditions,
                    suggested_fix=suggested_fix,
                    suggested_test=suggested_test,
                    confidence_label=confidence,
                    source_type=SourceType.AI,
                    verification_status=verification_status,
                )
            )

    # 6. Merge deterministic and validated AI findings (deduplicating)
    merged_findings: list[Finding] = list(deterministic_findings)
    seen_signatures = {(f.file_path, f.line_number, f.category) for f in deterministic_findings}

    for aif in validated_ai_findings:
        sig = (aif.file_path, aif.line_number, aif.category)
        if sig not in seen_signatures:
            merged_findings.append(aif)
            seen_signatures.add(sig)

    # 7. Compute deterministic overall risk
    overall_risk, justification = calculate_overall_risk(merged_findings)

    checks_performed.append(f"AI-INFERENCE-{client.model}")

    summary = (
        ai_raw.get("summary")
        or f"Completed local review of {len(files_reviewed)} file(s). Found {len(merged_findings)} actionable finding(s)."
    )

    limitations = [
        "Inference executed locally via Ollama with no source code transmission to remote providers.",
        "Model findings are heuristic and require human engineering review.",
        "Suggested patches and tests are generated advisory artifacts and have not been executed.",
    ]

    return ReviewResult(
        summary=summary,
        overall_risk=overall_risk,
        risk_justification=justification,
        files_reviewed=files_reviewed,
        findings=merged_findings,
        checks_performed=checks_performed,
        limitations=limitations,
        mode="local_ai",
        total_additions=parsed.total_additions,
        total_deletions=parsed.total_deletions,
    )

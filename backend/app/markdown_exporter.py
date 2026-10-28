from datetime import datetime, timezone
from .schemas import ReviewResult, Severity


def generate_markdown_report(review: ReviewResult) -> str:
    """Generates a clean, structured Markdown review report suitable for PR comments or export."""
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    mode_label = "Local AI (Ollama)" if review.mode == "local_ai" else "Deterministic Demo"

    md = []
    md.append("# 🛡️ RepoGuard Code Review Report")
    md.append("")
    md.append(f"**Generated**: {now_str}  ")
    md.append(f"**Execution Mode**: `{mode_label}`  ")
    md.append(f"**Overall Risk**: `{review.overall_risk.value.upper()}`  ")
    md.append(f"**Files Reviewed**: `{len(review.files_reviewed)}` (`{review.total_additions}` additions, `{review.total_deletions}` deletions)  ")
    md.append("")
    md.append("## 📋 Executive Summary")
    md.append(review.summary)
    md.append("")
    if review.risk_justification:
        md.append(f"> **Risk Assessment**: {review.risk_justification}")
        md.append("")

    md.append("### Files Inspected")
    for f in review.files_reviewed:
        md.append(f"- `{f}`")
    md.append("")

    # Group findings by severity
    severity_order = [
        Severity.CRITICAL,
        Severity.HIGH,
        Severity.MEDIUM,
        Severity.LOW,
        Severity.INFORMATIONAL,
    ]

    findings_by_sev = {sev: [] for sev in severity_order}
    for finding in review.findings:
        findings_by_sev.setdefault(finding.severity, []).append(finding)

    total_findings = len(review.findings)
    md.append(f"## 🔍 Findings ({total_findings})")
    md.append("")

    if total_findings == 0:
        md.append("✅ No actionable defects, security risks, or regression concerns were identified in the submitted diff.")
        md.append("")
    else:
        for sev in severity_order:
            group = findings_by_sev.get(sev, [])
            if not group:
                continue

            md.append(f"### {sev.value.upper()} ({len(group)})")
            md.append("")

            for finding in group:
                line_ref = f":{finding.line_number}" if finding.line_number is not None else " (line unmapped)"
                source_badge = "Deterministic Rule" if finding.source_type == "deterministic" else "Local AI"
                verif_badge = "Verified in Diff" if finding.verification_status == "verified" else "Unverified Location"

                md.append(f"#### {finding.title}")
                md.append(f"- **Location**: `{finding.file_path}{line_ref}`")
                md.append(f"- **Source**: `{source_badge}` | **Confidence**: `{finding.confidence_label.value}` | **Status**: `{verif_badge}`")
                md.append(f"- **Category**: `{finding.category}`")
                md.append("")
                md.append(f"**Description**:  \n{finding.description}")
                md.append("")

                if finding.evidence:
                    md.append(f"**Supporting Evidence**:  \n```\n{finding.evidence}\n```")
                    md.append("")

                if finding.impact:
                    md.append(f"**Impact**:  \n{finding.impact}")
                    md.append("")

                if finding.conditions:
                    md.append(f"**Trigger Conditions**:  \n{finding.conditions}")
                    md.append("")

                if finding.suggested_fix:
                    md.append(f"**Suggested Fix** *(Developer Review Required)*:  \n```\n{finding.suggested_fix}\n```")
                    md.append("")

                if finding.suggested_test:
                    md.append(f"**Suggested Regression Test**:  \n```\n{finding.suggested_test}\n```")
                    md.append("")

                md.append("---")
                md.append("")

    if review.checks_performed:
        md.append("## ⚙️ Checks Performed")
        for check in review.checks_performed:
            md.append(f"- `{check}`")
        md.append("")

    if review.limitations:
        md.append("## ⚠️ Limitations & Disclaimers")
        for lim in review.limitations:
            md.append(f"- {lim}")
        md.append("- All suggested fixes and test codes are generated for review purposes and must be verified by maintainers before applying.")
        md.append("")

    return "\n".join(md)

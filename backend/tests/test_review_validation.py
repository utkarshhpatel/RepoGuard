import pytest
from backend.app.ollama_client import extract_and_repair_json
from backend.app.diff_parser import parse_unified_diff
from backend.app.review_engine import run_review, find_matching_file, calculate_overall_risk
from backend.app.schemas import (
    Finding,
    Severity,
    OverallRisk,
    SourceType,
    VerificationStatus,
)


def test_extract_and_repair_json_fences():
    raw = """Here is your review:
```json
{
  "summary": "Looks good",
  "overall_risk": "low",
  "findings": []
}
```
Hope this helps!"""
    res = extract_and_repair_json(raw)
    assert res["summary"] == "Looks good"
    assert res["overall_risk"] == "low"
    assert res["findings"] == []


def test_extract_and_repair_json_trailing_commas():
    raw = """{
      "summary": "Sample summary",
      "findings": [
        {"id": "1", "title": "test",},
      ],
    }"""
    res = extract_and_repair_json(raw)
    assert res["summary"] == "Sample summary"
    assert len(res["findings"]) == 1


def test_find_matching_file_and_line_mapping():
    diff = """diff --git a/src/main.py b/src/main.py
--- a/src/main.py
+++ b/src/main.py
@@ -10,3 +10,4 @@
 def func():
+    return 42
"""
    parsed = parse_unified_diff(diff)
    match = find_matching_file("src/main.py", parsed.files)
    assert match is not None
    assert match[0] == "src/main.py"
    assert 11 in match[1]  # added lines

    # Prefix mismatch normalizes (b/src/main.py -> src/main.py)
    match_b = find_matching_file("b/src/main.py", parsed.files)
    assert match_b is not None

    # Unknown file returns None
    match_unknown = find_matching_file("other/path.py", parsed.files)
    assert match_unknown is None


def test_calculate_overall_risk():
    f_crit = [
        Finding(
            id="1",
            title="Critical bug",
            severity=Severity.CRITICAL,
            file_path="f.py",
            description="A critical security defect",
            source_type=SourceType.AI,
        )
    ]
    risk, _ = calculate_overall_risk(f_crit)
    assert risk == OverallRisk.CRITICAL

    f_med = [
        Finding(
            id="2",
            title="Med bug",
            severity=Severity.MEDIUM,
            file_path="f.py",
            description="A medium severity issue",
            source_type=SourceType.AI,
        )
    ]
    risk_med, _ = calculate_overall_risk(f_med)
    assert risk_med == OverallRisk.MEDIUM


@pytest.mark.asyncio
async def test_demo_mode_review():
    sample_diff = """diff --git a/services/math_service.py b/services/math_service.py
--- a/services/math_service.py
+++ b/services/math_service.py
@@ -1,3 +1,5 @@
 def divide(a, b):
+    return a / b
"""
    review = await run_review(sample_diff, mode="demo")
    assert review.mode == "demo"
    assert len(review.findings) >= 1
    assert "services/math_service.py" in review.files_reviewed
    assert review.overall_risk in (OverallRisk.HIGH, OverallRisk.CRITICAL)
    # Ensure verification_status is set
    for f in review.findings:
        assert f.verification_status in (VerificationStatus.VERIFIED, VerificationStatus.UNVERIFIED)

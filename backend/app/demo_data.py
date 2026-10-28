from .schemas import (
    ReviewResult,
    Finding,
    Severity,
    OverallRisk,
    SourceType,
    ConfidenceLabel,
    VerificationStatus,
)

SAMPLE_DIFF = """diff --git a/services/math_service.py b/services/math_service.py
index 104b2e8..9f42c11 100644
--- a/services/math_service.py
+++ b/services/math_service.py
@@ -1,9 +1,18 @@
 def format_currency(amount: float) -> str:
     return f"${amount:,.2f}"
 
+def calculate_ratio(numerator: float, denominator: float) -> float:
+    \"\"\"Calculates ratio between two metrics.\"\"\"
+    # Missing zero check: if denominator is zero, raises ZeroDivisionError
+    return numerator / denominator
+
 def calculate_discount(price: float, discount_percent: float) -> float:
     if discount_percent < 0 or discount_percent > 100:
         raise ValueError("Discount must be between 0 and 100")
-    return price * (1 - discount_percent / 100)
+    factor = 1.0 - (discount_percent / 100.0)
+    return price * factor
"""


def get_demo_review_result() -> ReviewResult:
    return ReviewResult(
        summary="Deterministic Demo Mode: Analyzed sample diff in services/math_service.py. Identified a high-risk uncaught zero-division vulnerability in calculate_ratio along with clean discount calculations.",
        overall_risk=OverallRisk.HIGH,
        risk_justification="Computed from 1 High-severity defect (potential uncaught ZeroDivisionError on line 7) in public function calculate_ratio().",
        files_reviewed=["services/math_service.py"],
        findings=[
            Finding(
                id="demo-ratio-zero-division-7",
                title="Missing Zero-Denominator Guard in calculate_ratio",
                severity=Severity.HIGH,
                category="correctness",
                file_path="services/math_service.py",
                line_number=7,
                description=(
                    "The `calculate_ratio` function performs division `numerator / denominator` "
                    "without validating whether `denominator` is zero. When `denominator=0` is passed, "
                    "Python raises an unhandled `ZeroDivisionError`, crashing caller requests."
                ),
                evidence="return numerator / denominator",
                impact="Leads to 500 internal server errors or worker process aborts if zero or invalid denominator is provided.",
                conditions="Occurs whenever `calculate_ratio(n, 0)` is invoked with a zero denominator.",
                suggested_fix=(
                    "def calculate_ratio(numerator: float, denominator: float) -> float:\n"
                    "    \"\"\"Calculates ratio between two metrics.\"\"\"\n"
                    "    if denominator == 0:\n"
                    "        raise ValueError(\"denominator cannot be zero\")\n"
                    "    return numerator / denominator"
                ),
                suggested_test=(
                    "import pytest\n"
                    "from services.math_service import calculate_ratio\n\n"
                    "def test_calculate_ratio_zero_denominator():\n"
                    "    with pytest.raises(ValueError, match=\"denominator cannot be zero\"):\n"
                    "        calculate_ratio(10.0, 0.0)\n\n"
                    "def test_calculate_ratio_normal():\n"
                    "    assert calculate_ratio(10.0, 2.0) == 5.0\n"
                ),
                confidence_label=ConfidenceLabel.HIGH,
                source_type=SourceType.DETERMINISTIC,
                verification_status=VerificationStatus.VERIFIED,
            ),
            Finding(
                id="demo-type-safety-4",
                title="Potential Non-Numeric Float Coercion Risk",
                severity=Severity.LOW,
                category="robustness",
                file_path="services/math_service.py",
                line_number=4,
                description=(
                    "Type annotations `numerator: float` are not enforced at runtime. If caller passes `None` "
                    "or non-numeric string values, `TypeError` will be raised at runtime."
                ),
                evidence="def calculate_ratio(numerator: float, denominator: float) -> float:",
                impact="Runtime TypeError if dynamic API callers pass invalid payload structures.",
                conditions="Occurs if callers bypass static type checks or pass untyped JSON dicts.",
                suggested_fix=(
                    "if not isinstance(numerator, (int, float)) or not isinstance(denominator, (int, float)):\n"
                    "    raise TypeError(\"numerator and denominator must be numeric\")"
                ),
                suggested_test=(
                    "def test_calculate_ratio_invalid_types():\n"
                    "    with pytest.raises(TypeError):\n"
                    "        calculate_ratio('10', None)  # type: ignore\n"
                ),
                confidence_label=ConfidenceLabel.MEDIUM,
                source_type=SourceType.DETERMINISTIC,
                verification_status=VerificationStatus.VERIFIED,
            ),
        ],
        checks_performed=[
            "DET-DIV0",
            "DET-EVAL",
            "DET-CRED",
            "DET-EXCEPT",
            "DET-DEBUG",
            "DEMO-DETERMINISTIC-SIMULATION",
        ],
        limitations=[
            "Review generated in Demo Mode using verified deterministic fixtures.",
            "No live AI inference was performed for this precomputed sample.",
            "Suggested fixes and regression tests are provided for developer review and have not been executed.",
        ],
        mode="demo",
        total_additions=11,
        total_deletions=2,
    )

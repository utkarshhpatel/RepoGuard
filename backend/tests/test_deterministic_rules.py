from backend.app.diff_parser import parse_unified_diff
from backend.app.deterministic_rules import run_deterministic_checks
from backend.app.schemas import Severity


def test_zero_division_detection():
    diff = """diff --git a/math_ops.py b/math_ops.py
--- a/math_ops.py
+++ b/math_ops.py
@@ -1,2 +1,4 @@
 def test():
+    x = 10 / 0
+    y = 5 % 0
"""
    parsed = parse_unified_diff(diff)
    findings, checks = run_deterministic_checks(parsed.files)
    div_findings = [f for f in findings if "div0" in f.id]
    assert len(div_findings) == 2
    assert div_findings[0].severity == Severity.HIGH
    assert div_findings[0].line_number == 2
    assert "10 / 0" in div_findings[0].evidence
    assert div_findings[1].line_number == 3


def test_eval_detection():
    diff = """diff --git a/runner.py b/runner.py
--- a/runner.py
+++ b/runner.py
@@ -1,2 +1,3 @@
 def run_user_code(user_input):
+    return eval(user_input)
"""
    parsed = parse_unified_diff(diff)
    findings, _ = run_deterministic_checks(parsed.files)
    eval_findings = [f for f in findings if "eval" in f.id]
    assert len(eval_findings) == 1
    assert eval_findings[0].severity == Severity.CRITICAL
    assert eval_findings[0].line_number == 2
    assert "eval(user_input)" in eval_findings[0].evidence


def test_hardcoded_secrets_detection():
    diff = """diff --git a/config.py b/config.py
--- a/config.py
+++ b/config.py
@@ -1,2 +1,3 @@
+api_key = "sk_live_1234567890abcdef12345"
"""
    parsed = parse_unified_diff(diff)
    findings, _ = run_deterministic_checks(parsed.files)
    cred_findings = [f for f in findings if "cred" in f.id]
    assert len(cred_findings) == 1
    assert cred_findings[0].severity == Severity.HIGH
    assert "[REDACTED_SECRET]" in cred_findings[0].evidence


def test_empty_exception_handler():
    diff = """diff --git a/handler.py b/handler.py
--- a/handler.py
+++ b/handler.py
@@ -1,3 +1,5 @@
 def handle():
+    try:
+        do_something()
+    except: pass
"""
    parsed = parse_unified_diff(diff)
    findings, _ = run_deterministic_checks(parsed.files)
    except_findings = [f for f in findings if "except" in f.id]
    assert len(except_findings) == 1
    assert except_findings[0].line_number == 4


def test_debug_statement_detection():
    diff = """diff --git a/app.js b/app.js
--- a/app.js
+++ b/app.js
@@ -1,2 +1,4 @@
 function main() {
+    console.log("here in main");
+    debugger;
 }
"""
    parsed = parse_unified_diff(diff)
    findings, _ = run_deterministic_checks(parsed.files)
    dbg_findings = [f for f in findings if "dbg" in f.id]
    assert len(dbg_findings) == 2

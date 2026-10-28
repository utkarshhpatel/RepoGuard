from backend.app.diff_parser import parse_unified_diff
from backend.app.schemas import FileChangeStatus, LineType


def test_empty_diff():
    res = parse_unified_diff("")
    assert not res.is_valid
    assert "empty" in res.error_message.lower()

    res_spaces = parse_unified_diff("   \n\n  ")
    assert not res_spaces.is_valid


def test_malformed_diff():
    res = parse_unified_diff("This is just some random text with no diff headers whatsoever.")
    assert not res.is_valid
    assert "no diff headers" in res.error_message.lower()


def test_valid_single_file_diff_line_numbers():
    diff = """diff --git a/calc.py b/calc.py
index e69de29..49b6b19 100644
--- a/calc.py
+++ b/calc.py
@@ -10,4 +10,6 @@ def calculate():
     a = 1
-    b = 2
+    b = 20
+    c = 30
     return a + b
"""
    res = parse_unified_diff(diff)
    assert res.is_valid
    assert res.total_files == 1
    file = res.files[0]
    assert file.new_path == "calc.py"
    assert file.status == FileChangeStatus.MODIFIED
    assert file.additions == 2
    assert file.deletions == 1
    assert file.added_lines == [11, 12]
    assert len(file.hunks) == 1
    hunk = file.hunks[0]
    assert hunk.new_start == 10

    # Test exact line mapping
    add_lines = [l for l in hunk.lines if l.line_type == LineType.ADD]
    assert len(add_lines) == 2
    assert add_lines[0].new_line_number == 11
    assert add_lines[0].content == "    b = 20"
    assert add_lines[1].new_line_number == 12
    assert add_lines[1].content == "    c = 30"

    del_lines = [l for l in hunk.lines if l.line_type == LineType.DEL]
    assert len(del_lines) == 1
    assert del_lines[0].old_line_number == 11
    assert del_lines[0].new_line_number is None


def test_multiple_files_and_multiple_hunks():
    diff = """diff --git a/app.py b/app.py
--- a/app.py
+++ b/app.py
@@ -1,3 +1,4 @@
 def start():
+    init_app()
     pass
@@ -20,3 +21,4 @@ def stop():
     cleanup()
+    sys.exit(0)
diff --git a/utils.py b/utils.py
--- a/utils.py
+++ b/utils.py
@@ -5,2 +5,3 @@
 def util():
+    return True
"""
    res = parse_unified_diff(diff)
    assert res.is_valid
    assert res.total_files == 2
    assert res.files[0].new_path == "app.py"
    assert len(res.files[0].hunks) == 2
    assert res.files[0].added_lines == [2, 22]

    assert res.files[1].new_path == "utils.py"
    assert len(res.files[1].hunks) == 1
    assert res.files[1].added_lines == [6]


def test_added_file():
    diff = """diff --git a/new_file.py b/new_file.py
new file mode 100644
--- /dev/null
+++ b/new_file.py
@@ -0,0 +1,3 @@
+def brand_new():
+    return "hello"
+
"""
    res = parse_unified_diff(diff)
    assert res.is_valid
    assert res.total_files == 1
    assert res.files[0].status == FileChangeStatus.ADDED
    assert res.files[0].new_path == "new_file.py"
    assert res.files[0].additions == 3
    assert res.files[0].added_lines == [1, 2, 3]


def test_deleted_file():
    diff = """diff --git a/old_file.py b/old_file.py
deleted file mode 100644
--- a/old_file.py
+++ /dev/null
@@ -1,2 +0,0 @@
-def deprecated():
-    pass
"""
    res = parse_unified_diff(diff)
    assert res.is_valid
    assert res.total_files == 1
    assert res.files[0].status == FileChangeStatus.DELETED
    assert res.files[0].deletions == 2


def test_file_name_with_spaces():
    diff = """diff --git "a/my path/file name.py" "b/my path/file name.py"
--- "a/my path/file name.py"
+++ "b/my path/file name.py"
@@ -1,2 +1,3 @@
 def hello():
+    print("space")
     return True
"""
    res = parse_unified_diff(diff)
    assert res.is_valid
    assert res.files[0].new_path == "my path/file name.py"

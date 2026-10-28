import re
from typing import Optional
from .schemas import (
    DiffLine,
    DiffHunk,
    ParsedFile,
    DiffParseResult,
    LineType,
    FileChangeStatus,
)

HUNK_HEADER_REGEX = re.compile(r"^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@(.*)$")
DIFF_GIT_REGEX = re.compile(r'^diff\s+--git\s+(?:"a/(.+?)"|a/(.+?))\s+(?:"b/(.+?)"|b/(.+?))$')


def clean_path(path: str) -> str:
    path = path.strip()
    if path.startswith('"') and path.endswith('"'):
        path = path[1:-1]
    if path.startswith("a/") or path.startswith("b/"):
        return path[2:]
    return path


def parse_unified_diff(diff_text: str) -> DiffParseResult:
    if not diff_text or not diff_text.strip():
        return DiffParseResult(
            files=[],
            total_additions=0,
            total_deletions=0,
            total_files=0,
            is_valid=False,
            error_message="Submitted diff is empty.",
        )

    lines = diff_text.splitlines()
    files: list[ParsedFile] = []
    
    current_file: Optional[ParsedFile] = None
    current_hunk: Optional[DiffHunk] = None
    cur_old_line = 0
    cur_new_line = 0
    in_hunk = False

    def finalize_hunk():
        nonlocal current_hunk
        if current_hunk and current_file:
            current_file.hunks.append(current_hunk)
            current_hunk = None

    def finalize_file():
        nonlocal current_file, in_hunk
        finalize_hunk()
        if current_file:
            files.append(current_file)
            current_file = None
            in_hunk = False

    i = 0
    total_lines = len(lines)
    found_any_diff_header = False

    while i < total_lines:
        line = lines[i]

        # Check for diff --git header
        if line.startswith("diff --git"):
            finalize_file()
            found_any_diff_header = True
            m = DIFF_GIT_REGEX.match(line)
            if m:
                old_p = m.group(1) or m.group(2) or ""
                new_p = m.group(3) or m.group(4) or ""
            else:
                parts = line.split(" ")
                old_p = clean_path(parts[2]) if len(parts) > 2 else "unknown"
                new_p = clean_path(parts[3]) if len(parts) > 3 else old_p

            current_file = ParsedFile(
                old_path=old_p,
                new_path=new_p,
                status=FileChangeStatus.MODIFIED,
            )
            i += 1
            continue

        # Check file mode / rename markers
        if current_file:
            if line.startswith("new file mode"):
                current_file.status = FileChangeStatus.ADDED
                i += 1
                continue
            elif line.startswith("deleted file mode"):
                current_file.status = FileChangeStatus.DELETED
                i += 1
                continue
            elif line.startswith("similarity index") or line.startswith("rename from"):
                current_file.status = FileChangeStatus.RENAMED
                if line.startswith("rename from"):
                    current_file.old_path = line.replace("rename from ", "").strip()
                i += 1
                continue
            elif line.startswith("rename to"):
                current_file.new_path = line.replace("rename to ", "").strip()
                i += 1
                continue
            elif line.startswith("--- "):
                found_any_diff_header = True
                path_part = line[4:].strip()
                if path_part == "/dev/null":
                    current_file.status = FileChangeStatus.ADDED
                else:
                    cleaned = clean_path(path_part)
                    if cleaned and not current_file.old_path:
                        current_file.old_path = cleaned
                i += 1
                continue
            elif line.startswith("+++ "):
                found_any_diff_header = True
                path_part = line[4:].strip()
                if path_part == "/dev/null":
                    current_file.status = FileChangeStatus.DELETED
                else:
                    cleaned = clean_path(path_part)
                    if cleaned:
                        current_file.new_path = cleaned
                i += 1
                continue

        # Support diffs without `diff --git`, starting directly with `--- a/...` and `+++ b/...`
        if line.startswith("--- ") and not current_file:
            found_any_diff_header = True
            old_p = clean_path(line[4:].strip())
            new_p = old_p
            # Look ahead for +++
            if i + 1 < total_lines and lines[i + 1].startswith("+++ "):
                new_p = clean_path(lines[i + 1][4:].strip())
                i += 1
            status = FileChangeStatus.MODIFIED
            if old_p == "/dev/null":
                status = FileChangeStatus.ADDED
                old_p = new_p
            elif new_p == "/dev/null":
                status = FileChangeStatus.DELETED
                new_p = old_p

            current_file = ParsedFile(
                old_path=old_p,
                new_path=new_p,
                status=status,
            )
            i += 1
            continue

        # Check hunk header
        hunk_match = HUNK_HEADER_REGEX.match(line)
        if hunk_match:
            finalize_hunk()
            found_any_diff_header = True

            if not current_file:
                # Diff with hunk header but no file header
                current_file = ParsedFile(
                    old_path="unnamed_diff.txt",
                    new_path="unnamed_diff.txt",
                    status=FileChangeStatus.MODIFIED,
                )

            old_start = int(hunk_match.group(1))
            old_lines = int(hunk_match.group(2)) if hunk_match.group(2) else 1
            new_start = int(hunk_match.group(3))
            new_lines = int(hunk_match.group(4)) if hunk_match.group(4) else 1

            current_hunk = DiffHunk(
                header=line,
                old_start=old_start,
                old_lines=old_lines,
                new_start=new_start,
                new_lines=new_lines,
                lines=[],
            )
            cur_old_line = old_start
            cur_new_line = new_start
            in_hunk = True
            i += 1
            continue

        # Parse lines inside hunk
        if in_hunk and current_hunk and current_file:
            if line.startswith("+"):
                diff_line = DiffLine(
                    line_type=LineType.ADD,
                    content=line[1:],
                    old_line_number=None,
                    new_line_number=cur_new_line,
                )
                current_hunk.lines.append(diff_line)
                current_file.additions += 1
                current_file.added_lines.append(cur_new_line)
                current_file.changed_lines.append(cur_new_line)
                cur_new_line += 1
            elif line.startswith("-"):
                diff_line = DiffLine(
                    line_type=LineType.DEL,
                    content=line[1:],
                    old_line_number=cur_old_line,
                    new_line_number=None,
                )
                current_hunk.lines.append(diff_line)
                current_file.deletions += 1
                cur_old_line += 1
            elif line.startswith(" ") or line == "":
                content = line[1:] if line.startswith(" ") else line
                diff_line = DiffLine(
                    line_type=LineType.CONTEXT,
                    content=content,
                    old_line_number=cur_old_line,
                    new_line_number=cur_new_line,
                )
                current_hunk.lines.append(diff_line)
                cur_old_line += 1
                cur_new_line += 1
            elif line.startswith(r"\ No newline at end of file"):
                diff_line = DiffLine(
                    line_type=LineType.HEADER,
                    content=line,
                    old_line_number=None,
                    new_line_number=None,
                )
                current_hunk.lines.append(diff_line)
            else:
                # Unknown line or trailing info
                in_hunk = False
                finalize_hunk()
            i += 1
            continue

        i += 1

    finalize_file()

    if not files or not found_any_diff_header:
        return DiffParseResult(
            files=[],
            total_additions=0,
            total_deletions=0,
            total_files=0,
            is_valid=False,
            error_message="Invalid unified diff format: no diff headers or hunks detected.",
        )

    total_additions = sum(f.additions for f in files)
    total_deletions = sum(f.deletions for f in files)

    return DiffParseResult(
        files=files,
        total_additions=total_additions,
        total_deletions=total_deletions,
        total_files=len(files),
        is_valid=True,
        error_message=None,
    )

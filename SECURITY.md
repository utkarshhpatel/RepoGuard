# Security Policy

## Privacy Model & Guarantees

RepoGuard is engineered as a **local-first** security assistant:
1. **Zero External Data Transmission**: When configured with the default local Ollama base URL (`http://127.0.0.1:11434`), source code and Git diffs never traverse the internet or leave your machine.
2. **Untrusted Diff Isolation**: All diff contents, file paths, and comments are treated as untrusted data wrapped in `<untrusted_diff>` boundary tags to prevent prompt injection and instruction overrides.
3. **No Automatic Code Execution**: RepoGuard does not execute reviewed code or automatically apply model-generated patches without user oversight.
4. **No Telemetry**: No tracking identifiers, analytics beacons, or remote logs are transmitted.
5. **Opt-in Storage**: Review history in the browser is strictly opt-in and disabled by default.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you identify a security defect, arbitrary execution risk, or network leakage vulnerability in RepoGuard:
1. Please do not file public issues on GitHub.
2. Send a detailed report to `security@repoguard.local` (or create a private GitHub Security Advisory).
3. Include reproducible steps and affected versions.
4. We aim to acknowledge receipt within 48 hours and provide remediation in a timely release.

# 🛡️ RepoGuard

> **Your code. Your machine. Smarter reviews.**  
> A privacy-preserving, local-first AI code review assistant that inspects Git diffs, detects bugs and security risks, and generates regression test suggestions on your local machine.

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Python: 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![Ollama](https://img.shields.io/badge/AI-Ollama%20(qwen3.5:4b)-orange.svg)](https://ollama.ai/)

---

## 🎯 The Problem

Modern AI coding assistants provide powerful code reviews, but sending proprietary code, internal pull requests, or unreleased vulnerability fixes to third-party cloud APIs poses significant risks:
- **Intellectual Property & Privacy Risks**: Sensitive business logic and internal API signatures leave your infrastructure.
- **Credential Leakage**: Accidental secrets or tokens in staging diffs are exposed to cloud inference logs.
- **Hallucinated Findings**: Cloud models often cite non-existent line numbers, fabricate syntax errors, or generate speculative commentary instead of actionable bug reports.
- **Network & Account Dependencies**: Cloud AI review tools require subscriptions, API keys, and constant internet connectivity.

## 💡 The Solution: RepoGuard

**RepoGuard** is built from the ground up to solve these problems by running entirely on **localhost**:
1. **100% On-Device Inference**: Powered by local models running in [Ollama](https://ollama.ai) (defaulting to `qwen3.5:4b`). No proprietary cloud APIs, no subscriptions, and zero external telemetry.
2. **Hybrid Intelligence**: Merges instant deterministic checks (literal zero-division, dangerous `eval`, hardcoded keys, empty exception blocks) with local language model reasoning.
3. **Diff Cross-Validation**: Every model finding is validated against the actual parsed diff line ranges. Hallucinated file paths or out-of-scope line references are flagged as unverified rather than masqueraded as verified code locations.
4. **Actionable Fixes & Tests**: Provides concrete suggested fixes and regression test cases ready for maintainer inspection and 1-click clipboard copying.
5. **Zero-Setup Demo Mode**: Includes a deterministic sample workflow (zero-denominator bug) so anyone can evaluate the tool in under 60 seconds without installing or starting Ollama.

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│               RepoGuard React + Vite UI                │
│  ┌──────────────┐ ┌────────────────┐ ┌───────────────┐ │
│  │  Diff Input  │ │ Findings Table │ │ Suggested Fix │ │
│  │  & Inspector │ │   & Filters    │ │  & Test Code  │ │
│  └──────┬───────┘ └───────▲────────┘ └───────▲───────┘ │
└─────────┼─────────────────┼──────────────────┼─────────┘
          │ POST /diff/parse│ GET/POST review  │ Export MD
          ▼                 │                  │
┌────────────────────────────────────────────────────────┐
│                 FastAPI Backend                        │
│  ┌──────────────────────┐   ┌────────────────────────┐ │
│  │  Unified Diff Parser │   │ Deterministic Rules    │ │
│  │  (Files, Hunks, Lines)   │ (eval, creds, /0, etc) │ │
│  └──────────┬───────────┘   └───────────┬────────────┘ │
│             │                           │              │
│             ▼                           ▼              │
│  ┌───────────────────────────────────────────────────┐ │
│  │           Review Engine & Cross-Validator         │ │
│  │  - Prompt sanitization & untrusted diff boundaries │ │
│  │  - Pydantic JSON schema enforcement & recovery    │ │
│  │  - Exact file & line range verification           │ │
│  └──────────────────────────┬────────────────────────┘ │
└─────────────────────────────┼──────────────────────────┘
                              │ HTTP (localhost:11434)
                              ▼
┌────────────────────────────────────────────────────────┐
│                   Ollama Server                        │
│         Running `qwen3.5:4b` Locally                   │
└────────────────────────────────────────────────────────┘
```

---

## 🔒 Privacy Model & Security Guarantees

- **No Remote Telemetry**: RepoGuard does not transmit analytics, telemetry, or user metrics.
- **Localhost Binding**: Development servers bind to `127.0.0.1` by default. Permissive CORS configurations are avoided.
- **Untrusted Diff Boundary**: All submitted code is enclosed in `<untrusted_diff>` boundary tags with strict system directives to treat input solely as code under review, defending against prompt injection.
- **No Unsupervised Code Execution**: Suggested fixes and regression tests are advisory artifacts and are never executed automatically.
- **Opt-In Session History**: Review history is stored in local browser storage only when explicitly enabled by the user in Settings, and can be cleared with a single click.

---

## ⚡ Quick Start

### 1. Prerequisites
- **Python**: 3.10+
- **Node.js**: 18+ and npm 9+
- **Ollama**: (Optional for Demo Mode, required for live AI reviews) [Download Ollama](https://ollama.ai)

### 2. Clone and Configure
```bash
git clone https://github.com/your-org/RepoGuard.git
cd RepoGuard
cp .env.example .env
```

### 3. Start Backend
```bash
# Setup virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
pip install pytest pytest-asyncio

# Start FastAPI server on localhost:8000
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

### 4. Start Frontend
In a separate terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server on localhost:5173
npm run dev
```

Open `http://127.0.0.1:5173` in your browser.

---

## 🤖 Ollama Model Setup (For Live AI Reviews)

To run reviews using local AI inference:

1. **Install and Start Ollama**:
   ```bash
   ollama serve
   ```

2. **Pull the Default Model (`qwen3.5:4b`)**:
   ```bash
   ollama pull qwen3.5:4b
   ```

3. **Verify the Connection**:
   In the RepoGuard UI, open **Settings** and click **Test Connection**, or run:
   ```bash
   curl http://127.0.0.1:8000/api/model/status
   ```
   If Ollama is offline or the model is downloading, RepoGuard will automatically offer **Deterministic Demo Mode**.

---

## 🧪 Running Tests

### Backend Tests (pytest)
Runs unit tests for unified diff parsing, deterministic rules, JSON repair, line number cross-verification, and API endpoints:
```bash
PYTHONPATH=. .venv/bin/pytest backend/tests/ -v
```

### Frontend Tests (Vitest + React Testing Library)
Runs unit and component integration tests:
```bash
cd frontend
npm test
```

### Production Build
Verifies TypeScript compilation and bundling:
```bash
cd frontend
npm run build
```

---

## 🖥️ UI Tour & Workflow

1. **Importing Diffs**:
   - Paste a raw unified Git diff into the editor.
   - Or drop a `.diff` / `.patch` file (up to 1 MB safety limit).
   - Or click **Load Demo Diff** for instant onboarding.
2. **Inspecting Changes**:
   - The **Diff Inspector** tab breaks down touched files, additions (`+`), and deletions (`-`).
   - Line numbers are tracked accurately, highlighting exact additions and context lines.
3. **Review Execution**:
   - Click **Run Local AI Review** for on-device inference via Ollama.
   - Or click **Demo Review** for deterministic offline analysis.
4. **Actionable Findings**:
   - Filter by severity: `Critical`, `High`, `Medium`, `Low`, `Info`, or by source: `Static Rules` vs `Local AI`.
   - Expand any finding to view the exact diff evidence, why the issue matters, trigger conditions, copyable suggested fixes, and regression test code.
5. **Markdown Export**:
   - Click **Export Report** to copy or download a structured Markdown summary ready for GitHub PR comments.

---

## 🛠️ Deterministic Static Analysis Rules

RepoGuard includes a suite of lightweight deterministic rules:

| Rule ID | Name | Severity | Target Languages | Description |
|---|---|---|---|---|
| `DET-DIV0` | Division by Literal Zero | HIGH | Python, JS, TS, C, Go, Java | Detects `/ 0` and `% 0` literals causing runtime exceptions |
| `DET-EVAL` | Dangerous Eval/Exec | CRITICAL | Python, JavaScript, TypeScript | Flags dynamic string execution (`eval`, `exec`, `new Function`) |
| `DET-CRED` | Hardcoded Secrets | HIGH | All | Pattern matching for API keys, secret tokens, and private keys |
| `DET-EXCEPT` | Empty Exception Handler | MEDIUM | Python, JS, TS | Detects `except: pass` or `catch(e) {}` silencing errors |
| `DET-DEBUG` | Leftover Debug Calls | LOW | Python, JS, TS | Detects lingering `breakpoint()`, `pdb.set_trace()`, or `debugger` |

---

## ⚠️ Known Limitations & Disclaimers

1. **Hardware Considerations**: Running a 4B parameter model (`qwen3.5:4b`) on CPU requires 4–8 GB of RAM and may take 30–90 seconds per review. GPU acceleration (CUDA, Metal, ROCm) significantly accelerates inference.
2. **Advisory Suggestions**: All suggested fixes and regression test snippets are generated for human review. They are not automatically executed or guaranteed to compile.
3. **Diff Scope**: RepoGuard reviews changed lines within submitted hunks. Cross-file architectural refactors without unified diff context are outside the scope of individual diff reviews.

---

## 🔧 Troubleshooting

### "Could not connect to Ollama at http://127.0.0.1:11434"
- Ensure the Ollama service is running: `ollama serve`
- Confirm port 11434 is listening: `curl http://127.0.0.1:11434/api/tags`
- If running inside a container, ensure localhost port forwarding is configured.

### "Model inference timed out"
- Increase the timeout in `.env`: `REQUEST_TIMEOUT_SECONDS=180`
- Ensure no other heavy tasks are starving the CPU/GPU.
- For quick evaluations without waiting on CPU inference, use **Demo Mode**.

---

## 🗺️ Practical Roadmap

Looking to contribute? Here are high-impact issues you can work on:

- [ ] **AST-Based Semantic Analysis**: Integrate Python `ast` and Tree-sitter for deeper static analysis beyond regex heuristics.
- [ ] **Git CLI / Pre-Commit Hook**: Provide a CLI wrapper (`repoguard review`) that automatically reads `git diff HEAD~1` and outputs PR review comments.
- [ ] **Interactive Patch Application**: Allow developers to selectively apply or stage verified suggested fixes directly from the UI.
- [ ] **Multi-Model Benchmark Harness**: Add an automated evaluation script testing local models (`llama3.2:3b`, `mistral:7b`, `deepseek-coder:6.7b`) on standard bug corpora.

---

## 📄 License

RepoGuard is open-source software licensed under the [MIT License](LICENSE).

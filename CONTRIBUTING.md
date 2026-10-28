# Contributing to RepoGuard

Thank you for your interest in contributing to RepoGuard! We welcome contributions that maintain our core principles: **local-first privacy**, **strict response validation**, and **high developer ergonomics**.

## Development Setup

### Prerequisites
- Node.js >= 18 and npm >= 9
- Python >= 3.10
- [Ollama](https://ollama.ai) (optional for Demo Mode, required for live AI reviews) with `qwen2.5-coder:1.5b`

### Backend Setup
```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
pip install pytest pytest-asyncio

# Run backend tests
PYTHONPATH=. pytest backend/tests/ -v

# Start backend server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run unit tests
npm test

# Run development server
npm run dev

# Run production build
npm run build
```

## Pull Request Guidelines

1. **Deterministic Rules**: When adding a new deterministic rule in `backend/app/deterministic_rules.py`, write corresponding tests in `backend/tests/test_deterministic_rules.py` covering positive detections and false-positive boundaries.
2. **Schema Integrity**: Any changes to `schemas.py` must maintain backward compatibility or be mirrored in `frontend/src/types/index.ts`.
3. **No External Network Calls**: PRs introducing telemetry, analytics, or external API dependencies without explicit user consent will not be accepted.
4. **Code Quality**: Ensure all tests pass (`pytest` and `vitest`) and production builds complete cleanly without TypeScript errors before submitting PRs.

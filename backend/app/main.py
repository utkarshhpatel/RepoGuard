import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .config import settings, is_local_endpoint
from .schemas import (
    DiffParseRequest,
    DiffParseResult,
    ReviewRequest,
    ReviewResult,
    ConnectionTestRequest,
    ConnectionTestResponse,
    SettingsResponse,
    ExportRequest,
    ExportResponse,
)
from .diff_parser import parse_unified_diff
from .review_engine import run_review
from .ollama_client import OllamaClient
from .markdown_exporter import generate_markdown_report
from .demo_data import SAMPLE_DIFF

# Structured logging without code leakage
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("repoguard")

app = FastAPI(
    title="RepoGuard Backend",
    version="1.0.0",
    description="Local-first AI code review backend powered by FastAPI and Ollama.",
)

# Restrict CORS to configured local origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """Returns backend service health status."""
    return {
        "status": "healthy",
        "service": "repoguard-backend",
        "version": "1.0.0",
        "is_local_first": True,
    }


@app.get("/api/model/status", response_model=ConnectionTestResponse)
async def get_model_status():
    """Checks whether Ollama is reachable and whether configured model is available."""
    client = OllamaClient()
    return await client.check_health()


@app.get("/api/settings", response_model=SettingsResponse)
async def get_settings():
    """Returns safe, non-sensitive runtime settings."""
    is_local = is_local_endpoint(settings.ollama_base_url)
    warning = (
        None
        if is_local
        else "Configured Ollama base URL is not local (localhost/127.0.0.1). Source code may leave this device!"
    )
    return SettingsResponse(
        ollama_base_url=settings.ollama_base_url,
        ollama_model=settings.ollama_model,
        request_timeout_seconds=settings.request_timeout_seconds,
        max_diff_size_bytes=settings.max_diff_size_bytes,
        is_local=is_local,
        warning=warning,
    )


@app.post("/api/settings/test-connection", response_model=ConnectionTestResponse)
async def test_connection(req: ConnectionTestRequest):
    """Tests connection to a specified or default Ollama endpoint."""
    url = req.ollama_base_url or settings.ollama_base_url
    model = req.ollama_model or settings.ollama_model
    client = OllamaClient(base_url=url, model=model)
    return await client.check_health()


@app.get("/api/sample-diff")
async def get_sample_diff():
    """Returns the built-in demonstration diff for 1-click evaluation."""
    return {
        "sample_diff": SAMPLE_DIFF,
        "description": "Python math service diff with missing zero-denominator validation and float arithmetic.",
    }


@app.post("/api/diff/parse", response_model=DiffParseResult)
async def parse_diff_endpoint(req: DiffParseRequest):
    """Parses unified git diff into structured file and hunk representations with line mapping."""
    if len(req.diff_text.encode("utf-8")) > settings.max_diff_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"Diff size exceeds maximum limit of {settings.max_diff_size_bytes // 1024} KB.",
        )
    
    parsed = parse_unified_diff(req.diff_text)
    if not parsed.is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=parsed.error_message or "Invalid diff format.",
        )
    return parsed


@app.post("/api/review", response_model=ReviewResult)
async def review_diff_endpoint(req: ReviewRequest):
    """Executes deterministic code checks and local AI review."""
    diff_bytes = len(req.diff_text.encode("utf-8"))
    if diff_bytes > settings.max_diff_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Diff size ({diff_bytes // 1024} KB) exceeds maximum limit of {settings.max_diff_size_bytes // 1024} KB.",
        )

    logger.info("Executing review with mode=%s, size_bytes=%d", req.mode, diff_bytes)

    try:
        result = await run_review(
            diff_text=req.diff_text,
            mode=req.mode,
            model_override=req.model_override,
        )
        return result
    except ValueError as ve:
        logger.warning("Diff or JSON validation error: %s", str(ve))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve),
        )
    except TimeoutError as te:
        logger.error("Review request timed out: %s", str(te))
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=str(te),
        )
    except RuntimeError as re:
        logger.error("Runtime error during review: %s", str(re))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(re),
        )
    except Exception as e:
        logger.exception("Unexpected error during review")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Review failed: {str(e)}",
        )


@app.post("/api/review/export", response_model=ExportResponse)
async def export_review_endpoint(req: ExportRequest):
    """Generates an exportable, validated Markdown report."""
    md_content = generate_markdown_report(req.review)
    filename = f"repoguard-review-{req.review.overall_risk.value}.md"
    return ExportResponse(
        markdown_content=md_content,
        filename=filename,
    )

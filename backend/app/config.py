import os
from urllib.parse import urlparse
from pydantic import BaseModel, Field


def is_local_endpoint(url: str) -> bool:
    """Checks whether an endpoint URL points strictly to localhost / loopback."""
    try:
        parsed = urlparse(url)
        hostname = (parsed.hostname or "").lower()
        return hostname in ("127.0.0.1", "localhost", "::1", "0.0.0.0")
    except Exception:
        return False


class Settings(BaseModel):
    ollama_base_url: str = Field(
        default_factory=lambda: os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
    )
    ollama_model: str = Field(
        default_factory=lambda: os.getenv("OLLAMA_MODEL", "qwen3.5:4b")
    )
    backend_host: str = Field(
        default_factory=lambda: os.getenv("BACKEND_HOST", "127.0.0.1")
    )
    backend_port: int = Field(
        default_factory=lambda: int(os.getenv("BACKEND_PORT", "8000"))
    )
    request_timeout_seconds: float = Field(
        default_factory=lambda: float(os.getenv("REQUEST_TIMEOUT_SECONDS", "300.0"))
    )
    max_diff_size_bytes: int = Field(
        default_factory=lambda: int(os.getenv("MAX_DIFF_SIZE_BYTES", "1048576"))  # 1 MB
    )
    allowed_origins: list[str] = Field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv(
                "ALLOWED_ORIGINS",
                "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
            ).split(",")
            if origin.strip()
        ]
    )

    @property
    def is_local(self) -> bool:
        return is_local_endpoint(self.ollama_base_url)


settings = Settings()

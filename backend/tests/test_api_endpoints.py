import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.demo_data import SAMPLE_DIFF


@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_settings_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/settings")
    assert response.status_code == 200
    data = response.json()
    assert "ollama_model" in data
    assert "ollama_base_url" in data
    assert data["is_local"] is True


@pytest.mark.asyncio
async def test_sample_diff_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/sample-diff")
    assert response.status_code == 200
    data = response.json()
    assert "sample_diff" in data
    assert "calculate_ratio" in data["sample_diff"]


@pytest.mark.asyncio
async def test_parse_diff_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/diff/parse", json={"diff_text": SAMPLE_DIFF})
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True
    assert data["total_files"] == 1
    assert data["files"][0]["new_path"] == "services/math_service.py"


@pytest.mark.asyncio
async def test_parse_diff_oversized():
    transport = ASGITransport(app=app)
    # 2MB string
    large_diff = "diff --git a/f b/f\n" + ("+" + "a" * 100 + "\n") * 20000
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/diff/parse", json={"diff_text": large_diff})
    assert response.status_code == 413


@pytest.mark.asyncio
async def test_review_endpoint_demo_mode():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/review",
            json={"diff_text": SAMPLE_DIFF, "mode": "demo"},
        )
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "demo"
    assert len(data["findings"]) >= 1
    assert data["overall_risk"] in ("high", "critical")


@pytest.mark.asyncio
async def test_export_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Get demo review first
        review_res = await ac.post(
            "/api/review",
            json={"diff_text": SAMPLE_DIFF, "mode": "demo"},
        )
        review_data = review_res.json()
        export_res = await ac.post(
            "/api/review/export",
            json={"review": review_data, "format": "markdown"},
        )
    assert export_res.status_code == 200
    export_data = export_res.json()
    assert "# 🛡️ RepoGuard Code Review Report" in export_data["markdown_content"]
    assert "Executive Summary" in export_data["markdown_content"]

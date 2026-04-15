"""
Regression tests for VULN-005 (SPA blocked paths) and VULN-012 (security headers).
"""
import pytest


# ── VULN-012: Security headers ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_security_headers_present_on_root(async_client):
    """VULN-012: Security headers must be present on every response."""
    resp = await async_client.get("/")
    assert resp.headers.get("x-frame-options") == "DENY"
    assert resp.headers.get("x-content-type-options") == "nosniff"
    assert resp.headers.get("referrer-policy") == "no-referrer"
    assert "content-security-policy" in resp.headers


# ── VULN-005: Sensitive files blocked via SPA catch-all ──────────────────────

@pytest.mark.asyncio
async def test_config_secrets_not_served(async_client, tmp_path, monkeypatch):
    """VULN-005: config.secrets.json must never be served directly."""
    resp = await async_client.get("/config.secrets.json")
    # Must redirect to index.html (200 with HTML) not serve the raw JSON
    assert resp.status_code == 200
    content_type = resp.headers.get("content-type", "")
    assert "application/json" not in content_type


@pytest.mark.asyncio
async def test_config_json_not_served(async_client):
    """VULN-005: config.json must never be served directly."""
    resp = await async_client.get("/config.json")
    assert resp.status_code == 200
    content_type = resp.headers.get("content-type", "")
    assert "application/json" not in content_type


@pytest.mark.asyncio
async def test_dotfile_not_served(async_client):
    """VULN-005: Dotfiles (e.g. .env) must not be served."""
    resp = await async_client.get("/.env")
    assert resp.status_code == 200
    content_type = resp.headers.get("content-type", "")
    # Must serve index.html, not a raw file
    assert "text/html" in content_type


@pytest.mark.asyncio
async def test_path_traversal_spa_blocked(async_client):
    """VULN-005: Paths containing '..' must be blocked."""
    resp = await async_client.get("/../../etc/passwd")
    # FastAPI will normalise this, but our guard must still apply
    assert resp.status_code in (200, 404)
    content_type = resp.headers.get("content-type", "")
    # Must not serve raw text/plain with passwd content
    assert "text/html" in content_type or resp.status_code == 404


@pytest.mark.asyncio
async def test_app_source_not_served(async_client):
    """VULN-005: app/ Python source files must not be served."""
    resp = await async_client.get("/app/main.py")
    assert resp.status_code == 200
    content_type = resp.headers.get("content-type", "")
    assert "text/html" in content_type

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

import httpx


@pytest.mark.asyncio
async def test_proxy_success(async_client):
    mock_response = MagicMock()
    mock_response.content = b'{"result": "ok"}'
    mock_response.status_code = 200

    with patch("app.routers.proxy.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        resp = await async_client.post(
            "/bbt-proxy",
            content=b'{"method": "item.search"}',
            headers={"Content-Type": "application/json"},
        )

    assert resp.status_code == 200
    assert resp.content == b'{"result": "ok"}'


@pytest.mark.asyncio
async def test_proxy_upstream_error(async_client):
    with patch("app.routers.proxy.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(side_effect=httpx.ConnectError("Connection refused"))
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        resp = await async_client.post(
            "/bbt-proxy",
            content=b'{"method": "item.search"}',
        )

    assert resp.status_code == 502
    data = resp.json()
    assert "error" in data


# ── VULN-018: /bbt-proxy JSON-RPC method allowlist ───────────────────────────

@pytest.mark.asyncio
async def test_proxy_disallowed_method_blocked(async_client):
    """VULN-018: Methods not in the allowlist must return 403."""
    resp = await async_client.post(
        "/bbt-proxy",
        content=b'{"method": "system.exec", "params": []}',
        headers={"Content-Type": "application/json"},
    )
    assert resp.status_code == 403
    assert resp.json()["detail"] == "Method not allowed"


@pytest.mark.asyncio
async def test_proxy_missing_method_blocked(async_client):
    """VULN-018: Requests with no 'method' field must return 403."""
    resp = await async_client.post(
        "/bbt-proxy",
        content=b'{"params": []}',
        headers={"Content-Type": "application/json"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_proxy_invalid_json_rejected(async_client):
    """VULN-018: Non-JSON body must return 400."""
    resp = await async_client.post(
        "/bbt-proxy",
        content=b'not-json',
        headers={"Content-Type": "application/json"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_proxy_item_export_allowed(async_client):
    """VULN-018: item.export is an allowed method and must be proxied."""
    mock_response = MagicMock()
    mock_response.content = b'{"result": "bibtex data"}'
    mock_response.status_code = 200

    with patch("app.routers.proxy.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        resp = await async_client.post(
            "/bbt-proxy",
            content=b'{"method": "item.export"}',
            headers={"Content-Type": "application/json"},
        )

    assert resp.status_code == 200

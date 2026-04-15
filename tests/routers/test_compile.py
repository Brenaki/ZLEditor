import pytest
from unittest.mock import MagicMock

from app import dependencies
from app.models.compile import CompileResult
from app.services.compile_service import CompileService


@pytest.fixture
def mock_compile_service():
    return MagicMock(spec=CompileService)


@pytest.mark.asyncio
async def test_compile_success_returns_pdf(async_client, mock_compile_service):
    mock_compile_service.compile.return_value = CompileResult(
        success=True, log="ok", pdf=b"%PDF-1.4 test"
    )
    app = async_client._transport.app
    app.dependency_overrides[dependencies.get_compile_service] = lambda: mock_compile_service

    resp = await async_client.post("/compile", json={"rootFile": "main.tex", "files": []})

    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content == b"%PDF-1.4 test"

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_compile_error_returns_json(async_client, mock_compile_service):
    mock_compile_service.compile.return_value = CompileResult(
        success=False, log="! Error in file"
    )
    app = async_client._transport.app
    app.dependency_overrides[dependencies.get_compile_service] = lambda: mock_compile_service

    resp = await async_client.post("/compile", json={"rootFile": "main.tex", "files": []})

    assert resp.status_code == 422
    data = resp.json()
    assert data["error"] is True
    assert "Error in file" in data["log"]

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_compile_log_endpoint(async_client, mock_compile_service):
    mock_compile_service.get_log.return_value = "last compilation log"
    app = async_client._transport.app
    app.dependency_overrides[dependencies.get_compile_service] = lambda: mock_compile_service

    resp = await async_client.get("/compile/log")

    assert resp.status_code == 200
    assert resp.json() == {"log": "last compilation log"}

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_compile_timeout_returns_error(async_client, mock_compile_service):
    mock_compile_service.compile.return_value = CompileResult(
        success=False, log="Compilação excedeu o tempo limite (60 s)."
    )
    app = async_client._transport.app
    app.dependency_overrides[dependencies.get_compile_service] = lambda: mock_compile_service

    resp = await async_client.post("/compile", json={"rootFile": "main.tex", "files": []})

    assert resp.status_code == 422
    assert "tempo limite" in resp.json()["log"]

    app.dependency_overrides.clear()

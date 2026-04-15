import json
import pytest
from unittest.mock import AsyncMock, MagicMock

from app import dependencies
from app.models.config import AppConfig, ConfigResponse, ProviderConfig
from app.services.chat_service import ChatService
from app.services.config_service import ConfigService


def _config_response(active="anthropic", has_key=True):
    return ConfigResponse(
        activeProvider=active,
        contextMode="none",
        providers={
            "anthropic": ProviderConfig(model="claude-sonnet-4-6", hasKey=has_key),
        },
    )


@pytest.fixture
def mock_config_service():
    svc = MagicMock(spec=ConfigService)
    svc.get_config_response.return_value = _config_response()
    svc.get_config.return_value = AppConfig(contextMode="none")
    svc.get_key.return_value = "test-key"
    return svc


@pytest.fixture
def mock_chat_service(mock_config_service):
    svc = MagicMock(spec=ChatService)
    svc._config_service = mock_config_service

    async def _stream(request):
        yield json.dumps({"delta": "Hello", "done": False})
        yield json.dumps({"delta": " world", "done": False})
        yield json.dumps({"delta": "", "done": True})

    svc.chat_stream = _stream
    return svc


@pytest.mark.asyncio
async def test_ai_chat_sse_format(async_client, mock_chat_service, mock_config_service):
    app = async_client._transport.app
    app.dependency_overrides[dependencies.get_chat_service] = lambda: mock_chat_service
    app.dependency_overrides[dependencies.get_config_service] = lambda: mock_config_service

    resp = await async_client.post(
        "/ai/chat",
        json={"messages": [{"role": "user", "content": "Hi"}]},
    )

    assert resp.status_code == 200
    assert "text/event-stream" in resp.headers["content-type"]

    lines = [l for l in resp.text.split("\n") if l.startswith("data:")]
    chunks = [json.loads(l[len("data: "):]) for l in lines]

    assert chunks[0] == {"delta": "Hello", "done": False}
    assert chunks[1] == {"delta": " world", "done": False}
    assert chunks[-1] == {"delta": "", "done": True}

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ai_chat_no_provider_400(async_client, mock_chat_service, mock_config_service):
    mock_config_service.get_config_response.return_value = _config_response(active="")
    mock_chat_service._config_service = mock_config_service

    app = async_client._transport.app
    app.dependency_overrides[dependencies.get_chat_service] = lambda: mock_chat_service
    app.dependency_overrides[dependencies.get_config_service] = lambda: mock_config_service

    resp = await async_client.post(
        "/ai/chat",
        json={"messages": [{"role": "user", "content": "Hi"}]},
    )

    assert resp.status_code == 400
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ai_chat_no_key_400(async_client, mock_chat_service, mock_config_service):
    mock_config_service.get_config_response.return_value = _config_response(has_key=False)
    mock_chat_service._config_service = mock_config_service

    app = async_client._transport.app
    app.dependency_overrides[dependencies.get_chat_service] = lambda: mock_chat_service
    app.dependency_overrides[dependencies.get_config_service] = lambda: mock_config_service

    resp = await async_client.post(
        "/ai/chat",
        json={"messages": [{"role": "user", "content": "Hi"}]},
    )

    assert resp.status_code == 400
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ai_get_config(async_client, mock_config_service):
    app = async_client._transport.app
    app.dependency_overrides[dependencies.get_config_service] = lambda: mock_config_service

    resp = await async_client.get("/ai/config")

    assert resp.status_code == 200
    data = resp.json()
    assert "activeProvider" in data
    assert "providers" in data
    assert "contextMode" in data

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ai_put_config_valid(async_client, mock_config_service):
    mock_config_service.apply_update.return_value = _config_response(active="openai")
    app = async_client._transport.app
    app.dependency_overrides[dependencies.get_config_service] = lambda: mock_config_service

    resp = await async_client.put("/ai/config", json={"activeProvider": "openai"})

    assert resp.status_code == 200
    mock_config_service.apply_update.assert_called_once_with({"activeProvider": "openai"})

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ai_put_config_invalid_context_mode(async_client, mock_config_service):
    app = async_client._transport.app
    app.dependency_overrides[dependencies.get_config_service] = lambda: mock_config_service

    resp = await async_client.put("/ai/config", json={"contextMode": "invalid-mode"})

    assert resp.status_code == 422
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ai_put_config_valid_context_mode(async_client, mock_config_service):
    mock_config_service.apply_update.return_value = _config_response()
    app = async_client._transport.app
    app.dependency_overrides[dependencies.get_config_service] = lambda: mock_config_service

    resp = await async_client.put("/ai/config", json={"contextMode": "project"})

    assert resp.status_code == 200
    app.dependency_overrides.clear()

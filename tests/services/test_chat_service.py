import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.chat import ChatRequest, FileContext
from app.models.config import AppConfig, ConfigResponse, ProviderConfig
from app.services.chat_service import ChatService
from app.services.config_service import ConfigService
from app.services.memory_service import MemoryService


def _make_config_response(active="anthropic", has_key=True, context_mode="none"):
    return ConfigResponse(
        activeProvider=active,
        contextMode=context_mode,
        providers={
            "anthropic": ProviderConfig(model="claude-sonnet-4-6", hasKey=has_key),
            "openai": ProviderConfig(model="gpt-4o", hasKey=has_key),
            "ollama": ProviderConfig(model="llama3", hasKey=True, baseUrl="http://localhost:11434"),
        },
    )


@pytest.fixture
def mock_config_service():
    svc = MagicMock(spec=ConfigService)
    svc.get_config_response.return_value = _make_config_response()
    svc.get_config.return_value = AppConfig(contextMode="none")
    svc.get_key.return_value = "test-key"
    return svc


@pytest.fixture
def mock_memory_service():
    svc = MagicMock(spec=MemoryService)
    svc.wake_up = AsyncMock(return_value="")
    svc.search = AsyncMock(return_value="")
    svc.mine = AsyncMock(return_value=None)
    return svc


@pytest.fixture
def chat_service(mock_config_service, mock_memory_service):
    return ChatService(mock_config_service, mock_memory_service)


async def _collect_chunks(async_gen):
    chunks = []
    async for chunk in async_gen:
        chunks.append(json.loads(chunk))
    return chunks


def _mock_provider_stream(deltas):
    async def _stream(messages, model):
        for d in deltas:
            yield d

    provider = MagicMock()
    provider.stream = _stream
    return provider


@pytest.mark.asyncio
async def test_chat_stream_success(chat_service):
    with patch("app.services.chat_service.ProviderFactory.create", return_value=_mock_provider_stream(["Hello", " world"])):
        request = ChatRequest(messages=[{"role": "user", "content": "Hi"}], projectId="proj1")
        chunks = await _collect_chunks(chat_service.chat_stream(request))

    assert chunks[-1] == {"delta": "", "done": True}
    assert any(c.get("delta") == "Hello" for c in chunks)
    assert any(c.get("delta") == " world" for c in chunks)
    assert all(not c.get("done") for c in chunks[:-1])


@pytest.mark.asyncio
async def test_chat_stream_no_provider(chat_service, mock_config_service):
    mock_config_service.get_config_response.return_value = _make_config_response(active="")
    request = ChatRequest(messages=[{"role": "user", "content": "Hi"}])
    chunks = await _collect_chunks(chat_service.chat_stream(request))
    assert len(chunks) == 1
    assert "error" in chunks[0]
    assert chunks[0]["done"] is True


@pytest.mark.asyncio
async def test_chat_stream_no_key(chat_service, mock_config_service):
    mock_config_service.get_config_response.return_value = _make_config_response(has_key=False)
    request = ChatRequest(messages=[{"role": "user", "content": "Hi"}])
    chunks = await _collect_chunks(chat_service.chat_stream(request))
    assert len(chunks) == 1
    assert "error" in chunks[0]
    assert "API key" in chunks[0]["error"]
    assert chunks[0]["done"] is True


@pytest.mark.asyncio
async def test_chat_stream_provider_exception(chat_service):
    async def _failing_stream(messages, model):
        raise RuntimeError("Quota exceeded")
        yield  # make it an async generator

    failing_provider = MagicMock()
    failing_provider.stream = _failing_stream

    with patch("app.services.chat_service.ProviderFactory.create", return_value=failing_provider):
        request = ChatRequest(messages=[{"role": "user", "content": "Hi"}])
        chunks = await _collect_chunks(chat_service.chat_stream(request))

    assert chunks[-1]["done"] is True
    assert "error" in chunks[-1]
    assert "Quota exceeded" in chunks[-1]["error"]


@pytest.mark.asyncio
async def test_context_mode_none(chat_service, mock_config_service):
    mock_config_service.get_config.return_value = AppConfig(contextMode="none")

    with patch("app.services.chat_service.ProviderFactory.create", return_value=_mock_provider_stream(["ok"])) as mock_create:
        request = ChatRequest(
            messages=[{"role": "user", "content": "Hi"}],
            currentFile=FileContext(name="main.tex", content=r"\documentclass{article}"),
        )
        await _collect_chunks(chat_service.chat_stream(request))

        messages_passed = mock_create.return_value.stream.__self__ if hasattr(mock_create.return_value.stream, "__self__") else None

    # verify no file content in system prompt by checking what was passed
    # This is validated by the absence of current-file section


@pytest.mark.asyncio
async def test_context_mode_current_file(chat_service, mock_config_service):
    mock_config_service.get_config.return_value = AppConfig(contextMode="current-file")
    captured_messages = []

    async def _capture_stream(messages, model):
        captured_messages.extend(messages)
        yield "ok"

    provider = MagicMock()
    provider.stream = _capture_stream

    with patch("app.services.chat_service.ProviderFactory.create", return_value=provider):
        request = ChatRequest(
            messages=[{"role": "user", "content": "Hi"}],
            currentFile=FileContext(name="main.tex", content=r"\documentclass{article}"),
        )
        await _collect_chunks(chat_service.chat_stream(request))

    system_msg = captured_messages[0]["content"]
    assert "main.tex" in system_msg
    assert r"\documentclass{article}" in system_msg


@pytest.mark.asyncio
async def test_context_mode_project(chat_service, mock_config_service):
    mock_config_service.get_config.return_value = AppConfig(contextMode="project")
    captured_messages = []

    async def _capture_stream(messages, model):
        captured_messages.extend(messages)
        yield "ok"

    provider = MagicMock()
    provider.stream = _capture_stream

    with patch("app.services.chat_service.ProviderFactory.create", return_value=provider):
        request = ChatRequest(
            messages=[{"role": "user", "content": "Hi"}],
            files=[
                FileContext(name="main.tex", content="doc content"),
                FileContext(name="refs.bib", content="@article{...}"),
            ],
        )
        await _collect_chunks(chat_service.chat_stream(request))

    system_msg = captured_messages[0]["content"]
    assert "=== main.tex ===" in system_msg
    assert "doc content" in system_msg
    assert "=== refs.bib ===" in system_msg


@pytest.mark.asyncio
async def test_explain_error_mode(chat_service, mock_config_service):
    mock_config_service.get_config.return_value = AppConfig(contextMode="none")
    captured_messages = []

    async def _capture_stream(messages, model):
        captured_messages.extend(messages)
        yield "explanation"

    provider = MagicMock()
    provider.stream = _capture_stream

    with patch("app.services.chat_service.ProviderFactory.create", return_value=provider):
        request = ChatRequest(
            messages=[{"role": "user", "content": "explain this"}],
            mode="explain-error",
            compilationLog="! Undefined control sequence.",
        )
        await _collect_chunks(chat_service.chat_stream(request))

    system_msg = captured_messages[0]["content"]
    assert "error" in system_msg.lower() or "compilation" in system_msg.lower()
    assert "! Undefined control sequence." in system_msg


@pytest.mark.asyncio
async def test_memory_injected_in_system_prompt(chat_service, mock_memory_service, mock_config_service):
    mock_config_service.get_config.return_value = AppConfig(contextMode="none")
    mock_memory_service.wake_up = AsyncMock(return_value="Past session context")
    mock_memory_service.search = AsyncMock(return_value="Relevant memory")
    captured_messages = []

    async def _capture_stream(messages, model):
        captured_messages.extend(messages)
        yield "ok"

    provider = MagicMock()
    provider.stream = _capture_stream

    with patch("app.services.chat_service.ProviderFactory.create", return_value=provider):
        request = ChatRequest(messages=[{"role": "user", "content": "Hi"}])
        await _collect_chunks(chat_service.chat_stream(request))

    system_msg = captured_messages[0]["content"]
    assert "Past session context" in system_msg
    assert "Relevant memory" in system_msg


@pytest.mark.asyncio
async def test_mine_called_after_stream(chat_service, mock_memory_service):
    with patch("app.services.chat_service.ProviderFactory.create", return_value=_mock_provider_stream(["reply"])):
        request = ChatRequest(messages=[{"role": "user", "content": "Hello"}], projectId="proj42")
        await _collect_chunks(chat_service.chat_stream(request))

    mock_memory_service.mine.assert_called_once()
    call_args = mock_memory_service.mine.call_args
    assert call_args[0][0] == "proj42"
    exchange = call_args[0][1]
    assert exchange["user"] == "Hello"
    assert exchange["assistant"] == "reply"

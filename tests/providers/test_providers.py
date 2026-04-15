import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.providers.anthropic import AnthropicProvider
from app.providers.deepseek import DeepSeekProvider
from app.providers.gemini import GeminiProvider
from app.providers.ollama import OllamaProvider
from app.providers.openai import OpenAIProvider


def _mock_stream_response(chunks):
    """Create a mock async iterator that yields chunks like litellm would."""
    async def _aiter():
        for text in chunks:
            chunk = MagicMock()
            chunk.choices[0].delta.content = text
            yield chunk

    mock = MagicMock()
    mock.__aiter__ = lambda self: _aiter()
    return mock


@pytest.mark.asyncio
async def test_anthropic_provider_model_string():
    provider = AnthropicProvider(api_key="test-key")
    mock_response = _mock_stream_response(["Hello", " world"])

    with patch("litellm.acompletion", new=AsyncMock(return_value=mock_response)) as mock_completion:
        chunks = []
        async for chunk in provider.stream([{"role": "user", "content": "Hi"}], "claude-sonnet-4-6"):
            chunks.append(chunk)

        call_kwargs = mock_completion.call_args.kwargs
        assert call_kwargs["model"] == "anthropic/claude-sonnet-4-6"
        assert call_kwargs["api_key"] == "test-key"
        assert call_kwargs["stream"] is True
    assert chunks == ["Hello", " world"]


@pytest.mark.asyncio
async def test_openai_provider_model_string():
    provider = OpenAIProvider(api_key="sk-openai")
    mock_response = _mock_stream_response(["Test"])

    with patch("litellm.acompletion", new=AsyncMock(return_value=mock_response)) as mock_completion:
        async for _ in provider.stream([{"role": "user", "content": "Hi"}], "gpt-4o"):
            pass

        call_kwargs = mock_completion.call_args.kwargs
        assert call_kwargs["model"] == "openai/gpt-4o"
        assert call_kwargs["api_key"] == "sk-openai"


@pytest.mark.asyncio
async def test_gemini_provider_model_string():
    provider = GeminiProvider(api_key="gemini-key")
    mock_response = _mock_stream_response(["Response"])

    with patch("litellm.acompletion", new=AsyncMock(return_value=mock_response)) as mock_completion:
        async for _ in provider.stream([{"role": "user", "content": "Hi"}], "gemini-1.5-pro"):
            pass

        call_kwargs = mock_completion.call_args.kwargs
        assert call_kwargs["model"] == "gemini/gemini-1.5-pro"
        assert call_kwargs["api_key"] == "gemini-key"


@pytest.mark.asyncio
async def test_ollama_provider_model_string():
    provider = OllamaProvider(base_url="http://localhost:11434")
    mock_response = _mock_stream_response(["Local"])

    with patch("litellm.acompletion", new=AsyncMock(return_value=mock_response)) as mock_completion:
        async for _ in provider.stream([{"role": "user", "content": "Hi"}], "llama3"):
            pass

        call_kwargs = mock_completion.call_args.kwargs
        assert call_kwargs["model"] == "ollama/llama3"
        assert call_kwargs["api_base"] == "http://localhost:11434"
        assert "api_key" not in call_kwargs


@pytest.mark.asyncio
async def test_deepseek_provider_model_string():
    provider = DeepSeekProvider(api_key="ds-key")
    mock_response = _mock_stream_response(["Deep"])

    with patch("litellm.acompletion", new=AsyncMock(return_value=mock_response)) as mock_completion:
        async for _ in provider.stream([{"role": "user", "content": "Hi"}], "deepseek-chat"):
            pass

        call_kwargs = mock_completion.call_args.kwargs
        assert call_kwargs["model"] == "deepseek/deepseek-chat"
        assert call_kwargs["api_key"] == "ds-key"


@pytest.mark.asyncio
async def test_provider_skips_empty_delta():
    provider = AnthropicProvider(api_key="test-key")
    mock_response = _mock_stream_response(["Hello", "", None, " world"])

    with patch("litellm.acompletion", new=AsyncMock(return_value=mock_response)):
        chunks = []
        async for chunk in provider.stream([{"role": "user", "content": "Hi"}], "claude-sonnet-4-6"):
            chunks.append(chunk)

    # Empty and None deltas should be skipped
    assert "" not in chunks
    assert None not in chunks
    assert "Hello" in chunks
    assert " world" in chunks


@pytest.mark.asyncio
async def test_provider_passes_messages():
    provider = OpenAIProvider(api_key="sk-test")
    messages = [
        {"role": "system", "content": "You are helpful"},
        {"role": "user", "content": "Hello"},
    ]
    mock_response = _mock_stream_response(["Hi"])

    with patch("litellm.acompletion", new=AsyncMock(return_value=mock_response)) as mock_completion:
        async for _ in provider.stream(messages, "gpt-4o"):
            pass

        call_kwargs = mock_completion.call_args.kwargs
        assert call_kwargs["messages"] == messages

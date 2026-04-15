import pytest

from app.models.config import ConfigResponse, ProviderConfig
from app.providers.anthropic import AnthropicProvider
from app.providers.deepseek import DeepSeekProvider
from app.providers.factory import ProviderFactory
from app.providers.gemini import GeminiProvider
from app.providers.ollama import OllamaProvider
from app.providers.openai import OpenAIProvider


def _config(active: str, **provider_kwargs) -> ConfigResponse:
    providers = {
        "anthropic": ProviderConfig(model="claude-sonnet-4-6", hasKey=True),
        "openai": ProviderConfig(model="gpt-4o", hasKey=True),
        "gemini": ProviderConfig(model="gemini-1.5-pro", hasKey=True),
        "ollama": ProviderConfig(model="llama3", hasKey=True, baseUrl="http://localhost:11434"),
        "deepseek": ProviderConfig(model="deepseek-chat", hasKey=True),
    }
    providers.update(provider_kwargs)
    return ConfigResponse(activeProvider=active, contextMode="none", providers=providers)


def _key_fn(key="test-key"):
    return lambda provider: key


def test_factory_returns_anthropic():
    config = _config("anthropic")
    provider = ProviderFactory.create(config, _key_fn())
    assert isinstance(provider, AnthropicProvider)


def test_factory_returns_openai():
    config = _config("openai")
    provider = ProviderFactory.create(config, _key_fn())
    assert isinstance(provider, OpenAIProvider)


def test_factory_returns_gemini():
    config = _config("gemini")
    provider = ProviderFactory.create(config, _key_fn())
    assert isinstance(provider, GeminiProvider)


def test_factory_returns_ollama():
    config = _config("ollama")
    provider = ProviderFactory.create(config, _key_fn())
    assert isinstance(provider, OllamaProvider)


def test_factory_returns_deepseek():
    config = _config("deepseek")
    provider = ProviderFactory.create(config, _key_fn())
    assert isinstance(provider, DeepSeekProvider)


def test_factory_raises_no_provider():
    config = _config("")
    with pytest.raises(ValueError, match="No AI provider configured"):
        ProviderFactory.create(config, _key_fn())


def test_factory_raises_unknown_provider():
    config = _config("unknown-ai")
    config.providers["unknown-ai"] = ProviderConfig(model="x", hasKey=True)
    with pytest.raises(ValueError):
        ProviderFactory.create(config, _key_fn())


def test_factory_raises_missing_key_anthropic():
    config = _config("anthropic")
    with pytest.raises(ValueError, match="API key not configured for provider anthropic"):
        ProviderFactory.create(config, lambda p: "")


def test_factory_raises_missing_key_openai():
    config = _config("openai")
    with pytest.raises(ValueError, match="API key not configured for provider openai"):
        ProviderFactory.create(config, lambda p: "")


def test_factory_raises_missing_key_gemini():
    config = _config("gemini")
    with pytest.raises(ValueError, match="API key not configured for provider gemini"):
        ProviderFactory.create(config, lambda p: "")


def test_factory_raises_missing_key_deepseek():
    config = _config("deepseek")
    with pytest.raises(ValueError, match="API key not configured for provider deepseek"):
        ProviderFactory.create(config, lambda p: "")


def test_factory_ollama_uses_configured_base_url():
    config = _config("ollama", ollama=ProviderConfig(model="llama3", hasKey=True, baseUrl="http://custom:11434"))
    # replace providers entry
    config.providers["ollama"] = ProviderConfig(model="llama3", hasKey=True, baseUrl="http://custom:11434")
    provider = ProviderFactory.create(config, _key_fn())
    assert isinstance(provider, OllamaProvider)
    assert provider._base_url == "http://custom:11434"

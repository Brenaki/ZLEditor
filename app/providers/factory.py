from app.models.config import ConfigResponse
from app.providers.anthropic import AnthropicProvider
from app.providers.base import AIProvider
from app.providers.deepseek import DeepSeekProvider
from app.providers.gemini import GeminiProvider
from app.providers.ollama import OllamaProvider
from app.providers.openai import OpenAIProvider


class ProviderFactory:
    @staticmethod
    def create(config: ConfigResponse, get_key_fn) -> AIProvider:
        name = config.activeProvider
        if not name:
            raise ValueError("No AI provider configured")

        provider_cfg = config.providers.get(name)
        if not provider_cfg:
            raise ValueError(f"Unknown provider: {name}")

        if name == "anthropic":
            key = get_key_fn("anthropic")
            if not key:
                raise ValueError("API key not configured for provider anthropic")
            return AnthropicProvider(api_key=key)

        elif name == "openai":
            key = get_key_fn("openai")
            if not key:
                raise ValueError("API key not configured for provider openai")
            return OpenAIProvider(api_key=key)

        elif name == "gemini":
            key = get_key_fn("gemini")
            if not key:
                raise ValueError("API key not configured for provider gemini")
            return GeminiProvider(api_key=key)

        elif name == "ollama":
            base_url = provider_cfg.baseUrl or "http://localhost:11434"
            return OllamaProvider(base_url=base_url)

        elif name == "deepseek":
            key = get_key_fn("deepseek")
            if not key:
                raise ValueError("API key not configured for provider deepseek")
            return DeepSeekProvider(api_key=key)

        else:
            raise ValueError(f"Unknown provider: {name}")

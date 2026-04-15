import json
import os
import stat
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from fastapi import HTTPException

from app.models.config import AppConfig, ConfigResponse, ProviderConfig, SecretsConfig

_BASE_DIR = Path(__file__).parent.parent.parent

KNOWN_PROVIDERS = ["anthropic", "openai", "gemini", "ollama", "deepseek"]

DEFAULT_MODELS = {
    "anthropic": "claude-sonnet-4-6",
    "openai": "gpt-4o",
    "gemini": "gemini-1.5-pro",
    "ollama": "llama3",
    "deepseek": "deepseek-chat",
}


class ConfigService:
    def __init__(self, base_dir: Path = _BASE_DIR):
        self._config_path = base_dir / "config.json"
        self._secrets_path = base_dir / "config.secrets.json"

    def get_config(self) -> AppConfig:
        if not self._config_path.exists():
            return AppConfig()
        try:
            data = json.loads(self._config_path.read_text())
            return AppConfig(**data)
        except Exception:
            return AppConfig()

    def save_config(self, config: AppConfig) -> None:
        self._config_path.write_text(json.dumps(config.model_dump(), indent=2))

    def _get_secrets(self) -> SecretsConfig:
        if not self._secrets_path.exists():
            return SecretsConfig()
        try:
            data = json.loads(self._secrets_path.read_text())
            return SecretsConfig(**data)
        except Exception:
            return SecretsConfig()

    def save_key(self, provider: str, key: str) -> None:
        secrets = self._get_secrets()
        secrets.keys[provider] = key
        self._secrets_path.write_text(json.dumps(secrets.model_dump(), indent=2))
        self._secrets_path.chmod(0o600)

    def get_key(self, provider: str) -> str:
        secrets = self._get_secrets()
        return secrets.keys.get(provider, "")

    def get_config_response(self) -> ConfigResponse:
        config = self.get_config()
        secrets = self._get_secrets()

        providers: dict[str, ProviderConfig] = {}
        for name in KNOWN_PROVIDERS:
            provider_data = config.providers.get(name, {})
            model = provider_data.get("model", DEFAULT_MODELS.get(name, ""))
            if name == "ollama":
                base_url = provider_data.get("baseUrl", "")
                has_key = bool(base_url)
                providers[name] = ProviderConfig(model=model, hasKey=has_key, baseUrl=base_url or None)
            else:
                has_key = bool(secrets.keys.get(name, ""))
                providers[name] = ProviderConfig(model=model, hasKey=has_key)

        return ConfigResponse(
            activeProvider=config.activeProvider,
            contextMode=config.contextMode,
            providers=providers,
        )

    @staticmethod
    def _validate_base_url(url: str) -> bool:
        """Validate Ollama baseUrl to prevent SSRF via arbitrary URL schemes."""
        try:
            parsed = urlparse(url)
            return parsed.scheme in ('http', 'https') and bool(parsed.netloc)
        except Exception:
            return False

    def apply_update(self, update: dict[str, Any]) -> ConfigResponse:
        config = self.get_config()

        if "activeProvider" in update:
            # Validate activeProvider against known list
            active = update["activeProvider"]
            if active and active not in KNOWN_PROVIDERS:
                raise HTTPException(status_code=400, detail=f"Unknown provider: {active}")
            config.activeProvider = active

        if "contextMode" in update:
            config.contextMode = update["contextMode"]

        provider = update.get("provider")
        if provider:
            # Validate provider name against known list
            if provider not in KNOWN_PROVIDERS:
                raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

            if provider not in config.providers:
                config.providers[provider] = {}

            if "key" in update and provider != "ollama":
                self.save_key(provider, update["key"])

            if "model" in update:
                config.providers[provider]["model"] = update["model"]

            if "baseUrl" in update and provider == "ollama":
                # Reject invalid or non-HTTP(S) base URLs
                base_url = update["baseUrl"]
                if base_url and not self._validate_base_url(base_url):
                    raise HTTPException(status_code=400, detail="Invalid baseUrl: must be http or https")
                config.providers[provider]["baseUrl"] = base_url

        self.save_config(config)
        return self.get_config_response()

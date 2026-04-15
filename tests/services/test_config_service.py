import json
import pytest
from pathlib import Path

from app.services.config_service import ConfigService
from app.models.config import AppConfig


@pytest.fixture
def config_service(tmp_path):
    return ConfigService(base_dir=tmp_path)


def test_get_config_missing_file(config_service):
    config = config_service.get_config()
    assert config.activeProvider == ""
    assert config.contextMode == "none"


def test_save_and_read_config(config_service, tmp_path):
    config = AppConfig(activeProvider="openai", contextMode="project")
    config_service.save_config(config)
    loaded = config_service.get_config()
    assert loaded.activeProvider == "openai"
    assert loaded.contextMode == "project"


def test_save_key_writes_to_secrets(config_service, tmp_path):
    config_service.save_key("anthropic", "sk-test-key")
    secrets_path = tmp_path / "config.secrets.json"
    assert secrets_path.exists()
    data = json.loads(secrets_path.read_text())
    assert data["keys"]["anthropic"] == "sk-test-key"


def test_save_key_sets_permissions(config_service, tmp_path):
    config_service.save_key("openai", "sk-openai-key")
    secrets_path = tmp_path / "config.secrets.json"
    mode = secrets_path.stat().st_mode & 0o777
    assert mode == 0o600


def test_get_key_missing(config_service):
    assert config_service.get_key("anthropic") == ""


def test_get_key_present(config_service):
    config_service.save_key("gemini", "gemini-key")
    assert config_service.get_key("gemini") == "gemini-key"


def test_config_response_has_key_false_when_no_secrets(config_service):
    resp = config_service.get_config_response()
    for provider_name, provider in resp.providers.items():
        if provider_name != "ollama":
            assert provider.hasKey is False


def test_config_response_has_key_true_after_save(config_service):
    config_service.save_key("anthropic", "sk-ant-key")
    resp = config_service.get_config_response()
    assert resp.providers["anthropic"].hasKey is True


def test_config_response_never_returns_raw_key(config_service):
    config_service.save_key("openai", "sk-secret-key")
    resp = config_service.get_config_response()
    resp_json = resp.model_dump_json()
    assert "sk-secret-key" not in resp_json


def test_config_response_default_values(config_service):
    resp = config_service.get_config_response()
    assert resp.activeProvider == ""
    assert resp.contextMode == "none"
    assert "anthropic" in resp.providers
    assert "openai" in resp.providers


def test_apply_update_active_provider(config_service):
    resp = config_service.apply_update({"activeProvider": "gemini"})
    assert resp.activeProvider == "gemini"


def test_apply_update_context_mode(config_service):
    resp = config_service.apply_update({"contextMode": "current-file"})
    assert resp.contextMode == "current-file"


def test_apply_update_model(config_service):
    config_service.apply_update({"provider": "openai", "model": "gpt-4-turbo"})
    config = config_service.get_config()
    assert config.providers["openai"]["model"] == "gpt-4-turbo"


def test_apply_update_ollama_base_url(config_service):
    resp = config_service.apply_update({"provider": "ollama", "baseUrl": "http://localhost:11434"})
    assert resp.providers["ollama"].hasKey is True
    assert resp.providers["ollama"].baseUrl == "http://localhost:11434"


def test_ollama_no_base_url_has_key_false(config_service):
    resp = config_service.get_config_response()
    assert resp.providers["ollama"].hasKey is False


def test_corrupt_config_returns_defaults(config_service, tmp_path):
    (tmp_path / "config.json").write_text("not-json")
    config = config_service.get_config()
    assert config.activeProvider == ""


# ── SSRF via unvalidated Ollama baseUrl ──────────────────────────────────────

def test_apply_update_ollama_invalid_base_url_rejected(config_service):
    """Non-HTTP(S) or malformed baseUrl must be rejected with 400."""
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        config_service.apply_update({"provider": "ollama", "baseUrl": "file:///etc/passwd"})
    assert exc_info.value.status_code == 400


def test_apply_update_ollama_javascript_url_rejected(config_service):
    """javascript: scheme must be rejected."""
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        config_service.apply_update({"provider": "ollama", "baseUrl": "javascript:alert(1)"})
    assert exc_info.value.status_code == 400


def test_apply_update_ollama_valid_https_url_accepted(config_service):
    """A valid https:// baseUrl must be accepted."""
    resp = config_service.apply_update({"provider": "ollama", "baseUrl": "https://ollama.example.com"})
    assert resp.providers["ollama"].baseUrl == "https://ollama.example.com"


def test_apply_update_ollama_valid_http_url_accepted(config_service):
    """A valid http:// localhost URL must be accepted."""
    resp = config_service.apply_update({"provider": "ollama", "baseUrl": "http://localhost:11434"})
    assert resp.providers["ollama"].hasKey is True


# ── Unvalidated provider name ────────────────────────────────────────────────

def test_apply_update_unknown_provider_rejected(config_service):
    """An unknown provider name must be rejected with 400."""
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        config_service.apply_update({"provider": "evil_provider"})
    assert exc_info.value.status_code == 400


def test_apply_update_unknown_active_provider_rejected(config_service):
    """An unknown activeProvider must be rejected with 400."""
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        config_service.apply_update({"activeProvider": "evil_provider"})
    assert exc_info.value.status_code == 400


def test_apply_update_known_active_provider_accepted(config_service):
    """A known activeProvider must be accepted."""
    resp = config_service.apply_update({"activeProvider": "anthropic"})
    assert resp.activeProvider == "anthropic"

from typing import Any, Literal, Optional
from pydantic import BaseModel


class ProviderConfig(BaseModel):
    model: str = ""
    hasKey: bool = False
    baseUrl: Optional[str] = None


class AppConfig(BaseModel):
    activeProvider: str = ""
    contextMode: Literal["none", "current-file", "project"] = "none"
    providers: dict[str, dict[str, Any]] = {}


class SecretsConfig(BaseModel):
    keys: dict[str, str] = {}


class ConfigResponse(BaseModel):
    activeProvider: str
    contextMode: str
    providers: dict[str, ProviderConfig]

from functools import lru_cache

from app.services.compile_service import CompileService
from app.services.config_service import ConfigService
from app.services.memory_service import MemoryService
from app.services.chat_service import ChatService


# Singletons — one per application lifetime
_compile_service = CompileService()
_config_service = ConfigService()
_memory_service = MemoryService()
_chat_service = ChatService(_config_service, _memory_service)


def get_compile_service() -> CompileService:
    return _compile_service


def get_config_service() -> ConfigService:
    return _config_service


def get_memory_service() -> MemoryService:
    return _memory_service


def get_chat_service() -> ChatService:
    return _chat_service

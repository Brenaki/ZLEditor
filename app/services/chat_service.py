import json
from typing import AsyncIterator

from app.models.chat import ChatRequest
from app.models.config import ConfigResponse, ProviderConfig
from app.providers.factory import ProviderFactory
from app.services.config_service import ConfigService, DEFAULT_MODELS
from app.services.memory_service import MemoryService


_SYSTEM_CHAT = (
    "You are an expert LaTeX academic writing assistant. "
    "Help the user write, edit, and improve their research paper."
)

_SYSTEM_EXPLAIN = (
    "You are a LaTeX compilation error explainer. "
    "The user has encountered a compilation error. "
    "Explain the error in plain language and suggest a specific fix."
)


class ChatService:
    def __init__(self, config_service: ConfigService, memory_service: MemoryService):
        self._config_service = config_service
        self._memory_service = memory_service

    async def chat_stream(self, request: ChatRequest) -> AsyncIterator[str]:
        config_response = self._config_service.get_config_response()

        active = config_response.activeProvider
        if not active:
            yield json.dumps({"error": "No AI provider configured", "done": True})
            return

        provider_cfg = config_response.providers.get(active)
        if not provider_cfg or not provider_cfg.hasKey:
            yield json.dumps({"error": f"API key not configured for provider {active}", "done": True})
            return

        try:
            provider = ProviderFactory.create(config_response, self._config_service.get_key)
        except ValueError as e:
            yield json.dumps({"error": str(e), "done": True})
            return

        model = provider_cfg.model or DEFAULT_MODELS.get(active, "")

        # Build system prompt
        system_parts = []

        # Memory context
        wake_up_summary = await self._memory_service.wake_up(request.projectId)
        if wake_up_summary:
            system_parts.append(f"## Memory\n{wake_up_summary}")

        user_query = request.messages[-1].get("content", "") if request.messages else ""
        memory_search = await self._memory_service.search(request.projectId, user_query)
        if memory_search:
            system_parts.append(f"## Relevant past context\n{memory_search}")

        # Mode-specific system prompt
        if request.mode == "explain-error":
            system_parts.append(_SYSTEM_EXPLAIN)
            if request.compilationLog:
                system_parts.append(f"## Compilation log\n```\n{request.compilationLog}\n```")
        else:
            system_parts.append(_SYSTEM_CHAT)

        # Document context
        config = self._config_service.get_config()
        context_mode = config.contextMode

        if context_mode == "current-file" and request.currentFile:
            system_parts.append(
                f"## Current file: {request.currentFile.name}\n```latex\n{request.currentFile.content}\n```"
            )
        elif context_mode == "project" and request.files:
            file_sections = []
            for f in request.files:
                file_sections.append(f"=== {f.name} ===\n{f.content}")
            system_parts.append("## Project files\n" + "\n\n".join(file_sections))

        system_content = "\n\n".join(system_parts)

        messages = [{"role": "system", "content": system_content}] + request.messages

        full_response = ""
        try:
            async for delta in provider.stream(messages, model):
                full_response += delta
                yield json.dumps({"delta": delta, "done": False})

            yield json.dumps({"delta": "", "done": True})

            # Index exchange into MemPalace after stream completes
            if user_query and full_response:
                await self._memory_service.mine(
                    request.projectId,
                    {"user": user_query, "assistant": full_response},
                )

        except Exception as e:
            yield json.dumps({"error": str(e), "done": True})

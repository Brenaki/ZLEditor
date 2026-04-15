from typing import AsyncIterator, Protocol, runtime_checkable


@runtime_checkable
class AIProvider(Protocol):
    async def stream(self, messages: list[dict], model: str) -> AsyncIterator[str]:
        ...

from typing import AsyncIterator

import litellm


class OllamaProvider:
    def __init__(self, base_url: str):
        self._base_url = base_url

    async def stream(self, messages: list[dict], model: str) -> AsyncIterator[str]:
        response = await litellm.acompletion(
            model=f"ollama/{model}",
            messages=messages,
            stream=True,
            api_base=self._base_url,
        )
        async for chunk in response:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                yield delta

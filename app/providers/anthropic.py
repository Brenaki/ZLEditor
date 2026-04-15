from typing import AsyncIterator

import litellm


class AnthropicProvider:
    def __init__(self, api_key: str):
        self._api_key = api_key

    async def stream(self, messages: list[dict], model: str) -> AsyncIterator[str]:
        response = await litellm.acompletion(
            model=f"anthropic/{model}",
            messages=messages,
            stream=True,
            api_key=self._api_key,
        )
        async for chunk in response:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                yield delta

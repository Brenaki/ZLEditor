import asyncio
import re
from pathlib import Path


_PALACE_BASE = Path(".mempalace")
_SAFE_PROJECT_ID_RE = re.compile(r'^[a-zA-Z0-9_\-]{1,64}$')


class MemoryService:
    def __init__(self, palace_base: Path = _PALACE_BASE):
        self._palace_base = palace_base

    def _palace_path(self, project_id: str) -> str:
        # VULN-008: Sanitize projectId to prevent path traversal
        if not _SAFE_PROJECT_ID_RE.match(project_id):
            project_id = "default"
        return str(self._palace_base / project_id)

    async def wake_up(self, project_id: str) -> str:
        palace_path = self._palace_path(project_id)
        try:
            from mempalace import wake_up as mp_wake_up
            result = await asyncio.get_event_loop().run_in_executor(
                None, mp_wake_up, palace_path
            )
            return result or ""
        except Exception:
            return ""

    async def mine(self, project_id: str, exchange: dict) -> None:
        palace_path = self._palace_path(project_id)
        try:
            from mempalace import mine as mp_mine
            await asyncio.get_event_loop().run_in_executor(
                None, mp_mine, exchange, palace_path
            )
        except Exception:
            pass

    async def search(self, project_id: str, query: str) -> str:
        palace_path = self._palace_path(project_id)
        try:
            from mempalace import search_memories as mp_search
            results = await asyncio.get_event_loop().run_in_executor(
                None, mp_search, query, palace_path
            )
            if not results:
                return ""
            return "\n".join(str(r) for r in results)
        except Exception:
            return ""

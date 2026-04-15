import pytest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.memory_service import MemoryService


@pytest.fixture
def memory_service(tmp_path):
    return MemoryService(palace_base=tmp_path / "mempalace")


@pytest.mark.asyncio
async def test_wake_up_with_data(memory_service):
    with patch("app.services.memory_service.asyncio.get_event_loop") as mock_loop:
        mock_executor = AsyncMock(return_value="Summary of past sessions")
        mock_loop.return_value.run_in_executor = mock_executor

        with patch.dict("sys.modules", {"mempalace": MagicMock(wake_up=MagicMock(return_value="Summary of past sessions"))}):
            result = await memory_service.wake_up("my-project")

    assert isinstance(result, str)


@pytest.mark.asyncio
async def test_wake_up_empty_palace(memory_service):
    with patch("app.services.memory_service.asyncio.get_event_loop") as mock_loop:
        mock_loop.return_value.run_in_executor = AsyncMock(return_value=None)

        with patch.dict("sys.modules", {"mempalace": MagicMock(wake_up=MagicMock(return_value=None))}):
            result = await memory_service.wake_up("empty-project")

    assert result == ""


@pytest.mark.asyncio
async def test_wake_up_handles_exception(memory_service):
    with patch("app.services.memory_service.asyncio.get_event_loop") as mock_loop:
        mock_loop.return_value.run_in_executor = AsyncMock(side_effect=Exception("palace error"))

        with patch.dict("sys.modules", {"mempalace": MagicMock(wake_up=MagicMock())}):
            result = await memory_service.wake_up("broken-project")

    assert result == ""


@pytest.mark.asyncio
async def test_mine_calls_mempalace(memory_service):
    exchange = {"user": "Hello", "assistant": "Hi there"}

    with patch("app.services.memory_service.asyncio.get_event_loop") as mock_loop:
        mock_loop.return_value.run_in_executor = AsyncMock(return_value=None)

        with patch.dict("sys.modules", {"mempalace": MagicMock(mine=MagicMock())}):
            # Should not raise
            await memory_service.mine("my-project", exchange)


@pytest.mark.asyncio
async def test_mine_handles_exception(memory_service):
    with patch("app.services.memory_service.asyncio.get_event_loop") as mock_loop:
        mock_loop.return_value.run_in_executor = AsyncMock(side_effect=Exception("mine error"))

        with patch.dict("sys.modules", {"mempalace": MagicMock(mine=MagicMock())}):
            # Should not raise
            await memory_service.mine("project", {"user": "x", "assistant": "y"})


@pytest.mark.asyncio
async def test_search_returns_results(memory_service):
    with patch("app.services.memory_service.asyncio.get_event_loop") as mock_loop:
        mock_loop.return_value.run_in_executor = AsyncMock(return_value=["memory 1", "memory 2"])

        with patch.dict("sys.modules", {"mempalace": MagicMock(search_memories=MagicMock())}):
            result = await memory_service.search("my-project", "LaTeX syntax")

    assert isinstance(result, str)


@pytest.mark.asyncio
async def test_search_empty_results(memory_service):
    with patch("app.services.memory_service.asyncio.get_event_loop") as mock_loop:
        mock_loop.return_value.run_in_executor = AsyncMock(return_value=[])

        with patch.dict("sys.modules", {"mempalace": MagicMock(search_memories=MagicMock())}):
            result = await memory_service.search("my-project", "query")

    assert result == ""


@pytest.mark.asyncio
async def test_search_handles_exception(memory_service):
    with patch("app.services.memory_service.asyncio.get_event_loop") as mock_loop:
        mock_loop.return_value.run_in_executor = AsyncMock(side_effect=Exception("search error"))

        with patch.dict("sys.modules", {"mempalace": MagicMock(search_memories=MagicMock())}):
            result = await memory_service.search("project", "query")

    assert result == ""


# ── VULN-008: Path traversal via projectId ────────────────────────────────────

def test_palace_path_rejects_traversal(memory_service):
    """VULN-008: projectId with path traversal chars must map to 'default'."""
    path = memory_service._palace_path("../../etc/passwd")
    assert "etc" not in path
    assert path.endswith("default")


def test_palace_path_rejects_slash(memory_service):
    """VULN-008: projectId with '/' must map to 'default'."""
    path = memory_service._palace_path("foo/bar")
    assert path.endswith("default")


def test_palace_path_accepts_valid_id(memory_service):
    """VULN-008: A valid alphanumeric projectId must be used as-is."""
    path = memory_service._palace_path("my-project_01")
    assert path.endswith("my-project_01")


def test_palace_path_rejects_too_long(memory_service):
    """VULN-008: projectId longer than 64 chars must map to 'default'."""
    long_id = "a" * 65
    path = memory_service._palace_path(long_id)
    assert path.endswith("default")

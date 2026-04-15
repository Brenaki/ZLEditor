from typing import Any, Literal, Optional
from pydantic import BaseModel


class FileContext(BaseModel):
    name: str
    content: str


class ChatRequest(BaseModel):
    messages: list[dict[str, Any]]
    projectId: str = "default"
    currentFile: Optional[FileContext] = None
    files: list[FileContext] = []
    mode: Literal["chat", "explain-error"] = "chat"
    compilationLog: Optional[str] = None


class ChatChunk(BaseModel):
    delta: str = ""
    done: bool = False
    error: Optional[str] = None

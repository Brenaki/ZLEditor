from typing import Any, Optional
from pydantic import BaseModel, field_validator

_MAX_FILES = 50
_MAX_CONTENT_BYTES = 10 * 1024 * 1024  # 10 MB total


class FileEntry(BaseModel):
    name: str
    content: Optional[str] = None
    binary: bool = False
    base64: Optional[str] = None


class CompileRequest(BaseModel):
    engine: str = "pdflatex"
    files: list[FileEntry] = []
    rootFile: str = "main.tex"

    # Limit file count and total content size to prevent resource exhaustion
    @field_validator('files')
    @classmethod
    def limit_files(cls, v):
        if len(v) > _MAX_FILES:
            raise ValueError(f'Too many files (max {_MAX_FILES})')
        total = sum(len(f.content or '') + len(f.base64 or '') for f in v)
        if total > _MAX_CONTENT_BYTES:
            raise ValueError('Total file content exceeds size limit')
        return v


class CompileResult(BaseModel):
    success: bool
    log: str = ""
    pdf: Optional[bytes] = None

import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.routers import compile, proxy, ai

APP_DIR = Path(__file__).parent.parent

app = FastAPI(title="ZLEditor")

# VULN-012: Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; object-src blob:; frame-src blob:;"
    )
    return response

# Register API routers
app.include_router(compile.router)
app.include_router(proxy.router)
app.include_router(ai.router)

# Mount static files (everything except API routes)
# We use a custom catch-all to serve index.html for the SPA
app.mount("/styles", StaticFiles(directory=str(APP_DIR / "styles")), name="styles")
app.mount("/scripts", StaticFiles(directory=str(APP_DIR / "scripts")), name="scripts")

# VULN-005: Files that must never be served directly via the SPA fallback route
BLOCKED_PATHS = {
    "config.json",
    "config.secrets.json",
    "entities.json",
    "pyproject.toml",
    "requirements.txt",
    "requirements-dev.txt",
    "uv.lock",
    "package-lock.json",
}


@app.get("/")
async def root():
    return FileResponse(str(APP_DIR / "index.html"))


@app.get("/{path:path}")
async def spa_fallback(path: str):
    # VULN-005: Block sensitive files and path traversal attempts
    clean = path.lstrip('/')
    if (
        clean in BLOCKED_PATHS
        or clean.startswith('.')
        or '..' in clean
        or clean.startswith('app/')
    ):
        return FileResponse(str(APP_DIR / "index.html"))

    # Serve static file if it exists, otherwise serve index.html
    static_path = APP_DIR / clean
    if static_path.exists() and static_path.is_file():
        return FileResponse(str(static_path))
    return FileResponse(str(APP_DIR / "index.html"))

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, Response

router = APIRouter()

BBT_URL = "http://localhost:23119/better-bibtex/json-rpc"

# Allowlist of permitted Better BibTeX JSON-RPC methods
ALLOWED_METHODS = {"item.search", "item.export", "item.attachments"}


@router.post("/bbt-proxy")
async def bbt_proxy(request: Request):
    # Parse and validate the JSON-RPC method before proxying
    try:
        body_json = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    method = body_json.get("method")
    if method not in ALLOWED_METHODS:
        raise HTTPException(status_code=403, detail="Method not allowed")

    import json
    body = json.dumps(body_json).encode()

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                BBT_URL,
                content=body,
                headers={"Content-Type": "application/json"},
            )
        return Response(content=resp.content, media_type="application/json", status_code=resp.status_code)
    except Exception as e:
        return JSONResponse(status_code=502, content={"error": str(e)})

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.dependencies import get_chat_service, get_config_service
from app.models.chat import ChatRequest
from app.services.chat_service import ChatService
from app.services.config_service import ConfigService

router = APIRouter(prefix="/ai")


@router.post("/chat")
async def ai_chat(request: ChatRequest, service: ChatService = Depends(get_chat_service)):
    config_svc = service._config_service
    config = config_svc.get_config_response()

    if not config.activeProvider:
        raise HTTPException(status_code=400, detail="No AI provider configured")

    provider_cfg = config.providers.get(config.activeProvider)
    if not provider_cfg or not provider_cfg.hasKey:
        raise HTTPException(
            status_code=400,
            detail=f"API key not configured for provider {config.activeProvider}",
        )

    async def event_stream():
        async for chunk in service.chat_stream(request):
            yield f"data: {chunk}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/config")
async def get_config(service: ConfigService = Depends(get_config_service)):
    return service.get_config_response()


@router.put("/config")
async def update_config(update: dict, service: ConfigService = Depends(get_config_service)):
    # Validate contextMode if present
    if "contextMode" in update:
        valid = {"none", "current-file", "project"}
        if update["contextMode"] not in valid:
            raise HTTPException(status_code=422, detail=f"Invalid contextMode: {update['contextMode']}")

    return service.apply_update(update)

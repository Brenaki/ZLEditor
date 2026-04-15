from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse, Response

from app.dependencies import get_compile_service
from app.models.compile import CompileRequest
from app.services.compile_service import CompileService

router = APIRouter()


@router.post("/compile")
async def compile_latex(request: CompileRequest, service: CompileService = Depends(get_compile_service)):
    result = service.compile(request)
    if result.success and result.pdf:
        return Response(content=result.pdf, media_type="application/pdf")
    return JSONResponse(status_code=422, content={"error": True, "log": result.log})


@router.get("/compile/log")
async def get_compile_log(service: CompileService = Depends(get_compile_service)):
    return {"log": service.get_log()}

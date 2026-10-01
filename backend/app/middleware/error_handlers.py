from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

async def integrity_error_handler(_: Request, __: IntegrityError):
    return JSONResponse(status_code=409, content={"detail": "A record with those values already exists"})

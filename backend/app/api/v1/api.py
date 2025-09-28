from fastapi import APIRouter

from app.api.v1.endpoints import spaces, users, pledges, auth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(spaces.router, prefix="/spaces", tags=["spaces"])
api_router.include_router(pledges.router, prefix="/pledges", tags=["pledges"])

@api_router.get("/ping")
async def ping():
    return {"message": "pong"}
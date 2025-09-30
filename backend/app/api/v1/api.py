from fastapi import APIRouter

from app.api.v1.endpoints import spaces, users, pledges, auth, payouts, stripe_webhooks, payments, notifications

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(spaces.router, prefix="/spaces", tags=["spaces"])
api_router.include_router(pledges.router, prefix="/pledges", tags=["pledges"])
api_router.include_router(payouts.router, prefix="/payouts", tags=["payouts"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(stripe_webhooks.router, prefix="/webhooks", tags=["webhooks"])

@api_router.get("/ping")
async def ping():
    return {"message": "pong"}
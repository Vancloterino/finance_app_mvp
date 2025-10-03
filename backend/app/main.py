from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.security_headers import SecurityHeadersMiddleware

# Validate production configuration on startup
settings.validate_production_config()

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Shared Finance App API",
    description="API for managing shared financial responsibilities",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Shared Finance App API", "version": "0.1.0"}

@app.get("/health")
async def health_check():
    """Basic health check - returns 200 if service is up"""
    return {"status": "healthy"}

@app.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check - checks all critical dependencies"""
    from sqlalchemy import text
    from app.core.database import SessionLocal
    import stripe

    health_status = {
        "status": "healthy",
        "checks": {
            "database": {"status": "unknown"},
            "redis": {"status": "unknown"},
            "stripe": {"status": "unknown"}
        }
    }

    # Check database connectivity
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        health_status["checks"]["database"] = {"status": "healthy"}
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }

    # Check Redis connectivity (if configured)
    try:
        import redis
        redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            decode_responses=True
        )
        redis_client.ping()
        health_status["checks"]["redis"] = {"status": "healthy"}
    except Exception as e:
        # Redis is optional for MVP, so don't fail overall health
        health_status["checks"]["redis"] = {
            "status": "unavailable",
            "error": str(e)
        }

    # Check Stripe connectivity
    try:
        stripe.api_key = settings.STRIPE_SECRET_KEY
        # Simple API call to verify credentials
        stripe.Account.retrieve()
        health_status["checks"]["stripe"] = {"status": "healthy"}
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["checks"]["stripe"] = {
            "status": "unhealthy",
            "error": str(e)
        }

    # Return appropriate status code
    if health_status["status"] == "unhealthy":
        from fastapi import status as http_status
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
            content=health_status
        )

    return health_status
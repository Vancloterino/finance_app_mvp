from typing import List
from pydantic import validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Database
    DATABASE_URL: str = "postgresql://finance_user:finance_pass@127.0.0.1:5432/finance_app"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    # Stripe
    STRIPE_SECRET_KEY: str = "sk_test_dev_key"
    STRIPE_WEBHOOK_SECRET: str = "whsec_dev_secret"
    STRIPE_PUBLISHABLE_KEY: str = "pk_test_dev_key"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:5173"]
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "testserver"]

    # Environment
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Email Configuration
    EMAIL_HOST: str = "smtp.gmail.com"
    EMAIL_PORT: int = 587
    EMAIL_USE_TLS: bool = True
    EMAIL_USERNAME: str = ""
    EMAIL_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@financeapp.com"
    EMAIL_FROM_NAME: str = "Finance App"

    # External Services
    POSTMARK_API_TOKEN: str = ""
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""

    # Observability
    SENTRY_DSN: str = ""

    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: str) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    def validate_production_config(self):
        """Validate critical configuration for production environment"""
        errors = []

        if self.ENVIRONMENT == "production":
            # Check SECRET_KEY is not default
            if self.SECRET_KEY == "dev-secret-key-change-in-production":
                errors.append("SECRET_KEY must be changed from default value in production")

            # Check Stripe keys are not test keys
            if self.STRIPE_SECRET_KEY.startswith("sk_test"):
                errors.append("STRIPE_SECRET_KEY must be a live key in production (not sk_test_)")

            if self.STRIPE_PUBLISHABLE_KEY.startswith("pk_test"):
                errors.append("STRIPE_PUBLISHABLE_KEY must be a live key in production (not pk_test_)")

            # Check database is not using default credentials
            if "finance_user:finance_pass" in self.DATABASE_URL:
                errors.append("DATABASE_URL must not use default credentials in production")

            # Check CORS origins are properly configured
            if "localhost" in str(self.CORS_ORIGINS):
                errors.append("CORS_ORIGINS should not include localhost in production")

        if errors:
            error_msg = "Production configuration validation failed:\n" + "\n".join(f"  - {err}" for err in errors)
            raise ValueError(error_msg)

    class Config:
        env_file = ".env"


settings = Settings()